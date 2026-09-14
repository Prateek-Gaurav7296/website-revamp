'use client';

import { animate, useMotionValue, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';

/** Closed-lid dwell. Long enough to register, short enough to feel involuntary. */
const CLOSED_MS = 95;
/** Lid travel each way. A blink is fast; this is the part people get wrong. */
const LID_DOWN_MS = 70;
const LID_UP_MS = 110;

/** Randomised so the rhythm never becomes predictable. */
const MIN_GAP_MS = 2500;
const MAX_GAP_MS = 4000;

/** Roughly one blink in six is a double. Any more and it reads as a twitch. */
const DOUBLE_BLINK_CHANCE = 0.17;
const DOUBLE_GAP_MS = 150;

/**
 * Blink, as a MotionValue from 0 (open) to 1 (closed).
 *
 * Deliberately independent of gaze: the lid animates over whatever the irises
 * are doing, and reopening leaves them exactly where they were looking. That
 * separation is what makes the character read as one creature rather than two
 * effects sharing a face.
 *
 * Nothing here re-renders React — the schedule runs on timers and framer
 * animates the value directly.
 */
export function useBlink(enabled: boolean): MotionValue<number> {
  const lid = useMotionValue(0);

  useEffect(() => {
    if (!enabled) {
      lid.set(0);
      return;
    }

    let timer: number | undefined;
    let cancelled = false;

    const close = () =>
      animate(lid, 1, { duration: LID_DOWN_MS / 1000, ease: [0.4, 0, 0.9, 0.4] });
    const open = () =>
      animate(lid, 0, { duration: LID_UP_MS / 1000, ease: [0.1, 0.7, 0.3, 1] });

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = window.setTimeout(resolve, ms);
      });

    const once = async () => {
      await close();
      await wait(CLOSED_MS);
      await open();
    };

    const loop = async () => {
      while (!cancelled) {
        await wait(MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS));
        if (cancelled) return;

        await once();
        if (cancelled) return;

        if (Math.random() < DOUBLE_BLINK_CHANCE) {
          await wait(DOUBLE_GAP_MS);
          if (cancelled) return;
          await once();
        }
      }
    };

    void loop();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      lid.stop();
      lid.set(0);
    };
  }, [enabled, lid]);

  return lid;
}
