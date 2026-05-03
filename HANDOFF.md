# Agent Handoff

Quick state-of-the-world for the next Claude session. Read this first.

## Deployment

- **Convex prod**: `chatty-platypus-618` (URL: https://chatty-platypus-618.convex.cloud)
- **Old prod**: `knowing-gopher-940` — deprecated, ignore. Switched on 2026-04-30.
- **Frontend**: Cloudflare Pages, `wrangler.toml` already points at the new URL.
- **Live site**: agentbattler.com

The deploy key lives in `.env.local` (`CONVEX_DEPLOY_KEY=prod:chatty-platypus-618|...`). `npx convex deploy --yes` and `npx convex run --prod ...` both target the new prod automatically.

## Convex env vars (prod)

Currently set:
- `AGENT_ADMIN_TOKEN` — required for `/admin` approve/reject. **Verify it's set** before testing approvals; if missing, approveAgent throws "Agent approval is disabled".

Currently **un**set (intentionally — saving credits):
- `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL` — chat generator. When unset, both `generateChatMessages` and `chatLoopTick` early-return with no API calls. To re-enable: `npx convex env set ANTHROPIC_API_KEY <key>` + `ANTHROPIC_BASE_URL https://api.vibetoken.lol/`. Cheapest model is `claude-haiku-4-5-20251001` (already hardcoded).
- `Z_AI_API_KEY` — old chat backend, no longer referenced in code.

## Recently shipped (last few sessions)

1. **Live engine execution** for submitted chess agents — vm sandbox, 200ms timeout, forfeit on failure. Non-chess (go/checkers) falls back to heuristic.
2. **`/admin` page** — review submissions, approve runs smoke test on starter chess position, requires legal UCI. Rejects via mutation. Token stored in localStorage.
3. **Inline bet settlement** at match finish — `settleBetsForSlug` is called from `finalizeMove` instead of scheduled, eliminates a race where matches recycled before payouts fired.
4. **Submit confirmation modal** — persistent overlay after successful submit; survives input changes; quick-picks for remaining games.
5. **Viewer-aware simulations** (PR #39) — biggest burn fix. Match tick loops now pause after 90s without a `pingViewer` heartbeat. Auto-recycle (30s after finish) only fires if a viewer is still active. Concurrent-sim cap dropped 10 → 4.

## Architecture gotchas

### Convex runtime split
- `convex/engine.ts` uses `"use node"` for the `vm` module. **Queries and mutations cannot live in `"use node"` files** — only actions. Tick context is fetched via `internal.simulation.getTickContext` (a non-node internalQuery).
- The flow is: scheduled `tick` mutation → if chess + agent has code, schedules `internal.engine.computeAgentMove` action → action calls `applyAgentMove` mutation with the chosen UCI (or null/forfeit).

### Simulation lifecycle
- `initMatchState` creates a matchState row + schedules first tick.
- `tick` reschedules itself every 4–6s (per game) **only if `lastViewerAt` is fresh** (within 90s).
- `MatchPageClient` heartbeats `pingViewer` every 30s while mounted; updates `lastViewerAt` and resumes a paused loop if needed.
- On finish, `finalizeMove` schedules `resetMatch` 30s later **only if viewer is active**. Otherwise the match stays finished until someone visits.
- Concurrent active-sim cap is 4 (in `initMatchState`). Don't raise without thinking about scheduler load.

### Chat
- `aiChat.generateChatMessages` is scheduled from `finalizeMove` every 3 moves.
- `aiChat.chatLoopTick` is a **manual** loop — not on a cron. Start with `npx convex run aiChat:startChatLoop`. If you start it, it self-perpetuates on a 15–22s jitter forever; to stop, you'd need to clear scheduled functions or no-op the body and redeploy.
- Both honor the `ANTHROPIC_API_KEY` env gate. Currently disabled.
- The frontend probably doesn't render the `chatMessages` table prominently — user mentioned "I don't even see chat anywhere". If you wire it up, re-enable env vars first.

### Bets
- Tables: `bets` (open/won/lost/void), `wallets` (balance + totals).
- Settle paths: inline at finish via `settleBetsForSlug`, plus `resetMatch` refunds any stragglers as a safety net.
- Backfill: `simulation:settleAllOpenBets` (manual run if anything ever leaks).

## Schema highlights

- `agents` has optional `code` + `submissionGame` for promoted submissions.
- `submissions.by_handle_game` index — one submission per (handle, game) pair enforced at submit time.
- `matchStates.lastViewerAt` is the heartbeat field. `by_phase` index used heavily in queries — don't drop it.
- `bets.by_match_and_status` for fast settlement queries.

## Live data

The new prod was seeded once (`npx convex run --prod seed:run`): 50 agents, 500 matches, 20 users. Don't re-seed — it's idempotent on a flag but wastes a write either way.

## Frontend

- Next.js 14 app router. Cloudflare Pages build (`pages_build_output_dir = "out"`).
- Convex client via `convex/react`. Queries auto-subscribe; mutations + actions are imperative.
- Auth via `@convex-dev/auth`. `getAuthUserId(ctx)` in mutations.
- UI tokens in `app/globals.css`: `--phos-cyan`, `--phos-amber`, `--phos-green`, `--phos-red`, `--phos-violet`, `--phos-magenta`, `--ink-100..500`, `--bg-void`, `--bg-panel`, `--line`, `--font-mono`. Components like `<Panel>` and `<Pill>` in `components/ui`.

## Known unfinished / nice-to-haves

- Chat loop has no kill-switch beyond removing the env var. If `chatLoopTick` is currently scheduled in prod and the user wants it gone, look at canceling scheduled functions in the Convex dashboard or no-op the action body and redeploy.
- `bootstrapSimulations` and `restartFinished` (in `simulation.ts`) exist but aren't called from anywhere — they were for cron-driven warm-up. Safe to leave; safe to delete if you're tidying.
- Smoke test only covers chess. Go/checkers approvals skip the live test and rely on static validation only.
- The benchmarkRuns / benchmarkGenerationRuns tables exist but UI surfacing is partial.

## Useful commands

```bash
npx convex deploy --yes                    # deploy code + schema to prod
npx convex run --prod queries:matchCounts  # smoke-test a query
npx convex run --prod seed:run             # only on a fresh deployment
npx convex env list                        # see what's set on prod
npx convex logs --prod                     # tail
gh pr create / gh pr merge --squash        # standard
```

## Recent PRs (for context)

- #34 Engine execution + admin UI + smoke test
- #39 Viewer-aware simulations (the burn fix)
- #40 Anthropic Haiku chat (env vars later removed to disable)

## Don't

- Don't bypass branch protection with `gh pr merge --admin` unless explicitly told.
- Don't re-enable the chat API keys without the user asking — they explicitly said "don't waste credits".
- Don't raise the active-sim cap above 4 without weighing scheduler load.
- Don't add cron jobs that run forever — every recurring scheduler chain is a burn vector. Match the viewer-gated pattern.
