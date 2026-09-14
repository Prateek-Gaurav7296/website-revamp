'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { EASE_FILM } from '@/lib/motion';

const SEEN_KEY = 'nbl.leader.seen';

/**
 * The opening title card — a film leader.
 *
 * Runs once per browser session: two mono lines count in, then the whole plate
 * lifts away as a hard wipe, handing the page to the hero. It is ~1.4s, it is
 * skipped entirely on a repeat visit, and it is skipped for reduced-motion
 * users (framer's MotionConfig collapses the transitions, and we bail early).
 *
 * The page underneath is fully rendered and scrollable the whole time — this
 * gates nothing, which is the only reason an intro like this is defensible.
 */
export function Leader() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem(SEEN_KEY) === '1';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Skip when the tab is in the background: rAF is paused there, so the
    // plate would simply sit over the page until the visitor came back.
    if (alreadySeen || reduced || document.hidden) return;

    sessionStorage.setItem(SEEN_KEY, '1');
    setPlaying(true);

    const timer = window.setTimeout(() => setPlaying(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {playing && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[70] flex items-end bg-stage"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: 0.7, ease: EASE_FILM }}
        >
          <div className="frame pb-14">
            <motion.p
              className="label text-gold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE_FILM }}
            >
              NextBerry Labs
            </motion.p>
            <motion.p
              className="mt-4 font-mono text-sm text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25, ease: EASE_FILM }}
            >
              Reel 01 <span className="text-line">/</span> Picture start
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
