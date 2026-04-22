import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

const MAX_BENCHMARK_ARTIFACT_BYTES = 25 * 1024 * 1024;

type BenchmarkUploadMetadata = {
  runId: string;
  status: string;
  generatedAt: string;
  gamesPlayed: number;
  verifiedAgents: number;
  referenceAgents: number;
  artifactName: string;
  storageSha256: string;
  repository?: string;
  githubRunId?: string;
  githubSha?: string;
  githubRef?: string;
  workflowUrl?: string;
  runDetailPath?: string;
};

type GenerationUploadMetadata = {
  generationId: string;
  agentSlug: string;
  status: string;
  generatedAt: string;
  auggieModel: string;
  timeoutMinutes: number;
  artifactName: string;
  storageSha256: string;
  sourceSizeBytes?: number;
  repository?: string;
  githubRunId?: string;
  githubSha?: string;
  githubRef?: string;
  workflowUrl?: string;
  promptPath?: string;
  transcriptPath?: string;
  sourcePath?: string;
};

http.route({
  path: "/bench/upload",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const expectedToken = process.env.BENCH_UPLOAD_TOKEN;
    if (!expectedToken) {
      return json({ error: "BENCH_UPLOAD_TOKEN is not configured" }, 503);
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${expectedToken}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    const metadata = parseMetadata(req.headers.get("x-benchmark-metadata"));
    if (!metadata.ok) return json({ error: metadata.error }, 400);

    const bytes = await req.bytes();
    if (bytes.byteLength === 0) return json({ error: "Artifact body is empty" }, 400);
    if (bytes.byteLength > MAX_BENCHMARK_ARTIFACT_BYTES) {
      return json({ error: "Artifact body exceeds 25MB limit" }, 413);
    }

    const contentType = req.headers.get("content-type") ?? "application/octet-stream";
    const storageId = await ctx.storage.store(new Blob([bytes], { type: contentType }));

    const upload = metadata.value;
    const mutationArgs = {
      runId: upload.runId,
      status: upload.status,
      generatedAt: upload.generatedAt,
      gamesPlayed: upload.gamesPlayed,
      verifiedAgents: upload.verifiedAgents,
      referenceAgents: upload.referenceAgents,
      artifactName: upload.artifactName,
      storageSha256: upload.storageSha256,
      repository: upload.repository,
      githubRunId: upload.githubRunId,
      githubSha: upload.githubSha,
      githubRef: upload.githubRef,
      workflowUrl: upload.workflowUrl,
      runDetailPath: upload.runDetailPath,
      storageId,
      storageSizeBytes: bytes.byteLength,
      contentType,
      uploadedAt: Date.now(),
    };

    const id = await ctx.runMutation(internal.benchmarks.recordUploadedRun, mutationArgs);
    return json({ ok: true, id, storageId, bytes: bytes.byteLength });
  }),
});

http.route({
  path: "/bench/generation/upload",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const expectedToken = process.env.BENCH_UPLOAD_TOKEN;
    if (!expectedToken) {
      return json({ error: "BENCH_UPLOAD_TOKEN is not configured" }, 503);
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${expectedToken}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    const metadata = parseGenerationMetadata(req.headers.get("x-benchmark-metadata"));
    if (!metadata.ok) return json({ error: metadata.error }, 400);

    const bytes = await req.bytes();
    if (bytes.byteLength === 0) return json({ error: "Artifact body is empty" }, 400);
    if (bytes.byteLength > MAX_BENCHMARK_ARTIFACT_BYTES) {
      return json({ error: "Artifact body exceeds 25MB limit" }, 413);
    }

    const contentType = req.headers.get("content-type") ?? "application/octet-stream";
    const storageId = await ctx.storage.store(new Blob([bytes], { type: contentType }));

    const upload = metadata.value;
    const mutationArgs = {
      generationId: upload.generationId,
      agentSlug: upload.agentSlug,
      status: upload.status,
      generatedAt: upload.generatedAt,
      auggieModel: upload.auggieModel,
      timeoutMinutes: upload.timeoutMinutes,
      artifactName: upload.artifactName,
      storageSha256: upload.storageSha256,
      sourceSizeBytes: upload.sourceSizeBytes,
      repository: upload.repository,
      githubRunId: upload.githubRunId,
      githubSha: upload.githubSha,
      githubRef: upload.githubRef,
      workflowUrl: upload.workflowUrl,
      promptPath: upload.promptPath,
      transcriptPath: upload.transcriptPath,
      sourcePath: upload.sourcePath,
      storageId,
      storageSizeBytes: bytes.byteLength,
      contentType,
      uploadedAt: Date.now(),
    };

    const id = await ctx.runMutation(internal.benchmarks.recordUploadedGeneration, mutationArgs);
    return json({ ok: true, id, storageId, bytes: bytes.byteLength });
  }),
});

export default http;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parseMetadata(encoded: string | null):
  | { ok: true; value: BenchmarkUploadMetadata }
  | { ok: false; error: string } {
  if (!encoded) return { ok: false, error: "Missing X-Benchmark-Metadata header" };

  try {
    const metadata = JSON.parse(decodeBase64(encoded)) as Partial<BenchmarkUploadMetadata>;
    const requiredStrings = [
      "runId",
      "status",
      "generatedAt",
      "artifactName",
      "storageSha256",
    ] as const;
    for (const field of requiredStrings) {
      if (typeof metadata[field] !== "string" || metadata[field]!.length === 0) {
        return { ok: false, error: `Invalid or missing metadata field: ${field}` };
      }
    }

    for (const field of ["gamesPlayed", "verifiedAgents", "referenceAgents"] as const) {
      if (typeof metadata[field] !== "number" || !Number.isFinite(metadata[field])) {
        return { ok: false, error: `Invalid or missing metadata field: ${field}` };
      }
    }

    return { ok: true, value: metadata as BenchmarkUploadMetadata };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid metadata" };
  }
}

function parseGenerationMetadata(encoded: string | null):
  | { ok: true; value: GenerationUploadMetadata }
  | { ok: false; error: string } {
  if (!encoded) return { ok: false, error: "Missing X-Benchmark-Metadata header" };

  try {
    const metadata = JSON.parse(decodeBase64(encoded)) as Partial<GenerationUploadMetadata>;
    const requiredStrings = [
      "generationId",
      "agentSlug",
      "status",
      "generatedAt",
      "auggieModel",
      "artifactName",
      "storageSha256",
    ] as const;
    for (const field of requiredStrings) {
      if (typeof metadata[field] !== "string" || metadata[field]!.length === 0) {
        return { ok: false, error: `Invalid or missing metadata field: ${field}` };
      }
    }

    if (typeof metadata.timeoutMinutes !== "number" || !Number.isFinite(metadata.timeoutMinutes)) {
      return { ok: false, error: "Invalid or missing metadata field: timeoutMinutes" };
    }
    if (metadata.sourceSizeBytes !== undefined && !Number.isFinite(metadata.sourceSizeBytes)) {
      return { ok: false, error: "Invalid metadata field: sourceSizeBytes" };
    }

    return { ok: true, value: metadata as GenerationUploadMetadata };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid metadata" };
  }
}

function decodeBase64(encoded: string) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
