import { Instagram, Linkedin, Youtube, type LucideIcon } from 'lucide-react';
import { navLinks, site, socialLinks, type SocialIcon } from '@/content/site';

const icons: Record<SocialIcon, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
  linkedin: Linkedin,
};

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="frame flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        <p className="label text-muted">© {new Date().getFullYear()} {site.name}</p>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-1" aria-label="Footer">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="label flex min-h-[44px] items-center text-muted transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#start"
            className="label flex min-h-[44px] items-center text-muted transition-colors hover:text-gold"
          >
            Start
          </a>
        </nav>

        <div className="flex items-center gap-1">
          {socialLinks.map((social) => {
            const Icon = icons[social.icon];
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-gold"
              >
                <Icon size={18} />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
