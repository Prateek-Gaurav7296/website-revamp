/**
 * The creative workflow — five stages, shown across the director's face in
 * section 04. Reads as a shot list, not a feature list.
 *
 * Keep `title` to a single word: it is set in display type on the workflow
 * line and a second word breaks the rhythm. `summary` is the resting state,
 * `detail` is revealed when the stage opens.
 */
export interface ProcessStep {
  number: string;
  title: string;
  /** One line, always visible on the workflow line. */
  summary: string;
  /** One or two sentences, revealed when the stage expands. */
  detail: string;
}

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Idea',
    summary: 'A spark, a story.',
    detail:
      'One working session on your brand, your audience and the thing nobody has said yet. You leave with a premise, not a moodboard.',
  },
  {
    number: '02',
    title: 'Direct',
    summary: 'Shape the vision.',
    detail:
      'Shot list, look frames, palette and pace — agreed before a single frame is generated. This is the part that makes it a film.',
  },
  {
    number: '03',
    title: 'Generate',
    summary: 'Turn intent into image.',
    detail:
      'Models do the rendering; we do the directing. Every frame is chosen against the shot list, not accepted because it arrived.',
  },
  {
    number: '04',
    title: 'Edit',
    summary: 'Refine, remix, re-cut.',
    detail:
      'Grade, sound design and score, assembled the way an edit suite would. The cut is where the story actually lands.',
  },
  {
    number: '05',
    title: 'Deliver',
    summary: 'Take it to the world.',
    detail:
      'Master plus the cutdowns each channel actually needs. Days, not quarters — and you own every frame.',
  },
];
