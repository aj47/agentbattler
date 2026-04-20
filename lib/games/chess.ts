export type ChessBoard = string[][];
export type ChessMove = { fr: number; fc: number; tr: number; tc: number; promo?: string };

export const INITIAL_CHESS_BOARD: ChessBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

function isW(p: string) { return p !== "" && p === p.toUpperCase(); }
function isB(p: string) { return p !== "" && p === p.toLowerCase(); }
function inB(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

export function getChessMoves(board: ChessBoard, color: "w" | "b"): ChessMove[] {
  const moves: ChessMove[] = [];
  const own = color === "w" ? isW : isB;
  const opp = color === "w" ? isB : isW;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || !own(p)) continue;
      const t = p.toUpperCase();

      if (t === "P") {
        const dir = color === "w" ? -1 : 1;
        const start = color === "w" ? 6 : 1;
        const promoRow = color === "w" ? 0 : 7;

        if (inB(r + dir, c) && !board[r + dir][c]) {
          const tr = r + dir;
          if (tr === promoRow) {
            moves.push({ fr: r, fc: c, tr, tc: c, promo: color === "w" ? "Q" : "q" });
          } else {
            moves.push({ fr: r, fc: c, tr, tc: c });
            if (r === start && !board[r + 2 * dir][c]) {
              moves.push({ fr: r, fc: c, tr: r + 2 * dir, tc: c });
            }
          }
        }
        for (const dc of [-1, 1]) {
          if (inB(r + dir, c + dc) && opp(board[r + dir][c + dc])) {
            const tr = r + dir;
            if (tr === promoRow) {
              moves.push({ fr: r, fc: c, tr, tc: c + dc, promo: color === "w" ? "Q" : "q" });
            } else {
              moves.push({ fr: r, fc: c, tr, tc: c + dc });
            }
          }
        }
      }

      if (t === "R" || t === "Q") {
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          for (let i = 1; i < 8; i++) {
            const [tr, tc] = [r + dr * i, c + dc * i];
            if (!inB(tr, tc) || own(board[tr][tc])) break;
            moves.push({ fr: r, fc: c, tr, tc });
            if (opp(board[tr][tc])) break;
          }
        }
      }

      if (t === "B" || t === "Q") {
        for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          for (let i = 1; i < 8; i++) {
            const [tr, tc] = [r + dr * i, c + dc * i];
            if (!inB(tr, tc) || own(board[tr][tc])) break;
            moves.push({ fr: r, fc: c, tr, tc });
            if (opp(board[tr][tc])) break;
          }
        }
      }

      if (t === "N") {
        for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
          const [tr, tc] = [r + dr, c + dc];
          if (inB(tr, tc) && !own(board[tr][tc])) moves.push({ fr: r, fc: c, tr, tc });
        }
      }

      if (t === "K") {
        for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
          const [tr, tc] = [r + dr, c + dc];
          if (inB(tr, tc) && !own(board[tr][tc])) moves.push({ fr: r, fc: c, tr, tc });
        }
      }
    }
  }
  return moves;
}

export function applyChessMove(board: ChessBoard, move: ChessMove): ChessBoard {
  const next = board.map(row => [...row]);
  const piece = next[move.fr][move.fc];
  next[move.tr][move.tc] = move.promo ?? piece;
  next[move.fr][move.fc] = "";
  return next;
}

export function boardToFen(board: ChessBoard): string {
  return board.map(row => {
    let s = "";
    let empty = 0;
    for (const cell of row) {
      if (!cell) { empty++; }
      else { if (empty) { s += empty; empty = 0; } s += cell; }
    }
    if (empty) s += empty;
    return s;
  }).join("/");
}

export function getChessWinner(board: ChessBoard): "b" | "w" | null {
  let hasK = false, hask = false;
  for (const row of board) for (const cell of row) {
    if (cell === "K") hasK = true;
    if (cell === "k") hask = true;
  }
  if (!hasK) return "b";
  if (!hask) return "w";
  return null;
}

export function estimateChessWinProb(board: ChessBoard): number {
  const val: Record<string, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
  let white = 0, black = 0;
  for (const row of board) for (const cell of row) {
    if (!cell) continue;
    const v = val[cell.toUpperCase()] ?? 0;
    if (isW(cell)) white += v; else black += v;
  }
  const diff = white - black;
  return 0.5 + (diff / (Math.abs(diff) + 20)) * 0.45;
}

export function getChessAIMove(board: ChessBoard, color: "w" | "b"): ChessMove | null {
  const moves = getChessMoves(board, color);
  if (moves.length === 0) return null;

  // Always prefer captures, especially queens/rooks
  const captures = moves.filter(m => board[m.tr][m.tc] !== "");
  if (captures.length > 0 && Math.random() > 0.25) {
    // Prefer high-value captures
    captures.sort((a, b) => {
      const val: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100, P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };
      return (val[board[b.tr][b.tc]] ?? 0) - (val[board[a.tr][a.tc]] ?? 0);
    });
    return captures[0];
  }

  return moves[Math.floor(Math.random() * moves.length)];
}

const FILES = "abcdefgh";
export function chessMoveNotation(board: ChessBoard, move: ChessMove): string {
  const piece = board[move.fr][move.fc].toUpperCase();
  const cap = board[move.tr][move.tc] ? "x" : "-";
  return `${piece === "P" ? "" : piece}${FILES[move.fc]}${8 - move.fr}${cap}${FILES[move.tc]}${8 - move.tr}${move.promo ? "=" + move.promo.toUpperCase() : ""}`;
}
