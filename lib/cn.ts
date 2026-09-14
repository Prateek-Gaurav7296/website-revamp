import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge has to be taught our custom scales.
 *
 * Both our type sizes and our colours are custom names under the same `text-`
 * prefix (`text-display-lg`, `text-ink`). Out of the box tailwind-merge can't
 * tell them apart, so it treats them as conflicting and keeps only the last —
 * which silently strips the font size off every heading that goes through
 * cn(). Declaring the two groups explicitly is the fix.
 *
 * Adding a colour or a font size to tailwind.config.ts means adding it here
 * too.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display-xl', 'display-lg', 'display-md', 'label'] }],
      'text-color': [
        {
          text: ['stage', 'stage-alt', 'surface', 'line', 'gold', 'bronze', 'ink', 'muted', 'alert'],
        },
      ],
    },
  },
});

/** Merge conditional class names, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
