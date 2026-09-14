'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Film } from '@/content/work';
import { cn } from '@/lib/cn';
import { DURATION, EASE_FILM, SPRING_POINTER } from '@/lib/motion';
import { getYouTubePoster, getYouTubePosterFallback } from '@/lib/youtube';

interface FilmFrameProps {
  film: Film;
  /** Position in the grid — printed as the frame's slate number. */
  index: number;
  onOpen: (film: Film) => void;
  /** Tailwind aspect class. The Work grid varies this row to row. */
  ratio?: string;
  priority?: boolean;
  className?: string;
}

/**
 * One film: a hard-edged frame with a slate line beneath it. No card, no
 * radius, no shadow.
 *
 * Where the film has a self-hosted mp4, the video element is *both* the still
 * and the preview — it is seeked to `posterTime` and simply starts playing on
 * hover, so there is no poster-to-video swap to get wrong and no stock image
 * standing in for a frame of the actual film.
 *
 * Hover does three things at once, all on the compositor: the media pushes in
 * on a spring (interruptible — grab it mid-flight and it obeys), the loop
 * starts, and a gold rule wipes across the slate.
 */
export function FilmFrame({ film, index, onOpen, ratio = 'aspect-video', priority, className }: FilmFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posterSrc, setPosterSrc] = useState(
    film.posterSrc ?? getYouTubePoster(film.youtubeUrl) ?? undefined
  );
  const slate = String(index + 1).padStart(2, '0');
  const posterTime = film.posterTime ?? 2;

  const startPreview = () => {
    videoRef.current?.play().catch(() => {
      /* Autoplay refused (low power mode, data saver) — the still stands in. */
    });
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    // Return to the chosen frame so the tile always rests on the same still.
    video.currentTime = posterTime;
  };

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(film)}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      className={cn('group block w-full cursor-pointer text-left', className)}
      aria-label={`Play ${film.title} — ${film.client}`}
    >
      <div className={cn('relative w-full overflow-hidden bg-surface', ratio)}>
        <motion.div
          className="absolute inset-0"
          variants={{ rest: { scale: 1 }, hover: { scale: 1.035 } }}
          transition={SPRING_POINTER}
        >
          {film.previewSrc ? (
            <video
              ref={videoRef}
              // The media fragment makes the browser rest on this frame with
              // only the leading bytes fetched — a poster image for free.
              src={`${film.previewSrc}#t=${posterTime}`}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          ) : (
            posterSrc && (
              <Image
                src={posterSrc}
                alt=""
                fill
                sizes="(max-width: 768px) 85vw, (max-width: 1280px) 60vw, 50vw"
                priority={priority}
                // Not every upload has a maxres frame; drop to the 4:3 one.
                onError={() => setPosterSrc(getYouTubePosterFallback(film.youtubeUrl) ?? undefined)}
                className="object-cover"
              />
            )
          )}
        </motion.div>

        {/* Play affordance — always visible, so it is discoverable without hovering. */}
        <motion.span
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center border bg-stage/70 backdrop-blur-[2px]"
          variants={{
            rest: { borderColor: '#2A2A2A', color: '#F2EFE9' },
            hover: { borderColor: '#D4A24C', color: '#D4A24C' },
          }}
          transition={{ duration: DURATION.tap, ease: EASE_FILM }}
        >
          <Play size={15} fill="currentColor" />
        </motion.span>
      </div>

      {/* Slate line: number and title left, client/year right. */}
      <div className="relative pt-4">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-line" />
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px origin-left bg-gold"
          variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
          transition={{ duration: DURATION.state, ease: EASE_FILM }}
        />

        {/* flex-wrap, not shrink-0: on a narrow frame the metadata drops to
            its own line rather than overflowing the grid column. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div className="flex min-w-0 items-baseline gap-4">
            <motion.span
              className="shrink-0 font-mono text-label uppercase"
              variants={{ rest: { color: '#2A2A2A' }, hover: { color: '#D4A24C' } }}
              transition={{ duration: DURATION.tap }}
            >
              F{slate}
            </motion.span>
            <h3 className="text-lg font-bold leading-tight text-ink sm:text-xl">{film.title}</h3>
          </div>

          <p className="label text-muted">
            {film.client} <span className="text-line">/</span> {film.year}
          </p>
        </div>

        {/* Flush with the slate number — an arbitrary indent stops lining up
            as soon as the row above wraps. */}
        <p className="label mt-2 text-line">{film.format}</p>
      </div>
    </motion.button>
  );
}
