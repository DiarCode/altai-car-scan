# FastAPI inference service Dockerfile (CPU, small)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    OMP_NUM_THREADS=1 MKL_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 NUMEXPR_NUM_THREADS=1

# system deps for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 ffmpeg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# deps first for layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install --no-cache-dir -r /app/requirements.txt

# code + models
COPY fastapi_app.py /app/fastapi_app.py
COPY utils /app/utils
COPY models /app/models

# env pointing to your PT or ONNX files
ENV DET_PATH=/app/models/detector.pt \
    CLS_PATH=/app/models/severity.pt \
    SEG_PATH=/app/models/carparts-seg.pt \
    MAX_UPLOAD_BYTES=10485760

EXPOSE 8000

# one worker to keep memory low
CMD ["uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log"]
