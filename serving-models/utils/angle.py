import torch, open_clip
from PIL import Image
import numpy as np
import cv2
from typing import Dict

ANGLE_LABELS = [
    "front view of a car",
    "rear view of a car",
    "left side view of a car",
    "right side view of a car",
]
ANGLE_KEYS = ["front","back","left","right"]

class AngleClassifier:
    def __init__(self, device: str = None, model_name: str = "ViT-B-32", ckpt: str = "laion2b_s34b_b79k"):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model, _, self.preproc = open_clip.create_model_and_transforms(
            model_name, pretrained=ckpt, device=self.device
        )
        self.model.eval()
        with torch.no_grad():
            self.text_tokens = open_clip.tokenize(ANGLE_LABELS).to(self.device)
            txt = self.model.encode_text(self.text_tokens)
            self.text_embeds = txt / txt.norm(dim=-1, keepdim=True)

    @torch.inference_mode()
    def classify(self, img_bgr: np.ndarray) -> Dict:
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        pil = Image.fromarray(rgb)
        image = self.preproc(pil).unsqueeze(0).to(self.device)

        img_e = self.model.encode_image(image)
        img_e = img_e / img_e.norm(dim=-1, keepdim=True)

        logits = (img_e @ self.text_embeds.t()).squeeze(0)
        probs = torch.softmax(logits, dim=-1).float().cpu().numpy()
        idx = int(np.argmax(probs))

        return {
            "label": ANGLE_KEYS[idx],
            "probs": {ANGLE_KEYS[i]: float(probs[i]) for i in range(len(ANGLE_KEYS))}
        }
