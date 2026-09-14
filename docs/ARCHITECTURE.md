# Architecture

## The page is a narrative, not a funnel

The homepage is eight beats in a fixed order. `app/page.tsx` is deliberately
almost empty — it is a table of contents:

| # | Beat | Component | Job |
|---|---|---|---|
| 01 | Open | `CinematicHero` | Footage and one positioning line. Nothing else. |
| 02 | The Premise | `Manifesto` | What changes when AI enters filmmaking. Belief before proof. |
| 03 | The Work | `WorkShowcase` | The strongest asset, high on the page. |
| 04 | How It's Made | `ProcessSequence` | The five-step shot list. |
| 05 | The Proof | `ProofStrip` | Stats — *after* the work has landed. |
| 06 | What Clients Say | `TestimonialFullbleed` | Two quotes at display scale. |
| 07 | Who's Behind It | `TeamSection` | The founders. |
| 08 | Start | `ContactInvite` | An invitation, not a coupon. |

Ordering is the design. Proof before work turns the site back into an agency
funnel; moving the form above the team turns it into a lead-gen page. Change
the order only with a reason.

## Layers

```
app/layout.tsx
 └─ MotionProvider          reduced-motion policy for the whole tree
     ├─ Leader              one-per-session opening title card
     ├─ FilmGrain           static grain plate over everything
     ├─ ChapterRail         fixed reel counter + scroll progress (xl and up)
     ├─ Navbar              transparent over hero → matte on scroll
     ├─ main                the eight beats
     └─ Footer
```

### `components/primitives/`

Shared behaviour, no content:

- **`Section`** — the chassis every beat is built on. Owns the full-bleed top
  rule, the slate (`03 — THE WORK … 6 FILMS`), the title card and the vertical
  rhythm. This component is why eight very different sections read as one
  document.
- **`Reveal` / `RevealLines` / `RevealFrame`** — the three entrances. See
  [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md#motion).
- **`FilmButton` / `UnderlineLink`** — the only two interactive controls.
- **`MotionProvider`** — wraps the app in framer's `reducedMotion="user"`.

### `components/media/`

- **`FilmFrame`** — one film. Where a self-hosted mp4 exists the `<video>` is
  both the still (seeked to `posterTime`) and the hover preview, so there is no
  poster-to-video swap to get wrong.
- **`VideoLightbox`** — fullscreen player. Escape closes, body scroll locks.

### `content/`

Every word and every data row. Components import from here and never inline
copy. See [CONTENT.md](CONTENT.md).

### `lib/`

- **`cn.ts`** — `clsx` + a **configured** `tailwind-merge`. The config is not
  optional: our custom type sizes and colours share the `text-` prefix
  (`text-display-lg`, `text-ink`), and out of the box tailwind-merge treats
  them as conflicting and silently drops the font size. Add any new colour or
  font size to both `tailwind.config.ts` and `lib/cn.ts`.
- **`motion.ts`** — every easing curve, spring and duration in the site.
- **`youtube.ts`** — id, poster and embed helpers.

## Adding a section

1. Add its copy to a module in `content/`.
2. Create `components/sections/YourBeat.tsx` wrapping `<Section>`, giving it an
   `id`, an `index`, a `kicker` and optionally `meta` and `title`.
3. Add it to `app/page.tsx` in narrative order.
4. Add `{ id, number }` to `CHAPTERS` in `components/layout/ChapterRail.tsx`.
5. Add it to `navLinks` in `content/site.ts` if it deserves a nav entry.

Do not build a generic `Card` and reuse it across beats. Each beat earns its
own composition; that is the whole identity.

## Conventions

- **Client components** are marked `'use client'` and kept as small as
  possible. `Manifesto`, `ProofStrip`, `TestimonialFullbleed`, `TeamSection`
  and `Section` are server components.
- **No arbitrary hex values in components.** Use a Tailwind token. The
  exception is framer-motion `variants`, which animate raw colour values —
  those hexes are commented where they appear.
- **Animate transform, opacity and clip-path only.** Nothing that triggers
  layout.
- **Scroll listeners go through `requestAnimationFrame`** (`Navbar`) or are
  replaced by an `IntersectionObserver` (`ChapterRail`) or framer's
  `useScroll` (`CinematicHero`).
