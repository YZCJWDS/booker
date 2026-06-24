from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIRS = [
    ROOT / "assets" / "mascot" / "kbn",
    ROOT / "assets" / "mascot" / "kbnht",
]


def remove_checkerboard(path: Path, output_path: Path) -> None:
    source = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if source is None:
        raise ValueError(f"Could not read {path}")

    if source.ndim == 3 and source.shape[2] == 4 and np.any(source[:, :, 3] < 255):
        output_path.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(cv2.cvtColor(source, cv2.COLOR_BGRA2RGBA)).save(output_path)
        return

    if source.ndim == 2:
        source = cv2.cvtColor(source, cv2.COLOR_GRAY2BGR)
    elif source.ndim == 3 and source.shape[2] == 4:
        source = cv2.cvtColor(source, cv2.COLOR_BGRA2BGR)

    rgb = cv2.cvtColor(source, cv2.COLOR_BGR2RGB)
    rgb_i = rgb.astype(np.int16)
    average = rgb_i.mean(axis=2)
    chroma = rgb_i.max(axis=2) - rgb_i.min(axis=2)
    red = rgb_i[:, :, 0]
    green = rgb_i[:, :, 1]
    blue = rgb_i[:, :, 2]

    mask = np.full(source.shape[:2], cv2.GC_PR_FGD, dtype=np.uint8)
    neutral_checker = (average >= 220) & (chroma <= 24)
    strong_foreground = ((chroma > 32) & (average < 246)) | (average < 214)
    skin_foreground = (
        (red >= 218)
        & (green >= 185)
        & (blue >= 170)
        & ((red - blue) >= 16)
        & ((red - green) >= 3)
    )

    mask[neutral_checker] = cv2.GC_PR_BGD
    mask[strong_foreground | skin_foreground] = cv2.GC_FGD
    mask[:3, :] = cv2.GC_BGD
    mask[-3:, :] = cv2.GC_BGD
    mask[:, :3] = cv2.GC_BGD
    mask[:, -3:] = cv2.GC_BGD

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(source, mask, None, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_MASK)

    foreground = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
    rgba = cv2.cvtColor(source, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = np.where(foreground, 255, 0).astype(np.uint8)
    rgba[~foreground, :3] = 0

    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(output_path)


def main() -> None:
    for source_dir in SOURCE_DIRS:
        output_dir = source_dir / "transparent"
        for path in sorted(source_dir.glob("*.png")):
            remove_checkerboard(path, output_dir / path.name)


if __name__ == "__main__":
    main()
