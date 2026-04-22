// Static validation for submitted agent source code.
// Matches the banned-API set used by the benchmark runner at bench/runner/config.mjs
// so a submission that passes here will also pass the benchmark.

export const BANNED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\brequire\s*\(/, reason: "require() is not allowed" },
  { pattern: /\bimport\s*\(/, reason: "dynamic import() is not allowed" },
  { pattern: /^\s*import\s[^;]+from\s/m, reason: "import statements are not allowed" },
  { pattern: /\bprocess\b/, reason: "process is not allowed" },
  { pattern: /\bchild_process\b/, reason: "child_process is not allowed" },
  { pattern: /\bworker_threads\b/, reason: "worker_threads is not allowed" },
  { pattern: /\bfs\s*[.:]/, reason: "fs is not allowed" },
  { pattern: /\bfetch\s*\(/, reason: "fetch is not allowed" },
  { pattern: /\bWebSocket\b/, reason: "WebSocket is not allowed" },
  { pattern: /\bXMLHttpRequest\b/, reason: "XMLHttpRequest is not allowed" },
  { pattern: /\beval\s*\(/, reason: "eval is not allowed" },
  { pattern: /\bFunction\s*\(/, reason: "Function constructor is not allowed" },
  { pattern: /\b__proto__\b/, reason: "__proto__ access is not allowed" },
];

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function validateAgentSource(code: string): ValidationResult {
  if (!code || !code.trim()) return { ok: false, reason: "Source is empty" };
  const bytes = new TextEncoder().encode(code).length;
  if (bytes > 50 * 1024) return { ok: false, reason: "Source exceeds 50kb" };

  for (const { pattern, reason } of BANNED_PATTERNS) {
    if (pattern.test(code)) return { ok: false, reason };
  }

  // Must expose an act function (default export or named).
  const hasActFn =
    /export\s+default\s+function\s+act\b/.test(code) ||
    /export\s+default\s+\(/.test(code) ||
    /export\s+default\s+function\s*\(/.test(code) ||
    /export\s+default\s+async\s+function/.test(code) ||
    /export\s+default\s+[a-zA-Z_$]/.test(code) ||
    /function\s+act\s*\(/.test(code);
  if (!hasActFn) {
    return { ok: false, reason: "Must export default function act(state) { ... }" };
  }

  return { ok: true };
}
