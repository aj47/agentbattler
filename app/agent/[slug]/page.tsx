"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Panel, Pill, AgentGlyph } from "../../../components/ui";
import type { Agent } from "../../../lib/types";

export default function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const agent = useQuery(api.queries.agentBySlug, { slug });
  const leaderboard = useQuery(api.queries.leaderboard);
  const matches = useQuery(api.queries.profileMatches, { agentSlug: slug });
  const allAgents = useQuery(api.queries.allAgents);
  const source = useQuery(api.queries.featuredData, { key: "profile_source" }) as string | null | undefined;

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
    <div style={{ padding: "20px 28px", maxWidth: 1760, margin: "0 auto" }}>
      <div style={{ fontSize: 11, color: "var(--ink-300)", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
        <Link href="/">LOBBY</Link>
        <span style={{ margin: "0 8px", color: "var(--ink-400)" }}>/</span>
        <Link href="/bracket">BRACKET</Link>
        <span style={{ margin: "0 8px", color: "var(--ink-400)" }}>/</span>
        <span style={{ color }}>AGENT · {a.handle}</span>
      </div>

      <Panel>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 28, padding: "28px 32px", alignItems: "center", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", right: -60, top: "50%", transform: "translateY(-50%)",
            fontSize: 400, fontFamily: "var(--font-display)",
            color, opacity: 0.05, lineHeight: 0.7, pointerEvents: "none",
          }}>{a.glyph}</div>

          <AgentGlyph agent={a} size={140} />

          <div style={{ zIndex: 1 }}>
            <div className="t-label" style={{ color }}>#{rank} GLOBAL · {a.author}</div>
            <div className="t-display" style={{ fontSize: 48, letterSpacing: "-0.02em", marginTop: 6 }}>{a.handle}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--ink-200)", maxWidth: 640, fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--ink-400)" }}>{"/* "}</span>{a.bio}<span style={{ color: "var(--ink-400)" }}>{" */"}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {a.hot && <Pill color="magenta">◉ HOT</Pill>}
              {a.streak > 5 && <Pill color="green">W{a.streak} STREAK</Pill>}
              <Pill color="cyan">{a.personality.toUpperCase()}</Pill>
              <Pill color="gray">{a.size}kb / 50kb</Pill>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, zIndex: 1 }}>
            {[
              { k: "ELO", v: a.elo, c: color },
              { k: "WINRATE", v: winrate + "%", c: "var(--phos-green)" },
              { k: "WINS", v: a.wins, c: "var(--ink-100)" },
              { k: "LOSSES", v: a.loss, c: "var(--ink-100)" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "10px 14px", border: "1px solid var(--line)", minWidth: 110 }}>
                <div className="t-label" style={{ fontSize: 9 }}>{s.k}</div>
                <div className="t-num" style={{ fontSize: 22, color: s.c, textShadow: i === 0 ? `0 0 10px ${color}` : "none" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 32px 20px", marginTop: -6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="t-label" style={{ fontSize: 9 }}>SOURCE SIZE · {a.size}KB USED OF 50KB LIMIT</span>
            <span className="t-num" style={{ fontSize: 10, color: "var(--ink-300)" }}>{Math.round((a.size / 50) * 100)}%</span>
          </div>
          <div style={{ height: 4, background: "var(--bg-void)", border: "1px solid var(--line)" }}>
            <div style={{ height: "100%", width: `${(a.size / 50) * 100}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
          </div>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16, marginTop: 16 }}>
        <Panel label="◂ SOURCE · MAIN.JS" right={<span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)" }}>READ-ONLY</span>}>
          <pre style={{ padding: "14px 16px", fontSize: 11, lineHeight: 1.55, fontFamily: "var(--font-mono)", color: "var(--ink-200)", background: "var(--bg-void)", overflow: "auto", maxHeight: 380, whiteSpace: "pre-wrap" }}>
            {(source || "").split("\n").map((line, i) => {
              let c = "var(--ink-200)";
              if (line.startsWith("//")) c = "var(--ink-400)";
              else if (line.includes("export") || line.includes("return") || line.includes("const")) c = "var(--phos-magenta)";
              else if (line.includes("function") || line.includes("act")) c = "var(--phos-cyan)";
              return (
                <div key={i} style={{ color: c, display: "flex" }}>
                  <span style={{ color: "var(--ink-500)", width: 28, textAlign: "right", marginRight: 12, userSelect: "none" }}>{i + 1}</span>
                  <span style={{ flex: 1 }}>{line}</span>
                </div>
              );
            })}
          </pre>
        </Panel>

        <Panel label="◆ ELO · LAST 30 DAYS">
          <div style={{ padding: "18px 16px" }}>
            <div style={{ position: "relative", height: 140 }}>
              <svg width="100%" height="100%" viewBox="0 0 300 140" preserveAspectRatio="none">
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={i * 35} x2="300" y2={i * 35} stroke="var(--line)" strokeWidth="0.5" />
                ))}
                <path d="M 0 90 L 20 80 L 40 82 L 60 70 L 80 75 L 100 62 L 120 55 L 140 60 L 160 45 L 180 50 L 200 40 L 220 35 L 240 30 L 260 32 L 280 22 L 300 18 L 300 140 L 0 140 Z" fill={color} opacity="0.15" />
                <path d="M 0 90 L 20 80 L 40 82 L 60 70 L 80 75 L 100 62 L 120 55 L 140 60 L 160 45 L 180 50 L 200 40 L 220 35 L 240 30 L 260 32 L 280 22 L 300 18" fill="none" stroke={color} strokeWidth="1.4" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
                <circle cx="300" cy="18" r="4" fill={color} />
                <circle cx="300" cy="18" r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.5">
                  <animate attributeName="r" from="4" to="12" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.8" to="0" dur="1.4s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <div><div className="t-label" style={{ fontSize: 9 }}>30D AGO</div>
                <div className="t-num" style={{ fontSize: 15, color: "var(--ink-300)" }}>2,754</div></div>
              <div style={{ textAlign: "right" }}>
                <div className="t-label" style={{ fontSize: 9 }}>NOW · Δ</div>
                <div className="t-num" style={{ fontSize: 15, color: "var(--phos-green)" }}>+{a.elo - 2754}</div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel label="◇ TACTICAL DOSSIER">
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div className="t-label" style={{ fontSize: 9 }}>FAVORITE OPENING</div>
              <div className="t-mono" style={{ fontSize: 13, color: "var(--ink-100)", marginTop: 3 }}>4-4 / 3-4 Influence</div>
              <div className="t-label" style={{ fontSize: 9, color: "var(--ink-400)", marginTop: 2 }}>USED IN 68% OF GAMES</div>
            </div>
            <div>
              <div className="t-label" style={{ fontSize: 9 }}>SIGNATURE MOVE</div>
              <div className="t-mono" style={{ fontSize: 13, color, marginTop: 3, textShadow: `0 0 6px ${color}` }}>3-3 INVASION (MOVE 28-42)</div>
              <div className="t-label" style={{ fontSize: 9, color: "var(--ink-400)", marginTop: 2 }}>88% SUCCESS RATE</div>
            </div>
            <div>
              <div className="t-label" style={{ fontSize: 9 }}>WEAKNESS</div>
              <div className="t-mono" style={{ fontSize: 13, color: "var(--phos-red)", marginTop: 3 }}>KO FIGHTS · 51% WIN</div>
              <div className="t-label" style={{ fontSize: 9, color: "var(--ink-400)", marginTop: 2 }}>OPPONENTS BAIT THIS OFTEN</div>
            </div>
            <div>
              <div className="t-label" style={{ fontSize: 9 }}>QUIRK</div>
              <div className="t-mono" style={{ fontSize: 13, color: "var(--ink-200)", marginTop: 3 }}>NEVER TENUKIS EARLY</div>
              <div className="t-label" style={{ fontSize: 9, color: "var(--ink-400)", marginTop: 2 }}>0 TENUKI IN FIRST 20 MOVES</div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel label="◼ RECENT MATCHES" right={<button className="btn ghost" style={{ fontSize: 10 }}>VIEW ALL →</button>} style={{ marginTop: 16 }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 100px 100px 80px 80px", padding: "8px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-panel-2)" }}>
            {["RESULT", "OPPONENT", "GAME", "SCORE", "DATE", ""].map(h => (
              <span key={h} className="t-label" style={{ fontSize: 9 }}>{h}</span>
            ))}
          </div>
          {(matches || []).map((m, i) => {
            const opp = agentMap.get(m.opp);
            const rc = m.result === "WIN" ? "var(--phos-green)" : m.result === "LOSS" ? "var(--phos-red)" : "var(--phos-cyan)";
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 100px 100px 80px 80px", padding: "10px 16px", borderBottom: i < (matches || []).length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}>
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
                <span className="t-label" style={{ fontSize: 9 }}>{m.date}</span>
                <button className="btn ghost" style={{ fontSize: 9, padding: "4px 8px" }}>REPLAY</button>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
