'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { DURATION, EASE_FILM, IN_VIEW } from '@/lib/motion';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * The baseline entrance: a short lift, no fade-from-far-away.
 *
 * Deliberately understated — the expressive reveals live in RevealLines and
 * RevealFrame. Use this for supporting copy, never on every item in a list.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={IN_VIEW}
      transition={{ duration: DURATION.reveal, delay, ease: EASE_FILM }}
    >
      {children}
    </motion.div>
  );
}

interface RevealLinesProps {
  /** Each string is one typeset line, revealed from behind its own matte. */
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
}

/**
 * Title-card reveal: each line slides up from behind a hard matte, the way a
 * film title resolves. No fade — the matte does the work, which is why it
 * reads as optical rather than as a web transition.
 *
 * The trigger lives on the OUTER element on purpose. An IntersectionObserver
 * clips an element's intersection rect against its ancestors' overflow, so a
 * line parked at translateY(110%) inside its own `overflow-hidden` matte has
 * an empty visible rect and never reports as intersecting — watching the line
 * itself makes the reveal fire only by accident. The outer element is
 * unclipped, and framer propagates the variant down to each line.
 */
export function RevealLines({ lines, className, lineClassName, delay = 0 }: RevealLinesProps) {
  return (
    <motion.span
      className={cn('block', className)}
      initial="hidden"
      whileInView="shown"
      viewport={IN_VIEW}
    >
      {lines.map((line, index) => (
        // overflow-hidden is the matte; the padding stops descenders clipping.
        <span key={index} className="block overflow-hidden pb-[0.12em]">
          <motion.span
            className={cn('block', lineClassName)}
            variants={{ hidden: { y: '110%' }, shown: { y: '0%' } }}
            transition={{
              duration: DURATION.cut,
              delay: delay + index * 0.08,
              ease: EASE_FILM,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/**
 * Frame reveal: the image is uncovered by a wipe rather than faded in, so
 * media arrives like a cut and never looks like a loading placeholder.
 */
export function RevealFrame({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={IN_VIEW}
      transition={{ duration: DURATION.cut, delay, ease: EASE_FILM }}
    >
      {children}
    </motion.div>
  );
}
