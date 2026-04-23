"use client";

import { CSSProperties, ReactNode } from "react";
import type { Agent } from "../lib/types";

export function Panel({
  children, style, label, right, className = "", noCorners = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  label?: ReactNode;
  right?: ReactNode;
  className?: string;
  noCorners?: boolean;
}) {
  return (
    <div className={`panel ${className}`} style={style}>
      {!noCorners && (<>
        <span className="panel-corner tl" />
        <span className="panel-corner tr" />
        <span className="panel-corner bl" />
        <span className="panel-corner br" />
      </>)}
      {(label || right) && (
        <div className="responsive-panel-heading" style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)" }}>
          <span className="t-label">{label}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function LiveDot({ style }: { style?: CSSProperties }) {
  return <span className="live-dot" style={style} />;
}

const pillColors: Record<string, { border: string; text: string }> = {
  cyan: { border: "var(--phos-cyan)", text: "var(--phos-cyan)" },
  amber: { border: "var(--phos-amber)", text: "var(--phos-amber)" },
  green: { border: "var(--phos-green)", text: "var(--phos-green)" },
  magenta: { border: "var(--phos-magenta)", text: "var(--phos-magenta)" },
  violet: { border: "var(--phos-violet)", text: "var(--phos-violet)" },
  red: { border: "var(--phos-red)", text: "var(--phos-red)" },
  gray: { border: "var(--line-2)", text: "var(--ink-300)" },
};

export function Pill({
  children, color = "cyan", style,
}: { children: ReactNode; color?: string; style?: CSSProperties }) {
  const c = pillColors[color] || pillColors.cyan;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 6px",
      fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em",
      textTransform: "uppercase", border: `1px solid ${c.border}`, color: c.text,
      ...style,
    }}>{children}</span>
  );
}

export function AgentGlyph({ agent, size = 48, spin = true }: { agent: Agent; size?: number; spin?: boolean }) {
  const c = `var(--phos-${agent.color})`;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <div style={{
        position: "absolute", inset: 0, border: `1px solid ${c}`, borderRadius: "50%", opacity: 0.6,
        animation: spin ? "rot 12s linear infinite" : "none",
        clipPath: "polygon(0 0, 100% 0, 100% 50%, 80% 50%, 80% 55%, 100% 55%, 100% 100%, 0 100%)",
      }} />
      <div style={{
        position: "absolute", inset: 4, border: `1px dashed ${c}`, borderRadius: "50%", opacity: 0.3,
        animation: spin ? "rot 20s linear infinite reverse" : "none",
      }} />
      <div style={{
        position: "absolute", inset: 6, borderRadius: "50%",
        background: `radial-gradient(circle, ${c} 0%, transparent 70%)`, opacity: 0.25, filter: "blur(4px)",
      }} />
      <span style={{
        fontSize: size * 0.5, color: c, textShadow: `0 0 12px ${c}`,
        fontFamily: "var(--font-display)", fontWeight: 700, zIndex: 1,
      }}>{agent.glyph}</span>
    </div>
  );
}

export function AgentCard({
  agent, side = "L", compact = false, active = false, score, sideMarker,
}: {
  agent: Agent;
  side?: "L" | "R";
  compact?: boolean;
  active?: boolean;
  score?: ReactNode;
  sideMarker?: "B" | "W";
}) {
  const c = `var(--phos-${agent.color})`;
  const sideMark = sideMarker ?? (score === "B" || score === "W" ? score : null);
  const sideRing = sideMark === "B"
    ? {
      border: "#05070d",
      inset: "rgba(0,0,0,0.82)",
      glow: "rgba(255,181,71,0.34)",
    }
    : sideMark === "W"
      ? {
        border: "var(--ink-100)",
        inset: "rgba(255,255,255,0.26)",
        glow: "rgba(255,255,255,0.42)",
      }
      : null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      padding: compact ? "10px 12px" : "14px 16px",
      background: active ? "rgba(95,240,230,0.04)" : "var(--bg-panel)",
      border: `1px solid ${active ? c : "var(--line)"}`,
      position: "relative",
      flexDirection: side === "R" ? "row-reverse" : "row",
      textAlign: side === "R" ? "right" : "left",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        {sideRing ? (
          <div style={{
            borderRadius: "50%",
            padding: compact ? 4 : 5,
            border: `2px solid ${sideRing.border}`,
            boxShadow: `0 0 0 1px ${sideRing.inset}, 0 0 18px ${sideRing.glow}`,
            background: "rgba(5,7,13,0.5)",
          }}>
            <AgentGlyph agent={agent} size={compact ? 40 : 54} />
          </div>
        ) : (
          <AgentGlyph agent={agent} size={compact ? 40 : 54} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexDirection: side === "R" ? "row-reverse" : "row", flexWrap: "wrap" }}>
          <span className="t-mono" style={{ fontSize: compact ? 13 : 15, fontWeight: 600, color: "var(--ink-100)", textShadow: `0 0 8px ${c}` }}>
            {agent.handle}
          </span>
          {agent.hot && <Pill color="magenta" style={{ fontSize: 8, padding: "1px 4px" }}>HOT</Pill>}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 3, flexDirection: side === "R" ? "row-reverse" : "row", flexWrap: "wrap" }}>
          <span className="t-label" style={{ fontSize: 9 }}>ELO <span className="t-num" style={{ color: c }}>{agent.elo}</span></span>
          <span className="t-label" style={{ fontSize: 9 }}>{agent.size}<span style={{ opacity: 0.5 }}>kb</span></span>
          <span className="t-label" style={{ fontSize: 9 }}>{agent.author}</span>
        </div>
        {!compact && (
          <div style={{ marginTop: 6, fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ink-300)", fontStyle: "italic" }}>
            // {agent.personality}
          </div>
        )}
      </div>
      {score !== undefined && !sideRing && (
        <div style={{
          fontFamily: "var(--font-display)", fontSize: compact ? 24 : 36,
          fontWeight: 700, color: c, textShadow: `0 0 14px ${c}`,
          minWidth: 36, textAlign: "center",
        }}>{score}</div>
      )}
    </div>
  );
}
