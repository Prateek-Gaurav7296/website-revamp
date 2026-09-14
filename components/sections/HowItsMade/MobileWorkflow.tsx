'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { processSteps } from '@/content/process';
import { cn } from '@/lib/cn';
import { DURATION, EASE_FILM, SPRING_HEAVY } from '@/lib/motion';

interface MobileWorkflowProps {
  activeIndex: number;
  onActivate: (index: number) => void;
  revealed: boolean;
}

/**
 * The workflow on touch.
 *
 * There is no cursor, so the *active* stage carries the personality instead:
 * tapping a stage opens it and turns the character's head toward it, and
 * scrolling through them does the same as each stage passes the middle of the
 * screen. The visitor never needs a mouse to see the character react.
 *
 * Laid out as a vertical rail rather than a horizontal strip — five stages
 * with real copy do not fit across a phone without shrinking the type past
 * readability.
 */
export function MobileWorkflow({ activeIndex, onActivate, revealed }: MobileWorkflowProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  // Scroll drives the active stage, so the character reacts to reading.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const items = Array.from(list.querySelectorAll('[data-step]'));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.step);
        if (!Number.isNaN(index)) onActivateRef.current(index);
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative mt-10">
      <motion.span
        aria-hidden="true"
        className="absolute bottom-0 left-[3px] top-0 w-px origin-top bg-line"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: revealed ? 1 : 0 }}
        transition={{ duration: 1, ease: EASE_FILM }}
      />

      <ol ref={listRef} className="space-y-3">
        {processSteps.map((step, index) => {
          const isActive = index === activeIndex;

          return (
            <motion.li
              key={step.number}
              layout
              data-step={index}
              transition={SPRING_HEAVY}
              className="relative pl-6"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-0 top-[0.6rem] h-[7px] w-[7px] transition-colors duration-300',
                  isActive ? 'bg-gold' : 'bg-line'
                )}
              />

              <button
                type="button"
                onClick={() => onActivate(index)}
                aria-expanded={isActive}
                className="block w-full min-h-[44px] text-left"
              >
                <span className={cn('label', isActive ? 'text-gold' : 'text-muted')}>
                  {step.number}
                </span>
                <span
                  className={cn(
                    'mt-2 block text-xl font-bold uppercase tracking-tight transition-colors duration-200',
                    isActive ? 'text-ink' : 'text-ink/70'
                  )}
                >
                  {step.title}
                </span>
                <span className="mt-1 block font-mono text-xs leading-relaxed text-muted">
                  {step.summary}
                </span>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      key="detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DURATION.state, ease: EASE_FILM }}
                      className="block overflow-hidden"
                    >
                      <span className="mt-3 block font-mono text-xs leading-relaxed text-ink/80">
                        {step.detail}
                      </span>
                      <span className="label mt-4 inline-flex items-center gap-2 text-gold">
                        Explore <ArrowRight size={13} />
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
