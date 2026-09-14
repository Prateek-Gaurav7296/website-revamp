---
name: taste-review
description: Critique and raise the visual quality of this site's UI — typography, hierarchy, spacing, composition, motion, hover states, responsiveness. Use before shipping any front-end change, when asked to "make it look better", "polish", "critique the design", "is this good design", or when a section reads as generic, templated or untidy.
---

# Taste review

A critique pass for the NextBerry Labs site. Run it **before** calling a
front-end change done, not after the user complains.

Two lenses, applied in order:

1. **Impeccable** — is the visual craft actually there? Hierarchy, type,
   spacing, alignment, composition.
2. **Emil Kowalski** — does the motion feel physical, intentional and
   responsive, or is it decoration?

Read [docs/DESIGN_SYSTEM.md](../../../docs/DESIGN_SYSTEM.md) first. This skill
is how to *apply* it; that file is what the rules are.

---

## Step 1 — Look at it

Never critique from source alone. Render it:

```bash
npm run build && npx next start -p 3100 &
npm run shoot
```

Read the PNGs in `.screenshots/`. Scroll-triggered reveals mean a full-page
capture shows un-revealed sections blank — judge from the per-section shots.

When something looks wrong, **measure it in the browser instead of guessing**.
Playwright `page.evaluate` with `getComputedStyle` and `getBoundingClientRect`
has caught real bugs here that reading the JSX would not have:

- Custom `text-display-*` classes being stripped by `tailwind-merge`.
- Mask reveals never firing because the IntersectionObserver was on a
  fully-clipped element.

## Step 2 — The Impeccable pass

Go section by section and ask:

**Hierarchy.** Squint. Can you tell what the section is about from the largest
element alone? If three things compete for first read, two of them are too
loud. Is there a real size jump between levels, or does everything sit within
a few pixels of everything else?

**Type.** Are line breaks chosen or accidental? Display type should break where
the composition wants — that is what `RevealLines` takes an array for. Is the
measure sane (45–75 characters)? Is tracking tightening as size grows?

**Spacing.** Is the vertical rhythm consistent across sections, or has each one
drifted to its own padding? Is space *between* related things smaller than
space *around* the group? Is there dead space that reads as a mistake rather
than as a composition?

**Alignment.** Does everything land on the 12-column grid and the `.frame`
gutter? Do rows sum to 12? A single off-grid element makes a whole page feel
sloppy.

**Composition.** Is any section using the full width, or is content huddled in
the left half with nothing on the right? Is the asymmetry deliberate or the
result of a span that did not add up?

**Distinction.** Can you tell where one section ends and the next begins
without reading? Full-bleed top rules and the `stage`/`stage-alt` banding are
the tools for this.

**Cliché check.** Any of these means stop and redo it:
purple/blue gradients · glassmorphism · floating blobs · rounded cards with
shadows · particles · generic SaaS three-column feature grid · stock or
generated "AI" key art standing in for a real frame of work.

## Step 3 — The motion pass

**Does each animation earn its place?** Map it to Cut, Reveal, Track or
Dissolve. If it maps to none, delete it.

**Is it physical?** Anything the pointer touches should be a spring
(`SPRING_POINTER`) — interruptible, so grabbing it mid-flight obeys. Anything
the scroll drives should be an eased curve (`EASE_FILM`).

**Is it fast enough?** If a transition reads as "an animation" rather than as
the interface responding, it is too long. Hover feedback is ~180ms, not 400ms.

**Is it on the compositor?** Transform, opacity and clip-path only. Anything
animating width, height, top or margin is a bug.

**Does it degrade?** Check reduced motion, check no-JS, check a background tab.
An entrance animation on the LCP element belongs in CSS, not JS.

## Step 4 — Interaction and responsive

- Every interactive element has a visible, conventional affordance. Cinematic
  must not mean undiscoverable.
- Nothing critical is hover-only — it must read on a touch screen.
- Touch targets ≥ 44px.
- No horizontal overflow at 390px, 768px, 1440px.
- Focus states are visible and use the gold ring.

## Step 5 — Report

State the two or three changes that will raise the quality most, make them,
re-shoot, and compare. Do not list twenty nitpicks; taste is knowing which
problems matter.

Make strong decisions. A safe, generic result is the failure mode here — not
an overreach.
