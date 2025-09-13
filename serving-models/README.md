# inDrive Damage Serving (Modal)

This folder contains a production-ready inference pipeline:
- YOLOv8 detector (`scratch`, `dent`, `rust`)
- YOLOv8-cls severity (`minor`, `moderate`, `major`)
- Zero-shot angle classifier (CLIP): `front/back/left/right/...`
- Optional parts segmentation (hook included)

## Local test
```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python local_infer.py /path/to/car.jpg viz.jpg
```

---
## FastAPI Inference Service (no Modal)
A lightweight FastAPI server wrapping the same pipeline is provided in `fastapi_app.py` with endpoints:
- `GET  /health` readiness status
- `POST /analyze/bytes` raw body image (Content-Type: image/jpeg or application/octet-stream)
- `POST /analyze/multipart` multipart form with field `file`

### Run directly (dev)
```bash
pip install -r requirements.txt
uvicorn fastapi_app:app --host 0.0.0.0 --port 8000 --workers 1
```

### Example curl
```bash
curl -X POST --data-binary @example.jpg \
  -H "Content-Type: application/octet-stream" \
  http://localhost:8000/analyze/bytes

curl -X POST -F "file=@example.jpg" \
  http://localhost:8000/analyze/multipart
```

### Docker build & run
From this directory:
```bash
# Build image
docker build -t car-damage-svc:latest .
# Run container
docker run --rm -p 8000:8000 --name car-damage car-damage-svc:latest
```

### docker-compose snippet (co-locate with backend)
Add this service (adjust relative path) to your root `docker-compose.yml` so backend can call it via internal hostname `damage-svc:8000`:
```yaml
services:
  damage-svc:
    build: ./serving-models
    image: car-damage-svc:latest
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          # Uncomment if using GPU (Docker >= 19.03 with nvidia runtime configured)
          # devices:
          #   - capabilities: [gpu]
    networks:
      - backend

  backend:
    # ... existing backend service ...
    depends_on:
      - damage-svc
    networks:
      - backend

networks:
  backend:
    driver: bridge
```

### Calling from backend (Python example)
```python
import httpx

async def analyze_image(path: str):
    async with httpx.AsyncClient(base_url="http://damage-svc:8000") as client:
        with open(path, 'rb') as f:
            resp = await client.post("/analyze/bytes", content=f.read(), headers={"Content-Type": "application/octet-stream"})
        resp.raise_for_status()
        return resp.json()
```

### Notes
- Models are loaded once at startup (see `startup_event`).
- If you add a fine-tuned `carparts-seg.pt` drop it into `models/` and restart.
- For GPU usage swap to a CUDA base image and ensure `torch`/`ultralytics` wheels match CUDA.
