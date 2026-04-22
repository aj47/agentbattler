import type { Agent } from "../../lib/types";

export type GameSlug = "chess" | "go19" | "checkers";
export type FilterGame = "all" | GameSlug;

export type PerGameStats = {
  games: number;
  wins: number;
  loss: number;
  wr: number;
  elo: number;
};

export type EnrichedAgent = Agent & {
  tier: "pro" | "community";
  main: GameSlug;
  perGame: Record<GameSlug, PerGameStats>;
  hist: number[];
  form: (-1 | 0 | 1)[];
  avgMoveMs: number;
  totalGames: number;
  globalWR: number;
  earnings: number;
  earn7d: number;
  staked: number;
};

export const GAMES_LIST: { slug: FilterGame; name: string; short: string }[] = [
  { slug: "all", name: "ALL GAMES", short: "ALL" },
  { slug: "chess", name: "CHESS", short: "CHESS" },
  { slug: "go19", name: "GO 19×19", short: "GO19" },
  { slug: "checkers", name: "CHECKERS", short: "CHKR" },
];

const GAMES: GameSlug[] = ["chess", "go19", "checkers"];

const PRO_SLUGS = new Set([
  "knight_gpt", "glorp_9", "quiet_storm", "MEGA_BRAIN", "tofu_tactics",
  "baron_bluff", "rook_botto", "go_master_v3", "stone_singer",
  "king_me_v2", "checkmate42", "null_pointer",
]);

// Heuristic: every pro agent's "main" game from the design's seed.
const MAIN_OVERRIDE: Record<string, GameSlug> = {
  go_master_v3: "go19", stone_singer: "go19", king_me_v2: "checkers",
  mina_zen: "go19", chen_flood: "go19", chen_ko: "go19",
  rafi_invasion: "go19", rafi_micro: "go19", lou_patience: "checkers",
  kodama_spirit: "go19", kodama_sente: "go19", buzz_engine: "checkers",
  nyx_void: "go19", torque_spin: "go19", torque_v2: "go19",
  sato_wall: "checkers", mina_open: "chess", hex_one: "checkers",
};

function prng(seed: number) {
  let s = seed | 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) / 0xffffffff);
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickMain(slug: string, glyph: string): GameSlug {
  if (MAIN_OVERRIDE[slug]) return MAIN_OVERRIDE[slug];
  // Glyph-based heuristic for everything else
  if (slug.includes("go") || slug.includes("stone") || slug.includes("ko") || slug.includes("kodama")) return "go19";
  if (slug.includes("checker") || slug.includes("king")) return "checkers";
  if (glyph === "●" || glyph === "○" || glyph === "◐" || glyph === "◑") return "go19";
  return "chess";
}

export function enrichAgent(a: Agent): EnrichedAgent {
  const tier: "pro" | "community" = PRO_SLUGS.has(a.slug) ? "pro" : "community";
  const main = pickMain(a.slug, a.glyph);
  const rand = prng(hashStr(a.slug));
  const totalGames = a.wins + a.loss;
  const globalWR = totalGames > 0 ? a.wins / totalGames : 0;

  const weights = GAMES.map(g =>
    g === main ? 0.55 + rand() * 0.25 : 0.05 + rand() * 0.2,
  );
  const sum = weights.reduce((x, y) => x + y, 0);
  const shares = weights.map(w => w / sum);

  const perGame = {} as Record<GameSlug, PerGameStats>;
  GAMES.forEach((g, i) => {
    const games = Math.max(3, Math.round(totalGames * shares[i]));
    const wrBias = g === main ? 0.08 : -0.08 + (rand() - 0.5) * 0.18;
    const wr = Math.max(0.2, Math.min(0.92, globalWR + wrBias));
    const wins = Math.round(games * wr);
    const loss = games - wins;
    perGame[g] = {
      games, wins, loss, wr,
      elo: Math.round(a.elo + (g === main ? 30 : -80) + (rand() - 0.5) * 120),
    };
  });

  const hist: number[] = [];
  let cur = a.elo - (a.streak > 0 ? 120 + rand() * 80 : a.streak < 0 ? -80 - rand() * 60 : 0);
  for (let i = 0; i < 30; i++) {
    const drift = (a.elo - cur) * 0.08;
    const noise = (rand() - 0.5) * 28;
    cur = cur + drift + noise;
    hist.push(Math.round(cur));
  }
  hist[hist.length - 1] = a.elo;

  const form: (-1 | 0 | 1)[] = [];
  const streakAbs = Math.abs(a.streak);
  for (let i = 0; i < 10; i++) {
    if (i < streakAbs) form.push(a.streak > 0 ? 1 : -1);
    else form.push(rand() < globalWR ? 1 : rand() < 0.1 ? 0 : -1);
  }
  form.reverse();

  const avgMoveMs = Math.round(40 + a.size * 12 + rand() * 400);

  const eloBias = (a.elo - 1800) / 1100;
  const baseEarn = a.wins * (tier === "pro" ? 320 : 180);
  const bonus = eloBias * eloBias * 180000 * (tier === "pro" ? 1 : 0.55);
  const earnings = Math.round(baseEarn + bonus + (a.hot ? 40000 : 0) + rand() * 12000);
  const earn7d = Math.round(
    (a.streak > 0 ? a.streak * 1800 : a.streak * 1200) + (rand() - 0.4) * 8000,
  );
  const staked = Math.round(earnings * (0.04 + rand() * 0.08));

  return {
    ...a,
    tier, main, perGame, hist, form, avgMoveMs,
    totalGames, globalWR, earnings, earn7d, staked,
  };
}
