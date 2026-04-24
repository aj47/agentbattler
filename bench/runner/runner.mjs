import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BANNED_PATTERNS, MAX_CAPTURE_BYTES, MOVE_TIMEOUT_MS, SOURCE_LIMIT_BYTES } from "./config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "../..");

export async function loadAgents(manifestPath = "bench/agents.json") {
  const resolvedPath = path.isAbsolute(manifestPath) ? manifestPath : path.join(repoRoot, manifestPath);
  const manifest = JSON.parse(await readFile(resolvedPath, "utf8"));
  return manifest.agents ?? [];
}

export async function validateAgent(agent) {
  const absPath = path.join(repoRoot, agent.path);
  const source = await readFile(absPath, "utf8");
  const sizeBytes = Buffer.byteLength(source, "utf8");
  const violations = [];

  if (!agent.path.endsWith(".js")) violations.push("agent must be a .js file");
  if (sizeBytes > SOURCE_LIMIT_BYTES) violations.push(`source exceeds ${SOURCE_LIMIT_BYTES} bytes`);

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.regex.test(source)) violations.push(`banned API: ${pattern.label}`);
  }

  return { agentSlug: agent.slug, path: agent.path, sizeBytes, ok: violations.length === 0, violations };
}

export function isUciMove(value) {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(value);
}

export function runAgentMove(agent, fen, timeoutMs = MOVE_TIMEOUT_MS) {
  const absPath = path.join(repoRoot, agent.path);
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(process.execPath, [absPath], {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" }
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (status, extra = {}) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!child.killed) child.kill("SIGKILL");
      const firstLine = stdout.split(/\r?\n/).map(s => s.trim()).find(Boolean) ?? "";
      resolve({
        agentSlug: agent.slug,
        status,
        move: firstLine,
        legalShape: isUciMove(firstLine),
        runtimeMs: Date.now() - startedAt,
        stdout: stdout.slice(0, MAX_CAPTURE_BYTES),
        stderr: stderr.slice(0, MAX_CAPTURE_BYTES),
        ...extra
      });
    };

    const timer = setTimeout(() => finish("timeout"), timeoutMs);

    child.stdout.on("data", chunk => {
      stdout += chunk.toString();
      if (stdout.length > MAX_CAPTURE_BYTES) stdout = stdout.slice(0, MAX_CAPTURE_BYTES);
      if (/\r?\n/.test(stdout)) finish("ok");
    });
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
      if (stderr.length > MAX_CAPTURE_BYTES) stderr = stderr.slice(0, MAX_CAPTURE_BYTES);
    });
    child.on("error", error => finish("spawn_error", { error: error.message }));
    child.on("exit", code => {
      if (!settled) finish(code === 0 ? "ok" : "exit", { exitCode: code });
    });

    child.stdin.end(`${fen}\n`);
  });
}
