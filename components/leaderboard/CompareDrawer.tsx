"use client";

import { Fragment } from "react";
import { Glyph, Sparkline, WLBadge, fmt, money, pct } from "./helpers";
import { GAMES_LIST, type EnrichedAgent, type GameSlug } from "./data";

const NON_ALL_GAMES = GAMES_LIST.filter(g => g.slug !== "all") as { slug: GameSlug; name: string; short: string }[];

export function CompareDrawer({
  slugs,
  agentsBySlug,
  onClose,
  onRemove,
}: {
  slugs: string[];
  agentsBySlug: Map<string, EnrichedAgent>;
  onClose: () => void;
  onRemove: (slug: string) => void;
}) {
  if (slugs.length === 0) return null;
  const agents = slugs
    .map(s => agentsBySlug.get(s))
    .filter((a): a is EnrichedAgent => Boolean(a));
  if (agents.length === 0) return null;

  const statRow = (
    label: string,
    values: (number | string)[],
    fmtFn: (n: number) => string = fmt,
    highlight: "max" | "min" = "max",
  ) => {
    const nums = values.map(v => (typeof v === "number" ? v : NaN));
    const finite = nums.filter(n => !isNaN(n));
    const best = finite.length === 0
      ? NaN
      : highlight === "max" ? Math.max(...finite) : Math.min(...finite);

    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: `140px repeat(${agents.length}, minmax(0, 1fr))`,
        borderBottom: "1px solid var(--line)",
      }}>
        <div style={{
          padding: "10px 12px", fontFamily: "var(--font-mono)",
          fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-300)",
        }}>{label}</div>
        {values.map((v, i) => (
          <div key={i} style={{
            padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 13,
            color: typeof v === "number" && v === best && !isNaN(best)
              ? "var(--phos-green)" : "var(--ink-100)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {typeof v === "number" ? fmtFn(v) : v}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      background: "linear-gradient(180deg, rgba(5,7,13,0.98), var(--bg-void))",
      borderTop: "1px solid var(--phos-magenta)",
      boxShadow: "0 -8px 40px rgba(255,95,180,0.15)",
      maxHeight: "62vh", overflowY: "auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 18px", borderBottom: "1px solid var(--line)",
        position: "sticky", top: 0, background: "var(--bg-void)", zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="live-dot" style={{ background: "var(--phos-magenta)", boxShadow: "0 0 10px var(--phos-magenta)" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink-100)", letterSpacing: "0.02em" }}>
            HEAD-TO-HEAD
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-400)", letterSpacing: "0.14em" }}>
            · {agents.length} PINNED · click rows in table to add
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em",
            color: "var(--ink-300)", border: "1px solid var(--line-2)",
            padding: "6px 10px", background: "transparent", cursor: "pointer",
          }}
        >CLOSE ×</button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `140px repeat(${agents.length}, minmax(0, 1fr))`,
        borderBottom: "1px solid var(--line-bright)",
      }}>
        <div />
        {agents.map(a => (
          <div key={a.slug} style={{
            padding: "14px 12px", borderLeft: "1px solid var(--line)", position: "relative",
          }}>
            <button
              onClick={() => onRemove(a.slug)}
              style={{
                position: "absolute", top: 6, right: 8,
                fontFamily: "var(--font-mono)", fontSize: 10,
                color: "var(--ink-400)", background: "transparent",
                border: "none", cursor: "pointer",
              }}
            >×</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Glyph agent={a} size={36} />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink-100)",
                  letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>{a.handle}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-400)" }}>
                  {a.author} · {a.tier.toUpperCase()}
                </div>
                <div style={{ marginTop: 4 }}><WLBadge agent={a} size="xs" /></div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <Sparkline points={a.hist} color={a.color} width={220} height={38} />
            </div>
          </div>
        ))}
      </div>

      {statRow("ELO · OVERALL", agents.map(a => a.elo))}
      {statRow("WIN %", agents.map(a => a.globalWR), v => pct(v))}
      {statRow("GAMES PLAYED", agents.map(a => a.totalGames))}
      {statRow("STREAK", agents.map(a => (a.streak > 0 ? "W" + a.streak : a.streak < 0 ? "L" + Math.abs(a.streak) : "—")))}
      {statRow("CODE SIZE · KB", agents.map(a => a.size), v => v.toFixed(1) + "kb", "min")}
      {statRow("AVG MOVE · MS", agents.map(a => a.avgMoveMs), v => v + "ms", "min")}
      {statRow("MAIN GAME", agents.map(a => a.main.toUpperCase()))}
      {statRow("EARNINGS · USD", agents.map(a => a.earnings), v => money(v))}
      {NON_ALL_GAMES.map(g => (
        <Fragment key={g.slug}>
          {statRow(g.short + " · ELO", agents.map(a => a.perGame[g.slug].elo))}
          {statRow(g.short + " · WIN %", agents.map(a => a.perGame[g.slug].wr), v => pct(v))}
        </Fragment>
      ))}
    </div>
  );
}
