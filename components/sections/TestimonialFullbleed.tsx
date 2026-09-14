import Image from 'next/image';
import { Reveal, RevealLines } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { testimonials } from '@/content/testimonials';

/**
 * 06 — What Clients Say.
 *
 * One quote per band, set at display scale so it carries its own screen. The
 * attribution hangs left like a film credit: no carousel, no quote ornament.
 */
export function TestimonialFullbleed() {
  return (
    <Section id="testimonials" index="06" kicker="What clients say" meta={`${testimonials.length} clients`}>
      <div className="mt-4 divide-y divide-line">
        {testimonials.map((testimonial) => (
          <figure key={testimonial.id} className="grid grid-cols-12 gap-x-4 gap-y-8 py-16 md:py-24">
            <Reveal className="col-span-12 md:col-span-3">
              <figcaption className="flex items-center gap-4 md:block">
                <Image
                  src={testimonial.image}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 object-cover grayscale"
                />
                <div className="md:mt-5">
                  <p className="font-mono text-sm text-ink">{testimonial.name}</p>
                  <p className="label mt-2 text-muted">{testimonial.role}</p>
                  <p className="label mt-1 text-gold">{testimonial.company}</p>
                </div>
              </figcaption>
            </Reveal>

            <blockquote className="col-span-12 md:col-span-9">
              <RevealLines
                className="text-2xl font-bold leading-[1.18] text-ink md:text-[2.4rem]"
                lines={[<>&ldquo;{testimonial.quote}&rdquo;</>]}
              />
            </blockquote>
          </figure>
        ))}
      </div>
    </Section>
  );
}
