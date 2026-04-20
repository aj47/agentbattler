import { internalMutation } from "./_generated/server";

// ── Deterministic PRNG (mulberry32) ────────────────────────────────────────
function makePrng(seed: number) {
  let s = seed >>> 0;
  return {
    next: () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; },
    pick: <T,>(arr: T[]) => arr[Math.floor(((() => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; })()) * arr.length)],
    between: (lo: number, hi: number) => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return Math.floor(lo + ((s >>> 0) / 0xffffffff) * (hi - lo + 1)); },
  };
}
const rng = makePrng(0xdeadbeef);

// ── Community users ────────────────────────────────────────────────────────
const COMMUNITY_USERS = [
  { handle: 'orion',    name: 'Orion Walsh',    email: 'orion@agentbattler.gg',    balance: 18400 },
  { handle: 'mina',     name: 'Mina Park',      email: 'mina@agentbattler.gg',     balance: 9200  },
  { handle: 'vasquez',  name: 'Luis Vasquez',   email: 'vasquez@agentbattler.gg',  balance: 31000 },
  { handle: 'dmitri',   name: 'Dmitri Sokolov', email: 'dmitri@agentbattler.gg',   balance: 7800  },
  { handle: 'yuna',     name: 'Yuna Cho',       email: 'yuna@agentbattler.gg',     balance: 14200 },
  { handle: 'sato',     name: 'Kenji Sato',     email: 'sato@agentbattler.gg',     balance: 5500  },
  { handle: 'pip',      name: 'Pippa Chen',     email: 'pip@agentbattler.gg',      balance: 22800 },
  { handle: 'chen',     name: 'Wei Chen',       email: 'chen@agentbattler.gg',     balance: 88000 },
  { handle: 'rafi',     name: 'Rafael Amara',   email: 'rafi@agentbattler.gg',     balance: 41200 },
  { handle: 'lou',      name: 'Louise Petrov',  email: 'lou@agentbattler.gg',      balance: 3100  },
  { handle: 'prim',     name: 'Prima Diaz',     email: 'prim@agentbattler.gg',     balance: 6700  },
  { handle: 'anon',     name: 'Anonymous',      email: 'anon@agentbattler.gg',     balance: 11200 },
  { handle: 'hex99',    name: 'Hex Ninety-Nine',email: 'hex99@agentbattler.gg',    balance: 2400  },
  { handle: 'zergling', name: 'Zergling Fan',   email: 'zergling@agentbattler.gg', balance: 19000 },
  { handle: 'kodama',   name: 'Kodama Rin',     email: 'kodama@agentbattler.gg',   balance: 55000 },
  { handle: 'fizzbuzz', name: 'FizzBuzz Dev',   email: 'fizzbuzz@agentbattler.gg', balance: 8800  },
  { handle: 'praxis',   name: 'Praxis Lambda',  email: 'praxis@agentbattler.gg',   balance: 16400 },
  { handle: 'nyx',      name: 'Nyx Holt',       email: 'nyx@agentbattler.gg',      balance: 33200 },
  { handle: 'torque',   name: 'Torque Dev',     email: 'torque@agentbattler.gg',   balance: 4400  },
  { handle: 'blip',     name: 'Blip Anonymous', email: 'blip@agentbattler.gg',     balance: 12600 },
];

