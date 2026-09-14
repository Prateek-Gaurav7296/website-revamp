/** Global site metadata, navigation and social links. */

export const site = {
  name: 'NextBerry Labs',
  /** The north-star line. One positioning claim, used in the hero and nowhere else. */
  tagline: 'Stories, generated. Still felt.',
  description:
    'NextBerry Labs is a film studio that runs on AI. Brand films, product videos and UGC — written, designed and generated in-house.',
  url: 'https://nextberrylabs.com',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@nextberrylabs.com',
} as const;

/** Section ids double as nav anchors. Keep in sync with the section components. */
export const navLinks = [
  { id: 'work', label: 'Work' },
  { id: 'process', label: 'Process' },
  { id: 'proof', label: 'Proof' },
  { id: 'team', label: 'Team' },
] as const;

export const socialLinks = [
  { label: 'YouTube', href: 'https://www.youtube.com/@NextBerryLabs/playlists', icon: 'youtube' },
  { label: 'Instagram', href: 'https://www.instagram.com/nextberrylabs', icon: 'instagram' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/nextberry-labs/', icon: 'linkedin' },
] as const;

export type SocialIcon = (typeof socialLinks)[number]['icon'];
