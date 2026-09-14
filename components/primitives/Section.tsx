import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Reveal, RevealLines } from './Reveal';

interface SectionProps {
  id: string;
  /** Reel number, e.g. "02". */
  index: string;
  /** Chapter name, e.g. "The premise". */
  kicker: string;
  /** Right-hand slate metadata, e.g. "06 films". Optional. */
  meta?: string;
  /** Title lines. Break them where the composition wants, not the sentence. */
  title?: ReactNode[];
  /** `raised` lifts the ground 2% to band this beat off its neighbours. */
  tone?: 'base' | 'raised';
  /** Set when the section lays out its own full-bleed children. */
  bleed?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * The chassis every narrative beat is built on.
 *
 * One component owns the whole sectioning system, which is what makes the page
 * read as tidy: identical vertical rhythm, identical slate, identical rules.
 *
 *   ┌─ full-bleed hairline ─────────────────────────────────┐
 *   │ 03   THE WORK                             06 FILMS    │  ← the slate
 *   │                                                        │
 *   │ Six films.                                             │  ← title card
 *   │ None of them look like a template.                     │
 *   └────────────────────────────────────────────────────────┘
 *
 * The top rule runs edge to edge rather than stopping at the page gutter —
 * that is the single biggest thing separating one beat from the next, and it
 * is why the sections no longer bleed into one another.
 *
 * Adding a section means adding one <Section> here and one entry in
 * ChapterRail's CHAPTERS array. Nothing else.
 */
export function Section({
  id,
  index,
  kicker,
  meta,
  title,
  tone = 'base',
  bleed = false,
  children,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative border-t border-line py-24 md:py-32',
        tone === 'raised' ? 'bg-stage-alt' : 'bg-stage',
        className
      )}
    >
      <div className="frame">
        {/* The slate. Numerals hang in their own column so every section's
            title starts on exactly the same optical axis. */}
        <Reveal className="flex items-baseline justify-between gap-6">
          <p className="label flex items-baseline gap-5">
            <span className="text-gold">{index}</span>
            <span className="hidden h-px w-10 self-center bg-line sm:block" />
            <span className="text-ink">{kicker}</span>
          </p>
          {meta && <p className="label shrink-0 text-line">{meta}</p>}
        </Reveal>

        {title && (
          <RevealLines
            className="mt-12 max-w-5xl text-display-md font-bold text-ink md:mt-16"
            delay={0.06}
            lines={title}
          />
        )}
      </div>

      {bleed ? children : <div className="frame">{children}</div>}
    </section>
  );
}
