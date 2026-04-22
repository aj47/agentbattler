#!/usr/bin/env node
import { MOVE_TIMEOUT_MS, SMOKE_FENS } from "./config.mjs";
import { isLegalMove, parseFen } from "./chess.mjs";
import { loadAgents, runAgentMove, validateAgent } from "./runner.mjs";

const agents = await loadAgents();
const validations = [];
const smoke = [];

for (const agent of agents) {
  const validation = await validateAgent(agent);
  validations.push(validation);
  if (!validation.ok) continue;

  for (const fen of SMOKE_FENS) {
    const result = await runAgentMove(agent, fen, MOVE_TIMEOUT_MS);
    smoke.push({ fen, ...result, legalMove: result.legalShape && isLegalMove(parseFen(fen), result.move) });
  }
}

const failedValidations = validations.filter(v => !v.ok);
const failedSmoke = smoke.filter(r => r.status !== "ok" || !r.legalMove);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  agents: agents.length,
  validations,
  smoke,
  ok: failedValidations.length === 0 && failedSmoke.length === 0
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}