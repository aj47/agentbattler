import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { computeNextMove } from "../lib/games/index";
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

    // Schedule next tick unless finished
    if (result.phase !== "finished") {
      const delay = MOVE_DELAY[state.game] ?? 2500;
      await ctx.scheduler.runAfter(delay, internal.simulation.tick, { slug });
    }
  },
});
