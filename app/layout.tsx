import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import { ChapterRail } from '@/components/layout/ChapterRail';
import { FilmGrain } from '@/components/layout/FilmGrain';
import { Footer } from '@/components/layout/Footer';
import { Leader } from '@/components/layout/Leader';
import { Navbar } from '@/components/layout/Navbar';
import { MotionProvider } from '@/components/primitives/MotionProvider';
import { site } from '@/content/site';
import './globals.css';

/**
 * Two families, three weights total (docs/DESIGN_SYSTEM.md §Typography).
 * Archivo = display grotesk. JetBrains Mono = the technical/lab-notebook layer.
 */
const display = Archivo({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon.ico' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/favicon_io/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <head>
        {/*
          Safety net: framer-motion writes its `initial` styles during SSR, so
          without JS every scroll-revealed block would stay at opacity 0. This
          forces the finished frame instead — the page degrades to a plain,
          fully readable document.
        */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important}
[style*="transform"]{transform:none!important}
[style*="clip-path"]{clip-path:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#work"
          className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-4 focus:py-3 focus:text-stage"
        >
          Skip to content
        </a>
        <MotionProvider>
          <Leader />
          <FilmGrain />
          <ChapterRail />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
