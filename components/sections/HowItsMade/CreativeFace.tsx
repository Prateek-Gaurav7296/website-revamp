'use client';

import { motion, type MotionValue } from 'framer-motion';
import Image from 'next/image';
import { Eye } from './Eye';
import { useEyeSpring, type Gaze } from './useGaze';
import geometry from '@/content/face-geometry.json';

interface CreativeFaceProps {
  gaze: Gaze;
  lid: MotionValue<number>;
  className?: string;
}

/**
 * The creative director.
 *
 * One positioned container establishes the source coordinate system
 * (1536 × 1024). The base head never moves; the eyes are children of that same
 * system, so scaling the container cannot make them drift.
 *
 * Layer order inside the face: base head → eyes. The workflow that crosses the
 * face is a sibling in HowItsMade, stacked above this.
 */
export function CreativeFace({ gaze, lid, className }: CreativeFaceProps) {
  const left = useEyeSpring(gaze, 'left');
  const right = useEyeSpring(gaze, 'right');

  return (
    <motion.div
      ref={gaze.faceRef}
      className={className}
      style={{ aspectRatio: geometry.canvas.aspect }}
    >
      <div className="relative h-full w-full">
        {/* The base head is a 2.4 MB PNG, so it goes through next/image to be
            served as AVIF/WebP at the size actually rendered. The small eye
            layers below do not — see Eye.tsx. */}
        <Image
          src="/character/face-base.png"
          alt="A creative director, watching"
          fill
          sizes="(max-width: 768px) 128vw, (max-width: 1024px) 112vw, 64rem"
          priority={false}
          draggable={false}
          className="select-none object-contain"
        />

        <Eye side="left" gazeX={left.x} gazeY={left.y} lid={lid} />
        <Eye side="right" gazeX={right.x} gazeY={right.y} lid={lid} />
      </div>
    </motion.div>
  );
}
