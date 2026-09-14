'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { DURATION, EASE_SNAP, SPRING_POINTER } from '@/lib/motion';

interface FilmButtonProps {
  children: ReactNode;
  href?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  /** `solid` is the single primary action per screen. */
  variant?: 'outline' | 'solid';
  className?: string;
}

/**
 * The site's one button.
 *
 * Hover is a gold *wipe* from the left edge — a film transition, not a glow —
 * and the press is a spring-driven scale so the control answers the pointer
 * physically. Both are transform/clip only, so they stay on the compositor.
 */
export function FilmButton({
  children,
  href,
  type = 'button',
  onClick,
  disabled,
  variant = 'outline',
  className,
}: FilmButtonProps) {
  const isSolid = variant === 'solid';

  const content = (
    <>
      {/* The wipe. Sits under the label, clipped to zero width until hover. */}
      <motion.span
        aria-hidden="true"
        className={cn('absolute inset-0', isSolid ? 'bg-stage' : 'bg-gold')}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        variants={{ hover: { clipPath: 'inset(0 0% 0 0)' } }}
        transition={{ duration: DURATION.state, ease: EASE_SNAP }}
      />
      <motion.span
        className="relative z-10 block"
        variants={{ hover: { color: isSolid ? '#D4A24C' : '#0A0A0A' } }}
        transition={{ duration: DURATION.state, ease: EASE_SNAP }}
      >
        {children}
      </motion.span>
    </>
  );

  const classes = cn(
    'label relative inline-flex min-h-[48px] items-center overflow-hidden border px-7',
    isSolid ? 'border-gold bg-gold text-stage' : 'border-line text-gold hover:border-gold',
    disabled && 'pointer-events-none opacity-50',
    className
  );

  const motionProps = {
    initial: 'rest',
    whileHover: 'hover',
    whileFocus: 'hover',
    whileTap: { scale: 0.97 },
    transition: SPRING_POINTER,
  } as const;

  if (href) {
    return (
      <motion.a href={href} className={classes} {...motionProps}>
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} className={classes} {...motionProps}>
      {content}
    </motion.button>
  );
}
