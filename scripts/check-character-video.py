"""
Decide whether a candidate director video can carry a cursor-controlled gaze.

    node scripts/extract-frames.mjs /character/candidate.mp4 /tmp/cand 0 0 60 1
    python3 scripts/check-character-video.py /tmp/cand

WHY THIS EXISTS
---------------
The interactive character works by drawing our own iris over the video's eyes.
That only holds together if the head is effectively locked in frame: a flat
2D iris cannot follow a head that slides, rescales or turns, and the visitor
sees the seam immediately.

So a video is usable only if:

  1. the head barely translates,
  2. the face does not rotate or rescale (measured as correlation against the
     first frame — anything that is not pure translation shows up as a drop),
  3. the video's OWN eyes hold still, because a pre-recorded gaze underneath
     our overlay fights it, and
  4. the first and last frames match, so the loop has no visible cut.

Thresholds are expressed as a fraction of frame width so they hold at any
resolution.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

LUM = np.array([0.299, 0.587, 0.114], np.float32)

# Budgets, as a fraction of frame width unless stated.
MAX_TRANSLATION = 0.006     # 0.6% of width — ~8px at 1280
MIN_FACE_NCC = 0.97         # below this the face is rotating or rescaling
MAX_EYE_DRIFT = 0.004       # the video's own gaze must be essentially fixed
MAX_LOOP_SEAM = 6.0         # mean abs luma difference, first vs last frame


def gray(path):
    return np.asarray(Image.open(path).convert("RGB"), np.float32) @ LUM


def track(images, box, radius, step=2):
    """NCC-track a template from frame 0. Returns (dx, dy, ncc) per frame."""
    x0, y0, x1, y1 = box
    ref = images[0][y0:y1, x0:x1]
    th, tw = ref.shape
    rv = (ref - ref.mean()) / (ref.std() + 1e-6)
    H, W = images[0].shape

    out = []
    for g in images:
        best, bx, by = -2.0, 0, 0
        for dy in range(-radius, radius + 1, step):
            for dx in range(-radius, radius + 1, step):
                y, x = y0 + dy, x0 + dx
                if y < 0 or x < 0 or y + th > H or x + tw > W:
                    continue
                win = g[y : y + th, x : x + tw]
                sd = win.std()
                if sd < 1e-3:
                    continue
                s = float(((win - win.mean()) / sd * rv).mean())
                if s > best:
                    best, bx, by = s, dx, dy
        out.append((bx, by, best))
    return np.array(out, dtype=np.float32)


def main(frame_dir):
    files = sorted(Path(frame_dir).glob("*.png"))
    if len(files) < 8:
        sys.exit(f"need at least 8 frames in {frame_dir}, found {len(files)}")

    images = [gray(f) for f in files]
    H, W = images[0].shape
    print(f"{len(files)} frames at {W}x{H}\n")

    # Face box: the middle of the frame, which is where a head fills it.
    fx0, fx1 = int(W * 0.36), int(W * 0.64)
    # Nose/mouth band — deliberately below the eyes so the video's own gaze
    # cannot contaminate the head-motion measurement.
    nose = (fx0, int(H * 0.55), fx1, int(H * 0.78))
    # Eye band, to measure the video's own gaze separately.
    eyes = (fx0, int(H * 0.38), fx1, int(H * 0.54))

    radius = max(12, int(W * 0.08))
    head = track(images, nose, radius)
    gaze = track(images, eyes, radius)

    trans = max(head[:, 0].max() - head[:, 0].min(), head[:, 1].max() - head[:, 1].min())
    face_ncc = head[:, 2].min()
    eye_drift = max(gaze[:, 0].max() - gaze[:, 0].min(), gaze[:, 1].max() - gaze[:, 1].min())
    seam = float(np.abs(images[0] - images[-1]).mean())

    checks = [
        ("head stays locked in frame", trans <= MAX_TRANSLATION * W,
         f"{trans:.0f}px moved, budget {MAX_TRANSLATION * W:.0f}px"),
        ("face does not rotate or rescale", face_ncc >= MIN_FACE_NCC,
         f"min correlation {face_ncc:.3f}, need >= {MIN_FACE_NCC}"),
        ("video's own gaze is fixed", eye_drift <= MAX_EYE_DRIFT * W,
         f"{eye_drift:.0f}px of eye movement, budget {MAX_EYE_DRIFT * W:.0f}px"),
        ("loop seam is invisible", seam <= MAX_LOOP_SEAM,
         f"first/last frame differ by {seam:.1f}, budget {MAX_LOOP_SEAM}"),
    ]

    failed = 0
    for label, ok, detail in checks:
        print(f"{' ok ' if ok else 'FAIL'}  {label} — {detail}")
        failed += 0 if ok else 1

    print()
    if failed:
        print(f"{failed} of {len(checks)} checks failed: this video cannot carry an\n"
              "interactive gaze overlay. See docs/CHARACTER_VIDEO_BRIEF.md.")
    else:
        print("usable as an interactive gaze base.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
