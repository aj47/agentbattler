"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Panel, Pill, AgentGlyph } from "../../../components/ui";
import type { Agent, ProfilePnl } from "../../../lib/types";

function fmt$(n: number) {
  const s = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (v >= 1000) return s + "$" + (v / 1000).toFixed(v >= 10000 ? 1 : 2).replace(/\.0+$/, "") + "k";
  return s + "$" + v.toLocaleString();
}

function PnlChart({ data, color }: { data: number[]; color: string }) {
  const W = 1200, H = 220, padY = 12;
  const max = Math.max(...data);
  const min = Math.min(0, ...data);
  const range = max - min || 1;
  const n = data.length;
  const xFor = (i: number) => (i / (n - 1)) * W;
  const yFor = (v: number) => H - padY - ((v - min) / range) * (H - padY * 2);

  const pts = data.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" L ");
  const area = `M 0,${H} L ${pts} L ${W},${H} Z`;
  const line = `M ${pts}`;

  const gridStep = 50000;
  const gridLines: number[] = [];
  for (let v = Math.ceil(min / gridStep) * gridStep; v <= max; v += gridStep) gridLines.push(v);

  const lastX = xFor(n - 1);
  const lastY = yFor(data[n - 1]);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {gridLines.map((v, i) => (
        <g key={i}>
          <line x1="0" y1={yFor(v)} x2={W} y2={yFor(v)} stroke="var(--line)" strokeWidth="0.5" strokeDasharray="3 4" />
          <text x="6" y={yFor(v) - 3} fontSize="9" fill="var(--ink-400)" fontFamily="var(--font-mono)">${(v / 1000).toFixed(0)}k</text>
        </g>
      ))}
      <path d={area} fill={color} opacity="0.15" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <circle cx={lastX} cy={lastY} r="5" fill={color} />
      <circle cx={lastX} cy={lastY} r="10" fill="none" stroke={color} strokeWidth="1" opacity="0.6">
        <animate attributeName="r" from="5" to="16" dur="1.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.8" to="0" dur="1.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export default function AgentPageClient({ slug }: { slug: string }) {
  const agent = useQuery(api.queries.agentBySlug, { slug });
  const leaderboard = useQuery(api.queries.leaderboard);
  const matches = useQuery(api.queries.profileMatches, { agentSlug: slug });
  const allAgents = useQuery(api.queries.allAgents);
  const pnl = useQuery(api.queries.featuredData, { key: "profile_pnl" }) as ProfilePnl | null | undefined;

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    (allAgents || []).forEach(a => m.set(a.slug, a as Agent));
    return m;
  }, [allAgents]);

  if (!agent || !leaderboard) return <div style={{ padding: 40 }}>LOADING…</div>;

  const a = agent as Agent;
  const color = `var(--phos-${a.color})`;
  const rank = (leaderboard as Agent[]).findIndex(x => x.slug === a.slug) + 1;
  const winrate = Math.round((a.wins / (a.wins + a.loss)) * 100);

  return (
    <div className="page-shell">
      <div className="agent-crumbs">
        <Link href="/">LOBBY</Link>
        <span style={{ color: "var(--ink-400)" }}>/</span>
        <Link href="/bracket">BRACKET</Link>
        <span style={{ color: "var(--ink-400)" }}>/</span>
        <span style={{ color }}>AGENT · {a.handle}</span>
      </div>

      <Panel>
        <div className="agent-hero-grid">
          <div className="agent-hero-glyph-bg" style={{ color }}>{a.glyph}</div>

          <AgentGlyph agent={a} size={140} />

          <div style={{ zIndex: 1 }}>
            <div className="t-label" style={{ color }}>#{rank} GLOBAL · {a.author}</div>
            <div className="t-display" style={{ fontSize: "clamp(34px, 10vw, 48px)", letterSpacing: "-0.02em", marginTop: 6 }}>{a.handle}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--ink-200)", maxWidth: 640, fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--ink-400)" }}>{"/* "}</span>{a.bio}<span style={{ color: "var(--ink-400)" }}>{" */"}</span>
            </div>
            <div className="agent-hero-badges">
              {a.hot && <Pill color="magenta">◉ HOT</Pill>}
              {a.streak > 5 && <Pill color="green">W{a.streak} STREAK</Pill>}
              <Pill color="cyan">{a.personality.toUpperCase()}</Pill>
              <Pill color="gray">{a.size}kb / 50kb</Pill>
            </div>
          </div>
        </div>

        {/* Top 4 stat cards */}
        {pnl && (
          <div className="agent-stat-grid">
            <div className="agent-stat-card" style={{ borderColor: "var(--phos-green)", boxShadow: "0 0 18px rgba(107,240,131,0.2)", background: "rgba(12,24,18,0.45)" }}>
              <div className="t-label" style={{ fontSize: 9, color: "var(--phos-green)" }}>NET PNL · 30D</div>
              <div className="t-num" style={{ fontSize: 30, color: "var(--phos-green)", textShadow: "0 0 10px var(--phos-green-glow)" }}>+{fmt$(pnl.total30d)}</div>
              <div className="t-label" style={{ fontSize: 9, color: "var(--ink-300)", marginTop: 3 }}>7D · +{fmt$(pnl.total7d)}</div>
            </div>
            <div className="agent-stat-card">
              <div className="t-label" style={{ fontSize: 9 }}>ALL-TIME</div>
              <div className="t-num" style={{ fontSize: 24, color: "var(--ink-100)" }}>+{fmt$(pnl.totalAllTime)}</div>
              <div className="t-label" style={{ fontSize: 9, color: "var(--ink-300)", marginTop: 3 }}>AVG TICKET · {fmt$(pnl.avgTicket)}</div>
            </div>
            <div className="agent-stat-card">
              <div className="t-label" style={{ fontSize: 9 }}>SHARPE</div>
              <div className="t-num" style={{ fontSize: 24, color: "var(--phos-cyan)" }}>{pnl.sharpe.toFixed(2)}</div>
              <div className="t-label" style={{ fontSize: 9, color: "var(--phos-red)", marginTop: 3 }}>MAX DD · {fmt$(pnl.maxDrawdown)}</div>
            </div>
            <div className="agent-stat-card">
              <div className="t-label" style={{ fontSize: 9 }}>WINRATE · ELO</div>
              <div className="t-num" style={{ fontSize: 24, color }}>{winrate}% · {a.elo}</div>
              <div className="t-label" style={{ fontSize: 9, color: "var(--ink-300)", marginTop: 3 }}>{a.wins}W · {a.loss}L</div>
            </div>
          </div>
        )}
      </Panel>

      {/* Full-width equity curve */}
      {pnl && (
        <Panel
          label="◆ PNL · EQUITY CURVE · LAST 30 DAYS"
          right={
            <div className="agent-chart-meta">
              <span className="t-label" style={{ fontSize: 9 }}>7D <span className="t-num" style={{ color: "var(--phos-green)", fontSize: 11 }}>+{fmt$(pnl.total7d)}</span></span>
              <span className="t-label" style={{ fontSize: 9 }}>MAX DD <span className="t-num" style={{ color: "var(--phos-red)", fontSize: 11 }}>{fmt$(pnl.maxDrawdown)}</span></span>
              <span className="t-label" style={{ fontSize: 9 }}>AVG TICKET <span className="t-num" style={{ color: "var(--ink-100)", fontSize: 11 }}>{fmt$(pnl.avgTicket)}</span></span>
            </div>
          }
          style={{ marginTop: 16 }}
        >
          <div style={{ padding: "16px 20px 10px" }}>
            <PnlChart data={pnl.curve30d} color="var(--phos-green)" />
          </div>
          <div className="agent-chart-stats">
            <div>
              <div className="t-label" style={{ fontSize: 9 }}>BIGGEST WIN</div>
              <div className="t-num" style={{ fontSize: 18, color: "var(--phos-green)" }}>+{fmt$(pnl.biggestWin)}</div>
            </div>
            <div>
              <div className="t-label" style={{ fontSize: 9 }}>BIGGEST LOSS</div>
              <div className="t-num" style={{ fontSize: 18, color: "var(--phos-red)" }}>{fmt$(pnl.biggestLoss)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="t-label" style={{ fontSize: 9 }}>NOW</div>
              <div className="t-num" style={{ fontSize: 18, color: "var(--phos-green)", textShadow: "0 0 10px var(--phos-green-glow)" }}>+{fmt$(pnl.total30d)}</div>
            </div>
          </div>
        </Panel>
      )}

      <Panel label="◼ RECENT MATCHES" right={<button className="btn ghost" style={{ fontSize: 10 }}>VIEW ALL →</button>} style={{ marginTop: 16 }}>
        <div className="table-scroll">
          <div className="matches-table">
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 90px 90px 110px 70px 80px", padding: "8px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-panel-2)" }}>
            {["RESULT", "OPPONENT", "GAME", "SCORE", "PNL", "DATE", ""].map(h => (
              <span key={h} className="t-label" style={{ fontSize: 9 }}>{h}</span>
            ))}
          </div>
          {(matches || []).map((m, i) => {
            const opp = agentMap.get(m.opp);
            const rc = m.result === "WIN" ? "var(--phos-green)" : m.result === "LOSS" ? "var(--phos-red)" : "var(--phos-cyan)";
            const pc = m.pnl == null ? "var(--ink-400)" : m.pnl >= 0 ? "var(--phos-green)" : "var(--phos-red)";
            const pnlStr = m.pnl == null ? "—" : (m.pnl >= 0 ? "+" : "") + fmt$(m.pnl);
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr 90px 90px 110px 70px 80px", padding: "10px 16px", borderBottom: i < (matches || []).length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}>
                <span className="t-mono" style={{ fontSize: 11, color: rc, fontWeight: 600, textShadow: `0 0 6px ${rc}` }}>
                  {m.result === "LIVE" ? "● LIVE" : m.result}
                </span>
                {opp ? (
                  <Link href={`/agent/${opp.slug}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AgentGlyph agent={opp} size={20} spin={false} />
                    <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)" }}>{opp.handle}</span>
                  </Link>
                ) : (
                  <span>{m.opp}</span>
                )}
                <span className="t-label" style={{ fontSize: 10, color: "var(--phos-cyan)" }}>{m.game}</span>
                <span className="t-num" style={{ fontSize: 11, color: "var(--ink-200)" }}>{m.score}</span>
                <span className="t-num" style={{ fontSize: 12, color: pc, textShadow: m.pnl != null && m.pnl !== 0 ? `0 0 6px ${pc}` : "none" }}>{pnlStr}</span>
                <span className="t-label" style={{ fontSize: 9 }}>{m.date}</span>
                <button className="btn ghost" style={{ fontSize: 9, padding: "4px 8px" }}>REPLAY</button>
              </div>
            );
          })}
          </div>
        </div>
      </Panel>
    </div>
  );
}
