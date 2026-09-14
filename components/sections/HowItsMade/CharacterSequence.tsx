/* eslint-disable @next/next/no-img-element -- The 36 gaze frames are stacked and
 * swapped by direct DOM writes at pointer frequency. next/image wraps each in
 * its own positioned element and adds loader work per frame, which fights both
 * the stacking and the hot path; they are pre-sized WebP already. */
'use client';

import { animate, useMotionValue, useMotionValueEvent, type MotionValue } from 'framer-motion';
import { useEffect, useRef, type RefObject } from 'react';
import manifest from '@/content/gaze-sequence.json';
import { cn } from '@/lib/cn';

interface CharacterSequenceProps {
  /** Spring-smoothed gaze in [-1, 1]; +1 means the cursor is to the right. */
  gaze: MotionValue<number>;
  /** 0 open → 1 closed. */
  lid: MotionValue<number>;
  /**
   * The element gaze is measured against. This must be the character itself:
   * `useGaze` computes the cursor's offset from this box's centre, and returns
   * without doing anything if it is never attached.
   */
  containerRef?: RefObject<HTMLDivElement>;
  className?: string;
  onReady?: () => void;
}

const FRAMES = manifest.frames;
const SRC = (i: number) => `/character/gaze/${String(i).padStart(2, '0')}.webp`;

/**
 * The director, as a cursor-scrubbed frame sequence.
 *
 * Rather than drawing our own iris over a video, the cursor picks which frame
 * of his gaze sweep to show. His real, fully rendered eyes do the looking — so
 * there is no overlay to register, nothing to mask, and the lighting, hair and
 * head pose are all genuinely his.
 *
 * The frames are built by scripts/build-gaze-sequence.py, which stabilises the
 * head (it travels 88px and shrinks 12% across the sweep), drops the blink, and
 * resamples so cursor travel maps onto continuous eye movement. Frame 0 is him
 * looking to the viewer's right; the last frame is the viewer's left.
 *
 * Every frame sits in the DOM at opacity 0 and visibility is swapped by direct
 * style writes from a MotionValue subscription — no React state on the pointer
 * path, so scrubbing the whole sequence costs zero re-renders.
 */
export function CharacterSequence({ gaze, lid, containerRef, className, onReady }: CharacterSequenceProps) {
  const frameRefs = useRef<(HTMLImageElement | null)[]>([]);
  const blinkRef = useRef<HTMLImageElement>(null);
  const current = useRef(-1);
  const loaded = useRef(0);

  const show = (index: number) => {
    if (index === current.current) return;
    const prev = frameRefs.current[current.current];
    const next = frameRefs.current[index];
    if (prev) prev.style.opacity = '0';
    if (next) next.style.opacity = '1';
    current.current = index;
  };

  // Paint the neutral frame immediately so there is never an empty box.
  useEffect(() => {
    show(Math.floor(FRAMES / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(gaze, 'change', (value) => {
    // Cursor right (+1) → he looks to the viewer's right → frame 0.
    const t = (1 - (value + 1) / 2) * (FRAMES - 1);
    show(Math.max(0, Math.min(FRAMES - 1, Math.round(t))));
  });

  useMotionValueEvent(lid, 'change', (value) => {
    const el = blinkRef.current;
    if (el) el.style.opacity = String(value);
  });

  const onLoad = () => {
    loaded.current += 1;
    if (loaded.current === FRAMES) onReady?.();
  };

  return (
    <div
      ref={containerRef}
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
            frameRefs.current[i] = el;
          }}
          src={SRC(i)}
          alt=""
          draggable={false}
          onLoad={onLoad}
          // The middle frame is what shows first, so it is the one that must
          // not wait in the queue behind thirty-five others.
          fetchPriority={i === Math.floor(FRAMES / 2) ? 'high' : 'low'}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={{ opacity: 0 }}
        />
      ))}

      <img
        ref={blinkRef}
        src={`/character/gaze/${manifest.blink}`}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-contain"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

/**
 * Preload every frame before the sequence goes live. Scrubbing through images
 * the browser has not decoded yet shows gaps, which reads as the character
 * stuttering rather than as a loading state.
 */
export function usePreloadedSequence() {
  const ready = useMotionValue(0);

  useEffect(() => {
    let cancelled = false;
    let done = 0;

    for (let i = 0; i < FRAMES; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        done += 1;
        if (!cancelled && done === FRAMES) animate(ready, 1, { duration: 0.4 });
      };
      img.src = SRC(i);
    }

    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
