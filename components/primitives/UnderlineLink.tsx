'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { DURATION, EASE_SNAP } from '@/lib/motion';

interface UnderlineLinkProps {
  children: ReactNode;
  href: string;
  external?: boolean;
  className?: string;
}

/**
 * Secondary action. The rule is always present (a visible affordance) and a
 * gold rule wipes across it on hover — the smallest possible version of the
 * same film-wipe language the buttons use.
 */
export function UnderlineLink({ children, href, external, className }: UnderlineLinkProps) {
  return (
    <motion.a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      className={cn(
        'label relative inline-flex min-h-[44px] items-center text-muted transition-colors duration-200 hover:text-ink',
        className
      )}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-2 h-px bg-line" />
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-2 h-px origin-left bg-gold"
        variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
        transition={{ duration: DURATION.state, ease: EASE_SNAP }}
      />
    </motion.a>
  );
}
