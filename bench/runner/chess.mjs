const FILES = "abcdefgh";
const PROMOTIONS = ["q", "r", "b", "n"];

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function clonePosition(pos) {
  return { ...pos, board: [...pos.board] };
}

function colorOf(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? "w" : "b";
}

function squareName(index) {
  return `${FILES[index % 8]}${8 - Math.floor(index / 8)}`;
}

function squareIndex(name) {
  const file = FILES.indexOf(name[0]);
  const rank = 8 - Number(name[1]);
  return file < 0 || rank < 0 || rank > 7 ? -1 : rank * 8 + file;
}

function onBoard(rank, file) {
  return rank >= 0 && rank < 8 && file >= 0 && file < 8;
}

export function parseFen(fen) {
  const [placement, turn = "w", castling = "-", ep = "-", halfmove = "0", fullmove = "1"] = fen.trim().split(/\s+/);
  const rows = placement.split("/");
  if (rows.length !== 8) throw new Error(`Invalid FEN rows: ${fen}`);

  const board = [];
  for (const row of rows) {
    for (const char of row) {
      if (/[1-8]/.test(char)) board.push(...Array(Number(char)).fill(null));
      else if (/[pnbrqkPNBRQK]/.test(char)) board.push(char);
      else throw new Error(`Invalid FEN piece: ${char}`);
    }
  }
  if (board.length !== 64) throw new Error(`Invalid FEN board width: ${fen}`);

  return {
    board,
    turn: turn === "b" ? "b" : "w",
    castling: castling === "-" ? "" : castling,
    ep,
    halfmove: Number(halfmove) || 0,
    fullmove: Number(fullmove) || 1
  };
}

export function toFen(pos) {
  const rows = [];
  for (let rank = 0; rank < 8; rank++) {
    let row = "";
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const piece = pos.board[rank * 8 + file];
      if (!piece) empty++;
      else {
        if (empty) row += String(empty);
        empty = 0;
        row += piece;
      }
    }
    rows.push(row + (empty ? String(empty) : ""));
  }
  return `${rows.join("/")} ${pos.turn} ${pos.castling || "-"} ${pos.ep || "-"} ${pos.halfmove} ${pos.fullmove}`;
}

function findKing(pos, color) {
  const king = color === "w" ? "K" : "k";
  return pos.board.findIndex(piece => piece === king);
}

export function isSquareAttacked(pos, square, byColor) {
  const rank = Math.floor(square / 8);
  const file = square % 8;
  const pawn = byColor === "w" ? "P" : "p";
  const pawnRank = rank + (byColor === "w" ? 1 : -1);
  for (const df of [-1, 1]) {
    const pf = file + df;
    if (onBoard(pawnRank, pf) && pos.board[pawnRank * 8 + pf] === pawn) return true;
  }

  const knight = byColor === "w" ? "N" : "n";
  for (const [dr, df] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
    const r = rank + dr, f = file + df;
    if (onBoard(r, f) && pos.board[r * 8 + f] === knight) return true;
  }

  const king = byColor === "w" ? "K" : "k";
  for (const [dr, df] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
    const r = rank + dr, f = file + df;
    if (onBoard(r, f) && pos.board[r * 8 + f] === king) return true;
  }

  const sliders = [
    { dirs: [[-1, 0], [1, 0], [0, -1], [0, 1]], pieces: byColor === "w" ? "RQ" : "rq" },
    { dirs: [[-1, -1], [-1, 1], [1, -1], [1, 1]], pieces: byColor === "w" ? "BQ" : "bq" }
  ];
  for (const { dirs, pieces } of sliders) {
    for (const [dr, df] of dirs) {
      let r = rank + dr, f = file + df;
      while (onBoard(r, f)) {
        const piece = pos.board[r * 8 + f];
        if (piece) {
          if (pieces.includes(piece)) return true;
          break;
        }
        r += dr; f += df;
      }
    }
  }
  return false;
}

export function isInCheck(pos, color = pos.turn) {
  const king = findKing(pos, color);
  return king < 0 || isSquareAttacked(pos, king, color === "w" ? "b" : "w");
}

function pushMove(moves, from, to, promotion = "") {
  moves.push(`${squareName(from)}${squareName(to)}${promotion}`);
}

