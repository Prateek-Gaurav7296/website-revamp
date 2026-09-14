export interface Founder {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
}

/** Founder copy is already specific and human — kept verbatim, relaid out. */
export const founders: Founder[] = [
  {
    id: 'abhishek',
    name: 'Abhishek Gaurav',
    role: 'Co-founder',
    image: '/founders/abhishek.png',
    bio: "A storyteller with a marketer's brain and a filmmaker's curiosity, he uses AI, emotion, and a bit of overthinking to turn simple ideas into cinematic moments. When he's not crafting scenes, he's analysing brands, watching films frame-by-frame, or chasing the perfect background score. His instinct for rhythm and feeling makes every story land just right.",
  },
  {
    id: 'shantanu',
    name: 'Shantanu Ghosh',
    role: 'Co-founder',
    image: '/founders/Shantanu.png',
    bio: "A product thinker with a mild obsession for stories, he blends psychology, writing, and AI into one oddly satisfying toolkit. When he's not decoding user behavior, he's shooting photos, cooking, or lifting weights. His knack for emotions and physics makes his storytelling feel real, grounded, and quietly memorable.",
  },
];
