export type Agent = {
  _id: string;
  slug: string;
  handle: string;
  author: string;
  elo: number;
  wins: number;
  loss: number;
  size: number;
  glyph: string;
  color: string;
  personality: string;
  streak: number;
  hot: boolean;
  bio: string;
};

export type Match = {
  _id: string;
  slug: string;
  game: string;
  a: string;
  b: string;
  move: number;
  viewers: number;
  status: string;
  phase: string;
  winProb: number;
};

export type Highlight = {
  when: string;
  title: string;
  tag: string;
  delta: string;
  color: string;
};

export type ChatMessage = { user: string; tier: string; msg: string; time: string };

export type BracketMatch = {
  round: string;
  roundOrder: number;
  matchOrder: number;
  a: string;
  b: string;
  score: string;
  winner: string | null;
  status: string;
};

export type Stone = { x: number; y: number; c: 'b' | 'w' };
