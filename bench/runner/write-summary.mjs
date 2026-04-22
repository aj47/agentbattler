#!/usr/bin/env node
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "./runner.mjs";

function table(rows) {
  if (!rows.length) return "_No games were played._\n";
  return [
    "| Game | White | Black | Result | Reason | Plies |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map(game => `| ${game.gameId} | ${game.white} | ${game.black} | ${game.result} | ${game.reason} | ${game.plies} |`)
  ].join("\n") + "\n";
}

const latest = JSON.parse(await readFile(path.join(repoRoot, "bench/results/latest.json"), "utf8"));
const summary = `# Agent Battler Benchmark\n\n` +
  `- Run: \`${latest.runId}\`\n` +
  `- Status: \`${latest.status}\`\n` +
  `- Games: ${latest.summary.gamesPlayed}\n` +
  `- Verified agents: ${latest.summary.verifiedAgents}\n` +
  `- Reference agents: ${latest.summary.referenceAgents}\n` +
  `- Run detail JSON: \`${latest.provenance?.runDetailPath ?? "bench/results/runs/<run>.json"}\`\n` +
  `- Artifact: ${latest.provenance?.artifactName ? `\`${latest.provenance.artifactName}\`` : "local/no artifact"}\n\n` +
  `## Leaderboard\n\n` +
  `| Rank | Agent | Rating | W-D-L | Timeouts | Illegal | Avg move |\n` +
  `| --- | --- | ---: | --- | ---: | ---: | ---: |\n` +
  latest.leaderboard.map(row => `| ${row.rank} | ${row.agentSlug} | ${row.rating} | ${row.wins}-${row.draws}-${row.losses} | ${row.timeouts} | ${row.illegalOutputs} | ${row.avgMoveMs ?? "—"} |`).join("\n") +
  `\n\n## Match logs\n\n` + table(latest.matchLogs ?? []) +
  `\nFull per-move logs, FEN before/after, stdout/stderr summaries, validation data, source files, and prompt files are uploaded in the workflow artifact.\n`;

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
} else {
  console.log(summary);
}