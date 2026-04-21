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

    // Auto-cycle featured match when game finishes
    if (result.phase === "finished" && match?.status === "featured") {
      await ctx.db.patch(match._id, { status: "live" });
      const allMatches = await ctx.db.query("matches").collect();
      const next = allMatches
        .filter(m => m._id !== match._id && (m.status === "live" || m.status === "starting"))
        .sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0))[0];
      if (next) {
        await ctx.db.patch(next._id, { status: "featured" });
        const nextState = await ctx.db
          .query("matchStates")
          .withIndex("by_slug", q => q.eq("matchSlug", next.slug))
          .first();
        if (!nextState) {
          const board = getInitialBoard(next.game as "go19" | "chess" | "checkers");
          await ctx.db.insert("matchStates", {
            matchSlug: next.slug,
            game: next.game as "go19" | "chess" | "checkers",
            board,
            toMove: "b" as const,
            moveCount: 0,
            notationHistory: [],
            capturesB: 0,
            capturesW: 0,
            winProbB: 0.5,
            phase: "opening" as const,
            lastMoveAt: Date.now(),
          });
          const delay = MOVE_DELAY[next.game] ?? 2500;
          await ctx.scheduler.runAfter(delay, internal.simulation.tick, { slug: next.slug });
        }
      }
    }

    // Every 5 moves, trigger AI chat reactions (only for featured/high-viewer matches)
    const newMoveCount = state.moveCount + 1;
    if (newMoveCount % 5 === 0 && match && result.phase !== "finished") {
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
