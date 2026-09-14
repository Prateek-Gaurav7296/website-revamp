import Image from 'next/image';
import { Reveal, RevealLines } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { proofPoints } from '@/content/proof';

/**
 * 05 — The Proof.
 *
 * The numeral is the composition: display scale, gold, with the label and
 * source note as mono footnotes. Six equal icon cards would flatten the
 * hierarchy straight back out.
 */
export function ProofStrip() {
  return (
    <Section
      id="proof"
      index="05"
      kicker="The proof"
      meta={`${proofPoints.length} findings`}
      tone="raised"
      title={['Emotion outperforms information.', 'Every time.']}
    >
      {/* gap-px over a line-coloured ground draws every divider for us — no
          nth-child arithmetic to break when a stat is added or removed. */}
      <div className="mt-16 grid grid-cols-1 gap-px border-y border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {proofPoints.map((point, index) => (
          <Reveal key={point.label} delay={(index % 3) * 0.06} className="bg-stage-alt">
            <div className="flex h-full flex-col justify-between px-5 py-10 lg:px-8">
              <div className="flex items-center gap-3">
                <Image
                  src={point.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain opacity-70"
                />
                <p className="label text-muted">{point.label}</p>
              </div>

              <p className="mt-10 text-6xl font-bold leading-none tracking-tight text-gold md:text-7xl">
                {point.value}
              </p>

              <p className="mt-5 max-w-xs font-mono text-sm leading-relaxed text-muted">
                {point.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <RevealLines
        className="mt-16 max-w-4xl text-display-md font-bold text-ink"
        lines={[<>All of it at a fraction</>, <>of the cost and time.</>]}
      />
    </Section>
  );
}
