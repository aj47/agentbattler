# Agent Battler Bench

This folder contains the MVP benchmark scaffold for FEN-based chess agents.

## MVP rules

- Chess only.
- Agent artifact is a single JavaScript file.
- Agent source must be <= 50kb UTF-8.
- No external dependencies, installs, internet, network, subprocesses, workers, or runtime downloads.
- Agent receives one simplified FEN / FEN-compatible position on stdin.
- Agent prints exactly one UCI move on stdout.
- Per-move hard timeout is 5 seconds.
- Timeout loses the move; the runner must make this operationally precise.
- Full benchmarks run only after merge to `main` or via maintainer `workflow_dispatch`.
- PRs should run validation only, never full model generation or tournaments with secrets.

## Layout

- `baselines/` — reference agents used for smoke tests and early comparison.
- `agents.json` — static list of agents that the current validation runner reads.
- `runner/` — Node stdlib validation/smoke runner scripts.
- `results/latest.json` — small leaderboard payload consumed by `/bench`.
- `results/runs/` — per-run metadata payloads.
- `results/agents/` — per-agent summary payloads.

## Local validation

Run runner tests:

```sh
npm run bench:test
```

Run:

```sh
npm run bench:validate
```

This checks file size, scans for banned APIs, executes each agent with smoke FENs over stdin,
enforces the 5s move timeout, and verifies the output is legal UCI for each smoke position.

## Local tournament run

Run a no-write shape check:

```sh
npm run bench:run:dry
```

Run the full configured tournament and write static result JSON:

```sh
npm run bench:run
```

Current runner policy: timeout, malformed output, crash, or illegal move forfeits the game.
This makes the spec's "timeout loses the move" rule operational for chess positions where
there is no valid skipped-turn move.

## Spectator audit trail

Trusted benchmark runs are documented in GitHub Actions. Each run uploads an artifact containing:

- `bench/results/latest.json` with leaderboard and provenance metadata
- `bench/results/runs/<runId>.json` with full per-game and per-move logs
- FEN before/after every move, UCI output, side, runtime, stdout/stderr summaries
- `bench/agents.json`
- committed agent source files and baseline source files
- benchmark prompt files when generation prompts are committed
- benchmark test, validation, run, and build logs

The `/bench` page displays the latest leaderboard, run detail path, workflow/artifact links when
available, and a compact match-log table. The full replayable move logs live in the run JSON.

## Permanent Convex artifact storage

Trusted benchmark runs can also upload a compressed artifact bundle to Convex File Storage. This
keeps long-lived benchmark history outside GitHub's 90-day artifact retention.

Configure both sides with the same random token:

```sh
npx convex env set BENCH_UPLOAD_TOKEN "<random-token>"
```

Then add these GitHub Actions secrets:

- `BENCH_UPLOAD_TOKEN` — same token as the Convex env var.
- `CONVEX_BENCH_UPLOAD_URL` — full endpoint URL, e.g. `https://<deployment>.convex.site/bench/upload`.

When those secrets are present, the `Bench` workflow posts a `.tgz` bundle to Convex after a
successful build. Convex stores the blob in File Storage and records searchable run metadata in
the `benchmarkRuns` table. The `/bench` page will show the permanent Convex artifact link once the
upload has completed.

## Participant generation flow

Generated agents should be created by a trusted manual generation workflow such as
`Bench Generate Agent`. That workflow stores the full prompt, Auggie model id, terminal transcript,
generated source, manifest diff, validation output, and dry-run tournament output in its artifact.
Maintainers can then review the artifact and commit the generated agent in a follow-up PR.

## Prior art

Rules should mostly copy `https://github.com/aj47/vibe-code-cup-challenge1`, with the
important source-size change from 1MB to 50kb.

## Static JSON MVP

The first UI implementation reads static JSON directly. Large game logs, move logs, prompts,
model responses, and generated source snapshots should be linked from durable artifacts rather
than embedded into `latest.json`. The current GitHub Actions artifact retention is only a
placeholder; the final benchmark needs forever-retained artifact storage.