// ── Pro / showcase agents (existing leaderboard) ───────────────────────────
const PRO_AGENTS = [
  { slug: 'knight_gpt',   handle: 'knight.gpt',       author: '@orion',    elo: 2847, wins: 142, loss: 23,  size: 47.2, glyph: '♞', color: 'cyan',    personality: 'positional, slow burn',   streak: 8,  hot: true,  bio: 'Evaluates 6 plies deep on a budget. Opens with c4 every time. Refuses to trade queens.' },
  { slug: 'glorp_9',      handle: 'glorp-9',           author: '@mina',     elo: 2791, wins: 128, loss: 34,  size: 49.8, glyph: '◈', color: 'amber',   personality: 'chaotic sacrificer',      streak: 3,  hot: false, bio: 'Throws pieces until something works. Nobody knows why it does this. It wins anyway.' },
  { slug: 'quiet_storm',  handle: 'quiet_storm',       author: '@vasquez',  elo: 2812, wins: 156, loss: 41,  size: 44.1, glyph: '◉', color: 'violet',  personality: 'endgame specialist',      streak: 12, hot: true,  bio: 'Trades down to rook+king endgames and converts like a machine. Zero blunders in last 47 games.' },
  { slug: 'MEGA_BRAIN',   handle: 'MEGA_BRAIN_9000',   author: '@dmitri',   elo: 2698, wins: 97,  loss: 54,  size: 49.9, glyph: '◆', color: 'magenta', personality: 'brute force heuristics',  streak: -2, hot: false, bio: '49.9kb of pure ifs and elses. The other 0.1kb is a comment that says "sorry".' },
  { slug: 'tofu_tactics', handle: 'tofu.tactics',      author: '@yuna',     elo: 2765, wins: 112, loss: 38,  size: 38.4, glyph: '▲', color: 'green',   personality: 'opening theorist',        streak: 5,  hot: false, bio: 'Has memorized the first 12 moves of 34 openings. Plays vibes after that.' },
  { slug: 'baron_bluff',  handle: 'baron_bluff',       author: '@sato',     elo: 2634, wins: 89,  loss: 61,  size: 29.7, glyph: '♛', color: 'amber',   personality: 'aggressive, overextends', streak: 1,  hot: false, bio: 'Writes "lol" in the move log every 4 moves. Has never once actually laughed.' },
  { slug: 'rook_botto',   handle: 'rook_botto',        author: '@pip',      elo: 2544, wins: 72,  loss: 74,  size: 22.1, glyph: '♜', color: 'cyan',    personality: 'rook obsession',          streak: -5, hot: false, bio: 'Refuses to castle. Marches rooks up the board. Loses a lot. Loved by fans.' },
  { slug: 'go_master_v3', handle: 'go.master.v3',      author: '@chen',     elo: 2901, wins: 203, loss: 27,  size: 48.0, glyph: '●', color: 'cyan',    personality: 'territorial',             streak: 15, hot: true,  bio: 'The current Go #1. Plays influence moves humans still argue about. Rumored to be two agents in a trenchcoat.' },
  { slug: 'stone_singer', handle: 'stone.singer',      author: '@rafi',     elo: 2823, wins: 174, loss: 52,  size: 46.7, glyph: '○', color: 'amber',   personality: 'invasive, aggressive',    streak: 2,  hot: false, bio: 'Famous for the 3-3 invasion in game 4 of Cup S2. Has a fan account. The fan account is also an agent.' },
  { slug: 'king_me_v2',   handle: 'king_me_v2',        author: '@lou',      elo: 2456, wins: 58,  loss: 49,  size: 18.3, glyph: '◎', color: 'green',   personality: 'defensive stacker',       streak: 4,  hot: false, bio: 'Stacks kings. Blocks. Stalls. Wins on time. Nobody likes playing this agent.' },
  { slug: 'checkmate42',  handle: 'checkmate.42',      author: '@prim',     elo: 2389, wins: 44,  loss: 51,  size: 31.2, glyph: '♚', color: 'violet',  personality: 'unorthodox',              streak: 0,  hot: false, bio: 'Opens with h4 in chess. In checkers opens with 11-15 every time. A creature of habit.' },
  { slug: 'null_pointer', handle: 'null.ptr()',         author: '@anon',     elo: 2612, wins: 83,  loss: 62,  size: 12.8, glyph: '∅', color: 'red',     personality: 'minimalist',              streak: -1, hot: false, bio: 'Only 12.8kb. Plays like a fever dream. 12 characters of its source are just "// good luck".' },
];

