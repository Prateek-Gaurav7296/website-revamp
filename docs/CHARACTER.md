# The creative director

Section 04, *How It's Made*, is built around a character who watches the
visitor while the five-stage workflow runs across his face. He is the signature
interaction on the site.

The intended moment is small: the visitor half-notices that he looked, looks
again, and realises he is following the cursor.

---

## How it works: the cursor picks the frame

The obvious approach — draw our own iris over a video of a face — does not
survive contact with real footage. The head moves while he looks (88px of
travel and 12% of scale across the sweep we use), and a flat 2D iris cannot
follow a head that slides, rescales or turns. The seam is visible immediately.

So the direction is inverted. **The source clip already contains a gaze sweep:
he looks to the viewer's right, through centre, to the viewer's left. The
cursor chooses which frame of that sweep to show.** His real, fully rendered
eyes do the looking, which means:

- nothing to register, nothing to mask, no second pair of eyes to disagree with
- the lighting, hair, headphones and head pose are genuinely his
- the gaze is as expressive as the animation was, because it *is* the animation

`scripts/build-gaze-sequence.py` turns ~4 seconds of clip into 36 WebP frames
(~720 KB total) plus `content/gaze-sequence.json`.

### What the builder has to fix

**The head moves while he looks.** Each frame is counter-warped by a tracked
transform (translation and scale, found by coarse-to-fine cross-correlation on
a nose/mouth template — deliberately *not* the eyes, whose motion is the thing
being measured) so the head lands in the same place at the same size in every
frame. Only the eyes change.

**He blinks mid-sweep.** A blink baked into the sequence would mean the
character is permanently mid-blink whenever the cursor sits at that angle.
Blink frames are detected by absolute sclera area — not a percentile, which
always finds "the brightest 28%" of whatever is there and so reports a closed
eye as open — dilated outwards to catch the part-closed frames either side, and
dropped. Blinking is put back at runtime.

**Time is not gaze.** He accelerates and pauses, so frames evenly spaced in
time are unevenly spaced in gaze. Resampling over the surviving frames makes
cursor travel map onto continuous eye movement, and removes the blink from the
timeline rather than leaving a stall where the gaze stops responding.

**The clip's black is not the page's black.** Sampling the border and shifting
each frame by the difference removes the visible panel edge; the outer band
then fades to transparent so the plate dissolves into the ground.

### What is not automated

The sweep range (12.9s–16.9s) is given explicitly in the script, not derived.
An automated gaze metric was tried and is not trustworthy on this stylised
face — it latches onto the closed lid mid-blink and reports the gaze jumping to
the opposite extreme. The range was confirmed frame by frame at eye level
instead, and the frames the builder emits are checked the same way.

## Components

```
HowItsMade/
  index.tsx             the section: layering, entrance, mobile/desktop split
  CharacterSequence.tsx the 36 frames, swapped by cursor position
  useGaze.ts            pointer → normalised gaze, and the spring
  useBlink.ts           the blink schedule
  Workflow.tsx          the five stages on the line (desktop)
  WorkflowStep.tsx      one stage, expanding in place
  MobileWorkflow.tsx    the same five stages as a tappable rail (touch)
```

### Gaze

The pointer writes into a `MotionValue`, normalised to `[-1, 1]` against the
character's own width, and read through a spring. **No React state is on the
pointer path, so scrubbing the whole sequence causes zero re-renders** — the
active frame is swapped by direct style writes from a MotionValue subscription.

Frame 0 is him looking to the viewer's right; the last frame is the viewer's
left. Cursor right therefore maps to frame 0.

`RANGE_MULTIPLIER` in `useGaze.ts` is coupled to how wide the character is
rendered: widen the element and the same cursor travel produces less
deflection, until the cursor can no longer reach the first or last frame and he
simply never looks as far as he can. **Re-run `npm run shoot:face` after
changing either.**

### Blink

A `MotionValue` from 0 to 1 driving the opacity of a single stabilised
closed-eye frame, on a loop with gaps randomised between 2.5s and 4s — a fixed
interval becomes visible within about three cycles. Roughly one blink in six is
a double.

Blink and gaze are independent by construction: the overlay fades over whatever
frame is showing, and reopening leaves the gaze exactly where it was.

### Layering

Back to front: ground → character → workflow line → stages → the open stage.
The workflow crosses at 61% of the character's height — below the eyes, which
must stay unobstructed because they are the interaction.

A single gradient over the character gives the workflow type a dark field
without putting a card behind it, and keeps the eyes the only fully lit thing
on screen. It is lighting, not a UI panel. Mobile crops the character much
tighter than desktop, so the two breakpoints need separate ramps.

### Touch

There is no cursor, so the *active stage* carries the personality: tapping a
stage opens it and turns his attention toward it, and scrolling does the same
as each stage passes the middle of the screen. The head is `sticky` on mobile —
without it he scrolls away before the visitor reaches the stages — and sits
above the list, so stages dissolve under his jaw as they scroll past.

## Rebuilding the frames

Only needed if the source clip changes.

```bash
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
cp director-v2.mp4 public/character/candidate.mp4 && npm run dev
node scripts/extract-frames.mjs /character/candidate.mp4 /tmp/sweep 12.70 17.20 68 1
.venv/bin/python scripts/build-gaze-sequence.py /tmp/sweep
rm public/character/candidate.mp4
```

Then **look at the frames** before trusting them — `SWEEP_FROM`/`SWEEP_TO` and
the blink threshold are the settings most likely to need adjusting, and both
fail in ways that look fine in code.

The generated frames are committed, so a normal checkout needs neither Python
nor the source clip.

## Guard rails

`npm run shoot:face` drives a real browser and asserts on measured state. Run
it after any change here — a CSS tweak can pin the sequence to one frame, and
the page will still build and still look correct in a still screenshot.

It checks: cursor right/centre/left select the expected frames, the index moves
monotonically with the cursor, a slow sweep touches enough distinct frames to
read as continuous rather than as three fixed positions, the blink fires at
non-repeating intervals, reduced motion disables both, and the phone layout has
no overflow with the head still pinned.

## Things not to do

- **Do not reach for an iris overlay.** It was tried; see the head-motion
  numbers above and [CHARACTER_VIDEO_BRIEF.md](CHARACTER_VIDEO_BRIEF.md).
- **Do not put the workflow over the eyes.** Everything else is negotiable.
- **Do not let a blink land in the sequence.** It becomes a cursor position.
- **Do not resize the character without re-running the harness.**
