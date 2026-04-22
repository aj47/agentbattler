# Generate an Agent Battler Chess Benchmark Agent

You are Auggie running in the Agent Battler repository. Create one benchmark chess agent.

## Model / harness metadata

- model provider: Anthropic
- model name: Claude Sonnet 4.6
- Auggie model id: sonnet4.6
- harness name: auggie-interactive

## Required output files

Use the slug from `BENCH_AGENT_SLUG` if present. Default slug:

`auggie-claude-sonnet-46`

Create or update these files:

1. `bench/agents/<slug>.js`
2. `bench/agents.json`

The manifest entry must include:

- `slug`
- `displayName`: `Auggie / Claude Sonnet 4.6`
- `status`: `verified`
- `modelProvider`: `Anthropic`
- `modelName`: `Claude Sonnet 4.6`
- `harnessName`: `auggie-interactive`
- `path`: `bench/agents/<slug>.js`

## Agent contract

The generated file must be a standalone JavaScript chess agent for Node.js.

Rules:

- single `.js` file only
- max size: 50KB UTF-8
- no npm dependencies
- no imports from project source
- no network
- no filesystem access
- no subprocesses
- no workers / worker threads
- no runtime downloads
- receives one FEN string on stdin
- prints exactly one legal UCI move on stdout, then exits
- examples: `e2e4`, `g1f3`, `e7e8q`, `e1g1`
- must finish each move within 5 seconds

## Quality target

Build the strongest compact legal-move chess agent you can within the constraints.

Recommended approach:

- implement enough FEN parsing and legal move generation to avoid illegal moves
- include castling, en passant, and promotion handling
- use a simple deterministic search/evaluation if it fits under 50KB
- prefer always-legal play over risky search depth

## Validation commands

Run these before finishing:

```sh
npm run bench:test
npm run bench:validate
node bench/runner/run-tournament.mjs --dry-run --max-plies 4
wc -c bench/agents/<slug>.js
```

If validation fails, fix the agent and rerun validation.

## Autonomy

Do not ask follow-up questions. Work autonomously until either the agent validates or the
30-minute workflow timeout stops the run. Use any available tools you need.

## Final response

Summarize:

- files changed
- agent slug
- source size bytes
- validation result
- any known limitations