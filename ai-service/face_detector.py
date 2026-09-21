import os
import cv2
import numpy as np

# Check if YOLO is available
try:
    from ultralytics import YOLO
    _YOLO_AVAILABLE = True
except ImportError:
    _YOLO_AVAILABLE = False
    print("[WARNING] ultralytics not available. YOLO face detection disabled.")


class FaceDetector:
    def __init__(self):
        self.model_path = os.path.join("models", "yolov8n-face.pt")
        self.yolo_model = None
        self.dnn_net = None

        # --- Load YOLO model ---
        if _YOLO_AVAILABLE and os.path.exists(self.model_path):
            try:
                self.yolo_model = YOLO(self.model_path)
                print(f"[INFO] YOLOv8 Face detector loaded from {self.model_path}")
            except Exception as e:
                print(f"[ERROR] Failed to load YOLOv8 face detector: {e}. Switching to DNN fallback.")
        else:
            if not os.path.exists(self.model_path):
                print(f"[WARNING] {self.model_path} not found. Will use OpenCV DNN fallback.")

        # --- Prepare OpenCV DNN fallback (works with OpenCV 5.x) ---
        # Uses the built-in deep learning face detector from cv2.dnn
        self._init_dnn_fallback()

    def _init_dnn_fallback(self):
        """
        Initialize OpenCV DNN-based face detector as fallback.
        Uses the ResNet-SSD face detector shipped with OpenCV's samples.
        Falls back to a basic DNN model if available, or skips gracefully.
        """
        # Try to find the DNN face detector model bundled with OpenCV
        dnn_prototxt = None
        dnn_model = None

        # Check common locations for the Caffe face detector model
        cv2_data_path = getattr(cv2, "data", None)
        if cv2_data_path:
            haarcascades_path = cv2_data_path.haarcascades
            base = os.path.dirname(haarcascades_path)
            proto_candidate = os.path.join(base, "deploy.prototxt")
            model_candidate = os.path.join(base, "res10_300x300_ssd_iter_140000.caffemodel")
            if os.path.exists(proto_candidate) and os.path.exists(model_candidate):
                dnn_prototxt = proto_candidate
                dnn_model = model_candidate

        # Also check local models folder
        local_proto = os.path.join("models", "deploy.prototxt")
        local_model = os.path.join("models", "res10_300x300_ssd_iter_140000.caffemodel")
        if os.path.exists(local_proto) and os.path.exists(local_model):
            dnn_prototxt = local_proto
            dnn_model = local_model

        if dnn_prototxt and dnn_model:
            try:
                self.dnn_net = cv2.dnn.readNetFromCaffe(dnn_prototxt, dnn_model)
                print("[INFO] OpenCV DNN face detector fallback initialized.")
            except Exception as e:
                print(f"[ERROR] Failed to load DNN face detector: {e}")
        else:
            print("[WARNING] No DNN fallback model found. "
                  "Run download_models.py to fetch required models.")

    def detect(self, frame, conf_threshold=0.4):
        """
        Detects faces in a frame.
        Returns a list of boxes: [[x1, y1, x2, y2, confidence], ...]
        """
        boxes = []

        # --- Try YOLOv8 Face ---
        if self.yolo_model is not None:
            try:
                results = self.yolo_model(frame, verbose=False)
                for result in results:
                    for box in result.boxes:
                        conf = float(box.conf[0])
                        if conf >= conf_threshold:
                            xyxy = box.xyxy[0].cpu().numpy()
                            x1, y1, x2, y2 = map(int, xyxy)
                            boxes.append([x1, y1, x2, y2, conf])
                return boxes
            except Exception as e:
                print(f"[ERROR] YOLOv8 inference error: {e}. Using DNN fallback.")

        # --- Fallback to OpenCV DNN ---
        if self.dnn_net is not None:
            try:
                h, w = frame.shape[:2]
                blob = cv2.dnn.blobFromImage(
                    cv2.resize(frame, (300, 300)), 1.0,
                    (300, 300), (104.0, 177.0, 123.0)
                )
                self.dnn_net.setInput(blob)
                detections = self.dnn_net.forward()
                for i in range(detections.shape[2]):
                    conf = float(detections[0, 0, i, 2])
                    if conf >= conf_threshold:
                        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                        x1, y1, x2, y2 = box.astype(int)
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(w, x2), min(h, y2)
                        boxes.append([x1, y1, x2, y2, conf])
            except Exception as e:
                print(f"[ERROR] DNN face detector inference error: {e}")

        return boxes
