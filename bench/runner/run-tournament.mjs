#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ELO_K_FACTOR, GAMES_PER_COLOR, INITIAL_ELO, MAX_GAME_PLIES, MOVE_TIMEOUT_MS, SOURCE_LIMIT_BYTES } from "./config.mjs";
import { applyMove, gameStatus, isLegalMove, parseFen, START_FEN, toFen } from "./chess.mjs";
import { initialRatings, updateElo } from "./elo.mjs";
import { isUciMove, loadAgents, repoRoot, runAgentMove, validateAgent } from "./runner.mjs";

function parseArgs(argv) {
  const args = { dryRun: false, manifest: "bench/agents.json", maxPlies: MAX_GAME_PLIES, gamesPerColor: GAMES_PER_COLOR };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--manifest") args.manifest = argv[++i];
    else if (arg === "--max-plies") args.maxPlies = Number(argv[++i]);
    else if (arg === "--games-per-color") args.gamesPerColor = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function emptyStats(agent, validation) {
  return {
    agentSlug: agent.slug,
    displayName: agent.displayName ?? agent.slug,
    status: agent.status ?? "verified",
    modelProvider: agent.modelProvider ?? (agent.status === "reference" ? "reference" : "unknown"),
    modelName: agent.modelName ?? (agent.status === "reference" ? "human-authored" : "unknown"),
    harnessName: agent.harnessName ?? (agent.status === "reference" ? "baseline" : "unknown"),
    agentPath: agent.path,
    agentSizeBytes: validation.sizeBytes,
    gamesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    timeouts: 0,
    illegalOutputs: 0,
    moveCount: 0,
    totalMoveMs: 0,
    maxMoveMs: null
  };
}

function scoreFor(result, color) {
  if (result === "draw") return 0.5;
  return result === color ? 1 : 0;
}

function workflowUrl() {
  if (!process.env.GITHUB_RUN_ID || !process.env.GITHUB_REPOSITORY) return null;
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  return `${server}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}

function provenance(runId) {
  const url = workflowUrl();
  const artifactName = process.env.BENCH_RESULTS_ARTIFACT_NAME ?? null;
  return {
    runDetailPath: `bench/results/runs/${runId}.json`,
    workflowUrl: url,
    artifactName,
    artifactUrl: url && artifactName ? `${url}#artifacts` : null,
    repository: process.env.GITHUB_REPOSITORY ?? null,
    sha: process.env.GITHUB_SHA ?? null,
    ref: process.env.GITHUB_REF_NAME ?? null
  };
}

function recordGameStats(stats, game, ratings) {
  const white = stats[game.white.agentSlug];
  const black = stats[game.black.agentSlug];
  const whiteScore = scoreFor(game.result, "white");
  const { ratingA, ratingB } = updateElo(ratings[white.agentSlug], ratings[black.agentSlug], whiteScore);
  ratings[white.agentSlug] = ratingA;
  ratings[black.agentSlug] = ratingB;

  for (const [side, row] of [["white", white], ["black", black]]) {
    row.gamesPlayed += 1;
    if (game.result === "draw") row.draws += 1;
    else if (game.result === side) row.wins += 1;
    else row.losses += 1;
  }

  for (const move of game.moves) {
    const row = stats[move.agentSlug];
    if (move.status === "timeout") row.timeouts += 1;
    if (move.status === "illegal" || move.status === "malformed" || move.status === "crash") row.illegalOutputs += 1;
    if (Number.isFinite(move.runtimeMs)) {
      row.moveCount += 1;
      row.totalMoveMs += move.runtimeMs;
      row.maxMoveMs = Math.max(row.maxMoveMs ?? 0, move.runtimeMs);
    }
  }
}

async function sha256(filePath) {
  const source = await readFile(path.join(repoRoot, filePath));
  return createHash("sha256").update(source).digest("hex");
}

async function playGame({ white, black, gameId, maxPlies }) {
  let pos = parseFen(START_FEN);
  const moves = [];
  let result = "draw";
  let reason = "max_plies";

  for (let ply = 1; ply <= maxPlies; ply++) {
    const side = pos.turn === "w" ? "white" : "black";
    const agent = side === "white" ? white : black;
    const fenBefore = toFen(pos);
    const response = await runAgentMove(agent, fenBefore, MOVE_TIMEOUT_MS);
    const moveLog = {
      ply,
      side,
      agentSlug: agent.slug,
      fenBefore,
      move: response.move,
      status: response.status,
      runtimeMs: response.runtimeMs,
      stdout: response.stdout,
      stderr: response.stderr
    };

    if (response.status === "timeout") {
      Object.assign(moveLog, { status: "timeout", fenAfter: fenBefore });
      moves.push(moveLog);
      result = side === "white" ? "black" : "white";
      reason = "timeout_forfeit";
      break;
    }
    if (response.status !== "ok") {
      Object.assign(moveLog, { status: "crash", fenAfter: fenBefore });
      moves.push(moveLog);
      result = side === "white" ? "black" : "white";
      reason = response.status;
      break;
    }
    if (!isUciMove(response.move)) {
      Object.assign(moveLog, { status: "malformed", fenAfter: fenBefore });
      moves.push(moveLog);
      result = side === "white" ? "black" : "white";
      reason = "malformed_output";
      break;
    }
    if (!isLegalMove(pos, response.move)) {
      Object.assign(moveLog, { status: "illegal", fenAfter: fenBefore });
      moves.push(moveLog);
      result = side === "white" ? "black" : "white";
      reason = "illegal_move";
      break;
    }

    pos = applyMove(pos, response.move);
    moveLog.status = "ok";
    moveLog.fenAfter = toFen(pos);
    moves.push(moveLog);

    const status = gameStatus(pos);
    if (status.over) {
      result = status.result;
      reason = status.reason;
      break;
    }
  }

  return { gameId, white: { agentSlug: white.slug }, black: { agentSlug: black.slug }, result, reason, moves };
}

