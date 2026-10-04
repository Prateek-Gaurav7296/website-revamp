# NextBerry Labs — website revamp

A rebuild of **thenextberrylabs.com**. This repository is intended to
**replace the current marketing site completely**, not to sit alongside it.

- **Stack** — Next.js 14 (App Router) · TypeScript · Tailwind CSS · framer-motion
- **Status** — feature-complete prototype. See [Before you launch](#before-you-launch).
- **Docs** — [Architecture](docs/ARCHITECTURE.md) · [Design system](docs/DESIGN_SYSTEM.md) · [The character](docs/CHARACTER.md) · [Content](docs/CONTENT.md) · [Tooling](docs/TOOLING.md) · [Video brief](docs/CHARACTER_VIDEO_BRIEF.md)

---

## Start here

```bash
npm install
cp .env.example .env.local     # then fill in the Supabase values — see below
npm run dev                    # http://localhost:3000
```

The site renders fully without any environment variables. Only the contact form
needs them.

---

## What this replaces, and what it keeps

### Replaces

The entire public marketing site. The old codebase (`TheNextBerryLabs`) is a
different structure, a different design system and a different component set —
nothing is shared, and nothing should be copied back and forth. Treat it as
reference material only.

What changed, in substance rather than style:

| Old | Here |
|---|---|
| Stats-first agency funnel | An eight-beat narrative; the work moves above the proof |
| Portfolio links out to YouTube | Films open in an on-page lightbox; nothing sends the visitor away |
| Berry/magenta palette | Near-black and gold, from the N/B monogram |
| Discount-led contact CTA | An invitation — the discount framing undercut the positioning |
| Numbered process diagram | A cursor-driven character with the workflow across his face |

### Keeps — do not change these

**1. The Supabase database.** The same project, the same `leads` table, the
same rows. `POST /api/leads` writes exactly the columns the old site wrote and
leaves `id`, `created_at` and `updated_at` to the database, so submissions from
the new site land in the same table alongside the old ones with no migration
and no schema change.

Point `.env.local` at the **existing** Supabase project:

```
NEXT_PUBLIC_SUPABASE_URL=…      # same value as the old site
SUPABASE_SERVICE_ROLE_KEY=…     # same value as the old site
NEXT_PUBLIC_CONTACT_EMAIL=contact@thenextberrylabs.com
```

The service-role key is read server-side only and is never sent to the browser.
The table definition is in [docs/CONTENT.md](docs/CONTENT.md#lead-capture) for
reference — **do not run it**, the table already exists.

Without Supabase configured the route returns **503** and the form shows the
email fallback. That is deliberate: a prototype should fail loudly rather than
silently swallow a lead.

**2. NB Studio.** Studio is a **separate application, in its own repository, on
its own subdomain** — it is not a page in this project and should not be rebuilt
here. The old site linked to it from the header ("Take me to NB studio") and
this one keeps that entry point, in both the navbar and the footer.

The URL lives in one place, `studioLink` in [`content/site.ts`](content/site.ts).

> ⚠️ **Confirm the host before launch.** The old shipped header pointed at
> `studio.thenextberrylabs.com` (singular); the old deployment notes describe
> `studios.thenextberrylabs.com` (plural). This repo follows the link that was
> actually live. One of the two is wrong — check which resolves and fix the
> constant.

---

## How the codebase is organised

```
app/
  layout.tsx          Shell: fonts, metadata, chrome, motion policy
  page.tsx            The eight beats, in order. Deliberately almost empty.
  globals.css         Tokens, base styles, scroll-snap, keyframes
  api/leads/route.ts  Lead capture → Supabase
components/
  layout/             Navbar, Footer, ChapterRail, Leader, FilmGrain, SectionScroller
  sections/           One component per narrative beat
    HowItsMade/       Section 04 — the interactive character
  media/              FilmFrame, VideoLightbox
  primitives/         Section chassis, Reveal, FilmButton, UnderlineLink
content/              Every word and every data row. No copy lives in components.
lib/                  cn(), motion tokens, YouTube helpers
docs/                 The documents linked at the top
scripts/              Visual QA harnesses and the character asset pipeline
public/               Video, character frames, logos, portraits, favicons
```

### Four rules that keep it maintainable

**1. Copy lives in `content/`, never in a component.** Changing the site's
words should never mean opening a file that also contains layout. Adding a
client testimonial or a film is a one-file edit.

**2. Every section is a narrative beat, not a generic UI primitive.** There is
no reusable `Card` and there should not be. One `Section` chassis owns the
sectioning system — the full-bleed rule, the slate, the vertical rhythm — which
is what makes eight very different beats read as one document. To add a beat,
see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#adding-a-section).

**3. One beat, one screen.** Each section is a full-screen scroll-snap stop and
one scroll gesture moves to the next. This makes the height budget a
**correctness constraint**: a section taller than the viewport makes its own
lower half unreachable. Run `npm run shoot:heights` after adding copy.

**4. Never drive an animation from React state at pointer frequency.** Write to
a `MotionValue` instead. Section 04 tracks the cursor across a whole section
with zero re-renders; that is the standard to hold.

### Design tokens

Colours, type scale, spacing and the motion vocabulary are in
[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md). Two things that bite:

- **Add any new colour or font size to both `tailwind.config.ts` *and*
  `lib/cn.ts`.** Our custom sizes and colours share the `text-` prefix
  (`text-display-lg`, `text-ink`); without the `tailwind-merge` config, it
  treats them as conflicting and silently drops the font size, so headings
  render at body size and nothing errors.
- **No rounded corners, no box shadows, no gradients** that do not represent a
  real film transition. There is not one `border-radius` in the site.

---

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run shoot` | Screenshots every section at desktop and mobile into `.screenshots/` |
| `npm run shoot:face` | Asserts the section 04 character still tracks the cursor and respects reduced motion |
| `npm run shoot:heights` | Asserts every section still fits one screen |

> `npm run build` overwrites `.next` and breaks a dev server that is already
> running. Stop `npm run dev` first, or serve the build on another port.

### The visual harnesses are not optional

Section 04 and the scroll behaviour are the two things that break silently — a
CSS change can pin the character to one frame or push a section past the snap
point, and the page will still build and still look correct in a still
screenshot. Both harnesses drive a real browser and assert on measured values.

```bash
npm run build && npx next start -p 3100 &
npm run shoot:face
npm run shoot:heights
```

---

## Deploying

Vercel, zero config, `main` branch. Set the three environment variables above
in Project → Settings → Environment Variables.

The old site's `vercel.json` (build commands, `iad1` region) applies here
unchanged. Studio stays a **separate Vercel project** on its own subdomain —
do not add rewrites or path-based routing for it.

### Cutting over

1. Deploy this to a preview URL and check it against the old site.
2. Confirm the Supabase values are the production ones, submit a test lead, and
   verify the row appears in the existing `leads` table.
3. Confirm the NB Studio link resolves (see the warning above).
4. Move the apex / `www` domain onto this project.

---

## Before you launch

Known gaps, each real:

- **Video weight.** `public/videos/reel.mp4` is 45 MB and `hero.mp4` is 30 MB.
  Both need compressed web masters (≈1080p, 3–5 Mbps H.264, plus a WebM/AV1
  sibling) and poster frames exported from the films.
- **Placeholder film metadata.** Titles and client names for films 3–6 in
  `content/work.ts` are invented. Real metadata is needed.
- **Four of six films still play from YouTube.** They open in an on-page
  lightbox rather than sending the visitor away, but native mp4s would look
  better and load faster. Drop an mp4 in `public/videos` and set `previewSrc`.
- **The character clip carries a generator watermark** — a small four-point
  sparkle, lower right. Faint under the section gradient but present. A clean
  re-render beats retouching 100 frames.
- **`face-base` character frames are 2.3 MB total.** Fine, but they are eagerly
  listed in the DOM; if the page ever needs to be lighter, that is the first
  place to look.
- **No analytics, no sitemap, no OG image.**
- **Confirm the NB Studio hostname.**
