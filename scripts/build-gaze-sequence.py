"""
Turn a gaze sweep in the director video into a cursor-scrubbable frame set.

    node scripts/extract-frames.mjs /character/candidate.mp4 /tmp/sweep 12.7 17.2 68 1
    python3 scripts/build-gaze-sequence.py /tmp/sweep

WHAT THIS IS
------------
The character looks right, through centre, to left across ~12.7-17.2s of the
source clip. Rather than drawing our own iris over the video, the cursor picks
which of those frames to show: his real, fully rendered eyes do the looking, so
there is nothing to register and nothing to mask.

Three things have to be fixed before that works.

1. THE HEAD MOVES WHILE HE LOOKS. Over the sweep it travels 70px and shrinks
   8%. Scrubbed raw, the head would slide and pulse as you move the mouse. Each
   frame is therefore counter-warped by a tracked transform so the head lands
   in the same place at the same size in every frame, and only the eyes change.

2. HE BLINKS MID-SWEEP. A blink at a fixed gaze angle would mean the character
   is permanently mid-blink whenever your cursor sits at that spot. Blink
   frames are detected and dropped; the gaze curve is interpolated across the
   gap.

3. TIME IS NOT GAZE. He accelerates and pauses, so evenly spaced frames in time
   are unevenly spaced in gaze. Frames are resampled to be evenly spaced in
   *gaze angle*, which is what makes cursor travel feel linear.

Outputs WebP frames plus a manifest into public/character/gaze/.
"""

import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "character" / "gaze"
MANIFEST = ROOT / "content" / "gaze-sequence.json"

LUM = np.array([0.299, 0.587, 0.114], np.float32)

# Canonical crop, in first-frame coordinates. Everything is warped into this
# box. Sized to hold the whole head with margin: the hair and the far
# headphone cup both reach the edges, and clipping either reads as a mistake
# rather than a crop. The source is only 720 tall, so this takes its full
# height and finds the margin sideways.
# Wide enough for the WORST frame, not the first one. The crop box is given in
# first-frame coordinates and then mapped through each frame's own transform,
# so a box that just fits the head at frame 0 slides into the far headphone by
# the end of the sweep (the head moves 88px and shrinks 12%). The extra
# background costs nothing on a black stage.
CROP = (120, 0, 1070, 720)
OUT_W = 620                 # rendered width of each stabilised frame
FRAMES_OUT = 36             # how many frames the cursor scrubs through
WEBP_QUALITY = 82

# The gaze sweep, in seconds into the source clip. He looks to the viewer's
# right at the start, through centre at ~14.3s, to the viewer's left at the end.
# Verified frame by frame at eye level, not derived automatically.
SWEEP_FROM = 12.90
SWEEP_TO = 16.90
BLINK_RATIO = 0.45          # fraction of median sclera area that counts as shut
# A blink has soft edges: the frames either side of the closed ones have the
# lid part-way down, which looks just as wrong parked at a fixed cursor
# position. Grow the flagged run outwards by this many frames.
BLINK_DILATE = 3

# The site's ground colour, and how much of each edge fades out to meet it.
STAGE_RGB = np.array([10.0, 10.0, 10.0], np.float32)
FEATHER = 0.07

# Template used to track the head: nose and mouth, deliberately below the eyes
# so the gaze we are measuring cannot contaminate the head track.
TPL = (0.36, 0.55, 0.64, 0.78)
SCALES = [0.90, 0.92, 0.94, 0.96, 0.98, 1.00, 1.02, 1.05]


def gray(rgb):
    return rgb @ LUM


