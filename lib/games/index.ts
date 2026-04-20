import {
  getGoAIMove,
  applyGoMove,
  boardToStones,
  estimateGoWinProb,
  countGoStones,
  initGoBoard,
  goMoveNotation,
} from "./go";
import {
  getChessAIMove,
  applyChessMove,
  boardToFen,
  getChessWinner,
  estimateChessWinProb,
  chessMoveNotation,
  INITIAL_CHESS_BOARD,
} from "./chess";
import {
  getCheckersAIMove,
  applyCheckersMove,
  getCheckersWinner,
  checkersWinProbB,
  initCheckersBoard,
} from "./checkers";
import type { GoBoard } from "./go";
import type { ChessBoard } from "./chess";
import type { CheckersDisc } from "./checkers";

export type GameState = {
  game: "go19" | "chess" | "checkers";
  board: unknown;
  toMove: "b" | "w";
  moveCount: number;
  capturesB: number;
  capturesW: number;
  winProbB: number;
  phase: "opening" | "midgame" | "endgame" | "finished";
  result?: "b" | "w" | "draw";
  lastMove?: unknown;
};

export type MoveResult = {
  newBoard: unknown;
  move: unknown;
  toMove: "b" | "w";
  capturesB: number;
  capturesW: number;
  winProbB: number;
  phase: "opening" | "midgame" | "endgame" | "finished";
  result?: "b" | "w" | "draw";
  notation: string;
};

export function getInitialBoard(game: "go19" | "chess" | "checkers"): unknown {
  if (game === "go19") return initGoBoard();
  if (game === "chess") return INITIAL_CHESS_BOARD;
  return initCheckersBoard();
}

export function computeNextMove(state: GameState): MoveResult {
  const { game, board, toMove, moveCount, capturesB, capturesW } = state;
  const nextTurn: "b" | "w" = toMove === "b" ? "w" : "b";

  if (game === "go19") {
    const b = board as GoBoard;
    const color: 1 | 2 = toMove === "b" ? 1 : 2;
    const move = getGoAIMove(b, color, moveCount);

    if (!move) {
      const winProb = estimateGoWinProb(b);
      return {
        newBoard: b,
        move: { pass: true, c: toMove },
        toMove: nextTurn,
        capturesB,
        capturesW,
        winProbB: winProb,
        phase: "finished",
        result: winProb > 0.5 ? "b" : "w",
        notation: toMove === "b" ? "B[tt]" : "W[tt]",
      };
    }

    const { board: newBoard, captures } = applyGoMove(b, move.x, move.y, color);
    const newCapturesB = capturesB + (toMove === "b" ? captures : 0);
    const newCapturesW = capturesW + (toMove === "w" ? captures : 0);
    const winProb = estimateGoWinProb(newBoard);
    const total = countGoStones(newBoard).b + countGoStones(newBoard).w;
    const phase: GameState["phase"] =
      total < 40 ? "opening" : total < 160 ? "midgame" : "endgame";

    return {
      newBoard,
      move: { x: move.x, y: move.y, c: toMove },
      toMove: nextTurn,
      capturesB: newCapturesB,
      capturesW: newCapturesW,
      winProbB: winProb,
      phase,
      notation: goMoveNotation(move.x, move.y, toMove),
    };
  }

  if (game === "chess") {
    const b = board as ChessBoard;
    const color = toMove === "b" ? "b" : "w";
    const move = getChessAIMove(b, color as "w" | "b");

    if (!move || moveCount > 280) {
      return {
        newBoard: b,
        move: null,
        toMove: nextTurn,
        capturesB,
        capturesW,
        winProbB: 0.5,
        phase: "finished",
        result: "draw",
        notation: "1/2-1/2",
      };
    }

    const notation = chessMoveNotation(b, move);
    const capturedPiece = b[move.tr][move.tc];
    const newBoard = applyChessMove(b, move);
    const winner = getChessWinner(newBoard);
    const winProb = estimateChessWinProb(newBoard);
    const phase: GameState["phase"] =
      moveCount < 20 ? "opening" : moveCount < 60 ? "midgame" : "endgame";

    // Track material value of captured piece (pawn=1, N/B=3, R=5, Q=9)
    const matVal: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, P: 1, N: 3, B: 3, R: 5, Q: 9 };
    const capVal = capturedPiece ? (matVal[capturedPiece] ?? 0) : 0;
    const newCapturesB = capturesB + (color === "b" ? capVal : 0);
    const newCapturesW = capturesW + (color === "w" ? capVal : 0);

    return {
      newBoard,
      move,
      toMove: nextTurn,
      capturesB: newCapturesB,
      capturesW: newCapturesW,
      winProbB: winner === "b" ? 1 : winner === "w" ? 0 : winProb,
      phase: winner ? "finished" : phase,
      result: winner ?? undefined,
      notation,
    };
  }

  // checkers
  const discs = board as CheckersDisc[];
  // match-state "b" = disc color "b", match-state "w" = disc color "r"
  const discColor: "r" | "b" = toMove === "w" ? "r" : "b";
  const move = getCheckersAIMove(discs, discColor);

  if (!move) {
    return {
      newBoard: discs,
      move: null,
      toMove: nextTurn,
      capturesB,
      capturesW,
      winProbB: 0.5,
      phase: "finished",
      result: toMove === "b" ? "w" : "b", // current player loses (no moves)
      notation: "0-0",
    };
  }

  const newDiscs = applyCheckersMove(discs, move);
  const winner = getCheckersWinner(newDiscs);
  const winProb = checkersWinProbB(newDiscs);
  const phase: GameState["phase"] =
    moveCount < 10 ? "opening" : moveCount < 35 ? "midgame" : "endgame";

  const capCount = move.captures?.length ?? 0;
  const newCapturesB = capturesB + (toMove === "b" && capCount > 0 ? capCount : 0);
  const newCapturesW = capturesW + (toMove === "w" && capCount > 0 ? capCount : 0);

  return {
    newBoard: newDiscs,
    move,
    toMove: nextTurn,
    capturesB: newCapturesB,
    capturesW: newCapturesW,
    winProbB: winner === "b" ? 1 : winner === "r" ? 0 : winProb,
    phase: winner ? "finished" : phase,
    result: winner === "b" ? "b" : winner === "r" ? "w" : undefined,
    notation: `${move.from.x}${move.from.y}-${move.to.x}${move.to.y}`,
  };
}

// Re-export board converters for the match page
export { boardToStones, boardToFen };
export type { GoBoard, ChessBoard, CheckersDisc };
