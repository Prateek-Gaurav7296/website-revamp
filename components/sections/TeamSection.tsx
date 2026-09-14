'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { Reveal } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { founders } from '@/content/team';
import { cn } from '@/lib/cn';
import { DURATION, EASE_FILM, SPRING_POINTER } from '@/lib/motion';

/**
 * 07 — Who's Behind It.
 *
 * Side by side, deliberately. Stacked rows put one founder above the other and
 * that reads as seniority — there are two of them and neither runs the other.
 * Equal columns, equal widths, same treatment.
 *
 * Hovering lifts the portrait, returns its colour and lights the rule above the
 * column. Colour arriving on demand is the same reward the film tiles use, so
 * the page keeps one interaction language.
 */
export function TeamSection() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <Section
      id="team"
      index="07"
      kicker="Who's behind it"
      meta="2 founders"
      tone="raised"
      title={['Two founders.', 'One edit suite.']}
    >
      <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
        {founders.map((founder, index) => {
          const isActive = active === founder.id;

          return (
            <Reveal key={founder.id} delay={index * 0.08}>
              <article
                onMouseEnter={() => setActive(founder.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(founder.id)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                className="group relative h-full border-t border-line pt-8 outline-none"
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px origin-left bg-gold"
                  initial={false}
                  animate={{ scaleX: isActive ? 1 : 0 }}
                  transition={{ duration: DURATION.state, ease: EASE_FILM }}
                />

                <div className="flex items-start gap-6">
                  <motion.div
                    className="w-28 shrink-0 sm:w-36 lg:w-40"
                    animate={{ y: isActive ? -6 : 0 }}
                    transition={SPRING_POINTER}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
                      <Image
                        src={founder.image}
                        alt={founder.name}
                        fill
                        sizes="160px"
                        className={cn(
                          'object-cover object-top transition-[filter,transform] duration-700 ease-film',
                          isActive ? 'scale-[1.04] grayscale-0' : 'grayscale'
                        )}
                      />
                    </div>
                  </motion.div>

                  <div className="min-w-0 pt-1">
                    <p
                      className={cn(
                        'label transition-colors duration-200',
                        isActive ? 'text-gold' : 'text-muted'
                      )}
                    >
                      {founder.role}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold leading-[1.1] text-ink lg:text-3xl">
                      {founder.name}
                    </h3>
                  </div>
                </div>

                <p className="mt-7 font-mono text-sm leading-relaxed text-muted">{founder.bio}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
