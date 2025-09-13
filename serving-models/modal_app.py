# serving-models/modal_app.py
import modal
from fastapi import Request, UploadFile, File  # for endpoints

app = modal.App("indrive-quality")

# ---------- Image (system + python deps + your code/weights) ----------
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libgl1", "libglib2.0-0", "ffmpeg")          # OpenCV deps
    .pip_install_from_requirements("requirements.txt")        # your pinned deps
    .pip_install(                                             # required for web endpoints
        "fastapi",
        "uvicorn",
    )
    .add_local_dir("./models", "/root/models", copy=True)                       # detector.pt, severity.pt, (optional) carparts-seg.pt
    .add_local_dir("./utils", "/root/app_utils", copy=True)                # pipeline + angle
)

# ---------- (Optional) seed once to warm Ultralytics caches ----------
@app.function(
    image=image, gpu="T4", timeout=600,
)
def seed_models():
    from ultralytics import YOLO
    YOLO("yolov8s-seg.pt")
    YOLO("yolov8s.pt")
    YOLO("yolov8s-cls.pt")
    print("✅ Seeded pretrained YOLO weights")

# ---------- Main serving class ----------
@app.cls(
    image=image,
    gpu="T4",
    timeout=300,
    # your knobs
    scaledown_window=60,
    max_containers=1,
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True},
)
class InDriveInspector:
    @modal.enter()  # ✅ ensure this runs when the container starts
    def _load(self):
        # Attempt remote package name first; only fallback if that root package truly missing.
        try:
            from app_utils.pipeline import DamagePipeline  # type: ignore
            from app_utils.angle import AngleClassifier  # type: ignore
        except ModuleNotFoundError as e:
            if str(e).startswith("No module named 'app_utils'"):
                from utils.pipeline import DamagePipeline  # type: ignore
                from utils.angle import AngleClassifier  # type: ignore
            else:
                # Real dependency missing inside the module => surface it
                raise

        det_path = "./models/detector.pt"
        cls_path = "./models/severity.pt"
        seg_path = None  # None => pipeline fallback to yolov8s-seg.pt
        self.pipe = DamagePipeline(det_path, cls_path, seg_path)
        self.angle = AngleClassifier()
        self._ready = True

    def _lazy_init(self):
        """Safety net if the enter hook didn't run for any reason."""
        if getattr(self, "_ready", False):
            return
        try:
            from app_utils.pipeline import DamagePipeline  # type: ignore
            from app_utils.angle import AngleClassifier  # type: ignore
        except ModuleNotFoundError as e:
            if str(e).startswith("No module named 'app_utils'"):
                from utils.pipeline import DamagePipeline  # type: ignore
                from utils.angle import AngleClassifier  # type: ignore
            else:
                raise

        det_path = "./models/detector.pt"
        cls_path = "./models/severity.pt"
        seg_path = None
        self.pipe = DamagePipeline(det_path, cls_path, seg_path)
        self.angle = AngleClassifier()
        self._ready = True

    @modal.method()
    def analyze(self, img_bytes: bytes) -> dict:
        # guard
        if not getattr(self, "_ready", False):
            self._lazy_init()

        import numpy as np, cv2
        npimg = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "Cannot decode image"}

        angle = self.angle.classify(img)["label"]
        res = self.pipe.infer(img, angle_label=angle, return_vis=False)
        res.pop("viz_image", None)
        return res

# ---------- HTTP endpoint A: raw bytes ----------
@app.function(
    image=image, gpu="T4", timeout=300,
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True},
)
@modal.fastapi_endpoint(method="POST")  # ✅ current name
async def analyze_bytes(request: Request):
    """
    POST raw bytes (image/jpeg or application/octet-stream) to the root of the endpoint host.
    curl --http1.1 -X POST -H "Content-Type: application/octet-stream" \
      --data-binary @example.jpg "https://<subdomain>.modal.run/"
    """
    img_bytes = await request.body()
    worker = InDriveInspector()
    return worker.analyze.remote(img_bytes)

# ---------- HTTP endpoint B: multipart upload ----------
@app.function(
    image=image, gpu="T4", timeout=300,
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True},
)
@modal.fastapi_endpoint(method="POST")
async def analyze_multipart(file: UploadFile = File(...)):
    """
    POST multipart/form-data with field 'file' to the root of this endpoint host.
    curl --http1.1 -X POST -F "file=@example.jpg" "https://<subdomain>.modal.run/"
    """
    img_bytes = await file.read()
    worker = InDriveInspector()
    return worker.analyze.remote(img_bytes)
