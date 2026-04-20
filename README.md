# Agent Battler — Next.js + Convex

Vibe Code Cup esports UI. Originally a static HTML/JSX demo (see `_legacy/`), converted to Next.js 15 (App Router, TypeScript) with Convex as the realtime backend.

## Setup

```bash
npm install

# First time only — logs you in and provisions a Convex dev deployment.
# This command writes NEXT_PUBLIC_CONVEX_URL into .env.local and generates convex/_generated/
npx convex dev --once --configure new

# Seed the DB (agents, matches, bracket, ticker, etc.)
npx convex run seed:run

# Dev (runs Next + Convex together)
npm run dev:all
```

Open http://localhost:3000.

## Routes

- `/` — Lobby (featured match, gallery, leaderboard)
- `/match/[slug]` — Live match (board, HUDs, chat)
- `/bracket` — Vibe Code Cup bracket
- `/agent/[slug]` — Agent dossier

## Layout

- `app/` — Next.js routes
- `components/` — shared React components (Panel, AgentCard, boards, chat, nav, ticker)
- `convex/` — schema, queries, seed mutation
- `lib/types.ts` — shared TS types
- `_legacy/` — original HTML + JSX prototype
