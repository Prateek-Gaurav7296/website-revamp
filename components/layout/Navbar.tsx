'use client';

import Image from 'next/image';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FilmButton } from '@/components/primitives/FilmButton';
import { navLinks, site, studioLink } from '@/content/site';
import { cn } from '@/lib/cn';

/**
 * Transparent over the hero, compact and matte once the page starts moving.
 * Scroll state is read through rAF so the listener never blocks the frame.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        frame = 0;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300 ease-film',
        scrolled || menuOpen ? 'border-b border-line bg-stage/92 backdrop-blur' : 'bg-transparent'
      )}
    >
      <div className="frame flex h-[var(--header-h)] items-center justify-between gap-4">
        <a
          href="#top"
          className="flex min-h-[44px] items-center gap-3"
          onClick={close}
          aria-label={site.name}
        >
          <Image
            src="/logo/monogram.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-8 w-8 object-contain sm:h-9 sm:w-9"
          />
          <span className="font-mono text-label uppercase text-ink">NextBerry Labs</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Sections">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="label flex min-h-[44px] items-center text-muted transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
          {/* Leaves the site, so it carries an outbound mark rather than
              looking like another section anchor. */}
          <a
            href={studioLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="label flex min-h-[44px] items-center gap-1 text-muted transition-colors hover:text-gold"
          >
            {studioLink.label}
            <ArrowUpRight size={12} />
          </a>

          <FilmButton href="#start" className="px-5">
            Start a film
          </FilmButton>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center text-ink md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="frame flex flex-col gap-1 border-t border-line pb-6 md:hidden" aria-label="Sections">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={close}
              className="label flex min-h-[52px] items-center border-b border-line text-muted"
            >
              {link.label}
            </a>
          ))}
          <a
            href={studioLink.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="label flex min-h-[52px] items-center gap-1 border-b border-line text-muted"
          >
            {studioLink.label}
            <ArrowUpRight size={12} />
          </a>
          <a
            href="#start"
            onClick={close}
            className="label mt-4 flex min-h-[52px] items-center justify-center border border-gold text-gold"
          >
            Start a film
          </a>
        </nav>
      )}
    </header>
  );
}
