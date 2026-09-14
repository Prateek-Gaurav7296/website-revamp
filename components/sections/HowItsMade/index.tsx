'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { CharacterSequence } from './CharacterSequence';
import { Workflow } from './Workflow';
import { MobileWorkflow } from './MobileWorkflow';
import { useGaze, useGazeSpring, usePointerGaze } from './useGaze';
import { Reveal, RevealLines } from '@/components/primitives/Reveal';
import { Section } from '@/components/primitives/Section';
import { processSteps } from '@/content/process';
import { EASE_FILM } from '@/lib/motion';

/**
 * 04 — How It's Made.
 *
 * A creative director watches the visitor while the five-stage workflow runs
 * across his face at nose height. The character is the spectacle; the
 * interface stays out of its way.
 *
 * Stacking, back to front:
 *   1  ground
 *   2  the face
 *   3  the workflow line
 *   4  the workflow stages
 *   5  the open stage
 *
 * The workflow deliberately crosses at ~62% of the face height — below the
 * eyes, which have to stay clear because they are the interaction.
 */
export function HowItsMade() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const reducedMotion = useReducedMotion();
  const gaze = useGaze();
  const position = useGazeSpring(gaze);

  usePointerGaze(gaze, !reducedMotion);

  /**
   * Touch: there is no cursor, so the active stage drives the gaze instead.
   * The character still looks toward whatever the visitor is reading.
   */
  const lookAtStep = useCallback(
    (index: number) => {
      setActiveStep(index);
      if (reducedMotion) return;

      // On a pointer device the real cursor is already driving this.
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

      // Place a virtual cursor where that stage sits across the screen, so he
      // turns toward whatever the visitor is reading.
      const across = index / (processSteps.length - 1);
      gaze.lookAt(window.innerWidth * (0.1 + across * 0.8));
    },
    [gaze, reducedMotion]
  );

  // Hold the entrance until the section is actually on screen, so the line
  // draws as the visitor arrives rather than before they ever see it.
  useEffect(() => {
    const el = gaze.sceneRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-12% 0px -12% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [gaze.sceneRef]);

  return (
    <Section
      id="process"
      index="04"
      kicker="How it's made"
      meta={`${processSteps.length} stages`}
    >
      {/* Heading and intro share a row so the face starts high on the screen.
          The character, not the copy, is the point of this beat. */}
      <div className="grid grid-cols-12 items-end gap-x-4 gap-y-8">
        <RevealLines
          className="col-span-12 text-display-md font-bold text-ink lg:col-span-7"
          lines={[<>Someone is still</>, <>directing all of this.</>]}
        />
        <Reveal delay={0.08} className="col-span-12 lg:col-span-5">
          <p className="max-w-sm font-mono text-sm leading-relaxed text-muted lg:ml-auto">
            Five stages, one point of view. The models render; the direction is
            ours — and it is the part you are actually hiring.
          </p>
        </Reveal>
      </div>

      {/* The stage. Gaze is measured against this whole box, so the character
          reacts to the composition rather than only to his own head. */}
      {/* The scene. Cursor position is measured across the viewport, not this
          box, so the screen's left and right edges are the first and last
          frames — see useGaze. */}
      <div ref={gaze.sceneRef} className="relative mt-10 md:mt-4">
        {/*
          Sticky lives here, not on the clipped box below: a sticky element can
          only travel inside its own parent, and that box's parent ends exactly
          where the stage list begins — so pinning it there did nothing. This
          wrapper's parent contains the list too, which is what lets the head
          stay put for the whole scroll.
        */}
        <div className="sticky top-[var(--header-h)] z-20 md:static md:z-auto">
          {/*
            Clipped for two reasons: the face is deliberately oversized on
            small screens and must never be able to scroll the page sideways,
            and on mobile the box is cropped to hair-through-nose so the pinned
            head takes a sensible slice of a phone screen.

            Sticky on mobile: without it the character scrolls away before the
            visitor reaches the stages, and the whole point — that he reacts to
            the stage you are reading — is never seen. On desktop the workflow
            already sits across the face, so it goes back to static.
          */}
          <div className="relative aspect-[5/4] overflow-hidden bg-stage md:aspect-auto md:bg-transparent">
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={revealed ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1.3, ease: EASE_FILM }}
            >
              <CharacterSequence
                position={position}
                // The clip is used uncropped, and its 16:9 frame carries a lot
                // of empty background either side of the head — so the element
                // has to run wide for the head itself to read large. At lg it
                // is exactly the page width, which keeps the whole frame
                // visible; the narrower breakpoints oversize it and let the
                // plate clip, because on a phone the alternative is a head the
                // size of a postage stamp.
                className="relative left-1/2 w-[133%] max-w-none -translate-x-1/2 sm:w-[98%] lg:w-[70%]"
              />
            </motion.div>

            {/*
              The key light falls off below the eyes.

              This one gradient does three jobs: it gives the workflow type a
              dark field to sit on without putting a card behind it, it
              dissolves the hard bottom edge of the cut-out so the head is in
              the room rather than pasted on it, and it keeps the eyes as the
              only fully lit thing on screen — which is the whole point of the
              section. Lighting, not a UI panel.

              The stops are percentages of the *visible box*, and mobile crops
              that box much tighter than desktop, so the two need separate
              ramps — sharing one ramp puts the falloff straight across the
              eyes on a phone.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 md:hidden"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 58%, rgba(10,10,10,0.5) 72%, rgba(10,10,10,0.95) 86%, #0A0A0A 94%)',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden md:block"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 38%, rgba(10,10,10,0.45) 54%, rgba(10,10,10,0.82) 68%, rgba(10,10,10,0.97) 82%, #0A0A0A 92%)',
              }}
            />
          </div>

          {/* Mobile only: a short fade hanging off the bottom of the pinned
              head, so stages dissolve as they pass under his jaw instead of
              being sliced off at the edge of an opaque box. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full h-10 bg-gradient-to-b from-stage to-transparent md:hidden"
          />

          {/* Desktop: the workflow crosses the face at nose height — below the
              eyes, which stay clear because they are the interaction. */}
          <div className="absolute inset-x-0 top-[61%] z-20 hidden md:block">
            <Workflow openIndex={openIndex} onOpen={setOpenIndex} revealed={revealed} />
          </div>
        </div>

        {/* Touch: the same five stages, stacked and tappable. They scroll up and
            pass behind the pinned head, which stays watching the whole way —
            the face is opaque and sits above, so stages simply disappear under
            his jaw. The scrim already fades the head into the ground, so the
            seam between the two is invisible. */}
        <div className="relative z-0 md:hidden">
          <MobileWorkflow activeIndex={activeStep} onActivate={lookAtStep} revealed={revealed} />
        </div>
      </div>

    </Section>
  );
}
