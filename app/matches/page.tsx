"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentGlyph } from "../../components/ui";
import type { Agent, Match } from "../../lib/types";

const GAME_FILTERS = ["ALL", "CHESS", "GO", "CHECKERS"] as const;
type GameFilter = typeof GAME_FILTERS[number];

export default function MatchesPage() {
  const matchIndex = useQuery(api.queries.matchesIndex);
  const matches = matchIndex?.matches;
  const agents   = useQuery(api.queries.allAgents);
  const [filter, setFilter] = useState<GameFilter>("ALL");
  const [search, setSearch] = useState("");

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    (agents ?? []).forEach(a => m.set(a.slug, a as Agent));
    return m;
  }, [agents]);

  const filtered = useMemo(() => {
    if (!matches) return [];
    let list = [...(matches as Match[])];
    if (filter === "CHESS")    list = list.filter(m => m.game === "chess");
    if (filter === "GO")       list = list.filter(m => m.game === "go19");
    if (filter === "CHECKERS") list = list.filter(m => m.game === "checkers");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.slug.includes(q) ||
        agentMap.get(m.a)?.handle.toLowerCase().includes(q) ||
        agentMap.get(m.b)?.handle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [matches, filter, search, agentMap]);

  const counts = matchIndex?.counts ?? { live: 0, starting: 0, total: 0 };

  if (!matches || !agents) {
    return <div className="page-shell" style={{ color: "var(--ink-300)" }}>LOADING…</div>;
  }

  return (
    <div className="page-shell" style={{ paddingTop: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <div className="t-display" style={{ fontSize: 28 }}>ALL MATCHES</div>
            <div className="t-label" style={{ marginTop: 4, color: "var(--ink-400)" }}>
              <span style={{ color: "var(--phos-green)" }}>{counts.live} LIVE</span>
              {" · "}
              <span style={{ color: "var(--phos-amber)" }}>{counts.starting} STARTING</span>
              {" · "}
              {counts.total} TOTAL
            </div>
          </div>
          <Link href="/" className="btn">← LOBBY</Link>
        </div>

        {/* Filters + search */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div className="filter-row">
            {GAME_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn"
                style={filter === f ? { borderColor: "var(--phos-cyan)", color: "var(--phos-cyan)" } : {}}
              >{f}</button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search agent or match…"
            style={{
              background: "var(--bg-void)", border: "1px solid var(--line)",
              color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 11,
              padding: "6px 10px", outline: "none", borderRadius: 2, width: 220,
            }}
          />
          <span className="t-label" style={{ color: "var(--ink-400)" }}>{filtered.length} RESULTS</span>
        </div>
      </div>

      {/* Table */}
      <Panel style={{ overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 1fr 70px 70px 80px 90px 100px",
          padding: "8px 16px",
          borderBottom: "1px solid var(--line)",
          background: "rgba(5,7,13,0.6)",
        }}>
          {["MATCH","AGENT A","AGENT B","GAME","MOVE","PHASE","VIEWERS",""].map(h => (
            <span key={h} className="t-label" style={{ fontSize: 9, color: "var(--ink-400)" }}>{h}</span>
          ))}
        </div>

        {filtered.map((m, i) => {
          const a = agentMap.get(m.a);
          const b = agentMap.get(m.b);
          const short = m.game === "go19" ? "GO19" : m.game === "chess" ? "CHESS" : "CHKR";
          const isLive = m.status === "live" || m.status === "featured";
          const isFeatured = m.status === "featured";

          return (
            <div
              key={m._id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 1fr 70px 70px 80px 90px 100px",
                padding: "10px 16px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none",
                alignItems: "center",
                background: isFeatured ? "rgba(95,240,230,0.04)" : "transparent",
              }}
            >
              {/* Match slug */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {isLive && <LiveDot />}
                <span className="t-num" style={{ fontSize: 10, color: isFeatured ? "var(--phos-cyan)" : "var(--ink-300)" }}>
                  #{m.slug.slice(1)}
                </span>
              </div>

              {/* Agent A */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                {a && <AgentGlyph agent={a} size={16} spin={false} />}
                <span className="t-mono" style={{ fontSize: 11, color: "var(--phos-cyan)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a?.handle ?? m.a}
                </span>
              </div>

              {/* Agent B */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                {b && <AgentGlyph agent={b} size={16} spin={false} />}
                <span className="t-mono" style={{ fontSize: 11, color: "var(--phos-amber)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b?.handle ?? m.b}
                </span>
              </div>

              {/* Game */}
              <Pill color={m.game === "go19" ? "cyan" : m.game === "chess" ? "violet" : "amber"}>
                {short}
              </Pill>

              {/* Move */}
              <span className="t-num" style={{ fontSize: 11 }}>{m.move}</span>

              {/* Phase */}
              <span className="t-label" style={{ fontSize: 9, color: "var(--ink-400)" }}>{m.phase.toUpperCase()}</span>

              {/* Viewers */}
              <span className="t-num" style={{ fontSize: 11 }}>👁 {m.viewers.toLocaleString()}</span>

              {/* CTA */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {isFeatured && (
                  <span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)", alignSelf: "center" }}>FEATURED</span>
                )}
                <Link
                  href={`/match/${m.slug}`}
                  className="btn primary"
                  style={{ fontSize: 10, padding: "4px 10px" }}
                >
                  ENTER →
                </Link>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-400)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            NO MATCHES FOUND
          </div>
        )}
      </Panel>
    </div>
  );
}
