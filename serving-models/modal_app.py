# serving-models/modal_app.py
import modal

app = modal.App("indrive-quality")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install_from_requirements("requirements.txt")
    .add_local_dir("models", "/models")     # ✅ copies your local models
    .add_local_dir("utils", "/app_utils")   # ✅ copies utils
)

# -------- OPTIONAL SEED STEP (run once) ----------
@app.function(image=image, gpu="T4", timeout=600)
def seed_models():
    """
    Seed Ultralytics caches with small pretrained weights so future coldstarts skip downloads.
    Run once:
      modal run serving-models/modal_app.py::seed_models
    """
    from ultralytics import YOLO
    YOLO("yolov8s-seg.pt")  # small pretrained segmenter
    YOLO("yolov8s.pt")      # detector backbone (not required if you ship /models/detector.pt)
    YOLO("yolov8s-cls.pt")  # classifier backbone (not required if you ship /models/severity.pt)
    print("✅ Seeded pretrained weights (cached in snapshot)")


@app.cls(
    image=image,
    gpu="T4",
    timeout=300,
    concurrency_limit=2,
    allow_concurrent_inputs=True,
    scaledown_window=60,   # seconds 
    enable_memory_snapshot=True,
)
class InDriveInspector:
    def __enter__(self):
        from app_utils.pipeline import DamagePipeline
        from app_utils.angle import AngleClassifier

        # If you copied your fine-tuned weights into the image:
        det_path = "/models/detector.pt"
        cls_path = "/models/severity.pt"
        # seg_path = "/models/carparts-seg.pt"  # if you have fine-tuned parts model
        seg_path = None  # None -> pipeline will fallback to yolov8s-seg.pt (cached after seed)

        self.pipe = DamagePipeline(det_path, cls_path, seg_path)
        self.angle = AngleClassifier()
        return self

    @modal.method()
    def analyze(self, img_bytes: bytes) -> dict:
        import cv2, numpy as np

        npimg = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        angle = self.angle.classify(img)["label"]
        res = self.pipe.infer(img, angle_label=angle, return_vis=False)

        # ensure pure-JSON response
        if "viz_image" in res:
            res.pop("viz_image")
        return res
