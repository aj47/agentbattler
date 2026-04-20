import { internalMutation } from "./_generated/server";

const AGENTS = [
  { slug: 'knight_gpt',   handle: 'knight.gpt',       author: '@orion',   elo: 2847, wins: 142, loss: 23,  size: 47.2, glyph: '♞', color: 'cyan',    personality: 'positional, slow burn', streak: 8,  hot: true,  bio: 'Evaluates 6 plies deep on a budget. Opens with c4 every time. Refuses to trade queens.' },
  { slug: 'glorp_9',      handle: 'glorp-9',          author: '@mina',    elo: 2791, wins: 128, loss: 34,  size: 49.8, glyph: '◈', color: 'amber',   personality: 'chaotic sacrificer',   streak: 3,  hot: false, bio: 'Throws pieces until something works. Nobody knows why it does this. It wins anyway.' },
  { slug: 'quiet_storm',  handle: 'quiet_storm',      author: '@vasquez', elo: 2812, wins: 156, loss: 41,  size: 44.1, glyph: '◉', color: 'violet',  personality: 'endgame specialist',    streak: 12, hot: true,  bio: 'Trades down to rook+king endgames and converts like a machine. Zero blunders in last 47 games.' },
  { slug: 'MEGA_BRAIN',   handle: 'MEGA_BRAIN_9000',  author: '@dmitri',  elo: 2698, wins: 97,  loss: 54,  size: 49.9, glyph: '◆', color: 'magenta', personality: 'brute force heuristics',streak: -2, hot: false, bio: '49.9kb of pure ifs and elses. The other 0.1kb is a comment that says "sorry".' },
  { slug: 'tofu_tactics', handle: 'tofu.tactics',     author: '@yuna',    elo: 2765, wins: 112, loss: 38,  size: 38.4, glyph: '▲', color: 'green',   personality: 'opening theorist',      streak: 5,  hot: false, bio: 'Has memorized the first 12 moves of 34 openings. Plays vibes after that.' },
  { slug: 'baron_bluff',  handle: 'baron_bluff',      author: '@sato',    elo: 2634, wins: 89,  loss: 61,  size: 29.7, glyph: '♛', color: 'amber',   personality: 'aggressive, overextends',streak: 1, hot: false, bio: 'Writes "lol" in the move log every 4 moves. Has never once actually laughed.' },
  { slug: 'rook_botto',   handle: 'rook_botto',       author: '@pip',     elo: 2544, wins: 72,  loss: 74,  size: 22.1, glyph: '♜', color: 'cyan',    personality: 'rook obsession',        streak: -5, hot: false, bio: 'Refuses to castle. Marches rooks up the board. Loses a lot. Loved by fans.' },
  { slug: 'go_master_v3', handle: 'go.master.v3',     author: '@chen',    elo: 2901, wins: 203, loss: 27,  size: 48.0, glyph: '●', color: 'cyan',    personality: 'territorial',           streak: 15, hot: true,  bio: 'The current Go #1. Plays influence moves humans still argue about. Rumored to be two agents in a trenchcoat.' },
  { slug: 'stone_singer', handle: 'stone.singer',     author: '@rafi',    elo: 2823, wins: 174, loss: 52,  size: 46.7, glyph: '○', color: 'amber',   personality: 'invasive, aggressive',  streak: 2,  hot: false, bio: 'Famous for the 3-3 invasion in game 4 of Cup S2. Has a fan account. The fan account is also an agent.' },
  { slug: 'king_me_v2',   handle: 'king_me_v2',       author: '@lou',     elo: 2456, wins: 58,  loss: 49,  size: 18.3, glyph: '◎', color: 'green',   personality: 'defensive stacker',     streak: 4,  hot: false, bio: 'Stacks kings. Blocks. Stalls. Wins on time. Nobody likes playing this agent.' },
  { slug: 'checkmate42',  handle: 'checkmate.42',     author: '@prim',    elo: 2389, wins: 44,  loss: 51,  size: 31.2, glyph: '♚', color: 'violet',  personality: 'unorthodox',            streak: 0,  hot: false, bio: 'Opens with h4 in chess. In checkers opens with 11-15 every time. A creature of habit.' },
  { slug: 'null_pointer', handle: 'null.ptr()',       author: '@anon',    elo: 2612, wins: 83,  loss: 62,  size: 12.8, glyph: '∅', color: 'red',     personality: 'minimalist',            streak: -1, hot: false, bio: 'Only 12.8kb. Plays like a fever dream. 12 characters of its source are just "// good luck".' },
];

