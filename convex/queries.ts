import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

function matchNumberValue(slug: string) {
  const value = Number.parseInt(slug.match(/[0-9]+/)?.[0] ?? "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function byMatchNumberDesc<T extends { slug: string }>(a: T, b: T) {
  return matchNumberValue(b.slug) - matchNumberValue(a.slug);
}

async function activeMatchStates(ctx: any, limit = 100) {
  const [opening, midgame, endgame] = await Promise.all([
    ctx.db.query("matchStates").withIndex("by_phase", (q: any) => q.eq("phase", "opening")).take(limit),
    ctx.db.query("matchStates").withIndex("by_phase", (q: any) => q.eq("phase", "midgame")).take(limit),
    ctx.db.query("matchStates").withIndex("by_phase", (q: any) => q.eq("phase", "endgame")).take(limit),
  ]);
  return [...opening, ...midgame, ...endgame].slice(0, limit);
}

export const allAgents = query({
  args: {},
  handler: async (ctx) => ctx.db.query("agents").take(200),
});

export const agentBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db.query("agents").withIndex("by_slug", q => q.eq("slug", slug)).unique(),
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").withIndex("by_elo").order("desc").take(200);
  },
});

export const allGames = query({
  args: {},
  handler: async (ctx) => ctx.db.query("games").take(20),
});

export const allMatches = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("matches").take(500)).sort(byMatchNumberDesc),
});

export const matchBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db.query("matches").withIndex("by_slug", q => q.eq("slug", slug)).unique(),
});

export const featuredMatch = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("matches").withIndex("by_status", q => q.eq("status", "featured")).first(),
});

export const allHighlights = query({
  args: {},
  handler: async (ctx) => {
    const r = await ctx.db.query("highlights").take(50);
    return r.sort((a, b) => a.order - b.order);
  },
});

export const allChatMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chatMessages").withIndex("by_order").order("asc").take(60);
  },
});

export const allTicker = query({
  args: {},
  handler: async (ctx) => {
    const r = await ctx.db.query("tickerItems").take(50);
    return r.sort((a, b) => a.order - b.order);
  },
});

export const bracket = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("bracketMatches").take(64);
    all.sort((a, b) => a.roundOrder - b.roundOrder || a.matchOrder - b.matchOrder);
    const rounds: { name: string; order: number; matches: typeof all }[] = [];
    for (const m of all) {
      let r = rounds.find(r => r.name === m.round);
      if (!r) { r = { name: m.round, order: m.roundOrder, matches: [] }; rounds.push(r); }
      r.matches.push(m);
    }
    return rounds;
  },
});

export const profileMatches = query({
  args: { agentSlug: v.string() },
  handler: async (ctx, { agentSlug }) => {
    const r = await ctx.db.query("profileMatches").withIndex("by_agent", q => q.eq("agentSlug", agentSlug)).take(50);
    return r.sort((a, b) => a.order - b.order);
  },
});

export const featuredData = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const r = await ctx.db.query("featured").withIndex("by_key", q => q.eq("key", key)).first();
    return r?.data ?? null;
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const wallet = await ctx.db.query("wallets").withIndex("by_user", q => q.eq("userId", userId)).first();
    return { ...user, balance: wallet?.balance ?? 0 };
  },
});

export const myBets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const bets = await ctx.db.query("bets").withIndex("by_user", q => q.eq("userId", userId)).collect();
    return bets.sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  },
});

export const allSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("submissions").take(200);
    return rows.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },
});

export const matchState = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("matchStates")
      .withIndex("by_slug", q => q.eq("matchSlug", slug))
      .first(),
});

// Targeted query — only fetch states for slugs the client actually renders
export const matchStatesBySlugs = query({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, { slugs }) => {
    const results = await Promise.all(
      slugs.map(slug =>
        ctx.db.query("matchStates").withIndex("by_slug", q => q.eq("matchSlug", slug)).first()
      )
    );
    return results.filter(Boolean);
  },
});

// Kept for internal/admin use only — avoid subscribing from clients
export const allMatchStates = query({
  args: {},
  handler: async (ctx) => ctx.db.query("matchStates").take(50),
});

export const matchCounts = query({
  args: {},
  handler: async (ctx) => {
    const [matches, activeStates] = await Promise.all([
      ctx.db.query("matches").take(500),
      activeMatchStates(ctx, 100),
    ]);
    return {
      live: activeStates.length,
      starting: matches.filter(m => m.status === "starting").length,
      total: matches.length,
    };
  },
});

// Top N matches by real match number — avoids sending all 500 to the client
export const topMatches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const matches = await ctx.db.query("matches").take(500);
    return matches.sort(byMatchNumberDesc).slice(0, Math.max(1, Math.min(limit ?? 50, 100)));
  },
});

export const lobbyData = query({
  args: {},
  handler: async (ctx) => {
    const [agents, matches, activeStates] = await Promise.all([
      ctx.db.query("agents").take(200),
      ctx.db.query("matches").take(500),
      activeMatchStates(ctx, 100),
    ]);
    const activeSlugs = new Set(activeStates.map(state => state.matchSlug));

    return {
      agents,
      matches: matches
        .sort((a, b) => {
          const activeDelta = Number(activeSlugs.has(b.slug)) - Number(activeSlugs.has(a.slug));
          if (activeDelta !== 0) return activeDelta;
          const featuredDelta = Number(b.status === "featured") - Number(a.status === "featured");
          if (featuredDelta !== 0) return featuredDelta;
          return byMatchNumberDesc(a, b);
        })
        .slice(0, 50),
      activeMatchCount: activeStates.length,
      activeMatchSlugs: activeStates.map(state => state.matchSlug),
      leaderboard: [...agents].sort((a, b) => b.elo - a.elo),
    };
  },
});

