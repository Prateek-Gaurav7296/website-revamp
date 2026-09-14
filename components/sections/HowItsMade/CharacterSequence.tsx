/* eslint-disable @next/next/no-img-element -- The frames are stacked and swapped
 * by direct DOM writes at pointer frequency. next/image wraps each in its own
 * positioned element and adds loader work per frame, which fights both the
 * stacking and the hot path; these are pre-sized WebP already. */
'use client';

import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import manifest from '@/content/gaze-frames.json';
import { cn } from '@/lib/cn';

interface CharacterSequenceProps {
  /** Spring-smoothed cursor position across the scene, 0 (left) to 1 (right). */
  position: MotionValue<number>;
  className?: string;
}

const FRAMES = manifest.frames;
const SRC = (i: number) => `/character/frames/${String(i).padStart(3, '0')}.webp`;

/**
 * Frame 0 has him looking to the VIEWER'S LEFT, and the last frame to the
 * viewer's right — the sweep runs left to right across the screen.
 *
 * So the cursor maps straight onto the clip: the left edge of the scene shows
 * frame 0, a step right shows the next, and the right edge shows the last.
 *
 * Verify this by eye against the built frames before trusting it — zoomed out,
 * the iris offset is easy to read backwards, and getting it wrong makes the
 * character look away from the cursor instead of at it.
 */
const REVERSE_SWEEP = false;

/**
 * The clip blinks twice: frames 2-6 and 53-57. Mapped literally, those become
 * cursor positions where the character sits with his eyes shut — one at the
 * right edge of the scene and one just left of centre, which is where a cursor
 * rests most of the time. Sweeping past a blink looks natural; parking on one
 * looks broken.
 *
 * So a blink slice shows the nearest open-eyed frame instead. Every frame still
 * owns its pixel range; only what is drawn during those two short bands
 * changes, and the mapping stays monotonic and continuous.
 *
 * Set this to false for the literal frame-for-pixel mapping, blinks included.
 */
const SKIP_BLINK_FRAMES = true;

/** Nearest frame that is not part of a blink, for each frame index. */
const RESOLVED: number[] = (() => {
  const blinks = new Set(manifest.blinkFrames ?? []);
  return Array.from({ length: FRAMES }, (_, i) => {
    if (!SKIP_BLINK_FRAMES || !blinks.has(i)) return i;
    for (let d = 1; d < FRAMES; d++) {
      if (i - d >= 0 && !blinks.has(i - d)) return i - d;
      if (i + d < FRAMES && !blinks.has(i + d)) return i + d;
    }
    return i;
  });
})();

/**
 * The director, as a cursor-scrubbed frame set.
 *
 * Every frame of the clip owns an equal slice of the scene's width: the cursor
 * at one edge shows the first frame, a step right shows the next, and so on to
 * the far edge. His real, fully rendered eyes do the looking, so there is no
 * overlay to keep registered and nothing to mask — the lighting, hair,
 * headphones and head movement are all genuinely his, and the clip's own
 * blinks are simply part of the sweep.
 *
 * Every frame sits in the DOM at opacity 0 and the active one is swapped by a
 * direct style write from a MotionValue subscription, so scrubbing the whole
 * set costs zero React re-renders.
 */
export function CharacterSequence({ position, className }: CharacterSequenceProps) {
  const refs = useRef<(HTMLImageElement | null)[]>([]);
  const current = useRef(-1);

  const show = (index: number) => {
    if (index === current.current) return;
    const prev = refs.current[current.current];
    const next = refs.current[index];
    if (prev) prev.style.opacity = '0';
    if (next) next.style.opacity = '1';
    current.current = index;
  };

  const frameFor = (t: number) => {
    const slice = REVERSE_SWEEP ? 1 - t : t;
    const index = Math.max(0, Math.min(FRAMES - 1, Math.floor(slice * FRAMES)));
    return RESOLVED[index];
  };

  // Paint the neutral frame immediately so the box is never empty.
  useEffect(() => {
    show(frameFor(0.5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(position, 'change', (t) => show(frameFor(t)));

  return (
    <div
      className={cn('relative', className)}
      style={{ aspectRatio: manifest.aspect }}
      data-character="sequence"
      role="img"
      aria-label="A creative director, watching"
    >
      {Array.from({ length: FRAMES }, (_, i) => (
        <img
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          src={SRC(i)}
          alt=""
          draggable={false}
          // The frame shown first must not queue behind ninety-nine others.
          fetchPriority={i === frameFor(0.5) ? 'high' : 'low'}
          loading={i === frameFor(0.5) ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={{ opacity: 0 }}
        />
      ))}
    </div>
  );
}
