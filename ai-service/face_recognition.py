import os
import cv2
import numpy as np
import onnxruntime as ort

class FaceRecognizer:
    def __init__(self):
        self.model_path = os.path.join("models", "w600k_r50.onnx")
        self.ort_session = None
        
        if os.path.exists(self.model_path):
            try:
                # Load ONNX model using CPU provider
                self.ort_session = ort.InferenceSession(
                    self.model_path, 
                    providers=["CPUExecutionProvider"]
                )
                print(f"ArcFace ONNX Model loaded successfully from {self.model_path}")
            except Exception as e:
                print(f"[ERROR] Failed to load ONNX model: {e}")
        else:
            print(f"[WARNING] {self.model_path} not found. Face recognition embeddings will be dummy/random.")

    def get_embedding(self, face_image):
        """
        Extracts a 512-dimensional embedding from a cropped BGR face image.
        """
        if self.ort_session is None:
            # Fallback/Dummy embedding if model is not loaded
            # Use random but deterministic hash based on shape/mean to simulate consistency
            np.random.seed(int(np.mean(face_image)) % 1000)
            dummy = np.random.randn(512).astype(np.float32)
            return (dummy / np.linalg.norm(dummy)).tolist()

        try:
            # 1. Resize to 112x112 (ArcFace input shape)
            resized = cv2.resize(face_image, (112, 112))
            
            # 2. Convert to float32 and normalize: (img - 127.5) / 128.0
            # InsightFace expects input normalized in range [-1, 1]
            input_data = (resized.astype(np.float32) - 127.5) / 128.0
            
            # 3. Transpose HWC to CHW (1, 3, 112, 112)
            input_data = np.transpose(input_data, (2, 0, 1))
            input_blob = np.expand_dims(input_data, axis=0)

            # 4. Run ONNX Session
            inputs = {self.ort_session.get_inputs()[0].name: input_blob}
            outputs = self.ort_session.run(None, inputs)
            
            embedding = outputs[0][0]
            
            # 5. L2 Normalize the embedding
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
                
            return embedding.tolist()
        except Exception as e:
            print(f"[ERROR] Embedding extraction error: {e}")
            # Return dummy on failure
            dummy = np.random.randn(512).astype(np.float32)
            return (dummy / np.linalg.norm(dummy)).tolist()

    @staticmethod
    def compare(emb1, emb2):
        """
        Computes cosine similarity between two 512-dim embedding lists.
        Since they are L2-normalized, cosine similarity is the dot product.
        """
        a = np.array(emb1)
        b = np.array(emb2)
        # Ensure they are normalized
        a = a / (np.linalg.norm(a) + 1e-8)
        b = b / (np.linalg.norm(b) + 1e-8)
        return float(np.dot(a, b))
