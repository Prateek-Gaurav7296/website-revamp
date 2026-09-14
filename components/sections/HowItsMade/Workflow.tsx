'use client';

import { motion } from 'framer-motion';
import { WorkflowStep } from './WorkflowStep';
import { processSteps } from '@/content/process';
import { EASE_FILM } from '@/lib/motion';

interface WorkflowProps {
  /** Index of the open stage, or null. Owned by HowItsMade. */
  openIndex: number | null;
  onOpen: (index: number | null) => void;
  /** Set once the section has scrolled in, to draw the line. */
  revealed: boolean;
}

/**
 * The five-stage workflow, laid across the director's face at nose height.
 *
 * The line is one hairline rule that draws itself left to right, with the
 * stages hanging beneath it. It is a single flex row, so opening a stage
 * pushes its neighbours along the line rather than reflowing the page.
 */
export function Workflow({ openIndex, onOpen, revealed }: WorkflowProps) {
  return (
    <div className="relative">
      {/*
        The line, and the light that runs along it.

        Both live inside a clipping wrapper. The travelling segment animates
        `left` to 100%, which puts its left edge on the container's right edge
        and leaves its 96px body hanging past it — enough to make the whole page
        scroll sideways, and it stays there because the animation is one-shot.
        Clipping here is the fix; `overflow-x: hidden` on body is not, because
        the scroll happens on the document element.
      */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px overflow-hidden">
        {/* Scales from the left so it reads as drawn, not faded in. */}
        <motion.span
          className="absolute inset-0 origin-left bg-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: revealed ? 1 : 0 }}
          transition={{ duration: 1.1, ease: EASE_FILM }}
        />
        {/* A short gold pass — the only 'energy' on the line. */}
        <motion.span
          className="absolute top-0 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent"
          initial={{ opacity: 0 }}
          animate={revealed ? { opacity: [0, 0.9, 0], left: ['0%', '100%'] } : { opacity: 0 }}
          transition={{ duration: 2.6, ease: 'easeInOut', delay: 0.9 }}
        />
      </div>

      <ol className="flex w-full items-start justify-center gap-6 pt-8 sm:gap-8 lg:gap-12">
        {processSteps.map((step, index) => (
          <li key={step.number} className="contents">
            <WorkflowStep
              step={step}
              isOpen={openIndex === index}
              isDimmed={openIndex !== null && openIndex !== index}
              onOpen={() => onOpen(index)}
              onClose={() => onOpen(null)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
