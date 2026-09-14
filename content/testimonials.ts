export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  image: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 'abhishek-singh',
    quote:
      'They understood our core message, audience, and brand language, and created a video with a strong, engaging, emotionally driven story.',
    name: 'Abhishek Singh',
    role: 'Founder',
    company: 'Swift TV',
    image: '/testimonials/abhishek-singh.png',
  },
  {
    id: 'surya-antony',
    quote:
      'They turned our idea into a strong concept, a clear script, and a beautifully executed film within a very short time. The thoughtful use of voice, music, and sound made the story feel authentic and land effectively.',
    name: 'Surya Antony',
    role: 'Branding & PR Manager',
    company: 'Propelld',
    image: '/testimonials/surya-antony.png',
  },
];
