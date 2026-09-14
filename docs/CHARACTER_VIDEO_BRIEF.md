# Director video — generation brief

> **Status.** Section 04 now works from the second clip, by a different route
> than this document assumed: rather than overlaying an iris on a locked-off
> plate, the cursor selects which frame of the clip's own gaze sweep to show.
> See [CHARACTER.md](CHARACTER.md). This brief stays relevant because a clip
> authored to it would give a wider, symmetric sweep and a longer usable range
> than the ~4 seconds currently in use — the failure analysis below is why the
> overlay approach was abandoned.

The interactive character in section 04 draws **our own iris** over the video's
eyes so the visitor's cursor controls where he looks. That illusion only holds
if the head is effectively locked in frame. A flat 2D iris cannot follow a head
that slides, rescales or turns, and the seam is visible instantly.

This document is the spec a candidate video must meet, and the prompt to
generate one.

---

## Why `director-gaze-reference.mp4` was rejected

Measured over its 10–20s window with `scripts/check-character-video.py`
(1280×720, 40 frames):

| Check | Budget | Measured | |
|---|---|---|---|
| Head stays locked in frame | ≤ 8px | **68px** | fail |
| Face does not rotate or rescale | correlation ≥ 0.97 | **0.793** | fail |
| Video's own gaze is fixed | ≤ 5px | **72px** | fail |
| Loop seam is invisible | ≤ 6.0 | **11.0** | fail |

In plain terms: the head drifts most of its own width across the clip, turns in
3D as it goes, and the character is already performing a left-to-right gaze of
his own. Overlaying pupils on that would produce two sets of eyes disagreeing
with each other — which is the exact failure the brief says to avoid ("the
final result must look like ONE coherent pair of eyes").

There is no usable sub-range. The longest stretch where the head holds within
6px is **zero frames**. It was also 20s, not the 5–6s expected.

The footage is good — it is simply a *performance* clip, and what this section
needs is a *plate*: a living but locked character we can drive.

---

## The prompt

Copy this verbatim. The constraint lines are load-bearing; every one of them
maps to a check above.

```
A cinematic 3D-animated character portrait of a male creative film director,
late 20s to mid 30s, warm olive skin, dark curly hair, short dark beard,
wearing large matte-black over-ear studio headphones and a dark charcoal hoodie.
Stylised realism — high-end animated feature film look, soft subsurface skin,
detailed hair strands, physically based lighting. Not photoreal, not cartoon.

FRAMING — LOCKED OFF
Static locked-off camera. No camera movement of any kind: no pan, no tilt,
no dolly, no push-in, no handheld, no shake, no zoom, no rack focus.
Head-and-shoulders portrait, centred. The head fills roughly 55-65% of the
frame height. Top of hair sits just below the top edge. Eyes positioned on the
upper third line. Shoulders visible at the bottom edge.

HEAD — MUST NOT MOVE
The head stays in exactly the same position for the entire duration.
No head turn, no head tilt, no nodding, no leaning in or out, no rotation
toward or away from camera. The face remains square to camera, front-on,
for every single frame. Treat the skull as if it were on a locked rig.

EYES — LOOKING STRAIGHT AT THE VIEWER, PERFECTLY STILL
Both eyes look directly into the lens for the entire duration.
The pupils do not move. No glancing left, no glancing right, no looking up or
down, no darting, no saccades, no following anything. Absolutely no
left-to-right eye movement. The gaze is fixed, neutral and attentive.
Eyes fully open, relaxed, not wide or startled.

BLINKING
Two or three natural blinks spread across the clip, at irregular intervals.
Each blink is fast — under 0.15 seconds closed. Eyes reopen to exactly the
same fixed forward gaze. No slow blinks, no winks, no squinting.

WHAT SHOULD MOVE — SUBTLE LIFE ONLY
Slow calm breathing in the shoulders and chest.
Individual hair strands and curls drifting very slightly.
A barely perceptible settle in the headphones.
Micro-expressions only: the faintest shift at the mouth corners and brow.
All of this is extremely subtle. Nothing in the frame should translate more
than a few pixels. The character is alive but still — like someone sitting
calmly, listening, watching you.

EXPRESSION
Calm, warm, quietly confident. A director listening to an idea.
Mouth closed or with the faintest hint of a smile. No talking, no mouth
movement, no dialogue, no laughing, no exaggerated expression change.

LIGHTING AND BACKGROUND
Solid pure black background, RGB 10,10,10, completely flat and empty.
No set, no props, no desk, no monitors, no bokeh, no particles, no smoke,
no lens flare, no light streaks, no vignette animation, no background motion.
Cinematic three-point lighting: soft warm key from front-left, cool subtle rim
on the right edge of the hair and headphones, gentle fill. Lighting is constant
and does not change, flicker or animate across the clip.

NO OVERLAYS
No text, no captions, no logos, no watermarks, no sparkles, no stars, no
UI elements, no letterboxing, no borders anywhere in frame.

LOOP
Seamless loop. The last frame must match the first frame exactly in head
position, expression, hair position and lighting, so the clip can repeat
continuously with no visible cut or jump.

DURATION AND FORMAT
8 seconds. 1920x1080, 30fps, H.264 MP4, high bitrate, no audio.
```

### If the generator ignores "no head movement"

That is the usual failure. Two things help:

- Regenerate with the head instruction placed **first**, before the description
  of the character.
- Ask for "a portrait that is almost a still photograph, with only breathing
  and hair movement" — framing it as a near-still often works better than
  listing motions to avoid.

A clip that fails only the loop check is still usable; ping-pong playback fixes
a seam. A clip that fails head lock or fixed gaze is not usable at all.

---

## Validating a candidate

```bash
# 1. Put the candidate where the dev server can serve it
cp candidate.mp4 public/character/candidate.mp4
npm run dev

# 2. Pull frames and score them
node scripts/extract-frames.mjs /character/candidate.mp4 /tmp/cand 0 0 40 1
python3 scripts/check-character-video.py /tmp/cand
```

All four checks must pass. The script prints the measured value against each
budget, so a near-miss tells you what to adjust in the prompt.

Thresholds are fractions of frame width, so they hold at any resolution:

| Check | Budget |
|---|---|
| Head translation | ≤ 0.6% of width |
| Face correlation across frames | ≥ 0.97 |
| Video's own gaze drift | ≤ 0.4% of width |
| First/last frame difference | ≤ 6.0 mean luma |

## What happens once a video passes

1. Drop it in as `public/character/director.mp4`.
2. Extract one clean frame and derive the iris, aperture and lid layers from
   **that character**, the same way `scripts/prepare-face-assets.py` does for
   the current one — the existing PNG assets are a different character and do
   not register against this face.
3. Bake a blink track: per-frame eye openness, so the interactive iris hides
   while the video's own lids are closed and reappears with the gaze intact.
4. Swap the video in behind the existing eye rig. The gaze, spring physics,
   masking and workflow in `components/sections/HowItsMade/` all stay as they
   are — only the base layer changes.
