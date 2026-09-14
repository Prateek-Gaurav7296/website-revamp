'use client';

import { useMotionValue, useSpring, type MotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Where the character is looking, as two normalised values in [-1, 1].
 *
 * Nothing here touches React state — the pointer writes straight into
 * MotionValues and framer drives the transform off-thread. Moving the mouse
 * across this section causes zero re-renders.
 */
export interface Gaze {
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Point the eyes at a client-space coordinate (pointer, or a focused step). */
  lookAt: (clientX: number, clientY: number) => void;
  /** Drift back to neutral — used when the pointer leaves the section. */
  relax: () => void;
  /** Ref for the element gaze is measured against. */
  faceRef: React.RefObject<HTMLDivElement>;
}

/**
 * How far the pointer must travel from the face's centre, as a multiple of the
 * face's width, before the eyes are at full deflection.
 *
 * Tied to the face's own size so the character behaves the same at every
 * viewport. Set so that a cursor near the edge of the composition produces
 * close to — but not quite — full deflection: the eyes should still have
 * somewhere left to go, or they read as hitting a stop.
 */
const RANGE_MULTIPLIER = 0.62;

/** Vertical is compressed further still; see MAX_TRAVEL_Y in the prep script. */
const VERTICAL_RANGE_SCALE = 0.85;

/**
 * Eye springs, tuned per eye.
 *
 * `stiffness` high enough to feel attentive, `damping` high enough that the
 * iris settles rather than wobbling — overshoot on an eye reads as cartoon.
 * The two eyes differ by a couple of percent so they are not mathematically
 * identical, which is what stops the pair looking like one rigid object.
 */
export const EYE_SPRING = {
  left: { stiffness: 170, damping: 22, mass: 0.9, restDelta: 0.0005 },
  right: { stiffness: 162, damping: 23, mass: 0.94, restDelta: 0.0005 },
} as const;

export function useGaze(): Gaze {
  const faceRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const lookAt = useCallback((clientX: number, clientY: number) => {
    const el = faceRef.current;
    if (!el) return;

    const box = el.getBoundingClientRect();
    if (!box.width) return;

    const cx = box.left + box.width / 2;
    // Aim from the eyes, which sit above the middle of the head, not from the
    // centre of the box — otherwise the character reads as looking too low.
    const cy = box.top + box.height * 0.42;

    const range = box.width * RANGE_MULTIPLIER;
    x.set(clamp((clientX - cx) / range, -1, 1));
    y.set(clamp((clientY - cy) / (range * VERTICAL_RANGE_SCALE), -1, 1));
  }, [x, y]);

  const relax = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { x, y, lookAt, relax, faceRef };
}

/**
 * One eye's spring-smoothed gaze. Called once per eye so each gets its own
 * inertia — the small difference is what makes the pair feel alive.
 */
export function useEyeSpring(gaze: Gaze, side: 'left' | 'right') {
  const config = EYE_SPRING[side];
  return {
    x: useSpring(gaze.x, config),
    y: useSpring(gaze.y, config),
  };
}

/**
 * Drives gaze from the pointer while it is over `element`, and relaxes when it
 * leaves. Listener is passive and does no work beyond a rect read and two
 * MotionValue writes.
 */
export function usePointerGaze(
  gaze: Gaze,
  target: React.RefObject<HTMLElement>,
  enabled: boolean
) {
  const { lookAt, relax } = gaze;

  useEffect(() => {
    const el = target.current;
    if (!el || !enabled) return;

    // Coarse pointers (touch) never hover; gaze is driven by the active step.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onMove = (event: PointerEvent) => lookAt(event.clientX, event.clientY);

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', relax, { passive: true });

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', relax);
    };
  }, [target, lookAt, relax, enabled]);
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
