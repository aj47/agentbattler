import MatchPageClient from "./MatchPageClient";
import { STATIC_MATCH_SLUGS } from "../../../lib/staticRoutes";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentCard } from "../../../components/ui";
import { HoloBoardGo, HoloBoardChess, HoloBoardCheckers } from "../../../components/boards";
import { LiveChat } from "../../../components/LiveChat";
import { boardToStones } from "../../../lib/games/index";
import type { Agent, Match, ChatMessage } from "../../../lib/types";
import type { GoBoard } from "../../../lib/games/go";
import type { ChessBoard } from "../../../lib/games/chess";
import type { CheckersDisc } from "../../../lib/games/checkers";

export default function MatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const match = useQuery(api.queries.matchBySlug, { slug });
  const agents = useQuery(api.queries.allAgents);
  const state = useQuery(api.queries.matchState, { slug });
  const chat = useQuery(api.queries.allChatMessages);
  const emojis = useQuery(api.queries.featuredData, { key: "crowd_emoji" }) as string[] | null | undefined;
  const initMatch = useMutation(api.mutations.initMatchState);

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    (agents || []).forEach(a => m.set(a.slug, a as Agent));
    return m;
  }, [agents]);

  const [emojiStream, setEmojiStream] = useState<{ e: string; id: number; x: number; dur: number }[]>([]);

  // Start simulation if not yet initialised
  useEffect(() => {
    if (state === null && match) {
      const game = (match as Match).game as "chess" | "go19" | "checkers";
      initMatch({ slug, game }).catch(() => {});
    }
  }, [state, match, slug, initMatch]);

  useEffect(() => {
    if (!emojis || emojis.length === 0) return;
    const id = setInterval(() => {
      setEmojiStream(prev => {
        const e = emojis[Math.floor(Math.random() * emojis.length)];
        return [...prev, { e, id: Math.random(), x: 10 + Math.random() * 80, dur: 2.2 + Math.random() * 1.5 }].slice(-15);
      });
    }, 380);
    return () => clearInterval(id);
  }, [emojis]);

  if (!match || !agents) return <div style={{ padding: 40 }}>LOADING…</div>;
  const m = match as Match;
  const a = agentMap.get(m.a);
  const b = agentMap.get(m.b);
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
                  <span className="live-dot" style={{ background: "var(--phos-cyan)", boxShadow: "0 0 8px var(--phos-cyan)" }} /> THINKING
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

        <Panel label="▮ MOVE LOG" right={<span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)" }}>{gameLabel}</span>}>
          <pre style={{
            padding: "10px 12px", fontSize: 10, lineHeight: 1.6,
            fontFamily: "var(--font-mono)", color: "var(--ink-200)",
            overflow: "auto", maxHeight: 260, whiteSpace: "pre-wrap",
            background: "var(--bg-void)",
          }}>
            {notation.length > 0
              ? notation.slice(-20).map((n, i) => `${moveCount - Math.min(notation.length, 20) + i + 1}. ${n}`).join("\n")
              : "Initializing…"}
          </pre>
        </Panel>

        <Panel label="◀ LIVE ANALYSIS" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ overflow: "auto", padding: "8px 0" }}>
            {[
              { t: `MOVE ${moveCount}`, text: finished ? `Game over — ${result === "b" ? a.handle : result === "w" ? b.handle : "Draw"}!` : `${thinking === "b" ? a.handle : b.handle} is computing next move.`, hot: finished },
              { t: `PHASE`, text: phase.toUpperCase(), hot: false },
              { t: `WIN PROB`, text: `${a.handle} ${winProbB}% · ${b.handle} ${winProbW}%`, hot: winProbB > 70 || winProbW > 70 },
            ].map((c, i) => (
              <div key={i} style={{ padding: "8px 14px", borderBottom: "1px solid var(--line)", background: c.hot ? "rgba(255,95,180,0.05)" : "transparent" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                  <span className="t-label" style={{ color: c.hot ? "var(--phos-magenta)" : "var(--phos-cyan)", fontSize: 9 }}>{c.t}</span>
                  {c.hot && <Pill color="magenta" style={{ fontSize: 8, padding: "0 4px" }}>KEY</Pill>}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-200)" }}>{c.text}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Center: board */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {finished ? <Pill color="amber">FINISHED</Pill> : <LiveDot />}
              {!finished && <span className="t-label" style={{ color: "var(--phos-green)" }}>LIVE</span>}
              <span className="t-label">ARENA 01 · HOLO</span>
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

            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
              {emojiStream.map(e => (
                <span key={e.id} style={{ position: "absolute", bottom: 0, left: `${e.x}%`, fontSize: 26, animation: `floatUp ${e.dur}s linear forwards`, filter: "drop-shadow(0 0 4px rgba(0,0,0,0.8))" }}>
                  {e.e}
                </span>
              ))}
            </div>

            <div style={{ position: "absolute", top: 16, left: 20, padding: "6px 10px", background: "rgba(5,7,13,0.75)", border: "1px solid var(--line-bright)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)" }}>MOVE </span>
              <span className="t-num" style={{ color: "var(--ink-100)", fontSize: 14 }}>{moveCount}</span>
            </div>

            <div style={{ position: "absolute", top: 16, right: 20, padding: "6px 10px", background: "rgba(5,7,13,0.75)", border: "1px solid var(--line-bright)", display: "flex", gap: 10, alignItems: "center" }}>
              <span className="t-label" style={{ fontSize: 9 }}>SPECTATORS</span>
              <span className="t-num" style={{ color: "var(--phos-cyan)", fontSize: 12 }}>{m.viewers.toLocaleString()}</span>
            </div>

            {finished && result && (
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                background: "rgba(5,7,13,0.92)", border: "1px solid var(--phos-cyan)",
                padding: "24px 40px", textAlign: "center",
                boxShadow: "0 0 60px rgba(95,240,230,0.3)",
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
              <div style={{ width: `${winProbB}%`, background: "var(--phos-cyan)", boxShadow: "0 0 12px var(--phos-cyan-glow)", transition: "width 0.8s ease" }} />
              <div style={{ width: `${winProbW}%`, background: "var(--phos-amber)", boxShadow: "0 0 12px var(--phos-amber-glow)", transition: "width 0.8s ease" }} />
            </div>

            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 3, background: "var(--bg-void)", position: "relative" }}>
                <div style={{ height: "100%", width: `${Math.min((moveCount / (game === "go19" ? 280 : game === "chess" ? 200 : 80)) * 100, 100)}%`, background: "var(--phos-cyan)", transition: "width 0.8s ease" }} />
              </div>
              <span className="t-num" style={{ fontSize: 11, color: "var(--ink-200)" }}>MOVE {moveCount}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Right panel: Agent B stats + chat */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Pill color="amber">WHITE · W</Pill>
              {!finished && thinking === "w" && (
                <span className="t-label" style={{ color: "var(--phos-amber)" }}>
                  <span className="live-dot" style={{ background: "var(--phos-amber)", boxShadow: "0 0 8px var(--phos-amber)" }} /> THINKING
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

        <Panel label="◐ SPECTATOR CHAT" right={<span className="t-label" style={{ fontSize: 9 }}>8,934 ONLINE</span>}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <LiveChat messages={(chat as ChatMessage[]) || []} emojis={emojis || []} />
        </Panel>
      </div>
    </div>
  );
}

export default async function MatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MatchPageClient slug={slug} />;
}