'use client';

import { useState } from 'react';
import { FilmFrame } from '@/components/media/FilmFrame';
import { VideoLightbox } from '@/components/media/VideoLightbox';
import { RevealFrame } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { UnderlineLink } from '@/components/primitives/UnderlineLink';
import { films, playlistUrl, type Film } from '@/content/work';
import { cn } from '@/lib/cn';

/**
 * 03 — The Work.
 *
 * A mosaic sized to fit one screen: the whole reel is visible at a glance, with
 * no scrolling to discover that there is more. That constraint is the layout.
 *
 * TILES places six films on a 12-column, 6-row grid. The spans are uneven on
 * purpose — no two neighbours share an edge length — so it reads as a hung
 * wall rather than a product grid, but every tile still lands on the same
 * gutters and the rows always sum to 12. The irregularity is composed, not
 * random; a genuinely random pack produces collisions and orphan gaps.
 *
 *   ┌───────────┬─────┬───────┐
 *   │     1     │  2  │       │
 *   ├─────┬─────┴─────┤   4   │
 *   │  3  │     5     ├───────┤
 *   └─────┴───────────┴───6───┘
 *
 * To re-cut the wall, edit TILES. Keep every column covered in every row, or
 * the grid will show holes.
 */
const TILES = [
  'col-span-5 row-span-3',
  'col-span-3 row-span-2',
  'col-span-4 row-span-3 col-start-9 row-start-1',
  'col-span-3 row-span-4 col-start-6 row-start-3',
  'col-span-5 row-span-3 col-start-1 row-start-4',
  'col-span-4 row-span-3 col-start-9 row-start-4',
] as const;

export function WorkShowcase() {
  const [openFilm, setOpenFilm] = useState<Film | null>(null);

  return (
    <Section
      id="work"
      index="03"
      kicker="The work"
      // Not a count. The catalogue is much larger than the wall, and a number
      // in the headline dates the moment a film is added.
      meta="Six of many"
      title={['None of them', 'look like a template.']}
      bleed
    >
      {/* Mobile: a swipeable strip. A six-tile mosaic on a phone is six
          thumbnails nobody can read. */}
      <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-8 md:hidden">
        {films.map((film, index) => (
          <div key={film.id} className="w-[84vw] shrink-0 snap-center">
            <FilmFrame film={film} index={index} onOpen={setOpenFilm} />
          </div>
        ))}
      </div>

      {/* Tablet and up: the wall.
          Height is the viewport minus the measured overhead — padding, slate,
          title and exit link come to about 30rem — so the whole beat lands on
          one screen rather than the grid alone doing so and pushing the rest
          past the snap point. `npm run shoot:heights` checks this. */}
      <div
        className="frame mt-8 hidden grid-cols-12 grid-rows-6 gap-3 md:grid lg:gap-4"
        style={{ height: 'min(calc(100svh - 30rem), 26rem)' }}
      >
        {films.map((film, index) => (
          <RevealFrame key={film.id} className={cn(TILES[index], 'min-h-0')}>
            <FilmFrame
              film={film}
              index={index}
              onOpen={setOpenFilm}
              priority={index < 3}
              fill
            />
          </RevealFrame>
        ))}
      </div>

      <div className="frame mt-8">
        <UnderlineLink href={playlistUrl} external>
          See everything on YouTube
        </UnderlineLink>
      </div>

      <VideoLightbox film={openFilm} onClose={() => setOpenFilm(null)} />
    </Section>
  );
}
