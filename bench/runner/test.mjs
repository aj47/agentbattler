#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { applyMove, gameStatus, isLegalMove, legalMoves, parseFen, START_FEN, toFen } from "./chess.mjs";
import { updateElo } from "./elo.mjs";
import { validateAgent } from "./runner.mjs";

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

await test("start position has 20 legal moves", () => {
  const pos = parseFen(START_FEN);
  assert.equal(legalMoves(pos).length, 20);
  assert.equal(isLegalMove(pos, "e2e4"), true);
});

await test("applies double pawn move with en passant square", () => {
  const next = applyMove(parseFen(START_FEN), "e2e4");
  assert.equal(toFen(next), "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
});

await test("supports en passant capture", () => {
  const pos = parseFen("rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3");
  assert.equal(isLegalMove(pos, "e5d6"), true);
  assert.equal(toFen(applyMove(pos, "e5d6")), "rnbqkbnr/ppp1pppp/3P4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3");
});

await test("supports promotion choices", () => {
  const pos = parseFen("8/P7/8/8/8/8/8/4k2K w - - 0 1");
  assert.deepEqual(legalMoves(pos).filter(move => move.startsWith("a7a8")).sort(), ["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
});

await test("supports castling and rejects castling through attack", () => {
  const clear = parseFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  assert.equal(isLegalMove(clear, "e1g1"), true);
  assert.equal(toFen(applyMove(clear, "e1g1")), "r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1");

  const attacked = parseFen("r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1");
  assert.equal(isLegalMove(attacked, "e1g1"), false);
});

await test("rejects castling rights when rook is missing", () => {
  const pos = parseFen("4k3/8/8/8/8/8/8/4K3 w KQ - 0 1");
  assert.equal(isLegalMove(pos, "e1g1"), false);
  assert.equal(isLegalMove(pos, "e1c1"), false);
});

await test("detects checkmate and stalemate", () => {
  const mate = parseFen("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
  assert.deepEqual(gameStatus(mate), { over: true, result: "black", reason: "checkmate" });

  const stale = parseFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
  assert.deepEqual(gameStatus(stale), { over: true, result: "draw", reason: "stalemate" });
});

await test("updates ELO with standard K-factor math", () => {
  const result = updateElo(1500, 1500, 1);
  assert.equal(Math.round(result.ratingA), 1516);
  assert.equal(Math.round(result.ratingB), 1484);
});

await test("validates fixture agents", async () => {
  const validation = await validateAgent({ slug: "e2e4", path: "bench/runner/fixtures/e2e4-agent.js" });
  assert.equal(validation.ok, true);
});

await test("dry tournament schedules both colors", () => {
  const output = execFileSync(process.execPath, [
    "bench/runner/run-tournament.mjs",
    "--dry-run",
    "--manifest", "bench/runner/fixtures/test-agents.json",
    "--games-per-color", "1",
    "--max-plies", "1"
  ], { encoding: "utf8" });
  const result = JSON.parse(output);
  assert.equal(result.latest.summary.gamesPlayed, 2);
  assert.equal(result.run.games.length, 2);
  assert.deepEqual(result.run.games.map(game => game.moves.length), [1, 1]);
});