export type GoBoard = Array<Array<0 | 1 | 2>>;
export type GoMove = { x: number; y: number } | null; // null = pass

export function initGoBoard(): GoBoard {
  return Array.from({ length: 19 }, () => new Array(19).fill(0) as Array<0 | 1 | 2>);
}

function nb(x: number, y: number): [number, number][] {
  const r: [number, number][] = [];
  if (x > 0) r.push([x - 1, y]);
  if (x < 18) r.push([x + 1, y]);
  if (y > 0) r.push([x, y - 1]);
  if (y < 18) r.push([x, y + 1]);
  return r;
}

function getGroup(board: GoBoard, x: number, y: number): Array<[number, number]> {
  const color = board[y][x];
  if (!color) return [];
  const visited = new Set<number>();
  const result: Array<[number, number]> = [];
  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    const key = cy * 19 + cx;
    if (visited.has(key)) continue;
    visited.add(key);
    result.push([cx, cy]);
    for (const [nx, ny] of nb(cx, cy)) {
      if (board[ny][nx] === color && !visited.has(ny * 19 + nx)) stack.push([nx, ny]);
    }
  }
  return result;
}

function hasLiberties(board: GoBoard, group: Array<[number, number]>): boolean {
  for (const [x, y] of group) {
    for (const [nx, ny] of nb(x, y)) {
      if (!board[ny][nx]) return true;
    }
  }
  return false;
}

export function applyGoMove(
  board: GoBoard,
  x: number,
  y: number,
  color: 1 | 2,
): { board: GoBoard; captures: number } {
  const next = board.map(row => [...row]) as GoBoard;
  next[y][x] = color;
  const opp = color === 1 ? 2 : 1;
  let captures = 0;
  for (const [nx, ny] of nb(x, y)) {
    if (next[ny][nx] === opp) {
      const grp = getGroup(next, nx, ny);
      if (!hasLiberties(next, grp)) {
        for (const [gx, gy] of grp) {
          next[gy][gx] = 0;
          captures++;
        }
      }
    }
  }
  return { board: next, captures };
}

function isSuicide(board: GoBoard, x: number, y: number, color: 1 | 2): boolean {
  const { board: after } = applyGoMove(board, x, y, color);
  return !hasLiberties(after, getGroup(after, x, y));
}

export function getGoAIMove(board: GoBoard, color: 1 | 2, moveCount: number): GoMove {
  // Pass when board is too full or late game
  const total = countGoStones(board).b + countGoStones(board).w;
  if (total > 300 || moveCount > 280) return null;

  const opp = color === 1 ? 2 : 1;
  const candidates: Array<[number, number, number]> = [];

  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      if (board[y][x] !== 0) continue;
      if (isSuicide(board, x, y, color)) continue;

      let score = 1;

      // Bonus for capturing opponent stones
      for (const [nx, ny] of nb(x, y)) {
        if (board[ny][nx] === opp) {
          const grp = getGroup(board, nx, ny);
          const libs = grp.flatMap(([gx, gy]) => nb(gx, gy).filter(([fx, fy]) => !board[fy][fx]));
          if (libs.length <= 1) score += grp.length * 15; // atari or capture
        }
      }

      // Bonus for moves adjacent to own stones (build groups)
      for (const [nx, ny] of nb(x, y)) {
        if (board[ny][nx] === color) score += 2;
      }

      // Star points in opening
      if (total < 50 && [3, 9, 15].includes(x) && [3, 9, 15].includes(y)) score += 8;

      // 3rd/4th line bonus in early-mid game
      if (total < 120) {
        const edge = Math.min(x, 18 - x, y, 18 - y);
        if (edge === 2 || edge === 3) score += 3;
      }

      candidates.push([x, y, score]);
    }
  }

  if (candidates.length === 0) return null;

  // Weighted random
  const totalScore = candidates.reduce((s, [, , sc]) => s + sc, 0);
  let r = Math.random() * totalScore;
  for (const [x, y, sc] of candidates) {
    r -= sc;
    if (r <= 0) return { x, y };
  }
  const last = candidates[candidates.length - 1];
  return { x: last[0], y: last[1] };
}

export function countGoStones(board: GoBoard): { b: number; w: number } {
  let b = 0, w = 0;
  for (const row of board) for (const cell of row) { if (cell === 1) b++; else if (cell === 2) w++; }
  return { b, w };
}

export function boardToStones(board: GoBoard): Array<{ x: number; y: number; c: "b" | "w" }> {
  const stones: Array<{ x: number; y: number; c: "b" | "w" }> = [];
  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      if (board[y][x] === 1) stones.push({ x, y, c: "b" });
      else if (board[y][x] === 2) stones.push({ x, y, c: "w" });
    }
  }
  return stones;
}

export function estimateGoWinProb(board: GoBoard): number {
  const { b, w } = countGoStones(board);
  const komi = 6.5;
  const diff = b - w - komi;
  return 0.5 + (diff / (Math.abs(diff) + 50)) * 0.45;
}

const COL_LETTERS = "ABCDEFGHJKLMNOPQRST";
export function goMoveNotation(x: number, y: number, color: "b" | "w"): string {
  return `${color === "b" ? "B" : "W"}[${COL_LETTERS[x]}${19 - y}]`;
}
