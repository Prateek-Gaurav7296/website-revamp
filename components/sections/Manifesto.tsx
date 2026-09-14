import { Reveal, RevealLines } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';

/**
 * 02 — The Premise.
 *
 * The largest type on the page after the hero and the least decorated: a
 * statement, then two mono columns. Belief first; proof waits until reel 05.
 */
export function Manifesto() {
  return (
    <Section id="premise" index="02" kicker="The premise" meta="Manifesto">
      <RevealLines
        className="max-w-6xl text-display-lg font-bold leading-[0.98] text-ink"
        lines={[
          <>AI didn&apos;t make film</>,
          <>cheaper. It made the</>,
          <><span className="text-gold">second idea</span> affordable.</>,
        ]}
      />

      <div className="mt-16 grid gap-10 border-t border-line pt-10 md:grid-cols-12 md:gap-8">
        <Reveal className="md:col-span-2">
          <p className="label">Note</p>
        </Reveal>
        <Reveal delay={0.06} className="md:col-span-5">
          <p className="font-mono text-sm leading-relaxed text-muted">
            The old constraint was never imagination. It was the cost of being wrong —
            one shoot, one crew, one cut, and no budget left for the braver version.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="md:col-span-5">
          <p className="font-mono text-sm leading-relaxed text-muted">
            So we direct first and generate second. The result is a film with a point
            of view, made in the time it used to take to schedule the shoot.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
