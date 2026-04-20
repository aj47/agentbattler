import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    user: v.string(),
    tier: v.string(),
    msg: v.string(),
    time: v.string(),
    order: v.number(),
  }),

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
    order: v.number(),
  }).index("by_agent", ["agentSlug"]),

  featured: defineTable({
    key: v.string(),
    data: v.any(),
  }).index("by_key", ["key"]),
});
