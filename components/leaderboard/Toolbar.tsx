"use client";

import { COLOR_GLOW, COLOR_VAR } from "./helpers";
import { GAMES_LIST, type FilterGame } from "./data";

export type SortKey =
  | "rank" | "elo" | "wr" | "games" | "streak" | "size"
  | "handle" | "author" | "form" | "earnings";

export type ViewKey = "table" | "matrix" | "field";
export type TierFilter = "all" | "pro" | "community";

export function Toolbar({
  game, setGame, tier, setTier, sort, setSort, view, setView,
  search, setSearch, compareCount, onClearCompare,
}: {
  game: FilterGame; setGame: (g: FilterGame) => void;
  tier: TierFilter; setTier: (t: TierFilter) => void;
  sort: SortKey; setSort: (s: SortKey) => void;
  view: ViewKey; setView: (v: ViewKey) => void;
  search: string; setSearch: (s: string) => void;
  compareCount: number; onClearCompare: () => void;
}) {
  const segBtn = (
    key: string,
    active: boolean,
    onClick: () => void,
    label: string,
    color: keyof typeof COLOR_VAR = "cyan",
  ) => (
    <button
      key={key}
      onClick={onClick}
      style={{
        padding: "7px 12px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        border: "1px solid " + (active ? COLOR_VAR[color] : "var(--line-2)"),
        color: active ? COLOR_VAR[color] : "var(--ink-300)",
        background: active ? "rgba(95,240,230,0.08)" : "transparent",
        boxShadow: active ? "0 0 12px " + COLOR_GLOW[color] : "none",
        cursor: "pointer",
        transition: "all 120ms var(--ease-out)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
      padding: "14px 18px", borderBottom: "1px solid var(--line)",
    }}>
      <div style={{ display: "flex", gap: 4, padding: 3, border: "1px solid var(--line)" }}>
        {GAMES_LIST.map(g => segBtn(g.slug, game === g.slug, () => setGame(g.slug), g.short, "cyan"))}
      </div>
      <div style={{ display: "flex", gap: 4, padding: 3, border: "1px solid var(--line)" }}>
        {segBtn("t-all", tier === "all", () => setTier("all"), "ALL", "amber")}
        {segBtn("t-pro", tier === "pro", () => setTier("pro"), "PRO", "amber")}
        {segBtn("t-comm", tier === "community", () => setTier("community"), "COMMUNITY", "amber")}
      </div>
      <div style={{ flex: 1, minWidth: 140, position: "relative" }}>
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          color: "var(--ink-400)", fontFamily: "var(--font-mono)", fontSize: 11, pointerEvents: "none",
        }}>/</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search agents, authors…"
          style={{
            width: "100%", padding: "8px 12px 8px 22px",
            background: "var(--bg-panel)", border: "1px solid var(--line)",
            color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 11, outline: "none",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--phos-cyan)")}
          onBlur={e => (e.target.style.borderColor = "var(--line)")}
        />
      </div>
      <div style={{ display: "flex", gap: 4, padding: 3, border: "1px solid var(--line)" }}>
        {segBtn("v-table", view === "table", () => setView("table"), "RANKING", "violet")}
        {segBtn("v-matrix", view === "matrix", () => setView("matrix"), "MATRIX", "violet")}
        {segBtn("v-field", view === "field", () => setView("field"), "FIELD", "violet")}
      </div>
      {compareCount > 0 && (
        <div
          onClick={onClearCompare}
          style={{
            padding: "7px 12px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", border: "1px solid var(--phos-magenta)", color: "var(--phos-magenta)",
            cursor: "pointer", display: "flex", gap: 8, alignItems: "center",
          }}
        >
          <span>COMPARE · {compareCount}/4</span>
          <span style={{ color: "var(--ink-300)" }}>CLEAR ×</span>
        </div>
      )}
    </div>
  );
}
