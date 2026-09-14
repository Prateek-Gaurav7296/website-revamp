"""
Turn the director clip into a cursor-scrubbable frame set.

    node scripts/extract-frames.mjs /character/candidate.mp4 /tmp/new 0 4.15 100 1
    python3 scripts/build-gaze-frames.py /tmp/new

THE MAPPING
-----------
Every frame of the clip gets an equal slice of the section's width. Cursor at
one edge shows the first frame, a step right shows the next, and so on to the
far edge. The character's own rendered eyes do the looking, so there is no
overlay to register and nothing to mask.

The clip is used whole — no trim, no crop. Two things are corrected, neither of
which changes the framing:

  * The clip's background is RGB(20,20,20); the page is (10,10,10). Left alone
    the frame reads as a lighter panel sitting on top of the page, so every
    frame is shifted by the difference. The shift is ten levels and invisible
    on the face.
  * Even matched, a hard rectangle edge is visible against a flat ground, so
    the outer band fades to transparent. This fades, it does not crop: the
    affected margin is empty background on all four sides.

Outputs WebP frames plus a manifest into public/character/frames/.
"""

import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "character" / "frames"
MANIFEST = ROOT / "content" / "gaze-frames.json"

# The site's ground colour, and how much of each edge fades out to meet it.
STAGE_RGB = np.array([10.0, 10.0, 10.0], np.float32)
FEATHER = 0.045

WEBP_QUALITY = 74

LUM = np.array([0.299, 0.587, 0.114], np.float32)


def blend_into_stage(img):
    """Match the clip's black to the page's, and soften the frame edge."""
    arr = np.asarray(img.convert("RGB"), np.float32)
    h, w = arr.shape[:2]

    border = np.concatenate([
        arr[:6].reshape(-1, 3), arr[-6:].reshape(-1, 3),
        arr[:, :6].reshape(-1, 3), arr[:, -6:].reshape(-1, 3),
    ])
    arr = np.clip(arr + (STAGE_RGB - np.median(border, axis=0)), 0, 255)

    fx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / (w * FEATHER), 0, 1)
    fy = np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / (h * FEATHER), 0, 1)
    alpha = (np.outer(fy, fx) ** 0.85) * 255.0

    return Image.fromarray(np.dstack([arr, alpha]).clip(0, 255).astype(np.uint8), "RGBA")


def sclera_area(arr):
    """Rough eye openness, used only to report which frames are blinks."""
    g = arr @ LUM
    sat = arr.max(2) - arr.min(2)
    h, w = g.shape
    vals = []
    for x0f, x1f in ((0.34, 0.46), (0.50, 0.62)):
        x0, x1 = int(w * x0f), int(w * x1f)
        y0, y1 = int(h * 0.34), int(h * 0.50)
        vals.append(float(((g[y0:y1, x0:x1] > 150) & (sat[y0:y1, x0:x1] < 55)).mean()))
    return float(np.mean(vals))


def main(frame_dir):
    files = sorted(Path(frame_dir).glob("*.png"))
    if not files:
        sys.exit(f"no frames in {frame_dir}")

    images = [Image.open(f).convert("RGB") for f in files]
    arrays = [np.asarray(im, np.float32) for im in images]
    w, h = images[0].size
    print(f"{len(files)} frames at {w}x{h}")

    # Report blinks rather than dropping them: the brief is to map every frame,
    # and sweeping past a blink looks natural. It is only visible if the cursor
    # parks on that slice, which is a few percent of the width.
    areas = np.array([sclera_area(a) for a in arrays])
    blinks = np.nonzero(areas < np.median(areas) * 0.55)[0]
    if len(blinks):
        runs, start = [], blinks[0]
        for a, b in zip(blinks, blinks[1:]):
            if b != a + 1:
                runs.append((start, a))
                start = b
        runs.append((start, blinks[-1]))
        print("  blink frames: " + ", ".join(f"{a}-{b}" for a, b in runs))

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    for i, im in enumerate(images):
        blend_into_stage(im).save(
            OUT / f"{i:03d}.webp", "WEBP", quality=WEBP_QUALITY, method=6
        )

    total = sum(p.stat().st_size for p in OUT.glob("*.webp"))
    MANIFEST.write_text(json.dumps({
        "_generated": "scripts/build-gaze-frames.py — do not edit by hand",
        "frames": len(images),
        "width": w,
        "height": h,
        "aspect": round(w / h, 6),
        # Frame 0 has him looking to the VIEWER'S LEFT; the last frame to the
        # viewer's right. Confirm this by eye on the built frames — zoomed out
        # the iris offset is easy to read backwards.
        "sweep": "viewer-left-to-viewer-right",
        "blinkFrames": [int(i) for i in blinks],
    }, indent=2) + "\n")

    print(f"\nwrote {len(images)} frames to {OUT} ({total/1024/1024:.2f} MB, {w}x{h})")
    print(f"wrote {MANIFEST}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
