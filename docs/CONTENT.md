# Content guide

All copy and data live in `content/`. Nothing in `components/` should contain a
sentence a client would read. Editing the site's words means editing exactly
one file.

| File | Owns |
|---|---|
| `site.ts` | Name, tagline, meta description, nav links, social links, contact email |
| `work.ts` | The portfolio films and the YouTube playlist link |
| `process.ts` | The five workflow stages shown across the character's face |
| `proof.ts` | The six statistics |
| `testimonials.ts` | Client quotes |
| `team.ts` | Founder bios |

## Work

```ts
{
  id: 'swift-tv',
  title: 'A channel with a point of view',
  client: 'Swift TV',
  format: 'Brand film',
  year: '2025',
  youtubeUrl: 'https://youtu.be/…',
  previewSrc: '/videos/hero.mp4',   // optional — self-hosted master
  posterTime: 3,                    // optional — frame to rest on, seconds
  posterSrc: '/…'                   // optional — a real still from the film
}
```

**How a film is displayed**

1. With `previewSrc`, the `<video>` element is both the still (seeked to
   `posterTime`) and the muted hover loop. Best quality, no outbound click.
2. Without it, the frame uses the film's YouTube poster and clicking opens the
   film in the on-page lightbox. Still no outbound click.

**Upgrading a film to native playback:** drop an mp4 in `public/videos/`, set
`previewSrc` and `posterTime`. Nothing else changes.

**Never point `posterSrc` at illustration, stock art or a generated key visual.**
Every frame on the Work page must be a frame from an actual film. This is the
one content rule with a hard edge.

**Layout is not content.** Which tile a film occupies lives in `TILES` in
`components/sections/WorkShowcase.tsx`. Reorder films here; re-cut the wall
there. The mosaic is sized to fit one screen, so adding a seventh film means
re-cutting `TILES` rather than letting the grid grow — keep every column
covered in every row or the grid will show holes.

## Process

The five stages of section 04. `title` must stay a single word — it is set in
display type on the workflow line and a second word breaks the rhythm.
`summary` is the resting state; `detail` is revealed when the stage opens.

`content/face-geometry.json` sits alongside these but is **generated** — see
[CHARACTER.md](CHARACTER.md). Do not edit it by hand.

## Proof

Icons come from `public/icons/`. Values are strings (`'144%'`, `'2×'`) so the
section never has to reason about formatting. Add or remove a stat freely —
the grid draws its own dividers and does not depend on the count.

## Lead capture

`POST /api/leads` validates and writes to a Supabase `leads` table:

This is the **existing** table, carried over unchanged from the old site — the
new form writes to the same Supabase project. Do not recreate it.

```sql
create table if not exists leads (
  id           uuid primary key default gen_random_uuid(),
  name         varchar(100) not null,
  email        varchar(100) not null,
  phone        varchar(18)  not null,
  company_name varchar(150),
  note         text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
```

The route inserts only `name`, `email`, `phone`, `company_name` and `note`;
`id`, `created_at` and `updated_at` are left to the database. That is what makes
it drop-in compatible with the rows the old site wrote.

Row-level security should be on, with no public policy — the route uses the
service-role key server-side and the key is never exposed to the client.

Field limits are enforced in two places and must stay in sync: `LIMITS` in
`app/api/leads/route.ts` and `validate()` in
`components/sections/ContactInvite.tsx`.

If Supabase is not configured the route returns **503** and the form shows the
email fallback from `NEXT_PUBLIC_CONTACT_EMAIL`. It never pretends to have
saved a lead it dropped.

## Assets

| Path | Contents |
|---|---|
| `public/videos/` | `hero.mp4` (hero plate + film 01), `reel.mp4` (film 04) |
| `public/logo/` | `monogram.png` — the gold N/B mark used in the navbar |
| `public/favicon_io/` | Favicons, touch icon, web manifest |
| `public/founders/` | Founder portraits |
| `public/testimonials/` | Client portraits |
| `public/icons/` | Proof-stat icons |
| `public/character/` | Generated character layers — see [CHARACTER.md](CHARACTER.md) |

Both videos need compressed web masters before launch — see **Known gaps** in
the [README](../README.md#known-gaps).
