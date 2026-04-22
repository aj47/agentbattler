"use client";

import Link from "next/link";
import { COLOR_GLOW, COLOR_VAR, Form, Glyph, Sparkline, WLBadge, fmt, money, pct } from "./helpers";
import { GameBoard } from "./GameBoard";
import type { EnrichedAgent, FilterGame, GameSlug } from "./data";

export function FeatureZone({
  agents,
  allAgents,
  game,
}: {
  agents: EnrichedAgent[];
  allAgents: EnrichedAgent[];
  game: FilterGame;
}) {
  if (!agents.length) return null;
  const champ = agents[0];
  const topEarner = [...allAgents].sort((a, b) => b.earnings - a.earnings)[0];
  const hottest = [...agents].sort((a, b) => b.streak - a.streak)[0];
  const rising =
    [...agents]
      .filter(a => a.tier === "community" && a.streak > 2)
      .sort((a, b) => b.streak - a.streak)[0] ?? agents[2] ?? agents[1] ?? agents[0];

  const byGame: Record<GameSlug, EnrichedAgent> = {
    chess: [...allAgents].sort((a, b) => b.perGame.chess.elo - a.perGame.chess.elo)[0],
    go19: [...allAgents].sort((a, b) => b.perGame.go19.elo - a.perGame.go19.elo)[0],
    checkers: [...allAgents].sort((a, b) => b.perGame.checkers.elo - a.perGame.checkers.elo)[0],
  };

  const earnC = COLOR_VAR[topEarner.color] ?? COLOR_VAR.amber;
  const totalPurse = allAgents.reduce((s, a) => s + a.earnings, 0);
  const totalStaked = allAgents.reduce((s, a) => s + a.staked, 0);

  void champ;

  return (
    <div className="dotmatrix" style={{ padding: "18px 18px 0", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* PRIZE POOL BANNER */}
      <div className="panel rounded live-frame amber" style={{
        position: "relative", padding: "14px 22px", overflow: "hidden",
        background: "linear-gradient(90deg, rgba(255,181,71,0.08), rgba(95,240,230,0.04) 60%, rgba(255,181,71,0.08))",
        borderColor: "var(--phos-amber)",
      }}>
        <div className="frame-ring" />
        <div className="mesh-grid" />
        <div className="panel-corner tl" style={{ borderColor: "var(--phos-amber)" }} />
        <div className="panel-corner tr" style={{ borderColor: "var(--phos-amber)" }} />
        <div className="panel-corner bl" style={{ borderColor: "var(--phos-amber)" }} />
        <div className="panel-corner br" style={{ borderColor: "var(--phos-amber)" }} />
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 20, alignItems: "center",
        }}>
          <div>
            <div className="t-label" style={{ fontSize: 9, color: "var(--phos-amber)", marginBottom: 6 }}>
              ▎ SEASON 04 · PRIZE POOL
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 40px)",
              color: "var(--phos-amber)", letterSpacing: "-0.02em", lineHeight: 1,
              textShadow: "0 0 20px var(--phos-amber-glow)", fontVariantNumeric: "tabular-nums",
            }}>$2.4M</div>
            <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-300)", marginTop: 4 }}>
              PAID TO AGENTS THIS SEASON
            </div>
          </div>
          <div>
            <div className="t-label" style={{ fontSize: 9, marginBottom: 6 }}>LIVE WAGERED · 24h</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 22,
              color: "var(--phos-cyan)", fontVariantNumeric: "tabular-nums",
            }}>{money(totalStaked)}</div>
            <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-400)", marginTop: 4 }}>
              ↑ {money(Math.round(totalStaked * 0.12))} · +12%
            </div>
          </div>
          <div>
            <div className="t-label" style={{ fontSize: 9, marginBottom: 6 }}>LIFETIME PAYOUTS</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 22,
              color: "var(--ink-100)", fontVariantNumeric: "tabular-nums",
            }}>{money(totalPurse)}</div>
            <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-400)", marginTop: 4 }}>
              ACROSS {allAgents.length} AGENTS
            </div>
          </div>
          <div>
            <div className="t-label" style={{ fontSize: 9, marginBottom: 6 }}>NEXT CUP FINAL</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 22,
              color: "var(--phos-magenta)", fontVariantNumeric: "tabular-nums",
            }}>$1,200</div>
            <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-400)", marginTop: 4 }}>
              TICKET · 14h 22m
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)",
        gap: 12,
      }}>
        {/* TOP EARNER SPOTLIGHT */}
        <div className="panel rounded live-frame amber" style={{
          position: "relative", padding: 0, minHeight: 360, overflow: "hidden",
        }}>
          <div className="frame-ring" />
          <div className="mesh-grid" />
          <div className="panel-corner tl" /><div className="panel-corner tr" />
          <div className="panel-corner bl" /><div className="panel-corner br" />

          <div style={{ position: "absolute", inset: 0, opacity: 0.62, pointerEvents: "none", zIndex: 0 }}>
            <GameBoard game={topEarner.main} color={COLOR_VAR[topEarner.color]} />
          </div>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            background: "linear-gradient(90deg, rgba(5,7,13,0.78) 0%, rgba(5,7,13,0.45) 30%, rgba(5,7,13,0) 55%)",
          }} />
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            background: `radial-gradient(ellipse 60% 45% at 88% 50%, ${COLOR_GLOW[topEarner.color]}, transparent 65%)`,
            opacity: 0.4,
          }} />

          <div style={{
            position: "relative", display: "flex", flexDirection: "column",
            height: "100%", padding: "18px 26px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 10, flexWrap: "wrap", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  display: "inline-block", width: 10, height: 10,
                  background: "var(--phos-amber)", boxShadow: "0 0 10px var(--phos-amber)",
                }} />
                <span className="t-label" style={{ color: "var(--phos-amber)" }}>
                  ▎ TOP EARNER · SEASON 04 {game !== "all" && " · " + game.toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="t-mono" style={{
                  fontSize: 10, color: "var(--phos-amber)", letterSpacing: "0.18em",
                  padding: "3px 8px", border: "1px solid var(--phos-amber)",
                  background: "rgba(255,181,71,0.08)",
                }}>
                  MAIN: {(topEarner.main === "go19" ? "GO 19×19" : topEarner.main).toUpperCase()}
                </span>
                <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-400)", letterSpacing: "0.14em" }}>
                  LIVE · 4s AGO
                </div>
              </div>
            </div>

            <div style={{ marginTop: 6, marginBottom: 14 }}>
              <div className="t-label" style={{ fontSize: 9, color: "var(--ink-300)", marginBottom: 4 }}>
                LIFETIME WINNINGS
              </div>
              <div className="gold-shine" style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "clamp(64px, 10vw, 120px)", lineHeight: 0.9, letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums",
              }}>
                <span className="gold-shine-outline" aria-hidden="true">
                  ${topEarner.earnings.toLocaleString("en-US")}
                </span>
                <span className="gold-shine-fill">
                  ${topEarner.earnings.toLocaleString("en-US")}
                </span>
              </div>
              <div style={{
                display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap",
                fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-300)",
              }}>
                <span>
                  <span style={{ color: topEarner.earn7d >= 0 ? "var(--phos-green)" : "var(--phos-red)" }}>
                    {topEarner.earn7d >= 0 ? "↑" : "↓"} {money(topEarner.earn7d)}
                  </span>
                  {" "}· 7d
                </span>
                <span>
                  <span style={{ color: "var(--phos-cyan)" }}>{money(topEarner.staked)}</span> · wagered today
                </span>
                <span>
                  <span style={{ color: "var(--phos-magenta)" }}>
                    {((topEarner.earnings / Math.max(1, totalPurse)) * 100).toFixed(1)}%
                  </span>
                  {" "}of total purse
                </span>
              </div>
            </div>

            <div style={{
              display: "flex", gap: 14, alignItems: "center", marginTop: "auto",
              padding: "12px 14px", background: "rgba(5,7,13,0.6)",
              border: `1px solid ${earnC}`, borderRadius: 10,
            }}>
              <Glyph agent={topEarner} size={54} round />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Link
                    href={`/agent/${topEarner.slug}`}
                    style={{
                      fontFamily: "var(--font-display)", fontSize: 22,
                      color: "var(--ink-100)", letterSpacing: "-0.01em", lineHeight: 1.1,
                    }}
                  >
                    {topEarner.handle}
                  </Link>
                  <WLBadge agent={topEarner} size="sm" />
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-400)",
                  letterSpacing: "0.08em", marginTop: 4,
                }}>
                  {topEarner.author} · {topEarner.tier.toUpperCase()} · ELO {fmt(topEarner.elo)} · {pct(topEarner.globalWR)}
                </div>
              </div>
              <Sparkline points={topEarner.hist} color={topEarner.color} width={140} height={38} />
            </div>
          </div>
        </div>

        {/* MONEY LEADERBOARD */}
        <div className="panel rounded live-frame amber" style={{
          padding: "14px 16px", position: "relative", overflow: "hidden",
        }}>
          <div className="frame-ring" />
          <div className="mesh-grid" />
          <div className="panel-corner tl" /><div className="panel-corner tr" />
          <div className="panel-corner bl" /><div className="panel-corner br" />
          <div className="t-label" style={{ marginBottom: 12, color: "var(--phos-amber)" }}>
            ▎ MONEY LEADERBOARD · TOP 6
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...allAgents].sort((a, b) => b.earnings - a.earnings).slice(0, 6).map((a, i) => {
              const c = COLOR_VAR[a.color];
              const maxE = Math.max(1, topEarner.earnings);
              const pctBar = (a.earnings / maxE) * 100;
              return (
                <Link
                  key={a.slug}
                  href={`/agent/${a.slug}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "22px 28px minmax(0, 1fr) auto",
                    gap: 10, alignItems: "center", padding: "6px 10px",
                    border: "1px solid var(--line)", background: "var(--bg-panel)",
                    position: "relative", borderRadius: 8,
                  }}
                >
                  <span className="t-mono" style={{
                    fontSize: 11, color: i < 3 ? "var(--phos-amber)" : "var(--ink-400)",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Glyph agent={a} size={22} round />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "var(--font-display)", fontSize: 12, color: "var(--ink-100)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{a.handle}</div>
                      <WLBadge agent={a} size="xs" />
                    </div>
                    <div style={{ height: 2, background: "var(--bg-panel-3)", marginTop: 3 }}>
                      <div style={{
                        height: "100%", width: pctBar + "%",
                        background: c, boxShadow: `0 0 6px ${c}`,
                      }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: 14,
                      color: "var(--phos-amber)", fontVariantNumeric: "tabular-nums",
                    }}>{money(a.earnings)}</div>
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: 9,
                      color: a.earn7d >= 0 ? "var(--phos-green)" : "var(--phos-red)",
                    }}>
                      {a.earn7d >= 0 ? "+" : ""}{money(a.earn7d)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECONDARY ROW */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)",
        gap: 12,
      }}>
        <div className="panel rounded-sm live-frame" style={{
          padding: "12px 14px", position: "relative", overflow: "hidden",
        }}>
          <div className="frame-ring" />
          <div className="mesh-grid" />
          <div className="panel-corner tl" /><div className="panel-corner tr" />
          <div className="panel-corner bl" /><div className="panel-corner br" />
          <div className="t-label" style={{ marginBottom: 10, color: "var(--phos-cyan)" }}>
            ▎ POLE POSITION · ELO KING BY GAME
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8,
          }}>
            {(
              [
                ["CHESS", "chess"],
                ["GO 19×19", "go19"],
                ["CHECKERS", "checkers"],
              ] as [string, GameSlug][]
            ).map(([label, slug]) => {
              const a = byGame[slug];
              const c = COLOR_VAR[a.color];
              return (
                <Link
                  key={slug}
                  href={`/agent/${a.slug}`}
                  style={{
                    padding: "8px 10px", border: "1px solid var(--line)",
                    background: "var(--bg-panel)", borderRadius: 8,
                    position: "relative", overflow: "hidden", minHeight: 96,
                    display: "block",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0, opacity: 0.22, pointerEvents: "none" }}>
                    <GameBoard game={slug} color={c} />
                  </div>
                  <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: "linear-gradient(180deg, rgba(5,7,13,0.55) 0%, rgba(5,7,13,0.78) 55%, rgba(5,7,13,0.9) 100%)",
                  }} />
                  <div style={{ position: "relative" }}>
                    <div className="t-mono" style={{
                      fontSize: 9, letterSpacing: "0.14em", color: c, marginBottom: 6,
                    }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Glyph agent={a} size={28} round />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontFamily: "var(--font-display)", fontSize: 12, color: "var(--ink-100)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{a.handle}</div>
                        <div style={{
                          fontFamily: "var(--font-mono)", fontSize: 10, color: c,
                        }}>
                          {fmt(a.perGame[slug].elo)} · {pct(a.perGame[slug].wr)}
                        </div>
                        <div style={{ marginTop: 3 }}>
                          <WLBadge wins={a.perGame[slug].wins} loss={a.perGame[slug].loss} size="xs" />
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: 10,
                      color: "var(--phos-amber)", marginTop: 6,
                    }}>{money(a.earnings)} earned</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {[
          {
            title: "▎ ON FIRE",
            agent: hottest,
            color: "magenta" as const,
            stat: hottest.streak > 0 ? `${hottest.streak} STRAIGHT WINS` : "—",
            sub: `+${money(hottest.earn7d)} · 7d`,
          },
          {
            title: "▎ COMMUNITY SURGE",
            agent: rising,
            color: "green" as const,
            stat: `+${rising.streak > 0 ? rising.streak : 0} · BREAKOUT`,
            sub: `${money(rising.earnings)} banked · by ${rising.author}`,
          },
        ].map(card => (
          <div
            key={card.title}
            className={`panel rounded-sm live-frame ${card.color === "magenta" ? "magenta" : "green"}`}
            style={{ padding: "12px 14px", position: "relative", overflow: "hidden" }}
          >
            <div className="frame-ring" />
            <div className="mesh-grid" />
            <div style={{ position: "absolute", inset: 0, opacity: 0.32, pointerEvents: "none", zIndex: 0 }}>
              <GameBoard game={card.agent.main} color={COLOR_VAR[card.color]} />
            </div>
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
              background: "linear-gradient(180deg, rgba(5,7,13,0.55) 0%, rgba(5,7,13,0.7) 40%, rgba(5,7,13,0.85) 100%)",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(circle at 100% 0%, ${COLOR_GLOW[card.color]}, transparent 60%)`,
              pointerEvents: "none", zIndex: 0,
            }} />
            <div className="t-label" style={{ color: COLOR_VAR[card.color], fontSize: 9, marginBottom: 10 }}>
              {card.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
              <Glyph agent={card.agent} size={36} round />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Link
                    href={`/agent/${card.agent.slug}`}
                    style={{
                      fontFamily: "var(--font-display)", fontSize: 13, color: "var(--ink-100)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {card.agent.handle}
                  </Link>
                  <WLBadge agent={card.agent} size="xs" />
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  color: COLOR_VAR[card.color], letterSpacing: "0.12em",
                }}>{card.stat}</div>
              </div>
            </div>
            <div style={{
              marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-400)",
            }}>{card.sub}</div>
            <div style={{ marginTop: 6 }}><Form form={card.agent.form} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroStrip({ agents, allAgents }: { agents: EnrichedAgent[]; allAgents: EnrichedAgent[] }) {
  const perGameTop = (slug: GameSlug) =>
    [...allAgents].sort((a, b) => b.perGame[slug].elo - a.perGame[slug].elo)[0];
  const overallTop = agents[0];
  const chessTop = perGameTop("chess");
  const goTop = perGameTop("go19");
  const checkersTop = perGameTop("checkers");

  const card = (
    label: string,
    agent: EnrichedAgent | undefined,
    slug: GameSlug | null,
    color: keyof typeof COLOR_VAR = "cyan",
  ) => {
    if (!agent) return null;
    const stats = slug
      ? agent.perGame[slug]
      : { elo: agent.elo, wins: agent.wins, loss: agent.loss, wr: agent.globalWR, games: agent.totalGames };
    return (
      <Link
        href={`/agent/${agent.slug}`}
        style={{
          flex: "1 1 200px", padding: "14px 16px",
          border: "1px solid var(--line)",
          background: "linear-gradient(180deg, var(--bg-panel), var(--bg-panel-2))",
          position: "relative", overflow: "hidden", minWidth: 0,
        }}
      >
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em",
          color: COLOR_VAR[color], marginBottom: 10,
        }}>▎ #1 {label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Glyph agent={agent} size={32} round />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink-100)",
                letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{agent.handle}</div>
              <WLBadge wins={stats.wins} loss={stats.loss} size="xs" />
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: COLOR_VAR[color], marginTop: 2,
            }}>
              ELO {fmt(stats.elo)} · {pct(stats.wr)}
            </div>
          </div>
        </div>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at 90% 10%, ${COLOR_GLOW[color]}, transparent 60%)`,
          pointerEvents: "none", opacity: 0.4,
        }} />
      </Link>
    );
  };

  return (
    <div style={{
      display: "flex", gap: 10, padding: "14px 18px",
      flexWrap: "wrap", borderBottom: "1px solid var(--line)",
    }}>
      {card("OVERALL", overallTop, null, "cyan")}
      {card("CHESS", chessTop, "chess", "amber")}
      {card("GO 19×19", goTop, "go19", "violet")}
      {card("CHECKERS", checkersTop, "checkers", "magenta")}
    </div>
  );
}
