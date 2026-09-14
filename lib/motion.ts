/**
 * The motion vocabulary. Every animation in the site pulls its timing from
 * here, so the whole page feels like one camera operator rather than a dozen.
 *
 * Principles (docs/DESIGN_SYSTEM.md §Motion):
 *  - Physical, not decorative. Springs for anything a pointer touches,
 *    eased curves for anything the scroll drives.
 *  - Transform and opacity only — never animate layout properties.
 *  - Short. If a transition reads as "an animation", it is too long.
 */

/** Film-editor easing: fast out of the gate, long settle. Used for reveals. */
export const EASE_FILM = [0.16, 1, 0.3, 1] as const;

/** A tighter curve for state changes the user just caused (press, toggle). */
export const EASE_SNAP = [0.32, 0.72, 0, 1] as const;

/** Pointer-responsive spring. Interruptible: grab it mid-flight and it obeys. */
export const SPRING_POINTER = { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 } as const;

/** Softer spring for larger objects (panels, frames) so they carry weight. */
export const SPRING_HEAVY = { type: 'spring', stiffness: 240, damping: 30, mass: 1 } as const;

export const DURATION = {
  /** Hover and focus feedback — must feel instantaneous. */
  tap: 0.18,
  /** In-place state changes. */
  state: 0.32,
  /** Content entering frame. */
  reveal: 0.68,
  /** A cut between narrative beats. */
  cut: 0.9,
} as const;

/**
 * Viewport trigger shared by every scroll reveal, so beats land in rhythm.
 *
 * Deliberately shallow. Each beat is now a full-screen snap stop with its
 * content centred, which puts the slate close to the top of the screen — a
 * deep top margin excluded it from the observer's band entirely and left it
 * sitting at opacity 0 forever. When the whole section is on screen anyway,
 * there is nothing to gain from waiting.
 */
export const IN_VIEW = { once: true, margin: '-5% 0px -5% 0px' } as const;
