"""
Prepare the creative-director character layers for independent animation.

WHY THIS EXISTS
---------------
The supplied assets in `nextberry-character-assets/` are not cleanly separated:

  * `{side}-eye.png` is the eye socket with the iris **baked in**, looking off
    to one side.
  * `{side}-pupil.png` is not an isolated iris — it is a 100x100 circular
    re-crop of the same eye region, sclera and eyelid skin included.

Translating `{side}-pupil.png` directly would drag skin across the eyeball and
reveal the baked-in iris underneath. So this script derives three things from
the supplied art (it does not invent any new character art):

  1. `eye-{side}-open.png`  — the supplied eye with the eyeball inpainted to
     clean sclera, so a moving iris has something to travel over.
  2. `iris-{side}.png`      — the iris disc cut out of the supplied pupil crop,
     with a feathered edge. Catchlight preserved.
  3. `aperture-{side}.png`  — a soft mask of the eye opening, used as a CSS
     mask so the iris is clipped by the eyelids exactly like a real eye.

It also writes `content/face-geometry.json`: every coordinate the component needs,
expressed as percentages of the face canvas, so there is exactly one source of
truth for registration.

USAGE
-----
    python3 scripts/prepare-face-assets.py [SOURCE_DIR]

Needs Pillow and numpy. Outputs to public/character/. Re-run only if the source
art changes; the generated files are committed.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(sys.argv[1] if len(sys.argv) > 1
           else "/Users/prateekgaurav/Desktop/assets/nextberry-character-assets")
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "character"
# Geometry is data the component imports, not an asset the browser fetches.
GEOMETRY_OUT = ROOT / "content" / "face-geometry.json"

FACE_W, FACE_H = 1536, 1024

# Sprite origins on the face canvas, recovered by normalised cross-correlation
# against face-base.png (correlation 1.0000 for all four open-eye layers).
# The closed-eye sprites share their open counterpart's box — same dimensions.
EYE_ORIGIN = {"left": (560, 365), "right": (790, 365)}
PUPIL_ORIGIN = {"left": (634, 427), "right": (854, 427)}

# Iris centre within the 100x100 pupil crop, found by scanning for the
# sclera->iris luminance transition through the pupil core.
IRIS_IN_PUPIL = {"left": (53, 48), "right": (57, 43)}
IRIS_RADIUS = 17          # px on the face canvas
IRIS_FEATHER = 1.4        # px of alpha falloff at the iris edge

# Ceiling on iris travel, in face-canvas px. The anatomical budget (how far the
# disc slides before the lids clip it) is roughly 23–27px, but a real eye barely
# moves; taking the whole budget reads as googly. At the face's rendered width
# this works out to ~14px of travel, and it scales with the face because every
# value downstream is a percentage.
#
# Vertical is deliberately less than half of horizontal: people track sideways
# far more than they track up and down, and a large vertical swing immediately
# looks like a puppet.
MAX_TRAVEL_X = 16.0
MAX_TRAVEL_Y = 7.0

# Real eyes are not mechanically identical. A 4% difference is invisible as a
# difference but stops the pair reading as one rigid object.
TRAVEL_GAIN = {"left": 1.0, "right": 0.96}

# White-key ramp for face-base, measured off the hair fringe: pixels whose
# minimum channel is at or above KEY_WHITE_HI are keyed background and go fully
# transparent; at or below KEY_WHITE_LO they are kept untouched.
KEY_WHITE_LO = 150.0
KEY_WHITE_HI = 208.0

LUM = np.array([0.299, 0.587, 0.114], np.float32)


def luminance(rgb):
    return rgb @ LUM


def dilate(mask, k):
    out = mask.copy()
    for _ in range(k):
        p = np.pad(out, 1, constant_values=False)
        out = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | out
    return out


def erode(mask, k):
    return ~dilate(~mask, k)


def largest_component(mask, seed_yx):
    """Flood fill from a seed so stray highlights elsewhere are discarded."""
    h, w = mask.shape
    out = np.zeros_like(mask)
    sy, sx = seed_yx
    if not mask[sy, sx]:
        return mask
    stack = [(sy, sx)]
    out[sy, sx] = True
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                stack.append((ny, nx))
    return out


def inpaint(rgb, known, region, mirror_axis, iterations=700):
    """
    Rebuild the eyeball where the iris was.

    Diffusion alone flat-fills: it loses the veins and, worse, the upper-lid
    shadow, which leaves the character permanently startled. So we mirror real
    sclera across the iris centre first — each eye has a wide clean sclera on
    one side of the iris — and only diffuse what mirroring cannot reach.
    Finally the seam is relaxed so the mirrored patch does not show an edge.
    """
    out = rgb.copy()
    fill = region & ~known
    if not fill.any():
        return out

    h, w = fill.shape
    yy, xx = np.mgrid[0:h, 0:w]
    src_x = np.clip((2 * mirror_axis - xx).round().astype(int), 0, w - 1)
    mirror_ok = fill & known[yy, src_x]
    out[mirror_ok] = rgb[yy[mirror_ok], src_x[mirror_ok]]

    # Whatever the mirror could not source, diffuse from everything solid.
    solid = known | mirror_ok
    rest = fill & ~mirror_ok
    if rest.any():
        out[rest] = rgb[known].mean(axis=0)
        for _ in range(iterations):
            p = np.pad(out, ((1, 1), (1, 1), (0, 0)), mode="edge")
            avg = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) * 0.25
            out[rest] = avg[rest]

    # Relax the mirror seam only — `known` pixels stay untouched.
    for _ in range(40):
        p = np.pad(out, ((1, 1), (1, 1), (0, 0)), mode="edge")
        avg = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) * 0.25
        out[fill] = out[fill] * 0.45 + avg[fill] * 0.55
    return out


def defringe(img, bg=255.0, erode_px=1):
    """
    Strip the white matte halo from a cut-out.

    `face-base.png` was keyed off a white background, so every partially
    transparent edge pixel still carries white in its RGB. Composited over the
    site's near-black ground that reads as a bright fringe around the hair,
    which is the first thing you notice and the first thing that makes a
    cut-out look cheap.

    Un-premultiplying against white recovers the true edge colour:
        C_true = (C_observed - (1 - a) * bg) / a
    A one-pixel alpha erode then removes the last sliver of keyed background.
    """
    arr = np.asarray(img.convert("RGBA"), np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4] / 255.0

    safe = np.maximum(a, 0.03)
    rgb = np.clip((rgb - (1.0 - a) * bg) / safe, 0, 255)

    if erode_px:
        m = Image.fromarray(arr[..., 3].astype(np.uint8), "L")
        m = m.filter(ImageFilter.MinFilter(1 + 2 * erode_px))
        a8 = np.asarray(m, np.float32)
    else:
        a8 = arr[..., 3]

    # Push near-transparent pixels fully clear so no ghost outline survives.
    a8 = np.where(a8 < 12, 0, a8)

    # The key also left background *inside* the hair: not just pure white
    # specks but a whole range of light greys (RGB ~215,211,204) sitting in the
    # gaps between the curls. A luminance threshold only catches the brightest
    # of those and leaves a crusty lace around the silhouette, so this does a
    # proper soft white key instead.
    #
    # "Whiteness" is the *minimum* channel: only a pixel that is bright in all
    # three channels is background. Brown hair, however light, always has a low
    # blue channel and survives.
    #
    # The protected region is geometric, not colour-based: this character's
    # hair is warm brown, so a skin-tone heuristic classifies the hair as skin
    # and protects exactly what we are trying to remove. An ellipse built from
    # the known eye positions covers forehead to chin, including the sclera —
    # the one thing here that is legitimately white.
    eye_l = EYE_ORIGIN["left"][0]
    eye_r = EYE_ORIGIN["right"][0] + 190
    span = eye_r - eye_l
    fcx, fcy = (eye_l + eye_r) / 2, EYE_ORIGIN["left"][1] + span * 0.46
    yy, xx = np.mgrid[0:rgb.shape[0], 0:rgb.shape[1]]
    # Sized to the skin, not to the hair: wide enough to cover both eye boxes
    # (and therefore the sclera) with margin, narrow enough that the curls at
    # the temples are still keyed.
    protected = (((xx - fcx) / (span * 0.68)) ** 2
                 + ((yy - fcy) / (span * 1.02)) ** 2) <= 1.0

    whiteness = rgb.min(axis=2)
    # Ramp rather than a cliff, so the silhouette keeps soft edges.
    keep = np.clip((KEY_WHITE_HI - whiteness) / (KEY_WHITE_HI - KEY_WHITE_LO), 0.0, 1.0)
    keep = np.where(protected, 1.0, keep)

    # Recolour before attenuating. Feathering leaves a rim of partial alpha, and
    # a partially transparent *white* pixel over a dark ground is grey — which
    # is the lacy halo that makes a cut-out look crusty. Darken it first and the
    # rim disappears.
    shade = keep[..., None]
    rgb = rgb * shade + np.array([16.0, 13.0, 11.0]) * (1.0 - shade)
    a8 = a8 * keep
    a8 = np.where(a8 < 10, 0, a8)

    return Image.fromarray(np.dstack([rgb, a8]).clip(0, 255).astype(np.uint8), "RGBA")


def build_lid(side, aperture, eye_rgb, eye_alpha):
    """
    Rebuild the closed lid.

    The supplied `{side}-eye-closed.png` is a smeared ellipse with no lashes,
    no lid crease and a skin tone that does not match the face — dropped in
    literally it reads as a grey patch stuck over the eye. Two fixes, both of
    which keep the supplied art as the source of the lid's texture:

      * clip it to the eye's own aperture instead of its own ellipse, so its
        edge lands exactly on the real lid line rather than on a hard oval;
      * gain-match its colour to the eyelid skin sampled from the surrounding
        face, so it sits in the same light as everything around it.
    """
    lid = np.asarray(Image.open(SRC / f"{side}-eye-closed.png").convert("RGBA"), np.float32)
    lrgb = lid[..., :3]
    core = lid[..., 3] > 240

    # Skin immediately around the eye opening — the light the lid must match.
    ring = dilate(aperture, 7) & ~dilate(aperture, 2) & (eye_alpha > 200)
    if ring.any() and core.any():
        gain = eye_rgb[ring].mean(axis=0) / (lrgb[core].mean(axis=0) + 1e-6)
        lrgb = lrgb * np.clip(gain, 0.75, 1.35)

    # Alpha comes from the aperture, softened, so the lid fills the opening and
    # fades out under the lashes instead of drawing its own outline.
    m = Image.fromarray((aperture * 255).astype(np.uint8), "L")
    m = m.filter(ImageFilter.GaussianBlur(2.2))
    a = np.asarray(m, np.float32)

    out = np.dstack([lrgb, a]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(OUT / f"lid-{side}.png")


def build_eye(side, report):
    eye_img = Image.open(SRC / f"{side}-eye.png").convert("RGBA")
    eye = np.asarray(eye_img, np.float32)
    rgb, alpha = eye[..., :3].copy(), eye[..., 3]
    h, w = rgb.shape[:2]

    ox = PUPIL_ORIGIN[side][0] - EYE_ORIGIN[side][0]
    oy = PUPIL_ORIGIN[side][1] - EYE_ORIGIN[side][1]
    icx = ox + IRIS_IN_PUPIL[side][0]
    icy = oy + IRIS_IN_PUPIL[side][1]

    yy, xx = np.mgrid[0:h, 0:w]
    dist = np.hypot(xx - icx, yy - icy)

    lum = luminance(rgb)
    sat = rgb.max(2) - rgb.min(2)
    sclera = (lum > 145) & (sat < 50) & (alpha > 200)

    iris_disc = dist <= IRIS_RADIUS + 2
    aperture = erode(dilate(sclera | iris_disc, 3), 3)
    aperture = largest_component(aperture, (int(icy), int(icx)))

    # Known-good eyeball: sclera, minus a ring around the iris so the limbus
    # (the dark rim) never bleeds back into the fill.
    known = sclera & (dist > IRIS_RADIUS + 4)
    filled = inpaint(rgb, known, aperture, mirror_axis=icx)

    open_eye = np.dstack([filled, alpha]).clip(0, 255).astype(np.uint8)
    Image.fromarray(open_eye, "RGBA").save(OUT / f"eye-{side}-open.png")

    # Aperture mask, feathered, for CSS mask-image.
    m = Image.fromarray((aperture * 255).astype(np.uint8), "L")
    m = m.filter(ImageFilter.GaussianBlur(1.1))
    Image.merge("RGBA", (m, m, m, m)).save(OUT / f"aperture-{side}.png")

    # --- iris disc, cut from the supplied pupil crop ---
    pup = np.asarray(Image.open(SRC / f"{side}-pupil.png").convert("RGBA"), np.float32)
    pcx, pcy = IRIS_IN_PUPIL[side]
    r = IRIS_RADIUS
    size = r * 2 + 4
    y0, x0 = int(pcy - size / 2), int(pcx - size / 2)
    patch = pup[y0:y0 + size, x0:x0 + size, :3]

    gy, gx = np.mgrid[0:size, 0:size]
    d = np.hypot(gx - (pcx - x0), gy - (pcy - y0))
    a = np.clip((r - d) / IRIS_FEATHER + 0.5, 0, 1) * 255

    iris = np.dstack([patch, a]).clip(0, 255).astype(np.uint8)
    Image.fromarray(iris, "RGBA").save(OUT / f"iris-{side}.png")

    build_lid(side, aperture, rgb, alpha)

    ys, xs = np.nonzero(aperture)
    # Neutral gaze: centre of the eye opening, not where the art was drawn
    # looking. Clamped so the disc cannot start outside the aperture.
    nx = float(np.clip(xs.mean(), xs.min() + r, xs.max() - r))
    ny = float(np.clip(ys.mean(), ys.min() + r * 0.6, ys.max() - r * 0.6))

    ex, ey = EYE_ORIGIN[side]

    # Anatomical budget: how far the disc slides before the lids clip it.
    room_x = min(nx - xs.min(), xs.max() - nx) - r - 2
    room_y = min(ny - ys.min(), ys.max() - ny) - r * 0.6 - 1
    gain = TRAVEL_GAIN[side]
    travel_x = max(0.0, min(room_x, MAX_TRAVEL_X * gain))
    travel_y = max(0.0, min(room_y, MAX_TRAVEL_Y * gain))

    # Everything below the eye box is expressed as a percentage OF THE EYE BOX.
    # The component translates a wrapper that spans the eye box, so percentages
    # scale with the face automatically — no measuring, no drift.
    report[side] = {
        "eye": {
            "x": round(ex / FACE_W * 100, 4), "y": round(ey / FACE_H * 100, 4),
            "w": round(w / FACE_W * 100, 4), "h": round(h / FACE_H * 100, 4),
        },
        "iris": {
            "x": round(nx / w * 100, 4),       # neutral centre, % of eye box
            "y": round(ny / h * 100, 4),
            "w": round(size / w * 100, 4),     # iris diameter, % of eye width
        },
        "travel": {
            "x": round(travel_x / w * 100, 4), # max displacement, % of eye box
            "y": round(travel_y / h * 100, 4),
        },
    }
    print(f"{side:5s} aperture x {xs.min()}..{xs.max()} y {ys.min()}..{ys.max()} "
          f"| neutral ({nx:.1f},{ny:.1f}) | travel {travel_x:.1f}px/{travel_y:.1f}px "
          f"= {report[side]['travel']}% of eye box")


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    face = defringe(Image.open(SRC / "face-base.png"))
    face.save(OUT / "face-base.png")

    report = {}
    for side in ("left", "right"):
        build_eye(side, report)

    geometry = {
        "_generated": "scripts/prepare-face-assets.py — do not edit by hand",
        "canvas": {"w": FACE_W, "h": FACE_H, "aspect": round(FACE_W / FACE_H, 6)},
        "eyes": report,
    }
    GEOMETRY_OUT.write_text(json.dumps(geometry, indent=2) + "\n")
    print(f"\nwrote {OUT}\nwrote {GEOMETRY_OUT}")


if __name__ == "__main__":
    main()
