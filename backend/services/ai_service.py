import cv2
import numpy as np
import os
import urllib.request
from typing import List, Optional

# Paths for models
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
DETECTOR_PATH = os.path.join(MODEL_DIR, "face_detection_yunet.onnx")
RECOGNIZER_PATH = os.path.join(MODEL_DIR, "face_recognition_sface.onnx")

# URLs (Updated to use 'main' branch)
DETECTOR_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
RECOGNIZER_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

class AIService:
    def __init__(self):
        if not os.path.exists(MODEL_DIR):
            os.makedirs(MODEL_DIR)
        
        self.mock_mode = False
        try:
            self._ensure_model(DETECTOR_URL, DETECTOR_PATH)
            self._ensure_model(RECOGNIZER_URL, RECOGNIZER_PATH)
            
            # Initialize detector (score_threshold=0.6, nms_threshold=0.3)
            self.detector = cv2.FaceDetectorYN.create(DETECTOR_PATH, "", (320, 320), 0.6, 0.3)
            # Initialize recognizer
            self.recognizer = cv2.FaceRecognizerSF.create(RECOGNIZER_PATH, "")
            print("AI Engine: Models loaded successfully. Detection threshold: 0.6")
        except Exception as e:
            print(f"AI Engine Warning: Could not load models ({e}). Switching to Mock Mode.")
            self.mock_mode = True

    def _ensure_model(self, url: str, path: str):
        if not os.path.exists(path):
            print(f"Downloading model from {url}...")
            # Use a custom user agent to avoid being blocked
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
                out_file.write(response.read())
            print("Download complete.")


    def get_face_embedding(self, image_bytes: bytes) -> Optional[List[float]]:
        # Convert bytes to opencv image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None
        return self.get_face_embedding_from_frame(img)

    def get_face_embedding_from_frame(self, img: np.ndarray) -> Optional[List[float]]:
        if self.mock_mode:
            # Generate a deterministic but dummy embedding based on image content
            # or just return a random 128-d vector for demo purposes
            return [np.random.uniform(-1, 1) for _ in range(128)]

        height, width, _ = img.shape
        self.detector.setInputSize((width, height))
        _, faces = self.detector.detect(img)
        if faces is None:
            return None
        face = faces[0]
        aligned_face = self.recognizer.alignCrop(img, face)
        embedding = self.recognizer.feature(aligned_face)
        return embedding[0].tolist()

    def get_all_face_embeddings(self, img: np.ndarray) -> List[List[float]]:
        # Return only embeddings (backward compatibility)
        results = self.detect_and_embed(img)
        return [r['embedding'] for r in results]

    def detect_and_embed(self, img: np.ndarray) -> List[dict]:
        if self.mock_mode:
            return []

        height, width, _ = img.shape
        self.detector.setInputSize((width, height))
        _, faces = self.detector.detect(img)
        if faces is None:
            # print("DEBUG: No faces detected in image.")
            return []
        
        # print(f"DEBUG: Detector found {len(faces)} potential faces.")
        results = []
        for face in faces:
            # face[0:4] are x, y, width, height
            bbox = [int(v) for v in face[0:4]]
            aligned_face = self.recognizer.alignCrop(img, face)
            embedding = self.recognizer.feature(aligned_face)
            results.append({
                "embedding": embedding[0].tolist(),
                "bbox": bbox
            })
        return results

    def compare_faces(self, embedding1: List[float], embedding2: List[float]) -> float:
        # SFace uses Cosine Similarity or Norm-L2
        # Returns score where > 0.363 (for Cosine) or < 1.128 (for L2) is a match
        feat1 = np.array(embedding1, dtype=np.float32).reshape(1, -1)
        feat2 = np.array(embedding2, dtype=np.float32).reshape(1, -1)
        
        cosine_score = self.recognizer.match(feat1, feat2, cv2.FaceRecognizerSF_FR_COSINE)
        return float(cosine_score)

ai_engine = None

def get_ai_engine():
    global ai_engine
    if ai_engine is None:
        ai_engine = AIService()
    return ai_engine