function leaderboardRows(stats, ratings, runId, runProvenance) {
  return Object.values(stats)
    .map(row => ({
      rank: 0,
      ...row,
      rating: Math.round(ratings[row.agentSlug]),
      ratingDelta: Math.round(ratings[row.agentSlug] - INITIAL_ELO),
      avgMoveMs: row.moveCount ? Math.round(row.totalMoveMs / row.moveCount) : null,
      maxMoveMs: row.maxMoveMs,
      artifactUrl: runProvenance.artifactUrl,
      workflowUrl: runProvenance.workflowUrl,
      runDetailPath: runProvenance.runDetailPath
    }))
    .sort((a, b) => b.rating - a.rating || (a.timeouts + a.illegalOutputs) - (b.timeouts + b.illegalOutputs) || b.wins - a.wins || a.agentSlug.localeCompare(b.agentSlug))
    .map((row, index) => {
      const { moveCount, totalMoveMs, ...publicRow } = row;
      return { ...publicRow, rank: index + 1 };
    });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allAgents = await loadAgents(args.manifest);
  const validations = await Promise.all(allAgents.map(validateAgent));
  const validationBySlug = Object.fromEntries(validations.map(v => [v.agentSlug, v]));
  const agents = allAgents.filter(agent => validationBySlug[agent.slug]?.ok && ["verified", "reference"].includes(agent.status ?? "verified"));
  const runId = `bench-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const stats = Object.fromEntries(agents.map(agent => [agent.slug, emptyStats(agent, validationBySlug[agent.slug]) ]));
  const ratings = initialRatings(agents);
  const games = [];

  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      for (let repeat = 1; repeat <= args.gamesPerColor; repeat++) {
        games.push(await playGame({ white: agents[i], black: agents[j], gameId: `${agents[i].slug}-vs-${agents[j].slug}-w${repeat}`, maxPlies: args.maxPlies }));
        games.push(await playGame({ white: agents[j], black: agents[i], gameId: `${agents[j].slug}-vs-${agents[i].slug}-w${repeat}`, maxPlies: args.maxPlies }));
      }
    }
  }
  for (const game of games) recordGameStats(stats, game, ratings);

  const createdAt = new Date().toISOString();
  const runProvenance = provenance(runId);
  const leaderboard = leaderboardRows(stats, ratings, runId, runProvenance);
  const matchLogs = games.map(game => ({
    gameId: game.gameId,
    white: game.white.agentSlug,
    black: game.black.agentSlug,
    result: game.result,
    reason: game.reason,
    plies: game.moves.length,
    runDetailPath: runProvenance.runDetailPath,
    workflowUrl: runProvenance.workflowUrl,
    artifactUrl: runProvenance.artifactUrl
  }));
  const run = {
    schemaVersion: 1,
    runId,
    status: agents.length >= 2 ? "complete" : "reference",
    createdAt,
    benchmark: {
      game: "chess",
      input: "simplified-fen",
      turnBudgetMs: MOVE_TIMEOUT_MS,
      sourceLimitBytes: SOURCE_LIMIT_BYTES,
      initialElo: INITIAL_ELO,
      eloKFactor: ELO_K_FACTOR,
      gamesPerColor: args.gamesPerColor,
      maxGamePlies: args.maxPlies,
      timeoutPolicy: "timeout, malformed output, crash, or illegal move forfeits the game"
    },
    validations,
    provenance: runProvenance,
    agents: await Promise.all(agents.map(async agent => ({
      agentSlug: agent.slug,
      displayName: agent.displayName ?? agent.slug,
      sourcePath: agent.path,
      sourceSizeBytes: validationBySlug[agent.slug].sizeBytes,
      sha256: await sha256(agent.path),
      status: agent.status ?? "verified"
    }))),
    games,
    leaderboard
  };
  const latest = {
    schemaVersion: 1,
    generatedAt: createdAt,
    runId,
    status: run.status,
    benchmark: { ...run.benchmark, format: "single-js-stdin-stdout", scoring: "elo-style" },
    summary: {
      verifiedAgents: agents.filter(agent => (agent.status ?? "verified") === "verified").length,
      referenceAgents: agents.filter(agent => agent.status === "reference").length,
      gamesPlayed: games.length,
      fullBenchmarkComplete: agents.length >= 2
    },
    provenance: runProvenance,
    matchLogs,
    leaderboard
  };

  if (args.dryRun) {
    console.log(JSON.stringify({ latest, run }, null, 2));
    return;
  }
  await mkdir(path.join(repoRoot, "bench/results/runs"), { recursive: true });
  await writeFile(path.join(repoRoot, `bench/results/runs/${runId}.json`), `${JSON.stringify(run, null, 2)}\n`);
  await writeFile(path.join(repoRoot, "bench/results/latest.json"), `${JSON.stringify(latest, null, 2)}\n`);
  console.log(JSON.stringify({ runId, games: games.length, agents: agents.length, latest: "bench/results/latest.json" }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});