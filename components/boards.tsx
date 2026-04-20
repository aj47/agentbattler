"use client";

import type { Stone } from "../lib/types";

export function HoloBoardGo({
  stones = [], lastMove, hot = [], size = 520, tilt = 38,
}: {
  stones?: Stone[];
  lastMove?: { x: number; y: number; c: "b" | "w" } | null;
  hot?: { x: number; y: number }[];
  size?: number;
  tilt?: number;
}) {
  const N = 19;
  const pad = 18;
  const step = (size - pad * 2) / (N - 1);

  return (
    <div style={{ perspective: "1400px", perspectiveOrigin: "50% 20%", width: size, height: size * 0.8, position: "relative" }}>
      <div style={{
        position: "absolute", left: "50%", bottom: "-10%",
        width: size * 0.9, height: 40, transform: "translateX(-50%)",
        background: "radial-gradient(ellipse, var(--phos-cyan-glow), transparent 70%)",
        filter: "blur(16px)", opacity: 0.8,
      }} />
      <div style={{
        width: size, height: size, transform: `rotateX(${tilt}deg)`, transformOrigin: "50% 60%",
        position: "relative",
        background: "linear-gradient(180deg, rgba(95,240,230,0.03) 0%, rgba(95,240,230,0.08) 100%)",
        border: "1px solid rgba(95,240,230,0.25)",
        boxShadow: "inset 0 0 60px rgba(95,240,230,0.08), 0 0 40px rgba(95,240,230,0.2)",
      }}>
        <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="stoneB" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#4a5670" />
              <stop offset="60%" stopColor="#0a0e1a" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
            <radialGradient id="stoneW" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#c8d4e8" />
              <stop offset="100%" stopColor="#5a6580" />
            </radialGradient>
            <filter id="glowCyan">
              <feGaussianBlur stdDeviation="3" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {Array.from({ length: N }).map((_, i) => (
            <g key={i}>
              <line x1={pad + i * step} y1={pad} x2={pad + i * step} y2={size - pad} stroke="rgba(95,240,230,0.45)" strokeWidth="0.8" />
              <line x1={pad} y1={pad + i * step} x2={size - pad} y2={pad + i * step} stroke="rgba(95,240,230,0.45)" strokeWidth="0.8" />
            </g>
          ))}
          {[3, 9, 15].flatMap(x => [3, 9, 15].map(y => (
            <circle key={`${x}-${y}`} cx={pad + x * step} cy={pad + y * step} r="2.5" fill="var(--phos-cyan)" opacity="0.8" />
          )))}
          {hot.map((h, i) => (
            <circle key={i} cx={pad + h.x * step} cy={pad + h.y * step} r={step * 0.9} fill="none" stroke="var(--phos-magenta)" strokeWidth="1" opacity="0.5" style={{ animation: `pulseHot 2.2s ease-out ${i * 0.4}s infinite` }} />
          ))}
          {stones.map((s, i) => {
            const cx = pad + s.x * step;
            const cy = pad + s.y * step;
            const r = step * 0.46;
            const fill = s.c === "b" ? "url(#stoneB)" : "url(#stoneW)";
            const glow = s.c === "b" ? "var(--phos-amber-glow)" : "rgba(255,255,255,0.4)";
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r + 2} fill={glow} opacity="0.35" filter="url(#glowCyan)" />
                <circle cx={cx} cy={cy} r={r} fill={fill} stroke={s.c === "b" ? "var(--phos-amber)" : "var(--phos-cyan)"} strokeWidth="0.6" strokeOpacity="0.7" />
              </g>
            );
          })}
          {lastMove && (
            <circle cx={pad + lastMove.x * step} cy={pad + lastMove.y * step} r={step * 0.2} fill="none" stroke="var(--phos-magenta)" strokeWidth="1.5" style={{ animation: "pulseHot 1.4s ease-out infinite" }} />
          )}
        </svg>
      </div>
    </div>
  );
}

