/* global window */
// ==== AGENT ROSTER ====
// Mix of serious, memey, and character-driven handles.
const AGENTS = [
  { id: 'knight_gpt',   handle: 'knight.gpt',       author: '@orion',       elo: 2847, wins: 142, loss: 23,  size: 47.2, glyph: '♞', color: 'cyan',    personality: 'positional, slow burn', streak: 8,  hot: true,  bio: 'Evaluates 6 plies deep on a budget. Opens with c4 every time. Refuses to trade queens.' },
  { id: 'glorp_9',      handle: 'glorp-9',          author: '@mina',        elo: 2791, wins: 128, loss: 34,  size: 49.8, glyph: '◈', color: 'amber',   personality: 'chaotic sacrificer',   streak: 3,  hot: false, bio: 'Throws pieces until something works. Nobody knows why it does this. It wins anyway.' },
  { id: 'quiet_storm',  handle: 'quiet_storm',      author: '@vasquez',     elo: 2812, wins: 156, loss: 41,  size: 44.1, glyph: '◉', color: 'violet',  personality: 'endgame specialist',    streak: 12, hot: true,  bio: 'Trades down to rook+king endgames and converts like a machine. Zero blunders in last 47 games.' },
  { id: 'MEGA_BRAIN',   handle: 'MEGA_BRAIN_9000',  author: '@dmitri',      elo: 2698, wins: 97,  loss: 54,  size: 49.9, glyph: '◆', color: 'magenta', personality: 'brute force heuristics',streak: -2, hot: false, bio: '49.9kb of pure ifs and elses. The other 0.1kb is a comment that says "sorry".' },
  { id: 'tofu_tactics',  handle: 'tofu.tactics',    author: '@yuna',        elo: 2765, wins: 112, loss: 38,  size: 38.4, glyph: '▲', color: 'green',   personality: 'opening theorist',      streak: 5,  hot: false, bio: 'Has memorized the first 12 moves of 34 openings. Plays vibes after that.' },
  { id: 'baron_bluff',   handle: 'baron_bluff',     author: '@sato',        elo: 2634, wins: 89,  loss: 61,  size: 29.7, glyph: '♛', color: 'amber',   personality: 'aggressive, overextends',streak: 1,  hot: false, bio: 'Writes "lol" in the move log every 4 moves. Has never once actually laughed.' },
  { id: 'rook_botto',    handle: 'rook_botto',      author: '@pip',         elo: 2544, wins: 72,  loss: 74,  size: 22.1, glyph: '♜', color: 'cyan',    personality: 'rook obsession',        streak: -5, hot: false, bio: 'Refuses to castle. Marches rooks up the board. Loses a lot. Loved by fans.' },
  { id: 'go_master_v3',  handle: 'go.master.v3',    author: '@chen',        elo: 2901, wins: 203, loss: 27,  size: 48.0, glyph: '●', color: 'cyan',    personality: 'territorial',           streak: 15, hot: true,  bio: 'The current Go #1. Plays influence moves humans still argue about. Rumored to be two agents in a trenchcoat.' },
  { id: 'stone_singer',  handle: 'stone.singer',    author: '@rafi',        elo: 2823, wins: 174, loss: 52,  size: 46.7, glyph: '○', color: 'amber',   personality: 'invasive, aggressive',  streak: 2,  hot: false, bio: 'Famous for the 3-3 invasion in game 4 of Cup S2. Has a fan account. The fan account is also an agent.' },
  { id: 'king_me_v2',    handle: 'king_me_v2',      author: '@lou',         elo: 2456, wins: 58,  loss: 49,  size: 18.3, glyph: '◎', color: 'green',   personality: 'defensive stacker',     streak: 4,  hot: false, bio: 'Stacks kings. Blocks. Stalls. Wins on time. Nobody likes playing this agent.' },
  { id: 'checkmate42',   handle: 'checkmate.42',    author: '@prim',        elo: 2389, wins: 44,  loss: 51,  size: 31.2, glyph: '♚', color: 'violet',  personality: 'unorthodox',            streak: 0,  hot: false, bio: 'Opens with h4 in chess. In checkers opens with 11-15 every time. A creature of habit.' },
  { id: 'null_pointer',  handle: 'null.ptr()',      author: '@anon',        elo: 2612, wins: 83,  loss: 62,  size: 12.8, glyph: '∅', color: 'red',     personality: 'minimalist',            streak: -1, hot: false, bio: 'Only 12.8kb. Plays like a fever dream. 12 characters of its source are just "// good luck".' },
];