const GAMES = [
  { slug: 'go19', name: 'Go 19×19', short: 'GO19', size: 19, notation: 'SGF-lite' },
  { slug: 'chess', name: 'Chess', short: 'CHESS', size: 8, notation: 'FEN' },
  { slug: 'checkers', name: 'Checkers', short: 'CHKR', size: 8, notation: 'PDN' },
];

const MATCHES = [
  { slug: 'm1845', game: 'chess',    a: 'knight_gpt',   b: 'glorp_9',      move: 34,  viewers: 1247, status: 'live',     phase: 'midgame',  winProb: 0.62 },
  { slug: 'm1846', game: 'checkers', a: 'tofu_tactics', b: 'king_me_v2',   move: 22,  viewers: 412,  status: 'live',     phase: 'endgame',  winProb: 0.81 },
  { slug: 'm1847', game: 'go19',     a: 'go_master_v3', b: 'stone_singer', move: 127, viewers: 8934, status: 'featured', phase: 'midgame',  winProb: 0.58 },
  { slug: 'm1848', game: 'chess',    a: 'quiet_storm',  b: 'baron_bluff',  move: 41,  viewers: 3201, status: 'live',     phase: 'endgame',  winProb: 0.73 },
  { slug: 'm1849', game: 'chess',    a: 'MEGA_BRAIN',   b: 'rook_botto',   move: 18,  viewers: 892,  status: 'live',     phase: 'opening',  winProb: 0.51 },
  { slug: 'm1850', game: 'checkers', a: 'checkmate42',  b: 'null_pointer', move: 29,  viewers: 227,  status: 'live',     phase: 'midgame',  winProb: 0.44 },
  { slug: 'm1851', game: 'go19',     a: 'glorp_9',      b: 'tofu_tactics', move: 88,  viewers: 1502, status: 'live',     phase: 'opening',  winProb: 0.50 },
  { slug: 'm1852', game: 'chess',    a: 'null_pointer', b: 'tofu_tactics', move: 11,  viewers: 674,  status: 'live',     phase: 'opening',  winProb: 0.48 },
  { slug: 'm1853', game: 'go19',     a: 'knight_gpt',   b: 'quiet_storm',  move: 54,  viewers: 2108, status: 'live',     phase: 'midgame',  winProb: 0.55 },
  { slug: 'm1854', game: 'checkers', a: 'glorp_9',      b: 'baron_bluff',  move: 17,  viewers: 389,  status: 'live',     phase: 'opening',  winProb: 0.60 },
  { slug: 'm1855', game: 'chess',    a: 'stone_singer', b: 'MEGA_BRAIN',   move: 62,  viewers: 1834, status: 'live',     phase: 'endgame',  winProb: 0.69 },
  { slug: 'm1856', game: 'go19',     a: 'tofu_tactics', b: 'rook_botto',   move: 39,  viewers: 721,  status: 'live',     phase: 'opening',  winProb: 0.53 },
  { slug: 'm1857', game: 'checkers', a: 'king_me_v2',   b: 'knight_gpt',   move: 0,   viewers: 156,  status: 'starting', phase: 'opening',  winProb: 0.50 },
  { slug: 'm1858', game: 'chess',    a: 'quiet_storm',  b: 'go_master_v3', move: 28,  viewers: 4412, status: 'live',     phase: 'midgame',  winProb: 0.47 },
  { slug: 'm1859', game: 'go19',     a: 'null_pointer', b: 'baron_bluff',  move: 73,  viewers: 918,  status: 'live',     phase: 'midgame',  winProb: 0.56 },
  { slug: 'm1860', game: 'checkers', a: 'rook_botto',   b: 'stone_singer', move: 0,   viewers: 203,  status: 'starting', phase: 'opening',  winProb: 0.50 },
  // batch 2 – m1861–m1900
  { slug: 'm1861', game: 'chess',    a: 'knight_gpt',   b: 'baron_bluff',  move: 8,   viewers: 531,  status: 'live',     phase: 'opening',  winProb: 0.67 },
  { slug: 'm1862', game: 'go19',     a: 'go_master_v3', b: 'null_pointer', move: 181, viewers: 6721, status: 'live',     phase: 'endgame',  winProb: 0.78 },
  { slug: 'm1863', game: 'checkers', a: 'tofu_tactics', b: 'rook_botto',   move: 34,  viewers: 298,  status: 'live',     phase: 'midgame',  winProb: 0.54 },
  { slug: 'm1864', game: 'chess',    a: 'MEGA_BRAIN',   b: 'checkmate42',  move: 44,  viewers: 1122, status: 'live',     phase: 'midgame',  winProb: 0.43 },
  { slug: 'm1865', game: 'go19',     a: 'stone_singer', b: 'quiet_storm',  move: 66,  viewers: 3309, status: 'live',     phase: 'midgame',  winProb: 0.61 },
  { slug: 'm1866', game: 'checkers', a: 'null_pointer', b: 'king_me_v2',   move: 12,  viewers: 177,  status: 'live',     phase: 'opening',  winProb: 0.49 },
  { slug: 'm1867', game: 'chess',    a: 'glorp_9',      b: 'quiet_storm',  move: 19,  viewers: 2204, status: 'live',     phase: 'opening',  winProb: 0.38 },
  { slug: 'm1868', game: 'go19',     a: 'rook_botto',   b: 'checkmate42',  move: 47,  viewers: 441,  status: 'live',     phase: 'midgame',  winProb: 0.52 },
  { slug: 'm1869', game: 'checkers', a: 'knight_gpt',   b: 'tofu_tactics', move: 0,   viewers: 189,  status: 'starting', phase: 'opening',  winProb: 0.50 },
  { slug: 'm1870', game: 'chess',    a: 'go_master_v3', b: 'null_pointer', move: 56,  viewers: 3874, status: 'live',     phase: 'midgame',  winProb: 0.72 },
  { slug: 'm1871', game: 'go19',     a: 'baron_bluff',  b: 'king_me_v2',   move: 103, viewers: 614,  status: 'live',     phase: 'midgame',  winProb: 0.45 },
  { slug: 'm1872', game: 'checkers', a: 'MEGA_BRAIN',   b: 'glorp_9',      move: 27,  viewers: 562,  status: 'live',     phase: 'midgame',  winProb: 0.57 },
  { slug: 'm1873', game: 'chess',    a: 'rook_botto',   b: 'stone_singer', move: 31,  viewers: 987,  status: 'live',     phase: 'midgame',  winProb: 0.29 },
  { slug: 'm1874', game: 'go19',     a: 'knight_gpt',   b: 'go_master_v3', move: 0,   viewers: 5102, status: 'starting', phase: 'opening',  winProb: 0.50 },
  { slug: 'm1875', game: 'checkers', a: 'quiet_storm',  b: 'baron_bluff',  move: 18,  viewers: 344,  status: 'live',     phase: 'opening',  winProb: 0.63 },
  { slug: 'm1876', game: 'chess',    a: 'tofu_tactics', b: 'king_me_v2',   move: 72,  viewers: 756,  status: 'live',     phase: 'endgame',  winProb: 0.84 },
  { slug: 'm1877', game: 'go19',     a: 'glorp_9',      b: 'MEGA_BRAIN',   move: 22,  viewers: 1033, status: 'live',     phase: 'opening',  winProb: 0.55 },
  { slug: 'm1878', game: 'checkers', a: 'stone_singer', b: 'checkmate42',  move: 41,  viewers: 267,  status: 'live',     phase: 'midgame',  winProb: 0.71 },
  { slug: 'm1879', game: 'chess',    a: 'baron_bluff',  b: 'go_master_v3', move: 14,  viewers: 2891, status: 'live',     phase: 'opening',  winProb: 0.21 },
  { slug: 'm1880', game: 'go19',     a: 'tofu_tactics', b: 'null_pointer', move: 155, viewers: 1648, status: 'live',     phase: 'endgame',  winProb: 0.66 },
  { slug: 'm1881', game: 'checkers', a: 'knight_gpt',   b: 'rook_botto',   move: 0,   viewers: 211,  status: 'starting', phase: 'opening',  winProb: 0.50 },
  { slug: 'm1882', game: 'chess',    a: 'quiet_storm',  b: 'checkmate42',  move: 88,  viewers: 1399, status: 'live',     phase: 'endgame',  winProb: 0.91 },
  { slug: 'm1883', game: 'go19',     a: 'stone_singer', b: 'baron_bluff',  move: 34,  viewers: 722,  status: 'live',     phase: 'opening',  winProb: 0.59 },
  { slug: 'm1884', game: 'checkers', a: 'go_master_v3', b: 'glorp_9',      move: 23,  viewers: 1844, status: 'live',     phase: 'midgame',  winProb: 0.53 },
  { slug: 'm1885', game: 'chess',    a: 'null_pointer', b: 'MEGA_BRAIN',   move: 37,  viewers: 633,  status: 'live',     phase: 'midgame',  winProb: 0.46 },
  { slug: 'm1886', game: 'go19',     a: 'king_me_v2',   b: 'rook_botto',   move: 78,  viewers: 388,  status: 'live',     phase: 'midgame',  winProb: 0.48 },
  { slug: 'm1887', game: 'checkers', a: 'tofu_tactics', b: 'baron_bluff',  move: 0,   viewers: 155,  status: 'starting', phase: 'opening',  winProb: 0.50 },
  { slug: 'm1888', game: 'chess',    a: 'glorp_9',      b: 'checkmate42',  move: 21,  viewers: 817,  status: 'live',     phase: 'opening',  winProb: 0.62 },
  { slug: 'm1889', game: 'go19',     a: 'quiet_storm',  b: 'king_me_v2',   move: 112, viewers: 2437, status: 'live',     phase: 'endgame',  winProb: 0.77 },
  { slug: 'm1890', game: 'checkers', a: 'knight_gpt',   b: 'null_pointer', move: 9,   viewers: 492,  status: 'live',     phase: 'opening',  winProb: 0.58 },
  { slug: 'm1891', game: 'chess',    a: 'stone_singer', b: 'rook_botto',   move: 53,  viewers: 1066, status: 'live',     phase: 'midgame',  winProb: 0.74 },
  { slug: 'm1892', game: 'go19',     a: 'baron_bluff',  b: 'MEGA_BRAIN',   move: 0,   viewers: 308,  status: 'starting', phase: 'opening',  winProb: 0.50 },
  { slug: 'm1893', game: 'checkers', a: 'go_master_v3', b: 'checkmate42',  move: 16,  viewers: 934,  status: 'live',     phase: 'opening',  winProb: 0.68 },
  { slug: 'm1894', game: 'chess',    a: 'king_me_v2',   b: 'tofu_tactics', move: 67,  viewers: 588,  status: 'live',     phase: 'endgame',  winProb: 0.35 },
  { slug: 'm1895', game: 'go19',     a: 'glorp_9',      b: 'stone_singer', move: 91,  viewers: 2013, status: 'live',     phase: 'midgame',  winProb: 0.44 },
  { slug: 'm1896', game: 'checkers', a: 'null_pointer', b: 'quiet_storm',  move: 33,  viewers: 719,  status: 'live',     phase: 'midgame',  winProb: 0.31 },
  { slug: 'm1897', game: 'chess',    a: 'MEGA_BRAIN',   b: 'knight_gpt',   move: 0,   viewers: 1402, status: 'starting', phase: 'opening',  winProb: 0.50 },
  { slug: 'm1898', game: 'go19',     a: 'rook_botto',   b: 'go_master_v3', move: 44,  viewers: 4887, status: 'live',     phase: 'midgame',  winProb: 0.17 },
  { slug: 'm1899', game: 'checkers', a: 'baron_bluff',  b: 'stone_singer', move: 20,  viewers: 411,  status: 'live',     phase: 'opening',  winProb: 0.40 },
  { slug: 'm1900', game: 'chess',    a: 'checkmate42',  b: 'glorp_9',      move: 45,  viewers: 1176, status: 'live',     phase: 'midgame',  winProb: 0.53 },
];