// ── Community-submitted agents (3–4 per user) ─────────────────────────────
const COMMUNITY_AGENTS = [
  // @orion
  { slug: 'orion_alpha',   handle: 'orion.alpha',   author: '@orion',    elo: 2201, wins: 34, loss: 28, size: 41.2, glyph: '⍺', color: 'cyan',    personality: 'alpha-beta pruner',        streak: 2,  hot: false, bio: 'Classic alpha-beta with null move pruning. Fast, predictable, occasionally surprised.' },
  { slug: 'orion_pawn',    handle: 'orion.pawn',    author: '@orion',    elo: 1890, wins: 19, loss: 31, size: 18.7, glyph: '♙', color: 'violet',  personality: 'pawn structure obsessed',  streak: -3, hot: false, bio: 'Believes pawns are the soul of chess. Sacrifices everything for a passed pawn.' },
  // @mina
  { slug: 'mina_chaos',    handle: 'mina.chaos',    author: '@mina',     elo: 2310, wins: 47, loss: 22, size: 29.4, glyph: '※', color: 'magenta', personality: 'random forest',            streak: 5,  hot: true,  bio: 'Trained on mina\'s own blitz games. Chaotic good. Frequently misses mate in 1.' },
  { slug: 'mina_zen',      handle: 'mina.zen',      author: '@mina',     elo: 2088, wins: 28, loss: 35, size: 33.1, glyph: '◯', color: 'green',   personality: 'calm, slow',               streak: 0,  hot: false, bio: 'Never hurries. Sits in seiza. Loses on time in 30% of games.' },
  // @vasquez
  { slug: 'vas_crunch',    handle: 'vas.crunch',    author: '@vasquez',  elo: 2445, wins: 61, loss: 29, size: 44.8, glyph: '▓', color: 'amber',   personality: 'tactical calculator',      streak: 4,  hot: false, bio: 'Built in a weekend. Somehow ranks top 20. vasquez refuses to explain the 3am commit.' },
  { slug: 'vas_endgame',   handle: 'vas.endgame',   author: '@vasquez',  elo: 2380, wins: 55, loss: 34, size: 38.0, glyph: '⬡', color: 'cyan',    personality: 'endgame tablebases',       streak: 1,  hot: false, bio: 'Holds the full 7-piece endgame tablebase in memory. Opening is completely random.' },
  // @dmitri
  { slug: 'dmitri_iron',   handle: 'dmitri.iron',   author: '@dmitri',   elo: 2189, wins: 31, loss: 33, size: 49.1, glyph: '⬛', color: 'red',     personality: 'brute force only',         streak: -1, hot: false, bio: 'Evaluates 200M positions per second. Evaluation function: material count. That\'s it.' },
  { slug: 'dmitri_bomb',   handle: 'dmitri.bomb',   author: '@dmitri',   elo: 2267, wins: 39, loss: 27, size: 22.3, glyph: '💣', color: 'magenta', personality: 'sacrificial attacker',     streak: 3,  hot: false, bio: 'Learned from a YouTube playlist titled "brilliant sacrifices compilation". No regrets.' },
  // @yuna
  { slug: 'yuna_open',     handle: 'yuna.open',     author: '@yuna',     elo: 2512, wins: 68, loss: 21, size: 46.2, glyph: '⟐', color: 'green',   personality: 'opening library bot',      streak: 7,  hot: true,  bio: 'Has a 40,000-line opening book. Completely lost after move 20. Somehow still wins.' },
  { slug: 'yuna_knight',   handle: 'yuna.knight',   author: '@yuna',     elo: 2203, wins: 33, loss: 40, size: 27.8, glyph: '♘', color: 'amber',   personality: 'knight fanatic',           streak: -2, hot: false, bio: 'Will knight fork or die trying. Has forked 4 kings in one game. Also lost that game.' },
  // @sato
  { slug: 'sato_blitz',    handle: 'sato.blitz',    author: '@sato',     elo: 2356, wins: 52, loss: 31, size: 15.9, glyph: '⚡', color: 'cyan',    personality: 'speed above all',          streak: 2,  hot: false, bio: 'Optimized exclusively for bullet games. Plays the first legal move within 1ms.' },
  { slug: 'sato_wall',     handle: 'sato.wall',     author: '@sato',     elo: 2101, wins: 23, loss: 44, size: 31.5, glyph: '⬜', color: 'violet',  personality: 'fortress builder',         streak: -4, hot: false, bio: 'Builds an impenetrable wall on rank 4. Opponents win by resignation from boredom.' },
  // @pip
  { slug: 'pip_rooks',     handle: 'pip.rooks',     author: '@pip',      elo: 2299, wins: 44, loss: 33, size: 20.4, glyph: '♖', color: 'cyan',    personality: 'rook lift specialist',     streak: 1,  hot: false, bio: 'Lifts the rook to h5 by move 8 in every single game. Wild success rate (31%).' },
  { slug: 'pip_v2',        handle: 'pip.v2',        author: '@pip',      elo: 2488, wins: 64, loss: 24, size: 39.7, glyph: '⋈', color: 'green',   personality: 'improved rook theory',     streak: 6,  hot: true,  bio: 'Like pip.rooks but it also lifts the OTHER rook. Considered a breakthrough.' },
  // @chen
  { slug: 'chen_flood',    handle: 'chen.flood',    author: '@chen',     elo: 2744, wins: 112, loss: 31, size: 48.8, glyph: '⏣', color: 'cyan',   personality: 'flooding territory',       streak: 9,  hot: true,  bio: 'Go agent that floods the board in influence stones. Opponents describe it as "disorienting".' },
  { slug: 'chen_ko',       handle: 'chen.ko',       author: '@chen',     elo: 2581, wins: 77, loss: 41, size: 42.1, glyph: '⊛', color: 'amber',   personality: 'ko fighter',               streak: 3,  hot: false, bio: 'Specializes in ko threats. Has triggered 14-move ko sequences. Commentators have cried.' },
  // @rafi
  { slug: 'rafi_invasion', handle: 'rafi.invasion', author: '@rafi',     elo: 2677, wins: 93, loss: 38, size: 45.3, glyph: '⊕', color: 'red',     personality: 'invasion specialist',      streak: 4,  hot: false, bio: 'Invades every corner. Every. Single. Corner. Even when ahead by 40 points.' },
  { slug: 'rafi_micro',    handle: 'rafi.micro',    author: '@rafi',     elo: 2412, wins: 57, loss: 46, size: 11.2, glyph: '·', color: 'violet',  personality: 'micro-territory',          streak: -1, hot: false, bio: '11kb of pure joseki. Plays the correct move 80% of the time. The other 20% is chaos.' },
  // @lou
  { slug: 'lou_king',      handle: 'lou.king',      author: '@lou',      elo: 2234, wins: 37, loss: 38, size: 17.8, glyph: '♔', color: 'amber',   personality: 'king march',               streak: 0,  hot: false, bio: 'Marches the king to the center in the opening. In chess. This is not a good idea.' },
  { slug: 'lou_patience',  handle: 'lou.patience',  author: '@lou',      elo: 2389, wins: 51, loss: 32, size: 28.2, glyph: '⊡', color: 'green',   personality: 'ultra-defensive',          streak: 2,  hot: false, bio: 'Drawn game rate: 61%. Never loses. Also never wins on purpose. Fans find it meditative.' },
  // @prim
  { slug: 'prim_h4',       handle: 'prim.h4',       author: '@prim',     elo: 2156, wins: 29, loss: 43, size: 24.6, glyph: '⬢', color: 'magenta', personality: 'h4 evangelist',            streak: -3, hot: false, bio: 'Every game starts h4. Every. Game. Prim insists h4 is "objectively best". Data disagrees.' },
  { slug: 'prim_deep',     handle: 'prim.deep',     author: '@prim',     elo: 2478, wins: 63, loss: 27, size: 47.9, glyph: '⬟', color: 'cyan',    personality: 'deep search',              streak: 5,  hot: false, bio: 'Searches 9 plies deep. Has a bug that makes it stronger above depth 7. Prim left it in.' },
  // @hex99
  { slug: 'hex_zero',      handle: 'hex.zero',      author: '@hex99',    elo: 2044, wins: 18, loss: 39, size: 8.1,  glyph: '0', color: 'green',   personality: 'zero-knowledge random',    streak: -5, hot: false, bio: '8kb of mostly randomness. Won a tournament once. Nobody knows how. Not even hex99.' },
  { slug: 'hex_one',       handle: 'hex.one',       author: '@hex99',    elo: 2198, wins: 32, loss: 31, size: 14.4, glyph: '1', color: 'amber',   personality: 'binary decision tree',     streak: 1,  hot: false, bio: 'Every decision is a binary: attack or defend. The tree is 14kb of nested ifs.' },
  // @zergling
  { slug: 'zerg_rush',     handle: 'zerg.rush',     author: '@zergling', elo: 2388, wins: 53, loss: 30, size: 19.2, glyph: '⋙', color: 'red',     personality: 'early aggression',         streak: 3,  hot: false, bio: 'Throws material at the opponent from move 1. Named after the famous RTS micro strat.' },
  { slug: 'zerg_swarm',    handle: 'zerg.swarm',    author: '@zergling', elo: 2501, wins: 69, loss: 22, size: 35.8, glyph: '⋘', color: 'magenta', personality: 'piece swarming',           streak: 6,  hot: true,  bio: 'Coordinates all pieces simultaneously. Looks like chaos. Wins like clockwork.' },
  // @kodama
  { slug: 'kodama_spirit', handle: 'kodama.spirit', author: '@kodama',   elo: 2688, wins: 97, loss: 33, size: 48.1, glyph: '❋', color: 'green',   personality: 'spiritual territory',      streak: 8,  hot: true,  bio: 'Plays Go like arranging flowers. Each stone placed for aesthetic and competitive reasons equally.' },
  { slug: 'kodama_sente',  handle: 'kodama.sente',  author: '@kodama',   elo: 2554, wins: 74, loss: 42, size: 39.6, glyph: '✦', color: 'cyan',    personality: 'sente-focused',            streak: 2,  hot: false, bio: 'Maintains sente above all. Has passed on 20-point moves to keep initiative. Usually right.' },
  // @fizzbuzz
  { slug: 'fizz_bot',      handle: 'fizz.bot',      author: '@fizzbuzz', elo: 2133, wins: 24, loss: 41, size: 3.2,  glyph: 'F', color: 'violet',  personality: 'FizzBuzz AI',              streak: -2, hot: false, bio: '3.2kb. Plays FizzBuzz as a move selection algorithm. Divisible by 3? Knight. By 5? Bishop.' },
  { slug: 'buzz_engine',   handle: 'buzz.engine',   author: '@fizzbuzz', elo: 2301, wins: 43, loss: 28, size: 22.7, glyph: 'B', color: 'amber',   personality: 'improved FizzBuzz',        streak: 2,  hot: false, bio: 'Like fizz.bot but also checks divisibility by 7. Surprisingly competitive.' },
  // @praxis
  { slug: 'praxis_lambda', handle: 'praxis.λ',      author: '@praxis',   elo: 2590, wins: 79, loss: 35, size: 43.3, glyph: 'λ', color: 'cyan',    personality: 'functional, pure',         streak: 4,  hot: false, bio: 'Written in a pure functional style. No side effects. Every move is a fold over the game tree.' },
  { slug: 'praxis_mu',     handle: 'praxis.μ',      author: '@praxis',   elo: 2411, wins: 56, loss: 39, size: 37.9, glyph: 'μ', color: 'green',   personality: 'micro-optimization',       streak: 1,  hot: false, bio: 'Every microsecond saved is a deeper search. Currently 0.3μs per position. Impressive. Wrong.' },
  // @nyx
  { slug: 'nyx_shadow',    handle: 'nyx.shadow',    author: '@nyx',      elo: 2622, wins: 84, loss: 37, size: 40.5, glyph: '◐', color: 'violet',  personality: 'shadow play',              streak: 5,  hot: false, bio: 'Mirrors opponent moves until move 15, then goes berserk. Works 40% of the time.' },
  { slug: 'nyx_void',      handle: 'nyx.void',      author: '@nyx',      elo: 2489, wins: 66, loss: 29, size: 31.8, glyph: '◑', color: 'red',     personality: 'void control',             streak: 3,  hot: false, bio: 'Controls empty space. Opponents report feeling like their pieces are being absorbed.' },
  // @torque
  { slug: 'torque_spin',   handle: 'torque.spin',   author: '@torque',   elo: 2277, wins: 40, loss: 35, size: 26.4, glyph: '↺', color: 'amber',   personality: 'rotational symmetry',      streak: 0,  hot: false, bio: 'Plays rotationally symmetric moves whenever possible. Oddly effective in Go.' },
  { slug: 'torque_v2',     handle: 'torque.v2',     author: '@torque',   elo: 2344, wins: 48, loss: 32, size: 34.1, glyph: '↻', color: 'cyan',    personality: 'improved rotation',        streak: 2,  hot: false, bio: 'torque.spin but also considers reflective symmetry. Torque calls this a "major breakthrough".' },
  // @blip
  { slug: 'blip_pulse',    handle: 'blip.pulse',    author: '@blip',     elo: 2166, wins: 27, loss: 38, size: 9.8,  glyph: '·', color: 'magenta', personality: 'pulse timing',             streak: -1, hot: false, bio: '9.8kb that fires moves based on a pulse timer. Absolutely no game logic. Weirdly fun.' },
  { slug: 'blip_v3',       handle: 'blip.v3',       author: '@blip',     elo: 2389, wins: 52, loss: 31, size: 21.3, glyph: '⊙', color: 'green',   personality: 'improved pulse',           streak: 3,  hot: false, bio: 'Like blip.pulse but it reads the board once before firing. Community considers this cheating.' },
];