function generatePseudoMoves(pos) {
  const moves = [];
  const us = pos.turn;
  const them = us === "w" ? "b" : "w";
  const epIndex = pos.ep && pos.ep !== "-" ? squareIndex(pos.ep) : -1;

  for (let from = 0; from < 64; from++) {
    const piece = pos.board[from];
    if (!piece || colorOf(piece) !== us) continue;
    const rank = Math.floor(from / 8), file = from % 8;
    const lower = piece.toLowerCase();

    if (lower === "p") {
      const dir = us === "w" ? -1 : 1;
      const startRank = us === "w" ? 6 : 1;
      const promoRank = us === "w" ? 0 : 7;
      const oneRank = rank + dir;
      if (onBoard(oneRank, file) && !pos.board[oneRank * 8 + file]) {
        const to = oneRank * 8 + file;
        if (oneRank === promoRank) PROMOTIONS.forEach(p => pushMove(moves, from, to, p));
        else pushMove(moves, from, to);
        const twoRank = rank + dir * 2;
        if (rank === startRank && !pos.board[twoRank * 8 + file]) pushMove(moves, from, twoRank * 8 + file);
      }
      for (const df of [-1, 1]) {
        const r = rank + dir, f = file + df;
        if (!onBoard(r, f)) continue;
        const to = r * 8 + f;
        const target = pos.board[to];
        if ((target && colorOf(target) === them) || to === epIndex) {
          if (r === promoRank) PROMOTIONS.forEach(p => pushMove(moves, from, to, p));
          else pushMove(moves, from, to);
        }
      }
      continue;
    }

    const leapDirs = lower === "n"
      ? [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
      : lower === "k" ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] : null;
    if (leapDirs) {
      for (const [dr, df] of leapDirs) {
        const r = rank + dr, f = file + df;
        if (!onBoard(r, f)) continue;
        const target = pos.board[r * 8 + f];
        if (!target || colorOf(target) === them) pushMove(moves, from, r * 8 + f);
      }
      if (lower === "k" && !isInCheck(pos, us)) addCastles(pos, moves, us);
      continue;
    }

    const dirs = lower === "b" ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : lower === "r" ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
      : [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, df] of dirs) {
      let r = rank + dr, f = file + df;
      while (onBoard(r, f)) {
        const target = pos.board[r * 8 + f];
        if (!target) pushMove(moves, from, r * 8 + f);
        else {
          if (colorOf(target) === them) pushMove(moves, from, r * 8 + f);
          break;
        }
        r += dr; f += df;
      }
    }
  }
  return moves;
}

function addCastles(pos, moves, us) {
  const them = us === "w" ? "b" : "w";
  const rank = us === "w" ? 7 : 0;
  const kingFrom = rank * 8 + 4;
  const rook = us === "w" ? "R" : "r";
  const rights = us === "w" ? ["K", "Q"] : ["k", "q"];
  if (pos.castling.includes(rights[0]) && pos.board[rank * 8 + 7] === rook && !pos.board[rank * 8 + 5] && !pos.board[rank * 8 + 6]
    && !isSquareAttacked(pos, rank * 8 + 5, them) && !isSquareAttacked(pos, rank * 8 + 6, them)) {
    pushMove(moves, kingFrom, rank * 8 + 6);
  }
  if (pos.castling.includes(rights[1]) && pos.board[rank * 8] === rook && !pos.board[rank * 8 + 1] && !pos.board[rank * 8 + 2] && !pos.board[rank * 8 + 3]
    && !isSquareAttacked(pos, rank * 8 + 2, them) && !isSquareAttacked(pos, rank * 8 + 3, them)) {
    pushMove(moves, kingFrom, rank * 8 + 2);
  }
}

function stripCastle(castling, chars) {
  return [...castling].filter(ch => !chars.includes(ch)).join("");
}

export function applyMove(pos, uci) {
  const next = clonePosition(pos);
  const from = squareIndex(uci.slice(0, 2));
  const to = squareIndex(uci.slice(2, 4));
  const promotion = uci[4] || "";
  const piece = next.board[from];
  const us = colorOf(piece);
  const target = next.board[to];
  const isPawn = piece?.toLowerCase() === "p";
  const isEp = isPawn && to === squareIndex(pos.ep) && !target && from % 8 !== to % 8;

  next.board[from] = null;
  if (isEp) next.board[to + (us === "w" ? 8 : -8)] = null;
  next.board[to] = promotion ? (us === "w" ? promotion.toUpperCase() : promotion) : piece;

  if (piece?.toLowerCase() === "k" && Math.abs(to - from) === 2) {
    const rank = us === "w" ? 7 : 0;
    if (to % 8 === 6) {
      next.board[rank * 8 + 5] = next.board[rank * 8 + 7];
      next.board[rank * 8 + 7] = null;
    } else {
      next.board[rank * 8 + 3] = next.board[rank * 8];
      next.board[rank * 8] = null;
    }
  }

  if (piece === "K") next.castling = stripCastle(next.castling, "KQ");
  if (piece === "k") next.castling = stripCastle(next.castling, "kq");
  for (const [sq, chars] of [["a1", "Q"], ["h1", "K"], ["a8", "q"], ["h8", "k"]]) {
    const idx = squareIndex(sq);
    if (from === idx || to === idx) next.castling = stripCastle(next.castling, chars);
  }

  next.ep = isPawn && Math.abs(to - from) === 16 ? squareName((from + to) / 2) : "-";
  next.halfmove = isPawn || target || isEp ? 0 : next.halfmove + 1;
  if (next.turn === "b") next.fullmove += 1;
  next.turn = next.turn === "w" ? "b" : "w";
  return next;
}

export function legalMoves(pos) {
  const us = pos.turn;
  return generatePseudoMoves(pos).filter(move => !isInCheck(applyMove(pos, move), us));
}

export function isLegalMove(pos, uci) {
  return legalMoves(pos).includes(uci);
}

export function gameStatus(pos) {
  if (pos.halfmove >= 100) return { over: true, result: "draw", reason: "fifty_move_rule" };
  const moves = legalMoves(pos);
  if (moves.length > 0) return { over: false, legalMoves: moves.length };
  if (isInCheck(pos, pos.turn)) return { over: true, result: pos.turn === "w" ? "black" : "white", reason: "checkmate" };
  return { over: true, result: "draw", reason: "stalemate" };
}