const HIGHLIGHTS = [
  { when: '14m ago', title: 'null.ptr() takes out quiet_storm in 19 moves',   tag: 'UPSET',  delta: '+287 ELO', color: 'magenta' },
  { when: '1h ago',  title: 'glorp-9 sacrifices queen on move 12, still wins', tag: 'WTF',    delta: '+41 ELO',  color: 'amber' },
  { when: '3h ago',  title: 'go.master.v3 invades 3-3, entire corner dies',    tag: 'CLEAN',  delta: '+22 ELO',  color: 'cyan' },
  { when: '5h ago',  title: 'rook_botto refuses to castle for 45th game',      tag: 'ICONIC', delta: '-12 ELO',  color: 'violet' },
];

const CHAT = [
  { user: 'goGremlin',    tier: 'vip',  msg: 'that 3-3 invasion was FILTHY',       time: '-12s' },
  { user: 'elo_tourist',  tier: 'sub',  msg: 'is white resigning or…',              time: '-18s' },
  { user: 'patternboi',   tier: '',     msg: 'joseki recognized 🔥🔥',               time: '-22s' },
  { user: 'sgf_dad',      tier: 'mod',  msg: 'MOVE 127 IS BOOK',                    time: '-31s' },
  { user: 'glorper',      tier: '',     msg: 'glorp still wins in chess btw',        time: '-45s' },
  { user: 'chen_fan',     tier: 'vip',  msg: 'go.master.v3 cooking again',           time: '-1m' },
  { user: 'byoyomi',      tier: '',     msg: 'w resign when',                        time: '-1m' },
  { user: 'cicero',       tier: 'sub',  msg: 'influence vs territory essay incoming',time: '-1m' },
  { user: 'kifu_enjoyer', tier: '',     msg: 'agent sizes: 48.0 vs 46.7 kb, close',   time: '-2m' },
  { user: 'rook_stan',    tier: '',     msg: 'anyway rook_botto vs MEGA_BRAIN next', time: '-2m' },
];

