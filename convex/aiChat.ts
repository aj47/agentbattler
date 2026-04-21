import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// How many seconds between chat loop ticks (randomised per tick)
const CHAT_INTERVAL_MIN = 4_000;
const CHAT_INTERVAL_MAX = 8_000;

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
    const apiKey = process.env.Z_AI_API_KEY;
    if (!apiKey) return;

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
      const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "glm-5.1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt },
          ],
          max_tokens: 200,
          temperature: 0.95,
        }),
      });

      if (!res.ok) return;

      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content?.trim();
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
export const chatLoopTick = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.Z_AI_API_KEY;
    if (!apiKey) return;

    // Grab a live match for context
    const states: any[] = await ctx.runQuery(internal.aiChat.getActiveMatchContext, {});
    if (states.length === 0) {
      // No active match — try again later
      await ctx.scheduler.runAfter(10_000, internal.aiChat.chatLoopTick, {});
      return;
    }
    const state = states[Math.floor(Math.random() * states.length)];
    const match = state.match;

    // How many messages this tick (1–3, weighted toward 1–2)
    const count = Math.random() < 0.5 ? 1 : Math.random() < 0.7 ? 2 : 3;
    const shuffled = [...PERSONAS].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count);

    const gameLabel = match.game === "go19" ? "Go 19×19" : match.game === "chess" ? "Chess" : "Checkers";
    const winPctA = Math.round(state.winProbB * 100);
    const winPctB = 100 - winPctA;

    const systemPrompt = `You generate Twitch-style spectator chat for AgentBattler, an AI agent game platform. Think fast, chaotic, funny, nerdy — like a real gaming stream chat. Keep it authentic and varied.`;

    const userPrompt = `Generate ${count} chat message${count > 1 ? "s" : ""} for this moment:

Game: ${gameLabel} | Match #${match.slug?.slice(1)}
${match.a} (${winPctA}% win) vs ${match.b} (${winPctB}% win)
Move ${state.moveCount} | Phase: ${state.phase?.toUpperCase()}

${chosen.map((p: any, i: number) => `Message ${i + 1} — persona "${p.user}" (${p.style}):`).join("\n")}

Reply with ONLY the messages, one per line, no labels, no quotes. Max 80 chars each.`;

    try {
      const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "glm-5.1",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt },
          ],
          max_tokens: 150,
          temperature: 1.0,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          const lines = content.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 2 && l.length <= 180);
          for (let i = 0; i < Math.min(lines.length, chosen.length); i++) {
            await ctx.runMutation(internal.aiChat.insertAiMessage, {
              user: chosen[i].user,
              tier: chosen[i].tier,
              msg: lines[i],
            });
            // Stagger messages a little so they don't all land at once
            if (i < chosen.length - 1) {
              await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
            }
          }
        }
      }
    } catch {
      // silent
    }

    // Schedule next tick with jitter so it feels natural
    const delay = CHAT_INTERVAL_MIN + Math.random() * (CHAT_INTERVAL_MAX - CHAT_INTERVAL_MIN);
    await ctx.scheduler.runAfter(delay, internal.aiChat.chatLoopTick, {});
  },
});

export const getActiveMatchContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const states = await ctx.db.query("matchStates")
      .filter(q => q.neq(q.field("phase"), "finished"))
      .collect();
    const matches = await ctx.db.query("matches").collect();
    const matchMap = new Map(matches.map(m => [m.slug, m]));
    return states
      .map(s => ({ ...s, match: matchMap.get(s.matchSlug) }))
      .filter(s => s.match)
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
      .filter(q => q.lt(q.field("createdAt"), cutoff))
      .collect();
    for (const m of old.filter(m => m.source === "seed").slice(0, 20)) {
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
