import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

import { v } from "convex/values";
import { computeNextMove, getInitialBoard } from "../lib/games/index";
import type { GameState, MoveResult } from "../lib/games/index";
import {
  getChessMoves,
  applyChessMove,
  getChessWinner,
  estimateChessWinProb,
  chessMoveNotation,
  type ChessBoard,
  type ChessMove,
} from "../lib/games/chess";

// Milliseconds between moves — slowed to reduce DB write frequency / bandwidth
const MOVE_DELAY: Record<string, number> = {
  go19: 6000,
  chess: 4000,
  checkers: 3000,
};

async function getActiveMatchStates(ctx: any, limit: number) {
  const [opening, midgame, endgame] = await Promise.all([
    ctx.db.query("matchStates").withIndex("by_phase", (q: any) => q.eq("phase", "opening")).take(limit),
    ctx.db.query("matchStates").withIndex("by_phase", (q: any) => q.eq("phase", "midgame")).take(limit),
    ctx.db.query("matchStates").withIndex("by_phase", (q: any) => q.eq("phase", "endgame")).take(limit),
  ]);
  return [...opening, ...midgame, ...endgame].slice(0, limit);
}

async function getActiveMatchStateCount(ctx: any, limit: number) {
  return (await getActiveMatchStates(ctx, limit)).length;
}

// Shared bet-settlement used both from finalizeMove (inline) and from the
// settleBets internal mutation. Refunds on draw, pays winners on odds, marks
// losers lost. Safe to call multiple times — only touches open bets.
async function settleBetsForSlug(
  ctx: any,
  slug: string,
  winner: "b" | "w" | "draw",
) {
  const bets = await ctx.db
    .query("bets")
    .withIndex("by_match_and_status", (q: any) => q.eq("matchSlug", slug).eq("status", "open"))
    .collect();
  for (const bet of bets) {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q: any) => q.eq("userId", bet.userId))
      .first();
    if (winner === "draw") {
      if (wallet) await ctx.db.patch(wallet._id, { balance: wallet.balance + bet.amount });
      await ctx.db.patch(bet._id, { status: "void", payout: bet.amount });
      continue;
    }
    const winningSide: "a" | "b" = winner === "b" ? "a" : "b";
    if (bet.side === winningSide) {
      const payout = parseFloat((bet.amount * bet.odds).toFixed(2));
      if (wallet) await ctx.db.patch(wallet._id, { balance: wallet.balance + payout });
      await ctx.db.patch(bet._id, { status: "won", payout });
    } else {
      await ctx.db.patch(bet._id, { status: "lost", payout: 0 });
    }
  }
}

