'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ProcessStep } from '@/content/process';
import { cn } from '@/lib/cn';
import { DURATION, EASE_FILM, SPRING_HEAVY } from '@/lib/motion';

interface WorkflowStepProps {
  step: ProcessStep;
  isOpen: boolean;
  /** True when another step is open — this one recedes. */
  isDimmed: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * One stage on the workflow line.
 *
 * The stage does not show a tooltip; the stage itself opens. The number and
 * title stay exactly where they were and the detail grows beneath them, so the
 * expansion reads as the step unfolding rather than a panel arriving.
 *
 * Width is animated on a spring, which is what pushes the neighbouring stages
 * aside — the layout reflow *is* the animation, and it stays inside this row.
 */
export function WorkflowStep({ step, isOpen, isDimmed, onOpen, onClose }: WorkflowStepProps) {
  return (
    <motion.div
      layout
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={onClose}
      tabIndex={0}
      role="button"
      aria-expanded={isOpen}
      transition={SPRING_HEAVY}
      className={cn(
        // min-w-0 matters: a flex item will not shrink below its content's
        // min-width without it, so the centred row spills past the scene on
        // both sides and widens the document.
        'relative min-w-0 cursor-pointer select-none rounded-none outline-none',
        isOpen ? 'z-30' : 'z-20'
      )}
      style={{ flex: isOpen ? '0 0 21rem' : '0 1 auto' }}
      animate={{
        // Pulled toward the viewer, not bounced.
        y: isOpen ? -10 : 0,
        opacity: isDimmed ? 0.38 : 1,
        filter: isDimmed ? 'blur(1.4px)' : 'blur(0px)',
      }}
    >
      {/* The node on the line. Gold only when this stage is the live one. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute -top-[calc(0.5rem+1px)] left-0 h-2 w-2 -translate-x-1/2 transition-colors duration-200',
          isOpen ? 'bg-gold' : 'bg-line'
        )}
      />

      <div
        className={cn(
          'border-l pl-4 transition-colors duration-300 sm:pl-5',
          isOpen ? 'border-gold' : 'border-line'
        )}
      >
        <p className={cn('label transition-colors duration-200', isOpen ? 'text-gold' : 'text-muted')}>
          {step.number}
        </p>

        <h3
          className={cn(
            'mt-3 font-bold uppercase tracking-tight transition-colors duration-200',
            isOpen ? 'text-ink' : 'text-ink/90',
            'text-lg sm:text-xl lg:text-2xl'
          )}
        >
          {step.title}
        </h3>

        <p className="mt-2 max-w-[16rem] font-mono text-xs leading-relaxed text-muted sm:text-sm">
          {step.summary}
        </p>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: DURATION.state, ease: EASE_FILM }}
              className="overflow-hidden"
            >
              <p className="mt-4 max-w-[18rem] font-mono text-xs leading-relaxed text-ink/80 sm:text-sm">
                {step.detail}
              </p>
              <span className="label mt-5 inline-flex items-center gap-2 text-gold">
                Explore <ArrowRight size={13} />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