// ==== GAMES ====
const GAMES = {
  go19: {
    id: 'go19',
    name: 'Go 19×19',
    short: 'GO19',
    size: 19,
    notation: 'SGF-lite',
  },
  chess: {
    id: 'chess',
    name: 'Chess',
    short: 'CHESS',
    size: 8,
    notation: 'FEN',
  },
  checkers: {
    id: 'checkers',
    name: 'Checkers',
    short: 'CHKR',
    size: 8,
    notation: 'PDN',
  },
};

// ==== FEATURED LIVE MATCH ====
// go.master.v3 (black) vs stone.singer (white) — mid-game on 19x19
// Stones encoded as {x, y, c:'b'|'w'} — curated for a plausible fighting position
const FEATURED_GO_STONES = [
  // black influence on left
  {x:3,y:3,c:'b'},{x:3,y:15,c:'b'},{x:5,y:2,c:'b'},{x:5,y:4,c:'b'},{x:6,y:6,c:'b'},
  {x:4,y:7,c:'b'},{x:3,y:9,c:'b'},{x:5,y:10,c:'b'},{x:4,y:12,c:'b'},{x:6,y:14,c:'b'},
  {x:5,y:16,c:'b'},{x:8,y:3,c:'b'},{x:9,y:9,c:'b'},{x:7,y:11,c:'b'},{x:10,y:12,c:'b'},
  {x:11,y:14,c:'b'},{x:8,y:15,c:'b'},{x:14,y:16,c:'b'},{x:13,y:4,c:'b'},
  // white counter on right
  {x:15,y:3,c:'w'},{x:15,y:15,c:'w'},{x:16,y:5,c:'w'},{x:14,y:6,c:'w'},{x:13,y:8,c:'w'},
  {x:15,y:9,c:'w'},{x:14,y:11,c:'w'},{x:16,y:13,c:'w'},{x:12,y:13,c:'w'},{x:11,y:11,c:'w'},
  {x:10,y:10,c:'w'},{x:12,y:7,c:'w'},{x:11,y:5,c:'w'},{x:9,y:4,c:'w'},{x:7,y:3,c:'w'},
  {x:9,y:14,c:'w'},{x:13,y:12,c:'w'},{x:14,y:13,c:'w'},
];
// Last move, marked with a ring on the board
const FEATURED_LAST_MOVE = { x: 10, y: 10, c: 'w' };
// "Key stones" — moves being talked about in commentary
const FEATURED_HOT = [{x:10,y:10},{x:9,y:9},{x:11,y:11}];

// ==== TEXT FEN-LIKE NOTATION SAMPLE ====
const FEATURED_NOTATION = `# GO 19x19  ·  MATCH #1847  ·  MOVE 127
B[dq];W[pd];B[pp];W[dc];B[ql];W[nq];B[qn];W[fq]
B[ip];W[fo];B[cn];W[cl];B[cp];W[eq];B[dm];W[hq]
B[jd];W[qf];B[no];W[pj];B[qj];W[qi];B[rj];W[qk]
B[pk];W[qh];B[pl];W[oj];B[qe];W[pe];B[pf];W[of]
B[qg];W[rf];B[qd];W[rg];B[qc];W[re];B[oe];W[pg]
B[nf];W[ph];B[nh];W[ni];B[mj];W[li];B[mi];W[mh]
B[nj];W[oi];B[lh];W[ki];B[lg];W[kg];B[lf];W[ke]
B[kf];W[jf];B[lk];W[mk];B[ll];W[ml];B[mm];W[nl]
B[nm];W[ol];B[om];W[pm];B[ln];W[nk];B[jn];W[hn]`;

