'use client';

import { useMotionValue, useSpring, type MotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Where the cursor is across the scene, as 0 (far left) to 1 (far right).
 *
 * Nothing here touches React state — the pointer writes straight into a
 * MotionValue and the frame swap reads it back, so moving the cursor across
 * the whole section causes zero re-renders.
 */
export interface Gaze {
  position: MotionValue<number>;
  /** The element the cursor position is measured across. Attach to the scene. */
  sceneRef: React.RefObject<HTMLDivElement>;
  /** Point at a client-space x (the pointer, or a focused step on touch). */
  lookAt: (clientX: number) => void;
  /** Ease back to centre when the pointer leaves. */
  relax: () => void;
}

/**
 * Spring on the cursor position.
 *
 * The frames are the animation, so this only has to take the edge off: enough
 * inertia that a flicked cursor does not snap the character instantly, little
 * enough that he does not lag behind it. Overshoot is off — an eye that
 * overshoots and settles back reads as cartoon.
 */
const SPRING = { stiffness: 190, damping: 26, mass: 0.85, restDelta: 0.0005 } as const;

export function useGaze(): Gaze {
  const sceneRef = useRef<HTMLDivElement>(null);
  const position = useMotionValue(0.5);

  const lookAt = useCallback(
    (clientX: number) => {
      const el = sceneRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      const t = (clientX - box.left) / box.width;
      position.set(t < 0 ? 0 : t > 1 ? 1 : t);
    },
    [position]
  );

  const relax = useCallback(() => position.set(0.5), [position]);

  return { position, sceneRef, lookAt, relax };
}

/** Spring-smoothed cursor position, in the same 0..1 space. */
export function useGazeSpring(gaze: Gaze) {
  return useSpring(gaze.position, SPRING);
}

/**
 * Drive the gaze from the pointer while it is over the scene, and relax when
 * it leaves. The listener is passive and does nothing beyond a rect read and
 * one MotionValue write.
 */
export function usePointerGaze(gaze: Gaze, enabled: boolean) {
  const { lookAt, relax, sceneRef } = gaze;

  useEffect(() => {
    const el = sceneRef.current;
    if (!el || !enabled) return;

    // Coarse pointers never hover; there the active stage drives the gaze.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onMove = (event: PointerEvent) => lookAt(event.clientX);

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', relax, { passive: true });

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', relax);
    };
  }, [sceneRef, lookAt, relax, enabled]);
}
