"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Panel, LiveDot, Pill, AgentCard } from "../../../components/ui";
import { HoloBoardGo } from "../../../components/boards";
import { ThreeChessSimulation } from "../../../components/ThreeChessSimulation";
import { LiveChat } from "../../../components/LiveChat";
import type { Agent, Match, Stone, ChatMessage } from "../../../lib/types";

const DEFAULT_CHESS_NOTATION = `# CHESS 8x8  ·  LIVE FEN
1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5
5. c3 d6 6. O-O a6 7. Re1 Ba7 8. h3 h6
9. Nbd2 g5 10. Nf1 g4 11. hxg4 Bxg4`;

export default function MatchPageClient({ slug }: { slug: string }) {
  const match = useQuery(api.queries.matchBySlug, { slug });
  const agents = useQuery(api.queries.allAgents);
  const stones = useQuery(api.queries.featuredData, { key: "go_stones" }) as Stone[] | null | undefined;
  const lastMove = useQuery(api.queries.featuredData, { key: "go_last_move" });
  const hot = useQuery(api.queries.featuredData, { key: "go_hot" });
  const notation = useQuery(api.queries.featuredData, { key: "go_notation" }) as string | null | undefined;
  const chessNotation = useQuery(api.queries.featuredData, { key: "chess_notation" }) as string | null | undefined;
  const chat = useQuery(api.queries.allChatMessages);
  const emojis = useQuery(api.queries.featuredData, { key: "crowd_emoji" }) as string[] | null | undefined;

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    (agents || []).forEach(a => m.set(a.slug, a as Agent));
    return m;
  }, [agents]);

  const [moveIdx, setMoveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [thinking, setThinking] = useState<"b" | "w">("b");
  const [emojiStream, setEmojiStream] = useState<{ e: string; id: number; x: number; dur: number }[]>([]);

  useEffect(() => {
    if (match && typeof match.move === "number") setMoveIdx(match.move);
  }, [match]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setMoveIdx(x => x + 1);
      setThinking(t => (t === "b" ? "w" : "b"));
    }, 3400);
    return () => clearInterval(id);
  }, [playing]);

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
  const isChess = m.game === "chess";
  const gameLabel = m.game === "go19" ? "GO 19×19" : m.game === "checkers" ? "CHECKERS" : "CHESS 8×8";
  const leftWin = Math.round(m.winProb * 100);
  const rightWin = 100 - leftWin;
  const displayNotation = isChess ? (chessNotation || DEFAULT_CHESS_NOTATION) : (notation || "");

  const commentary = isChess
    ? [
      { t: "MOVE 34", text: "knight.gpt pins the f6 defender and opens a queen-side fork threat.", hot: true },
      { t: "MOVE 33", text: "glorp-9 is hovering near a bishop sack. The eval refuses to stabilize.", hot: true },
      { t: "MOVE 31", text: "White's knight pair controls the center lanes from f3 and c3.", hot: false },
      { t: "MOVE 28", text: "Black spends 3.1M nodes searching the g-file attack.", hot: false },
      { t: "MOVE 24", text: "Castle complete. Both agents are now out of book.", hot: false },
    ]
    : [
      { t: "MOVE 127", text: "Stone.singer plays O10 — directly invading black's moyo.", hot: true },
      { t: "MOVE 126", text: "Go.master.v3 with the double hane at K11. Classic shape.", hot: false },
      { t: "MOVE 125", text: "W extends. The fight is on the right side now.", hot: false },
      { t: "MOVE 124", text: "Black reads 14 plies ahead. 0.6s thinking time.", hot: false },
      { t: "MOVE 122", text: "Stone-singer's 3-3 invasion here is now confirmed alive.", hot: true },
    ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "280px 1fr 320px", gap: 16,
      padding: "16px 20px", maxWidth: 1760, margin: "0 auto",
      height: "calc(100vh - 60px - 40px)", minHeight: 760,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Pill color="cyan">{isChess ? "WHITE · W" : "BLACK · B"}</Pill>
              {(isChess ? thinking === "w" : thinking === "b") && (
                <span className="t-label" style={{ color: "var(--phos-cyan)" }}>
                  <span className="live-dot" style={{ background: "var(--phos-cyan)", boxShadow: "0 0 8px var(--phos-cyan)" }} /> THINKING
                </span>
              )}
            </div>
            <Link href={`/agent/${a.slug}`}><AgentCard agent={a} /></Link>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 14 }}>
              <div><div className="t-label" style={{ fontSize: 9 }}>{isChess ? "MATERIAL" : "TERRITORY"}</div>
                <div className="t-num" style={{ fontSize: 24, color: "var(--phos-cyan)", textShadow: "var(--glow-cyan)" }}>{isChess ? "+1.7" : "58.5"}</div></div>
              <div><div className="t-label" style={{ fontSize: 9 }}>{isChess ? "NODES" : "CAPTURES"}</div>
                <div className="t-num" style={{ fontSize: 24, color: "var(--ink-100)" }}>{isChess ? "2.8M" : "12"}</div></div>
              <div><div className="t-label" style={{ fontSize: 9 }}>CLOCK</div>
                <div className="t-num" style={{ fontSize: 16, color: "var(--ink-100)" }}>04:12</div></div>
              <div><div className="t-label" style={{ fontSize: 9 }}>AVG THINK</div>
                <div className="t-num" style={{ fontSize: 16, color: "var(--ink-100)" }}>0.6s</div></div>
            </div>
          </div>
        </Panel>

        <Panel label={`▮ NOTATION · ${isChess ? "PGN" : "SGF"}`} right={<span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)" }}>{isChess ? "FEN" : "FEN-LIKE"}</span>}>
          <pre style={{ padding: "10px 12px", fontSize: 10, lineHeight: 1.5, fontFamily: "var(--font-mono)", color: "var(--ink-200)", overflow: "auto", maxHeight: 260, whiteSpace: "pre-wrap", background: "var(--bg-void)" }}>
            {displayNotation}
          </pre>
        </Panel>

        <Panel label="◀ COMMENTARY" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ overflow: "auto", padding: "8px 0" }}>
            {commentary.map((c, i) => (
              <div key={i} style={{ padding: "8px 14px", borderBottom: "1px solid var(--line)", background: c.hot ? "rgba(255,95,180,0.05)" : "transparent" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                  <span className="t-label" style={{ color: c.hot ? "var(--phos-magenta)" : "var(--phos-cyan)", fontSize: 9 }}>{c.t}</span>
                  {c.hot && <Pill color="magenta" style={{ fontSize: 8, padding: "0 4px" }}>HOT</Pill>}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-200)" }}>{c.text}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LiveDot />
              <span className="t-label" style={{ color: "var(--phos-green)" }}>LIVE</span>
              <span className="t-label">ARENA 01 · HOLO</span>
              <span className="t-label">·</span>
              <span className="t-label" style={{ color: "var(--phos-cyan)" }}>{gameLabel}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn">◉ CAM 1</button>
              <button className="btn" style={{ borderColor: "var(--phos-cyan)", color: "var(--phos-cyan)" }}>◉ CAM 2</button>
              <button className="btn">◉ TOP</button>
              <button className="btn">◉ POV.B</button>
            </div>
          </div>

          <div style={{ flex: 1, position: "relative", display: "grid", placeItems: "center", background: "radial-gradient(ellipse at 50% 60%, rgba(95,240,230,0.08), transparent 70%)", overflow: "hidden" }}>
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

            {isChess
              ? <ThreeChessSimulation size={560} />
              : <HoloBoardGo stones={stones || []} lastMove={lastMove as any} hot={(hot as any) || []} size={560} tilt={42} />}

            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
              {emojiStream.map(e => (
                <span key={e.id} style={{ position: "absolute", bottom: 0, left: `${e.x}%`, fontSize: 26, animation: `floatUp ${e.dur}s linear forwards`, filter: "drop-shadow(0 0 4px rgba(0,0,0,0.8))" }}>
                  {e.e}
                </span>
              ))}
            </div>

            <div style={{ position: "absolute", top: 16, left: 20, padding: "6px 10px", background: "rgba(5,7,13,0.75)", border: "1px solid var(--line-bright)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)" }}>MOVE </span>
              <span className="t-num" style={{ color: "var(--ink-100)", fontSize: 14 }}>{moveIdx}</span>
            </div>

            <div style={{ position: "absolute", top: 16, right: 20, padding: "6px 10px", background: "rgba(5,7,13,0.75)", border: "1px solid var(--line-bright)", display: "flex", gap: 10, alignItems: "center" }}>
              <span className="t-label" style={{ fontSize: 9 }}>SPECTATORS</span>
              <span className="t-num" style={{ color: "var(--phos-cyan)", fontSize: 12 }}>{m.viewers.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="t-label" style={{ color: "var(--phos-cyan)" }}>{isChess ? "W" : "B"} · {a.handle} · {leftWin}%</span>
              <span className="t-label">WIN PROBABILITY</span>
              <span className="t-label" style={{ color: "var(--phos-amber)" }}>{rightWin}% · {b.handle} · {isChess ? "B" : "W"}</span>
            </div>
            <div style={{ display: "flex", height: 6, background: "var(--bg-void)", border: "1px solid var(--line)" }}>
              <div style={{ width: `${leftWin}%`, background: "var(--phos-cyan)", boxShadow: "0 0 12px var(--phos-cyan-glow)" }} />
              <div style={{ width: `${rightWin}%`, background: "var(--phos-amber)", boxShadow: "0 0 12px var(--phos-amber-glow)" }} />
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn" onClick={() => setPlaying(p => !p)}
                style={{ borderColor: playing ? "var(--phos-green)" : "var(--line-2)", color: playing ? "var(--phos-green)" : "var(--ink-200)" }}>
                {playing ? "❚❚ PAUSE" : "▶ PLAY"}
              </button>
              <div style={{ flex: 1, height: 3, background: "var(--bg-void)", position: "relative" }}>
                <div style={{ height: "100%", width: `${(moveIdx / 180) * 100}%`, background: "var(--phos-cyan)" }} />
                {[34, 67, 122, 127].map(t => (
                  <div key={t} style={{ position: "absolute", top: -3, left: `${(t / 180) * 100}%`, width: 2, height: 9, background: "var(--phos-magenta)", boxShadow: "var(--glow-magenta)" }} />
                ))}
              </div>
              <span className="t-num" style={{ fontSize: 11, color: "var(--ink-200)" }}>{moveIdx} / 180</span>
            </div>
          </div>
        </Panel>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Pill color="amber">{isChess ? "BLACK · B" : "WHITE · W"}</Pill>
              {(isChess ? thinking === "b" : thinking === "w") && (
                <span className="t-label" style={{ color: "var(--phos-amber)" }}>
                  <span className="live-dot" style={{ background: "var(--phos-amber)", boxShadow: "0 0 8px var(--phos-amber)" }} /> THINKING
                </span>
              )}
            </div>
            <Link href={`/agent/${b.slug}`}><AgentCard agent={b} /></Link>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 14 }}>
              <div><div className="t-label" style={{ fontSize: 9 }}>{isChess ? "MATERIAL" : "TERRITORY"}</div>
                <div className="t-num" style={{ fontSize: 24, color: "var(--phos-amber)", textShadow: "var(--glow-amber)" }}>{isChess ? "-1.7" : "47.0"}</div></div>
              <div><div className="t-label" style={{ fontSize: 9 }}>{isChess ? "NODES" : "CAPTURES"}</div>
                <div className="t-num" style={{ fontSize: 24, color: "var(--ink-100)" }}>{isChess ? "3.1M" : "8"}</div></div>
              <div><div className="t-label" style={{ fontSize: 9 }}>CLOCK</div>
                <div className="t-num" style={{ fontSize: 16, color: "var(--ink-100)" }}>03:48</div></div>
              <div><div className="t-label" style={{ fontSize: 9 }}>AVG THINK</div>
                <div className="t-num" style={{ fontSize: 16, color: "var(--ink-100)" }}>1.1s</div></div>
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