export function HoloBoardChess({ size = 220, tilt = 52, fen, showLabels = true }: { size?: number; tilt?: number; fen?: string; showLabels?: boolean }) {
  const f = fen || "rnbqkbnr/pppppppp/8/3P4/4p3/2N2N2/PPP1PPPP/R1BQKB1R";
  const pieces: Record<string, string> = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  };
  const names: Record<string, string> = { K: "KING", Q: "QUEEN", R: "ROOK", B: "BISHOP", N: "KNIGHT", P: "PAWN" };
  const rows = f.split(" ")[0].split("/").slice(0, 8);
  const cells: { x: number; y: number; p: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) x += parseInt(ch, 10);
      else { cells.push({ x, y, p: ch }); x++; }
    }
  });
  const pad = size * 0.105;
  const board = size - pad * 2;
  const step = board / 8;
  const depth = Math.max(10, size * 0.06);
  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  return (
    <div style={{ perspective: size * 2.9, perspectiveOrigin: "50% 12%", width: size, height: size * 0.86, position: "relative" }} aria-label="3D holographic chess board">
      <div style={{ position: "absolute", left: "50%", bottom: "1%", width: size * 0.96, height: size * 0.2, transform: "translateX(-50%)", background: "radial-gradient(ellipse, rgba(95,240,230,0.32), rgba(255,181,71,0.12) 42%, transparent 72%)", filter: "blur(16px)", opacity: 0.95 }} />
      <div style={{ position: "absolute", left: "50%", top: size * 0.035, width: size, height: size, transform: `translateX(-50%) rotateX(${tilt}deg) rotateZ(-2deg)`, transformOrigin: "50% 62%", transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(95,240,230,0.05), rgba(95,240,230,0.012))", border: "1px solid rgba(95,240,230,0.58)", boxShadow: "inset 0 0 46px rgba(95,240,230,0.1), 0 0 42px rgba(95,240,230,0.22)", transform: `translateZ(${depth}px)` }} />
        <div style={{ position: "absolute", left: pad * 0.42, right: pad * 0.42, bottom: pad * 0.18, height: depth, background: "linear-gradient(180deg, rgba(95,240,230,0.22), rgba(95,240,230,0.035))", border: "1px solid rgba(95,240,230,0.3)", transformOrigin: "50% 0%", transform: `rotateX(-90deg) translateZ(${depth}px)` }} />
        <div style={{ position: "absolute", inset: pad * 0.42, border: "1px solid rgba(95,240,230,0.85)", boxShadow: "0 0 18px rgba(95,240,230,0.24)", transform: `translateZ(${depth + 1}px)` }} />
        <div style={{ position: "absolute", inset: pad * 0.2, border: "1px solid rgba(255,181,71,0.38)", transform: `translateZ(${depth + 2}px)` }} />

        {Array.from({ length: 8 }).map((_, y) =>
          Array.from({ length: 8 }).map((_, x) => {
            const dark = (x + y) % 2 === 1;
            return (
              <div key={`${x}-${y}`} style={{
                position: "absolute", left: pad + x * step, top: pad + y * step, width: step, height: step,
                background: dark ? "rgba(95,240,230,0.13)" : "rgba(232,236,247,0.025)",
                border: "1px solid rgba(95,240,230,0.28)", transform: `translateZ(${depth + 3}px)`,
              }} />
            );
          })
        )}

        {showLabels && files.map((file, i) => (
          <span key={file} className="t-label" style={{ position: "absolute", left: pad + i * step + step / 2, top: size - pad * 0.58, transform: `translate(-50%, -50%) translateZ(${depth + 5}px)`, color: "var(--phos-cyan)", fontSize: Math.max(7, size * 0.02), textShadow: "0 0 8px rgba(95,240,230,0.8)" }}>{file}</span>
        ))}
        {showLabels && ranks.map((rank, i) => (
          <span key={rank} className="t-label" style={{ position: "absolute", right: pad * 0.44, top: pad + i * step + step / 2, transform: `translate(50%, -50%) translateZ(${depth + 5}px)`, color: "var(--phos-amber)", fontSize: Math.max(7, size * 0.02), textShadow: "0 0 8px rgba(255,181,71,0.75)" }}>{rank}</span>
        ))}

        {cells.map((c, i) => {
          const isWhite = c.p === c.p.toUpperCase();
          const color = isWhite ? "var(--phos-cyan)" : "var(--phos-amber)";
          return (
            <div key={i} title={`${isWhite ? "White" : "Black"} ${names[c.p.toUpperCase()] || "PIECE"}`} style={{
              position: "absolute", left: pad + c.x * step + step / 2, top: pad + c.y * step + step / 2,
              width: step, height: step, transform: `translate(-50%, -50%) translateZ(${depth + 8 + (7 - c.y) * 0.18}px) rotateX(-${tilt}deg)`,
              transformStyle: "preserve-3d", display: "grid", placeItems: "center", zIndex: 20 + c.y,
            }}>
              <div style={{ position: "absolute", width: step * 0.62, height: step * 0.62, borderRadius: "50%", border: `1px solid ${color}`, boxShadow: `0 0 12px ${color}`, opacity: 0.62, transform: "rotateX(70deg) translateY(16%)" }} />
              <div style={{ position: "absolute", width: step * 0.42, height: step * 0.42, borderRadius: "50%", border: `1px solid ${color}`, opacity: 0.45, transform: "rotateX(70deg) translateY(16%)" }} />
              <span style={{ fontSize: step * 0.9, lineHeight: 1, color, textShadow: `0 0 10px ${color}, 0 0 22px ${color}`, filter: "drop-shadow(0 12px 10px rgba(0,0,0,0.55))" }}>{pieces[c.p] || "?"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HoloBoardCheckers({ size = 220, tilt = 36 }: { size?: number; tilt?: number }) {
  const discs = [
    { x: 0, y: 5, c: "r" }, { x: 2, y: 5, c: "r" }, { x: 4, y: 5, c: "r" },
    { x: 1, y: 6, c: "r" }, { x: 3, y: 6, c: "r" }, { x: 5, y: 6, c: "r", k: true },
    { x: 0, y: 7, c: "r" }, { x: 6, y: 7, c: "r" },
    { x: 1, y: 0, c: "b" }, { x: 3, y: 0, c: "b" }, { x: 5, y: 0, c: "b" }, { x: 7, y: 0, c: "b" },
    { x: 0, y: 1, c: "b" }, { x: 2, y: 1, c: "b" }, { x: 4, y: 1, c: "b", k: true },
    { x: 3, y: 2, c: "b" }, { x: 5, y: 4, c: "r" },
  ];
  const pad = 10;
  const step = (size - pad * 2) / 8;
  return (
    <div style={{ perspective: "1000px", width: size, height: size * 0.78, position: "relative" }}>
      <div style={{ position: "absolute", left: "50%", bottom: "-8%", width: size * 0.85, height: 20, transform: "translateX(-50%)", background: "radial-gradient(ellipse, rgba(125,255,156,0.35), transparent 70%)", filter: "blur(10px)" }} />
      <div style={{ width: size, height: size, transform: `rotateX(${tilt}deg)`, transformOrigin: "50% 60%" }}>
        <svg width={size} height={size}>
          {Array.from({ length: 8 }).map((_, y) =>
            Array.from({ length: 8 }).map((_, x) => {
              const dark = (x + y) % 2 === 1;
              return (
                <rect key={`${x}-${y}`} x={pad + x * step} y={pad + y * step} width={step} height={step}
                  fill={dark ? "rgba(125,255,156,0.12)" : "rgba(125,255,156,0.02)"}
                  stroke="rgba(125,255,156,0.3)" strokeWidth="0.4" />
              );
            })
          )}
          {discs.map((d, i) => {
            const cx = pad + d.x * step + step / 2;
            const cy = pad + d.y * step + step / 2;
            const color = d.c === "r" ? "var(--phos-red)" : "var(--phos-cyan)";
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={step * 0.38} fill="rgba(0,0,0,0.6)" stroke={color} strokeWidth="1.2" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
                {d.k && <text x={cx} y={cy + step * 0.12} textAnchor="middle" fontSize={step * 0.4} fill={color}>♛</text>}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function MiniBoard({ game, size, stones }: { game: string; size?: number; stones?: Stone[] }) {
  if (game === "go19") return <HoloBoardGo stones={(stones || []).slice(0, 24)} size={size} tilt={42} />;
  if (game === "checkers") return <HoloBoardCheckers size={size} />;
  return <HoloBoardChess size={size} />;
}
