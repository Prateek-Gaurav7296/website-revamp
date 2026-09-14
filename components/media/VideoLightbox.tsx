'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { Film } from '@/content/work';
import { getYouTubeEmbed } from '@/lib/youtube';

interface VideoLightboxProps {
  film: Film | null;
  onClose: () => void;
}

/**
 * Fullscreen player. Films open here rather than on YouTube, so quality is
 * judged on our page. Escape closes; body scroll is locked while open.
 */
export function VideoLightbox({ film, onClose }: VideoLightboxProps) {
  useEffect(() => {
    if (!film) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [film, onClose]);

  const embedUrl = film ? getYouTubeEmbed(film.youtubeUrl) : null;

  return (
    <AnimatePresence>
      {film && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-stage/97 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${film.title} — ${film.client}`}
          onClick={onClose}
        >
          <div className="frame flex items-center justify-between py-5">
            <p className="label">
              {film.client} <span className="text-line">/</span> {film.format}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted transition-colors hover:text-gold"
              aria-label="Close player"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
            <div
              className="aspect-video w-full max-w-6xl bg-surface"
              onClick={(event) => event.stopPropagation()}
            >
              {film.previewSrc ? (
                <video
                  src={film.previewSrc}
                  poster={film.posterSrc}
                  preload="metadata"
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={film.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
