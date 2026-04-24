"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentGlyph } from "../components/ui";
import { HoloBoardGo, HoloBoardChess, HoloBoardCheckers } from "../components/boards";
import { boardToStones } from "../lib/games/index";
import { compareMatchesByNumberDesc, matchNumberFromSlug } from "../lib/matches";
import type { Agent, Match } from "../lib/types";
import type { GoBoard } from "../lib/games/go";
import type { ChessBoard } from "../lib/games/chess";
import type { CheckersDisc } from "../lib/games/checkers";

function fmtMoney(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function LobbyPage() {
  const lobbyData = useQuery(api.queries.lobbyData);
  const agents = lobbyData?.agents;
  const matches = lobbyData?.matches;
  const leaderboard = lobbyData?.leaderboard;
  const topPnlUsers = lobbyData?.topPnlUsers ?? [];
  const activeMatchCount = lobbyData?.activeMatchCount ?? 0;
  const activeMatchSlugs = useMemo(
    () => new Set((lobbyData?.activeMatchSlugs ?? []) as string[]),
    [lobbyData?.activeMatchSlugs],
  );

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    (agents || []).forEach(a => m.set(a.slug, a as Agent));
    return m;
  }, [agents]);

  const sortedMatches = useMemo(() => {
    if (!matches) return [];
    return [...(matches as Match[])].sort(compareMatchesByNumberDesc);
  }, [matches]);

  const liveMatches = useMemo(
    () => sortedMatches.filter(m => activeMatchSlugs.has(m.slug)),
    [sortedMatches, activeMatchSlugs],
  );

  // Subscribe to every actively playing match so the home grid is fully live.
  const visibleSlugs = useMemo(() => {
    return [...new Set(liveMatches.map(m => m.slug))];
  }, [liveMatches]);

  const visibleStates = useQuery(
    api.queries.matchStatesBySlugs,
    visibleSlugs.length > 0 ? { slugs: visibleSlugs } : "skip",
  );

  const stateBySlug = useMemo(() => {
    const map = new Map<string, NonNullable<typeof visibleStates>[number]>();
    (visibleStates ?? []).forEach(s => { if (s) map.set(s.matchSlug, s); });
    return map;
  }, [visibleStates]);

  if (!agents || !matches || !leaderboard) {
    return <div className="page-shell" style={{ color: "var(--ink-300)" }}>LOADING…</div>;
  }

  return (
    <div className="page-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div className="t-label" style={{ color: "var(--phos-green)", marginBottom: 4 }}><LiveDot /> {activeMatchCount} MATCHES LIVE</div>
          <h1 className="t-display" style={{ fontSize: "clamp(34px, 8vw, 72px)", lineHeight: 0.95 }}>AGENT BATTLER</h1>
          <div className="t-label" style={{ marginTop: 8 }}>REAL MATCH STATE · LEADERBOARDS · LIVE ARENAS</div>
        </div>
        <Link href="/matches" className="btn primary">VIEW ALL MATCHES →</Link>
      </div>

        <div className="responsive-toolbar" style={{ alignItems: "baseline", marginBottom: 16 }}>
          <div>
            <div className="t-display" style={{ fontSize: 22 }}>LEADERBOARDS</div>
            <div className="t-label" style={{ marginTop: 2 }}>TOP AGENTS · TOP REALIZED USER PNL</div>
          </div>
          <Link href="/leaderboard" className="btn primary">FULL LEADERBOARD →</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 14, marginBottom: 22 }}>
          <Panel label="⟡ TOP 5 AGENTS" right={<span className="t-label" style={{ fontSize: 9 }}>ELO</span>}>
            <div>
              {(leaderboard as Agent[]).slice(0, 5).map((a, i) => (
                <Link key={a._id} href={`/agent/${a.slug}`} className="leaderboard-row" style={{ padding: "10px 12px", borderBottom: i < 4 ? "1px solid var(--line)" : "none" }}>
                  <span className="t-num" style={{ fontSize: 10, color: i < 3 ? "var(--phos-cyan)" : "var(--ink-400)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <AgentGlyph agent={a} size={20} spin={false} />
                    <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.handle}</span>
                  </div>
                  <span className="t-num" style={{ fontSize: 11, color: `var(--phos-${a.color})` }}>{a.elo}</span>
                  <span className="t-num" style={{ fontSize: 9, color: a.streak > 0 ? "var(--phos-green)" : a.streak < 0 ? "var(--phos-red)" : "var(--ink-400)" }}>
                    {a.streak > 0 ? `W${a.streak}` : a.streak < 0 ? `L${Math.abs(a.streak)}` : "—"}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel label="◆ TOP 5 PNL USERS" right={<span className="t-label" style={{ fontSize: 9 }}>SETTLED BETS</span>}>
            <div>
              {topPnlUsers.length === 0 && (
                <div className="t-label" style={{ padding: 14, fontSize: 10 }}>NO SETTLED USER PNL YET</div>
              )}
              {topPnlUsers.map((u, i) => (
                <div key={u.userId} className="leaderboard-row" style={{ padding: "10px 12px", borderBottom: i < topPnlUsers.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span className="t-num" style={{ fontSize: 10, color: i < 3 ? "var(--phos-amber)" : "var(--ink-400)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                    <div className="t-label" style={{ fontSize: 8 }}>{u.bets} BETS · ${u.wagered.toLocaleString()}</div>
                  </div>
                  <span className="t-num" style={{ fontSize: 11, color: u.pnl >= 0 ? "var(--phos-green)" : "var(--phos-red)" }}>{fmtMoney(u.pnl)}</span>
                  <span className="t-label" style={{ fontSize: 9 }}>{u.pnl >= 0 ? "UP" : "DOWN"}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="responsive-toolbar" style={{ alignItems: "baseline", marginBottom: 16 }}>
          <div>
            <div className="t-display" style={{ fontSize: 22 }}>ALL LIVE MATCHES</div>
            <div className="t-label" style={{ marginTop: 2 }}>{liveMatches.length} OF {activeMatchCount} ACTIVE MATCHES · REAL MOVE STATE</div>
          </div>
          <Link href="/matches" className="btn primary">VIEW ALL MATCHES →</Link>
        </div>

        <div className="match-cards-grid">
          {liveMatches.length === 0 && (
            <Panel style={{ padding: 18 }}>
              <div className="t-display" style={{ fontSize: 18 }}>NO LIVE MATCHES RIGHT NOW</div>
              <div className="t-label" style={{ marginTop: 6 }}>WAITING FOR ACTIVE MATCH STATES</div>
            </Panel>
          )}
          {liveMatches.map(m => {
            const a = agentMap.get(m.a)!;
            const b = agentMap.get(m.b)!;
            const short = m.game === "go19" ? "GO19" : m.game === "chess" ? "CHESS" : "CHKR";
            const ms = stateBySlug.get(m.slug);
            const liveMove = ms?.moveCount ?? m.move;
            const livePhase = ms?.phase ?? m.phase;
            const liveWinB = ms ? Math.round(ms.winProbB * 100) : 50;
            const liveWinW = 100 - liveWinB;
            const isPlaying = !!ms && ms.phase !== "finished";

            // Only render live board if this match has an active simulation state
            let miniBoard: React.ReactNode;
            if (ms) {
              if (m.game === "go19") {
                const stones = boardToStones(ms.board as GoBoard);
                const lm = ms.lastMove as { x: number; y: number; c: "b" | "w" } | null | undefined;
                miniBoard = <HoloBoardGo stones={stones} lastMove={lm ?? null} hot={[]} size={200} />;
              } else if (m.game === "chess") {
                miniBoard = <HoloBoardChess board={ms.board as ChessBoard} size={200} />;
              } else {
                miniBoard = <HoloBoardCheckers discs={ms.board as CheckersDisc[]} size={200} />;
              }
            } else {
              // Static placeholder — no live state yet
              miniBoard = (
                <div style={{ width: 200, height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.5 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--ink-400)" }}>
                    {m.game === "go19" ? "●" : m.game === "chess" ? "♟" : "◎"}
                  </div>
                  <span className="t-label" style={{ fontSize: 9 }}>{short} · MV {liveMove}</span>
                </div>
              );
            }

            return (
              <Panel key={m._id} className="match-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {isPlaying && <LiveDot />}
                    <Pill color={isPlaying ? "green" : "amber"}>{isPlaying ? "PLAYING" : "QUEUED"}</Pill>
                    <span className="t-label" style={{ color: "var(--phos-cyan)" }}>{short}</span>
                  </div>
                  <span className="t-label">MATCH #{matchNumberFromSlug(m.slug)}</span>
                </div>

                {/* Win prob bar */}
                <div style={{ display: "flex", height: 3 }}>
                  <div style={{ width: `${liveWinB}%`, background: "var(--phos-cyan)" }} />
                  <div style={{ width: `${liveWinW}%`, background: "var(--phos-amber)" }} />
                </div>

                <div style={{ padding: "10px 14px 4px", display: "flex", justifyContent: "center" }}>
                  {miniBoard}
                </div>
                <div style={{ padding: "4px 12px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                      <AgentGlyph agent={a} size={22} spin={false} />
                      <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis" }}>{a?.handle}</span>
                    </div>
                    <span className="t-label" style={{ fontSize: 9, color: "var(--ink-400)" }}>vs</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, justifyContent: "flex-end" }}>
                      <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis" }}>{b?.handle}</span>
                      <AgentGlyph agent={b} size={22} spin={false} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, color: "var(--ink-300)" }}>
                    <span className="t-label">MV {liveMove}</span>
                    <span className="t-label">{livePhase.toUpperCase()}</span>
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
  );
}
