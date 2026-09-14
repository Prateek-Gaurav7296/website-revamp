/**
 * Portfolio films.
 *
 * Two ways a film can be shown, in order of preference:
 *
 *  1. `previewSrc` — a self-hosted mp4. The video element itself is the still
 *     (seeked to `posterTime`) and plays muted on hover. Highest quality, and
 *     the visitor never leaves the page.
 *  2. YouTube only — the frame uses the film's YouTube poster and clicking
 *     opens it in the on-page lightbox. Still no outbound click.
 *
 * To upgrade a film to native playback, drop an mp4 in /public/videos and set
 * `previewSrc`. Nothing else changes.
 *
 * Do not point `posterSrc` at illustration or stock art — every frame on this
 * page must be a frame from an actual film.
 */
export interface Film {
  id: string;
  title: string;
  client: string;
  format: string;
  year: string;
  youtubeUrl: string;
  previewSrc?: string;
  /** Seconds into `previewSrc` to rest on as the still. Defaults to 2. */
  posterTime?: number;
  /** Only for a real still exported from the film itself. */
  posterSrc?: string;
  /** Larger tiles anchor the asymmetric grid. Two or three per page, not more. */
  feature?: boolean;
}

export const films: Film[] = [
  {
    id: 'swift-tv',
    title: 'A channel with a point of view',
    client: 'Swift TV',
    format: 'Brand film',
    year: '2025',
    youtubeUrl: 'https://youtu.be/Nuxw_N0jvjY',
    previewSrc: '/videos/hero.mp4',
    posterTime: 3,
    feature: true,
  },
  {
    id: 'propelld-diwali',
    title: 'Diwali, financed',
    client: 'Propelld',
    format: 'Festive film',
    year: '2025',
    youtubeUrl: 'https://www.youtube.com/watch?v=J6WdRMq59RQ',
  },
  {
    id: 'film-03',
    title: 'Product, in motion',
    client: 'NextBerry Labs',
    format: 'Product video',
    year: '2025',
    youtubeUrl: 'https://www.youtube.com/watch?v=lwNLbjQGq4s',
  },
  {
    id: 'film-04',
    title: 'The short form cut',
    client: 'NextBerry Labs',
    format: 'UGC',
    year: '2025',
    youtubeUrl: 'https://www.youtube.com/watch?v=v9mVLvJoBEY',
    previewSrc: '/videos/reel.mp4',
    posterTime: 4,
    feature: true,
  },
  {
    id: 'film-05',
    title: 'Built frame by frame',
    client: 'NextBerry Labs',
    format: 'Brand film',
    year: '2025',
    youtubeUrl: 'https://www.youtube.com/watch?v=UW80MQrlzhE',
  },
  {
    id: 'film-06',
    title: 'A world that felt real',
    client: 'NextBerry Labs',
    format: 'Brand film',
    year: '2024',
    youtubeUrl: 'https://www.youtube.com/watch?v=qaytmgpFmX4',
  },
];

export const playlistUrl = 'https://www.youtube.com/@NextBerryLabs/playlists';
