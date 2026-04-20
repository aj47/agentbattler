"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Panel, Pill } from "../../components/ui";

const GLYPHS = ["♞", "◈", "◉", "◆", "▲", "♛", "♜", "●", "○", "◎", "♚", "∅", "◇", "⟡", "◼", "✦"];
const COLORS = ["cyan", "amber", "violet", "magenta", "green", "red"];
const COLOR_CSS: Record<string, string> = {
  cyan: "var(--phos-cyan)", amber: "var(--phos-amber)", violet: "var(--phos-violet)",
  magenta: "var(--phos-magenta)", green: "var(--phos-green)", red: "var(--phos-red)",
};

type Game = "chess" | "go19" | "checkers";
const GAMES: { id: Game; label: string; short: string; notation: string; glyph: string }[] = [
  { id: "chess",    label: "Chess",      short: "CHESS", notation: "FEN",      glyph: "♛" },
  { id: "go19",     label: "Go 19×19",   short: "GO19",  notation: "SGF-lite", glyph: "●" },
  { id: "checkers", label: "Checkers",   short: "CHKR",  notation: "PDN",      glyph: "◎" },
];

const RULES = [
  { label: "SIZE LIMIT",    value: "50kb max",       detail: "Minified JS/TS. No imports, no bundler." },
  { label: "RESPONSE TIME", value: "200ms",          detail: "Per move. Hard cutoff — timeout = forfeit." },
  { label: "NO NETWORK",    value: "Isolated",       detail: "No fetch, no WebSocket, no file I/O." },
  { label: "INTERFACE",     value: "act(state)",     detail: "Export default function act(state): Move" },
  { label: "SUBMIT",        value: "1 per game",     detail: "3 submissions total to play all games." },
  { label: "SEASON",        value: "S3 · CUP",       detail: "Top 8 by ELO enter the $48k bracket." },
];

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const COPY_PROMPTS: Record<Game, string> = {
  chess: `You are writing a Chess AI agent for Agent Battler — a competitive AI gaming platform.

INTERFACE (required):
export default function act(state) {
  // return a UCI move string e.g. "e2e4"
}

STATE OBJECT:
{
  board: string,        // FEN string of current position
  toMove: "w" | "b",   // whose turn
  moves: string[],      // all legal UCI moves e.g. ["e2e4", "d2d4", ...]
  history: string[],    // previous moves played
  moveNumber: number,   // current move number
}

RULES:
- Must return exactly one string from state.moves
- 50kb max (minified). No imports, no require(), no fetch
- Must respond in under 200ms
- If you return an illegal move or throw, you forfeit the turn

Write a Chess agent. Be creative with the strategy. Return only the code.`,

  go19: `You are writing a Go 19×19 AI agent for Agent Battler — a competitive AI gaming platform.

INTERFACE (required):
export default function act(state) {
  // return [x, y] coordinates or "pass"
}

STATE OBJECT:
{
  board: number[][],    // 19x19 grid. 0=empty, 1=black, 2=white
  toMove: 1 | 2,        // 1=black, 2=white
  moves: (number[]|"pass")[],  // legal moves as [x,y] pairs or "pass"
  ko: number[] | null,  // ko point if any
  history: any[],       // previous moves
  moveNumber: number,
}

RULES:
- Return a [x, y] pair from state.moves, or "pass"
- 50kb max (minified). No imports, no require(), no fetch
- Must respond in under 200ms
- Board coords: [0,0] = top-left, [18,18] = bottom-right

Write a Go agent. Be creative with territory/influence strategy. Return only the code.`,

  checkers: `You are writing a Checkers AI agent for Agent Battler — a competitive AI gaming platform.

INTERFACE (required):
export default function act(state) {
  // return a PDN move string e.g. "11-15" or "11x18"
}

STATE OBJECT:
{
  board: number[][],    // 8x8 grid. 0=empty, 1=red, 2=black, 3=red king, 4=black king
  toMove: 1 | 2,        // 1=red, 2=black
  moves: string[],      // legal PDN moves e.g. ["11-15", "11-16", "9x18"]
  history: string[],    // previous moves
  moveNumber: number,
}

RULES:
- Must return exactly one string from state.moves
- 50kb max (minified). No imports, no require(), no fetch
- Must respond in under 200ms
- Captures are mandatory when available (already filtered into moves)

Write a Checkers agent. Be creative with strategy. Return only the code.`,
};

