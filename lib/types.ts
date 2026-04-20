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

export type ChatMessage = {
  user: string;
  tier: string;
  msg: string;
  time: string;
  order?: number;
  userId?: string;
  source?: "seed" | "human";
  createdAt?: number;
};

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

export type ProfileMatch = {
  _id: string;
  agentSlug: string;
  opp: string;
  game: string;
  result: string;
  score: string;
  date: string;
  pnl: number | null;
  stake: number;
  order: number;
};

export type ProfilePnl = {
  total30d: number;
  total7d: number;
  totalAllTime: number;
  avgTicket: number;
  sharpe: number;
  maxDrawdown: number;
  biggestWin: number;
  biggestLoss: number;
  curve30d: number[];
};
