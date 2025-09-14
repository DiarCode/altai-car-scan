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
```