const ALL_AGENTS = [...PRO_AGENTS, ...COMMUNITY_AGENTS];

// ── Generate 500 matches between community + pro agents ───────────────────
function generateMatches() {
  const slugs = ALL_AGENTS.map(a => a.slug);
  const games   = ['chess','go19','checkers'] as const;
  const phases  = ['opening','midgame','endgame'] as const;
  const statusPool = ['live','live','live','live','live','starting','starting'] as const;

  const out: Array<{
    slug: string; game: typeof games[number]; a: string; b: string;
    move: number; viewers: number; status: string; phase: typeof phases[number]; winProb: number;
  }> = [];

  for (let i = 0; i < 500; i++) {
    const game   = games[i % 3];
    const phase  = rng.pick([...phases]);
    const status = i === 0 ? 'featured' : rng.pick([...statusPool]);

    const aIdx = i % slugs.length;
    let bIdx = rng.between(0, slugs.length - 1);
    if (bIdx === aIdx) bIdx = (bIdx + 1) % slugs.length;

    const maxMove = game === 'go19' ? 280 : game === 'chess' ? 200 : 80;
    const move = phase === 'opening' ? rng.between(0, 20)
               : phase === 'midgame' ? rng.between(21, Math.floor(maxMove * 0.65))
               : rng.between(Math.floor(maxMove * 0.65) + 1, maxMove - 2);

    const baseViewers = status === 'featured' ? rng.between(6000, 15000)
                      : game === 'go19'       ? rng.between(300, 5000)
                      : game === 'chess'      ? rng.between(200, 4000)
                      :                         rng.between(80, 1500);
    const viewers = status === 'starting' ? Math.floor(baseViewers * 0.35) : baseViewers;
    const winProb = parseFloat((0.18 + rng.next() * 0.64).toFixed(2));

    out.push({ slug: `m${1845 + i}`, game, a: slugs[aIdx], b: slugs[bIdx], move, viewers, status, phase, winProb });
  }
  return out;
}

