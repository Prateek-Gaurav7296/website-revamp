import Image from 'next/image';
import { Reveal, RevealFrame } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { founders } from '@/content/team';

/**
 * 07 — Who's Behind It.
 *
 * Portraits are tall, hard-cropped and desaturated until hovered — colour
 * returning is the one "reward" interaction on the page. The second column is
 * offset downward so the pair reads as a spread, not a staff directory.
 */
export function TeamSection() {
  return (
    <Section
      id="team"
      index="07"
      kicker="Who's behind it"
      meta="2 founders"
      tone="raised"
      title={['Two founders.', 'One edit suite.']}
    >
      <div className="mt-16 grid grid-cols-12 gap-x-4 gap-y-16">
        {founders.map((founder, index) => (
          <div
            key={founder.id}
            className={
              index === 0
                ? 'col-span-12 md:col-span-5'
                : 'col-span-12 md:col-span-5 md:col-start-8 md:mt-28'
            }
          >
            <RevealFrame>
              <div className="group relative aspect-[4/5] w-full overflow-hidden bg-surface">
                <Image
                  src={founder.image}
                  alt={founder.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 42vw"
                  className="object-cover object-top grayscale transition-[filter,transform] duration-700 ease-film group-hover:scale-[1.03] group-hover:grayscale-0"
                />
              </div>
            </RevealFrame>

            <Reveal delay={0.08}>
              <div className="mt-5 border-t border-line pt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl font-bold text-ink md:text-3xl">{founder.name}</h3>
                  <p className="label shrink-0 text-gold">{founder.role}</p>
                </div>
                <p className="mt-5 font-mono text-sm leading-relaxed text-muted">{founder.bio}</p>
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </Section>
  );
}
