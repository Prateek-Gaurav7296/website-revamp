import { CinematicHero } from '@/components/sections/CinematicHero';
import { Manifesto } from '@/components/sections/Manifesto';
import { WorkShowcase } from '@/components/sections/WorkShowcase';
import { HowItsMade } from '@/components/sections/HowItsMade';
import { ProofStrip } from '@/components/sections/ProofStrip';
import { TestimonialFullbleed } from '@/components/sections/TestimonialFullbleed';
import { TeamSection } from '@/components/sections/TeamSection';
import { ContactInvite } from '@/components/sections/ContactInvite';

/**
 * The homepage is a narrative arc, not a funnel. Each component below is one
 * beat from docs/ARCHITECTURE.md §Narrative beats — keep them in this order.
 */
export default function HomePage() {
  return (
    <>
      <CinematicHero />
      <Manifesto />
      <WorkShowcase />
      <HowItsMade />
      <ProofStrip />
      <TestimonialFullbleed />
      <TeamSection />
      <ContactInvite />
    </>
  );
}
