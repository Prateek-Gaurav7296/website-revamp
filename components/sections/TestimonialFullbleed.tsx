'use client';

import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import { Section } from '@/components/primitives/Section';
import { testimonials, type Testimonial } from '@/content/testimonials';
import { cn } from '@/lib/cn';

/**
 * 06 — What Clients Say.
 *
 * One continuous strip of compact cards that never stops and never resets. The
 * list is rendered twice and the track translates by exactly half its width
 * before looping, so the seam lands on an identical frame and the motion reads
 * as endless rather than as a carousel snapping back.
 *
 * The cards are small on purpose: at display scale a single quote fills the
 * screen and the strip stops reading as a strip. Mono body copy keeps them
 * dense without shouting, and the name is the only thing set in display type.
 *
 * Duration scales with the number of quotes, so adding a client to
 * content/testimonials.ts keeps the same reading speed instead of making the
 * strip race. Nothing else needs touching to add one.
 *
 * The animation is CSS, not JS: it runs on the compositor, costs nothing on
 * the main thread, and keeps running while the tab is busy. It does not pause
 * on hover — the strip is full-bleed and sits mid-screen, so the cursor rests
 * over it most of the time and pause-on-hover left it looking frozen. Under
 * reduced motion it stops entirely and becomes a plain scrollable row.
 */
/**
 * Seconds of travel per quote. Tuned as a speed, not a duration: each card is
 * roughly 26rem, so this works out near 50px/s, which reads as moving at a
 * glance without outrunning the copy. Scaling with the count keeps that speed
 * constant as clients are added.
 */
const SECONDS_PER_QUOTE = 8;

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
              : 'animate-[marquee_var(--marquee-duration)_linear_infinite]'
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
    <figure className="flex w-[78vw] shrink-0 flex-col justify-between border-l border-line px-6 py-1 sm:w-[24rem] sm:px-8 lg:w-[26rem]">
      <blockquote className="font-mono text-sm leading-relaxed text-ink/90 sm:text-[0.95rem]">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-4">
        <Image
          src={testimonial.image}
          alt=""
          width={144}
          height={144}
          className="h-16 w-16 shrink-0 object-cover grayscale sm:h-20 sm:w-20"
        />
        <div className="min-w-0">
          <span className="block text-base font-bold leading-tight text-ink">
            {testimonial.name}
          </span>
          <span className="label mt-2 block text-muted">{testimonial.role}</span>
          <span className="label mt-1 block text-gold">{testimonial.company}</span>
        </div>
      </figcaption>
    </figure>
  );
}
