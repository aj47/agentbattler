import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

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

export const insertAiMessage = internalMutation({
  args: { user: v.string(), tier: v.string(), msg: v.string() },
  handler: async (ctx, { user, tier, msg }) => {
    const now = Date.now();
    // Keep chat table lean — delete messages older than 10 minutes
    const cutoff = now - 10 * 60 * 1000;
    const old = await ctx.db.query("chatMessages")
      .filter(q => q.lt(q.field("createdAt"), cutoff))
      .collect();
    for (const m of old.filter(m => m.source === "ai").slice(0, 20)) {
      await ctx.db.delete(m._id);
    }

    return ctx.db.insert("chatMessages", {
      user,
      tier,
      msg,
      time: "now",
      order: -now,
      source: "ai",
      createdAt: now,
    });
  },
});
