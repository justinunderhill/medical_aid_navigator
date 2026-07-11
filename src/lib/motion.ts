import type { Variants, Transition } from 'framer-motion';

/**
 * Shared motion vocabulary for the flagship flow.
 *
 * Character: calm confidence. Soft ease-out, no bounce, short durations — with
 * ONE longer signature moment (the decision brief assembling itself). Values
 * mirror the motion tokens in `src/styles/tokens.css` so CSS and JS agree.
 *
 * Reduced motion: components read `useReducedMotion()` and pass the result to
 * these builders, which drop movement (and stagger) while keeping a gentle
 * opacity fade — vestibular-safe, and content never fails to appear.
 */

// Matches --ease-out. Soft deceleration curve.
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DUR = {
  micro: 0.18,
  move: 0.26,
  reveal: 0.48,
} as const;

/** View-to-view + step-to-step transition for the flow (calm fade + small rise). */
export function viewVariants(reduce: boolean): Variants {
  return {
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.001 : DUR.move, ease: EASE_OUT },
    },
    exit: {
      opacity: 0,
      y: reduce ? 0 : -6,
      transition: { duration: reduce ? 0.001 : DUR.micro, ease: EASE_OUT },
    },
  };
}

/** Container for the signature moment — staggers its children into place. */
export function briefContainer(reduce: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: reduce
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.09, delayChildren: 0.04 },
    },
  };
}

/** One section of the brief — it rises and fades into place. */
export function briefItem(reduce: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.001 : DUR.reveal, ease: EASE_OUT },
    },
  };
}

/** A generating status step animating in/out as the AI works. */
export function generatingStepVariants(reduce: boolean): Variants {
  return {
    initial: { opacity: 0, y: reduce ? 0 : 6 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.001 : DUR.move, ease: EASE_OUT },
    },
    exit: {
      opacity: 0,
      y: reduce ? 0 : -6,
      transition: { duration: reduce ? 0.001 : DUR.micro, ease: EASE_OUT },
    },
  };
}

/** Gentle on-load entrance for hero elements (home page island). */
export function heroItem(reduce: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reduce ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.001 : DUR.reveal, ease: EASE_OUT },
    },
  };
}

export function heroContainer(reduce: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: reduce
        ? { staggerChildren: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
}

export const instant: Transition = { duration: 0.001 };