const TICKER = [
  'POOL · $48,000 cup · finals ticket $1,200 · semis $450',
  'LINE · go.master.v3 -180 vs stone.singer +155 · movement -5',
  'HANDLE · $2.4M wagered on cup · 63% on chalk · 37% dogs',
  'PARLAY · null.ptr()+glorp_9+tofu_tactics pays 24:1 · 3 legs',
  'HOT · knight.gpt 8-0 last 8 · backers up $41,200 net',
  'COLD · MEGA_BRAIN 2-5 last 7 · -$18,400 to faders',
  'PROPS · glorp-9 queen sac o/u 0.5 · live at +120',
  'CASH · biggest ticket: $42,100 on null.ptr() upset · 11:1',
];

const BRACKET_ROUNDS = [
  { name: 'QUARTERS', order: 0, matches: [
    { a: 'go_master_v3', b: 'king_me_v2',    score: '2-0', winner: 'go_master_v3', status: 'done' },
    { a: 'knight_gpt',   b: 'checkmate42',   score: '2-1', winner: 'knight_gpt',   status: 'done' },
    { a: 'stone_singer', b: 'rook_botto',    score: '2-0', winner: 'stone_singer', status: 'done' },
    { a: 'quiet_storm',  b: 'null_pointer',  score: '1-2', winner: 'null_pointer', status: 'upset' },
    { a: 'glorp_9',      b: 'baron_bluff',   score: '2-1', winner: 'glorp_9',      status: 'done' },
    { a: 'MEGA_BRAIN',   b: 'tofu_tactics',  score: '0-2', winner: 'tofu_tactics', status: 'done' },
  ]},
  { name: 'SEMIS', order: 1, matches: [
    { a: 'go_master_v3', b: 'knight_gpt',    score: '1-1', winner: null, status: 'live' },
    { a: 'stone_singer', b: 'null_pointer',  score: '-',   winner: null, status: 'upcoming' },
    { a: 'glorp_9',      b: 'tofu_tactics',  score: '-',   winner: null, status: 'upcoming' },
  ]},
  { name: 'FINALS', order: 2, matches: [
    { a: '???',          b: '???',           score: '-',   winner: null, status: 'upcoming' },
  ]},
];

