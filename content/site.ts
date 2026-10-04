/** Global site metadata, navigation and social links. */

export const site = {
  name: 'NextBerry Labs',
  /** The north-star line. One positioning claim, used in the hero and nowhere else. */
  tagline: 'Stories, generated. Still felt.',
  description:
    'NextBerry Labs is a film studio that runs on AI. Brand films, product videos and UGC — written, designed and generated in-house.',
  url: 'https://nextberrylabs.com',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@thenextberrylabs.com',
} as const;

/**
 * Gmail's compose window, pre-addressed. Opened in a new tab rather than via
 * `mailto:`, which on a desktop with no mail client configured does nothing at
 * all and looks like a broken link.
 */
export function composeUrl(to: string = site.contactEmail, subject?: string) {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to });
  if (subject) params.set('su', subject);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Section ids double as nav anchors. Keep in sync with the section components. */
export const navLinks = [
  { id: 'work', label: 'Work' },
  { id: 'process', label: 'Process' },
  { id: 'proof', label: 'Proof' },
  { id: 'team', label: 'Team' },
] as const;

/**
 * NB Studio is a separate application on its own subdomain and in its own
 * repository — it is not a page in this project. The old site linked to it
 * from the header ("Take me to NB studio") and this one keeps that entry point.
 *
 * Note the host: the shipped header used `studio.` (singular) while the old
 * deployment notes describe `studios.` (plural). This follows the link that
 * was actually live. Confirm before launch — see the README.
 */
export const studioLink = {
  label: 'NB Studio',
  href: 'https://studio.thenextberrylabs.com/',
} as const;

export const socialLinks = [
  { label: 'YouTube', href: 'https://www.youtube.com/@NextBerryLabs/playlists', icon: 'youtube' },
  { label: 'Instagram', href: 'https://www.instagram.com/nextberrylabs', icon: 'instagram' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/nextberry-labs/', icon: 'linkedin' },
] as const;

export type SocialIcon = (typeof socialLinks)[number]['icon'];
