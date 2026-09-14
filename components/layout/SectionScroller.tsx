'use client';

import { useEffect } from 'react';

/**
 * One scroll gesture, one beat.
 *
 * CSS scroll-snap alone does not do this. Mandatory snapping decides where to
 * land from where the gesture *ended*, so a single wheel notch — well under
 * half a screen — snaps straight back to the section you were already on, and
 * the page appears frozen. This takes the gesture and moves exactly one
 * section, which is what "one scroll, one section" actually means.
 *
 * CSS keeps `scroll-snap-type: proximity` underneath as the fallback: gentle,
 * never traps anyone, and still tidies up the scroll position if this never
 * runs.
 *
 * Deliberately limited:
 *   - pointer devices at `md` and up only. On a phone the sections do not fit
 *     one screen at a readable size, so taking over the scroll would hide
 *     content.
 *   - off under `prefers-reduced-motion`. Animated jumps are exactly what that
 *     setting is asking us not to do.
 *   - keyboard, scrollbar dragging and anchor links are untouched, so there is
 *     always a way to move that this does not mediate.
 */
const COOLDOWN_MS = 700;
/** Below this the gesture is trackpad jitter, not an intent to move on. */
const MIN_DELTA = 8;

export function SectionScroller() {
  useEffect(() => {
    const fine = window.matchMedia('(min-width: 768px) and (pointer: fine)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    let detach: (() => void) | undefined;

    const attach = () => {
      detach?.();
      detach = undefined;
      if (!fine.matches || calm.matches) return;

      let locked = false;
      let timer: number | undefined;

      const sections = () =>
        [...document.querySelectorAll<HTMLElement>('section[id]')].sort(
          (a, b) => a.offsetTop - b.offsetTop
        );

      const currentIndex = (list: HTMLElement[]) => {
        const y = window.scrollY;
        let best = 0;
        let bestGap = Infinity;
        list.forEach((section, i) => {
          const gap = Math.abs(section.offsetTop - y);
          if (gap < bestGap) {
            bestGap = gap;
            best = i;
          }
        });
        return best;
      };

      const onWheel = (event: WheelEvent) => {
        // Let anything that scrolls on its own keep its gesture: the mobile
        // film strip, a textarea, the open film player.
        const target = event.target as HTMLElement | null;
        if (target?.closest('[data-scroll-free], textarea, [role="dialog"]')) return;

        if (Math.abs(event.deltaY) < MIN_DELTA) return;
        event.preventDefault();
        if (locked) return;

        const list = sections();
        if (!list.length) return;

        const next = currentIndex(list) + (event.deltaY > 0 ? 1 : -1);
        if (next < 0) return;

        locked = true;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          locked = false;
        }, COOLDOWN_MS);

        if (next >= list.length) {
          // Past the last beat is the footer.
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          return;
        }
        window.scrollTo({ top: list[next].offsetTop, behavior: 'smooth' });
      };

      window.addEventListener('wheel', onWheel, { passive: false });
      detach = () => {
        window.removeEventListener('wheel', onWheel);
        window.clearTimeout(timer);
      };
    };

    attach();
    fine.addEventListener('change', attach);
    calm.addEventListener('change', attach);

    return () => {
      fine.removeEventListener('change', attach);
      calm.removeEventListener('change', attach);
      detach?.();
    };
  }, []);

  return null;
}
