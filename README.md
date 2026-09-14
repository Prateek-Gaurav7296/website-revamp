# NextBerry Labs — Website

A cinematic marketing site for NextBerry Labs: a film studio that runs on AI.

This is an **MVP prototype**. It is a complete, deployable site, but a few
production items are deliberately outstanding — see [Known gaps](#known-gaps).

- **Stack** — Next.js 14 (App Router) · TypeScript · Tailwind CSS · framer-motion
- **Design brief** — `nextberry-labs-creative-direction.md` (kept outside this repo)
- **Docs** — [Architecture](docs/ARCHITECTURE.md) · [Design system](docs/DESIGN_SYSTEM.md) · [The character](docs/CHARACTER.md) · [Video brief](docs/CHARACTER_VIDEO_BRIEF.md) · [Content](docs/CONTENT.md) · [Tooling](docs/TOOLING.md)

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — see Environment below
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run shoot` | Visual QA — screenshots every section at desktop and mobile into `.screenshots/` |
| `npm run shoot:face` | Asserts the section 04 character still tracks, blinks and respects reduced motion |

> `npm run build` overwrites `.next`, which breaks a dev server that is already
> running. Stop `npm run dev` first, or serve the build on another port.

### Visual QA

`npm run shoot` drives a real browser (Playwright) over a running site and
writes one screenshot per narrative beat at 1440×900 and 390×844.

```bash
npm run build && npx next start -p 3100 &
npm run shoot                     # defaults to http://localhost:3100
node scripts/shoot.mjs http://localhost:3000   # or point it anywhere
```

Use it after any layout or motion change. Reveals are scroll-triggered, so a
full-page screenshot will show un-revealed sections as blank — that is why the
script captures section by section.

## Environment

Everything is optional; the site renders fully without any of it.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for lead capture |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by `/api/leads` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Fallback contact shown if lead capture is unavailable |

Without Supabase configured, `POST /api/leads` returns **503** and the contact
form shows the email fallback. That is deliberate: a prototype should never
silently swallow a lead.

The `leads` table schema lives in [docs/CONTENT.md](docs/CONTENT.md#lead-capture).

## Project layout

```
app/               Routes, root layout, global CSS
  api/leads/       Lead capture endpoint
components/
  layout/          Page chrome — Navbar, Footer, ChapterRail, Leader, FilmGrain
  sections/        One component per narrative beat (see docs/ARCHITECTURE.md)
    HowItsMade/    Section 04 — the creative director (see docs/CHARACTER.md)
  media/           FilmFrame, VideoLightbox
  primitives/      Section chassis, Reveal, FilmButton, UnderlineLink
content/           All copy and data. No copy lives in components.
lib/               cn(), motion tokens, YouTube helpers
docs/              Architecture, design system, character, content, tooling
scripts/           Visual QA, and the character asset pipeline
public/            Video, logos, portraits, favicons, character layers
```

**Two rules keep this maintainable:**

1. **Copy lives in `content/`, never in a component.** Editing the site's words
   should never mean opening a `.tsx` file that also contains layout.
2. **Every section is a narrative beat, not a generic UI primitive.** There is
   no reusable `Card`. If you need a new beat, add a `Section` — see
   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#adding-a-section).

## Deploying

Vercel, zero config. Set the environment variables above in the project
settings. The only build output that matters is the static homepage plus the
`/api/leads` serverless function.

## Known gaps

These are real and tracked, not oversights:

- **Hero video is ~31 MB.** It needs a compressed web master (≈1080p, 3–5 Mbps,
  H.264 + a WebM/AV1 sibling) and a poster frame exported from the film. Until
  then first paint on a slow connection is a black stage, which is on-brand but
  not intentional.
- **Four of six films still play from YouTube.** They open in an on-page
  lightbox rather than sending the visitor offsite, but native mp4s would look
  better and load faster. Drop an mp4 in `public/videos` and set `previewSrc` —
  see [docs/CONTENT.md](docs/CONTENT.md#work).
- **Film titles and client names for films 3–6 are placeholders.** Real
  metadata is needed before launch.
- **No analytics, no sitemap, no OG image.**
- **`face-base.png` is 2.4 MB.** It is served through `next/image` as AVIF/WebP
  at the rendered size, so the wire cost is far lower, but a properly exported
  source would still be better.
- **The `Explore →` affordance on each workflow stage does not lead anywhere
  yet.** It needs either a destination or removal before launch.
- **Section 04 still uses the layered PNG character, not video.** The supplied
  director clip cannot carry a cursor-controlled gaze — it fails all four
  checks in `scripts/check-character-video.py`. The spec and generation prompt
  for a usable clip are in
  [docs/CHARACTER_VIDEO_BRIEF.md](docs/CHARACTER_VIDEO_BRIEF.md); the eye rig
  is already built and only the base layer needs swapping.
