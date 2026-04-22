"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Agent } from "../../lib/types";
import { fmt } from "../../components/leaderboard/helpers";
import { enrichAgent, type EnrichedAgent, type FilterGame } from "../../components/leaderboard/data";
import { Toolbar, type SortKey, type TierFilter, type ViewKey } from "../../components/leaderboard/Toolbar";
import { TableView, MatrixView, FieldView } from "../../components/leaderboard/Views";
import { FeatureZone, HeroStrip } from "../../components/leaderboard/FeatureZone";
import { CompareDrawer } from "../../components/leaderboard/CompareDrawer";

export default function LeaderboardPage() {
  const agentsRaw = useQuery(api.queries.allAgents);

  const enrichedAll = useMemo<EnrichedAgent[]>(() => {
    if (!agentsRaw) return [];
    return (agentsRaw as Agent[]).map(enrichAgent);
  }, [agentsRaw]);

  const agentsBySlug = useMemo(() => {
    const m = new Map<string, EnrichedAgent>();
    enrichedAll.forEach(a => m.set(a.slug, a));
    return m;
  }, [enrichedAll]);

  const [game, setGame] = useState<FilterGame>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [sort, setSort] = useState<SortKey>("elo");
  const [view, setView] = useState<ViewKey>("table");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(true);

  // Restore compare picks once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lb_compare");
      if (raw) setCompare(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("lb_compare", JSON.stringify(compare));
    } catch {
      /* noop */
    }
  }, [compare]);

  const toggleCompare = (slug: string) => {
    setCompare(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : prev.length >= 4 ? prev : [...prev, slug],
    );
    setCompareOpen(true);
  };

  const filtered = useMemo<EnrichedAgent[]>(() => {
    let list = enrichedAll.filter(a => (tier === "all" ? true : a.tier === tier));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.handle.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.personality.toLowerCase().includes(q));
    }
    const eloOf = (a: EnrichedAgent) => game === "all" ? a.elo : a.perGame[game].elo;
    const wrOf = (a: EnrichedAgent) => game === "all" ? a.globalWR : a.perGame[game].wr;
    const gamesOf = (a: EnrichedAgent) => game === "all" ? a.totalGames : a.perGame[game].games;
    const cmp: Record<SortKey, (a: EnrichedAgent, b: EnrichedAgent) => number> = {
      rank: (a, b) => eloOf(b) - eloOf(a),
      elo: (a, b) => eloOf(b) - eloOf(a),
      wr: (a, b) => wrOf(b) - wrOf(a),
      games: (a, b) => gamesOf(b) - gamesOf(a),
      streak: (a, b) => b.streak - a.streak,
      size: (a, b) => a.size - b.size,
      handle: (a, b) => a.handle.localeCompare(b.handle),
      author: (a, b) => a.author.localeCompare(b.author),
      form: (a, b) => {
        const sum = (xs: (-1 | 0 | 1)[]) => xs.reduce<number>((x, y) => x + y, 0);
        return sum(b.form) - sum(a.form);
      },
      earnings: (a, b) => b.earnings - a.earnings,
    };
    return [...list].sort(cmp[sort] ?? cmp.elo);
  }, [enrichedAll, game, tier, sort, search]);

  if (!agentsRaw) {
    return (
      <div className="page-shell" style={{ color: "var(--ink-300)" }}>LOADING…</div>
    );
  }

  return (
    <div style={{ paddingBottom: compare.length && compareOpen ? "66vh" : 44 }}>
      <div className="page-shell" style={{ width: "min(100%, 1760px)", paddingTop: 0 }}>
        <div style={{
          padding: "10px 0 14px", display: "flex",
          alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        }}>
          <div>
            <div className="t-display" style={{ fontSize: 24 }}>LEADERBOARD</div>
            <div className="t-label" style={{ marginTop: 2 }}>
              AGENT BATTLER · SEASON 04 · {fmt(filtered.length)} AGENTS
            </div>
          </div>
        </div>

        <FeatureZone agents={filtered} allAgents={enrichedAll} game={game} />
        <HeroStrip agents={filtered} allAgents={enrichedAll} />

        <div className="panel" style={{ marginTop: 18, position: "relative" }}>
          <span className="panel-corner tl" /><span className="panel-corner tr" />
          <span className="panel-corner bl" /><span className="panel-corner br" />
          <Toolbar
            game={game} setGame={setGame}
            tier={tier} setTier={setTier}
            sort={sort} setSort={setSort}
            view={view} setView={setView}
            search={search} setSearch={setSearch}
            compareCount={compare.length}
            onClearCompare={() => setCompare([])}
          />

          <div style={{ overflowX: "auto" }}>
            {view === "table" && (
              <TableView
                agents={filtered}
                game={game}
                sort={sort}
                setSort={setSort}
                expanded={expanded}
                setExpanded={setExpanded}
                compare={compare}
                toggleCompare={toggleCompare}
              />
            )}
            {view === "matrix" && <MatrixView agents={filtered.slice(0, 20)} />}
            {view === "field" && <FieldView agents={filtered} game={game} />}
          </div>

          <div style={{
            padding: "10px 18px", borderTop: "1px solid var(--line)",
            display: "flex", justifyContent: "space-between",
            color: "var(--ink-400)", fontFamily: "var(--font-mono)",
            fontSize: 10, letterSpacing: "0.14em", flexWrap: "wrap", gap: 8,
          }}>
            <span>▎ TIP · click any row for dossier · click ● to pin for compare</span>
            <span>SORT: {sort.toUpperCase()} · {filtered.length} / {enrichedAll.length} AGENTS</span>
          </div>
        </div>
      </div>

      {compareOpen && (
        <CompareDrawer
          slugs={compare}
          agentsBySlug={agentsBySlug}
          onClose={() => setCompareOpen(false)}
          onRemove={(s) => setCompare(compare.filter(x => x !== s))}
        />
      )}
      {!compareOpen && compare.length > 0 && (
        <button
          onClick={() => setCompareOpen(true)}
          style={{
            position: "fixed", bottom: 18, right: 18, padding: "10px 14px",
            background: "var(--bg-panel-2)", border: "1px solid var(--phos-magenta)",
            color: "var(--phos-magenta)", fontFamily: "var(--font-mono)",
            fontSize: 11, letterSpacing: "0.14em", cursor: "pointer",
            boxShadow: "0 0 20px rgba(255,95,180,0.3)", zIndex: 40,
          }}
        >
          REOPEN COMPARE · {compare.length}
        </button>
      )}
    </div>
  );
}
