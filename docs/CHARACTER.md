# The creative director

Section 04, *How It's Made*, is built around a character who watches the
visitor while the five-stage workflow runs across his face. He is the signature
interaction on the site, and the only place with a personality of its own.

The intended moment is small: the visitor half-notices that the eyes moved,
looks again, and realises he is tracking the cursor. Everything below is in
service of that being believable — and of it never becoming a gimmick.

---

## The source art is not a rig

The supplied assets in `nextberry-character-assets/` look like separated layers
and are not. This is the single most important thing to understand before
touching this section.

| File | What it actually is |
|---|---|
| `face-base.png` | 1536×1024 head, keyed off a **white** background |
| `{side}-eye.png` | 185×170 eye socket with **the iris baked in**, looking off to one side |
| `{side}-pupil.png` | 100×100 **circular re-crop of the same pixels** — sclera, eyelid skin and all |
| `{side}-eye-closed.png` | A smeared ellipse: no lashes, no lid crease, skin tone that does not match the face |

So: translating `{side}-pupil.png` drags eyelid skin across the eyeball and
reveals the baked-in iris underneath, and dropping the closed-eye sprite on top
reads as a grey patch stuck over the eye.

`scripts/prepare-face-assets.py` turns that art into something animatable. It
does not invent new character art — everything it emits is derived from the
supplied files.

## What the prep script produces

```
public/character/
  face-base.png        de-fringed: white matte and keyed specks removed
  eye-{side}-open.png  the socket with the eyeball rebuilt as clean sclera
  iris-{side}.png      the iris disc alone, feathered, catchlight intact
  aperture-{side}.png  a soft mask of the eye opening
  lid-{side}.png       the closed lid, re-keyed to the aperture and colour-matched
content/face-geometry.json   every coordinate the component needs
```

Four problems it solves, each worth knowing about:

**Registration.** The cropped sprites carry no placement data. Their positions
were recovered by normalised cross-correlation against `face-base.png` — all
four open-eye layers match at correlation `1.0000`, so the numbers in
`EYE_ORIGIN` / `PUPIL_ORIGIN` are exact, not eyeballed.

**A clean eyeball.** The iris is cut out and the hole behind it refilled. Plain
diffusion flat-fills and loses the upper-lid shadow, which leaves the character
permanently startled, so the fill mirrors real sclera across the iris centre
first — each eye has a wide clean sclera on one side — and diffuses only what
mirroring cannot reach.

**Neutral gaze.** The art was drawn looking off to one side. Rest position is
recomputed as the centre of each eye's aperture, so a visitor with their cursor
in the middle gets looked at.

**The white matte.** `face-base.png` was keyed off white, leaving both a bright
fringe on every soft edge and opaque light-grey remnants in the gaps between
the curls. A luminance threshold only catches the brightest of those and leaves
a crusty lace around the silhouette, so the script does a proper soft white key
on the *minimum* channel — a pixel is background only if it is bright in all
three, which brown hair never is. The face is protected by an ellipse built
from the known eye positions rather than by a skin-tone test, because this
character's hair is warm brown and a skin-tone test protects exactly what needs
removing. There is a regression check for this: the key must not change a
single alpha value inside either eye box.

Re-run it only if the source art changes:

```bash
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/prepare-face-assets.py
```

The generated files are committed, so a normal checkout needs neither Python
nor the source art.

## Components

```
HowItsMade/
  index.tsx          the section: layering, entrance, mobile/desktop split
  CreativeFace.tsx   the coordinate system; owns nothing but layout
  Eye.tsx            one eye: socket, masked iris, lid
  useGaze.ts         pointer → normalised gaze, and the per-eye springs
  useBlink.ts        the blink schedule
  Workflow.tsx       the five stages on the line (desktop)
  WorkflowStep.tsx   one stage, expanding in place
  MobileWorkflow.tsx the same five stages as a tappable rail (touch)
```

### Keeping the layers registered

`CreativeFace` establishes one positioned container at the source aspect ratio.
Every child is placed in percentages of that container, and the iris travel is
a percentage of the eye box, so **scaling the face cannot make the eyes drift**
and no JavaScript measures anything. Adding a `width` to the face is the only
thing needed to resize the character.

The iris moves by translating a wrapper that spans the eye box; the wrapper is
masked by `aperture-{side}.png`, so the disc slides under the lids exactly like
a real eye instead of floating over the lashes.

### Gaze

The pointer writes into two `MotionValue`s, normalised to `[-1, 1]` against the
face's own width. **No React state is involved, so moving the mouse across this
section causes zero re-renders.** Each eye reads those through its own
`useSpring` with a slightly different config — high enough stiffness to feel
attentive, high enough damping that the iris settles rather than wobbling,
because overshoot on an eye reads as cartoon.

Travel is capped well below what the anatomy allows: about 10px horizontally
and 4px vertically at the rendered size. Vertical is deliberately less than
half of horizontal — people track sideways far more than up and down, and a big
vertical swing immediately looks like a puppet.

When the pointer leaves the stage, gaze is set back to zero and the same
springs carry the eyes home; nothing snaps.

### Blink

A `MotionValue` from 0 to 1, animated on a loop with gaps randomised between
2.5s and 4s — a fixed interval becomes visible within about three cycles. The
lid sweeps down over 70ms, holds for 95ms, and lifts over 110ms. Roughly one
blink in six is a double.

Blink and gaze are **independent by construction**: the lid animates over
whatever the irises are doing, and reopening leaves them exactly where they
were looking. That separation is what makes the character read as one creature
rather than two effects sharing a face.

### Layering

Back to front: ground → face → workflow line → stages → the open stage. The
workflow crosses at 61% of the face height — below the eyes, which must stay
unobstructed because they are the interaction.

A single gradient over the face does three jobs at once: it gives the workflow
type a dark field to sit on without putting a card behind it, it dissolves the
hard bottom edge of the cut-out, and it keeps the eyes the only fully lit thing
on screen. It is lighting, not a UI panel. Mobile crops the face much tighter
than desktop, so the two breakpoints need separate ramps — sharing one puts the
falloff straight across the eyes on a phone.

### Touch

There is no cursor, so the *active stage* carries the personality instead:
tapping a stage opens it and turns the character's head toward it, and
scrolling does the same as each stage passes the middle of the screen.

The head is `sticky` on mobile. Without it the character scrolls away before
the visitor reaches the stages and the whole point is never seen. The sticky
wrapper has to be the ancestor that also contains the stage list — a sticky
element can only travel inside its own parent — and the head sits *above* the
list, so stages dissolve under his jaw as they scroll past.

## Guard rails

`npm run shoot:face` drives a real browser and asserts on measured transforms.
Run it after any change here. A CSS tweak can leave the irises pinned, the lid
stuck open or the mask misaligned, and the page will still build and still look
correct in a still screenshot.

It checks: horizontal travel lands in 8–15px, the eyes are not mechanically
identical, vertical tracking is live and smaller than horizontal, the lid
reaches full closure at non-repeating intervals, reduced motion disables both,
and the phone layout has no overflow with the head still pinned.

## Things not to do

- **Do not flatten the character.** Face, eyes and irises stay independent.
- **Do not resize the eye layers.** They are registered to the face's
  coordinate system; scale the parent instead.
- **Do not reset the pupils after a blink**, and do not let a blink interrupt
  tracking.
- **Do not put the workflow over the eyes.** Everything else is negotiable.
- **Do not animate the pupils straight to the cursor.** The constraint and the
  lag are the effect.
