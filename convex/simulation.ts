import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

import { v } from "convex/values";
import { computeNextMove, getInitialBoard } from "../lib/games/index";
import type { GameState } from "../lib/games/index";

// Milliseconds between moves per game type
const MOVE_DELAY: Record<string, number> = {
  go19: 3200,
  chess: 2000,
  checkers: 1600,
};

export const tick = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const state = await ctx.db
      .query("matchStates")
      .withIndex("by_slug", q => q.eq("matchSlug", slug))
      .first();

    if (!state || state.phase === "finished") return;

    const gameState: GameState = {
      game: state.game,
      board: state.board,
      toMove: state.toMove,
      moveCount: state.moveCount,
      capturesB: state.capturesB,
      capturesW: state.capturesW,
      winProbB: state.winProbB,
      phase: state.phase,
      result: state.result,
    };

    const result = computeNextMove(gameState);

    const notationHistory = [
      ...state.notationHistory.slice(-49), // keep last 50
      result.notation,
    ];

    await ctx.db.patch(state._id, {
      board: result.newBoard,
      lastMove: result.move,
      toMove: result.toMove,
      moveCount: state.moveCount + 1,
      notationHistory,
      capturesB: result.capturesB,
      capturesW: result.capturesW,
      winProbB: result.winProbB,
      phase: result.phase,
      result: result.result,
      lastMoveAt: Date.now(),
    });

    // Update the matches table with live stats
    const match = await ctx.db
      .query("matches")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .first();
    if (match) {
      await ctx.db.patch(match._id, {
        move: state.moveCount + 1,
        winProb: result.winProbB,
        phase: result.phase === "finished" ? "finished" : result.phase,
      });
    }

    // When any match finishes: schedule a server-side reset so the arena recycles
    if (result.phase === "finished" && match) {
      // Auto-cycle featured status to the next highest-viewer live match
      if (match.status === "featured") {
        await ctx.db.patch(match._id, { status: "live" });
        const allMatches = await ctx.db.query("matches").collect();
        const next = allMatches
          .filter(m => m._id !== match._id && (m.status === "live" || m.status === "starting"))
          .sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0))[0];
        if (next) await ctx.db.patch(next._id, { status: "featured" });
      }
      // Recycle this match after a short cooldown — runs fully server-side
      await ctx.scheduler.runAfter(30_000, internal.simulation.resetMatch, { slug });
    }

    // Every 5 moves, trigger AI chat reactions (only for featured/high-viewer matches)
    const newMoveCount = state.moveCount + 1;
    if (newMoveCount % 3 === 0 && match && result.phase !== "finished") {
      await ctx.scheduler.runAfter(800, internal.aiChat.generateChatMessages, {
        matchSlug: slug,
        game: state.game,
        agentA: match.a,
        agentB: match.b,
        moveCount: newMoveCount,
        winProbB: result.winProbB,
        phase: result.phase,
        lastMove: result.move ?? undefined,
        capturesB: result.capturesB,
        capturesW: result.capturesW,
      });
    }

    // Schedule next tick unless finished
    if (result.phase !== "finished") {
      const delay = MOVE_DELAY[state.game] ?? 2500;
      await ctx.scheduler.runAfter(delay, internal.simulation.tick, { slug });
    }
  },
});

// Recycle a finished match: wipe state, reset to starting, kick off new simulation
export const resetMatch = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const state = await ctx.db
      .query("matchStates")
      .withIndex("by_slug", q => q.eq("matchSlug", slug))
      .first();
    if (state) await ctx.db.delete(state._id);

    const match = await ctx.db
      .query("matches")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .first();
    if (!match) return;

    const game = match.game as "go19" | "chess" | "checkers";
    const board = getInitialBoard(game);

    // Bump viewers slightly for variety
    const viewersDelta = Math.floor((Math.random() - 0.4) * 200);
    const newViewers = Math.max(50, (match.viewers ?? 500) + viewersDelta);

    await ctx.db.patch(match._id, {
      move: 0,
      phase: "opening",
      winProb: 0.5,
      viewers: newViewers,
      status: match.status === "featured" ? "featured" : "live",
    });

    await ctx.db.insert("matchStates", {
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

    const delay = MOVE_DELAY[game] ?? 2500;
    await ctx.scheduler.runAfter(delay, internal.simulation.tick, { slug });
  },
});

// One-shot: restart up to MAX_ACTIVE finished matches right now
export const restartFinished = internalMutation({
  args: {},
  handler: async (ctx) => {
    const MAX_ACTIVE = 25;
    const allStates = await ctx.db.query("matchStates").collect();
    const activeCount = allStates.filter(s => s.phase !== "finished").length;
    const slots = MAX_ACTIVE - activeCount;
    if (slots <= 0) return { restarted: 0 };

    const finished = allStates.filter(s => s.phase === "finished");
    // Prioritise highest-viewer matches
    const matches = await ctx.db.query("matches").collect();
    const matchMap = new Map(matches.map(m => [m.slug, m]));
    finished.sort((a, b) => (matchMap.get(b.matchSlug)?.viewers ?? 0) - (matchMap.get(a.matchSlug)?.viewers ?? 0));

    let restarted = 0;
    for (const s of finished.slice(0, slots)) {
      await ctx.scheduler.runAfter(restarted * 400, internal.simulation.resetMatch, { slug: s.matchSlug });
      restarted++;
    }
    return { restarted };
  },
});
