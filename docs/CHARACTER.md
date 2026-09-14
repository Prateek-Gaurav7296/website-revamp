# The creative director

Section 04, *How It's Made*, is built around a character who watches the
visitor while the five-stage workflow runs across his face. He is the signature
interaction on the site.

The intended moment is small: the visitor half-notices that he looked, looks
again, and realises he is following the cursor.

---

## How it works: the cursor picks the frame

The clip is a single continuous gaze sweep — he looks to the viewer's left,
through centre, to the viewer's right. **Every frame of it owns an equal slice
of the scene's width.** The cursor at the left edge shows the first frame, a
step right shows the next, and the right edge shows the last.

At 100 frames across a 1344px scene that is about 13px of cursor travel per
frame, which reads as continuous eye movement rather than as a few fixed
positions.

His own rendered eyes do the looking, which means there is no overlay to keep
registered, nothing to mask, and the lighting, hair, headphones and head
movement are genuinely his.

The alternative — drawing our own iris over a video — was built first and
abandoned. It does not survive real footage: the head moves while he looks, and
a flat 2D iris cannot follow a head that slides, rescales or turns. See
[CHARACTER_VIDEO_BRIEF.md](CHARACTER_VIDEO_BRIEF.md) for the measurements.

## The clip is used whole

No trim, no crop. `scripts/build-gaze-frames.py` writes every frame at its
native 1280×720 and corrects two things, neither of which changes the framing:

- **Background.** The clip's black is RGB(20,20,20); the page is (10,10,10).
  Left alone the frame reads as a lighter panel sitting on the page, so each
  frame is shifted by the difference — ten levels, invisible on the face.
- **Edge.** Even matched, a hard rectangle edge shows against a flat ground, so
  the outer 4.5% fades to transparent. This fades, it does not crop: the
  affected margin is empty background on all four sides.

100 frames, ~2.3 MB of WebP.

## Two things worth knowing

**Check the sweep direction by eye, at high zoom.** Frame 0 has him looking to
the viewer's *left*, so the cursor maps straight onto the clip and
`REVERSE_SWEEP` in `CharacterSequence.tsx` is `false`.

This is easy to get wrong. At the size the eye renders in a full-page
screenshot it is perhaps thirty pixels across, and the iris offset reads
backwards about as often as it reads correctly — I got it wrong twice before
cropping to the eye opening and looking again. The reliable test is to crop the
eyes out of a rendered frame and blow them up: the iris sits against one edge
of the opening with the sclera showing on the other side, and at that scale
there is no ambiguity. Getting it wrong makes the character look away from the
cursor.

**The clip blinks twice**, at frames 2–6 and 53–57. Mapped literally those
become cursor positions where he sits with his eyes shut — one at the right
edge, one just left of centre, which is where a cursor rests most of the time.
Sweeping past a blink looks natural; parking on one looks broken. So a blink
slice draws the nearest open-eyed frame instead: every frame still owns its
pixel range, and the mapping stays monotonic and continuous.
`SKIP_BLINK_FRAMES` turns this off for the strictly literal mapping.

Both are single constants, both are commented where they are defined.

## Components

```
HowItsMade/
  index.tsx             the section: layering, entrance, mobile/desktop split
  CharacterSequence.tsx the frames, swapped by cursor position
  useGaze.ts            pointer → 0..1 position across the scene, and the spring
  Workflow.tsx          the five stages on the line (desktop)
  WorkflowStep.tsx      one stage, expanding in place
  MobileWorkflow.tsx    the same five stages as a tappable rail (touch)
```

The cursor position is measured across **the scene** — the whole interactive
box — not across the character, so the first and last frames land exactly on
its left and right edges.

**No React state is on the pointer path.** The pointer writes into a
`MotionValue`; the active frame is swapped by a direct style write from a
subscription. Scrubbing the entire set costs zero re-renders.

The spring only takes the edge off: enough inertia that a flicked cursor does
not snap him instantly, little enough that he does not lag behind it. Overshoot
is off — an eye that overshoots and settles back reads as cartoon.

### Layering

Back to front: ground → character → workflow line → stages → the open stage.
The workflow crosses below the eyes, which must stay unobstructed because they
are the interaction.

A single gradient over the character gives the workflow type a dark field
without putting a card behind it, and keeps the eyes the only fully lit thing
on screen. It is lighting, not a UI panel. Mobile frames the character much
tighter than desktop, so the two breakpoints need separate ramps.

### Touch

There is no cursor, so the *active stage* carries the personality: tapping a
stage places a virtual cursor where that stage sits along the scene, and
scrolling does the same as each stage passes the middle of the screen. The head
is `sticky` on mobile — without it he scrolls away before the visitor reaches
the stages — and sits above the list, so stages dissolve under his jaw.

## Rebuilding the frames

Only needed if the clip changes.

```bash
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
cp new-clip.mp4 public/character/candidate.mp4 && npm run dev
node scripts/extract-frames.mjs /character/candidate.mp4 /tmp/new 0 <duration> <frames> 1
.venv/bin/python scripts/build-gaze-frames.py /tmp/new
rm public/character/candidate.mp4
```

The builder prints which frames are blinks; those indices go into the manifest
and the component reads them. Then check the sweep direction as described
above and set `REVERSE_SWEEP` accordingly.

The generated frames are committed, so a normal checkout needs neither Python
nor the clip.

## Guard rails

`npm run shoot:face` drives a real browser and asserts on measured state. Run
it after any change here — a CSS tweak can pin the sequence to one frame, and
the page will still build and still look correct in a still screenshot.

It checks: the cursor edges select the first and last frames, the index moves
monotonically with the cursor, a slow sweep touches enough distinct frames to
read as continuous, reduced motion holds the neutral frame, and the phone
layout has no overflow with the head still pinned.

The harness computes its own scroll offset from the scene rather than using a
fixed number. A fixed offset breaks silently the moment the section's height
changes: the cursor lands on the navbar, the scene sees `pointerleave`, and
every reading comes back as the relaxed neutral frame.

## Things not to do

- **Do not reach for an iris overlay.** It was tried; the head moves.
- **Do not put the workflow over the eyes.** Everything else is negotiable.
- **Do not resize the character without re-running the harness.**
