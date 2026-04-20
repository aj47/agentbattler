"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentCard, AgentGlyph } from "../components/ui";
import { HoloBoardGo, HoloBoardChess, HoloBoardCheckers } from "../components/boards";
import { boardToStones } from "../lib/games/index";
import type { Agent, Match, Highlight } from "../lib/types";
import type { GoBoard } from "../lib/games/go";
import type { ChessBoard } from "../lib/games/chess";
import type { CheckersDisc } from "../lib/games/checkers";

export default function LobbyPage() {
  const agents    = useQuery(api.queries.allAgents);
  const matches   = useQuery(api.queries.allMatches);
  const highlights = useQuery(api.queries.allHighlights);
  const leaderboard = useQuery(api.queries.leaderboard);
  const initMatch = useMutation(api.mutations.initMatchState);

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    (agents || []).forEach(a => m.set(a.slug, a as Agent));
    return m;
  }, [agents]);

  const featured: Match | null = useMemo(() => {
    if (!matches) return null;
    const ms = matches as Match[];
    return (
      ms.find(m => m.status === "featured") ??
      ms.filter(m => m.status === "live" || m.status === "starting")
        .sort((a, b) => b.viewers - a.viewers)[0] ??
      ms[0] ?? null
    );
  }, [matches]);

  const featuredState = useQuery(
    api.queries.matchState,
    featured ? { slug: featured.slug } : "skip",
  );

  const allMatchStates = useQuery(api.queries.allMatchStates);

  const stateBySlug = useMemo(() => {
    const map = new Map<string, NonNullable<typeof allMatchStates>[number]>();
    (allMatchStates ?? []).forEach(s => map.set(s.matchSlug, s));
    return map;
  }, [allMatchStates]);

  // Init simulation for every live/starting match that doesn't have a state yet
  useEffect(() => {
    if (!matches || !allMatchStates) return;
    for (const m of matches as Match[]) {
      if (m.status !== "live" && m.status !== "starting" && m.status !== "featured") continue;
      const hasState = allMatchStates.some(s => s.matchSlug === m.slug);
      if (!hasState) {
        initMatch({ slug: m.slug, game: m.game as "chess" | "go19" | "checkers" }).catch(() => {});
      }
    }
  }, [matches, allMatchStates, initMatch]);

  const others = useMemo(() => {
    if (!matches || !featured) return (matches as Match[] | undefined) ?? [];
    return (matches as Match[]).filter(m => m._id !== featured._id);
  }, [matches, featured]);

  // Measure the board container so we can size the board to fill it exactly.
  // Use a callback ref so the observer is set up as soon as the element mounts,
  // even if it mounts after the initial effect cycle (loading guard was active).
  const [boardSize, setBoardSize] = useState(320);
  const boardContainerCallbackRef = (el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const byWidth  = Math.floor(width * 0.74);
      const byHeight = Math.floor((height - 28) / 0.8);
      setBoardSize(Math.min(byWidth, byHeight, 500));
    });
    ro.observe(el);
  };

  if (!agents || !matches || !highlights || !leaderboard) {
    return <div className="page-shell" style={{ color: "var(--ink-300)" }}>LOADING…</div>;
  }
  if (!featured) {
    return <div className="page-shell" style={{ color: "var(--ink-300)" }}>No matches seeded yet.</div>;
  }

  const featA = agentMap.get(featured.a)!;
  const featB = agentMap.get(featured.b)!;
  const game = featured.game;
  const winProbB = featuredState ? Math.round(featuredState.winProbB * 100) : 58;
  const winProbW = 100 - winProbB;
  const moveCount = featuredState?.moveCount ?? featured.move;
  const gameLabel = game === "go19" ? "GO 19×19" : game === "chess" ? "CHESS" : "CHECKERS";

  let boardEl: React.ReactNode;
  if (game === "go19") {
    const goBoard = featuredState?.board as GoBoard | undefined;
    const stones = goBoard ? boardToStones(goBoard) : [];
    const lm = featuredState?.lastMove as { x: number; y: number; c: "b" | "w" } | null | undefined;
    boardEl = <HoloBoardGo stones={stones} lastMove={lm ?? null} hot={[]} size={boardSize} tilt={40} />;
  } else if (game === "chess") {
    const chessBoard = featuredState?.board as ChessBoard | undefined;
    boardEl = <HoloBoardChess board={chessBoard} size={boardSize} tilt={36} />;
  } else {
    const checkersDiscs = featuredState?.board as CheckersDisc[] | undefined;
    boardEl = <HoloBoardCheckers discs={checkersDiscs} size={boardSize} tilt={36} />;
  }

  return (
    <div>
      {/* ── ABOVE THE FOLD: featured match fills the viewport ── */}
      <div className="page-shell lobby-hero">

        {/* Left: featured match panel */}
        <Panel className="lobby-feature-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header */}
          <div className="responsive-toolbar" style={{
            padding: "10px 16px", borderBottom: "1px solid var(--line)", flexShrink: 0,
            background: "linear-gradient(90deg, rgba(95,240,230,0.08), transparent 40%, rgba(255,181,71,0.08))",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <LiveDot />
              <span className="t-label" style={{ color: "var(--phos-green)" }}>LIVE · FEATURED</span>
              <span className="t-label">MATCH #{featured.slug.slice(1)}</span>
              <span className="t-label">·</span>
              <span className="t-label" style={{ color: "var(--phos-cyan)" }}>{gameLabel}</span>
              <span className="t-label">·</span>
              <span className="t-label">MOVE {moveCount}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span className="t-label">👁 {featured.viewers.toLocaleString()}</span>
              <Link href={`/match/${featured.slug}`} className="btn primary">ENTER ARENA →</Link>
            </div>
          </div>

          {/* Win probability */}
          <div style={{ padding: "10px clamp(12px, 4vw, 20px) 6px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span className="t-label">{featA?.handle}</span>
              <span className="t-label">WIN PROBABILITY</span>
              <span className="t-label">{featB?.handle}</span>
            </div>
            <div style={{ display: "flex", height: 6, background: "var(--bg-void)", border: "1px solid var(--line)" }}>
              <div style={{ width: `${winProbB}%`, background: "var(--phos-cyan)", boxShadow: "0 0 12px var(--phos-cyan-glow)", transition: "width 0.8s ease" }} />
              <div style={{ width: `${winProbW}%`, background: "var(--phos-amber)", boxShadow: "0 0 12px var(--phos-amber-glow)", transition: "width 0.8s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              <span className="t-num" style={{ color: "var(--phos-cyan)", fontSize: 11 }}>{winProbB}%</span>
              <span className="t-num" style={{ color: "var(--phos-amber)", fontSize: 11 }}>{winProbW}%</span>
            </div>
          </div>

          {/* Agent cards */}
          <div className="featured-agent-grid" style={{ flexShrink: 0 }}>
            {featA && <AgentCard agent={featA} side="L" score="B" />}
            {featB && <AgentCard agent={featB} side="R" score="W" />}
          </div>

          {/* Stats strip */}
          <div className="lobby-stats-strip" style={{
            padding: "6px clamp(12px, 4vw, 20px)", flexShrink: 0,
            borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
            background: "rgba(5,7,13,0.4)",
          }}>
            <div style={{ display: "flex", gap: 20, fontFamily: "var(--font-mono)", flexWrap: "wrap" }}>
              <span className="t-label" style={{ color: "var(--phos-cyan)" }}>B · BLACK</span>
              <span className="t-label">{game === "go19" ? "TERR" : "MAT"} <span className="t-num" style={{ color: "var(--phos-cyan)" }}>{featuredState ? (game === "go19" ? (winProbB * 1.8).toFixed(1) : featuredState.capturesB) : "—"}</span></span>
              <span className="t-label">CAP <span className="t-num" style={{ color: "var(--ink-100)" }}>{featuredState?.capturesB ?? 0}</span></span>
            </div>
            <span className="t-label" style={{ color: "var(--ink-400)" }}>{(featuredState?.phase ?? featured.phase).toUpperCase()} · MV {moveCount}</span>
            <div style={{ display: "flex", gap: 20, fontFamily: "var(--font-mono)", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <span className="t-label">CAP <span className="t-num" style={{ color: "var(--ink-100)" }}>{featuredState?.capturesW ?? 0}</span></span>
              <span className="t-label">{game === "go19" ? "TERR" : "MAT"} <span className="t-num" style={{ color: "var(--phos-amber)" }}>{featuredState ? (game === "go19" ? (winProbW * 1.8).toFixed(1) : featuredState.capturesW) : "—"}</span></span>
              <span className="t-label" style={{ color: "var(--phos-amber)" }}>W · WHITE</span>
            </div>
          </div>

          {/* Board — fills all remaining space */}
          <div
            ref={boardContainerCallbackRef}
            style={{ flex: 1, minHeight: 0, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 12, overflow: "hidden" }}
          >
            {boardEl}
          </div>
        </Panel>

        {/* Right sidebar */}
        <div className="stack lobby-sidebar">
          <Panel label="⟡ GLOBAL LEADERBOARD" right={<span className="t-label" style={{ fontSize: 9 }}>S3</span>}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {(leaderboard as Agent[]).slice(0, 10).map((a, i) => (
                <Link key={a._id} href={`/agent/${a.slug}`} className="leaderboard-row" style={{
                  padding: "7px 12px", borderBottom: i < 9 ? "1px solid var(--line)" : "none",
                }}>
                  <span className="t-num" style={{ fontSize: 10, color: i < 3 ? "var(--phos-cyan)" : "var(--ink-400)", fontWeight: i < 3 ? 600 : 400 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <AgentGlyph agent={a} size={18} spin={false} />
                    <span className="t-mono" style={{ fontSize: 10, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.handle}</span>
                  </div>
                  <span className="t-num" style={{ fontSize: 10, color: `var(--phos-${a.color})` }}>{a.elo}</span>
                  <span className="t-num" style={{ fontSize: 9, color: a.streak > 0 ? "var(--phos-green)" : a.streak < 0 ? "var(--phos-red)" : "var(--ink-400)" }}>
                    {a.streak > 0 ? `W${a.streak}` : a.streak < 0 ? `L${Math.abs(a.streak)}` : "—"}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel label="◆ UPSETS & HIGHLIGHTS" style={{ flexShrink: 0 }}>
            <div>
              {(highlights as Highlight[]).map((h, i) => (
                <div key={i} style={{ padding: "10px 12px", borderBottom: i < highlights.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <Pill color={h.color}>{h.tag}</Pill>
                    <span className="t-label" style={{ fontSize: 9 }}>{h.when}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-100)", lineHeight: 1.3 }}>{h.title}</div>
                  <div className="t-num" style={{ fontSize: 10, color: `var(--phos-${h.color})`, marginTop: 2 }}>{h.delta}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* ── BELOW THE FOLD: other arenas ── */}
      <div className="page-shell" style={{ paddingTop: 0 }}>
        <div className="responsive-toolbar" style={{ alignItems: "baseline", marginBottom: 16 }}>
          <div>
            <div className="t-display" style={{ fontSize: 22 }}>OTHER ARENAS</div>
            <div className="t-label" style={{ marginTop: 2 }}>{others.length} MATCHES IN PROGRESS · SORTED BY HYPE</div>
          </div>
          <div className="filter-row">
            <button className="btn">ALL</button>
            <button className="btn">CHESS</button>
            <button className="btn">GO</button>
            <button className="btn">CHECKERS</button>
          </div>
        </div>

        <div className="match-cards-grid">
          {others.map(m => {
            const a = agentMap.get(m.a)!;
            const b = agentMap.get(m.b)!;
            const short = m.game === "go19" ? "GO19" : m.game === "chess" ? "CHESS" : "CHKR";
            const ms = stateBySlug.get(m.slug);
            const liveMove = ms?.moveCount ?? m.move;
            const livePhase = ms?.phase ?? m.phase;
            const liveWinB = ms ? Math.round(ms.winProbB * 100) : 50;
            const liveWinW = 100 - liveWinB;

            let miniBoard: React.ReactNode;
            if (m.game === "go19") {
              const goBoard = ms?.board as GoBoard | undefined;
              const stones = goBoard ? boardToStones(goBoard) : [];
              const lm = ms?.lastMove as { x: number; y: number; c: "b" | "w" } | null | undefined;
              miniBoard = <HoloBoardGo stones={stones} lastMove={lm ?? null} hot={[]} size={200} tilt={42} />;
            } else if (m.game === "chess") {
              const chessBoard = ms?.board as ChessBoard | undefined;
              miniBoard = <HoloBoardChess board={chessBoard} size={200} tilt={36} />;
            } else {
              const discs = ms?.board as CheckersDisc[] | undefined;
              miniBoard = <HoloBoardCheckers discs={discs} size={200} tilt={36} />;
            }

            return (
              <Panel key={m._id} className="match-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {(m.status === "live" || m.status === "featured") && <LiveDot />}
                    <Pill color={m.status === "starting" ? "amber" : "green"}>{m.status === "starting" ? "SOON" : "LIVE"}</Pill>
                    <span className="t-label" style={{ color: "var(--phos-cyan)" }}>{short}</span>
                  </div>
                  <span className="t-label">👁 {m.viewers.toLocaleString()}</span>
                </div>

                {/* Win prob bar */}
                <div style={{ display: "flex", height: 3 }}>
                  <div style={{ width: `${liveWinB}%`, background: "var(--phos-cyan)", transition: "width 0.8s ease" }} />
                  <div style={{ width: `${liveWinW}%`, background: "var(--phos-amber)", transition: "width 0.8s ease" }} />
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
    </div>
  );
}
