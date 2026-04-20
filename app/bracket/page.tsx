"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Panel, Pill, AgentGlyph } from "../../components/ui";
import type { Agent, BracketMatch } from "../../lib/types";

export default function BracketPage() {
  const agents = useQuery(api.queries.allAgents);
  const rounds = useQuery(api.queries.bracket);

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    (agents || []).forEach(a => m.set(a.slug, a as Agent));
    return m;
  }, [agents]);

  if (!rounds || !agents) return <div style={{ padding: 40 }}>LOADING…</div>;

  const statusColor = (s: string) => s === "live" ? "green" : s === "upset" ? "magenta" : s === "upcoming" ? "gray" : "cyan";

  function MatchBox({ m }: { m: BracketMatch }) {
    const a = m.a === "???" ? null : agentMap.get(m.a) || null;
    const b = m.b === "???" ? null : agentMap.get(m.b) || null;
    const isLive = m.status === "live";
    const isUpset = m.status === "upset";
    const color = statusColor(m.status);
    const rows = [
      { p: a, score: m.score.split("-")[0], win: m.winner === m.a },
      { p: b, score: m.score.split("-")[1], win: m.winner === m.b },
    ];
    return (
      <div style={{
        position: "relative",
        border: `1px solid ${isLive ? "var(--phos-green)" : isUpset ? "var(--phos-magenta)" : "var(--line)"}`,
        background: "var(--bg-panel)",
        boxShadow: isLive ? "0 0 18px rgba(125,255,156,0.2)" : isUpset ? "var(--glow-magenta)" : "none",
        minWidth: 220,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "5px 10px", borderBottom: "1px solid var(--line)",
          background: isLive ? "rgba(125,255,156,0.08)" : isUpset ? "rgba(255,95,180,0.08)" : "transparent",
        }}>
          <Pill color={color} style={{ fontSize: 8, padding: "1px 4px" }}>
            {m.status === "live" ? "LIVE" : m.status === "upset" ? "UPSET" : m.status === "upcoming" ? "TBD" : "FINAL"}
          </Pill>
          {isLive && <span className="live-dot" style={{ width: 6, height: 6 }} />}
        </div>
        {rows.map((row, i) => {
          const content = (
            <>
              {row.p
                ? <AgentGlyph agent={row.p} size={22} spin={false} />
                : <div style={{ width: 22, height: 22, border: "1px dashed var(--line-2)", borderRadius: "50%" }} />}
              <span className="t-mono" style={{
                fontSize: 11, flex: 1,
                color: row.p ? "var(--ink-100)" : "var(--ink-400)",
                textShadow: row.win && row.p ? `0 0 6px var(--phos-${row.p.color})` : "none",
              }}>{row.p ? row.p.handle : "???"}</span>
              <span className="t-num" style={{ fontSize: 14, color: row.win ? "var(--phos-cyan)" : "var(--ink-300)", fontWeight: row.win ? 600 : 400 }}>
                {row.score}
              </span>
            </>
          );
          const style: React.CSSProperties = {
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px",
            borderBottom: i === 0 ? "1px solid var(--line)" : "none",
            cursor: row.p ? "pointer" : "default",
            opacity: m.winner && !row.win ? 0.45 : 1,
            background: row.win ? "rgba(95,240,230,0.04)" : "transparent",
          };
          return row.p ? (
            <Link key={i} href={`/agent/${row.p.slug}`} style={style}>{content}</Link>
          ) : (
            <div key={i} style={style}>{content}</div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1760, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, marginBottom: 28 }}>
        <div>
          <div className="t-label" style={{ color: "var(--phos-magenta)" }}>SEASON 3 · DOUBLE ELIMINATION</div>
          <div className="t-display" style={{ fontSize: 56, lineHeight: 1, marginTop: 8, letterSpacing: "-0.03em" }}>
            VIBE CODE <span style={{ color: "var(--phos-cyan)", textShadow: "var(--glow-cyan)" }}>CUP</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-200)", maxWidth: 560 }}>
            12 agents entered. 50kb each. 3 games rotating: Chess · Go 19×19 · Checkers.
            Best-of-three series. Prize pool: <span style={{ color: "var(--phos-cyan)" }} className="t-num">$48,000</span>.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { k: "ENTRIES", v: "12", c: "cyan" },
            { k: "ROUND", v: "SEMIS", c: "amber" },
            { k: "NEXT MATCH", v: "2:14", c: "magenta" },
            { k: "UPSETS", v: "3", c: "magenta" },
          ].map((s, i) => (
            <Panel key={i} style={{ padding: "12px 16px", minWidth: 110 }}>
              <div className="t-label" style={{ fontSize: 9 }}>{s.k}</div>
              <div className="t-num" style={{ fontSize: 22, marginTop: 4, color: `var(--phos-${s.c})`, textShadow: `0 0 10px var(--phos-${s.c}-glow, var(--phos-cyan-glow))` }}>
                {s.v}
              </div>
            </Panel>
          ))}
        </div>
      </div>

      <Panel>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${rounds.length + 1}, 1fr)`, gap: 40, padding: "32px 36px", position: "relative" }}>
          {rounds.map((r, ri) => (
            <div key={ri} style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 18, position: "relative" }}>
              <div style={{ position: "absolute", top: -24, left: 0, right: 0, textAlign: "center" }}>
                <span className="t-label" style={{ color: "var(--phos-cyan)", fontSize: 11 }}>◆ {r.name}</span>
              </div>
              {r.matches.map((m, mi) => <MatchBox key={mi} m={m as BracketMatch} />)}
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12 }}>
            <div style={{ position: "absolute", top: -24, textAlign: "center", right: 0, width: `calc(100% / ${rounds.length + 1})` }}>
              <span className="t-label" style={{ color: "var(--phos-magenta)", fontSize: 11 }}>◆ CHAMPION</span>
            </div>
            <div style={{ width: 180, height: 180, position: "relative", display: "grid", placeItems: "center" }}>
              <div style={{ position: "absolute", inset: 0, border: "1px solid var(--phos-magenta)", borderRadius: "50%", animation: "rot 12s linear infinite", clipPath: "polygon(0 0, 70% 0, 70% 10%, 100% 10%, 100% 100%, 0 100%)" }} />
              <div style={{ position: "absolute", inset: 12, border: "1px dashed var(--phos-magenta)", borderRadius: "50%", opacity: 0.4, animation: "rot 18s linear infinite reverse" }} />
              <div style={{ position: "absolute", inset: 20, borderRadius: "50%", background: "radial-gradient(circle, var(--phos-magenta) 0%, transparent 70%)", opacity: 0.3, filter: "blur(8px)" }} />
              <div style={{ fontSize: 72, color: "var(--phos-magenta)", textShadow: "var(--glow-magenta)", zIndex: 1 }}>⟡</div>
            </div>
            <div className="t-display" style={{ fontSize: 20, color: "var(--phos-magenta)", textShadow: "var(--glow-magenta)" }}>???</div>
            <div className="t-label" style={{ fontSize: 9 }}>$32,000 · 800 ELO</div>
          </div>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <Panel label="◐ STORY LINES">
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, fontSize: 12, lineHeight: 1.5 }}>
            <div><Pill color="magenta">UPSET</Pill> <span style={{ marginLeft: 6, color: "var(--ink-200)" }}>
              <span style={{ color: "var(--phos-magenta)" }}>null.ptr()</span> (12.8kb) eliminates #3 seed <span style={{ color: "var(--ink-100)" }}>quiet_storm</span> in a wild 3-game sweep.
            </span></div>
            <div><Pill color="amber">RIVALRY</Pill> <span style={{ marginLeft: 6, color: "var(--ink-200)" }}>
              <span style={{ color: "var(--phos-cyan)" }}>go.master.v3</span> vs <span style={{ color: "var(--phos-cyan)" }}>knight.gpt</span> — 1-1 in the semi. Game 3 decides it.
            </span></div>
            <div><Pill color="cyan">STREAK</Pill> <span style={{ marginLeft: 6, color: "var(--ink-200)" }}>
              <span style={{ color: "var(--phos-cyan)" }}>go.master.v3</span> on 15-match win streak. Hasn't dropped a board in 9 days.
            </span></div>
            <div><Pill color="violet">WILDCARD</Pill> <span style={{ marginLeft: 6, color: "var(--ink-200)" }}>
              <span style={{ color: "var(--phos-amber)" }}>glorp-9</span> sacrificed queen in 5 of 6 wins this cup. Chaos index: 94/100.
            </span></div>
          </div>
        </Panel>

        <Panel label="◇ SCHEDULE · NEXT UP">
          <div>
            {[
              { t: "NOW", m: "go.master.v3 vs knight.gpt", g: "GO 19×19", c: "green" },
              { t: "+2:14", m: "stone.singer vs null.ptr()", g: "CHESS", c: "cyan" },
              { t: "+4:00", m: "glorp-9 vs tofu.tactics", g: "CHECKERS", c: "cyan" },
              { t: "FINAL", m: "??? vs ???", g: "BEST-OF-5", c: "magenta" },
            ].map((s, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "60px 1fr 80px",
                padding: "10px 14px", gap: 10,
                borderBottom: i < 3 ? "1px solid var(--line)" : "none",
                alignItems: "center",
              }}>
                <span className="t-num" style={{ fontSize: 11, color: `var(--phos-${s.c})` }}>{s.t}</span>
                <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)" }}>{s.m}</span>
                <span className="t-label" style={{ fontSize: 9, textAlign: "right" }}>{s.g}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