const GAME_PLACEHOLDERS: Record<Game, string> = {
  chess: `export default function act(state) {
  const { board, toMove, moves } = state;
  // state.moves: array of legal UCI moves e.g. "e2e4"
  // return a move string
  return moves[Math.floor(Math.random() * moves.length)];
}`,
  go19: `export default function act(state) {
  const { board, toMove, moves, ko } = state;
  // state.moves: array of [x,y] coords or "pass"
  // board: 19x19 array, 0=empty 1=black 2=white
  return moves[Math.floor(Math.random() * moves.length)];
}`,
  checkers: `export default function act(state) {
  const { board, toMove, moves } = state;
  // state.moves: array of PDN move strings e.g. "11-15"
  return moves[Math.floor(Math.random() * moves.length)];
}`,
};

export default function SubmitPage() {
  const me = useQuery(api.queries.currentUser);
  const submissions = useQuery(api.queries.allSubmissions) ?? [];
  const submitAgent = useMutation(api.mutations.submitAgent);

  const [game, setGame] = useState<Game>("chess");
  const [handle, setHandle] = useState("");
  const [glyph, setGlyph] = useState("◆");
  const [color, setColor] = useState("cyan");
  const [personality, setPersonality] = useState("");
  const [bio, setBio] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function copyPrompt() {
    navigator.clipboard.writeText(COPY_PROMPTS[game]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const sizeKb = parseFloat((new TextEncoder().encode(code).length / 1024).toFixed(2));
  const sizeOver = sizeKb > 50;

  // Track which games this handle has already submitted
  const handleLower = handle.trim().toLowerCase();
  const mySubmissions = handleLower
    ? submissions.filter(s => s.handle.toLowerCase() === handleLower)
    : [];
  const submittedGames = new Set(mySubmissions.map(s => s.game));
  const alreadySubmitted = submittedGames.has(game);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sizeOver || alreadySubmitted) return;
    setStatus("submitting");
    setError("");
    try {
      await submitAgent({ handle: handle.trim(), game, glyph, color, personality: personality.trim(), bio: bio.trim(), code });
      setStatus("success");
      setCode("");
    } catch (err: any) {
      setStatus("error");
      setError(err.message ?? "Submission failed");
    }
  }

  const currentGame = GAMES.find(g => g.id === game)!;

  return (
    <div style={{ padding: "20px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ fontSize: 11, color: "var(--ink-300)", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
        <Link href="/">LOBBY</Link>
        <span style={{ margin: "0 8px", color: "var(--ink-400)" }}>/</span>
        <span style={{ color: "var(--phos-cyan)" }}>SUBMIT AGENT</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="t-display" style={{ fontSize: 32 }}>SUBMIT AGENT <span style={{ color: "var(--phos-cyan)" }}>· S3</span></div>
        <div className="t-label" style={{ marginTop: 4 }}>VIBE CODE CUP · ONE SUBMISSION PER GAME · 3 GAMES TOTAL · $48,000 PRIZE POOL</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Rules */}
          <Panel label="◇ COMPETITION RULES">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
              {RULES.map((r, i) => (
                <div key={i} style={{
                  padding: "14px 18px",
                  borderRight: i % 3 < 2 ? "1px solid var(--line)" : "none",
                  borderBottom: i < 3 ? "1px solid var(--line)" : "none",
                }}>
                  <div className="t-label" style={{ fontSize: 9, color: "var(--ink-400)" }}>{r.label}</div>
                  <div className="t-mono" style={{ fontSize: 13, color: "var(--phos-cyan)", marginTop: 3 }}>{r.value}</div>
                  <div style={{ fontSize: 10, color: "var(--ink-300)", marginTop: 4, fontFamily: "var(--font-mono)" }}>{r.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Form */}
          <Panel label="◆ AGENT SUBMISSION FORM">
            {!me && (
              <div style={{ padding: "20px 24px", border: "1px solid var(--phos-amber)", margin: 20, color: "var(--phos-amber)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                ⚠ You must be signed in to submit an agent. Use the SIGN IN / REGISTER button in the top nav.
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Game selector */}
              <div>
                <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 8 }}>
                  GAME <span style={{ color: "var(--phos-red)" }}>*</span>
                  <span style={{ color: "var(--ink-400)", marginLeft: 8 }}>· one submission per game</span>
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {GAMES.map(g => {
                    const done = submittedGames.has(g.id);
                    const active = game === g.id;
                    return (
                      <button
                        type="button" key={g.id}
                        onClick={() => { setGame(g.id); setStatus("idle"); setError(""); }}
                        style={{
                          flex: 1, padding: "14px 12px", cursor: "pointer",
                          border: `1px solid ${active ? "var(--phos-cyan)" : done ? "var(--phos-green)" : "var(--line)"}`,
                          background: active ? "rgba(95,240,230,0.08)" : done ? "rgba(107,240,131,0.06)" : "var(--bg-void)",
                          boxShadow: active ? "0 0 14px rgba(95,240,230,0.15)" : "none",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 22, color: active ? "var(--phos-cyan)" : done ? "var(--phos-green)" : "var(--ink-300)" }}>{g.glyph}</span>
                        <span className="t-label" style={{ fontSize: 10, color: active ? "var(--phos-cyan)" : done ? "var(--phos-green)" : "var(--ink-300)" }}>{g.label}</span>
                        <span className="t-label" style={{ fontSize: 9, color: "var(--ink-400)" }}>{g.notation}</span>
                        {done && <Pill color="green">SUBMITTED</Pill>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Handle + Author */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 6 }}>HANDLE <span style={{ color: "var(--phos-red)" }}>*</span></label>
                  <input
                    value={handle} onChange={e => { setHandle(e.target.value); setStatus("idle"); }}
                    required placeholder="e.g. glorp-9"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 6 }}>AUTHOR</label>
                  <div style={{ ...inputStyle, color: "var(--ink-400)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--phos-green)", flexShrink: 0 }} />
                    {(me as any)?.name ?? (me as any)?.email?.split("@")[0] ?? "—"}
                  </div>
                </div>
              </div>

              {/* Handle progress — show which games submitted for this handle */}
              {handleLower && mySubmissions.length > 0 && (
                <div style={{ padding: "10px 14px", border: "1px solid var(--line)", background: "var(--bg-void)" }}>
                  <div className="t-label" style={{ fontSize: 9, marginBottom: 8 }}>PROGRESS FOR {handle.trim()}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {GAMES.map(g => {
                      const sub = mySubmissions.find(s => s.game === g.id);
                      return (
                        <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, padding: "6px 10px", border: `1px solid ${sub ? "var(--phos-green)" : "var(--line)"}`, background: sub ? "rgba(107,240,131,0.06)" : "transparent" }}>
                          <span style={{ fontSize: 14, color: sub ? "var(--phos-green)" : "var(--ink-400)" }}>{g.glyph}</span>
                          <div>
                            <div className="t-label" style={{ fontSize: 9, color: sub ? "var(--phos-green)" : "var(--ink-400)" }}>{g.short}</div>
                            {sub && <div style={{ fontSize: 9, color: "var(--ink-400)", fontFamily: "var(--font-mono)" }}>{sub.status.toUpperCase()}</div>}
                          </div>
                          {!sub && <span style={{ marginLeft: "auto", color: "var(--ink-500)", fontSize: 10 }}>—</span>}
                          {sub && <span style={{ marginLeft: "auto", color: "var(--phos-green)", fontSize: 12 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Glyph picker */}
              <div>
                <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 8 }}>GLYPH</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {GLYPHS.map(g => (
                    <button type="button" key={g} onClick={() => setGlyph(g)} style={{
                      width: 36, height: 36, fontSize: 18,
                      border: `1px solid ${glyph === g ? "var(--phos-cyan)" : "var(--line)"}`,
                      background: glyph === g ? "rgba(95,240,230,0.12)" : "var(--bg-void)",
                      color: glyph === g ? "var(--phos-cyan)" : "var(--ink-200)",
                      cursor: "pointer",
                      boxShadow: glyph === g ? "0 0 10px rgba(95,240,230,0.3)" : "none",
                    }}>{g}</button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 8 }}>COLOR</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setColor(c)} style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "6px 14px",
                      border: `1px solid ${color === c ? COLOR_CSS[c] : "var(--line)"}`,
                      background: "var(--bg-void)", cursor: "pointer",
                      boxShadow: color === c ? `0 0 10px ${COLOR_CSS[c]}55` : "none",
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: COLOR_CSS[c], boxShadow: `0 0 6px ${COLOR_CSS[c]}` }} />
                      <span className="t-label" style={{ color: color === c ? COLOR_CSS[c] : "var(--ink-300)" }}>{c.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality + Bio */}
              <div>
                <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 6 }}>PERSONALITY <span style={{ color: "var(--ink-400)" }}>· one line</span></label>
                <input value={personality} onChange={e => setPersonality(e.target.value)} placeholder="e.g. chaotic sacrificer" maxLength={60} style={inputStyle} />
              </div>
              <div>
                <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 6 }}>BIO <span style={{ color: "var(--ink-400)" }}>· shown on agent card</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="What makes this agent different? Keep it punchy." maxLength={200} rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
              </div>

              {/* Code area */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="t-label" style={{ fontSize: 9 }}>
                    SOURCE CODE <span style={{ color: "var(--phos-red)" }}>*</span>
                    <span style={{ color: "var(--ink-400)", marginLeft: 8 }}>· {currentGame.label} · {currentGame.notation}</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button type="button" onClick={copyPrompt} style={{
                      background: "transparent", border: "1px solid var(--line)",
                      color: copied ? "var(--phos-green)" : "var(--phos-cyan)",
                      fontFamily: "var(--font-mono)", fontSize: 10, padding: "3px 10px",
                      cursor: "pointer", letterSpacing: "0.08em",
                      boxShadow: copied ? "0 0 8px rgba(107,240,131,0.3)" : "none",
                    }}>
                      {copied ? "✓ COPIED" : "⟐ COPY PROMPT"}
                    </button>
                    <span className="t-mono" style={{ fontSize: 10, color: sizeOver ? "var(--phos-red)" : sizeKb > 40 ? "var(--phos-amber)" : "var(--ink-300)" }}>
                      {sizeKb}kb / 50kb
                    </span>
                  </div>
                </div>
                <textarea
                  value={code} onChange={e => setCode(e.target.value)} required
                  placeholder={GAME_PLACEHOLDERS[game]}
                  rows={16}
                  style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, resize: "vertical" }}
                />
                {sizeOver && <div style={{ marginTop: 6, fontSize: 10, color: "var(--phos-red)", fontFamily: "var(--font-mono)" }}>✕ Code exceeds 50kb limit</div>}
              </div>

              {/* Preview */}
              {handle && (
                <div style={{ padding: "14px 16px", border: "1px solid var(--line)", background: "var(--bg-void)" }}>
                  <div className="t-label" style={{ fontSize: 9, marginBottom: 10 }}>PREVIEW</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, border: `1px solid ${COLOR_CSS[color]}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, color: COLOR_CSS[color],
                      boxShadow: `0 0 14px ${COLOR_CSS[color]}44`,
                    }}>{glyph}</div>
                    <div>
                      <div className="t-display" style={{ fontSize: 18, color: COLOR_CSS[color] }}>{handle || "handle"}</div>
                      <div className="t-label" style={{ fontSize: 9, marginTop: 2 }}>{(me as any)?.name ?? (me as any)?.email?.split("@")[0] ?? "@author"} · {personality || "personality"} · <span style={{ color: "var(--phos-cyan)" }}>{currentGame.short}</span></div>
                      {bio && <div style={{ fontSize: 11, color: "var(--ink-300)", marginTop: 4, fontFamily: "var(--font-mono)", maxWidth: 480 }}>{bio}</div>}
                    </div>
                  </div>
                </div>
              )}

              {alreadySubmitted && (
                <div style={{ padding: "10px 14px", border: "1px solid var(--phos-amber)", color: "var(--phos-amber)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  ⚠ Already submitted a {currentGame.label} agent for <strong>{handle.trim()}</strong>. Switch to another game or use a different handle.
                </div>
              )}

              {status === "error" && (
                <div style={{ padding: "10px 14px", border: "1px solid var(--phos-red)", color: "var(--phos-red)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  ✕ {error}
                </div>
              )}

              {status === "success" && (
                <div style={{ padding: "10px 14px", border: "1px solid var(--phos-green)", color: "var(--phos-green)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  ✓ {currentGame.label.toUpperCase()} AGENT SUBMITTED · PENDING REVIEW
                  {submittedGames.size < 3 && (
                    <div style={{ marginTop: 6, color: "var(--ink-300)" }}>
                      {3 - submittedGames.size} more game{3 - submittedGames.size !== 1 ? "s" : ""} remaining — select another game above to continue.
                    </div>
                  )}
                  {submittedGames.size === 3 && (
                    <div style={{ marginTop: 6, color: "var(--phos-cyan)" }}>ALL 3 GAMES SUBMITTED ✓</div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting" || sizeOver || alreadySubmitted || !me}
                className="btn primary"
                style={{ alignSelf: "flex-start", padding: "10px 28px", fontSize: 12, opacity: (status === "submitting" || sizeOver || alreadySubmitted || !me) ? 0.5 : 1 }}
              >
                {status === "submitting" ? "SUBMITTING…" : `SUBMIT ${currentGame.short} AGENT →`}
              </button>
            </form>
          </Panel>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel label="◈ SEASON 3 STATUS">
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div className="t-label" style={{ fontSize: 9 }}>PRIZE POOL</div>
                <div className="t-display" style={{ fontSize: 28, color: "var(--phos-cyan)", textShadow: "var(--glow-cyan)" }}>$48,000</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { k: "AGENTS IN", v: "12" },
                  { k: "SLOTS LEFT", v: "4" },
                  { k: "ELO FLOOR", v: "2300" },
                  { k: "DEADLINE", v: "48:00:00" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "10px 12px", border: "1px solid var(--line)" }}>
                    <div className="t-label" style={{ fontSize: 9 }}>{s.k}</div>
                    <div className="t-num" style={{ fontSize: 18, color: "var(--ink-100)" }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "var(--ink-300)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
                Submit one agent per game. Approved agents start at ELO 2300 and play calibration matches before the bracket.
              </div>
            </div>
          </Panel>

          <Panel label="◼ RECENT SUBMISSIONS" right={<span className="t-label" style={{ fontSize: 9 }}>{submissions.length} TOTAL</span>}>
            {submissions.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--ink-400)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                NO SUBMISSIONS YET
              </div>
            ) : (
              <div>
                {submissions.slice(0, 12).map((s, i) => {
                  const statusColor = s.status === "approved" ? "green" : s.status === "rejected" ? "red" : "amber";
                  const gameInfo = GAMES.find(g => g.id === s.game);
                  return (
                    <div key={s._id} style={{
                      display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center",
                      padding: "10px 14px", borderBottom: i < Math.min(submissions.length, 12) - 1 ? "1px solid var(--line)" : "none",
                    }}>
                      <div style={{
                        width: 30, height: 30, border: `1px solid ${COLOR_CSS[s.color] ?? "var(--line)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, color: COLOR_CSS[s.color] ?? "var(--ink-200)", flexShrink: 0,
                      }}>{s.glyph}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.handle}</span>
                          <span className="t-label" style={{ fontSize: 9, color: "var(--phos-cyan)", flexShrink: 0 }}>{gameInfo?.short}</span>
                        </div>
                        <div style={{ fontSize: 9, color: "var(--ink-400)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.author} · {s.sizeKb}kb · {timeAgo(s.submittedAt)}</div>
                      </div>
                      <Pill color={statusColor}>{s.status.toUpperCase()}</Pill>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "var(--bg-void)", border: "1px solid var(--line)",
  color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 12,
  padding: "9px 12px", outline: "none",
};
