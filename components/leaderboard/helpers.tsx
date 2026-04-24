"use client";

import { CSSProperties } from "react";
import type { EnrichedAgent } from "./data";

export const COLOR_VAR: Record<string, string> = {
  cyan: "var(--phos-cyan)",
  amber: "var(--phos-amber)",
  magenta: "var(--phos-magenta)",
  green: "var(--phos-green)",
  red: "var(--phos-red)",
  violet: "var(--phos-violet)",
};

export const COLOR_GLOW: Record<string, string> = {
  cyan: "var(--phos-cyan-glow)",
  amber: "var(--phos-amber-glow)",
  magenta: "rgba(255,95,180,0.35)",
  green: "rgba(125,255,156,0.35)",
  red: "rgba(255,95,109,0.35)",
  violet: "rgba(155,125,255,0.35)",
};

export const fmt = (n: number) => n.toLocaleString("en-US");
export const pct = (n: number) => (n * 100).toFixed(1) + "%";
export const money = (n: number) => {
  const abs = Math.abs(n);
  const s = abs >= 1e6
    ? "$" + (abs / 1e6).toFixed(2) + "M"
    : abs >= 1e3
      ? "$" + (abs / 1e3).toFixed(1) + "k"
      : "$" + abs;
  return n < 0 ? "-" + s : s;
};

export function Sparkline({
  points,
  color = "cyan",
  width = 140,
  height = 32,
}: {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!points?.length) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);
  const step = width / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`)
    .join(" ");
  const area = path + ` L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  const first = points[0];
  const up = last >= first;
  const c = COLOR_VAR[color] ?? COLOR_VAR.cyan;
  const gradId = `lb-grad-${color}-${width}x${height}`;
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.35" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={c} strokeWidth="1.2" strokeLinejoin="round" />
      <circle
        cx={width}
        cy={height - ((last - min) / range) * height}
        r="2.5"
        fill={c}
      />
      <text
        x={width - 2}
        y={up ? 10 : height - 2}
        fontSize="8"
        textAnchor="end"
        fill={c}
        fontFamily="var(--font-mono)"
        letterSpacing="0.08em"
      >
        {(up ? "+" : "") + (last - first)}
      </text>
    </svg>
  );
}

export function Form({ form }: { form: (-1 | 0 | 1)[] }) {
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {form.map((r, i) => {
        const bg = r === 1 ? "var(--phos-green)" : r === -1 ? "var(--phos-red)" : "var(--ink-400)";
        return (
          <div
            key={i}
            title={r === 1 ? "W" : r === -1 ? "L" : "D"}
            style={{
              width: 6,
              height: 14,
              background: bg,
              opacity: 0.35 + (i / form.length) * 0.65,
            }}
          />
        );
      })}
    </div>
  );
}

export function Glyph({
  agent,
  size = 36,
  round = false,
}: {
  agent: EnrichedAgent;
  size?: number;
  round?: boolean;
}) {
  const c = COLOR_VAR[agent.color] ?? COLOR_VAR.cyan;
  const glow = COLOR_GLOW[agent.color] ?? COLOR_GLOW.cyan;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        border: `${round ? 2 : 1}px solid ${c}`,
        color: c,
        borderRadius: round ? "50%" : 0,
        background: `radial-gradient(circle at 35% 30%, ${glow}, transparent 70%), var(--bg-panel-3)`,
        fontFamily: "var(--font-display)",
        fontSize: size * 0.52,
        lineHeight: 1,
        position: "relative",
        flex: "0 0 auto",
      }}
    >
      {agent.glyph}
      {agent.hot && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--phos-magenta)",
          }}
        />
      )}
    </div>
  );
}

export function WLBadge({
  agent,
  wins,
  loss,
  size = "sm",
  style = {},
}: {
  agent?: EnrichedAgent;
  wins?: number;
  loss?: number;
  size?: "xs" | "sm" | "md";
  style?: CSSProperties;
}) {
  const w = typeof wins === "number" ? wins : agent?.wins ?? 0;
  const l = typeof loss === "number" ? loss : agent?.loss ?? 0;
  const total = w + l;
  const wr = total > 0 ? w / total : 0;
  const sizes = {
    xs: { fs: 9, pad: "1px 5px", gap: 3 },
    sm: { fs: 10, pad: "2px 6px", gap: 4 },
    md: { fs: 11, pad: "3px 8px", gap: 5 },
  } as const;
  const s = sizes[size] || sizes.sm;
  return (
    <span
      title={`${w} wins · ${l} losses · ${(wr * 100).toFixed(1)}% WR`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        fontFamily: "var(--font-mono)",
        fontSize: s.fs,
        fontVariantNumeric: "tabular-nums",
        padding: s.pad,
        border: "1px solid var(--line-2)",
        background: "rgba(10,14,26,0.5)",
        borderRadius: 2,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        lineHeight: 1,
        ...style,
      }}
    >
      <span style={{ color: "var(--phos-green)" }}>
        {w}
        <span style={{ opacity: 0.6 }}>W</span>
      </span>
      <span style={{ color: "var(--ink-500)" }}>·</span>
      <span style={{ color: "var(--phos-red)" }}>
        {l}
        <span style={{ opacity: 0.6 }}>L</span>
      </span>
    </span>
  );
}
