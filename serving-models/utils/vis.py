import cv2
from typing import Tuple

COLOR = {"scratch": (36,170,255), "dent": (40,220,40), "rust": (50,50,240)}

def draw_box(img, x1, y1, x2, y2, text: str, color: Tuple[int,int,int]):
    x1,y1,x2,y2 = map(int,[x1,y1,x2,y2])
    cv2.rectangle(img,(x1,y1),(x2,y2),color,2)
    (tw,th),_ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    cv2.rectangle(img,(x1,y1-th-8),(x1+tw+8,y1),color,-1)
    cv2.putText(img,text,(x1+4,y1-6),cv2.FONT_HERSHEY_SIMPLEX,0.6,(255,255,255),2,cv2.LINE_AA)
