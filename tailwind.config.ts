import type { Config } from 'tailwindcss';

/**
 * Design tokens map 1:1 to the palette in docs/DESIGN_SYSTEM.md.
 * Add a token here before reaching for an arbitrary hex value in a component.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        stage: '#0A0A0A',      // default background — the unlit screening room
        'stage-alt': '#0E0E0E', // a 2% lift used to band alternating sections
        surface: '#161616',    // elevated panels, form fields, video mattes
        line: '#2A2A2A',       // hairline rules and grid dividers
        gold: '#D4A24C',       // the spotlight: logo, key CTAs, active states
        bronze: '#8A6A2F',     // hover/pressed, subdued gold, dividers
        ink: '#F2EFE9',        // primary (warm) text
        muted: '#8F8B84',      // captions, metadata, timestamps
        alert: '#B4453A',      // form validation only
      },
      fontFamily: {
        display: ['var(--font-display)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Fluid title-card scale. Clamp keeps hero type edge-to-edge without JS.
        'display-xl': ['clamp(2.75rem, 9vw, 8rem)', { lineHeight: '0.92', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2.25rem, 6vw, 5rem)', { lineHeight: '0.96', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.75rem, 4vw, 3.25rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        label: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.18em' }],
      },
      maxWidth: {
        frame: '96rem', // the page's outer film frame
      },
      transitionTimingFunction: {
        // Shared easing so Reveal/Track motion feels like one camera operator.
        film: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
