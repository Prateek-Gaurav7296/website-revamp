'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { SPRING_HEAVY } from '@/lib/motion';

/** Chapter ids in page order. Mirrors app/page.tsx. */
const CHAPTERS = [
  { id: 'top', number: '01' },
  { id: 'premise', number: '02' },
  { id: 'work', number: '03' },
  { id: 'process', number: '04' },
  { id: 'proof', number: '05' },
  { id: 'testimonials', number: '06' },
  { id: 'team', number: '07' },
  { id: 'start', number: '08' },
] as const;

/**
 * The reel counter: a fixed rail down the left edge showing which chapter is
 * on screen, plus a gold progress bar for the whole page.
 *
 * This is the site's scroll-storytelling spine — it makes the page read as a
 * sequence of reels rather than a scrolling document. Desktop only; on small
 * screens the chapter slates in the content already do this job.
 *
 * Section tracking uses an IntersectionObserver (no scroll listener), and the
 * progress bar is a spring-smoothed scroll value, so neither costs a frame.
 */
export function ChapterRail() {
  const [active, setActive] = useState('top');
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, SPRING_HEAVY);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      // A band across the middle of the viewport decides the active chapter.
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    CHAPTERS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <aside
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30 hidden h-screen w-16 items-center justify-center xl:flex"
    >
      <div className="flex items-stretch gap-3">
        <ul className="flex flex-col gap-5">
          {CHAPTERS.map((chapter) => (
            <li key={chapter.id}>
              <span
                className={cn(
                  'block font-mono text-[10px] tracking-[0.14em] transition-colors duration-300',
                  active === chapter.id ? 'text-gold' : 'text-line'
                )}
              >
                {chapter.number}
              </span>
            </li>
          ))}
        </ul>

        {/* Page progress: one gold hairline running the height of the reel list. */}
        <div className="w-px bg-line">
          <motion.div className="h-full w-full origin-top bg-gold" style={{ scaleY: progress }} />
        </div>
      </div>
    </aside>
  );
}
