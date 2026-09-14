'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Reveal } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { processSteps } from '@/content/process';
import { cn } from '@/lib/cn';
import { DURATION, EASE_FILM } from '@/lib/motion';

/**
 * 04 — How It's Made. A shot list that advances, not a numbered diagram.
 *
 * Each step is one row of the same 12-column grid the rest of the page uses,
 * and every column is doing work: slate number, step name, what happens, and
 * how it happens. Nothing is reserved-but-invisible and nothing is hover-only
 * — hover raises the row and lights the slate, but all five steps read in full
 * on a touch screen, in a screenshot, or with JavaScript off.
 */
export function ProcessSequence() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <Section
      id="process"
      index="04"
      kicker="How it's made"
      meta={`${processSteps.length} steps`}
      title={['Discover. Think. Design.', 'Generate. Deliver.']}
    >
      <ol className="mt-16 border-t border-line">
        {processSteps.map((step, index) => {
          const isActive = active === index;

          return (
            <Reveal key={step.number} delay={index * 0.04}>
              <li
                className={cn(
                  'group relative border-b border-line transition-colors duration-200',
                  isActive && 'bg-surface'
                )}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                tabIndex={0}
              >
                {/* Gold rule wipes along the row edge — the same wipe language
                    the buttons and film slates use. */}
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px origin-left bg-gold"
                  initial={false}
                  animate={{ scaleX: isActive ? 1 : 0 }}
                  transition={{ duration: DURATION.state, ease: EASE_FILM }}
                />

                <div className="grid grid-cols-12 items-baseline gap-x-4 gap-y-3 px-4 py-8 md:py-9">
                  <span
                    className={cn(
                      'col-span-2 font-mono text-label uppercase transition-colors duration-200 md:col-span-1',
                      isActive ? 'text-gold' : 'text-muted'
                    )}
                  >
                    {step.number}
                  </span>

                  <h3 className="col-span-10 text-2xl font-bold text-ink md:col-span-3 md:text-3xl">
                    {step.title}
                  </h3>

                  <p className="col-span-12 font-mono text-sm leading-relaxed text-ink/85 md:col-span-4">
                    {step.summary}
                  </p>

                  <p className="col-span-12 font-mono text-sm leading-relaxed text-muted md:col-span-4">
                    {step.detail}
                  </p>
                </div>
              </li>
            </Reveal>
          );
        })}
      </ol>
    </Section>
  );
}