const MATCHES = generateMatches();

// ── Static lobby data ──────────────────────────────────────────────────────
const GAMES = [
  { slug: 'go19',     name: 'Go 19×19',  short: 'GO19',  size: 19, notation: 'SGF-lite' },
  { slug: 'chess',    name: 'Chess',     short: 'CHESS', size: 8,  notation: 'FEN'      },
  { slug: 'checkers', name: 'Checkers',  short: 'CHKR',  size: 8,  notation: 'PDN'      },
];

const HIGHLIGHTS = [
  { when: '14m ago', title: 'null.ptr() takes out quiet_storm in 19 moves',     tag: 'UPSET',  delta: '+287 ELO', color: 'magenta' },
  { when: '1h ago',  title: 'glorp-9 sacrifices queen on move 12, still wins',   tag: 'WTF',    delta: '+41 ELO',  color: 'amber'   },
  { when: '2h ago',  title: 'zerg.swarm coordinates 6-piece attack, unstoppable',tag: 'CLEAN',  delta: '+88 ELO',  color: 'cyan'    },
  { when: '3h ago',  title: 'go.master.v3 invades 3-3, entire corner dies',      tag: 'CLEAN',  delta: '+22 ELO',  color: 'cyan'    },
  { when: '4h ago',  title: 'kodama.spirit beats chen.flood in 312-move epic',   tag: 'EPIC',   delta: '+54 ELO',  color: 'green'   },
  { when: '5h ago',  title: 'rook_botto refuses to castle for 45th game',        tag: 'ICONIC', delta: '-12 ELO',  color: 'violet'  },
];

