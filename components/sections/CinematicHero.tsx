'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { FilmButton } from '@/components/primitives/FilmButton';
import { UnderlineLink } from '@/components/primitives/UnderlineLink';

/**
 * 01 — Open.
 *
 * Composition: the headline is the image's equal, not a caption on top of it.
 * Type starts at the page gutter and runs oversized toward the right edge; the
 * mono column underneath carries the technical read. Nothing is centred.
 *
 * Motion: "Track" — the footage plate scales and dims against scroll while the
 * foreground type holds still, so the page feels like a camera pushing in
 * rather than a parallax stack. One layer only.
 */
export function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const plateScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const plateOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.1]);
  const copyLift = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative min-h-[100svh] snap-start overflow-hidden"
    >
      <motion.div className="plate-track absolute inset-0" style={{ scale: plateScale, opacity: plateOpacity }}>
        <video
          src="/videos/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        {/* Directional scrim: heaviest bottom-left, where the type lives, so the
            frame stays readable without flattening the whole image. */}
        <div className="absolute inset-0 bg-gradient-to-tr from-stage via-stage/70 to-stage/25" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stage to-transparent" />
      </motion.div>

      <motion.div
        className="frame relative flex min-h-[100svh] flex-col justify-end pb-16 pt-[var(--header-h)]"
        style={{ y: copyLift }}
      >
        <p className="label fade-in text-gold" style={{ animationDelay: '0.5s' }}>
          Reel 01 <span className="text-line">/</span>{' '}
          <span className="text-muted">Brand films, product videos, UGC</span>
        </p>

        {/*
          The title card animates in CSS (see .title-line in globals.css) so it
          paints with the document instead of waiting on hydration.
        */}
        <h1 className="mt-7 text-display-xl font-bold text-ink">
          {['Stories, generated.', 'Still felt.'].map((line, index) => (
            <span key={line} className="title-line">
              <span
                className={index === 1 ? 'text-gold' : undefined}
                style={{ animationDelay: `${0.55 + index * 0.09}s` }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="fade-in mt-12 grid grid-cols-12 items-end gap-x-4 gap-y-10" style={{ animationDelay: '0.85s' }}>
          <p className="col-span-12 max-w-sm font-mono text-sm leading-relaxed text-muted md:col-span-5">
            A film studio that runs on AI. We direct first and generate second —
            so the film carries a point of view, not a prompt.
          </p>

          <div className="col-span-12 flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-7 md:justify-end">
            <FilmButton href="#start" variant="solid">
              Start a film
            </FilmButton>
            <UnderlineLink href="#work">See the work</UnderlineLink>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
