# download_carparts_seg.py (or run as a Colab cell)
import os, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent if "__file__" in globals() else Path("/content/ALTAl-CAR-SCAN")
MODELS = ROOT / "serving-models" / "models"
MODELS.mkdir(parents=True, exist_ok=True)
OUT = MODELS / "carparts-seg.pt"

if OUT.exists():
    print(f"✓ Already exists: {OUT}")
    sys.exit(0)

CANDIDATE_URLS = [
    # Ultralytics often hosts pretrained weights under assets/releases; these are the first to try.
    "https://github.com/ultralytics/assets/releases/download/v8.3.0/carparts-seg.pt",
    "https://github.com/ultralytics/assets/releases/download/v8.2.0/carparts-seg.pt",
]

def try_download(url: str) -> bool:
    print(f"→ Trying {url}")
    r = subprocess.run(["bash", "-lc", f"curl -L --fail --progress-bar '{url}' -o '{OUT}'"], capture_output=True, text=True)
    ok = r.returncode == 0 and OUT.exists() and OUT.stat().st_size > 1024 * 1024
    if not ok:
        # cleanup partials
        if OUT.exists():
            OUT.unlink()
        print("  …failed")
    else:
        print(f"  ✓ saved: {OUT} ({OUT.stat().st_size/1e6:.1f} MB)")
    return ok

for u in CANDIDATE_URLS:
    if try_download(u):
        break
else:
    print("\n⚠️ Could not download `carparts-seg.pt` automatically.")
    print(f"Please place a pretrained car-parts segmentation weight at:\n  {OUT}")
    print("Then re-run your server or inference.")
