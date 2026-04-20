export type CheckersDisc = { x: number; y: number; c: "r" | "b"; k: boolean };
export type CheckersMove = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  captures?: { x: number; y: number }[];
};

export function initCheckersBoard(): CheckersDisc[] {
  const discs: CheckersDisc[] = [];
  // Black discs: rows 0-2, dark squares
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 1) discs.push({ x, y, c: "b", k: false });
    }
  }
  // Red discs: rows 5-7, dark squares
  for (let y = 5; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 1) discs.push({ x, y, c: "r", k: false });
    }
  }
  return discs;
}

function at(discs: CheckersDisc[], x: number, y: number): CheckersDisc | undefined {
  return discs.find(d => d.x === x && d.y === y);
}

function jumpsFor(discs: CheckersDisc[], disc: CheckersDisc): CheckersMove[] {
  const opp = disc.c === "r" ? "b" : "r";
  const dirs = disc.k
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : disc.c === "r"
    ? [[-1, -1], [-1, 1]]
    : [[1, -1], [1, 1]];
  const result: CheckersMove[] = [];
  for (const [dy, dx] of dirs) {
    const mx = disc.x + dx, my = disc.y + dy;
    const lx = disc.x + dx * 2, ly = disc.y + dy * 2;
    if (lx < 0 || lx >= 8 || ly < 0 || ly >= 8) continue;
    const mid = at(discs, mx, my);
    if (mid && mid.c === opp && !at(discs, lx, ly)) {
      result.push({
        from: { x: disc.x, y: disc.y },
        to: { x: lx, y: ly },
        captures: [{ x: mx, y: my }],
      });
    }
  }
  return result;
}

export function getCheckersMoves(discs: CheckersDisc[], color: "r" | "b"): CheckersMove[] {
  const mine = discs.filter(d => d.c === color);

  // Mandatory jumps
  const jumps: CheckersMove[] = [];
  for (const disc of mine) jumps.push(...jumpsFor(discs, disc));
  if (jumps.length > 0) return jumps;

  // Regular moves
  const moves: CheckersMove[] = [];
  for (const disc of mine) {
    const dirs = disc.k
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : disc.c === "r"
      ? [[-1, -1], [-1, 1]]
      : [[1, -1], [1, 1]];
    for (const [dy, dx] of dirs) {
      const tx = disc.x + dx, ty = disc.y + dy;
      if (tx >= 0 && tx < 8 && ty >= 0 && ty < 8 && !at(discs, tx, ty)) {
        moves.push({ from: { x: disc.x, y: disc.y }, to: { x: tx, y: ty } });
      }
    }
  }
  return moves;
}

export function applyCheckersMove(discs: CheckersDisc[], move: CheckersMove): CheckersDisc[] {
  let next = discs.map(d => ({ ...d }));
  if (move.captures) {
    for (const cap of move.captures) {
      next = next.filter(d => !(d.x === cap.x && d.y === cap.y));
    }
  }
  const disc = next.find(d => d.x === move.from.x && d.y === move.from.y);
  if (disc) {
    disc.x = move.to.x;
    disc.y = move.to.y;
    if (disc.c === "r" && disc.y === 0) disc.k = true;
    if (disc.c === "b" && disc.y === 7) disc.k = true;
  }
  return next;
}

export function getCheckersAIMove(discs: CheckersDisc[], color: "r" | "b"): CheckersMove | null {
  const moves = getCheckersMoves(discs, color);
  if (moves.length === 0) return null;
  // Prefer captures
  const caps = moves.filter(m => m.captures && m.captures.length > 0);
  if (caps.length > 0) return caps[Math.floor(Math.random() * caps.length)];
  return moves[Math.floor(Math.random() * moves.length)];
}

export function getCheckersWinner(discs: CheckersDisc[]): "r" | "b" | null {
  const hasR = discs.some(d => d.c === "r");
  const hasB = discs.some(d => d.c === "b");
  if (!hasR) return "b";
  if (!hasB) return "r";
  if (getCheckersMoves(discs, "r").length === 0) return "b";
  if (getCheckersMoves(discs, "b").length === 0) return "r";
  return null;
}

export function checkersWinProbB(discs: CheckersDisc[]): number {
  const r = discs.filter(d => d.c === "r").length;
  const b = discs.filter(d => d.c === "b").length;
  // "b" team maps to match-state's "b" player
  return b / (b + r + 0.001);
}
