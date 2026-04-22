# Agent Battler Benchmark Spec

## 1. Purpose

Agent Battler will add a transparent benchmark system for comparing LLM model + harness
combinations that generate chess agents. The benchmark runner is separate from the live
Convex arena. It runs in GitHub Actions, produces durable artifacts, and publishes static
JSON results that the app can render on a public benchmark page.

The goal is not to build a full ML experiment platform. The goal is to make every ranked
result traceable to the exact model, harness, prompt, generated agent, benchmark runner,
GitHub SHA, workflow run, and tournament output.

## 2. MVP Scope

MVP is intentionally narrow:

- game: chess only
- board input: simplified FEN / FEN-compatible position text
- agent format: single JavaScript file
- source size: max 50kb UTF-8
- dependencies: none
- network/internet: disallowed
- turn budget: 5 seconds per move
- timeout behavior: timeout loses the move
- scoring: ELO-style rating from head-to-head games
- execution: GitHub Actions only
- publication: static JSON checked in or otherwise served by the app
- full benchmark trigger: after merge to main or manual dispatch only, not on PRs

Future work may add Go, checkers, live Convex ingestion, richer UI, or scheduled reruns.
Those are explicitly out of MVP unless re-scoped.

## 3. Source Rules

The benchmark rules should mostly copy the prior Vibe Cup chess challenge:

- previous rules repo: `https://github.com/aj47/vibe-code-cup-challenge1`
- main changes for this project:
  - max source file size is 50kb instead of 1MB
  - benchmark is for model/harness-generated agents, not manual challenge repos
  - results are published as Agent Battler benchmark data

Important inherited rules:

- agents receive a chess position and return one UCI move
- standard chess rules apply
- illegal output, crash, or malformed UCI loses the move/game according to runner policy
- no external runtime dependencies
- no network/package download step during judging
- every move should be logged with pre-position, post-position, UCI move, side, runtime,
  and raw output for replay/verification

## 4. Definitions

### Model

The LLM used to generate the agent. Record provider, model name, model version/snapshot if
available, and generation parameters.

### Harness

The wrapper around the model call: prompt template, prompt renderer, extraction logic,
retry policy, and any post-processing used to produce the final agent file.

### Agent

The generated chess program under test. For MVP this is a single JS file under 50kb.

### Benchmark runner

The GitHub Actions-executed tournament runner that validates agents, runs games, computes
ratings, and emits artifacts/results.

### Verified score

A score produced by the canonical runner on a trusted ref after merge or by manual dispatch,
with required artifacts available permanently.

## 5. Agent Contract

MVP agents use the previous challenge-style stdin/stdout contract rather than the live app's
`act(state)` interface.

Input:

- one simplified FEN/FEN-compatible chess position on stdin
- includes at minimum piece placement and side to move
- runner may include additional standard FEN fields when available

Output:

- exactly one UCI move on stdout, such as `e2e4`, `g1f3`, `e7e8q`, or `e1g1`
- output must be parseable as one move; extra chatter is invalid unless the runner explicitly
  supports parsing the first valid line

Runtime:

- command shape: `node agent.js < input.fen`
- Node version is pinned by the benchmark runner
- no `npm install` step is available for the agent
- no imports from project source are allowed unless the generated file embeds everything it needs
- no network, subprocesses, worker pools, runtime downloads, or external files

Validation:

- file must be a single JS source artifact
- file must be <= 50kb by UTF-8 byte size
- file must produce a legal UCI move for smoke-test positions
- repeated deterministic input should not rely on external randomness or state outside the agent

## 6. Baseline Agent

The initial baseline agent lives at:

- `bench/baselines/baseline.js`

Use it as:

- a sanity-check opponent
- a smoke-test target for the runner
- a stable reference point for early results

The baseline does not define the complete benchmark by itself. Verified scores are based on
the full head-to-head pool described below.

## 7. Tournament And Verification Format

A verified score requires running every active verified agent against every other active
verified agent.

For each unique pair of agents:

- play 4 games total
- each agent gets 2 games as white
- each agent gets 2 games as black

Game result values:

- win: 1.0
- draw: 0.5
- loss: 0.0

Timeout policy:

- per-move hard timeout: 5 seconds
- timeout loses the move
- runner must record the timeout event in the per-game log
- MVP runner operational rule: timeout, malformed output, crash, or illegal move forfeits the
  current game because chess has no legal skipped-turn representation

## 8. ELO-Style Ranking

Benchmark rankings use an ELO-style rating computed from verified head-to-head games.

MVP constants:

- initial rating: 1500
- K-factor: 32

Required published fields:

- rating
- rating delta from previous verified run if available
- games played
- wins
- draws
- losses
- timeout count
- illegal output count
- average move time
- max move time
- agent size bytes

Tiebreakers for equal ratings:

1. head-to-head score
2. fewer illegal outputs/timeouts
3. higher total score percentage
4. more wins
5. lower average move time
6. deterministic slug/order fallback

Do not manually edit ranks. Rank should be derived from the published static result JSON.

## 9. Model + Harness Manifest

Each generated agent should come from a manifest entry such as `bench/combos/*.json`.

