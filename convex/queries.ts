import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const allAgents = query({
  args: {},
  handler: async (ctx) => ctx.db.query("agents").collect(),
});

export const agentBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db.query("agents").withIndex("by_slug", q => q.eq("slug", slug)).unique(),
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("agents").collect();
    return rows.sort((a, b) => b.elo - a.elo);
  },
});

export const allGames = query({
  args: {},
  handler: async (ctx) => ctx.db.query("games").collect(),
});

export const allMatches = query({
  args: {},
  handler: async (ctx) => ctx.db.query("matches").collect(),
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
    const r = await ctx.db.query("highlights").collect();
    return r.sort((a, b) => a.order - b.order);
  },
});

export const allChatMessages = query({
  args: {},
  handler: async (ctx) => {
    const r = await ctx.db.query("chatMessages").collect();
    return r.sort((a, b) => a.order - b.order);
  },
});

export const allTicker = query({
  args: {},
  handler: async (ctx) => {
    const r = await ctx.db.query("tickerItems").collect();
    return r.sort((a, b) => a.order - b.order);
  },
});

export const bracket = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("bracketMatches").collect();
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
    const r = await ctx.db.query("profileMatches").withIndex("by_agent", q => q.eq("agentSlug", agentSlug)).collect();
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
    const rows = await ctx.db.query("submissions").collect();
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

export const allMatchStates = query({
  args: {},
  handler: async (ctx) => ctx.db.query("matchStates").collect(),
});

export const bootstrap = query({
  args: {},
  handler: async (ctx) => {
    const [agents, matches, highlights, ticker, leaderboard] = await Promise.all([
      ctx.db.query("agents").collect(),
      ctx.db.query("matches").collect(),
      ctx.db.query("highlights").collect(),
      ctx.db.query("tickerItems").collect(),
      ctx.db.query("agents").collect(),
    ]);
    return {
      agents,
      matches,
      highlights: highlights.sort((a,b)=>a.order-b.order),
      ticker: ticker.sort((a,b)=>a.order-b.order).map(t => t.text),
      leaderboard: [...leaderboard].sort((a, b) => b.elo - a.elo),
    };
  },
});
