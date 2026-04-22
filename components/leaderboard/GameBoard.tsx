"use client";

import { Fragment } from "react";
import type { GameSlug } from "./data";

export function GameBoard({
  game,
  color = "#FFB547",
}: {
  game: GameSlug;
  color?: string;
}) {
  if (game === "chess") return <ChessBoardSVG color={color} />;
  if (game === "go19") return <GoBoardSVG color={color} />;
  if (game === "checkers") return <CheckersBoardSVG color={color} />;
  return <ChessBoardSVG color={color} />;
}

function ChessBoardSVG({ color }: { color: string }) {
  const pos: string[][] = [
    ["r", ".", ".", "q", ".", "r", "k", "."],
    ["p", "p", ".", ".", ".", "p", "p", "p"],
    [".", ".", "n", "p", ".", "n", ".", "."],
    [".", ".", "b", ".", "p", ".", ".", "."],
    [".", ".", "B", ".", "P", ".", ".", "."],
    [".", ".", "N", ".", ".", "N", ".", "."],
    ["P", "P", "P", "P", ".", "P", "P", "P"],
    ["R", ".", "B", "Q", ".", "R", "K", "."],
  ];
  const pieceGlyph: Record<string, string> = {
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  };
  const size = 64;
  const board = 8;

  return (
    <svg
      viewBox={`0 0 ${size * board} ${size * board}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="lb-boardVign" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        <filter id="lb-softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      {pos.map((row, r) => row.map((_, f) => {
        const dark = (r + f) % 2 === 1;
        return (
          <rect
            key={`${r}-${f}`} x={f * size} y={r * size} width={size} height={size}
            fill={dark ? "rgba(255,181,71,0.08)" : "rgba(255,181,71,0.02)"}
          />
        );
      }))}
      {Array.from({ length: board + 1 }, (_, i) => (
        <Fragment key={`line-${i}`}>
          <line x1={0} y1={i * size} x2={size * board} y2={i * size} stroke={color} strokeOpacity="0.25" strokeWidth="1" />
          <line x1={i * size} y1={0} x2={i * size} y2={size * board} stroke={color} strokeOpacity="0.25" strokeWidth="1" />
        </Fragment>
      ))}
      {pos.map((row, r) => row.map((p, f) => {
        if (p === ".") return null;
        const isWhite = p === p.toUpperCase();
        return (
          <text
            key={`p-${r}-${f}`}
            x={f * size + size / 2} y={r * size + size / 2 + size * 0.28}
            textAnchor="middle"
            fontFamily="'Noto Sans Symbols 2', 'DejaVu Sans', serif"
            fontSize={size * 0.86}
            fill={isWhite ? color : "#ff5fb4"}
            fillOpacity={isWhite ? 0.7 : 0.55}
            filter="url(#lb-softGlow)"
          >
            {pieceGlyph[p]}
          </text>
        );
      }))}
      <rect x={4 * size} y={4 * size} width={size} height={size}
        fill="none" stroke={color} strokeOpacity="0.75" strokeWidth="2" strokeDasharray="4 3" />
      <rect x={5 * size} y={5 * size} width={size} height={size}
        fill="none" stroke={color} strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="2 3" />
      <rect x={0} y={0} width={size * board} height={size * board} fill="url(#lb-boardVign)" />
    </svg>
  );
}

function GoBoardSVG({ color }: { color: string }) {
  const N = 19;
  const stones: [string, number, number][] = [
    ["B", 3, 3], ["B", 15, 3], ["B", 3, 15], ["B", 13, 2], ["B", 16, 6],
    ["B", 5, 16], ["B", 9, 9], ["B", 14, 15], ["B", 10, 2], ["B", 2, 10],
    ["B", 17, 11], ["B", 7, 3], ["B", 12, 16], ["B", 3, 6],
    ["W", 15, 15], ["W", 14, 3], ["W", 4, 4], ["W", 16, 3], ["W", 16, 15],
    ["W", 5, 15], ["W", 15, 4], ["W", 6, 16], ["W", 2, 14], ["W", 10, 16],
    ["W", 14, 14], ["W", 3, 16], ["W", 12, 3], ["W", 16, 10], ["W", 8, 2],
  ];
  const pad = 30;
  const boardSize = 620;
  const step = (boardSize - pad * 2) / (N - 1);
  const starPoints = [3, 9, 15];

  return (
    <svg
      viewBox={`0 0 ${boardSize} ${boardSize}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="lb-goVign" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id="lb-goBlack" cx="0.35" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#555" />
          <stop offset="40%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <radialGradient id="lb-goWhite" cx="0.35" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="60%" stopColor="#eceadd" />
          <stop offset="100%" stopColor="#b8b4a0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={boardSize} height={boardSize} fill="rgba(255,181,71,0.07)" />
      {Array.from({ length: N }, (_, i) => {
        const v = pad + i * step;
        return (
          <Fragment key={`g${i}`}>
            <line x1={pad} y1={v} x2={boardSize - pad} y2={v} stroke={color} strokeOpacity="0.45" strokeWidth="1" />
            <line x1={v} y1={pad} x2={v} y2={boardSize - pad} stroke={color} strokeOpacity="0.45" strokeWidth="1" />
          </Fragment>
        );
      })}
      {starPoints.map(r => starPoints.map(c => (
        <circle key={`s-${r}-${c}`} cx={pad + c * step} cy={pad + r * step} r="2.8" fill={color} fillOpacity="0.7" />
      )))}
      {stones.map(([kind, f, r], i) => (
        <circle
          key={`st-${i}`}
          cx={pad + f * step} cy={pad + r * step} r={step * 0.48}
          fill={kind === "B" ? "url(#lb-goBlack)" : "url(#lb-goWhite)"}
          opacity={kind === "B" ? 1 : 0.95}
          stroke={kind === "W" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.08)"}
          strokeWidth="0.7"
        />
      ))}
      <circle cx={pad + 9 * step} cy={pad + 9 * step} r={step * 0.2} fill="none" stroke="#ff5fb4" strokeOpacity="0.9" strokeWidth="2" />
      <rect x={0} y={0} width={boardSize} height={boardSize} fill="url(#lb-goVign)" />
    </svg>
  );
}

function CheckersBoardSVG({ color }: { color: string }) {
  const size = 64;
  const board = 8;
  const pieces: [string, number, number][] = [
    ["B", 0, 0], ["B", 2, 0], ["B", 4, 0], ["B", 6, 0],
    ["B", 1, 1], ["B", 3, 1], ["BK", 7, 1],
    ["B", 0, 2], ["B", 4, 2],
    ["W", 3, 5], ["W", 7, 5],
    ["W", 0, 6], ["W", 2, 6], ["WK", 4, 6], ["W", 6, 6],
    ["W", 1, 7], ["W", 3, 7], ["W", 5, 7], ["W", 7, 7],
  ];

  return (
    <svg
      viewBox={`0 0 ${size * board} ${size * board}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="lb-ckVign" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="lb-ckBlack" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#ff88d0" />
          <stop offset="60%" stopColor="#c03880" />
          <stop offset="100%" stopColor="#5a1844" />
        </radialGradient>
        <radialGradient id="lb-ckWhite" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#fff2c2" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor="#7a4a0a" />
        </radialGradient>
      </defs>
      {Array.from({ length: board }, (_, r) => Array.from({ length: board }, (_, f) => {
        const dark = (r + f) % 2 === 1;
        return (
          <rect
            key={`${r}-${f}`} x={f * size} y={r * size} width={size} height={size}
            fill={dark ? "rgba(255,181,71,0.1)" : "rgba(255,181,71,0.02)"}
          />
        );
      }))}
      {Array.from({ length: board + 1 }, (_, i) => (
        <Fragment key={`line-${i}`}>
          <line x1={0} y1={i * size} x2={size * board} y2={i * size} stroke={color} strokeOpacity="0.25" strokeWidth="1" />
          <line x1={i * size} y1={0} x2={i * size} y2={size * board} stroke={color} strokeOpacity="0.25" strokeWidth="1" />
        </Fragment>
      ))}
      {pieces.map(([kind, f, r], i) => {
        const isKing = kind.length === 2;
        const base = kind[0];
        const cx = f * size + size / 2;
        const cy = r * size + size / 2;
        return (
          <g key={`p-${i}`} opacity="0.88">
            <circle
              cx={cx} cy={cy} r={size * 0.36}
              fill={base === "B" ? "url(#lb-ckBlack)" : "url(#lb-ckWhite)"}
              stroke="rgba(0,0,0,0.6)" strokeWidth="1"
            />
            <circle cx={cx} cy={cy} r={size * 0.26} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3 2" />
            {isKing && (
              <text
                x={cx} y={cy + 5} textAnchor="middle"
                fontFamily="'Noto Sans Symbols 2', serif" fontSize={size * 0.42}
                fill={base === "B" ? "#ffdbf0" : "#3a1e00"} fillOpacity="0.9"
              >
                ♔
              </text>
            )}
          </g>
        );
      })}
      <rect x={0} y={0} width={size * board} height={size * board} fill="url(#lb-ckVign)" />
    </svg>
  );
}
