import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// How many seconds between chat loop ticks (randomised per tick)
const CHAT_INTERVAL_MIN = 15_000;
const CHAT_INTERVAL_MAX = 22_000;

// Cheapest Claude model — used via the vibetoken.lol Anthropic-compatible
// proxy. Override via env if needed.
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

// Call the Anthropic Messages API (or any compatible base URL) and return the
// joined text content, or null on any failure. Returns null silently — chat
// is non-critical and the local generator is the fallback path.
async function callAnthropic(opts: {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
}): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const base = (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature ?? 1.0,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { content?: Array<{ type?: string; text?: string }> };
    const text = (data.content ?? [])
      .filter(c => c?.type === "text" && typeof c.text === "string")
      .map(c => c.text!.trim())
      .join("\n")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

// Spectator personas — each has a distinct voice
const PERSONAS = [
  { user: "goGremlin",    tier: "vip",  style: "Go expert, uses proper terminology (joseki, sente, gote, influence), gets hyped" },
  { user: "elo_tourist",  tier: "sub",  style: "Casual spectator, confused but enthusiastic, asks questions" },
  { user: "patternboi",   tier: "",     style: "Pattern recognition nerd, spots tactical motifs, uses chess/go terms" },
  { user: "sgf_dad",      tier: "mod",  style: "Old-school, ALL CAPS reactions, references old matches" },
  { user: "glorper",      tier: "",     style: "glorp-9 superfan, compares everything to glorp, chaotic energy" },
  { user: "byoyomi",      tier: "",     style: "Dry wit, short punchy takes, rarely impressed" },
  { user: "cicero",       tier: "sub",  style: "Long-winded analyst, starts essays mid-game, uses 'however'" },
  { user: "rook_stan",    tier: "",     style: "Rook-botto fan, defends rooks in every game type including Go" },
  { user: "kifu_enjoyer", tier: "",     style: "Data/stats obsessed, mentions file sizes, benchmarks everything" },
  { user: "tenuki_dad",   tier: "vip",  style: "Go purist, horrified by unusual moves, quotes Shusaku" },
  { user: "zergling_00",  tier: "sub",  style: "Zergling/zerg.swarm superfan, RTS references, rushes everything" },
  { user: "praxis_dev",   tier: "",     style: "Functional programming nerd, makes monad jokes, references lambda calculus" },
  { user: "kodama_fan",   tier: "vip",  style: "Deeply spiritual about Go, waxes poetic about kodama.spirit" },
  { user: "hex_watcher",  tier: "",     style: "Sarcastic, low expectations, surprised when small agents win" },
];

export const generateChatMessages = internalAction({
  args: {
    matchSlug: v.string(),
    game: v.string(),
    agentA: v.string(),
    agentB: v.string(),
    moveCount: v.number(),
    winProbB: v.number(),
    phase: v.string(),
    lastMove: v.optional(v.any()),
    capturesB: v.number(),
    capturesW: v.number(),
  },
  handler: async (ctx, args) => {
    if (!process.env.ANTHROPIC_API_KEY) return;

    // Pick 1-2 random personas
    const shuffled = [...PERSONAS].sort(() => Math.random() - 0.5);
    const count = Math.random() > 0.5 ? 2 : 1;
    const chosen = shuffled.slice(0, count);

    const gameLabel = args.game === "go19" ? "Go 19×19" : args.game === "chess" ? "Chess" : "Checkers";
    const winPctA = Math.round(args.winProbB * 100);
    const winPctB = 100 - winPctA;
    const phaseLabel = args.phase.toUpperCase();

    const systemPrompt = `You are generating live spectator chat messages for an AI agent game streaming platform called AgentBattler. The vibe is like Twitch chat meets algo trading meets esports — nerdy, fast, punchy.

Rules:
- Each message must be UNDER 80 characters
- Sound like a real person reacting in the moment, NOT a commentator
- No hashtags, no "@" mentions, no URLs
- Match the persona's voice exactly
- Reference the actual game state (move count, win %, phase, agents)
- Occasionally be wrong or confused — that's authentic
- Use game-specific terminology naturally`;

    const userPrompt = `Generate ${count} spectator chat message${count > 1 ? "s" : ""} reacting to this moment:

Game: ${gameLabel}
Match: ${args.matchSlug}
Agents: ${args.agentA} (Black/B, ${winPctA}% win) vs ${args.agentB} (White/W, ${winPctB}% win)
Move: ${args.moveCount} | Phase: ${phaseLabel}
Captures: B took ${args.capturesB}, W took ${args.capturesW}

${chosen.map((p, i) => `Message ${i + 1} — persona "${p.user}" (${p.style}):`).join("\n")}

Reply with ONLY the messages, one per line, no labels, no quotes, no extra text.`;

    try {
      const content = await callAnthropic({
        system: systemPrompt,
        user: userPrompt,
        maxTokens: 400,
        temperature: 0.95,
      });
      if (!content) return;

      const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0 && l.length <= 180);

      for (let i = 0; i < Math.min(lines.length, chosen.length); i++) {
        const persona = chosen[i];
        await ctx.runMutation(internal.aiChat.insertAiMessage, {
          user: persona.user,
          tier: persona.tier,
          msg: lines[i],
        });
      }
    } catch {
      // Silently fail — chat is non-critical
    }
  },
});