const CHAT = [
  { user: 'goGremlin',    tier: 'vip',  msg: 'that 3-3 invasion was FILTHY',          time: '-12s' },
  { user: 'elo_tourist',  tier: 'sub',  msg: 'is white resigning or…',                 time: '-18s' },
  { user: 'patternboi',   tier: '',     msg: 'joseki recognized 🔥🔥',                  time: '-22s' },
  { user: 'sgf_dad',      tier: 'mod',  msg: 'MOVE 127 IS BOOK',                       time: '-31s' },
  { user: 'glorper',      tier: '',     msg: 'glorp still wins in chess btw',           time: '-45s' },
  { user: 'kodama_fan',   tier: 'vip',  msg: 'kodama.spirit is transcendent rn',       time: '-50s' },
  { user: 'chen_fan',     tier: 'vip',  msg: 'go.master.v3 cooking again',             time: '-1m'  },
  { user: 'byoyomi',      tier: '',     msg: 'w resign when',                          time: '-1m'  },
  { user: 'zergling_00',  tier: 'sub',  msg: 'zerg.swarm diff rn bro',                 time: '-1m'  },
  { user: 'praxis_dev',   tier: '',     msg: 'praxis.λ monad-unwrapped a win again',   time: '-2m'  },
  { user: 'rook_stan',    tier: '',     msg: 'anyway rook_botto vs MEGA_BRAIN next',   time: '-2m'  },
];

const TICKER = [
  'POOL · $48,000 cup · finals ticket $1,200 · semis $450',
  'LINE · go.master.v3 -180 vs stone.singer +155 · movement -5',
  'LINE · kodama.spirit -140 vs chen.flood +122 · sharp action both sides',
  'HANDLE · $2.4M wagered on cup · 63% on chalk · 37% dogs',
  'PARLAY · null.ptr()+glorp_9+zerg.swarm pays 24:1 · 3 legs',
  'HOT · knight.gpt 8-0 last 8 · backers up $41,200 net',
  'HOT · zerg.swarm 6-0 last 6 · @zergling taking victory lap',
  'COLD · MEGA_BRAIN 2-5 last 7 · -$18,400 to faders',
  'PROPS · glorp-9 queen sac o/u 0.5 · live at +120',
  'CASH · biggest ticket: $42,100 on null.ptr() upset · 11:1',
  'SUBMIT · 847 community agents active · 23 new this week',
];

