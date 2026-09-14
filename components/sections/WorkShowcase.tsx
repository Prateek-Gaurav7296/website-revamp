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
 * 03 — The Work. The strongest asset, moved up the page.
 *
 * The grid is strict: 12 columns, every row summing to 12, every frame landing
 * on a shared gutter. The variety comes from composition rather than from
 * breaking the grid — span, aspect ratio and vertical offset change row to
 * row, the way a magazine spread varies frame size while holding its margins.
 *
 * LAYOUT is design, not content, so it lives here and not in content/work.ts.
 * Reorder the films there; re-cut the page here. Rows must still sum to 12.
 */
const LAYOUT = [
  // Row 1 — the opening frame: anamorphic, full width.
  { span: 'col-span-12', ratio: 'aspect-[21/9]', offset: '' },
  // Row 2 — a wide/narrow pair, the narrow one dropped off the baseline.
  { span: 'col-span-7', ratio: 'aspect-[16/9]', offset: '' },
  { span: 'col-span-5', ratio: 'aspect-[4/3]', offset: 'lg:mt-24' },
  // Row 3 — mirrored, so the eye crosses back.
  { span: 'col-span-5', ratio: 'aspect-[4/3]', offset: '' },
  { span: 'col-span-7', ratio: 'aspect-[16/9]', offset: 'lg:mt-16' },
  // Row 4 — the closing frame, inset so the section ends on white space.
  { span: 'col-span-8 col-start-5', ratio: 'aspect-[16/9]', offset: '' },
] as const;

export function WorkShowcase() {
  const [openFilm, setOpenFilm] = useState<Film | null>(null);

  return (
    <Section
      id="work"
      index="03"
      kicker="The work"
      meta={`${films.length} films`}
      title={['Six films.', 'None of them look like a template.']}
      bleed
    >
      {/* Mobile: a swipeable strip, one film per screen. */}
      <div className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:px-8 md:hidden">
        {films.map((film, index) => (
          <div key={film.id} className="w-[85vw] shrink-0 snap-center">
            <FilmFrame film={film} index={index} onOpen={setOpenFilm} priority={index === 0} />
          </div>
        ))}
      </div>

      {/* Tablet and up: the composed grid. */}
      <div className="frame mt-16 hidden grid-cols-12 gap-x-4 gap-y-16 md:grid lg:gap-x-6 lg:gap-y-24">
        {films.map((film, index) => {
          const layout = LAYOUT[index] ?? LAYOUT[LAYOUT.length - 1];

          return (
            <RevealFrame key={film.id} className={cn(layout.span, layout.offset)}>
              <FilmFrame
                film={film}
                index={index}
                ratio={layout.ratio}
                onOpen={setOpenFilm}
                priority={index === 0}
              />
            </RevealFrame>
          );
        })}

        {/* The closing frame is inset, so the free columns carry the exit link
            instead of sitting as dead space. */}
        <div className="col-span-4 col-start-1 row-start-4 flex items-end pb-6">
          <div>
            <p className="label">Full catalogue</p>
            <UnderlineLink href={playlistUrl} external className="mt-3">
              See everything on YouTube
            </UnderlineLink>
          </div>
        </div>
      </div>

      <div className="frame mt-10 md:hidden">
        <UnderlineLink href={playlistUrl} external>
          See everything on YouTube
        </UnderlineLink>
      </div>

      <VideoLightbox film={openFilm} onClose={() => setOpenFilm(null)} />
    </Section>
  );
}
