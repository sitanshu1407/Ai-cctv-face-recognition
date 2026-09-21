import os
import requests
import cv2
import time
from threading import Thread

# Create necessary directories
def ensure_directories():
    os.makedirs("models", exist_ok=True)
    os.makedirs("../server/uploads/faces", exist_ok=True)
    os.makedirs("../server/uploads/alerts", exist_ok=True)

# Helper to download a file with progress logging
def download_file(url, destination):
    if os.path.exists(destination):
        print(f"[INFO] File already exists: {destination}")
        return True

    print(f"[INFO] Downloading {url} to {destination}...")
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(destination, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        print(f"[INFO] Download completed: {destination}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to download {url}: {e}")
        # Delete partial file if download failed
        if os.path.exists(destination):
            os.remove(destination)
        return False

# Download model weights if missing
def download_weights():
    ensure_directories()
    
    # YOLOv8-face model weights (lightweight face detector)
    yolo_url = "https://github.com/derronqi/yolov8-face/raw/main/yolov8n-face.pt"
    yolo_dest = os.path.join("models", "yolov8n-face.pt")
    
    # Lighter ArcFace model (w600k_mobi or w600k_r50) for recognition (ONNX)
    # Using w600k_r50 or mobile version
    onnx_url = "https://github.com/rapidai/RapidFace/releases/download/v1.0.0/w600k_r50.onnx"
    onnx_dest = os.path.join("models", "w600k_r50.onnx")

    # Download in parallel or sequence
    yolo_success = download_file(yolo_url, yolo_dest)
    onnx_success = download_file(onnx_url, onnx_dest)
    
    if not yolo_success or not onnx_success:
        print("[WARNING] Could not download all model weights. Please place 'yolov8n-face.pt' and 'w600k_r50.onnx' in the 'ai-service/models' folder manually.")

# Helper to save screenshot
def save_screenshot(frame, camera_id):
    filename = f"screenshot-{camera_id}-{int(time.time())}.jpg"
    filepath = os.path.join("../server/uploads/alerts", filename)
    cv2.imwrite(filepath, frame)
    # Return relative path for web serving
    return f"uploads/alerts/{filename}"

# Worker to compile frames buffer into a video file asynchronously
def _save_video_worker(frames, filepath, fps, width, height):
    try:
        # Define codec and create VideoWriter
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(filepath, fourcc, fps, (width, height))
        for frame in frames:
            out.write(frame)
        out.release()
        print(f"[INFO] Video saved successfully to {filepath}")
    except Exception as e:
        print(f"[ERROR] Failed to save video: {e}")

# Helper to save video asynchronously
def save_video(frame_buffer, camera_id, fps=15):
    if not frame_buffer:
        return None

    filename = f"video-{camera_id}-{int(time.time())}.mp4"
    filepath = os.path.join("../server/uploads/alerts", filename)
    
    # Get details from the first frame
    height, width = frame_buffer[0].shape[:2]
    
    # We copy the buffer to avoid modification during thread writing
    buffer_copy = list(frame_buffer)
    
    # Start thread
    thread = Thread(target=_save_video_worker, args=(buffer_copy, filepath, fps, width, height))
    thread.daemon = True
    thread.start()
    
    return f"uploads/alerts/{filename}"