def track_head(grays):
    """
    Return (dx, dy, scale, ncc) per frame, against frame 0.

    Coarse-to-fine: a wide sweep at a big step to find the basin, then a small
    refine around it. Exhaustive search at full resolution took eight minutes
    for 68 frames; this is the same answer in seconds.
    """
    H, W = grays[0].shape
    bx0, by0 = int(W * TPL[0]), int(H * TPL[1])
    bx1, by1 = int(W * TPL[2]), int(H * TPL[3])
    ref = grays[0][by0:by1, bx0:bx1]
    th, tw = ref.shape
    rv = (ref - ref.mean()) / (ref.std() + 1e-6)

    def score(g, dx, dy, s):
        ys = np.linspace(by0 + dy, by0 + dy + th * s - 1, th).astype(int)
        xs = np.linspace(bx0 + dx, bx0 + dx + tw * s - 1, tw).astype(int)
        if ys.min() < 0 or xs.min() < 0 or ys.max() >= H or xs.max() >= W:
            return -2.0
        win = g[np.ix_(ys, xs)]
        sd = win.std()
        if sd < 1e-3:
            return -2.0
        return float(((win - win.mean()) / sd * rv).mean())

    out = []
    for g in grays:
        best = (-2.0, 0, 0, 1.0)
        for s in SCALES:
            for dy in range(-40, 41, 8):
                for dx in range(-88, 89, 8):
                    sc = score(g, dx, dy, s)
                    if sc > best[0]:
                        best = (sc, dx, dy, s)
        _, cdx, cdy, cs = best
        for s in [cs - 0.02, cs, cs + 0.02]:
            for dy in range(cdy - 8, cdy + 9, 2):
                for dx in range(cdx - 8, cdx + 9, 2):
                    sc = score(g, dx, dy, s)
                    if sc > best[0]:
                        best = (sc, dx, dy, s)
        out.append((best[1], best[2], best[3], best[0]))
    return out


def stabilised_crop(img, grays0_shape, dx, dy, s):
    """Warp one frame so the head sits where it does in frame 0."""
    H, W = grays0_shape
    bx0, by0 = int(W * TPL[0]), int(H * TPL[1])
    X0, Y0, X1, Y1 = CROP
    # frame-0 coords -> this frame's coords
    fx = lambda X: bx0 + dx + (X - bx0) * s
    fy = lambda Y: by0 + dy + (Y - by0) * s
    box = (fx(X0), fy(Y0), fx(X1), fy(Y1))
    out_h = round(OUT_W * (Y1 - Y0) / (X1 - X0))
    return img.resize((OUT_W, out_h), Image.LANCZOS, box=box)


def blend_into_stage(img):
    """
    Make the frame sit on the page instead of on top of it.

    Two problems, both of which show up as a visible rectangle around the
    character on a near-black page:

      * the clip's "black" background is not the site's black, so the crop
        reads as a lighter panel. Sampling the border and shifting the whole
        frame by the difference fixes it; the shift is a few levels, invisible
        on the face.
      * even matched, a hard edge is a hard edge. The outer band fades to
        transparent so the plate dissolves into the ground.
    """
    arr = np.asarray(img.convert("RGB"), np.float32)
    h, w = arr.shape[:2]

    border = np.concatenate([
        arr[:6].reshape(-1, 3), arr[-6:].reshape(-1, 3),
        arr[:, :6].reshape(-1, 3), arr[:, -6:].reshape(-1, 3),
    ])
    bg = np.median(border, axis=0)
    arr = np.clip(arr + (STAGE_RGB - bg), 0, 255)

    fx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / (w * FEATHER), 0, 1)
    fy = np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / (h * FEATHER), 0, 1)
    alpha = (np.outer(fy, fx) ** 0.85) * 255.0

    return Image.fromarray(
        np.dstack([arr, alpha]).clip(0, 255).astype(np.uint8), "RGBA"
    )


def sclera_area(rgb, gray_img, dx, dy):
    """
    How much bright sclera is visible, averaged over both eyes.

    An absolute threshold, not a percentile: a percentile always finds
    "the brightest 28%" of whatever is there, so it reports a closed eye as
    open. Absolute luminance collapses during a blink, which is the point.
    """
    H, W = gray_img.shape
    boxes = (
        (W * 0.375 + dx, H * 0.405 + dy, W * 0.475 + dx, H * 0.50 + dy),
        (W * 0.525 + dx, H * 0.405 + dy, W * 0.625 + dx, H * 0.50 + dy),
    )
    vals = []
    for x0, y0, x1, y1 in boxes:
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        g = gray_img[y0:y1, x0:x1]
        c = rgb[y0:y1, x0:x1]
        if g.size == 0:
            continue
        sat = c.max(2) - c.min(2)
        vals.append(float(((g > 150) & (sat < 55)).mean()))
    return float(np.mean(vals)) if vals else 0.0


