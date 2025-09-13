import cv2, json, sys
from pathlib import Path

from utils.pipeline import DamagePipeline
from utils.angle import AngleClassifier

MODELS_DIR = Path(__file__).parent/"models"
DET = str(MODELS_DIR/"detector.pt")
CLS = str(MODELS_DIR/"severity.pt")
SEG = None  # set path if you add car-parts segmentation

def main(image_path: str, out_path: str = "viz.jpg"):
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(image_path)

    # angle (zero-shot CLIP)
    angle_clf = AngleClassifier()
    angle = angle_clf.classify(img)["label"]

    pipe = DamagePipeline(DET, CLS, SEG)
    res = pipe.infer(img, angle_label=angle, return_vis=True)

    print(json.dumps({k: v for k, v in res.items() if k != "viz_image"}, ensure_ascii=False, indent=2))

    if "viz_image" in res:
        cv2.imwrite(out_path, res["viz_image"])
        print("saved:", out_path)

if __name__ == "__main__":
    assert len(sys.argv) >= 2, "Usage: python local_infer.py /path/to/image.jpg [out.jpg]"
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "viz.jpg")
