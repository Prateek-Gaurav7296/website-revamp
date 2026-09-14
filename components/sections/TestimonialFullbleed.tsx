'use client';

import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import { Section } from '@/components/primitives/Section';
import { testimonials, type Testimonial } from '@/content/testimonials';
import { cn } from '@/lib/cn';

/**
 * 06 — What Clients Say.
 *
 * One continuous strip that never stops and never resets. The list is rendered
 * twice and the track translates by exactly half its width before looping, so
 * the seam lands on an identical frame and the motion reads as endless rather
 * than as a carousel snapping back.
 *
 * Duration scales with the number of quotes, so adding a client to
 * content/testimonials.ts keeps the same reading speed instead of making the
 * strip race. Nothing else needs touching to add one.
 *
 * The animation is CSS, not JS: it runs on the compositor, costs nothing on
 * the main thread, and keeps running while the tab is busy. It pauses on hover
 * so a quote can actually be read, and stops entirely under reduced motion —
 * where the strip becomes a plain scrollable row.
 */
const SECONDS_PER_QUOTE = 16;

/**
 * A long fade, not a short one. Quotes are wide, so a narrow ramp still leaves
 * a readable half-word sliced off at the frame edge, which reads as broken
 * rather than as a strip flowing past.
 */
const FADE = 'linear-gradient(to right, transparent, black 16%, black 84%, transparent)';

export function TestimonialFullbleed() {
  const reduced = useReducedMotion();
  const duration = testimonials.length * SECONDS_PER_QUOTE;

  return (
    <Section id="testimonials" index="06" kicker="What clients say" meta={`${testimonials.length} clients`} bleed>
      {/* Feathered ends, so quotes arrive and leave rather than being sliced
          at a hard edge. Written as an inline style rather than a Tailwind
          arbitrary property: the prefixed form is still needed, and a mask that
          silently fails to apply looks exactly like no mask at all. */}
      <div
        className="group relative mt-12 overflow-hidden"
        style={{
          maskImage: FADE,
          WebkitMaskImage: FADE,
        }}
      >
        <div
          className={cn(
            'flex w-max',
            reduced
              ? 'overflow-x-auto'
              : 'animate-[marquee_var(--marquee-duration)_linear_infinite] group-hover:[animation-play-state:paused]'
          )}
          style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
        >
          {/* Rendered twice: the second copy is what the first scrolls into. */}
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {testimonials.map((testimonial) => (
                <Quote key={`${copy}-${testimonial.id}`} testimonial={testimonial} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Quote({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex w-[86vw] shrink-0 items-start gap-6 border-l border-line px-6 sm:w-[62vw] sm:gap-8 sm:px-10 lg:w-[46vw]">
      <Image
        src={testimonial.image}
        alt=""
        width={176}
        height={176}
        className="h-28 w-28 shrink-0 object-cover grayscale sm:h-36 sm:w-36"
      />

      <div className="min-w-0">
        <blockquote className="text-lg font-bold leading-[1.28] text-ink sm:text-xl lg:text-2xl">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <figcaption className="mt-5">
          <span className="block font-mono text-sm text-ink">{testimonial.name}</span>
          <span className="label mt-2 block text-muted">
            {testimonial.role} <span className="text-line">/</span>{' '}
            <span className="text-gold">{testimonial.company}</span>
          </span>
        </figcaption>
      </div>
    </figure>
  );
}
