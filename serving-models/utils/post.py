from typing import List, Optional

CRITICAL_PARTS_GLOBAL = {"headlight","front_windshield","rear_window","taillight"}

sev2rank = {"minor":1, "moderate":2, "major":3}
rank2sev = {v:k for k,v in sev2rank.items()}

ANGLE_CRITICAL_PARTS = {
    "front": {"headlight","front_windshield","front_bumper"},
    "back":  {"taillight","rear_window","rear_bumper"},
    "left":  {"left_door","left_fender"},
    "right": {"right_door","right_fender"},
}

def bbox_severity(defect: str, area_ratio: float, part: Optional[str], bw: float, bh: float) -> str:
    """Heuristic severity from geometry/part."""
    def sev_area(a: float) -> str:
        if a < 0.01: return "minor"
        if a < 0.03: return "moderate"
        return "major"

    if part in CRITICAL_PARTS_GLOBAL and area_ratio > 0:
        return "major"

    if defect == "scratch":
        thinness = min(bw, bh) / (max(bw, bh) + 1e-6)
        eff = area_ratio * (0.25 + 0.75 * thinness)
        if thinness < 0.15 and area_ratio < 0.15:
            return "moderate" if area_ratio >= 0.02 else "minor"
        return sev_area(eff)
    return sev_area(area_ratio)

def fuse_severity(defect: str, sev_bbox: str, sev_image: str) -> str:
    """Combine bbox severity with global (image) severity."""
    rb, ri = sev2rank[sev_bbox], sev2rank.get(sev_image, 2)
    return rank2sev[min(rb, ri) if defect == "scratch" else max(rb, ri)]

def integrity_score(area_ratios: List[float], parts: List[Optional[str]]) -> int:
    worst = 0.0
    for ar, pt in zip(area_ratios, parts):
        worst = max(worst, ar * 2.0 if pt in CRITICAL_PARTS_GLOBAL else ar)
    if worst == 0:     return 5
    if worst < 0.01:   return 4
    if worst < 0.03:   return 3
    if worst < 0.08:   return 2
    return 1

def angle_adjusted_severity(base: str, part: Optional[str], angle: str) -> str:
    """Escalate for angle-critical parts."""
    crit = ANGLE_CRITICAL_PARTS.get(angle, set())
    if part in crit and sev2rank.get(base,1) < 3:
        return "major"
    return base