// Shared post-move pipeline: patches match state, updates matches row, schedules
// settlement + chat + next tick. Extracted so heuristic ticks and agent ticks
// share identical bookkeeping.
async function finalizeMove(
  ctx: any,
  stateId: any,
  state: any,
  result: MoveResult,
  slug: string,
) {
  const notationHistory = [
    ...state.notationHistory.slice(-49),
    result.notation,
  ];

  await ctx.db.patch(stateId, {
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

  const match = await ctx.db
    .query("matches")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .first();
  if (match) {
    await ctx.db.patch(match._id, {
      move: state.moveCount + 1,
      winProb: result.winProbB,
      phase: result.phase === "finished" ? "finished" : result.phase,
    });
  }

  if (result.phase === "finished" && match) {
    if (result.result) {
      // Settle inline so bets always close at the same moment the match does,
      // avoiding a race where the scheduled run is dropped or the match is
      // recycled before settlement fires.
      await settleBetsForSlug(ctx, slug, result.result);
    }
    if (match.status === "featured") {
      await ctx.db.patch(match._id, { status: "live" });
      const topMatches = await ctx.db.query("matches").withIndex("by_viewers").order("desc").take(40);
      const next = topMatches.find(
        (m: any) => m._id !== match._id && (m.status === "live" || m.status === "starting")
      );
      if (next) await ctx.db.patch(next._id, { status: "featured" });
    }
    await ctx.scheduler.runAfter(30_000, internal.simulation.resetMatch, { slug });
  }

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

  if (result.phase !== "finished") {
    const delay = MOVE_DELAY[state.game] ?? 2500;
    await ctx.scheduler.runAfter(delay, internal.simulation.tick, { slug });
  }
}

// Read a submission — used by the approval action in engine.ts.
export const getSubmission = internalQuery({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, { submissionId }) => ctx.db.get(submissionId),
});

// Promote an approved, smoke-tested submission into the agents table. Only
// called by engine.approveAgent after the smoke test passes.
export const finalizeApproval = internalMutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, { submissionId }) => {
    const sub = await ctx.db.get(submissionId);
    if (!sub) throw new Error("Submission not found");
    if (sub.status === "approved") throw new Error("Already approved");

    const slug = `${sub.handle}-${sub.game}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        code: sub.code,
        submissionGame: sub.game,
        glyph: sub.glyph,
        color: sub.color,
        personality: sub.personality,
        bio: sub.bio,
      });
    } else {
      await ctx.db.insert("agents", {
        slug,
        handle: sub.handle,
        author: sub.author,
        elo: 2300,
        wins: 0,
        loss: 0,
        size: sub.sizeKb,
        glyph: sub.glyph,
        color: sub.color,
        personality: sub.personality,
        streak: 0,
        hot: false,
        bio: sub.bio,
        code: sub.code,
        submissionGame: sub.game,
      });
    }

    await ctx.db.patch(submissionId, { status: "approved" });
    return { slug };
  },
});

// Used by the engine Node action to read current match state + whose code to execute.
export const getTickContext = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const state = await ctx.db
      .query("matchStates")
      .withIndex("by_slug", q => q.eq("matchSlug", slug))
      .first();
    if (!state) return null;
    const match = await ctx.db
      .query("matches")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .first();
    if (!match) return null;

    const agentA = await ctx.db
      .query("agents")
      .withIndex("by_slug", q => q.eq("slug", match.a))
      .first();
    const agentB = await ctx.db
      .query("agents")
      .withIndex("by_slug", q => q.eq("slug", match.b))
      .first();

    return {
      board: state.board,
      toMove: state.toMove,
      moveCount: state.moveCount,
      history: state.notationHistory,
      game: state.game,
      phase: state.phase,
      currentCode: state.toMove === "b" ? agentA?.code : agentB?.code,
    };
  },
});

export const tick = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const state = await ctx.db
      .query("matchStates")
      .withIndex("by_slug", q => q.eq("matchSlug", slug))
      .first();

    if (!state || state.phase === "finished") return;

    // If the player on the move is a submitted agent with source code, delegate
    // the move computation to the Node-runtime engine action. It'll evaluate
    // the agent in a vm sandbox with a hard timeout and call applyAgentMove
    // with the result (or null to fall back to the heuristic).
    if (state.game === "chess") {
      const match = await ctx.db
        .query("matches")
        .withIndex("by_slug", q => q.eq("slug", slug))
        .first();
      if (match) {
        const currentSlug = state.toMove === "b" ? match.a : match.b;
        const agent = await ctx.db
          .query("agents")
          .withIndex("by_slug", q => q.eq("slug", currentSlug))
          .first();
        if (agent?.code) {
          await ctx.scheduler.runAfter(0, internal.engine.computeAgentMove, { slug });
          return;
        }
      }
    }

    // Heuristic path (default for seeded agents and non-chess games).
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
    await finalizeMove(ctx, state._id, state, result, slug);
  },
});

// Apply the move an agent returned via the engine action. If chosenUci is null
// or invalid, fall back to the heuristic move so the match never stalls.
export const applyAgentMove = internalMutation({
  args: {
    slug: v.string(),
    chosenUci: v.union(v.string(), v.null()),
    // When true, the current player forfeits if the engine couldn't produce a
    // legal move (throw, timeout, illegal UCI). Matches bench-runner behavior.
    forfeit: v.optional(v.boolean()),
  },
  handler: async (ctx, { slug, chosenUci, forfeit }) => {
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

    let result: MoveResult | null = null;

    if (state.game === "chess" && chosenUci) {
      const board = state.board as ChessBoard;
      const color: "w" | "b" = state.toMove === "b" ? "b" : "w";
      const legal = getChessMoves(board, color);
      const move = parseUciToChessMove(chosenUci, legal);
      if (move) {
        result = applyChessResult(board, move, state, color);
      }
    }

    if (!result && forfeit) {
      // Current player failed to move → opponent wins by forfeit.
      const winner: "b" | "w" = state.toMove === "b" ? "w" : "b";
      result = {
        newBoard: state.board,
        move: null,
        toMove: state.toMove === "b" ? "w" : "b",
        capturesB: state.capturesB,
        capturesW: state.capturesW,
        winProbB: winner === "b" ? 1 : 0,
        phase: "finished",
        result: winner,
        notation: winner === "b" ? "0-1 (forfeit)" : "1-0 (forfeit)",
      };
    }

    if (!result) result = computeNextMove(gameState);
    await finalizeMove(ctx, state._id, state, result, slug);
  },
});

const FILES = "abcdefgh";
function moveToUci(m: ChessMove): string {
  const from = `${FILES[m.fc]}${8 - m.fr}`;
  const to = `${FILES[m.tc]}${8 - m.tr}`;
  return `${from}${to}${m.promo ? m.promo.toLowerCase() : ""}`;
}
function parseUciToChessMove(uci: string, legal: ChessMove[]): ChessMove | null {
  const cleaned = uci.trim().toLowerCase().replace(/[^a-h1-8qrbn]/g, "");
  if (cleaned.length < 4) return null;
  for (const m of legal) if (moveToUci(m) === cleaned) return m;
  const head = cleaned.slice(0, 4);
  for (const m of legal) if (moveToUci(m).startsWith(head)) return m;
  return null;
}

function applyChessResult(
  board: ChessBoard,
  move: ChessMove,
  state: any,
  color: "w" | "b",
): MoveResult {
  const nextTurn: "b" | "w" = state.toMove === "b" ? "w" : "b";
  const notation = chessMoveNotation(board, move);
  const capturedPiece = board[move.tr][move.tc];
  const newBoard = applyChessMove(board, move);
  const winner = getChessWinner(newBoard);
  const winProb = estimateChessWinProb(newBoard);
  const moveCount = state.moveCount;
  const phase: GameState["phase"] =
    moveCount < 20 ? "opening" : moveCount < 60 ? "midgame" : "endgame";
  const matVal: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, P: 1, N: 3, B: 3, R: 5, Q: 9 };
  const capVal = capturedPiece ? (matVal[capturedPiece] ?? 0) : 0;
  const capturesB = state.capturesB + (color === "b" ? capVal : 0);
  const capturesW = state.capturesW + (color === "w" ? capVal : 0);
  return {
    newBoard,
    move,
    toMove: nextTurn,
    capturesB,
    capturesW,
    winProbB: winner === "b" ? 1 : winner === "w" ? 0 : winProb,
    phase: winner ? "finished" : phase,
    result: winner ?? undefined,
    notation,
  };
}

// Recycle a finished match: wipe state, reset to starting, kick off new simulation
export const resetMatch = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const state = await ctx.db
      .query("matchStates")
      .withIndex("by_slug", q => q.eq("matchSlug", slug))
      .first();
    // Before wiping state, make sure no bets from the previous round are stuck
    // open (shouldn't happen if finalizeMove settled correctly, but this is
    // the last chance — after delete there's no result to settle against).
    if (state && state.phase === "finished" && state.result) {
      await settleBetsForSlug(ctx, slug, state.result);
    } else {
      const stragglers = await ctx.db
        .query("bets")
        .withIndex("by_match", q => q.eq("matchSlug", slug))
        .collect();
      for (const bet of stragglers.filter(b => b.status === "open")) {
        const wallet = await ctx.db
          .query("wallets")
          .withIndex("by_user", q => q.eq("userId", bet.userId))
          .first();
        if (wallet) await ctx.db.patch(wallet._id, { balance: wallet.balance + bet.amount });
        await ctx.db.patch(bet._id, { status: "void", payout: bet.amount });
      }
    }

    if (state) await ctx.db.delete(state._id);

    const match = await ctx.db
      .query("matches")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .first();
    if (!match) return;

    const game = match.game as "go19" | "chess" | "checkers";
    const board = getInitialBoard(game);

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

export const bootstrapSimulations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const MAX_ACTIVE = 10;
    const activeCount = await getActiveMatchStateCount(ctx, MAX_ACTIVE);
    const slots = MAX_ACTIVE - activeCount;
    if (slots <= 0) return { started: 0 };

    const matches = await ctx.db.query("matches").withIndex("by_viewers").order("desc").take(MAX_ACTIVE * 4);

    let started = 0;
    for (const match of matches) {
      if (started >= slots) break;
      const alreadyHasState = await ctx.db
        .query("matchStates")
        .withIndex("by_slug", (q: any) => q.eq("matchSlug", match.slug))
        .first();
      if (alreadyHasState) continue;

      const game = match.game as "go19" | "chess" | "checkers";
      const board = getInitialBoard(game);
      await ctx.db.insert("matchStates", {
        matchSlug: match.slug,
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
      const delay = (MOVE_DELAY[game] ?? 2500) + started * 600;
      await ctx.scheduler.runAfter(delay, internal.simulation.tick, { slug: match.slug });
      started++;
    }
    return { started };
  },
});

export const restartFinished = internalMutation({
  args: {},
  handler: async (ctx) => {
    const MAX_ACTIVE = 10;
    const activeCount = await getActiveMatchStateCount(ctx, MAX_ACTIVE);
    const slots = MAX_ACTIVE - activeCount;
    if (slots <= 0) return { restarted: 0 };

    const finished = await ctx.db
      .query("matchStates")
      .withIndex("by_phase", q => q.eq("phase", "finished"))
      .take(slots * 4);
    const finishedWithViewers = await Promise.all(
      finished.map(async state => {
        const match = await ctx.db
          .query("matches")
          .withIndex("by_slug", q => q.eq("slug", state.matchSlug))
          .first();
        return { state, viewers: match?.viewers ?? 0 };
      })
    );
    finishedWithViewers.sort((a, b) => b.viewers - a.viewers);

    let restarted = 0;
    for (const { state } of finishedWithViewers.slice(0, slots)) {
      await ctx.scheduler.runAfter(restarted * 400, internal.simulation.resetMatch, { slug: state.matchSlug });
      restarted++;
    }
    return { restarted };
  },
});

// Backfill: scan every open bet and settle it based on current state.
// - If the match's matchState is "finished" with a result → settle by winner.
// - If the match has no matchState (dead match, never simulated) → refund.
// Runs manually: `npx convex run simulation:settleAllOpenBets`
export const settleAllOpenBets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const openBets = await ctx.db
      .query("bets")
      .withIndex("by_status", q => q.eq("status", "open"))
      .collect();

    let settled = 0;
    let refunded = 0;

    const bySlug = new Map<string, typeof openBets>();
    for (const bet of openBets) {
      const list = bySlug.get(bet.matchSlug) ?? [];
      list.push(bet);
      bySlug.set(bet.matchSlug, list);
    }

    for (const [slug, bets] of bySlug) {
      const state = await ctx.db
        .query("matchStates")
        .withIndex("by_slug", q => q.eq("matchSlug", slug))
        .first();

      const winner: "b" | "w" | "draw" | null =
        state && state.phase === "finished" && state.result ? state.result : null;

      for (const bet of bets) {
        const wallet = await ctx.db
          .query("wallets")
          .withIndex("by_user", q => q.eq("userId", bet.userId))
          .first();

        if (!winner) {
          // Refund stale bet on a dead or unfinished match.
          if (wallet) await ctx.db.patch(wallet._id, { balance: wallet.balance + bet.amount });
          await ctx.db.patch(bet._id, { status: "void", payout: bet.amount });
          refunded++;
          continue;
        }

        if (winner === "draw") {
          if (wallet) await ctx.db.patch(wallet._id, { balance: wallet.balance + bet.amount });
          await ctx.db.patch(bet._id, { status: "void", payout: bet.amount });
          refunded++;
        } else {
          const winningSide: "a" | "b" = winner === "b" ? "a" : "b";
          if (bet.side === winningSide) {
            const payout = parseFloat((bet.amount * bet.odds).toFixed(2));
            if (wallet) await ctx.db.patch(wallet._id, { balance: wallet.balance + payout });
            await ctx.db.patch(bet._id, { status: "won", payout });
          } else {
            await ctx.db.patch(bet._id, { status: "lost", payout: 0 });
          }
          settled++;
        }
      }
    }

    return { settled, refunded, total: openBets.length };
  },
});

export const settleBets = internalMutation({
  args: { slug: v.string(), winner: v.union(v.literal("b"), v.literal("w"), v.literal("draw")) },
  handler: async (ctx, { slug, winner }) => {
    await settleBetsForSlug(ctx, slug, winner);
  },
});
