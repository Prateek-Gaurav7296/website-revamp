import Image from 'next/image';
import { Reveal } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { proofPoints } from '@/content/proof';

/**
 * 05 — The Proof.
 *
 * A strip, not a wall of stat cards. Six numerals in one row on a wide screen,
 * divided by hairlines and nothing else — the numeral is the whole
 * composition, and the note beneath it is a footnote, not a paragraph.
 *
 * It reinforces the work above; it never opens. Keeping it to a single band
 * is what stops it competing with the films.
 */
export function ProofStrip() {
  return (
    <Section
      id="proof"
      index="05"
      kicker="The proof"
      meta={`${proofPoints.length} findings`}
      tone="raised"
      title={['Emotion outperforms information.']}
    >
      {/* gap-px over a line-coloured ground draws every divider for us — no
          nth-child arithmetic to break when a stat is added or removed. */}
      <div className="mt-10 grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {proofPoints.map((point, index) => (
          <Reveal key={point.label} delay={(index % 3) * 0.05} className="bg-stage-alt">
            <div className="flex h-full flex-col px-4 py-6 lg:px-5 lg:py-7">
              <Image
                src={point.icon}
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] object-contain opacity-60"
              />
              <p className="mt-4 text-3xl font-bold leading-none tracking-tight text-gold lg:text-4xl">
                {point.value}
              </p>
              <p className="label mt-3 text-ink">{point.label}</p>
              <p className="mt-2 font-mono text-xs leading-relaxed text-muted">
                {point.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="mt-8 font-mono text-sm text-muted">
          All of it at a fraction of the cost and time it used to take.
        </p>
      </Reveal>
    </Section>
  );
}