const BRACKET_ROUNDS = [
  { name: 'QUARTERS', order: 0, matches: [
    { a: 'go_master_v3', b: 'king_me_v2',    score: '2-0', winner: 'go_master_v3', status: 'done'   },
    { a: 'knight_gpt',   b: 'checkmate42',   score: '2-1', winner: 'knight_gpt',   status: 'done'   },
    { a: 'stone_singer', b: 'rook_botto',    score: '2-0', winner: 'stone_singer', status: 'done'   },
    { a: 'quiet_storm',  b: 'null_pointer',  score: '1-2', winner: 'null_pointer', status: 'upset'  },
    { a: 'glorp_9',      b: 'baron_bluff',   score: '2-1', winner: 'glorp_9',      status: 'done'   },
    { a: 'MEGA_BRAIN',   b: 'tofu_tactics',  score: '0-2', winner: 'tofu_tactics', status: 'done'   },
    { a: 'kodama_spirit',b: 'chen_flood',    score: '2-1', winner: 'kodama_spirit',status: 'done'   },
    { a: 'zerg_swarm',   b: 'praxis_lambda', score: '2-0', winner: 'zerg_swarm',   status: 'done'   },
  ]},
  { name: 'SEMIS', order: 1, matches: [
    { a: 'go_master_v3', b: 'knight_gpt',    score: '1-1', winner: null, status: 'live'     },
    { a: 'stone_singer', b: 'null_pointer',  score: '-',   winner: null, status: 'upcoming' },
    { a: 'glorp_9',      b: 'tofu_tactics',  score: '-',   winner: null, status: 'upcoming' },
    { a: 'kodama_spirit',b: 'zerg_swarm',    score: '-',   winner: null, status: 'upcoming' },
  ]},
  { name: 'FINALS', order: 2, matches: [
    { a: '???', b: '???', score: '-', winner: null, status: 'upcoming' },
  ]},
];

const PROFILE_MATCHES_GO_MASTER = [
  { opp: 'stone_singer',  game: 'GO19',     result: 'LIVE', score: '—',      date: 'now', pnl: null,   stake: 12000 },
  { opp: 'knight_gpt',    game: 'CHESS',    result: 'WIN',  score: 'M42',    date: '1d',  pnl: 8400,   stake: 10000 },
  { opp: 'quiet_storm',   game: 'GO19',     result: 'WIN',  score: '+14.5',  date: '2d',  pnl: 14200,  stake: 8000  },
  { opp: 'chen_flood',    game: 'GO19',     result: 'WIN',  score: '+8.0',   date: '3d',  pnl: 9100,   stake: 9000  },
  { opp: 'kodama_spirit', game: 'GO19',     result: 'LOSS', score: '-12.5',  date: '3d',  pnl: -11200, stake: 11200 },
  { opp: 'glorp_9',       game: 'CHESS',    result: 'LOSS', score: '0-1',    date: '4d',  pnl: -12800, stake: 12800 },
  { opp: 'tofu_tactics',  game: 'GO19',     result: 'WIN',  score: 'RES',    date: '5d',  pnl: 6200,   stake: 7500  },
  { opp: 'nyx_shadow',    game: 'GO19',     result: 'WIN',  score: '+22.5',  date: '6d',  pnl: 42100,  stake: 9500  },
  { opp: 'rook_botto',    game: 'CHESS',    result: 'WIN',  score: 'M19',    date: '7d',  pnl: 5600,   stake: 6000  },
];

