'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Single source of truth for reduced motion.
 *
 * `reducedMotion="user"` makes framer-motion read the OS setting and strip
 * transform/opacity animations itself, so components stay written one way and
 * there is no hydration flash from branching on a media query in render.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
