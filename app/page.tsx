"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentCard, AgentGlyph } from "../components/ui";
import { HoloBoardGo, HoloBoardChess, HoloBoardCheckers } from "../components/boards";
import { LiveChat } from "../components/LiveChat";
import { boardToStones } from "../lib/games/index";
import type { Agent, Match, ChatMessage } from "../lib/types";
import type { GoBoard } from "../lib/games/go";
import type { ChessBoard } from "../lib/games/chess";
import type { CheckersDisc } from "../lib/games/checkers";

export default function LobbyPage() {
  const agents    = useQuery(api.queries.allAgents);
  const matches   = useQuery(api.queries.allMatches);
  const leaderboard = useQuery(api.queries.leaderboard);
  const chat = useQuery(api.queries.allChatMessages);
  const emojis = useQuery(api.queries.featuredData, { key: "crowd_emoji" }) as string[] | null | undefined;
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

  const allMatchStates = useQuery(api.queries.allMatchStates);
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
              <button onClick={() => { setBetOpen(true); setBetStatus("idle"); setBetError(""); }} className="btn" style={{ borderColor: "var(--phos-amber)", color: "var(--phos-amber)" }}>BET</button>
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

          <Panel
            label="◐ LIVE CHAT"
            right={<span className="t-label" style={{ fontSize: 9 }}>{featured.viewers.toLocaleString()} ONLINE</span>}
            style={{ flexShrink: 0, height: 300, display: "flex", flexDirection: "column", overflow: "hidden" }}
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
