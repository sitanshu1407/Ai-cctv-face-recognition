from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import os

from utils import download_weights
from embedding import EmbeddingManager
from camera import CameraRegistry
from face_recognition import FaceRecognizer

app = FastAPI(title="Smart Home Security AI Service")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances initialized on startup
db_manager = None
camera_registry = None
face_recognizer = None

class ImagePathRequest(BaseModel):
    image_path: str

@app.on_event("startup")
def startup_event():
    global db_manager, camera_registry, face_recognizer
    
    # 1. Download model weights if needed
    print("[STARTUP] Checking model weights...")
    download_weights()
    
    # 2. Initialize DB & Embeddings Manager
    print("[STARTUP] Connecting to MongoDB and loading faces...")
    db_manager = EmbeddingManager()
    
    # 3. Initialize Face Recognizer (ArcFace ONNX)
    print("[STARTUP] Loading Face Recognizer model...")
    face_recognizer = FaceRecognizer()
    
    # 4. Initialize Camera Registry & start streams
    print("[STARTUP] Starting camera streams...")
    camera_registry = CameraRegistry(db_manager)
    
    # Reload active cameras from database
    try:
        cameras = list(db_manager.db.cameras.find({}))
        camera_registry.reload_cameras(cameras)
    except Exception as e:
        print(f"[STARTUP ERROR] Failed to load cameras on startup: {e}")

@app.on_event("shutdown")
def shutdown_event():
    global camera_registry
    if camera_registry:
        print("[SHUTDOWN] Shutting down active camera streams...")
        camera_registry.shutdown()

@app.get("/")
def read_root():
    return {"status": "online", "service": "Smart Home Security AI Service"}

# 1. Extract Face Embedding
@app.post("/api/extract-embedding")
def extract_embedding(payload: ImagePathRequest):
    """
    Given a local absolute file path, loads the image, detects the face,
    and returns its 512-dim embedding vector.
    """
    image_path = payload.image_path
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Uploaded face image file not found on disk")

    try:
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file or format")

        # Run face recognizer directly on the whole image (assuming it's a cropped face photo already)
        embedding = face_recognizer.get_embedding(img)
        return {"success": True, "embedding": embedding}
    except Exception as e:
        print(f"[ERROR] Embedding generation failed: {e}")
        return {"success": False, "message": str(e)}

# 2. Reload Faces Cache
@app.post("/api/faces/reload")
def reload_faces():
    """
    Tells the AI service to reload face embeddings from MongoDB cache.
    """
    if db_manager:
        db_manager.reload_faces()
        return {"success": True, "message": "AI service faces cache reloaded successfully"}
    raise HTTPException(status_code=500, detail="Database manager not initialized")

# 3. Reload Cameras Registry
@app.post("/api/cameras/reload")
def reload_cameras(background_tasks: BackgroundTasks):
    """
    Triggers reloading the active cameras list in background.
    """
    if db_manager and camera_registry:
        try:
            cameras = list(db_manager.db.cameras.find({}))
            # Run camera synchronization in background to avoid API timeouts
            background_tasks.add_task(camera_registry.reload_cameras, cameras)
            return {"success": True, "message": "Reloading camera streams in background"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=500, detail="AI Service registries not initialized")

# 4. Stream MJPEG Camera Output
@app.get("/api/cameras/{camera_id}/stream")
def stream_camera(camera_id: str):
    """
    Serves a live MJPEG stream for the selected camera.
    """
    if camera_registry is None:
        raise HTTPException(status_code=500, detail="Camera registry is offline")
        
    stream = camera_registry.get_stream(camera_id)
    if stream is None or not stream.running:
        # Stream is offline or not registered
        raise HTTPException(status_code=404, detail=f"Camera stream {camera_id} is offline or not found")
        
    return StreamingResponse(
        stream.get_mjpeg_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
