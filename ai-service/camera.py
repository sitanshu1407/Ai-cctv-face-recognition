import cv2
import os
import time
from threading import Thread, Lock
import collections
from face_detector import FaceDetector
from face_recognition import FaceRecognizer
from utils import save_screenshot, save_video

class CameraStream:
    def __init__(self, camera_id, name, url, cam_type, db_manager):
        self.camera_id = str(camera_id)
        self.name = name
        self.url = url
        self.cam_type = cam_type
        self.db = db_manager
        
        # Detector & Recognizer instances
        self.detector = FaceDetector()
        self.recognizer = FaceRecognizer()

        # Capture instance
        self.cap = None
        self.running = False
        self.thread = None
        self.lock = Lock()
        
        # Frame states
        self.latest_raw_frame = None
        self.latest_annotated_frame = None
        
        # Video recording buffer (stores last 5 seconds of frames)
        self.buffer_fps = 10
        self.buffer_size = 5 * self.buffer_fps # 5 seconds
        self.frame_buffer = collections.deque(maxlen=self.buffer_size)
        
        # Intruder alert state
        self.unknown_detected_since = None
        self.last_alert_time = 0
        self.alert_cooldown = 30  # seconds between alerts
        
        # Log throttle
        self.last_log_time = {}
        self.log_cooldown = 10  # log detections every 10 seconds max

    def start(self):
        with self.lock:
            if self.running:
                return
            self.running = True
            
            # Resolve camera source: convert integer string (e.g. "0") to integer if webcam
            source = self.url
            if self.cam_type == "webcam" and self.url.isdigit():
                source = int(self.url)

            # For RTSP streams, force TCP transport and set connection timeout
            if self.cam_type == "rtsp":
                self.cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
                self.cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 10000)   # 10s connect timeout
                self.cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)    # 5s read timeout
                # Force RTSP over TCP (avoids UDP packet loss issues with most IP cameras)
                os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp")
            else:
                self.cap = cv2.VideoCapture(source)

            if not self.cap.isOpened():
                print(f"[ERROR] Failed to open camera source '{self.url}' — check URL, credentials, and network.")
                self.running = False
                return

            # Start thread
            self.thread = Thread(target=self._capture_loop, args=())
            self.thread.daemon = True
            self.thread.start()
            print(f"[INFO] Camera stream started: {self.name} ({self.url})")

    def stop(self):
        with self.lock:
            self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        if self.cap:
            self.cap.release()
        print(f"[INFO] Camera stream stopped: {self.name}")

    def _capture_loop(self):
        fps_interval = 1.0 / self.buffer_fps
        
        while True:
            # Check run flag
            with self.lock:
                if not self.running:
                    break

            start_time = time.time()
            ret, frame = self.cap.read()
            if not ret:
                # Set status to offline in database after repeated failures
                # For simplicity, we just print and retry after a short sleep
                time.sleep(0.5)
                continue

            # Store raw frame
            self.latest_raw_frame = frame.copy()
            
            # Process frame
            annotated_frame = self._process_frame(frame)
            
            # Store processed frame
            self.latest_annotated_frame = annotated_frame
            
            # Add to video record buffer
            self.frame_buffer.append(annotated_frame)
            
            # Sleep to match desired processing rate (10 fps)
            elapsed = time.time() - start_time
            sleep_time = fps_interval - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

    def _process_frame(self, frame):
        annotated = frame.copy()
        h, w = frame.shape[:2]
        
        # Load settings dynamically
        settings = self.db.get_system_settings()
        rec_threshold = settings["recognition_threshold"]
        intruder_timer = settings["intruder_timer"]
        
        # 1. Detect faces
        boxes = self.detector.detect(frame)
        
        # Load registered embeddings
        faces_cache = self.db.get_registered_faces()
        
        unknown_in_frame = False
        highest_unknown_conf = 0.0

        for box in boxes:
            x1, y1, x2, y2, det_conf = box
            
            # Crop face with a slight margin
            margin = 15
            fx1 = max(0, x1 - margin)
            fy1 = max(0, y1 - margin)
            fx2 = min(w, x2 + margin)
            fy2 = min(h, y2 + margin)
            
            face_crop = frame[fy1:fy2, fx1:fx2]
            if face_crop.size == 0:
                continue
                
            # Extract embedding
            embedding = self.recognizer.get_embedding(face_crop)
            
            # Compare with registered embeddings
            best_match_name = "Unknown"
            best_match_score = 0.0
            
            for reg_face in faces_cache:
                score = self.recognizer.compare(embedding, reg_face["embedding"])
                if score > best_match_score:
                    best_match_score = score
                    
            if best_match_score >= rec_threshold:
                best_match_name = reg_face["name"]
            
            # Draw bounding box and label
            color = (0, 255, 0) if best_match_name != "Unknown" else (0, 0, 255)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            
            label = f"{best_match_name} ({best_match_score:.2f})"
            cv2.putText(annotated, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # Handle Logging of recognized faces
            current_time = time.time()
            if best_match_name != "Unknown":
                # Throttle database write
                if best_match_name not in self.last_log_time or (current_time - self.last_log_time[best_match_name]) > self.log_cooldown:
                    self.db.log_detection(self.camera_id, best_match_name, best_match_score)
                    self.last_log_time[best_match_name] = current_time
            else:
                unknown_in_frame = True
                if det_conf > highest_unknown_conf:
                    highest_unknown_conf = det_conf

        # 2. Intruder logic
        if unknown_in_frame:
            if self.unknown_detected_since is None:
                self.unknown_detected_since = time.time()
            else:
                elapsed = time.time() - self.unknown_detected_since
                # If unknown person remains for configurable time
                if elapsed >= intruder_timer:
                    current_time = time.time()
                    if (current_time - self.last_alert_time) > self.alert_cooldown:
                        # Trigger alert!
                        print(f"[ALERT] Intruder detected on camera '{self.name}' for {elapsed:.1f}s!")
                        
                        # Capture screenshot and save video clip
                        screenshot_path = save_screenshot(frame, self.camera_id)
                        video_path = save_video(self.frame_buffer, self.camera_id, fps=self.buffer_fps)
                        
                        # Create alert in MongoDB
                        self.db.create_alert(self.camera_id, "Unknown", highest_unknown_conf, screenshot_path, video_path)
                        
                        # Reset timer and update cooldown
                        self.last_alert_time = current_time
                        self.unknown_detected_since = time.time()           
                        
                # Draw intruder timer indicator on top left
                elapsed = time.time() - self.unknown_detected_since
                timer_label = f"Unknown Face: {elapsed:.1f}s / {intruder_timer}s"
                cv2.putText(annotated, timer_label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        else:
            self.unknown_detected_since = None
            
        return annotated

    def get_mjpeg_frames(self):
        """
        Generator yielding JPEG encoded frames for MJPEG video stream.
        """
        while True:
            if not self.running:
                break
                
            frame = self.latest_annotated_frame
            if frame is None:
                # If stream is just starting, yield a blank frame or wait
                time.sleep(0.1)
                continue
                
            ret, jpeg = cv2.imencode(".jpg", frame)
            if not ret:
                continue
                
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + jpeg.tobytes() + b"\r\n")
            time.sleep(0.08) # Yield around ~12 FPS for stream efficiency


class CameraRegistry:
    def __init__(self, db_manager):
        self.db = db_manager
        self.streams = {}
        self.lock = Lock()

    def reload_cameras(self, db_cameras):
        """
        Synchronizes database camera configurations with running streams.
        """
        with self.lock:
            db_camera_ids = {str(cam["_id"]) for cam in db_cameras if cam.get("isActive", True)}
            
            # 1. Stop streams that are no longer active/present
            for cam_id in list(self.streams.keys()):
                if cam_id not in db_camera_ids:
                    self.streams[cam_id].stop()
                    del self.streams[cam_id]
                    
            # 2. Update status and start streams that are active but not running
            for cam in db_cameras:
                cam_id = str(cam["_id"])
                is_active = cam.get("isActive", True)
                
                if not is_active:
                    continue

                if cam_id not in self.streams:
                    # Create and start stream
                    stream = CameraStream(
                        camera_id=cam["_id"],
                        name=cam["name"],
                        url=cam["url"],
                        cam_type=cam.get("type", "webcam"),
                        db_manager=self.db
                    )
                    self.streams[cam_id] = stream
                    
                    # Update DB status to Online when trying to open
                    # Start async to not block reload API
                    stream.start()
                    
                    # If started successfully, set status to online
                    status = "online" if stream.running else "offline"
                    self.db.db.cameras.update_one({"_id": cam["_id"]}, {"$set": {"status": status}})
                else:
                    # If camera config URL/type changed, recreate stream
                    stream = self.streams[cam_id]
                    if stream.url != cam["url"] or stream.cam_type != cam.get("type", "webcam"):
                        stream.stop()
                        new_stream = CameraStream(
                            camera_id=cam["_id"],
                            name=cam["name"],
                            url=cam["url"],
                            cam_type=cam.get("type", "webcam"),
                            db_manager=self.db
                        )
                        self.streams[cam_id] = new_stream
                        new_stream.start()
                        
                        status = "online" if new_stream.running else "offline"
                        self.db.db.cameras.update_one({"_id": cam["_id"]}, {"$set": {"status": status}})
                        
    def get_stream(self, camera_id):
        with self.lock:
            return self.streams.get(str(camera_id))

    def shutdown(self):
        with self.lock:
            for stream in self.streams.values():
                stream.stop()
            self.streams.clear()
