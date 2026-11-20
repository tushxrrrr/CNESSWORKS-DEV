#!/usr/bin/env python3
"""Remove a visible watermark from an image the user owns or is licensed to edit.

Marks the watermark pixels (a mask image, one or more boxes, or boxes plus
automatic light/dark detection inside them) and fills them by inpainting.

Usage:
  remove_watermark.py IN OUT --box x,y,w,h [--box ...] [--detect light|dark|none]
  remove_watermark.py IN OUT --mask mask.png         (white = remove)
Options: --stroke 15  --method telea|ns  --radius 5  --grow 3  --preview preview.png
Requires: opencv-python-headless, numpy  (pip install opencv-python-headless numpy)
"""
import argparse, sys
try:
    import cv2, numpy as np
except ImportError:
    sys.exit("Needs OpenCV: pip install opencv-python-headless numpy")


def build_mask(img, boxes, detect, mask_path, stroke=15):
    h, w = img.shape[:2]
    if mask_path:
        m = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        if m is None:
            sys.exit(f"Cannot read mask {mask_path}")
        if m.shape != (h, w):
            m = cv2.resize(m, (w, h), interpolation=cv2.INTER_NEAREST)
        return (m > 127).astype(np.uint8) * 255
    m = np.zeros((h, w), np.uint8)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    for (x, y, bw, bh) in boxes:
        x, y = max(0, x), max(0, y)
        bw, bh = min(bw, w - x), min(bh, h - y)
        if detect == "none":
            m[y:y + bh, x:x + bw] = 255
            continue
        roi = np.ascontiguousarray(gray[y:y + bh, x:x + bw])
        # Top-hat: keep only features thinner than the kernel that are lighter
        # (or darker) than their surroundings, i.e. the watermark strokes.
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (stroke * 2 + 1, stroke * 2 + 1))
        op = cv2.MORPH_TOPHAT if detect == "light" else cv2.MORPH_BLACKHAT
        hat = cv2.morphologyEx(roi, op, k)
        t, _ = cv2.threshold(hat, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        m[y:y + bh, x:x + bw] = (hat > max(8, t)).astype(np.uint8) * 255
    return m


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input"); ap.add_argument("output")
    ap.add_argument("--box", action="append", default=[], help="x,y,w,h in pixels (repeatable)")
    ap.add_argument("--mask", help="mask image, white where the watermark is")
    ap.add_argument("--detect", choices=["none", "light", "dark"], default="none",
                    help="inside each box, remove only pixels lighter/darker than their surroundings")
    ap.add_argument("--stroke", type=int, default=15, help="with --detect: a little more than the watermark's stroke width, in pixels")
    ap.add_argument("--method", choices=["telea", "ns"], default="telea")
    ap.add_argument("--radius", type=int, default=5)
    ap.add_argument("--grow", type=int, default=3, help="pixels to grow the mask so soft edges go too")
    ap.add_argument("--preview", help="write a before | mask | after strip here")
    a = ap.parse_args()
    if not a.box and not a.mask:
        ap.error("give --box or --mask")

    img = cv2.imread(a.input, cv2.IMREAD_UNCHANGED)
    if img is None:
        sys.exit(f"Cannot read {a.input}")
    alpha = None
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:
        alpha, img = img[:, :, 3], img[:, :, :3]

    boxes = [tuple(int(v) for v in b.split(",")) for b in a.box]
    mask = build_mask(img, boxes, a.detect, a.mask, a.stroke)
    if a.grow > 0:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * a.grow + 1, 2 * a.grow + 1))
        mask = cv2.dilate(mask, k)
    flag = cv2.INPAINT_TELEA if a.method == "telea" else cv2.INPAINT_NS
    out = cv2.inpaint(img, mask, a.radius, flag)
    if alpha is not None:
        out = np.dstack([out, alpha])
    if not cv2.imwrite(a.output, out):
        sys.exit(f"Cannot write {a.output}")
    if a.preview:
        m3 = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
        cv2.imwrite(a.preview, np.hstack([img, m3, out[:, :, :3]]))
    print(f"wrote {a.output} ({int((mask > 0).sum())} pixels inpainted)")


if __name__ == "__main__":
    main()