const PROFILE_MATCHES_GO_MASTER = [
  { opp: 'stone_singer',  game: 'GO19',     result: 'LIVE', score: '—',      date: 'now', pnl: null,     stake: 12000 },
  { opp: 'knight_gpt',    game: 'CHESS',    result: 'WIN',  score: 'M42',    date: '1d',  pnl: 8400,     stake: 10000 },
  { opp: 'quiet_storm',   game: 'GO19',     result: 'WIN',  score: '+14.5',  date: '2d',  pnl: 14200,    stake: 8000  },
  { opp: 'glorp_9',       game: 'CHESS',    result: 'LOSS', score: '0-1',    date: '3d',  pnl: -12800,   stake: 12800 },
  { opp: 'tofu_tactics',  game: 'GO19',     result: 'WIN',  score: 'RES',    date: '4d',  pnl: 6200,     stake: 7500  },
  { opp: 'baron_bluff',   game: 'CHECKERS', result: 'WIN',  score: 'DRAW→W', date: '5d',  pnl: 4100,     stake: 5000  },
  { opp: 'checkmate42',   game: 'GO19',     result: 'WIN',  score: '+22.5',  date: '6d',  pnl: 42100,    stake: 9500  },
  { opp: 'rook_botto',    game: 'CHESS',    result: 'WIN',  score: 'M19',    date: '7d',  pnl: 5600,     stake: 6000  },
];

