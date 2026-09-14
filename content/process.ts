/** The five-step shot list. Reads as a sequence, not a diagram. */
export interface ProcessStep {
  number: string;
  title: string;
  summary: string;
  /** Revealed on hover/focus — never the only place critical info lives. */
  detail: string;
}

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Discover',
    summary: 'Understand your brand, audience, and goals.',
    detail: 'One working session, your existing material, and the question nobody asked yet.',
  },
  {
    number: '02',
    title: 'Think',
    summary: 'Craft stories rooted in emotion.',
    detail: 'Two or three premises, written out. You pick the one that unsettles you slightly.',
  },
  {
    number: '03',
    title: 'Design',
    summary: 'Visualise worlds that feel real.',
    detail: 'Shot list, look frames, palette and pace agreed before a single frame is generated.',
  },
  {
    number: '04',
    title: 'Generate',
    summary: 'Use AI to bring it alive.',
    detail: 'Generation, grade, sound design and score — assembled the way an edit suite would.',
  },
  {
    number: '05',
    title: 'Deliver',
    summary: 'A film your audience feels.',
    detail: 'Master plus the cutdowns each channel actually needs. Days, not quarters.',
  },
];
