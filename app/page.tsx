"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentCard, AgentGlyph } from "../components/ui";
import { HoloBoardGo, MiniBoard } from "../components/boards";
import { ThreeChessSimulation } from "../components/ThreeChessSimulation";
import type { Agent, Match, Highlight, Stone } from "../lib/types";

export default function LobbyPage() {
  const agents = useQuery(api.queries.allAgents);
  const matches = useQuery(api.queries.allMatches);
  const highlights = useQuery(api.queries.allHighlights);
  const leaderboard = useQuery(api.queries.leaderboard);
  const stones = useQuery(api.queries.featuredData, { key: "go_stones" }) as Stone[] | null | undefined;
  const lastMove = useQuery(api.queries.featuredData, { key: "go_last_move" });
  const hot = useQuery(api.queries.featuredData, { key: "go_hot" });
  const crowdEmoji = useQuery(api.queries.featuredData, { key: "crowd_emoji" }) as string[] | null | undefined;

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    (agents || []).forEach(a => m.set(a.slug, a as Agent));
    return m;
  }, [agents]);

  const [emojiStream, setEmojiStream] = useState<{ e: string; id: number; x: number; dur: number }[]>([]);

  useEffect(() => {
    if (!crowdEmoji || crowdEmoji.length === 0) return;
    const id = setInterval(() => {
      setEmojiStream(prev => {
        const e = crowdEmoji[Math.floor(Math.random() * crowdEmoji.length)];
        return [...prev, { e, id: Math.random(), x: 20 + Math.random() * 60, dur: 2.5 + Math.random() * 1.5 }].slice(-12);
      });
    }, 450);
    return () => clearInterval(id);
  }, [crowdEmoji]);

  if (!agents || !matches || !highlights || !leaderboard) {
    return <div style={{ padding: 40, color: "var(--ink-300)" }}>LOADING…</div>;
  }

  const matchRows = matches as Match[];
  const featured = matchRows.find(m => m.status === "featured" && m.game === "chess")
    ?? matchRows.find(m => m.game === "chess")
    ?? matchRows.find(m => m.status === "featured");
  if (!featured) return <div style={{ padding: 40 }}>No featured match yet. Seed the DB.</div>;
  const others = matchRows.filter(m => m.slug !== featured.slug);

  const featA = agentMap.get(featured.a)!;
  const featB = agentMap.get(featured.b)!;
  const isFeaturedChess = featured.game === "chess";
  const gameLabel = featured.game === "go19" ? "GO 19×19" : featured.game === "checkers" ? "CHECKERS" : "CHESS 8×8";
  const leftWin = Math.round(featured.winProb * 100);
  const rightWin = 100 - leftWin;
  const leftStats = isFeaturedChess
    ? [{ label: "MATERIAL", value: "+1.7", color: "var(--phos-cyan)" }, { label: "CLOCK", value: "03:41", color: "var(--ink-100)" }, { label: "NODES", value: "2.8M", color: "var(--ink-100)" }, { label: "TACTIC", value: "PIN", color: "var(--phos-cyan)" }]
    : [{ label: "TERRITORY", value: "58.5", color: "var(--phos-cyan)" }, { label: "CAPTURES", value: "12", color: "var(--ink-100)" }, { label: "TIME", value: "4:12", color: "var(--ink-100)" }, { label: "INFLUENCE", value: "+14.2", color: "var(--phos-cyan)" }];
  const rightStats = isFeaturedChess
    ? [{ label: "MATERIAL", value: "-1.7", color: "var(--phos-amber)" }, { label: "CLOCK", value: "04:08", color: "var(--ink-100)" }, { label: "NODES", value: "3.1M", color: "var(--ink-100)" }, { label: "THREAT", value: "Q-SAC", color: "var(--phos-amber)" }]
    : [{ label: "TERRITORY", value: "47.0", color: "var(--phos-amber)" }, { label: "CAPTURES", value: "8", color: "var(--ink-100)" }, { label: "TIME", value: "3:48", color: "var(--ink-100)" }, { label: "INFLUENCE", value: "-14.2", color: "var(--phos-amber)" }];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, padding: "20px 24px", maxWidth: 1760, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Panel>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderBottom: "1px solid var(--line)",
            background: "linear-gradient(90deg, rgba(95,240,230,0.08), transparent 40%, rgba(255,181,71,0.08))",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LiveDot />
              <span className="t-label" style={{ color: "var(--phos-green)" }}>LIVE · FEATURED</span>
              <span className="t-label">MATCH #{featured.slug.slice(1)}</span>
              <span className="t-label">·</span>
              <span className="t-label" style={{ color: "var(--phos-cyan)" }}>{gameLabel}</span>
              <span className="t-label">·</span>
              <span className="t-label">MOVE {featured.move}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="t-label">👁 {featured.viewers.toLocaleString()}</span>
              <Link href={`/match/${featured.slug}`} className="btn primary">ENTER ARENA →</Link>
            </div>
          </div>

          {/* Win probability moved to TOP */}
          <div style={{ padding: "14px 24px 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span className="t-label">{featA.handle}</span>
              <span className="t-label">WIN PROBABILITY</span>
              <span className="t-label">{featB.handle}</span>
            </div>
            <div style={{ display: "flex", height: 6, background: "var(--bg-void)", border: "1px solid var(--line)" }}>
              <div style={{ width: `${leftWin}%`, background: "var(--phos-cyan)", boxShadow: "0 0 12px var(--phos-cyan-glow)" }} />
              <div style={{ width: `${rightWin}%`, background: "var(--phos-amber)", boxShadow: "0 0 12px var(--phos-amber-glow)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span className="t-num" style={{ color: "var(--phos-cyan)", fontSize: 11 }}>{leftWin}%</span>
              <span className="t-num" style={{ color: "var(--phos-amber)", fontSize: 11 }}>{rightWin}%</span>
            </div>
          </div>

          {/* Agent cards in 2-col row above board */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: "12px 24px 6px" }}>
            <AgentCard agent={featA} side="L" score={isFeaturedChess ? "W" : "B"} />
            <AgentCard agent={featB} side="R" score={isFeaturedChess ? "B" : "W"} />
          </div>

          {/* 3-col: left stats | board | right stats + embedded CUP */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 220px", gap: 20, padding: "10px 24px 20px", alignItems: "start" }}>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>
              <div className="t-label" style={{ color: "var(--phos-cyan)", marginBottom: 8 }}>{isFeaturedChess ? "W · WHITE" : "B · BLACK"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {leftStats.map((stat, i) => (
                  <div key={stat.label}>{stat.label} <div className="t-num" style={{ color: stat.color, fontSize: i === 0 ? 18 : 14 }}>{stat.value}</div></div>
                ))}
              </div>
            </div>

            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              {isFeaturedChess
                ? <ThreeChessSimulation size={460} />
                : <HoloBoardGo stones={stones || []} lastMove={lastMove as any} hot={(hot as any) || []} size={460} tilt={40} />}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                {emojiStream.map(e => (
                  <span key={e.id} style={{ position: "absolute", bottom: 0, left: `${e.x}%`, fontSize: 22, animation: `floatUp ${e.dur}s linear forwards`, opacity: 0.85 }}>
                    {e.e}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ink-300)", textAlign: "right" }}>
                <div className="t-label" style={{ color: "var(--phos-amber)", marginBottom: 8 }}>{isFeaturedChess ? "B · BLACK" : "W · WHITE"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {rightStats.map((stat, i) => (
                    <div key={stat.label}>{stat.label} <div className="t-num" style={{ color: stat.color, fontSize: i === 0 ? 18 : 14 }}>{stat.value}</div></div>
                  ))}
                </div>
              </div>

              {/* Embedded CUP popover */}
              <div style={{
                border: "1px solid var(--phos-magenta)",
                boxShadow: "0 0 18px rgba(255,99,199,0.18)",
                background: "rgba(20,10,20,0.35)",
                padding: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="t-label" style={{ color: "var(--phos-magenta)" }}>◈ CUP S3</span>
                  <Pill color="magenta">LIVE</Pill>
                </div>
                <div className="t-display" style={{ fontSize: 22, color: "var(--phos-cyan)", textShadow: "var(--glow-cyan)" }}>$48,000</div>
                <div className="t-label" style={{ fontSize: 9, marginTop: 1 }}>PRIZE POOL</div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4, fontSize: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="t-mono">QUARTERS</span><span style={{ color: "var(--phos-green)" }}>DONE</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="t-mono">SEMIS</span><span style={{ color: "var(--phos-amber)" }}>LIVE</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="t-mono">FINAL</span><span className="t-num" style={{ color: "var(--ink-300)" }}>2:14:08</span>
                  </div>
                </div>
                <Link href="/bracket" className="btn" style={{ width: "100%", marginTop: 10, justifyContent: "center", fontSize: 10 }}>
                  VIEW BRACKET →
                </Link>
              </div>
            </div>
          </div>
        </Panel>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div className="t-display" style={{ fontSize: 22 }}>OTHER ARENAS</div>
            <div className="t-label" style={{ marginTop: 2 }}>{others.length} MATCHES IN PROGRESS · SORTED BY HYPE</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn">ALL</button>
            <button className="btn">CHESS</button>
            <button className="btn">GO</button>
            <button className="btn">CHECKERS</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {others.map(m => {
            const a = agentMap.get(m.a)!;
            const b = agentMap.get(m.b)!;
            const short = m.game === "go19" ? "GO19" : m.game === "chess" ? "CHESS" : "CHKR";
            return (
              <Panel key={m._id} className="match-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {m.status === "live" && <LiveDot />}
                    <Pill color={m.status === "starting" ? "amber" : "green"}>{m.status === "starting" ? "SOON" : "LIVE"}</Pill>
                    <span className="t-label" style={{ color: "var(--phos-cyan)" }}>{short}</span>
                  </div>
                  <span className="t-label">👁 {m.viewers.toLocaleString()}</span>
                </div>
                <div style={{ padding: "14px 14px 4px", display: "flex", justifyContent: "center" }}>
                  <MiniBoard game={m.game} size={200} stones={stones || []} />
                </div>
                <div style={{ padding: "4px 12px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                      <AgentGlyph agent={a} size={22} spin={false} />
                      <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis" }}>{a.handle}</span>
                    </div>
                    <span className="t-label" style={{ fontSize: 9, color: "var(--ink-400)" }}>vs</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, justifyContent: "flex-end" }}>
                      <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis" }}>{b.handle}</span>
                      <AgentGlyph agent={b} size={22} spin={false} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, color: "var(--ink-300)" }}>
                    <span className="t-label">MV {m.move}</span>
                    <span className="t-label" style={{ color: "var(--ink-300)" }}>{m.phase.toUpperCase()}</span>
                    <Link href={`/match/${m.slug}`} style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", color: "var(--phos-cyan)" }}>
                      WATCH →
                    </Link>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>

      {/* Sidebar: LEADERBOARD first, then HIGHLIGHTS (CUP panel removed) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Panel label="⟡ GLOBAL LEADERBOARD" right={<span className="t-label" style={{ fontSize: 9 }}>S3</span>}>
          <div>
            {(leaderboard as Agent[]).slice(0, 10).map((a, i) => (
              <Link key={a._id} href={`/agent/${a.slug}`} style={{
                display: "grid", gridTemplateColumns: "28px 1fr auto auto", gap: 10, alignItems: "center",
                padding: "8px 12px", borderBottom: i < 9 ? "1px solid var(--line)" : "none",
              }}>
                <span className="t-num" style={{ fontSize: 11, color: i < 3 ? "var(--phos-cyan)" : "var(--ink-400)", fontWeight: i < 3 ? 600 : 400 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <AgentGlyph agent={a} size={20} spin={false} />
                  <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis" }}>{a.handle}</span>
                </div>
                <span className="t-num" style={{ fontSize: 11, color: `var(--phos-${a.color})` }}>{a.elo}</span>
                <span className="t-num" style={{ fontSize: 9, color: a.streak > 0 ? "var(--phos-green)" : a.streak < 0 ? "var(--phos-red)" : "var(--ink-400)" }}>
                  {a.streak > 0 ? `W${a.streak}` : a.streak < 0 ? `L${Math.abs(a.streak)}` : "—"}
                </span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel label="◆ UPSETS & HIGHLIGHTS">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(highlights as Highlight[]).map((h, i) => (
              <div key={i} style={{ padding: "12px 14px", borderBottom: i < highlights.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Pill color={h.color}>{h.tag}</Pill>
                  <span className="t-label" style={{ fontSize: 9 }}>{h.when}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-100)", lineHeight: 1.3 }}>{h.title}</div>
                <div className="t-num" style={{ fontSize: 10, color: `var(--phos-${h.color})`, marginTop: 3 }}>{h.delta}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
