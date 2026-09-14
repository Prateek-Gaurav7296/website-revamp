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
      {/* The line. Scales from the left so it reads as drawn, not faded in. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px origin-left bg-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: revealed ? 1 : 0 }}
        transition={{ duration: 1.1, ease: EASE_FILM }}
      />
      {/* A short gold travelling segment — the only 'energy' on the line. */}
      <motion.span
        aria-hidden="true"
        className="absolute top-0 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent"
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: [0, 0.9, 0], left: ['0%', '100%'] } : { opacity: 0 }}
        transition={{ duration: 2.6, ease: 'easeInOut', delay: 0.9 }}
      />

      {/* Centred, not flush left: the stages size to their content, so left
          alignment leaves all the slack on one side and the group reads as
          having slipped. */}
      <ol className="flex items-start justify-center gap-6 pt-8 sm:gap-8 lg:gap-12">
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
