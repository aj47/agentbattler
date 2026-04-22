export const SOURCE_LIMIT_BYTES = 50 * 1024;
export const MOVE_TIMEOUT_MS = 5000;
export const MAX_CAPTURE_BYTES = 16 * 1024;
export const INITIAL_ELO = 1500;
export const ELO_K_FACTOR = 32;
export const GAMES_PER_COLOR = 2;
export const MAX_GAME_PLIES = 160;

export const SMOKE_FENS = [
  "rn1qkbnr/pppbpppp/3p4/8/8/2N5/PPPPPPPP/R1BQKBNR w KQkq - 0 1",
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
];

export const BANNED_PATTERNS = [
  { label: "child_process", regex: /(?:node:)?child_process/ },
  { label: "worker_threads", regex: /(?:node:)?worker_threads/ },
  { label: "cluster", regex: /require\s*\(\s*['\"](?:node:)?cluster['\"]\s*\)/ },
  { label: "network module", regex: /require\s*\(\s*['\"](?:node:)?(?:net|dgram|http|https|tls|dns)['\"]\s*\)/ },
  { label: "filesystem module", regex: /require\s*\(\s*['\"](?:node:)?fs(?:\/promises)?['\"]\s*\)/ },
  { label: "dynamic import", regex: /\bimport\s*\(/ },
  { label: "fetch", regex: /\bfetch\s*\(/ },
  { label: "WebSocket", regex: /\bWebSocket\b/ },
  { label: "eval", regex: /\beval\s*\(/ }
];