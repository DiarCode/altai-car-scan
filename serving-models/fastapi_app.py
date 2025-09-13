"""
FastAPI inference service for car damage analysis (CPU-optimized, ≤4GB RAM).

Endpoints:
  GET  /health
  POST /analyze/bytes        (raw image bytes)
  POST /analyze/multipart    (multipart file=...)
  POST /analyze-viz          (raw bytes -> JPEG with overlays)

Tips for low-RAM hosts:
  - Use the smallest weights you have (e.g., yolov8n-based .pt or .onnx).
  - Prefer ONNXRuntime on CPU for speed/footprint. Set *_ONNX env vars.
  - Keep 1 worker, 1 thread. Avoid big batch inference.
"""

from __future__ import annotations
import os, time, io, traceback
from typing import Any, Dict

# ---- CPU: keep thread counts low before importing numpy/torch ----
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")

from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse, Response
import numpy as np
import cv2

# ---------- CONFIG (env) ----------
# If you have ONNX exports, set these and the app will avoid PyTorch at runtime.
DET_ONNX = os.getenv("DET_ONNX", "").strip() or None
CLS_ONNX = os.getenv("CLS_ONNX", "").strip() or None
SEG_ONNX = os.getenv("SEG_ONNX", "").strip() or None   # optional

# If you keep PyTorch .pt weights (Ultralytics), set these paths:
DET_PT = os.getenv("DET_PATH", "models/detector.pt")
CLS_PT = os.getenv("CLS_PATH", "models/severity.pt")
SEG_PT = os.getenv("SEG_PATH", "") or None  # optional, else pipeline may fallback internally

# Max accepted upload size (bytes); default ~10MB
MAX_UPLOAD = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))

# ---------- MODEL SERVER ----------
class ModelServer:
    def __init__(self) -> None:
        self.ready = False
        self.loaded_at: float | None = None
        self.backend = None  # "onnx" or "pt"

        # ONNX handles (optional)
        self._onnx_det = None
        self._onnx_cls = None
        self._onnx_seg = None

        # PyTorch pipeline
        self.pipe = None
        self.angle = None

    def _load_pt(self):
        # Delay heavy imports
        import torch
        from utils.pipeline import DamagePipeline
        from utils.angle import AngleClassifier

        # keep torch threads minimal
        try:
            torch.set_num_threads(1)
        except Exception:
            pass

        self.pipe = DamagePipeline(DET_PT, CLS_PT, SEG_PT)
        self.angle = AngleClassifier()
        self.backend = "pt"
        print("✅ Loaded PyTorch pipeline:", {"det": DET_PT, "cls": CLS_PT, "seg": SEG_PT})

    def _load_onnx(self):
        # Optional ONNX Runtime: you’ll need to adjust your utils.pipeline if you
        # want full ONNX inference for det/cls/seg within that file. If you don’t
        # have a dedicated ONNX pipeline yet, prefer PT path for now.
        import onnxruntime as ort
        from utils.angle import AngleClassifier
        # NOTE: angle can stay lightweight (e.g., heuristic or tiny classifier)
        # If your AngleClassifier uses torch, ensure it is also tiny or rewrite it for ONNX.

        sessopt = ort.SessionOptions()
        sessopt.intra_op_num_threads = 1
        sessopt.inter_op_num_threads = 1

        providers = ["CPUExecutionProvider"]
        if DET_ONNX:
            self._onnx_det = ort.InferenceSession(DET_ONNX, sess_options=sessopt, providers=providers)
        if CLS_ONNX:
            self._onnx_cls = ort.InferenceSession(CLS_ONNX, sess_options=sessopt, providers=providers)
        if SEG_ONNX:
            self._onnx_seg = ort.InferenceSession(SEG_ONNX, sess_options=sessopt, providers=providers)

        # Minimal “pipeline-like” shim – replace with your own ONNX pipeline if you have it.
        # For now, we still use your DamagePipeline if it supports ONNX or fallback PT.
        # If not, stick to PT backend until you wire ONNX in utils/pipeline.
        from utils.pipeline import DamagePipeline
        self.pipe = DamagePipeline(DET_PT, CLS_PT, SEG_PT, prefer_onnx=True,
                                   det_onnx=self._onnx_det, cls_onnx=self._onnx_cls, seg_onnx=self._onnx_seg)
        self.angle = AngleClassifier()
        self.backend = "onnx"
        print("✅ Loaded ONNX pipeline:", {"det_onnx": DET_ONNX, "cls_onnx": CLS_ONNX, "seg_onnx": SEG_ONNX})

    def load(self):
        if self.ready:
            return
        try:
            if DET_ONNX or CLS_ONNX or SEG_ONNX:
                self._load_onnx()
            else:
                self._load_pt()
            self.ready = True
            self.loaded_at = time.time()
        except Exception as e:
            self.ready = False
            print("[startup] failed to load models:", e)
            raise

    def analyze_bytes(self, img_bytes: bytes, return_vis: bool = False) -> Dict[str, Any]:
        if not self.ready:
            self.load()
        npimg = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if img is None:
            return {"error": "Cannot decode image"}

        # Angle is lightweight; keep it even for ONNX path for now.
        angle_label = self.angle.classify(img)["label"]
        # Your DamagePipeline should internally use either PT or ONNX depending on init flags.
        out = self.pipe.infer(img, angle_label=angle_label, return_vis=return_vis)
        return out


SERVER = ModelServer()
app = FastAPI(title="InDrive Quality (CPU-optimized)")

@app.on_event("startup")
def _warmup():
    # If your host is extremely RAM-limited, you can comment this out to lazy-load on first request.
    try:
        SERVER.load()
    except Exception as e:
        print("Warmup failed, will lazy-load on first request:", e)

# --------------- Helpers ---------------
def _validate_len(content: bytes):
    if not content:
        raise HTTPException(status_code=400, detail="Empty body")
    if len(content) > MAX_UPLOAD:
        raise HTTPException(status_code=413, detail=f"Payload too large (> {MAX_UPLOAD} bytes)")

# --------------- Routes ---------------
@app.get("/health")
def health():
    return {
        "ok": SERVER.ready,
        "backend": SERVER.backend,
        "loaded_at": SERVER.loaded_at,
        "max_upload_bytes": MAX_UPLOAD,
    }

@app.post("/analyze/bytes")
async def analyze_bytes(request: Request):
    body = await request.body()
    _validate_len(body)
    res = SERVER.analyze_bytes(body, return_vis=False)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    res.pop("viz_image", None)
    return JSONResponse(res)

@app.post("/analyze/multipart")
async def analyze_multipart(file: UploadFile = File(...)):
    content = await file.read()
    _validate_len(content)
    res = SERVER.analyze_bytes(content, return_vis=False)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    res.pop("viz_image", None)
    return JSONResponse(res)

@app.post("/analyze-viz")
async def analyze_viz(request: Request):
    body = await request.body()
    _validate_len(body)
    res = SERVER.analyze_bytes(body, return_vis=True)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    viz = res.get("viz_image")
    if viz is None:
        raise HTTPException(status_code=500, detail="Visualization not available")
    ok, buf = cv2.imencode(".jpg", viz, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to encode visualization")
    return Response(content=buf.tobytes(), media_type="image/jpeg")

@app.get("/")
def root():
    return {
        "service": "indrive-quality",
        "backend": SERVER.backend,
        "endpoints": ["/health", "/analyze/bytes", "/analyze/multipart", "/analyze-viz"],
    }

if __name__ == "__main__":
    import uvicorn
    # 1 worker is safest on small RAM
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=8000, reload=False, workers=1)