export const agentProfileData = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const [agent, leaderboard, matches, pnlData] = await Promise.all([
      ctx.db.query("agents").withIndex("by_slug", q => q.eq("slug", slug)).unique(),
      ctx.db.query("agents").withIndex("by_elo").order("desc").take(200),
      ctx.db.query("profileMatches").withIndex("by_agent", q => q.eq("agentSlug", slug)).take(50),
      ctx.db.query("featured").withIndex("by_key", q => q.eq("key", "profile_pnl")).first(),
    ]);

    const opponentSlugs = Array.from(new Set(matches.map(m => m.opp)));
    const opponents = await Promise.all(
      opponentSlugs.map(opp =>
        ctx.db.query("agents").withIndex("by_slug", q => q.eq("slug", opp)).unique()
      )
    );
    const opponentBySlug = new Map(
      opponents.filter(opponent => opponent !== null).map(opponent => [opponent.slug, opponent])
    );

    return {
      agent,
      rank: agent ? leaderboard.findIndex(a => a.slug === agent.slug) + 1 : 0,
      matches: matches
        .sort((a, b) => a.order - b.order)
        .map(match => ({ ...match, opponent: opponentBySlug.get(match.opp) ?? null })),
      pnl: pnlData?.data ?? null,
    };
  },
});

export const matchesIndex = query({
  args: {},
  handler: async (ctx) => {
    const [matches, activeStates] = await Promise.all([
      ctx.db.query("matches").take(500),
      activeMatchStates(ctx, 100),
    ]);
    const activeSlugs = new Set(activeStates.map(state => state.matchSlug));
    const sortedMatches = matches.sort((a, b) => {
      const activeDelta = Number(activeSlugs.has(b.slug)) - Number(activeSlugs.has(a.slug));
      return activeDelta !== 0 ? activeDelta : byMatchNumberDesc(a, b);
    });
    return {
      matches: sortedMatches,
      counts: {
        live: activeStates.length,
        starting: matches.filter(m => m.status === "starting").length,
        total: matches.length,
      },
    };
  },
});

export const matchBets = query({
  args: { matchSlug: v.string() },
  handler: async (ctx, { matchSlug }) => {
    const bets = await ctx.db.query("bets").withIndex("by_match", q => q.eq("matchSlug", matchSlug)).take(500);
    const poolA = bets.filter(b => b.side === "a").reduce((s, b) => s + b.amount, 0);
    const poolB = bets.filter(b => b.side === "b").reduce((s, b) => s + b.amount, 0);
    const userId = await getAuthUserId(ctx);
    const myBets = userId ? bets.filter(b => b.userId === userId) : [];
    return { poolA, poolB, total: poolA + poolB, count: bets.length, myBets };
  },
});

export const arenaData = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const [match, state, emojiData] = await Promise.all([
      ctx.db.query("matches").withIndex("by_slug", q => q.eq("slug", slug)).unique(),
      ctx.db.query("matchStates").withIndex("by_slug", q => q.eq("matchSlug", slug)).first(),
      ctx.db.query("featured").withIndex("by_key", q => q.eq("key", "crowd_emoji")).first(),
    ]);

    const [agentA, agentB] = match
      ? await Promise.all([
          ctx.db.query("agents").withIndex("by_slug", q => q.eq("slug", match.a)).unique(),
          ctx.db.query("agents").withIndex("by_slug", q => q.eq("slug", match.b)).unique(),
        ])
      : [null, null];

    const bets = await ctx.db.query("bets").withIndex("by_match", q => q.eq("matchSlug", slug)).take(500);
    const poolA = bets.filter(b => b.side === "a").reduce((sum, bet) => sum + bet.amount, 0);
    const poolB = bets.filter(b => b.side === "b").reduce((sum, bet) => sum + bet.amount, 0);

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const wallet = userId
      ? await ctx.db.query("wallets").withIndex("by_user", q => q.eq("userId", userId)).first()
      : null;
    const myBets = userId ? bets.filter(b => b.userId === userId) : [];

    return {
      match,
      agentA,
      agentB,
      state,
      emojis: emojiData?.data ?? [],
      currentUser: user ? { ...user, balance: wallet?.balance ?? 0 } : null,
      bets: { poolA, poolB, total: poolA + poolB, count: bets.length, myBets },
    };
  },
});

export const bootstrap = query({
  args: {},
  handler: async (ctx) => {
    const [agents, matches, highlights, ticker, leaderboard] = await Promise.all([
      ctx.db.query("agents").take(200),
      ctx.db.query("matches").take(500),
      ctx.db.query("highlights").take(50),
      ctx.db.query("tickerItems").take(50),
      ctx.db.query("agents").withIndex("by_elo").order("desc").take(200),
    ]);
    return {
      agents,
      matches: matches.sort(byMatchNumberDesc).slice(0, 100),
      highlights: highlights.sort((a,b)=>a.order-b.order),
      ticker: ticker.sort((a,b)=>a.order-b.order).map(t => t.text),
      leaderboard: [...leaderboard].sort((a, b) => b.elo - a.elo),
    };
  },
});