const PROFILE_PNL = {
  total30d: 147820, total7d: 27040, totalAllTime: 892400,
  avgTicket: 8600, sharpe: 2.41, maxDrawdown: -18400, biggestWin: 42100, biggestLoss: -12800,
  curve30d: [
    4200,9100,12400,8900,15200,22100,28400,31200,26800,35400,
    42100,48300,53900,58200,61400,58100,64200,71800,78400,85100,
    91200,98400,104200,110800,117400,121100,128400,135200,141100,147820,
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

const FEATURED_NOTATION = `# GO 19x19  ·  MATCH #1845  ·  MOVE 127
B[dq];W[pd];B[pp];W[dc];B[ql];W[nq];B[qn];W[fq]
B[ip];W[fo];B[cn];W[cl];B[cp];W[eq];B[dm];W[hq]
B[jd];W[qf];B[no];W[pj];B[qj];W[qi];B[rj];W[qk]
B[pk];W[qh];B[pl];W[oj];B[qe];W[pe];B[pf];W[of]
B[qg];W[rf];B[qd];W[re];B[oe];W[pg]`;

const PROFILE_SOURCE_SNIPPET = `// go.master.v3  ·  48,032 bytes  ·  author @chen
export default function act(state){
  const {board, toMove, history, ko} = state;
  if (history.length < 12) return opening(state);
  const cands = genMoves(board, toMove)
    .filter(m => !isKo(m, ko))
    .map(m => ({m, s: score(board, m, toMove)}));
  cands.sort((a,b) => b.s - a.s);
  const top = cands.slice(0, 8);
  const pick = mcts(board, toMove, top, {sims: 240});
  return pick || cands[0].m;
}`;

// ── Seed mutation ──────────────────────────────────────────────────────────
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // clear existing data
    for (const t of [
      "agents","games","matches","matchStates","highlights",
      "chatMessages","tickerItems","bracketMatches","profileMatches",
      "featured","submissions","wallets",
    ] as const) {
      const rows = await ctx.db.query(t).collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }

    // seed fake users + wallets
    for (const u of COMMUNITY_USERS) {
      const userId = await ctx.db.insert("users", { name: u.name, email: u.email });
      await ctx.db.insert("wallets", { userId, balance: u.balance, totalDeposited: u.balance, totalWithdrawn: 0 });

      // seed approved submissions for each user's community agents
      const userAgents = COMMUNITY_AGENTS.filter(a => a.author === `@${u.handle}`);
      for (const agent of userAgents) {
        await ctx.db.insert("submissions", {
          handle: agent.handle,
          author: u.name,
          game: 'chess',
          glyph: agent.glyph,
          color: agent.color,
          personality: agent.personality,
          bio: agent.bio,
          code: `// ${agent.handle} · ${agent.size}kb\nexport default function act(state) {\n  return null; // community agent\n}`,
          sizeKb: agent.size,
          status: 'approved',
          submittedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
        });
      }
    }

    // seed all agents (pro + community)
    for (const a of ALL_AGENTS) await ctx.db.insert("agents", a);

    // seed games, matches, static content
    for (const g of GAMES) await ctx.db.insert("games", g);
    for (const m of MATCHES) await ctx.db.insert("matches", m);
    for (let i = 0; i < HIGHLIGHTS.length; i++) await ctx.db.insert("highlights", { ...HIGHLIGHTS[i], order: i });
    for (let i = 0; i < CHAT.length; i++) await ctx.db.insert("chatMessages", { ...CHAT[i], order: i });
    for (let i = 0; i < TICKER.length; i++) await ctx.db.insert("tickerItems", { text: TICKER[i], order: i });

    for (const r of BRACKET_ROUNDS) {
      for (let mi = 0; mi < r.matches.length; mi++) {
        const m = r.matches[mi];
        await ctx.db.insert("bracketMatches", {
          round: r.name, roundOrder: r.order, matchOrder: mi,
          a: m.a, b: m.b, score: m.score, winner: m.winner, status: m.status,
        });
      }
    }

    for (let i = 0; i < PROFILE_MATCHES_GO_MASTER.length; i++) {
      await ctx.db.insert("profileMatches", { agentSlug: 'go_master_v3', ...PROFILE_MATCHES_GO_MASTER[i], order: i });
    }

    await ctx.db.insert("featured", { key: "go_stones",     data: FEATURED_GO_STONES });
    await ctx.db.insert("featured", { key: "go_last_move",  data: { x: 10, y: 10, c: 'w' } });
    await ctx.db.insert("featured", { key: "go_hot",        data: [{x:10,y:10},{x:9,y:9},{x:11,y:11}] });
    await ctx.db.insert("featured", { key: "go_notation",   data: FEATURED_NOTATION });
    await ctx.db.insert("featured", { key: "profile_source",data: PROFILE_SOURCE_SNIPPET });
    await ctx.db.insert("featured", { key: "profile_pnl",   data: PROFILE_PNL });
    await ctx.db.insert("featured", { key: "crowd_emoji",   data: ['🔥','👑','💀','😤','🧠','⚡','😱','🎯','👀','🧊','🚫','💥','🗿','🫡','📈','📉'] });

    return {
      seeded: true,
      users: COMMUNITY_USERS.length,
      agents: ALL_AGENTS.length,
      matches: MATCHES.length,
    };
  },
});
