"use client";

import { Fragment } from "react";
import Link from "next/link";
import { COLOR_GLOW, COLOR_VAR, Form, Glyph, Sparkline, WLBadge, fmt, money, pct } from "./helpers";
import { GAMES_LIST, type EnrichedAgent, type FilterGame, type GameSlug } from "./data";
import type { SortKey } from "./Toolbar";

const NON_ALL_GAMES = GAMES_LIST.filter(g => g.slug !== "all") as { slug: GameSlug; name: string; short: string }[];

export function TableView({
  agents, game, sort, setSort, expanded, setExpanded, compare, toggleCompare,
}: {
  agents: EnrichedAgent[]; game: FilterGame;
  sort: SortKey; setSort: (s: SortKey) => void;
  expanded: string | null; setExpanded: (s: string | null) => void;
  compare: string[]; toggleCompare: (slug: string) => void;
}) {
  const hdr = (key: SortKey, label: string, align: "left" | "right" | "center" = "right") => (
    <div
      onClick={() => setSort(key)}
      style={{
        cursor: "pointer", textAlign: align, padding: "10px 10px",
        fontFamily: "var(--font-mono)", fontSize: 10,
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: sort === key ? "var(--phos-cyan)" : "var(--ink-300)",
        userSelect: "none",
      }}
    >
      {sort === key && <span style={{ marginRight: 4 }}>▾</span>}
      {label}
    </div>
  );

  const eloOf = (a: EnrichedAgent) => game === "all" ? a.elo : a.perGame[game].elo;
  const maxElo = Math.max(...agents.map(eloOf), 1);
  const minElo = Math.min(...agents.map(eloOf), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 980 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "52px 40px minmax(200px, 1.3fr) 100px 100px 85px 110px 130px 80px 60px",
          borderBottom: "1px solid var(--line-bright)", background: "var(--bg-panel)",
          position: "sticky", top: 0, zIndex: 2,
        }}
      >
        {hdr("rank", "#", "center")}
        <div />
        {hdr("handle", "AGENT", "left")}
        {hdr("author", "AUTHOR", "left")}
        {hdr("elo", game === "all" ? "ELO" : "ELO · " + game.toUpperCase())}
        {hdr("wr", "WIN %")}
        {hdr("earnings", "$ EARNED")}
        {hdr("form", "FORM · LAST 10", "left")}
        {hdr("streak", "STREAK")}
        {hdr("size", "KB")}
      </div>

      {agents.map((a, i) => {
        const stats = game === "all"
          ? { wins: a.wins, loss: a.loss, elo: a.elo, wr: a.globalWR, games: a.totalGames }
          : { ...a.perGame[game] };
        const rank = i + 1;
        const open = expanded === a.slug;
        const inCompare = compare.includes(a.slug);
        const eloPct = (stats.elo - minElo) / Math.max(1, maxElo - minElo);

        return (
          <div
            key={a.slug}
            style={{
              borderBottom: "1px solid var(--line)",
              background: inCompare ? "rgba(255,95,180,0.05)" : "transparent",
              transition: "background 120ms var(--ease-out)",
            }}
          >
            <div
              onClick={() => setExpanded(open ? null : a.slug)}
              style={{
                display: "grid",
                gridTemplateColumns: "52px 40px minmax(200px, 1.3fr) 100px 100px 85px 110px 130px 80px 60px",
                alignItems: "center", padding: "8px 0", cursor: "pointer", position: "relative",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(95,240,230,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                textAlign: "center", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums",
                fontSize: 14, fontWeight: 600,
                color: rank <= 3 ? "var(--phos-amber)" : rank <= 10 ? "var(--phos-cyan)" : "var(--ink-300)",
              }}>
                {String(rank).padStart(2, "0")}
              </div>
              <div style={{ padding: "0 4px" }}><Glyph agent={a} size={30} /></div>

              <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
                  <Link
                    href={`/agent/${a.slug}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      fontFamily: "var(--font-display)", fontSize: 14,
                      color: "var(--ink-100)", letterSpacing: "-0.01em",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {a.handle}
                  </Link>
                  <WLBadge wins={stats.wins} loss={stats.loss} size="xs" />
                  {a.hot && (
                    <span style={{
                      fontSize: 8, padding: "2px 5px",
                      border: "1px solid var(--phos-magenta)",
                      color: "var(--phos-magenta)",
                      fontFamily: "var(--font-mono)", letterSpacing: "0.14em",
                    }}>HOT</span>
                  )}
                  <span style={{
                    fontSize: 8, padding: "2px 5px",
                    border: "1px solid var(--line-2)", color: "var(--ink-300)",
                    fontFamily: "var(--font-mono)", letterSpacing: "0.14em",
                  }}>
                    {a.tier === "pro" ? "PRO" : "COMM"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-400)" }}>
                  {a.personality} · main: {a.main.toUpperCase()}
                </div>
              </div>

              <div style={{ textAlign: "left", padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-300)" }}>
                {a.author}
              </div>

              <div style={{ textAlign: "right", padding: "0 10px", position: "relative" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 15, color: "var(--ink-100)" }}>
                  {fmt(stats.elo)}
                </div>
                <div style={{ marginTop: 3, marginLeft: "auto", height: 2, width: "100%", background: "var(--bg-panel-3)" }}>
                  <div style={{
                    height: "100%", width: (eloPct * 100) + "%",
                    background: COLOR_VAR[a.color], boxShadow: `0 0 6px ${COLOR_VAR[a.color]}`,
                  }} />
                </div>
              </div>

              <div style={{
                textAlign: "right", padding: "0 10px",
                fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 12,
                color: stats.wr > 0.65 ? "var(--phos-green)" : stats.wr < 0.4 ? "var(--phos-red)" : "var(--ink-200)",
              }}>
                <div>{pct(stats.wr)}</div>
                <div style={{ fontSize: 9, marginTop: 2, letterSpacing: "0.04em" }}>
                  <span style={{ color: "var(--phos-green)" }}>{stats.wins}W</span>
                  <span style={{ color: "var(--ink-500)", margin: "0 3px" }}>·</span>
                  <span style={{ color: "var(--phos-red)" }}>{stats.loss}L</span>
                </div>
              </div>

              <div style={{ textAlign: "right", padding: "0 10px", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                <div style={{ fontSize: 13, color: a.earnings > 200000 ? "var(--phos-amber)" : "var(--phos-green)" }}>
                  {money(a.earnings)}
                </div>
                <div style={{
                  fontSize: 9, color: a.earn7d >= 0 ? "var(--phos-green)" : "var(--phos-red)",
                  letterSpacing: "0.06em",
                }}>
                  {a.earn7d >= 0 ? "+" : ""}{money(a.earn7d)} · 7d
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px" }}>
                <Form form={a.form} />
              </div>

              <div style={{
                textAlign: "right", padding: "0 10px",
                fontFamily: "var(--font-mono)", fontSize: 12,
                color: a.streak > 0 ? "var(--phos-green)" : a.streak < 0 ? "var(--phos-red)" : "var(--ink-300)",
              }}>
                {a.streak > 0 ? "W" + a.streak : a.streak < 0 ? "L" + Math.abs(a.streak) : "—"}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 10px", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 11, color: "var(--ink-400)" }}>
                  {a.size.toFixed(1)}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); toggleCompare(a.slug); }}
                  style={{
                    width: 20, height: 20,
                    border: `1px solid ${inCompare ? "var(--phos-magenta)" : "var(--line-2)"}`,
                    color: inCompare ? "var(--phos-magenta)" : "var(--ink-400)",
                    background: inCompare ? "rgba(255,95,180,0.15)" : "transparent",
                    cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11,
                    display: "grid", placeItems: "center",
                  }}
                  title="pin to compare"
                >
                  {inCompare ? "●" : "+"}
                </button>
              </div>
            </div>

            {open && <ExpandedRow agent={a} />}
          </div>
        );
      })}
      {agents.length === 0 && (
        <div style={{
          padding: 40, textAlign: "center", color: "var(--ink-400)",
          fontFamily: "var(--font-mono)", fontSize: 12,
        }}>
          — no agents match these filters —
        </div>
      )}
    </div>
  );
}

function ExpandedRow({ agent }: { agent: EnrichedAgent }) {
  return (
    <div style={{
      padding: "14px 18px 18px 18px",
      background: "rgba(10,14,26,0.6)",
      borderTop: "1px dashed var(--line)",
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(260px,340px)",
      gap: 20,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-300)", marginBottom: 8 }}>
          DOSSIER
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-200)", lineHeight: 1.5 }}>
          {agent.bio}
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10, marginTop: 14,
        }}>
          {NON_ALL_GAMES.map(g => {
            const s = agent.perGame[g.slug];
            const isMain = agent.main === g.slug;
            return (
              <div key={g.slug} style={{
                padding: "8px 10px",
                border: `1px solid ${isMain ? COLOR_VAR[agent.color] : "var(--line)"}`,
                background: "var(--bg-panel)",
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em",
                  color: isMain ? COLOR_VAR[agent.color] : "var(--ink-400)", marginBottom: 4,
                }}>
                  {g.short} {isMain && "· MAIN"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-100)" }}>{fmt(s.elo)}</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10,
                    color: s.wr > 0.6 ? "var(--phos-green)" : "var(--ink-300)",
                  }}>{pct(s.wr)}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-400)" }}>
                  {s.wins}W / {s.loss}L · {s.games}g
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--bg-panel)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--ink-300)", marginBottom: 6 }}>
            ELO · LAST 30 MATCHES
          </div>
          <Sparkline points={agent.hist} color={agent.color} width={300} height={58} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ padding: "8px 10px", border: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-400)", letterSpacing: "0.14em" }}>AVG MOVE</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-100)" }}>{agent.avgMoveMs}ms</div>
          </div>
          <div style={{ padding: "8px 10px", border: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-400)", letterSpacing: "0.14em" }}>CODE SIZE</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-100)" }}>{agent.size.toFixed(1)} kb</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MatrixView({ agents }: { agents: EnrichedAgent[] }) {
  return (
    <div style={{ padding: "18px 18px 28px 18px", overflowX: "auto" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-300)", marginBottom: 14 }}>
        ▎ AGENT × GAME WIN-RATE HEATMAP · darker cells = higher win rate
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px repeat(3, minmax(130px, 1fr))",
        gap: 1, background: "var(--line)", border: "1px solid var(--line)", minWidth: 720,
      }}>
        <div style={{ background: "var(--bg-panel)", padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-300)" }}>
          AGENT
        </div>
        {NON_ALL_GAMES.map(g => (
          <div key={g.slug} style={{
            background: "var(--bg-panel)", padding: "10px 12px",
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em",
            color: "var(--phos-cyan)", textAlign: "center",
          }}>{g.short}</div>
        ))}
        {agents.map(a => (
          <Fragment key={a.slug}>
            <div style={{ background: "var(--bg-panel-2)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <Glyph agent={a} size={24} />
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: 12, color: "var(--ink-100)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{a.handle}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-400)" }}>{a.author}</span>
                <WLBadge agent={a} size="xs" />
              </div>
            </div>
            {NON_ALL_GAMES.map(g => {
              const s = a.perGame[g.slug];
              const heat = Math.max(0, Math.min(1, (s.wr - 0.3) / 0.55));
              const c = COLOR_VAR[a.color];
              const isMain = a.main === g.slug;
              return (
                <div key={g.slug} style={{
                  background: `rgba(95,240,230,${(heat * 0.28).toFixed(3)})`,
                  padding: "10px 12px", position: "relative",
                  borderLeft: isMain ? `2px solid ${c}` : "none",
                }}>
                  {isMain && (
                    <span style={{
                      position: "absolute", top: 2, right: 4,
                      fontFamily: "var(--font-mono)", fontSize: 7,
                      letterSpacing: "0.14em", color: c,
                    }}>MAIN</span>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-100)", fontVariantNumeric: "tabular-nums" }}>
                      {pct(s.wr)}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-300)" }}>{fmt(s.elo)}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-400)" }}>
                    {s.wins}-{s.loss} · {s.games}g
                  </div>
                  <div style={{ marginTop: 4, height: 2, background: "rgba(255,255,255,0.04)" }}>
                    <div style={{
                      height: "100%", width: (heat * 100).toFixed(0) + "%",
                      background: c, boxShadow: `0 0 6px ${c}`,
                    }} />
                  </div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function FieldView({ agents, game }: { agents: EnrichedAgent[]; game: FilterGame }) {
  const eloOf = (a: EnrichedAgent) => game === "all" ? a.elo : a.perGame[game].elo;
  const max = Math.max(...agents.map(eloOf), 1);
  const min = Math.min(...agents.map(eloOf), 0);
  const buckets = [1800, 2000, 2200, 2400, 2600, 2800, 3000].filter(b => b >= min - 50 && b <= max + 50);

  return (
    <div style={{ padding: "18px 18px 28px 18px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-300)", marginBottom: 14 }}>
        ▎ FIELD · ELO SPREAD {game !== "all" && `· ${game.toUpperCase()}`}
      </div>
      <div style={{ position: "relative", paddingLeft: 240, paddingRight: 20 }}>
        <div style={{ position: "relative", height: 20, marginBottom: 8 }}>
          {buckets.map(b => {
            const x = ((b - min) / Math.max(1, max - min)) * 100;
            return (
              <div key={b} style={{
                position: "absolute", left: x + "%", top: 0,
                fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-400)",
                transform: "translateX(-50%)",
              }}>
                {b}
              </div>
            );
          })}
        </div>
        {agents.map((a, i) => {
          const elo = eloOf(a);
          const w = Math.max(2, ((elo - min) / Math.max(1, max - min)) * 100);
          const c = COLOR_VAR[a.color];
          const gstats = game === "all" ? { wins: a.wins, loss: a.loss } : a.perGame[game];
          return (
            <div key={a.slug} style={{ display: "flex", alignItems: "center", marginBottom: 3, position: "relative" }}>
              <div style={{
                position: "absolute", left: -240, width: 230,
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "var(--font-mono)", fontSize: 11,
              }}>
                <span style={{ color: i < 3 ? "var(--phos-amber)" : "var(--ink-400)", width: 20, flex: "0 0 auto" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ color: c, fontSize: 14, flex: "0 0 auto" }}>{a.glyph}</span>
                <Link
                  href={`/agent/${a.slug}`}
                  style={{
                    color: "var(--ink-200)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    flex: 1, minWidth: 0,
                  }}
                >
                  {a.handle}
                </Link>
                <span style={{ flex: "0 0 auto", fontSize: 9, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: "var(--phos-green)" }}>{gstats.wins}</span>
                  <span style={{ color: "var(--ink-500)" }}>·</span>
                  <span style={{ color: "var(--phos-red)" }}>{gstats.loss}</span>
                </span>
              </div>
              <div style={{
                position: "relative", height: 16, width: "100%",
                background: "var(--bg-panel-2)", border: "1px solid var(--line)",
              }}>
                <div style={{
                  height: "100%", width: w + "%",
                  background: `linear-gradient(90deg, transparent, ${c})`,
                  boxShadow: `0 0 10px ${COLOR_GLOW[a.color]}`,
                }} />
                <span style={{
                  position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                  fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-100)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {fmt(elo)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
