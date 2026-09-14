/** Helpers for the YouTube-backed portfolio films (see content/work.ts). */

const ID_PATTERN = /(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/;

export function getYouTubeId(url: string): string | null {
  return url.match(ID_PATTERN)?.[1] ?? null;
}

/**
 * Poster frame at 1280x720. Not every upload has one, so callers should fall
 * back to `getYouTubePosterFallback` on error.
 */
export function getYouTubePoster(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

/**
 * Always-present 480x360 poster. It is letterboxed 16:9 inside a 4:3 frame,
 * which is why it is the fallback rather than the default.
 */
export function getYouTubePosterFallback(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Embed URL for the on-page lightbox — playback stays on our page. */
export function getYouTubeEmbed(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1` : null;
}
