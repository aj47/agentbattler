"use client";

import { CSSProperties, ReactNode } from "react";
import type { Agent } from "../lib/types";

function pct(wins: number, loss: number) {
  const total = wins + loss;
  return total > 0 ? Math.round((wins / total) * 100) : 0;
}

function architectureNote(agent: Agent) {
  if (agent.size >= 45) return `${agent.size.toFixed(1)}kb heavyweight build`;
  if (agent.size <= 20) return `${agent.size.toFixed(1)}kb micro-build, speed first`;
  return `${agent.size.toFixed(1)}kb midweight stack`;
}

function strategyNote(agent: Agent) {
  const text = `${agent.personality} ${agent.bio}`.toLowerCase();
  if (text.includes("queen")) return "queen pressure stays live deep into middlegame";
  if (text.includes("rook")) return "rook lifts are part of the gameplan";
  if (text.includes("endgame") || text.includes("tablebase")) return "gets stronger after trades come off";
  if (text.includes("opening") || text.includes("book")) return "opening prep is a real edge early";
  if (text.includes("aggressive") || text.includes("sacrific") || text.includes("rush") || text.includes("invasion")) return "fast-start profile, high early volatility";
  if (text.includes("defensive") || text.includes("fortress") || text.includes("territor") || text.includes("patience")) return "grinds edges and protects the lead";
  if (text.includes("random") || text.includes("chaos") || text.includes("unorthodox")) return "high-variance lines keep bettors guessing";
  return agent.personality;
}

function buildAgentNotes(agent: Agent) {
  const winRate = pct(agent.wins, agent.loss);
  const notes = [
    `${winRate}% win rate on ${agent.wins}W-${agent.loss}L`,
    architectureNote(agent),
    strategyNote(agent),
  ];

  if (agent.streak >= 3) notes.push(`on a ${agent.streak}-match heater`);
  else if (agent.streak > 0) notes.push(`quiet ${agent.streak}-match uptick`);
  else if (agent.streak <= -3) notes.push(`trying to snap a ${Math.abs(agent.streak)}-match skid`);

  if (agent.hot) notes.push("market favorite and taking sharp money");

  if (agent.bio) {
    const bioLine = agent.bio.replace(/\.+$/g, "").trim();
    if (bioLine) notes.push(bioLine);
  }

  return notes.slice(0, 5);
}

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
  const sideFrame = sideMark === "B"
    ? {
      border: "#05070d",
      glow: "rgba(255,181,71,0.2)",
      gold: "rgba(255,181,71,0.72)",
      background: "linear-gradient(90deg, rgba(0,0,0,0.34), rgba(15,20,34,0.88))",
    }
    : sideMark === "W"
      ? {
        border: "var(--ink-100)",
        glow: "rgba(255,181,71,0.22)",
        gold: "rgba(255,181,71,0.72)",
        background: "linear-gradient(270deg, rgba(255,255,255,0.11), rgba(15,20,34,0.88))",
      }
      : null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      padding: compact ? "10px 12px" : "14px 16px",
      background: sideFrame?.background ?? (active ? "rgba(95,240,230,0.04)" : "var(--bg-panel)"),
      border: `${sideFrame ? 2 : 1}px solid ${sideFrame?.border ?? (active ? c : "var(--line)")}`,
      borderRadius: sideFrame ? 8 : 0,
      outline: sideFrame ? `1px solid ${sideFrame.gold}` : undefined,
      outlineOffset: sideFrame ? 2 : undefined,
      boxShadow: sideFrame
        ? `0 0 14px ${sideFrame.glow}, inset 0 0 18px rgba(5,7,13,0.34)`
        : undefined,
      position: "relative",
      flexDirection: side === "R" ? "row-reverse" : "row",
      textAlign: side === "R" ? "right" : "left",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <AgentGlyph agent={agent} size={compact ? 40 : 54} />
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
          <div className={`agent-note-marquee ${side === "R" ? "right" : ""}`} style={{ marginTop: 8 }}>
            <div className="agent-note-track">
              {[0, 1].map(group => (
                <div key={group} className="agent-note-group" aria-hidden={group === 1}>
                  {buildAgentNotes(agent).map((note, i) => (
                    <span key={`${group}-${i}`} className="agent-note-chip">
                      {note}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {score !== undefined && !sideFrame && (
        <div style={{
          fontFamily: "var(--font-display)", fontSize: compact ? 24 : 36,
          fontWeight: 700, color: c, textShadow: `0 0 14px ${c}`,
          minWidth: 36, textAlign: "center",
        }}>{score}</div>
      )}
    </div>
  );
}
