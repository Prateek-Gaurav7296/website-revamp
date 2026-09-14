/* eslint-disable @next/next/no-img-element -- These layers are 2–72 KB and
 * must sit at exact percentage offsets inside the eye box. next/image wraps
 * them in its own positioned element, which fights the coordinate system that
 * keeps them registered, and would save nothing at this size. */
'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import geometry from '@/content/face-geometry.json';

type Side = 'left' | 'right';

interface EyeProps {
  side: Side;
  /** Normalised, spring-smoothed gaze in [-1, 1]. */
  gazeX: MotionValue<number>;
  gazeY: MotionValue<number>;
  /** 0 open → 1 closed. */
  lid: MotionValue<number>;
}

/**
 * One eye, in three registered layers.
 *
 *   eye-{side}-open.png   the socket with a clean eyeball
 *   iris-{side}.png       the iris disc, free to move
 *   lid-{side}.png        the closed lid, swept down to blink
 *
 * Every number comes from `public/character/geometry.json`, which is generated
 * by `scripts/prepare-face-assets.py` from the source art. Nothing is
 * hand-positioned, and because every value is a percentage of its parent, the
 * layers stay registered at any face size.
 *
 * The iris translates a wrapper that spans the eye box, so a travel of
 * "12.9%" means 12.9% of the eye's own width at every breakpoint — no
 * measuring, no drift.
 */
export function Eye({ side, gazeX, gazeY, lid }: EyeProps) {
  const g = geometry.eyes[side];

  const x = useTransform(gazeX, (v) => `${v * g.travel.x}%`);
  const y = useTransform(gazeY, (v) => `${v * g.travel.y}%`);

  // The lid sweeps down from the brow rather than fading, so it reads as an
  // eyelid rather than a dissolve.
  const lidScale = useTransform(lid, [0, 1], [0, 1]);

  return (
    <div
      className="absolute"
      style={{
        left: `${g.eye.x}%`,
        top: `${g.eye.y}%`,
        width: `${g.eye.w}%`,
        height: `${g.eye.h}%`,
      }}
    >
      <img
        src={`/character/eye-${side}-open.png`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
      />

      {/* The aperture mask is the eye opening. It clips the iris to exactly
          the visible eyeball, so the disc slides under the lids like a real
          one instead of floating over the lashes. */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: `url(/character/aperture-${side}.png)`,
          WebkitMaskImage: `url(/character/aperture-${side}.png)`,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
        }}
      >
        <motion.div className="absolute inset-0" style={{ x, y }}>
          <img
            src={`/character/iris-${side}.png`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute select-none"
            style={{
              left: `${g.iris.x}%`,
              top: `${g.iris.y}%`,
              width: `${g.iris.w}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </motion.div>
      </div>

      <motion.img
        src={`/character/lid-${side}.png`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 h-full w-full origin-top select-none"
        style={{ scaleY: lidScale }}
      />
    </div>
  );
}