// ── Self-perpetuating chat loop ───────────────────────────────────────────

// Kick off the loop (call once via `npx convex run aiChat:startChatLoop`)
export const startChatLoop = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(1000, internal.aiChat.chatLoopTick, {});
    return { started: true };
  },
});

// Each tick: pick an active match, generate 1-3 messages, reschedule itself
// ── Local fallback chat generator ────────────────────────────────────────
function localChatMessage(persona: typeof PERSONAS[number], match: any, state: any): string {
  const a = match.a as string;
  const b = match.b as string;
  const pct = Math.round((state.winProbB ?? 0.5) * 100);
  const move = state.moveCount ?? 0;
  const phase = (state.phase ?? "midgame") as string;
  const game = match.game as string;

  const leading = pct > 60 ? a : pct < 40 ? b : null;
  const isClose = pct >= 45 && pct <= 55;

  const pools: Record<string, string[][]> = {
    goGremlin: [
      [`${a} playing for influence, ${pct}% feels right`, `joseki deviation at move ${move} was actually sente`, `${leading ?? a} has the corner, this is over`, `${isClose ? "too close to call rn" : `${leading} going for the kill`}`],
    ],
    elo_tourist: [
      [`wait why did ${a} do that lol`, `is ${pct}% good or bad for ${a}??`, `someone explain move ${move} to me`, `${a} vs ${b} is so hype`],
    ],
    patternboi: [
      [`classic ${game === "chess" ? "pin motif" : "ladder"} setup at move ${move}`, `${a} just played the ${game === "go19" ? "3-3 invasion" : "fork pattern"}`, `pattern recognition: ${leading ?? a} is in control`, `move ${move} is textbook ${phase}`],
    ],
    sgf_dad: [
      [`MOVE ${move} REMINDS ME OF THE 2019 FINALS`, `${a.toUpperCase()} VS ${b.toUpperCase()} IS THE MATCHUP I WANTED`, `${pct > 50 ? a.toUpperCase() : b.toUpperCase()} TAKE THE LEAD`, `THIS IS EXACTLY HOW GLORP_9 PLAYED IN SEASON 2`],
    ],
    glorper: [
      [`glorp wouldve played this better`, `${a} is basically glorp with worse vibes`, `${pct}%?? glorp would be at 80 by now`, `glorp ate this exact position for breakfast`],
    ],
    byoyomi: [
      [`move ${move}. sure.`, `${pct}%. ok.`, `${a} exists.`, `${phase}.`],
    ],
    cicero: [
      [`however, if we examine ${a}'s position at move ${move}...`, `the ${pct}% win probability, however, understates the complexity`, `however, the real question is whether ${b} can hold`, `however this phase resolves, the opening was decisive`],
    ],
    rook_stan: [
      [`rook_botto would dominate this position`, `no rooks involved = less interesting imo`, `${a} needs to activate the rook energy`, `every game is better with rooks. just saying.`],
    ],
    kifu_enjoyer: [
      [`move ${move}: 0.${(move * 7 % 100).toString().padStart(2,"0")}ms avg response time`, `${a} pgn is already 4.2kb at move ${move}`, `${pct}% winprob delta: ${Math.abs(pct - 50)} pts from center`, `benchmark: ${b} efficiency dropping in ${phase}`],
    ],
    tenuki_dad: [
      [`Shusaku would weep at move ${move}`, `${a} has abandoned the spirit of the stone`, `this is not Go. this is ${phase} anxiety.`, `${pct}% and they still haven't found the vital point`],
    ],
    zergling_00: [
      [`rush ${b} rush rush rush`, `${a} is expanding too slow, zerg wouldn't allow this`, `move ${move} was a drone pull moment`, `${pct}% that's a gg incoming`],
    ],
    praxis_dev: [
      [`${a}'s eval function is just a fold over material :: Int`, `move ${move} is a pure function with no side effects`, `the game state is a monad and ${leading ?? a} is in the happy path`, `${pct}% win? that's just a probability monad`],
    ],
    kodama_fan: [
      [`the stones speak at move ${move}`, `${a} and ${b}, two spirits in harmony`, `${pct}% means nothing — the board remembers`, `kodama.spirit would find beauty even in ${phase}`],
    ],
    hex_watcher: [
      [`${pct}% huh. sure why not`, `${a} doing better than I expected. low bar.`, `move ${move} didn't crash the server. progress.`, `${b} still in this? unexpected.`],
    ],
  };

  const lines = pools[persona.user]?.[0] ?? [`${a} vs ${b}, move ${move}`];
  return lines[Math.floor(Math.random() * lines.length)];
}

