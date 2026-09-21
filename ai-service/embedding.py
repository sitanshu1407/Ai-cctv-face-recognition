import os
from pymongo import MongoClient
from bson import ObjectId
import datetime

# Helper to read environment variables from backend .env
def load_backend_env():
    env = {}
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "server", ".env"))
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env[k] = v
    return env

class EmbeddingManager:
    def __init__(self):
        env = load_backend_env()
        mongo_uri = env.get("MONGODB_URI", "mongodb://localhost:27017/smart_home_security")
        
        # Connect to MongoDB
        self.client = MongoClient(mongo_uri)
        # Parse db name from URI or use default
        # URI looks like mongodb://localhost:27017/smart_home_security
        db_name = "smart_home_security"
        if "/" in mongo_uri.split("://")[1]:
            db_name = mongo_uri.split("/")[-1].split("?")[0]
            
        self.db = self.client[db_name]
        self.faces_cache = []
        self.reload_faces()

    def reload_faces(self):
        """
        Reloads registered face embeddings from MongoDB into memory cache.
        """
        try:
            faces = list(self.db.faces.find({}))
            self.faces_cache = []
            for face in faces:
                self.faces_cache.append({
                    "name": face["name"],
                    "embedding": face["embedding"]
                })
            print(f"[INFO] Loaded {len(self.faces_cache)} registered faces into memory.")
        except Exception as e:
            print(f"[ERROR] Failed to load faces from database: {e}")
            self.faces_cache = []

    def get_registered_faces(self):
        return self.faces_cache

    def log_detection(self, camera_id, person_name, confidence):
        """
        Inserts a detection event log in the database.
        """
        try:
            log = {
                "camera": ObjectId(camera_id),
                "personName": person_name,
                "confidence": confidence,
                "createdAt": datetime.datetime.utcnow(),
                "updatedAt": datetime.datetime.utcnow()
            }
            self.db.detectionlogs.insert_one(log)
        except Exception as e:
            print(f"[ERROR] Failed to log detection: {e}")

    def create_alert(self, camera_id, person_name, confidence, screenshot_path, video_path=None):
        """
        Inserts an intruder alert in the database.
        """
        try:
            alert = {
                "camera": ObjectId(camera_id),
                "personName": person_name,
                "confidence": confidence,
                "screenshotPath": screenshot_path,
                "videoPath": video_path,
                "status": "unread",
                "createdAt": datetime.datetime.utcnow(),
                "updatedAt": datetime.datetime.utcnow()
            }
            result = self.db.alerts.insert_one(alert)
            print(f"[INFO] Alert created in database: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            print(f"[ERROR] Failed to create alert: {e}")
            return None
            
    def get_system_settings(self):
        """
        Reads threshold and timer settings.
        Since we don't have a settings table, settings are usually simple defaults 
        or we can load them from user/system configs if we create one.
        We will return defaults if not found.
        """
        try:
            # Check if there is a settings config or just return defaults
            return {
                "recognition_threshold": 0.55,
                "intruder_timer": 5.0  # seconds
            }
        except Exception:
            return {
                "recognition_threshold": 0.55,
                "intruder_timer": 5.0
            }