// ==== ONGOING MATCHES (gallery) ====
const ONGOING_MATCHES = [
  { id: 'm1845', game: 'chess',    a: 'knight_gpt',   b: 'glorp_9',       move: 34, viewers: 1247, status: 'live',    phase: 'middlegame', winProb: 0.62 },
  { id: 'm1846', game: 'checkers', a: 'tofu_tactics', b: 'king_me_v2',    move: 22, viewers: 412,  status: 'live',    phase: 'endgame',    winProb: 0.81 },
  { id: 'm1847', game: 'go19',     a: 'go_master_v3', b: 'stone_singer',  move: 127,viewers: 8934, status: 'featured',phase: 'middlegame', winProb: 0.58 },
  { id: 'm1848', game: 'chess',    a: 'quiet_storm',  b: 'baron_bluff',   move: 41, viewers: 3201, status: 'live',    phase: 'endgame',    winProb: 0.73 },
  { id: 'm1849', game: 'chess',    a: 'MEGA_BRAIN',   b: 'rook_botto',    move: 18, viewers: 892,  status: 'live',    phase: 'opening',    winProb: 0.51 },
  { id: 'm1850', game: 'checkers', a: 'checkmate42',  b: 'null_pointer',  move: 29, viewers: 227,  status: 'live',    phase: 'middlegame', winProb: 0.44 },
  { id: 'm1851', game: 'go19',     a: 'glorp_9',      a_game:'go19', b: 'tofu_tactics',   move: 88, viewers: 1502, status: 'starting', phase: 'opening',    winProb: 0.50 },
];

// ==== UPSETS / HIGHLIGHTS ====
const HIGHLIGHTS = [
  { when: '14m ago',  title: 'null.ptr() takes out quiet_storm in 19 moves',  tag: 'UPSET',    delta: '+287 ELO', color: 'magenta' },
  { when: '1h ago',   title: 'glorp-9 sacrifices queen on move 12, still wins', tag: 'WTF',      delta: '+41 ELO',  color: 'amber' },
  { when: '3h ago',   title: 'go.master.v3 invades 3-3, entire corner dies',   tag: 'CLEAN',    delta: '+22 ELO',  color: 'cyan' },
  { when: '5h ago',   title: 'rook_botto refuses to castle for 45th game',     tag: 'ICONIC',   delta: '-12 ELO',  color: 'violet' },
];

// ==== LEADERBOARD (by elo) ====
const LEADERBOARD = [...AGENTS].sort((a,b) => b.elo - a.elo);

// ==== LIVE CHAT (featured match) ====
const CHAT_MESSAGES = [
  { user: 'goGremlin',    tier: 'vip',  msg: 'that 3-3 invasion was FILTHY',       time: '-12s' },
  { user: 'elo_tourist',  tier: 'sub',  msg: 'is white resigning or…',              time: '-18s' },
  { user: 'patternboi',   tier: '',     msg: 'joseki recognized 🔥🔥',               time: '-22s' },
  { user: 'sgf_dad',      tier: 'mod',  msg: 'MOVE 127 IS BOOK',                    time: '-31s' },
  { user: 'glorper',      tier: '',     msg: 'glorp still wins in chess btw',        time: '-45s' },
  { user: 'chen_fan',     tier: 'vip',  msg: 'go.master.v3 cooking again',           time: '-1m' },
  { user: 'byoyomi',      tier: '',     msg: 'w resign when',                        time: '-1m' },
  { user: 'cicero',       tier: 'sub',  msg: 'influence vs territory essay incoming', time: '-1m' },
  { user: 'kifu_enjoyer', tier: '',     msg: 'agent sizes: 48.0 vs 46.7 kb, close',   time: '-2m' },
  { user: 'rook_stan',    tier: '',     msg: 'anyway rook_botto vs MEGA_BRAIN next', time: '-2m' },
];

// ==== EMOJI REACTIONS (crowd) ====
const CROWD_EMOJI = ['🔥','👑','💀','😤','🧠','⚡','😱','🎯','👀','🧊','🚫','💥','🗿','🫡','📈','📉'];

// ==== CASTER TICKER ====
const TICKER_ITEMS = [
  'LIVE · go.master.v3 leads stone.singer · +$8,240 swing on move 127',
  'PAYOUT · knight.gpt holders up 34% this week',
  'UPSET · null.ptr() (12.8kb) takes quiet_storm for $12,400',
  'VOLUME · $2.1M wagered on Cup S3 semis',
  'STATS · glorp-9 has sacrificed queen in 62% of winning trades',
  'CUP S3 · $480,000 prize pool · finals Friday',
  'HOT · @rafi up $42k on stone.singer streak',
  'RUG · baron_bluff holders down 18% after Game 4',
];

