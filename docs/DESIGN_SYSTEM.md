# Design system

The site is a **screening room**: dark, controlled, one thing lit at a time.
Black is the default state — content earns light, it is not given it for free.

## Colour

Tokens live in `tailwind.config.ts`. Never hard-code a hex in a component.

| Token | Hex | Use |
|---|---|---|
| `stage` | `#0A0A0A` | Default ground. Not pure black — a hair warmer. |
| `stage-alt` | `#0E0E0E` | A 2% lift that bands alternating sections apart. |
| `surface` | `#161616` | Video mattes, hovered rows, form wells. |
| `line` | `#2A2A2A` | Hairlines and grid dividers. Never a card border. |
| `gold` | `#D4A24C` | The spotlight: logo, primary CTA, active state, key numerals. |
| `bronze` | `#8A6A2F` | Subdued gold — pressed states, quiet dividers. |
| `ink` | `#F2EFE9` | Body copy. Warm white, not clinical `#FFF`. |
| `muted` | `#8F8B84` | Captions, metadata, timestamps. |
| `alert` | `#B4453A` | Form validation only. |

**Rules**

- Gold is a signal, not a background. If a section is more than ~10% gold, pull
  it back. Most sections use it exactly twice: the reel number and one accent.
- No blue, no purple, no neon.
- No gradients except where one represents something real — the hero scrim is a
  fade to black, which is a film technique, not decoration.
- Hard edges over soft shadows. There is not one `border-radius` or `box-shadow`
  in the site, and there should not be. **Cards are the enemy of this identity.**

## Typography

Two families, three weights, and nothing else.

| Role | Family | Weights | Used for |
|---|---|---|---|
| Display | **Archivo** (`font-display`) | 400, 700 | Hero, section titles, quotes, numerals |
| Technical | **JetBrains Mono** (`font-mono`) | 400 | Nav, labels, metadata, body copy, form fields |

Mono carrying the body copy is the point: it makes the page read as a lab
notebook sitting next to a film reel.

### Scale

Fluid, clamp-based, defined in `tailwind.config.ts`:

| Class | Size | Use |
|---|---|---|
| `text-display-xl` | `clamp(2.75rem, 9vw, 8rem)` | Hero only |
| `text-display-lg` | `clamp(2.25rem, 6vw, 5rem)` | The manifesto only |
| `text-display-md` | `clamp(1.75rem, 4vw, 3.25rem)` | Section titles |
| `text-label` | `0.6875rem / 0.18em` | Every mono label (`.label`) |

> **Gotcha.** These size classes only survive `cn()` because `lib/cn.ts`
> configures `tailwind-merge` to tell `text-display-lg` (a size) apart from
> `text-ink` (a colour). Add new tokens to *both* files or headings will
> silently render at body size.

### Rules

- Headlines may run two or three lines and break awkwardly on purpose, the way
  a title card does. That is what `RevealLines` takes an **array** of lines for
  — you choose the break, not the browser.
- Emphasis comes from scale and colour. No italics, no letter-spacing tricks,
  no underline-for-emphasis.

## Layout

- `.frame` is the page gutter — one definition, so every section aligns.
- A strict **12-column grid**. Rows sum to 12. Asymmetry comes from varying
  span, aspect ratio and vertical offset, not from breaking the grid.
- `.rule` and `border-line` hairlines do all the dividing. Section top rules
  run full-bleed, past the gutter — that edge-to-edge line is the single
  strongest separator on the page.

## Motion

Timings live in `lib/motion.ts`. Every animation maps to one of four ideas and
nothing else.

| Beat | What it is | Where |
|---|---|---|
| **Cut** | Hard transition between beats | The `Leader` wipe; section rules |
| **Reveal** | Content resolving into frame, once | `Reveal`, `RevealLines`, `RevealFrame` |
| **Track** | Scroll-linked camera push | `CinematicHero` plate only |
| **Dissolve** | Still → moving image | `FilmFrame` hover |
| **Regard** | The character noticing you | `HowItsMade` gaze and blink |

**Principles**

- Physical, not decorative. Springs (`SPRING_POINTER`) for anything a pointer
  touches — they are interruptible, so grabbing an element mid-flight obeys.
  Eased curves (`EASE_FILM`) for anything the scroll drives.
- Transform, opacity and clip-path only.
- One Reveal per section, not one per element.
- Hover is a **wipe**, never a glow. `FilmButton`, `UnderlineLink`, `FilmFrame`
  and `ProcessSequence` all use the same left-to-right gold wipe, which is what
  makes the interaction language feel like one system.

**Regard** is the one idle animation on the site and the exception that proves
the rule: the character blinks and tracks the cursor when nothing is happening.
It is allowed because it is the content of that section, not decoration on top
of it. Do not take it as licence to add ambient motion elsewhere. Its rules
live in [CHARACTER.md](CHARACTER.md).

**Explicitly banned:** idle float/bob, staggered fade-ins on every list item,
hover-glow, more than one parallax layer per section, particles, and any
animation whose only purpose is to prove animation was possible.

### Accessibility and robustness

- `MotionProvider` sets framer's `reducedMotion="user"`; `globals.css` also
  neutralises CSS transitions under `prefers-reduced-motion`.
- The hero title animates in **CSS**, not JS, because it is the LCP element and
  must not wait for hydration.
- A `<noscript>` block in `app/layout.tsx` forces framer's `initial` styles to
  their finished state, so the page degrades to a plain readable document.
- `Leader` skips itself on a repeat visit, under reduced motion, and when the
  tab is in the background.

> **Mask reveals: put the observer on the *outer* element.** An
> IntersectionObserver clips an element's rect against its ancestors' overflow,
> so a line parked at `translateY(110%)` inside its own `overflow-hidden` matte
> has an empty visible rect and never fires. `RevealLines` watches the unclipped
> wrapper and propagates a variant down. Any new mask reveal must do the same.

## Responsive

| Breakpoint | Behaviour |
|---|---|
| Mobile (`< 768px`) | Work becomes a snapped horizontal strip; chapter rail hidden; type scale compresses but keeps both families |
| Tablet (`768–1279px`) | Asymmetric Work grid, simplified offsets |
| Desktop (`≥ 1280px`) | Full motion, full asymmetry, chapter rail visible from `xl` |

Across all breakpoints: no horizontal overflow, touch targets ≥ 44px, and every
interactive element has a visible conventional affordance. Cinematic must never
mean undiscoverable.

## Voice

Confident, specific, slightly dry — a director talking about their last shoot,
not a SaaS product talking about its roadmap.

**Banned:** "Unlock the power of", "Revolutionise your workflow", "Transform
your creativity", "Next-generation", "Your brand story matters", and any
discount-led CTA.

**Test for any new line:** *if it could be true of any AI video tool, cut it.*
