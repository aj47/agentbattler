import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { getInitialBoard } from "../lib/games/index";

export const initMatchState = mutation({
  args: {
    slug: v.string(),
    game: v.union(v.literal("chess"), v.literal("go19"), v.literal("checkers")),
  },
  handler: async (ctx, { slug, game }) => {
    const existing = await ctx.db
      .query("matchStates")
      .withIndex("by_slug", q => q.eq("matchSlug", slug))
      .first();
    if (existing) return existing._id;

    const board = getInitialBoard(game);
    const id = await ctx.db.insert("matchStates", {
      matchSlug: slug,
      game,
      board,
      toMove: "b",
      moveCount: 0,
      notationHistory: [],
      capturesB: 0,
      capturesW: 0,
      winProbB: 0.5,
      phase: "opening",
      lastMoveAt: Date.now(),
    });

    // Kick off the simulation loop on the server
    const delay = game === "go19" ? 2000 : game === "chess" ? 1500 : 1200;
    await ctx.scheduler.runAfter(delay, internal.simulation.tick, { slug });

    return id;
  },
});

export const placeBet = mutation({
  args: {
    matchSlug: v.string(),
    side: v.union(v.literal("a"), v.literal("b")),
    amount: v.number(),
  },
  handler: async (ctx, { matchSlug, side, amount }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to bet");
    if (amount <= 0) throw new Error("Amount must be positive");

    const wallet = await ctx.db.query("wallets").withIndex("by_user", q => q.eq("userId", userId)).first();
    const balance = wallet?.balance ?? 0;
    if (balance < amount) throw new Error("Insufficient balance");

    const state = await ctx.db.query("matchStates").withIndex("by_slug", q => q.eq("matchSlug", matchSlug)).first();
    const winProbA = state ? state.winProbB : 0.5;
    const winProbB = 1 - winProbA;
    const odds = side === "a"
      ? (winProbA > 0 ? parseFloat((1 / winProbA).toFixed(2)) : 2)
      : (winProbB > 0 ? parseFloat((1 / winProbB).toFixed(2)) : 2);

    if (wallet) {
      await ctx.db.patch(wallet._id, { balance: balance - amount });
    } else {
      await ctx.db.insert("wallets", { userId, balance: -amount, totalDeposited: 0, totalWithdrawn: 0 });
    }

    await ctx.db.insert("bets", {
      userId,
      matchSlug,
      side,
      amount,
      odds,
      status: "open",
      placedAt: new Date().toISOString(),
    });
  },
});

export const submitAgent = mutation({
  args: {
    handle: v.string(),
    game: v.union(v.literal("chess"), v.literal("go19"), v.literal("checkers")),
    glyph: v.string(),
    color: v.string(),
    personality: v.string(),
    bio: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to submit");

    const user = await ctx.db.get(userId);
    const author = (user as any)?.name ?? (user as any)?.email?.split("@")[0] ?? "unknown";

    const sizeKb = parseFloat((new TextEncoder().encode(args.code).length / 1024).toFixed(2));
    if (sizeKb > 50) throw new Error("Code exceeds 50kb limit");
    if (!args.handle.trim()) throw new Error("Handle required");

    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_handle_game", q => q.eq("handle", args.handle.trim()).eq("game", args.game))
      .first();
    if (existing) throw new Error(`Already submitted a ${args.game} agent for this handle`);

    return ctx.db.insert("submissions", {
      ...args,
      handle: args.handle.trim(),
      author,
      sizeKb,
      status: "pending",
      submittedAt: new Date().toISOString(),
    });
  },
});

async function getOrCreateWallet(ctx: any, userId: any) {
  const wallet = await ctx.db.query("wallets").withIndex("by_user", (q: any) => q.eq("userId", userId)).first();
  if (wallet) return wallet;
  const id = await ctx.db.insert("wallets", { userId, balance: 0, totalDeposited: 0, totalWithdrawn: 0 });
  return ctx.db.get(id);
}

export const deposit = mutation({
  args: { amount: v.number() },
  handler: async (ctx, { amount }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");
    if (amount <= 0) throw new Error("Amount must be positive");
    const wallet = await getOrCreateWallet(ctx, userId);
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + amount,
      totalDeposited: wallet.totalDeposited + amount,
    });
    return wallet.balance + amount;
  },
});

export const createWagerMatch = mutation({
  args: {
    challengerAgentSlug: v.string(),
    opponentAgentSlug: v.string(),
    game: v.union(v.literal("chess"), v.literal("go19"), v.literal("checkers")),
    stake: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");
    if (args.stake <= 0) throw new Error("Stake must be positive");
    const wallet = await getOrCreateWallet(ctx, userId);
    if (wallet.balance < args.stake) throw new Error("Insufficient balance for stake");
    await ctx.db.patch(wallet._id, { balance: wallet.balance - args.stake });
    return ctx.db.insert("wagerMatches", {
      challengerUserId: userId,
      challengerAgentSlug: args.challengerAgentSlug,
      opponentAgentSlug: args.opponentAgentSlug,
      game: args.game,
      stake: args.stake,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});
