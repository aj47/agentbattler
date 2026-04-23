"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentCard, AgentGlyph } from "../components/ui";
import { HoloBoardGo, HoloBoardChess, HoloBoardCheckers } from "../components/boards";
import { LiveChat } from "../components/LiveChat";
import { money } from "../components/leaderboard/helpers";
import { enrichAgent, type EnrichedAgent } from "../components/leaderboard/data";
import { boardToStones } from "../lib/games/index";
import type { Agent, Match, ChatMessage } from "../lib/types";
import type { GoBoard } from "../lib/games/go";
import type { ChessBoard } from "../lib/games/chess";
import type { CheckersDisc } from "../lib/games/checkers";

export default function LobbyPage() {
  const lobbyData = useQuery(api.queries.lobbyData);
  const agents = lobbyData?.agents;
  const matches = lobbyData?.matches;
  const leaderboard = lobbyData?.leaderboard;
  const chat = lobbyData?.chat;
  const emojis = lobbyData?.emojis as string[] | null | undefined;
  const initMatch = useMutation(api.mutations.initMatchState);
  const sendChatMessage = useMutation(api.mutations.sendChatMessage);
  const { isAuthenticated } = useConvexAuth();

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

  // Only subscribe to states for the 7 visible matches (featured + 6 cards)
  const visibleSlugs = useMemo(() => {
    if (!matches) return [];
    const ms = matches as Match[];
    const feat = ms.find(m => m.status === "featured") ?? ms[0];
    const top6 = ms.filter(m => m._id !== feat?._id).slice(0, 6);
    return [feat, ...top6].filter(Boolean).map(m => m!.slug);
  }, [matches]);

  const visibleStates = useQuery(
    api.queries.matchStatesBySlugs,
    visibleSlugs.length > 0 ? { slugs: visibleSlugs } : "skip",
  );
  const currentUser = useQuery(api.queries.currentUser);
  const placeBet = useMutation(api.mutations.placeBet);

  const [betOpen, setBetOpen] = useState(false);
  const [betSide, setBetSide] = useState<"a" | "b">("a");
  const [betAmount, setBetAmount] = useState("100");
  const [betStatus, setBetStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [betError, setBetError] = useState("");

  const featuredBets = useQuery(
    api.queries.matchBets,
    featured ? { matchSlug: featured.slug } : "skip",
  );

  const stateBySlug = useMemo(() => {
    const map = new Map<string, NonNullable<typeof visibleStates>[number]>();
    (visibleStates ?? []).forEach(s => { if (s) map.set(s.matchSlug, s); });
    return map;
  }, [visibleStates]);

  // Init simulations only for the 7 visible matches (no state yet or finished)
  useEffect(() => {
    if (!matches || !visibleStates) return;
    const visibleSet = new Set(visibleSlugs);
    for (const m of (matches as Match[])) {
      if (!visibleSet.has(m.slug)) continue;
      const hasActiveState = (visibleStates ?? []).some(
        s => s && s.matchSlug === m.slug && s.phase !== "finished"
      );
      if (!hasActiveState) {
        initMatch({ slug: m.slug, game: m.game as "chess" | "go19" | "checkers" }).catch(() => {});
      }
    }
  }, [matches, visibleStates, visibleSlugs, initMatch]);

  const totalOthers = Math.max(0, ((matches as Match[] | undefined)?.length ?? 0) - 1);

  // Only render 6 cards on the lobby — rest are on /matches
  const others = useMemo(() => {
    if (!matches || !featured) return (matches as Match[] | undefined) ?? [];
    return (matches as Match[])
      .filter(m => m._id !== featured._id)
      .sort((a, b) => b.viewers - a.viewers)
      .slice(0, 6);
  }, [matches, featured]);

  const moneyLeaders = useMemo<EnrichedAgent[]>(() => {
    return ((leaderboard as Agent[] | undefined) ?? [])
      .map(enrichAgent)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);
  }, [leaderboard]);

  // Measure the board container so we can size the board to fill it exactly.
  // Use a callback ref so the observer is set up as soon as the element mounts,
  // even if it mounts after the initial effect cycle (loading guard was active).
  const [boardSize, setBoardSize] = useState(320);
  const boardObserverRef = useRef<ResizeObserver | null>(null);
  const boardContainerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    boardObserverRef.current?.disconnect();
    boardObserverRef.current = null;
    if (!el) return;

    const updateBoardSize = (width: number, height: number) => {
      const byWidth  = Math.floor(width * 0.74);
      const byHeight = Math.floor((height - 28) / 0.8);
      const nextSize = Math.max(160, Math.min(byWidth, byHeight, 500));
      if (Number.isFinite(nextSize)) setBoardSize(nextSize);
    };

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      updateBoardSize(width, height);
    });
    ro.observe(el);
    boardObserverRef.current = ro;
    updateBoardSize(el.clientWidth, el.clientHeight);
  }, []);

  useEffect(() => () => {
    boardObserverRef.current?.disconnect();
  }, []);

  const handleBet = useCallback(async () => {
    if (!featured) return;
    const amt = parseFloat(betAmount);
    if (!amt || amt <= 0) { setBetError("Enter a valid amount"); setBetStatus("error"); return; }
    setBetStatus("submitting"); setBetError("");
    try {
      await placeBet({ matchSlug: featured.slug, side: betSide, amount: amt });
      setBetStatus("done");
      setTimeout(() => { setBetOpen(false); setBetStatus("idle"); setBetAmount("100"); }, 1200);
    } catch (e: any) {
      setBetError(e?.message ?? "Failed"); setBetStatus("error");
    }
  }, [featured, betAmount, betSide, placeBet]);

  const handleChatSend = useCallback(async (msg: string) => {
    await sendChatMessage({ msg });
  }, [sendChatMessage]);

  if (!agents || !matches || !leaderboard) {
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
  const chatUserName = currentUser
    ? ((currentUser as any).name ?? (currentUser as any).email?.split("@")[0] ?? "SPECTATOR")
    : null;

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

  const renderMoneyTickerItem = (a: EnrichedAgent, i: number, duplicate = false) => {
    const recordTotal = Math.max(1, a.wins + a.loss);
    const winPct = (a.wins / recordTotal) * 100;
    const lossPct = 100 - winPct;
    const trendPositive = a.earn7d >= 0;

    return (
      <Link
        key={`${duplicate ? "dupe" : "main"}-${a._id}`}
        href={`/agent/${a.slug}`}
        className="lobby-money-ticker-item"
        aria-hidden={duplicate || undefined}
        tabIndex={duplicate ? -1 : undefined}
        style={{
          borderColor: i === 0 ? "rgba(255,181,71,0.6)" : "rgba(95,240,230,0.16)",
        }}
      >
        <span className="t-num lobby-money-rank">
          {String(i + 1).padStart(2, "0")}
        </span>
        <AgentGlyph agent={a} size={28} spin={false} />
        <span className="t-mono lobby-money-handle">{a.handle}</span>
        <span className="t-num lobby-money-bank">{money(a.earnings)}</span>
        <span
          className="t-num lobby-money-trend"
          style={{ color: trendPositive ? "var(--phos-green)" : "var(--phos-red)" }}
        >
          {trendPositive ? "+" : ""}{money(a.earn7d)}
        </span>
        <span className="t-label lobby-money-record">
          {a.wins}W · {a.loss}L
        </span>
        <span className="lobby-money-mini-bar" aria-hidden="true">
          <span style={{ width: `${winPct}%`, background: "var(--phos-green)" }} />
          <span style={{ width: `${lossPct}%`, background: "var(--phos-red)" }} />
        </span>
      </Link>
    );
  };

  const moneyLeaderStrip = (
    <Panel
      className="rounded-sm live-frame amber lobby-money-strip"
      noCorners
      style={{ overflow: "hidden" }}
    >
      <div className="frame-ring" />
      <div className="mesh-grid" />
      <div className="lobby-money-strip-head">
        <LiveDot style={{ width: 7, height: 7 }} />
        <div>
          <div className="t-label" style={{ color: "var(--phos-amber)", fontSize: 9 }}>
            GLOBAL LEADERBOARD
          </div>
          <div className="t-display" style={{ fontSize: 15, color: "var(--ink-100)", marginTop: 1 }}>
            MONEY TICKER
          </div>
        </div>
        <span className="t-label lobby-money-strip-tag">TOP 5</span>
      </div>

      <div className="lobby-money-ticker-window" aria-label="Global money leaderboard ticker">
        <div className="lobby-money-ticker-track">
          <div className="lobby-money-ticker-group">
            {moneyLeaders.map((a, i) => renderMoneyTickerItem(a, i))}
          </div>
          <div className="lobby-money-ticker-group" aria-hidden="true">
            {moneyLeaders.map((a, i) => renderMoneyTickerItem(a, i, true))}
          </div>
        </div>
      </div>
    </Panel>
  );

  return (
    <div>
      {/* ── ABOVE THE FOLD: featured match fills the viewport ── */}
      <div className="page-shell" style={{ paddingBottom: 0 }}>
        {moneyLeaderStrip}
      </div>

      <div className="page-shell lobby-hero" style={{ paddingTop: 12 }}>

        {/* Left: featured match panel */}
        <Panel className="lobby-feature-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Stats strip */}
          <div className="lobby-stats-strip" style={{
            padding: "9px clamp(14px, 4vw, 22px)", flexShrink: 0,
            minHeight: 40,
            borderBottom: "1px solid var(--line)",
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

          {/* Agent cards */}
          <div className="featured-agent-grid" style={{ flexShrink: 0 }}>
            {featA && <AgentCard agent={featA} side="L" sideMarker="B" />}
            {featB && <AgentCard agent={featB} side="R" sideMarker="W" />}
          </div>

          <div style={{ display: "flex", justifyContent: "center", padding: "12px clamp(12px, 4vw, 24px) 4px", flexShrink: 0 }}>
            <button
              onClick={() => { setBetOpen(true); setBetStatus("idle"); setBetError(""); }}
              className="btn featured-bet-cta"
              style={{
                width: "min(100%, 560px)",
                minHeight: 44,
                justifyContent: "space-between",
                color: "var(--ink-100)",
                background: `linear-gradient(90deg, rgba(95,240,230,0.20) 0%, rgba(95,240,230,0.20) ${winProbB}%, rgba(255,181,71,0.20) ${winProbB}%, rgba(255,181,71,0.20) 100%)`,
              }}
            >
              <span className="t-num" style={{ color: "var(--phos-cyan)", fontSize: 11 }}>{winProbB}%</span>
              <span className="t-label" style={{ color: "var(--ink-100)", fontSize: 10, letterSpacing: "0.14em" }}>
                BET ON THIS MATCH NOW!
              </span>
              <span className="t-num" style={{ color: "var(--phos-amber)", fontSize: 11 }}>{winProbW}%</span>
            </button>
          </div>

          {/* Board — fills all remaining space */}
          <div
            ref={boardContainerCallbackRef}
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, overflow: "hidden" }}
          >
            <div className="match-canvas-kicker">
              <LiveDot style={{ width: 6, height: 6 }} />
              <span>LIVE · FEATURED</span>
              <span>·</span>
              <span>MATCH #{featured.slug.slice(1)}</span>
              <span>·</span>
              <span style={{ color: "var(--phos-cyan)" }}>{gameLabel}</span>
              <span>·</span>
              <span>MOVE {moveCount}</span>
            </div>
            {boardEl}
          </div>
        </Panel>

        {/* Right sidebar */}
        <div className="stack lobby-sidebar">
          <Panel
            label="◐ LIVE CHAT"
            right={<span className="t-label" style={{ fontSize: 9 }}>{featured.viewers.toLocaleString()} ONLINE</span>}
            style={{ flex: 1, minHeight: 420, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div style={{ flex: 1, minHeight: 0 }}>
              <LiveChat
                messages={(chat as ChatMessage[]) || []}
                emojis={emojis || []}
                canSend={isAuthenticated && !!currentUser}
                currentUserName={chatUserName}
                onSend={handleChatSend}
              />
            </div>
          </Panel>
        </div>
      </div>

      {/* ── BELOW THE FOLD: other arenas ── */}
      <div className="page-shell" style={{ paddingTop: 0 }}>
        <div className="responsive-toolbar" style={{ alignItems: "baseline", marginBottom: 16 }}>
          <div>
            <div className="t-display" style={{ fontSize: 22 }}>HOT ARENAS</div>
            <div className="t-label" style={{ marginTop: 2 }}>TOP 6 OF {totalOthers} LIVE MATCHES · SORTED BY VIEWERS</div>
          </div>
          <Link href="/matches" className="btn primary">VIEW ALL {totalOthers} MATCHES →</Link>
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

            // Only render live board if this match has an active simulation state
            let miniBoard: React.ReactNode;
            if (ms) {
              if (m.game === "go19") {
                const stones = boardToStones(ms.board as GoBoard);
                const lm = ms.lastMove as { x: number; y: number; c: "b" | "w" } | null | undefined;
                miniBoard = <HoloBoardGo stones={stones} lastMove={lm ?? null} hot={[]} size={200} tilt={42} />;
              } else if (m.game === "chess") {
                miniBoard = <HoloBoardChess board={ms.board as ChessBoard} size={200} tilt={36} />;
              } else {
                miniBoard = <HoloBoardCheckers discs={ms.board as CheckersDisc[]} size={200} tilt={36} />;
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
      {/* ── BET MODAL ── */}
      {betOpen && featured && (
        <div onClick={() => setBetOpen(false)} style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--bg-panel)", border: "1px solid var(--phos-amber)",
            boxShadow: "0 0 40px rgba(255,181,71,0.25)", borderRadius: 2,
            padding: 28, minWidth: 320, maxWidth: 420, width: "90vw",
            display: "flex", flexDirection: "column", gap: 18,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="t-label" style={{ color: "var(--phos-amber)", fontSize: 13, letterSpacing: "0.15em" }}>PLACE BET</span>
              <button onClick={() => setBetOpen(false)} style={{ background: "none", border: "none", color: "var(--ink-400)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>
            </div>

            {/* Pool info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="t-label" style={{ fontSize: 10 }}>POOL</span>
                <span className="t-num" style={{ fontSize: 10 }}>${featuredBets?.total?.toFixed(0) ?? "0"} · {featuredBets?.count ?? 0} BETS</span>
              </div>
              <div style={{ display: "flex", height: 6, border: "1px solid var(--line)", background: "var(--bg-void)" }}>
                <div style={{ width: `${featuredBets && featuredBets.total > 0 ? (featuredBets.poolA / featuredBets.total) * 100 : 50}%`, background: "var(--phos-cyan)", transition: "width 0.6s ease" }} />
                <div style={{ flex: 1, background: "var(--phos-amber)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="t-num" style={{ fontSize: 10, color: "var(--phos-cyan)" }}>{featA?.handle} ${featuredBets?.poolA?.toFixed(0) ?? "0"}</span>
                <span className="t-num" style={{ fontSize: 10, color: "var(--phos-amber)" }}>${featuredBets?.poolB?.toFixed(0) ?? "0"} {featB?.handle}</span>
              </div>
            </div>

            {/* Side picker */}
            <div style={{ display: "flex", gap: 10 }}>
              {(["a", "b"] as const).map(s => {
                const agent = s === "a" ? featA : featB;
                const col = s === "a" ? "var(--phos-cyan)" : "var(--phos-amber)";
                const active = betSide === s;
                return (
                  <button key={s} onClick={() => setBetSide(s)} style={{
                    flex: 1, padding: "10px 8px",
                    background: active ? (s === "a" ? "rgba(95,240,230,0.12)" : "rgba(255,181,71,0.12)") : "transparent",
                    border: `1px solid ${active ? col : "var(--line)"}`,
                    color: active ? col : "var(--ink-300)",
                    cursor: "pointer", fontFamily: "var(--font-mono)",
                    fontSize: 11, letterSpacing: "0.12em", borderRadius: 2,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 20 }}>{agent?.glyph}</span>
                    <span>{agent?.handle}</span>
                    <span style={{ fontSize: 9, color: "var(--ink-400)" }}>{s === "a" ? `${winProbB}%` : `${winProbW}%`} WIN</span>
                  </button>
                );
              })}
            </div>

            {/* Amount */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="t-label" style={{ fontSize: 10 }}>AMOUNT{currentUser ? ` · BAL $${currentUser.balance?.toFixed(0)}` : ""}</span>
              <input
                type="number" min={1} value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                style={{
                  background: "var(--bg-void)", border: "1px solid var(--line)",
                  color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 14,
                  padding: "8px 12px", outline: "none", borderRadius: 2, width: "100%", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                {[50, 100, 250, 500].map(v => (
                  <button key={v} onClick={() => setBetAmount(String(v))} style={{
                    flex: 1, padding: "4px 0", background: "transparent",
                    border: "1px solid var(--line)", color: "var(--ink-300)",
                    fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer", borderRadius: 2,
                  }}>${v}</button>
                ))}
              </div>
            </div>

            {betError && <span style={{ color: "var(--phos-red)", fontSize: 11, fontFamily: "var(--font-mono)" }}>{betError}</span>}

            <button
              onClick={handleBet}
              disabled={betStatus === "submitting" || betStatus === "done"}
              style={{
                padding: "11px 0", background: betStatus === "done" ? "rgba(95,240,230,0.15)" : "rgba(255,181,71,0.12)",
                border: `1px solid ${betStatus === "done" ? "var(--phos-cyan)" : "var(--phos-amber)"}`,
                color: betStatus === "done" ? "var(--phos-cyan)" : "var(--phos-amber)",
                fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.15em",
                cursor: betStatus === "submitting" ? "wait" : "pointer", borderRadius: 2,
              }}
            >
              {betStatus === "submitting" ? "SUBMITTING…" : betStatus === "done" ? "BET PLACED ✓" : `PLACE BET · $${betAmount}`}
            </button>

            {/* My bets on this match */}
            {featuredBets?.myBets && featuredBets.myBets.length > 0 && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <span className="t-label" style={{ fontSize: 10, color: "var(--ink-400)", display: "block", marginBottom: 8 }}>YOUR BETS</span>
                {featuredBets.myBets.map((b, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < featuredBets.myBets.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <span className="t-num" style={{ fontSize: 10, color: b.side === "a" ? "var(--phos-cyan)" : "var(--phos-amber)" }}>
                      {b.side === "a" ? featA?.handle : featB?.handle}
                    </span>
                    <span className="t-num" style={{ fontSize: 10 }}>${b.amount} @ {b.odds}x</span>
                    <span className="t-label" style={{ fontSize: 9, color: "var(--ink-400)" }}>{b.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
