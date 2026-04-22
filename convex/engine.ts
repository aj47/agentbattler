"use node";

// Executes submitted agent code against live match state.
// Runs in Node runtime so we can use the `vm` module for sandboxed execution
// with a hard timeout. The action chains back into a mutation that applies
// the chosen move (or falls back to the heuristic if execution failed).

import { v } from "convex/values";
import vm from "node:vm";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getChessMoves,
  boardToFen,
  INITIAL_CHESS_BOARD,
  type ChessBoard,
  type ChessMove,
} from "../lib/games/chess";

const MOVE_TIMEOUT_MS = 200;
const FILES = "abcdefgh";

// UCI move string ⇔ ChessMove conversion.
function moveToUci(m: ChessMove): string {
  const from = `${FILES[m.fc]}${8 - m.fr}`;
  const to = `${FILES[m.tc]}${8 - m.tr}`;
  return `${from}${to}${m.promo ? m.promo.toLowerCase() : ""}`;
}

function uciToMove(uci: string, legal: ChessMove[]): ChessMove | null {
  if (typeof uci !== "string") return null;
  const cleaned = uci.trim().toLowerCase().replace(/[^a-h1-8qrbn]/g, "");
  if (cleaned.length < 4) return null;
  for (const m of legal) {
    if (moveToUci(m) === cleaned) return m;
  }
  // Accept 4-char input even if legal move has no promo flag set
  const head = cleaned.slice(0, 4);
  for (const m of legal) {
    if (moveToUci(m).startsWith(head)) return m;
  }
  return null;
}

// Convex runs the default JS runtime as V8 isolates that cannot use `vm`.
// We bundle agent source into a module-like wrapper and execute with a
// timeout. The sandbox exposes only Math and safe primitives.
function runAgent(code: string, state: unknown): unknown {
  const wrapper = `
    (function(state) {
      var module = { exports: {} };
      var exports = module.exports;
      var __agent_default;
      var __export_default = function(v) { __agent_default = v; };
      // Rewrite "export default X" → "__export_default(X)" via the shim below.
      ${code.replace(/export\s+default\s+/g, "__agent_default = ")}
      var fn = __agent_default ?? module.exports?.default ?? module.exports;
      if (typeof fn !== "function") throw new Error("No default-exported function");
      return fn(state);
    })(__state)
  `;

  const sandbox: Record<string, unknown> = {
    __state: state,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    Date,
    console: { log: () => {}, error: () => {}, warn: () => {} },
  };
  const context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
  const script = new vm.Script(wrapper, { filename: "agent.js" });
  return script.runInContext(context, { timeout: MOVE_TIMEOUT_MS, breakOnSigint: true });
}

export const computeAgentMove = internalAction({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const tickCtx = await ctx.runQuery(internal.simulation.getTickContext, { slug });
    if (!tickCtx || tickCtx.phase === "finished") return;

    // Only chess supports submitted-agent execution for now. Other games fall
    // back to heuristic via applyAgentMove with chosenUci=null.
    if (tickCtx.game !== "chess" || !tickCtx.currentCode) {
      await ctx.runMutation(internal.simulation.applyAgentMove, { slug, chosenUci: null });
      return;
    }

    const board = tickCtx.board as ChessBoard;
    const color: "w" | "b" = tickCtx.toMove === "b" ? "b" : "w";
    const legal = getChessMoves(board, color);
    if (legal.length === 0) {
      await ctx.runMutation(internal.simulation.applyAgentMove, { slug, chosenUci: null });
      return;
    }

    const agentState = {
      board: boardToFen(board) + ` ${color} - - 0 ${tickCtx.moveCount + 1}`,
      toMove: color,
      moves: legal.map(moveToUci),
      history: tickCtx.history,
      moveNumber: tickCtx.moveCount,
    };

    let chosenUci: string | null = null;
    try {
      const result = runAgent(tickCtx.currentCode, agentState);
      if (typeof result === "string") {
        const move = uciToMove(result, legal);
        if (move) chosenUci = moveToUci(move);
      }
    } catch {
      chosenUci = null;
    }

    // forfeit=true tells applyAgentMove to fail the current player (not fall
    // back to heuristic) when the submitted agent returns no legal move.
    await ctx.runMutation(internal.simulation.applyAgentMove, {
      slug,
      chosenUci,
      forfeit: true,
    });
  },
});

// Run the agent against the initial chess position and require a legal UCI
// move. Used as a smoke test during approval so broken agents never reach the
// arena. Returns ok:true with the move, or ok:false with a reason.
function smokeTestChess(code: string): { ok: true; move: string } | { ok: false; reason: string } {
  const board = INITIAL_CHESS_BOARD;
  const legal = getChessMoves(board, "w");
  const agentState = {
    board: boardToFen(board) + " w - - 0 1",
    toMove: "w",
    moves: legal.map(moveToUci),
    history: [],
    moveNumber: 0,
  };
  let result: unknown;
  try {
    result = runAgent(code, agentState);
  } catch (err: any) {
    return { ok: false, reason: `Threw on starter position: ${err?.message ?? String(err)}` };
  }
  if (typeof result !== "string") {
    return { ok: false, reason: `Returned ${typeof result}, expected UCI string` };
  }
  const move = uciToMove(result, legal);
  if (!move) return { ok: false, reason: `Returned illegal move: ${JSON.stringify(result).slice(0, 80)}` };
  return { ok: true, move: moveToUci(move) };
}

// Approve a submission with a mandatory smoke test. Mirrors the bench runner's
// validation flow: static scan (already done at submit) + live execution on a
// known position + legal-move check. This is the single entry point — the
// underlying mutation is not exported publicly.
export const approveAgent = action({
  args: { submissionId: v.id("submissions"), adminToken: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.AGENT_ADMIN_TOKEN;
    if (!expected) throw new Error("Agent approval is disabled (AGENT_ADMIN_TOKEN unset)");
    if (args.adminToken !== expected) throw new Error("Invalid admin token");

    const sub = await ctx.runQuery(internal.simulation.getSubmission, {
      submissionId: args.submissionId,
    });
    if (!sub) throw new Error("Submission not found");
    if (sub.status === "approved") throw new Error("Already approved");

    // Only chess has a live-execution smoke test (matches the arena's engine
    // coverage). For go/checkers, we rely on the static validation done at
    // submit time — the arena falls back to heuristic for those games anyway.
    let smokeMove: string | null = null;
    if (sub.game === "chess") {
      const smoke = smokeTestChess(sub.code);
      if (!smoke.ok) {
        throw new Error(`Smoke test failed: ${smoke.reason}`);
      }
      smokeMove = smoke.move;
    }

    const result: { slug: string } = await ctx.runMutation(
      internal.simulation.finalizeApproval,
      { submissionId: args.submissionId },
    );
    return { slug: result.slug, smokeMove };
  },
});
