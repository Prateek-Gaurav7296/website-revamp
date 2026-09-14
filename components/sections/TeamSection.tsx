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
 * Two credits, not two posters. The portraits are deliberately small — a
 * headshot blown up to half a column reads as a staff directory, and the
 * writing here is the good part. At this size the picture identifies the
 * person and the copy does the work.
 *
 * The one flourish: hovering a founder lifts the portrait, returns its colour
 * and lights a gold rule under the row. Colour arriving on demand is the same
 * reward the film tiles use, so the page keeps one interaction language.
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
      <div className="mt-14 divide-y divide-line border-y border-line">
        {founders.map((founder, index) => {
          const isActive = active === founder.id;

          return (
            <Reveal key={founder.id} delay={index * 0.06}>
              <article
                onMouseEnter={() => setActive(founder.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(founder.id)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                className="group relative outline-none"
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px origin-left bg-gold"
                  initial={false}
                  animate={{ scaleX: isActive ? 1 : 0 }}
                  transition={{ duration: DURATION.state, ease: EASE_FILM }}
                />

                <div className="grid grid-cols-12 items-start gap-x-6 gap-y-5 py-8 md:py-10">
                  <motion.div
                    className="col-span-3 sm:col-span-2 md:col-span-1"
                    animate={{ y: isActive ? -4 : 0 }}
                    transition={SPRING_POINTER}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-surface">
                      <Image
                        src={founder.image}
                        alt={founder.name}
                        fill
                        sizes="120px"
                        className={cn(
                          'object-cover object-top transition-[filter] duration-500 ease-film',
                          isActive ? 'grayscale-0' : 'grayscale'
                        )}
                      />
                    </div>
                  </motion.div>

                  <div className="col-span-9 sm:col-span-10 md:col-span-3">
                    <h3 className="text-xl font-bold leading-tight text-ink md:text-2xl">
                      {founder.name}
                    </h3>
                    <p
                      className={cn(
                        'label mt-2 transition-colors duration-200',
                        isActive ? 'text-gold' : 'text-muted'
                      )}
                    >
                      {founder.role}
                    </p>
                  </div>

                  <p className="col-span-12 max-w-2xl font-mono text-sm leading-relaxed text-muted md:col-span-8">
                    {founder.bio}
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