export const chatLoopTick = internalAction({
  args: {},
  handler: async (ctx) => {
    // Grab a live match for context
    const states: any[] = await ctx.runQuery(internal.aiChat.getActiveMatchContext, {});
    if (states.length === 0) {
      await ctx.scheduler.runAfter(10_000, internal.aiChat.chatLoopTick, {});
      return;
    }
    const state = states[Math.floor(Math.random() * states.length)];
    const match = state.match;

    // How many messages this tick (1–3, weighted toward 1–2)
    const count = Math.random() < 0.5 ? 1 : Math.random() < 0.7 ? 2 : 3;
    const shuffled = [...PERSONAS].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count);

    let aiLines: string[] | null = null;

    if (process.env.ANTHROPIC_API_KEY) {
      const gameLabel = match.game === "go19" ? "Go 19×19" : match.game === "chess" ? "Chess" : "Checkers";
      const winPctA = Math.round(state.winProbB * 100);
      const winPctB = 100 - winPctA;

      const content = await callAnthropic({
        system: `You generate Twitch-style spectator chat for AgentBattler, an AI agent game platform. Think fast, chaotic, funny, nerdy — like a real gaming stream chat. Keep it authentic and varied.`,
        user: `Generate ${count} chat message${count > 1 ? "s" : ""} for this moment:\n\nGame: ${gameLabel} | Match #${match.slug?.slice(1)}\n${match.a} (${winPctA}% win) vs ${match.b} (${winPctB}% win)\nMove ${state.moveCount} | Phase: ${state.phase?.toUpperCase()}\n\n${chosen.map((p: any, i: number) => `Message ${i + 1} — persona "${p.user}" (${p.style}):`).join("\n")}\n\nReply with ONLY the messages, one per line, no labels, no quotes. Max 80 chars each.`,
        maxTokens: 400,
        temperature: 1.0,
      });

      if (content) {
        const lines = content.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 2 && l.length <= 180);
        if (lines.length > 0) aiLines = lines;
      }
    }

    // Insert messages — AI if available, otherwise local templates
    for (let i = 0; i < chosen.length; i++) {
      const msg = aiLines?.[i] ?? localChatMessage(chosen[i], match, state);
      await ctx.runMutation(internal.aiChat.insertAiMessage, {
        user: chosen[i].user,
        tier: chosen[i].tier,
        msg,
      });
      if (i < chosen.length - 1) {
        await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
      }
    }

    // Schedule next tick with jitter so it feels natural
    const delay = CHAT_INTERVAL_MIN + Math.random() * (CHAT_INTERVAL_MAX - CHAT_INTERVAL_MIN);
    await ctx.scheduler.runAfter(delay, internal.aiChat.chatLoopTick, {});
  },
});

export const getActiveMatchContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [opening, midgame, endgame] = await Promise.all([
      ctx.db.query("matchStates").withIndex("by_phase", q => q.eq("phase", "opening")).take(10),
      ctx.db.query("matchStates").withIndex("by_phase", q => q.eq("phase", "midgame")).take(10),
      ctx.db.query("matchStates").withIndex("by_phase", q => q.eq("phase", "endgame")).take(10),
    ]);
    const states = [...opening, ...midgame, ...endgame];
    const withMatches = await Promise.all(
      states.map(async state => {
        const match = await ctx.db
          .query("matches")
          .withIndex("by_slug", q => q.eq("slug", state.matchSlug))
          .first();
        return match ? { ...state, match } : null;
      })
    );
    return withMatches
      .filter(s => s !== null)
      .sort((a, b) => (b.match?.viewers ?? 0) - (a.match?.viewers ?? 0))
      .slice(0, 10); // top 10 active by viewers
  },
});

export const insertAiMessage = internalMutation({
  args: { user: v.string(), tier: v.string(), msg: v.string() },
  handler: async (ctx, { user, tier, msg }) => {
    const now = Date.now();
    // Keep chat table lean — delete messages older than 10 minutes
    const cutoff = now - 10 * 60 * 1000;
    const old = await ctx.db.query("chatMessages")
      .withIndex("by_source_and_createdAt", q => q.eq("source", "seed").lt("createdAt", cutoff))
      .take(20);
    for (const m of old) {
      await ctx.db.delete(m._id);
    }

    return ctx.db.insert("chatMessages", {
      user,
      tier,
      msg,
      time: "now",
      order: -now,
      source: "seed",
      createdAt: now,
    });
  },
});
