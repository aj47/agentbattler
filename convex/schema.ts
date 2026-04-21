import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  wallets: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    totalDeposited: v.number(),
    totalWithdrawn: v.number(),
  }).index("by_user", ["userId"]),

  bets: defineTable({
    userId: v.id("users"),
    matchSlug: v.string(),
    side: v.union(v.literal("a"), v.literal("b")),
    amount: v.number(),
    odds: v.number(),
    status: v.union(v.literal("open"), v.literal("won"), v.literal("lost"), v.literal("void")),
    payout: v.optional(v.number()),
    placedAt: v.string(),
  }).index("by_user", ["userId"]).index("by_match", ["matchSlug"]),

  wagerMatches: defineTable({
    challengerUserId: v.id("users"),
    challengerAgentSlug: v.string(),
    opponentAgentSlug: v.string(),
    game: v.union(v.literal("chess"), v.literal("go19"), v.literal("checkers")),
    stake: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("live"), v.literal("complete"), v.literal("cancelled")),
    winner: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_status", ["status"]),


  matchStates: defineTable({
    matchSlug: v.string(),
    game: v.union(v.literal("chess"), v.literal("go19"), v.literal("checkers")),
    board: v.any(),
    toMove: v.union(v.literal("b"), v.literal("w")),
    moveCount: v.number(),
    lastMove: v.optional(v.any()),
    notationHistory: v.array(v.string()),
    capturesB: v.number(),
    capturesW: v.number(),
    winProbB: v.number(),
    phase: v.union(
      v.literal("opening"),
      v.literal("midgame"),
      v.literal("endgame"),
      v.literal("finished"),
    ),
    result: v.optional(v.union(v.literal("b"), v.literal("w"), v.literal("draw"))),
    lastMoveAt: v.number(),
  }).index("by_slug", ["matchSlug"]),

  agents: defineTable({
    slug: v.string(),
    handle: v.string(),
    author: v.string(),
    elo: v.number(),
    wins: v.number(),
    loss: v.number(),
    size: v.number(),
    glyph: v.string(),
    color: v.string(),
    personality: v.string(),
    streak: v.number(),
    hot: v.boolean(),
    bio: v.string(),
  }).index("by_slug", ["slug"]).index("by_elo", ["elo"]),

  games: defineTable({
    slug: v.string(),
    name: v.string(),
    short: v.string(),
    size: v.number(),
    notation: v.string(),
  }).index("by_slug", ["slug"]),

  matches: defineTable({
    slug: v.string(),
    game: v.string(),
    a: v.string(),
    b: v.string(),
    move: v.number(),
    viewers: v.number(),
    status: v.string(),
    phase: v.string(),
    winProb: v.number(),
  }).index("by_slug", ["slug"]).index("by_status", ["status"]),

  highlights: defineTable({
    when: v.string(),
    title: v.string(),
    tag: v.string(),
    delta: v.string(),
    color: v.string(),
    order: v.number(),
  }),

  chatMessages: defineTable({
    userId: v.optional(v.id("users")),
    user: v.string(),
    tier: v.string(),
    msg: v.string(),
    time: v.string(),
    order: v.number(),
    source: v.optional(v.union(v.literal("seed"), v.literal("human"), v.literal("ai"))),
    createdAt: v.optional(v.number()),
  }).index("by_order", ["order"]),

  tickerItems: defineTable({
    text: v.string(),
    order: v.number(),
  }),

  bracketMatches: defineTable({
    round: v.string(),
    roundOrder: v.number(),
    matchOrder: v.number(),
    a: v.string(),
    b: v.string(),
    score: v.string(),
    winner: v.union(v.string(), v.null()),
    status: v.string(),
  }),

  profileMatches: defineTable({
    agentSlug: v.string(),
    opp: v.string(),
    game: v.string(),
    result: v.string(),
    score: v.string(),
    date: v.string(),
    pnl: v.optional(v.union(v.number(), v.null())),
    stake: v.optional(v.number()),
    order: v.number(),
  }).index("by_agent", ["agentSlug"]),

  featured: defineTable({
    key: v.string(),
    data: v.any(),
  }).index("by_key", ["key"]),

  submissions: defineTable({
    handle: v.string(),
    author: v.string(),
    game: v.union(v.literal("chess"), v.literal("go19"), v.literal("checkers")),
    glyph: v.string(),
    color: v.string(),
    personality: v.string(),
    bio: v.string(),
    code: v.string(),
    sizeKb: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    submittedAt: v.string(),
  }).index("by_status", ["status"]).index("by_handle_game", ["handle", "game"]),
});