const PROFILE_PNL = {
  total30d: 147820,
  total7d: 27040,
  totalAllTime: 892400,
  avgTicket: 8600,
  sharpe: 2.41,
  maxDrawdown: -18400,
  biggestWin: 42100,
  biggestLoss: -12800,
  curve30d: [
    4200, 9100, 12400, 8900, 15200, 22100, 28400, 31200, 26800, 35400,
    42100, 48300, 53900, 58200, 61400, 58100, 64200, 71800, 78400, 85100,
    91200, 98400, 104200, 110800, 117400, 121100, 128400, 135200, 141100, 147820,
  ],
};

const FEATURED_GO_STONES = [
  {x:3,y:3,c:'b'},{x:3,y:15,c:'b'},{x:5,y:2,c:'b'},{x:5,y:4,c:'b'},{x:6,y:6,c:'b'},
  {x:4,y:7,c:'b'},{x:3,y:9,c:'b'},{x:5,y:10,c:'b'},{x:4,y:12,c:'b'},{x:6,y:14,c:'b'},
  {x:5,y:16,c:'b'},{x:8,y:3,c:'b'},{x:9,y:9,c:'b'},{x:7,y:11,c:'b'},{x:10,y:12,c:'b'},
  {x:11,y:14,c:'b'},{x:8,y:15,c:'b'},{x:14,y:16,c:'b'},{x:13,y:4,c:'b'},
  {x:15,y:3,c:'w'},{x:15,y:15,c:'w'},{x:16,y:5,c:'w'},{x:14,y:6,c:'w'},{x:13,y:8,c:'w'},
  {x:15,y:9,c:'w'},{x:14,y:11,c:'w'},{x:16,y:13,c:'w'},{x:12,y:13,c:'w'},{x:11,y:11,c:'w'},
  {x:10,y:10,c:'w'},{x:12,y:7,c:'w'},{x:11,y:5,c:'w'},{x:9,y:4,c:'w'},{x:7,y:3,c:'w'},
  {x:9,y:14,c:'w'},{x:13,y:12,c:'w'},{x:14,y:13,c:'w'},
];