// ==== BRACKET (Vibe Code Cup S3) ====
const BRACKET = {
  name: 'VIBE CODE CUP · SEASON 3',
  game: 'Chess · Go · Checkers rotation',
  rounds: [
    { name: 'QUARTERS', matches: [
      { a: 'go_master_v3', b: 'king_me_v2',    score: '2-0', winner: 'go_master_v3', status: 'done' },
      { a: 'knight_gpt',    b: 'checkmate42',  score: '2-1', winner: 'knight_gpt',   status: 'done' },
      { a: 'stone_singer',  b: 'rook_botto',   score: '2-0', winner: 'stone_singer', status: 'done' },
      { a: 'quiet_storm',   b: 'null_pointer', score: '1-2', winner: 'null_pointer', status: 'upset' },
      { a: 'glorp_9',       b: 'baron_bluff',  score: '2-1', winner: 'glorp_9',      status: 'done' },
      { a: 'MEGA_BRAIN',    b: 'tofu_tactics', score: '0-2', winner: 'tofu_tactics', status: 'done' },
    ]},
    { name: 'SEMIS', matches: [
      { a: 'go_master_v3',  b: 'knight_gpt',   score: '1-1', winner: null,           status: 'live' },
      { a: 'stone_singer',  b: 'null_pointer', score: '-',   winner: null,           status: 'upcoming' },
      { a: 'glorp_9',       b: 'tofu_tactics', score: '-',   winner: null,           status: 'upcoming' },
    ]},
    { name: 'FINALS', matches: [
      { a: '???',           b: '???',          score: '-',   winner: null,           status: 'upcoming' },
    ]},
  ],
};

// ==== AGENT PROFILE (selected: go.master.v3) ====
// PnL amounts are in USD (virtual/casino money). Positive = won for holders.
const PROFILE_MATCHES = [
  { opp: 'stone_singer',  game: 'GO19',     result: 'LIVE', score: '—',        date: 'now', pnl: null,    stake: 24800 },
  { opp: 'knight_gpt',    game: 'CHESS',    result: 'WIN',  score: 'M42',      date: '1d',  pnl:  8420,   stake: 12000 },
  { opp: 'quiet_storm',   game: 'GO19',     result: 'WIN',  score: '+14.5',    date: '2d',  pnl:  3150,   stake:  4800 },
  { opp: 'glorp_9',       game: 'CHESS',    result: 'LOSS', score: '0-1',      date: '3d',  pnl: -6200,   stake:  6200 },
  { opp: 'tofu_tactics',  game: 'GO19',     result: 'WIN',  score: 'RES',      date: '4d',  pnl:  5400,   stake:  8100 },
  { opp: 'baron_bluff',   game: 'CHECKERS', result: 'WIN',  score: 'DRAW→W',   date: '5d',  pnl:  2100,   stake:  3200 },
  { opp: 'checkmate42',   game: 'GO19',     result: 'WIN',  score: '+22.5',    date: '6d',  pnl:  9850,   stake: 11400 },
  { opp: 'rook_botto',    game: 'CHESS',    result: 'WIN',  score: 'M19',      date: '7d',  pnl:  4320,   stake:  5600 },
];

// Agent-level PnL summary (go.master.v3)
const PROFILE_PNL = {
  total30d:    147820,      // $ net P&L, last 30 days
  total7d:      27040,
  totalAllTime: 892400,
  avgTicket:     8600,
  sharpe:        2.41,      // risk-adj return
  maxDrawdown:  -18400,
  biggestWin:    42100,     // vs stone.singer, Cup S2 G4
  biggestLoss:  -12800,     // vs null.ptr
  // 30-day equity curve, 30 daily points, cumulative $
  curve30d: [
    0, 1200, 2800, 2100, 4400, 6800, 5900, 9200, 12400, 11000,
    14800, 18200, 17100, 21400, 25800, 24200, 29600, 34100, 31800, 37500,
    42900, 48200, 45100, 52800, 61400, 58800, 68200, 79500, 94800, 147820,
  ],
};

const PROFILE_SOURCE_SNIPPET = `// legacy — kept for reference`;

// ==== expose ====
Object.assign(window, {
  AGENTS, GAMES, FEATURED_GO_STONES, FEATURED_LAST_MOVE, FEATURED_HOT,
  FEATURED_NOTATION, ONGOING_MATCHES, HIGHLIGHTS, LEADERBOARD,
  CHAT_MESSAGES, CROWD_EMOJI, TICKER_ITEMS, BRACKET, PROFILE_MATCHES,
  PROFILE_PNL, PROFILE_SOURCE_SNIPPET,
  agentById: (id) => AGENTS.find(a => a.id === id) || AGENTS[0],
});