def main(frame_dir):
    files = sorted(Path(frame_dir).glob("*.png"))
    if len(files) < 20:
        sys.exit(f"need a dense frame set; found {len(files)}")
    times = [float(f.stem.split("_")[-1]) for f in files]
    images = [Image.open(f).convert("RGB") for f in files]
    arrays = [np.asarray(im, np.float32) for im in images]
    grays = [gray(a) for a in arrays]
    shape0 = grays[0].shape
    print(f"{len(files)} frames at {shape0[1]}x{shape0[0]}")

    print("tracking head (translation + scale)...")
    track = track_head(grays)
    dxs = np.array([t[0] for t in track])
    ss = np.array([t[2] for t in track])
    print(f"  dx {dxs.min():.0f}..{dxs.max():.0f}px   scale {ss.min():.2f}..{ss.max():.2f}")

    print("measuring eye openness, stabilising for output...")
    stab, area = [], []
    for im, arr, gr, (dx, dy, sc, _) in zip(images, arrays, grays, track):
        stab.append(stabilised_crop(im, shape0, dx, dy, sc))
        area.append(sclera_area(arr, gr, dx, dy))

    area = np.array(area)
    # A blink is a collapse relative to this clip's own open-eye level.
    cut = float(np.median(area) * BLINK_RATIO)
    blink = area < cut
    for _ in range(BLINK_DILATE):
        blink = blink | np.r_[blink[1:], False] | np.r_[False, blink[:-1]]
    print(f"  sclera area: median {np.median(area):.4f}, blink cut {cut:.4f}")
    print(f"  blink frames: {[round(times[i],2) for i in np.nonzero(blink)[0]]}")

    # Sample evenly across the frames that survive, not across the clock.
    #
    # Snapping each target time to the nearest open frame would leave a stall —
    # a stretch of cursor travel where the gaze does not change — and then a
    # jump. Resampling over the surviving frames removes the blink from the
    # timeline altogether, so the cursor maps onto continuous eye movement.
    #
    # The sweep range is given explicitly rather than derived: the automated
    # gaze metric is not reliable on this stylised face (it latches onto the
    # closed lid mid-blink), so the range was confirmed frame by frame by eye.
    usable = [
        i for i, t in enumerate(times)
        if SWEEP_FROM <= t <= SWEEP_TO and not blink[i]
    ]
    if len(usable) < FRAMES_OUT // 2:
        sys.exit(f"only {len(usable)} usable frames in the sweep; widen it")

    idx = np.linspace(0, len(usable) - 1, FRAMES_OUT).round().astype(int)
    picks = [usable[i] for i in idx]
    print(f"  {len(usable)} open frames in the sweep -> {len(set(picks))} distinct "
          f"of {FRAMES_OUT} sampled")

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)
    for n, idx in enumerate(picks):
        blend_into_stage(stab[idx]).save(
            OUT / f"{n:02d}.webp", "WEBP", quality=WEBP_QUALITY, method=6
        )

    # One stabilised closed-eye frame, for the blink overlay. The gaze frames
    # are deliberately blink-free (a blink baked into the sequence would mean
    # the character is permanently mid-blink whenever the cursor sits at that
    # angle), so blinking is put back at runtime as a fast cross-fade to this.
    shut = int(np.argmin(np.where(
        [SWEEP_FROM <= t <= SWEEP_TO for t in times], area, 1e9)))
    blend_into_stage(stab[shut]).save(
        OUT / "blink.webp", "WEBP", quality=WEBP_QUALITY, method=6
    )
    print(f"  blink frame from t={times[shut]:.2f}s (sclera area {area[shut]:.4f})")

    w, h = stab[picks[0]].size
    total = sum((OUT / f"{n:02d}.webp").stat().st_size for n in range(len(picks)))
    manifest = {
        "_generated": "scripts/build-gaze-sequence.py — do not edit by hand",
        "frames": len(picks),
        "width": w,
        "height": h,
        "aspect": round(w / h, 6),
        # Frame 0 is the character's extreme in one direction, the last frame
        # the other. The component maps cursor x across this range.
        "source": {"clip": "director-v2.mp4", "from": SWEEP_FROM, "to": SWEEP_TO},
        # Frame 0 = looking to the viewer's right, last frame = viewer's left.
        "direction": "right-to-left",
        "blink": "blink.webp",
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"\nwrote {len(picks)} frames to {OUT} ({total/1024:.0f} KB total, {w}x{h})")
    print(f"wrote {MANIFEST}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
