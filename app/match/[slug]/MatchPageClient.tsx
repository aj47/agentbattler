"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentCard } from "../../../components/ui";
import { HoloBoardGo, HoloBoardChess, HoloBoardCheckers } from "../../../components/boards";
import { MoveHistory } from "../../../components/MoveHistory";
import { boardToStones } from "../../../lib/games/index";
import { matchNumberFromSlug } from "../../../lib/matches";
import type { Match } from "../../../lib/types";
import type { GoBoard } from "../../../lib/games/go";
import type { ChessBoard } from "../../../lib/games/chess";
import type { CheckersDisc } from "../../../lib/games/checkers";

function FloatingEmojiLayer({ emojis }: { emojis: string[] }) {
  void emojis;
  return null;
}

export default function MatchPageClient({ slug }: { slug: string }) {
  const arena = useQuery(api.queries.arenaData, { slug });
  const match = arena?.match;
  const a = arena?.agentA;
  const b = arena?.agentB;
  const state = arena?.state;
  const emojis = arena?.emojis as string[] | null | undefined;
  const currentUser = arena?.currentUser;
  const matchBets = arena?.bets;
  const initMatch = useMutation(api.mutations.initMatchState);
  const placeBetMutation = useMutation(api.mutations.placeBet);
  const { isAuthenticated } = useConvexAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [betSide, setBetSide] = useState<"a" | "b" | null>(null);
  const [betAmount, setBetAmount] = useState(500);
  const [betStatus, setBetStatus] = useState<"idle" | "placing" | "done" | "error">("idle");
  const [betError, setBetError] = useState("");

  // Start simulation if not yet initialised
  useEffect(() => {
    if (state === null && match) {
      const game = (match as Match).game as "chess" | "go19" | "checkers";
      initMatch({ slug, game }).catch(() => {});
    }
  }, [state, match, slug, initMatch]);

  if (!arena) return <div style={{ padding: 40 }}>LOADING…</div>;
  if (!match) return <div style={{ padding: 40 }}>Match not found.</div>;
  const m = match as Match;
  if (!a || !b) return <div style={{ padding: 40 }}>Agent not found.</div>;

  // Derive board visuals from live state
  const game = m.game;
  const moveCount = state?.moveCount ?? m.move;
  const winProbB = state ? Math.round(state.winProbB * 100) : 50;
  const winProbW = 100 - winProbB;
  const thinking: "b" | "w" = state ? state.toMove : "b";
  const capturesB = state?.capturesB ?? 0;
  const capturesW = state?.capturesW ?? 0;
  const phase = state?.phase ?? m.phase;
  const finished = phase === "finished";
  const result = state?.result;

  // Board rendering per game
  let boardEl: React.ReactNode;
  let lastMoveGo: { x: number; y: number; c: "b" | "w" } | null = null;
  let hotSpots: { x: number; y: number }[] = [];

  if (game === "go19" && state?.board) {
    const goBoard = state.board as GoBoard;
    const stones = boardToStones(goBoard);
    const lm = state.lastMove as { x: number; y: number; c: "b" | "w" } | null | undefined;
    lastMoveGo = lm ?? null;
    if (lm) {
      hotSpots = [
        { x: lm.x - 1, y: lm.y }, { x: lm.x + 1, y: lm.y },
        { x: lm.x, y: lm.y - 1 }, { x: lm.x, y: lm.y + 1 },
      ].filter(h => h.x >= 0 && h.x < 19 && h.y >= 0 && h.y < 19);
    }
    boardEl = <HoloBoardGo stones={stones} lastMove={lastMoveGo} hot={hotSpots} size={560} tilt={42} />;
  } else if (game === "chess") {
    const chessBoard = state?.board as ChessBoard | undefined;
    boardEl = <HoloBoardChess board={chessBoard} size={460} tilt={36} />;
  } else if (game === "checkers") {
    const checkersDiscs = state?.board as CheckersDisc[] | undefined;
    boardEl = <HoloBoardCheckers discs={checkersDiscs} size={460} tilt={36} />;
  } else {
    boardEl = <HoloBoardGo stones={[]} size={560} tilt={42} />;
  }

  // Stats labels per game
  const statLabelA = game === "go19" ? "TERRITORY" : game === "chess" ? "MATERIAL" : "PIECES";
  const statLabelB = game === "go19" ? "CAPTURES" : game === "chess" ? "CAPTURES" : "CAPTURES";

  // Compute rough territory/material from state
  let scoreA = "—", scoreB = "—";
  if (state?.board) {
    if (game === "go19") {
      scoreA = (winProbB * 1.8).toFixed(1);
      scoreB = (winProbW * 1.8).toFixed(1);
    } else if (game === "chess") {
      scoreA = capturesB.toString();
      scoreB = capturesW.toString();
    } else {
      const discs = state.board as CheckersDisc[];
      scoreA = discs.filter((d: CheckersDisc) => d.c === "b").length.toString();
      scoreB = discs.filter((d: CheckersDisc) => d.c === "r").length.toString();
    }
  }

  const gameLabel = game === "go19" ? "GO 19×19" : game === "chess" ? "CHESS" : "CHECKERS";
  const notation = state?.notationHistory ?? [];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "280px 1fr 320px", gap: 16,
      padding: "16px 20px", maxWidth: 1760, margin: "0 auto",
      height: "calc(100vh - 60px - 40px)", minHeight: 760,
    }}>
      {/* Left panel: Agent A stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Pill color="cyan">BLACK · B</Pill>
              {!finished && thinking === "b" && (
                <span className="t-label" style={{ color: "var(--phos-cyan)" }}>
                  <span className="live-dot" style={{ background: "var(--phos-cyan)" }} /> THINKING
                </span>
              )}
              {finished && result === "b" && <Pill color="green">WINNER</Pill>}
            </div>
            <Link href={`/agent/${a.slug}`}><AgentCard agent={a} /></Link>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 14 }}>
              <div>
                <div className="t-label" style={{ fontSize: 9 }}>{statLabelA}</div>
                <div className="t-num" style={{ fontSize: 24, color: "var(--phos-cyan)", textShadow: "var(--glow-cyan)" }}>{scoreA}</div>
              </div>
              <div>
                <div className="t-label" style={{ fontSize: 9 }}>{statLabelB}</div>
                <div className="t-num" style={{ fontSize: 24, color: "var(--ink-100)" }}>{capturesB}</div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel label="▮ MATCH DETAILS" right={<span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)" }}>{gameLabel}</span>}>
          <div style={{ padding: "10px 12px", display: "grid", gap: 8, background: "var(--bg-void)" }}>
            {[
              ["MATCH", `#${matchNumberFromSlug(m.slug)}`],
              ["STATUS", finished ? "FINISHED" : "LIVE"],
              ["MOVE", String(moveCount)],
              ["PHASE", phase.toUpperCase()],
              ["TO MOVE", thinking === "b" ? "BLACK" : "WHITE"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span className="t-label" style={{ fontSize: 9, color: "var(--ink-400)" }}>{label}</span>
                <span className="t-num" style={{ fontSize: 11, color: "var(--ink-100)" }}>{value}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Bet history panel */}
        <Panel style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {(() => {
            const poolA = matchBets?.poolA ?? 0;
            const poolB = matchBets?.poolB ?? 0;
            const total = matchBets?.total ?? 0;
            const myBets = matchBets?.myBets ?? [];
            const pctA = total > 0 ? Math.round((poolA / total) * 100) : 50;
            const pctB = 100 - pctA;
            return (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

                {/* Panel header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", color: "var(--ink-300)" }}>◈ BET HISTORY</span>
                  {!finished && (
                    <button onClick={() => { setBetSide(null); setBetStatus("idle"); setBetError(""); setModalOpen(true); }}
                      style={{
                        background: "transparent", border: "1px solid var(--phos-cyan)",
                        color: "var(--phos-cyan)", fontFamily: "var(--font-mono)", fontSize: 10,
                        letterSpacing: "0.12em", padding: "4px 12px", cursor: "pointer",
                      }}>
                      PLACE BET
                    </button>
                  )}
                </div>

                {/* Pool totals */}
                <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink-400)", letterSpacing: "0.1em", marginBottom: 3 }}>TOTAL POOL</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--ink-100)" }}>${total.toLocaleString()}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-400)", textAlign: "right" }}>
                      {matchBets?.count ?? 0} BETS
                    </div>
                  </div>

                  {/* Split bar */}
                  <div style={{ display: "flex", height: 6, gap: 1 }}>
                    <div style={{ width: `${pctA}%`, background: "var(--phos-cyan)" }} />
                    <div style={{ flex: 1, background: "var(--phos-amber)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--phos-cyan)" }}>{a.handle} {pctA}%</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--phos-amber)" }}>{pctB}% {b.handle}</span>
                  </div>
                </div>

                {/* My bets */}
                {myBets.length > 0 && (
                  <div style={{ borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
                    <div style={{ padding: "8px 14px 4px", fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.14em", color: "var(--ink-400)" }}>MY BETS</div>
                    {myBets.map((bet, i) => {
                      const sideColor = bet.side === "a" ? "var(--phos-cyan)" : "var(--phos-amber)";
                      const statusColor = bet.status === "won" ? "var(--phos-green)" : bet.status === "lost" ? "var(--phos-red)" : "var(--ink-400)";
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", padding: "7px 14px", borderTop: "1px solid var(--line)" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: sideColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {bet.side === "a" ? a.handle : b.handle}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-200)" }}>
                            ${bet.amount.toLocaleString()}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: statusColor, textAlign: "right" }}>
                            {bet.status === "won" ? `+$${(bet.payout ?? 0).toLocaleString()}` : bet.status === "lost" ? "LOST" : `@ ${bet.odds}x`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty state */}
                {(matchBets?.count ?? 0) === 0 && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.12em" }}>NO BETS YET</span>
                  </div>
                )}
              </div>
            );
          })()}
        </Panel>

        {/* Bet modal */}
        {modalOpen && (() => {
          const poolA = matchBets?.poolA ?? 0;
          const poolB = matchBets?.poolB ?? 0;
          const total = matchBets?.total ?? 0;
          const oddsA = poolA > 0 && total > 0 ? (total / poolA).toFixed(2) : (winProbB > 0 ? (100 / winProbB).toFixed(2) : "2.00");
          const oddsB = poolB > 0 && total > 0 ? (total / poolB).toFixed(2) : (winProbW > 0 ? (100 / winProbW).toFixed(2) : "2.00");
          const balance = currentUser?.balance ?? 0;
          const payout = betSide ? (betAmount * parseFloat(betSide === "a" ? oddsA : oddsB)).toFixed(0) : "0";

          const handlePlaceBet = async () => {
            if (!betSide) return;
            setBetStatus("placing");
            setBetError("");
            try {
              await placeBetMutation({ matchSlug: slug, side: betSide, amount: betAmount });
              setBetStatus("done");
              setTimeout(() => { setBetStatus("idle"); setModalOpen(false); }, 1400);
            } catch (e: unknown) {
              setBetError(e instanceof Error ? e.message : "Failed");
              setBetStatus("error");
              setTimeout(() => setBetStatus("idle"), 3000);
            }
          };

          const sideBtn = (side: "a" | "b", handle: string, odds: string, color: string, prob: number) => {
            const active = betSide === side;
            const borderColor = active ? (color === "cyan" ? "var(--phos-cyan)" : "var(--phos-amber)") : "var(--line)";
            const textColor  = active ? (color === "cyan" ? "var(--phos-cyan)" : "var(--phos-amber)") : "var(--ink-300)";
            const dimColor   = active ? textColor : "var(--ink-500)";
            return (
              <button key={side} onClick={() => setBetSide(active ? null : side)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 4, padding: "14px 10px",
                  background: active ? "rgba(5,7,13,0.6)" : "rgba(5,7,13,0.3)",
                  border: `1px solid ${borderColor}`,
                  cursor: "pointer", outline: "none",
                }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: textColor, textTransform: "uppercase" }}>{handle}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, lineHeight: 1, color: textColor }}>{odds}<span style={{ fontSize: 14 }}>x</span></span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: dimColor, letterSpacing: "0.08em" }}>{prob}% WIN PROB</span>
              </button>
            );
          };

          return (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(5,7,13,0.80)" }} onClick={() => setModalOpen(false)} />
              <div style={{
                position: "relative", zIndex: 1, width: 380,
                background: "linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-panel-2) 100%)",
                border: "1px solid var(--line-bright)",
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.2em", color: "var(--ink-100)" }}>PLACE BET</span>
                  <button onClick={() => setModalOpen(false)}
                    style={{ background: "none", border: "1px solid var(--line)", color: "var(--ink-300)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, padding: "3px 9px", lineHeight: 1 }}>
                    ✕
                  </button>
                </div>

                <div style={{ padding: "18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Side picker */}
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em", color: "var(--ink-400)", marginBottom: 10 }}>SELECT WINNER</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {sideBtn("a", a.handle, oddsA, "cyan", winProbB)}
                      {sideBtn("b", b.handle, oddsB, "amber", winProbW)}
                    </div>
                  </div>

                  {/* Amount presets */}
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em", color: "var(--ink-400)", marginBottom: 10 }}>WAGER AMOUNT</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
                      {[100, 500, 1000, 5000].map(p => {
                        const active = betAmount === p;
                        return (
                          <button key={p} onClick={() => setBetAmount(p)}
                            style={{
                              padding: "7px 0", background: active ? "rgba(95,240,230,0.07)" : "transparent",
                              border: `1px solid ${active ? "var(--phos-cyan)" : "var(--line)"}`,
                              color: active ? "var(--phos-cyan)" : "var(--ink-300)",
                              fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer", outline: "none",
                              letterSpacing: "0.05em",
                            }}>
                            ${p >= 1000 ? `${p / 1000}k` : p}
                          </button>
                        );
                      })}
                    </div>
                    <input type="number" min={1} value={betAmount}
                      onChange={e => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: "100%", background: "var(--bg-void)", border: "1px solid var(--line)",
                        color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 14,
                        padding: "9px 12px", outline: "none", boxSizing: "border-box",
                      }} />
                  </div>

                  {/* Payout row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-void)", border: "1px solid var(--line)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--ink-400)" }}>POTENTIAL PAYOUT</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: betSide ? "var(--phos-green)" : "var(--ink-500)" }}>
                      ${betSide ? parseInt(payout).toLocaleString() : "—"}
                    </span>
                  </div>

                  {/* CTA */}
                  {!isAuthenticated ? (
                    <div style={{ textAlign: "center", padding: "12px 0", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-400)", letterSpacing: "0.12em" }}>SIGN IN TO BET</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button disabled={!betSide || betStatus === "placing" || betStatus === "done"}
                        onClick={handlePlaceBet}
                        style={{
                          padding: "13px 0", width: "100%", cursor: betSide ? "pointer" : "not-allowed",
                          background: betStatus === "done" ? "rgba(125,255,156,0.12)" : betSide ? "rgba(95,240,230,0.07)" : "transparent",
                          border: `1px solid ${betStatus === "done" ? "var(--phos-green)" : betSide ? "var(--phos-cyan)" : "var(--line)"}`,
                          color: betStatus === "done" ? "var(--phos-green)" : betSide ? "var(--phos-cyan)" : "var(--ink-500)",
                          fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.18em",
                          opacity: betSide ? 1 : 0.5, outline: "none",
                        }}>
                        {betStatus === "placing" ? "PLACING…" : betStatus === "done" ? "BET PLACED ✓" : "CONFIRM BET"}
                      </button>
                      {betStatus === "error" && (
                        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--phos-red)", letterSpacing: "0.1em" }}>{betError}</div>
                      )}
                      <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-400)", letterSpacing: "0.1em" }}>
                        BALANCE ${balance.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Center: board */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {finished ? <Pill color="amber">FINISHED</Pill> : <LiveDot />}
              {!finished && <span className="t-label" style={{ color: "var(--phos-green)" }}>LIVE</span>}
              <span className="t-label">MATCH #{matchNumberFromSlug(m.slug)}</span>
              <span className="t-label">·</span>
              <span className="t-label" style={{ color: "var(--phos-cyan)" }}>{gameLabel}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="t-label" style={{ color: "var(--ink-300)" }}>PHASE: <span style={{ color: "var(--phos-cyan)" }}>{phase.toUpperCase()}</span></span>
            </div>
          </div>

          <div style={{
            flex: 1, position: "relative", display: "grid", placeItems: "center",
            background: "radial-gradient(ellipse at 50% 60%, rgba(95,240,230,0.08), transparent 70%)",
            overflow: "hidden",
          }}>
              <div style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", width: 700, height: 180, pointerEvents: "none" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  position: "absolute", left: "50%", top: "50%",
                  transform: "translate(-50%, -50%) rotateX(75deg)",
                  width: 200 + i * 140, height: 200 + i * 140,
                  borderRadius: "50%", border: "1px solid rgba(95,240,230,0.15)",
                }} />
              ))}
            </div>

            {boardEl}

            <FloatingEmojiLayer emojis={emojis || []} />

            <div style={{ position: "absolute", top: 16, left: 20, padding: "6px 10px", background: "rgba(5,7,13,0.75)", border: "1px solid var(--line-bright)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)" }}>MOVE </span>
              <span className="t-num" style={{ color: "var(--ink-100)", fontSize: 14 }}>{moveCount}</span>
            </div>

            <div className="arena-overlay-pill" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="t-label" style={{ fontSize: 9 }}>MATCH</span>
              <span className="t-num" style={{ color: "var(--phos-cyan)", fontSize: 12 }}>#{matchNumberFromSlug(m.slug)}</span>
            </div>

            {finished && result && (
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                background: "rgba(5,7,13,0.92)", border: "1px solid var(--phos-cyan)",
                padding: "24px 40px", textAlign: "center",
              }}>
                <div className="t-display" style={{ fontSize: 28, color: "var(--phos-cyan)" }}>GAME OVER</div>
                <div className="t-label" style={{ marginTop: 8, fontSize: 14 }}>
                  {result === "draw" ? "DRAW" : result === "b" ? `${a.handle} WINS` : `${b.handle} WINS`}
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="t-label" style={{ color: "var(--phos-cyan)" }}>B · {a.handle} · {winProbB}%</span>
              <span className="t-label">WIN PROBABILITY</span>
              <span className="t-label" style={{ color: "var(--phos-amber)" }}>{winProbW}% · {b.handle} · W</span>
            </div>
            <div style={{ display: "flex", height: 6, background: "var(--bg-void)", border: "1px solid var(--line)" }}>
              <div style={{ width: `${winProbB}%`, background: "var(--phos-cyan)" }} />
              <div style={{ width: `${winProbW}%`, background: "var(--phos-amber)" }} />
            </div>

            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 3, background: "var(--bg-void)", position: "relative" }}>
                <div style={{ height: "100%", width: `${Math.min((moveCount / (game === "go19" ? 280 : game === "chess" ? 200 : 80)) * 100, 100)}%`, background: "var(--phos-cyan)" }} />
              </div>
              <span className="t-num" style={{ fontSize: 11, color: "var(--ink-200)" }}>MOVE {moveCount}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Right panel: Agent B stats + move history */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Pill color="amber">WHITE · W</Pill>
              {!finished && thinking === "w" && (
                <span className="t-label" style={{ color: "var(--phos-amber)" }}>
                  <span className="live-dot" style={{ background: "var(--phos-amber)" }} /> THINKING
                </span>
              )}
              {finished && result === "w" && <Pill color="green">WINNER</Pill>}
            </div>
            <Link href={`/agent/${b.slug}`}><AgentCard agent={b} /></Link>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 14 }}>
              <div>
                <div className="t-label" style={{ fontSize: 9 }}>{statLabelA}</div>
                <div className="t-num" style={{ fontSize: 24, color: "var(--phos-amber)", textShadow: "var(--glow-amber)" }}>{scoreB}</div>
              </div>
              <div>
                <div className="t-label" style={{ fontSize: 9 }}>{statLabelB}</div>
                <div className="t-num" style={{ fontSize: 24, color: "var(--ink-100)" }}>{capturesW}</div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel label="▮ MOVE HISTORY" right={<span className="t-label" style={{ fontSize: 9 }}>MATCH #{matchNumberFromSlug(m.slug)}</span>}
          className="match-chat-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <MoveHistory
            notation={notation}
            moveCount={moveCount}
            matchSlug={m.slug}
            gameLabel={gameLabel}
            maxMoves={64}
          />
        </Panel>
      </div>
    </div>
  );
}