Required fields:

- `slug`
- `displayName`
- `submittedBy`
- `modelProvider`
- `modelName`
- `modelVersion` or `snapshot`
- `generationParams`
  - temperature
  - top_p/top_k if used
  - max output tokens
  - stop sequences
  - seed if supported
- `harnessName`
- `harnessVersion`
- `promptTemplatePath`
- `promptTemplateHash`
- `extractionPolicy`
- `agentOutputPath`
- `notes`

Closed proprietary models are allowed to rank if:

- the maintainer has access to run the model
- provider/model identity is public
- harness and generated code are public
- API keys/secrets remain private
- any unreproducible vendor limitations are disclosed

If a model or prompt cannot be publicly identified, the run can appear in an audit log but
should not rank on the main leaderboard.

## 10. GitHub Actions Policy

Full benchmarks do not run on untrusted PRs.

Allowed triggers:

- `push` to `main` after merge
- `workflow_dispatch` by maintainer

PR checks may run only safe validation:

- manifest schema validation
- static file-size checks
- banned API string scan
- no-secret smoke tests if safe

PR checks must not:

- call paid model APIs with maintainer secrets
- run full tournaments
- execute untrusted code in a privileged workflow
- use `pull_request_target` to checkout and run PR code

Full benchmark workflow responsibilities:

1. checkout trusted ref
2. install project/runner dependencies from lockfile
3. generate or locate agent artifacts from manifests
4. validate each agent
5. run full chess tournament
6. compute ELO-style ratings
7. write static JSON result files
8. upload durable artifact bundle
9. optionally open/update a results PR or commit static JSON through a maintainer-controlled path

Maintainer pays for model calls. Provider keys are stored as GitHub Actions secrets and are
never printed in logs or included in artifacts.

## 11. Artifact Requirements

Artifacts must be available forever. Do not rely only on default GitHub Actions artifact
retention unless retention is configured or artifacts are copied into durable storage.

Each verified run should preserve:

- combo manifest
- prompt template content
- rendered prompt sent to model
- raw model response
- extracted agent file
- agent SHA256
- validation report
- tournament schedule
- per-game logs
- per-move logs with FEN before/after, move, side, runtime, stdout/stderr summary
- aggregate results JSON
- ELO calculation input/output
- workflow run URL
- repository SHA
- benchmark runner version

Logs must be scanned/redacted for secrets before publication.

## 12. Static JSON MVP

MVP can avoid Convex ingestion and use static JSON.

Suggested files:

- `bench/results/latest.json`
- `bench/results/runs/<runId>.json`
- `bench/results/agents/<agentSlug>.json`

`latest.json` should contain only data needed for the leaderboard and link to run details.
Large per-game/per-move logs should live in durable artifact storage and be referenced by URL.

The app can render `/bench` from static JSON first. Convex tables can be added later if live
querying, filtering, or admin workflows become necessary.

## 13. UI Requirements

The public benchmark page should show:

- rank
- agent/combo name
- model/provider
- harness
- ELO rating
- wins/draws/losses
- timeout/illegal counts
- average move time
- source size
- verified run timestamp
- links to artifacts, generated code, prompt, and workflow

Run detail view should show:

- exact manifest
- prompt and model metadata
- generated agent hash/source link
- validation status
- complete matchup summary
- artifact bundle links

## 14. Implementation Phases

### Phase 0: Rules lock

- simplified FEN fields: standard FEN string fields are accepted; agents should handle at
  least piece placement, side to move, castling, en passant, halfmove, and fullmove
- timeout-loses-move behavior: timeout, malformed output, crash, or illegal move forfeits the
  current game in the MVP runner
- confirm Node version
- confirm artifact storage location for forever retention

### Phase 1: Static benchmark skeleton

- create `bench/` folder structure
- keep baseline in `bench/baselines/baseline.js`
- define manifest schema
- define static result JSON shape
- add placeholder `/bench` page reading static JSON

### Phase 2: Runner

- implement agent validation
- implement sandbox/no-network policy
- implement chess tournament runner
- emit per-game and aggregate JSON
- compute ELO-style ratings

### Phase 3: GitHub Actions

- add post-merge/manual benchmark workflow
- add safe PR validation workflow
- configure secrets for maintainer-funded model calls
- publish durable artifacts

### Phase 4: Public polish

- render leaderboard and run detail pages
- link artifacts forever
- add comparison/history views if needed

## 15. Acceptance Criteria

MVP is complete when:

- a model/harness manifest can generate or point to a single JS chess agent under 50kb
- the runner validates the agent contract
- full benchmark runs only after merge or manual dispatch
- every verified agent plays every other verified agent 2x as white and 2x as black
- results are scored with ELO-style ratings
- static JSON is produced for the app
- `/bench` can display the latest leaderboard
- every row links to public code, prompt/harness metadata, workflow provenance, and durable artifacts

## 16. Open Questions

- Where will forever-retained artifacts live?
- Should generated agents be committed to the repo, stored as release assets, or stored externally?
- Should baseline games count in the public ELO pool or only serve as smoke/reference data?