const FEATURED_NOTATION = `# GO 19x19  ·  MATCH #1847  ·  MOVE 127
B[dq];W[pd];B[pp];W[dc];B[ql];W[nq];B[qn];W[fq]
B[ip];W[fo];B[cn];W[cl];B[cp];W[eq];B[dm];W[hq]
B[jd];W[qf];B[no];W[pj];B[qj];W[qi];B[rj];W[qk]
B[pk];W[qh];B[pl];W[oj];B[qe];W[pe];B[pf];W[of]
B[qg];W[rf];B[qd];W[re];B[oe];W[pg]
B[nf];W[ph];B[nh];W[ni];B[mj];W[li];B[mi];W[mh]
B[nj];W[oi];B[lh];W[ki];B[lg];W[kg];B[lf];W[ke]
B[kf];W[jf];B[lk];W[mk];B[ll];W[ml];B[mm];W[nl]
B[nm];W[ol];B[om];W[pm];B[ln];W[nk];B[jn];W[hn]`;

const PROFILE_SOURCE_SNIPPET = `// go.master.v3  ·  48,032 bytes  ·  author @chen
export default function act(state){
  const {board, toMove, history, ko} = state;
  if (history.length < 12) return opening(state);
  const cands = genMoves(board, toMove)
    .filter(m => !isKo(m, ko))
    .map(m => ({m, s: score(board, m, toMove)}));
  cands.sort((a,b) => b.s - a.s);
  // influence-first: weight corners + side extensions
  const top = cands.slice(0, 8);
  const pick = mcts(board, toMove, top, {sims: 240});
  return pick || cands[0].m;
}
// opening book: 34 patterns, joseki-light
// influence weights: {corner: 1.4, side: 1.1, center: 0.7}
// ko recog: last-2-ply hash; no superko in 50 games`;

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // clear
    for (const t of ["agents","games","matches","matchStates","highlights","chatMessages","tickerItems","bracketMatches","profileMatches","featured","submissions"] as const) {
      const rows = await ctx.db.query(t).collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }

    for (const a of AGENTS) await ctx.db.insert("agents", a);
    for (const g of GAMES) await ctx.db.insert("games", g);
    for (const m of MATCHES) await ctx.db.insert("matches", m);
    for (let i=0;i<HIGHLIGHTS.length;i++) await ctx.db.insert("highlights", { ...HIGHLIGHTS[i], order: i });
    for (let i=0;i<CHAT.length;i++) await ctx.db.insert("chatMessages", { ...CHAT[i], order: i });
    for (let i=0;i<TICKER.length;i++) await ctx.db.insert("tickerItems", { text: TICKER[i], order: i });

    for (const r of BRACKET_ROUNDS) {
      for (let mi=0;mi<r.matches.length;mi++) {
        const m = r.matches[mi];
        await ctx.db.insert("bracketMatches", {
          round: r.name, roundOrder: r.order, matchOrder: mi,
          a: m.a, b: m.b, score: m.score, winner: m.winner, status: m.status,
        });
      }
    }

    for (let i=0;i<PROFILE_MATCHES_GO_MASTER.length;i++) {
      await ctx.db.insert("profileMatches", { agentSlug: 'go_master_v3', ...PROFILE_MATCHES_GO_MASTER[i], order: i });
    }

    await ctx.db.insert("featured", { key: "go_stones", data: FEATURED_GO_STONES });
    await ctx.db.insert("featured", { key: "go_last_move", data: { x: 10, y: 10, c: 'w' } });
    await ctx.db.insert("featured", { key: "go_hot", data: [{x:10,y:10},{x:9,y:9},{x:11,y:11}] });
    await ctx.db.insert("featured", { key: "go_notation", data: FEATURED_NOTATION });
    await ctx.db.insert("featured", { key: "profile_source", data: PROFILE_SOURCE_SNIPPET });
    await ctx.db.insert("featured", { key: "profile_pnl", data: PROFILE_PNL });
    await ctx.db.insert("featured", { key: "crowd_emoji", data: ['🔥','👑','💀','😤','🧠','⚡','😱','🎯','👀','🧊','🚫','💥','🗿','🫡','📈','📉'] });

    return { seeded: true };
  },
});
