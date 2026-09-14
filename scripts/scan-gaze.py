"""
Measure where the character is looking in every frame.

    node scripts/extract-frames.mjs /character/candidate.mp4 /tmp/scan 0 0 120 1
    python3 scripts/scan-gaze.py /tmp/scan [out.json]

WHY
---
Instead of drawing our own iris over the video, the cursor selects which frame
of the video to show. The character's real, fully rendered eyes do the looking,
so there is nothing to register and nothing to mask.

That needs a lookup table: for every frame, how far left or right is he
looking? This builds it.

METHOD
------
1. Track a nose/mouth band (never the eyes, whose motion is what we are
   measuring) to get the head's position in each frame.
2. Place eye boxes relative to that tracked position, so head movement is
   cancelled out.
3. Inside each eye box find the iris as the darkest cluster, and take its
   offset from the box centre.
4. Average the two eyes; that is the gaze for the frame.

Also reports eye openness, so blink frames can be excluded from the mapping.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

LUM = np.array([0.299, 0.587, 0.114], np.float32)


def load(path):
    rgb = np.asarray(Image.open(path).convert("RGB"), np.float32)
    return rgb, rgb @ LUM


def track(images, box, radius, step=2):
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
    return out


def iris_offset(rgb, gray, box):
    """Iris centroid inside an eye box, as a fraction of box size from centre."""
    x0, y0, x1, y1 = box
    g = gray[y0:y1, x0:x1]
    c = rgb[y0:y1, x0:x1]
    if g.size == 0:
        return None

    sat = c.max(2) - c.min(2)
    # Sclera: the bright, low-saturation part of the eye. If we cannot find
    # enough of it the lid is probably closed.
    sclera = (g > np.percentile(g, 72)) & (sat < 60)
    openness = float(sclera.mean())

    # Iris: dark, inside the eye opening. Restrict to rows where sclera exists
    # so eyebrows and lashes above the eye do not pull the centroid up.
    rows = np.where(sclera.any(axis=1))[0]
    if len(rows) < 3 or openness < 0.04:
        return None
    r0, r1 = rows.min(), rows.max() + 1

    band_g = g[r0:r1]
    dark = band_g < np.percentile(band_g, 22)
    ys, xs = np.nonzero(dark)
    if len(xs) < 12:
        return None

    h, w = g.shape
    cx = xs.mean() / w
    cy = (ys.mean() + r0) / h
    return cx - 0.5, cy - 0.5, openness


def main(frame_dir, out_path=None):
    files = sorted(Path(frame_dir).glob("*.png"))
    times = [float(f.stem.split("_")[-1]) for f in files]
    loaded = [load(f) for f in files]
    rgbs = [r for r, _ in loaded]
    grays = [g for _, g in loaded]
    H, W = grays[0].shape
    print(f"{len(files)} frames at {W}x{H}")

    fx0, fx1 = int(W * 0.36), int(W * 0.64)
    nose = (fx0, int(H * 0.55), fx1, int(H * 0.78))
    head = track(grays, nose, max(12, int(W * 0.08)))

    # Eye boxes in frame-0 coordinates, shifted per frame by the head track.
    EYE_L = (int(W * 0.375), int(H * 0.405), int(W * 0.475), int(H * 0.50))
    EYE_R = (int(W * 0.525), int(H * 0.405), int(W * 0.625), int(H * 0.50))

    rows = []
    for t, rgb, g, (dx, dy, ncc) in zip(times, rgbs, grays, head):
        vals = []
        opens = []
        for bx0, by0, bx1, by1 in (EYE_L, EYE_R):
            box = (bx0 + dx, by0 + dy, bx1 + dx, by1 + dy)
            r = iris_offset(rgb, g, box)
            if r:
                vals.append((r[0], r[1]))
                opens.append(r[2])
        if not vals:
            rows.append({"t": round(t, 3), "gaze": None, "open": 0.0,
                         "dx": dx, "dy": dy, "ncc": round(ncc, 3)})
            continue
        gx = float(np.mean([v[0] for v in vals]))
        gy = float(np.mean([v[1] for v in vals]))
        rows.append({"t": round(t, 3), "gaze": [round(gx, 4), round(gy, 4)],
                     "open": round(float(np.mean(opens)), 4),
                     "dx": dx, "dy": dy, "ncc": round(ncc, 3)})

    good = [r for r in rows if r["gaze"]]
    gx = np.array([r["gaze"][0] for r in good])
    print(f"\ngaze x: min {gx.min():+.3f}  max {gx.max():+.3f}  span {gx.max()-gx.min():.3f}")
    print(f"frames with a readable gaze: {len(good)}/{len(rows)}\n")

    print(f"{'t':>6} {'gazeX':>7} {'gazeY':>7} {'open':>6} {'dx':>4} {'ncc':>5}  bar")
    for r in rows:
        if not r["gaze"]:
            print(f"{r['t']:6.2f} {'--closed/unreadable--':>28} {r['dx']:4d} {r['ncc']:5.2f}")
            continue
        g0 = r["gaze"][0]
        pos = int((g0 + 0.5) * 40)
        bar = "".join("#" if i == max(0, min(39, pos)) else "-" for i in range(40))
        print(f"{r['t']:6.2f} {g0:+7.3f} {r['gaze'][1]:+7.3f} {r['open']:6.3f} "
              f"{r['dx']:4d} {r['ncc']:5.2f}  {bar}")

    if out_path:
        Path(out_path).write_text(json.dumps(rows, indent=1) + "\n")
        print(f"\nwrote {out_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
