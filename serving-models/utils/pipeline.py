# serving-models/utils/pipeline.py
from typing import Optional, Dict, Any, List
import os
from pathlib import Path

import numpy as np
import cv2
from ultralytics import YOLO

from .post import bbox_severity, fuse_severity, integrity_score, angle_adjusted_severity
from .vis import draw_box, COLOR


class DamagePipeline:
    """
    Unified inference pipeline:
      - detector: YOLO detect (scratch/dent/rust)
      - classifier: YOLO cls (minor/moderate/major)
      - parts: YOLO seg (car parts)
        * uses fine-tuned weights if available (carparts-seg.pt)
        * otherwise falls back to generic pretrained yolov8s-seg.pt
    """
    def __init__(
        self,
        detector_path: str,
        severity_path: str,
        seg_path: Optional[str] = None,
        device: Optional[str] = None,
    ):
        self.det_model = YOLO(detector_path)
        self.cls_model = YOLO(severity_path)
        self.device = device  # ultralytics auto-selects

        # --- segmentation weights resolution (snapshot-friendly) ---
        # Priority:
        #   1) explicit seg_path if provided
        #   2) local fine-tuned weights: serving-models/models/carparts-seg.pt
        #   3) generic pretrained: yolov8s-seg.pt (downloads once; snapshot keeps cache)
        if seg_path:
            seg_weights = Path(seg_path)
        else:
            local_ft = Path(__file__).resolve().parents[1] / "models" / "carparts-seg.pt"
            seg_weights = local_ft if local_ft.exists() else None

        if seg_weights and Path(seg_weights).exists():
            self.seg_model = YOLO(str(seg_weights))
            self._seg_source = f"local:{seg_weights.name}"
        else:
            # fallback to small pretrained seg model (COCO-pretrained head)
            # Ultralytics will download once to ~/.cache; in Modal, run a seed step then snapshot.
            self.seg_model = YOLO("yolov8s-seg.pt")
            self._seg_source = "pretrained:yolov8s-seg.pt"

    def _pick_part(self, box_xyxy, seg_result) -> str:
        """
        Assign the car part by maximum IoU overlap between defect box and part masks.
        Always returns a string (falls back to 'unknown').
        """
        if seg_result is None or getattr(seg_result, "masks", None) is None or seg_result.masks is None:
            return "unknown"

        x1, y1, x2, y2 = [int(v) for v in box_xyxy]
        h, w = seg_result.masks.data[0].shape
        x1 = max(0, min(w - 1, x1)); x2 = max(0, min(w - 1, x2))
        y1 = max(0, min(h - 1, y1)); y2 = max(0, min(h - 1, y2))
        if x2 <= x1 or y2 <= y1:
            return "unknown"

        box_mask = np.zeros((h, w), dtype=np.uint8)
        box_mask[y1:y2, x1:x2] = 1
        box_area = float((y2 - y1) * (x2 - x1))

        best_name, best_iou = "unknown", 0.0
        for m, c in zip(seg_result.masks, seg_result.boxes.cls):
            mask = m.data[0].cpu().numpy().astype("uint8")
            name = seg_result.names[int(c.item())]

            inter = float((mask & box_mask).sum())
            if inter <= 0.0:
                continue
            union = box_area + float(mask.sum()) - inter
            iou = inter / union if union > 1e-6 else 0.0

            if iou > best_iou:
                best_name, best_iou = name, iou

        return best_name

    def infer(
        self,
        img_bgr: np.ndarray,
        angle_label: str = "unknown",
        return_vis: bool = False
    ) -> Dict[str, Any]:
        H, W = img_bgr.shape[:2]

        # parts segmentation
        seg = self.seg_model.predict(
            source=img_bgr, imgsz=640, conf=0.25, iou=0.5, verbose=False
        )[0]

        # damages detection
        det = self.det_model.predict(
            source=img_bgr, imgsz=640, conf=0.25, iou=0.5, verbose=False
        )[0]

        # global severity classification
        cls = self.cls_model.predict(source=img_bgr, imgsz=256, verbose=False)[0]
        sev_img, sev_img_conf = "moderate", 0.5
        if getattr(cls, "probs", None) is not None:
            probs = cls.probs.data.tolist()
            idx = int(np.argmax(probs))
            sev_img, sev_img_conf = cls.names[idx], float(probs[idx])

        damages: List[Dict[str, Any]] = []
        ars, parts = [], []
        vis = img_bgr.copy()

        for box, cid, conf in zip(det.boxes.xyxy, det.boxes.cls, det.boxes.conf):
            x1, y1, x2, y2 = [float(v) for v in box.tolist()]
            bw, bh = x2 - x1, y2 - y1
            ar = max(0.0, (bw * bh) / (W * H))
            tname = det.names[int(cid.item())]
            if tname not in ("scratch", "dent", "rust"):
                continue

            # always assign a part (or 'unknown')
            part = self._pick_part([x1, y1, x2, y2], seg)

            sev_b = bbox_severity(tname, ar, part, bw, bh)
            sev_b = angle_adjusted_severity(sev_b, part, angle_label)
            sev_f = fuse_severity(tname, sev_b, sev_img)

            damages.append({
                "type": tname,
                "severity_bbox": sev_b,
                "severity_fused": sev_f,
                "det_confidence": float(conf.item()),
                "part": part,
                "bbox": [x1, y1, bw, bh],
                "area_ratio": float(ar),
            })
            ars.append(ar)
            parts.append(part)

            if return_vis:
                draw_box(
                    vis, x1, y1, x2, y2,
                    f"{tname} | {part} | {sev_f}",
                    COLOR.get(tname, (0, 200, 255)),
                )

        integ = integrity_score(ars, parts)
        out = {
            "angle": angle_label,
            "severity_image": {"label": sev_img, "confidence": sev_img_conf},
            "integrity": {"score_1to5": integ, "label": "no_issues" if integ == 5 else "issues"},
            "damage": damages,
            "seg_source": getattr(self, "_seg_source", "unknown"),  # helpful for debugging
        }
        if return_vis:
            out["viz_image"] = vis
        return out
