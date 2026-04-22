import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const recordUploadedRun = internalMutation({
  args: {
    runId: v.string(),
    status: v.string(),
    generatedAt: v.string(),
    gamesPlayed: v.number(),
    verifiedAgents: v.number(),
    referenceAgents: v.number(),
    artifactName: v.string(),
    storageId: v.id("_storage"),
    storageSha256: v.string(),
    storageSizeBytes: v.number(),
    contentType: v.string(),
    uploadedAt: v.number(),
    repository: v.optional(v.string()),
    githubRunId: v.optional(v.string()),
    githubSha: v.optional(v.string()),
    githubRef: v.optional(v.string()),
    workflowUrl: v.optional(v.string()),
    runDetailPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("benchmarkRuns")
      .withIndex("by_runId", (q) => q.eq("runId", args.runId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("benchmarkRuns", args);
  },
});

export const latestBenchmarkRun = query({
  args: {},
  handler: async (ctx) => {
    const run = await ctx.db
      .query("benchmarkRuns")
      .withIndex("by_uploadedAt")
      .order("desc")
      .first();
    if (!run) return null;

    const artifactUrl = await ctx.storage.getUrl(run.storageId);
    return { ...run, artifactUrl };
  },
});

export const recentBenchmarkRuns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const capped = Math.max(1, Math.min(limit ?? 20, 50));
    const runs = await ctx.db
      .query("benchmarkRuns")
      .withIndex("by_uploadedAt")
      .order("desc")
      .take(capped);

    return await Promise.all(
      runs.map(async (run) => ({
        ...run,
        artifactUrl: await ctx.storage.getUrl(run.storageId),
      })),
    );
  },
});

export const recordUploadedGeneration = internalMutation({
  args: {
    generationId: v.string(),
    agentSlug: v.string(),
    status: v.string(),
    generatedAt: v.string(),
    auggieModel: v.string(),
    timeoutMinutes: v.number(),
    artifactName: v.string(),
    storageId: v.id("_storage"),
    storageSha256: v.string(),
    storageSizeBytes: v.number(),
    contentType: v.string(),
    uploadedAt: v.number(),
    sourceSizeBytes: v.optional(v.number()),
    repository: v.optional(v.string()),
    githubRunId: v.optional(v.string()),
    githubSha: v.optional(v.string()),
    githubRef: v.optional(v.string()),
    workflowUrl: v.optional(v.string()),
    promptPath: v.optional(v.string()),
    transcriptPath: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("benchmarkGenerationRuns")
      .withIndex("by_generationId", (q) => q.eq("generationId", args.generationId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("benchmarkGenerationRuns", args);
  },
});

export const recentGenerationRuns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const capped = Math.max(1, Math.min(limit ?? 10, 25));
    const runs = await ctx.db
      .query("benchmarkGenerationRuns")
      .withIndex("by_uploadedAt")
      .order("desc")
      .take(capped);

    return await Promise.all(
      runs.map(async (run) => ({
        ...run,
        artifactUrl: await ctx.storage.getUrl(run.storageId),
      })),
    );
  },
});