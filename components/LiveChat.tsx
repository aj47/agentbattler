"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ChatMessage } from "../lib/types";

type LiveChatProps = {
  messages: ChatMessage[];
  emojis: string[];
  canSend?: boolean;
  currentUserName?: string | null;
  onSend?: (message: string) => Promise<void>;
};

export function LiveChat({ messages, emojis, canSend = false, currentUserName, onSend }: LiveChatProps) {
  const [simMsgs, setSimMsgs] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  useEffect(() => {
    const chatters = ["tenuki_dad","ko_threat","dame_haver","stone_enjoyer","byoyomi","fusekifan","sgf_master","ladder_king","eye_shape","atari_bot"];
    const lines = [
      "what a shape","that's a ladder breaker","agent thinking for 0.8s = eternity",
      "CODE SMELL. beautiful.","knight.gpt would have taken that","not the hane omg",
      "influence > territory change my mind","is 48kb even fair","12.8kb of pure violence",
      "W down 11 points","tenuki city","double hane DEEP","AI moves hit different",
      "that eval bar is doing parkour","somebody check the training data","opening book left the building",
      "this bot has main character energy","compiler warnings paid off","bro calculated the vibe",
      "that move was illegal in my heart","imagine debugging this at 3am","the tiny model is COOKING",
      "chat did you see that sacrifice","zero comments, maximum violence","actual galaxy brain sequence",
      "this is why I never bet against forks","agent heard us talking trash","cleanest endgame conversion all day",
      "the 50kb limit is psychological","someone clip move 42","that was not in the README",
      "pure minimax disrespect","the latency mindgames are real","I blinked and the corner died",
      "go board looks haunted now","checkers bot woke up angry","queen side in shambles",
      "rook_botto would never allow this","this matchup is cursed in a good way","I need the postmortem",
      "eval says fine but vibes say doomed","the comments section predicted this","that ko fight has lore",
      "watch the time bank vanish","this is a certified cup moment","agent diff showing",
      "somebody nerf that heuristic","that capture was personal","B is playing like it read the future",
      "W found the only move","not the panic ladder","this board state is modern art",
      "all gas no alpha-beta","the prune was aggressive","I respect the bad idea",
      "that was a spite move","the crowd emoji meta is undefeated","sub-50kb masterpiece incoming",
      "this line needs a documentary","quiet_storm living up to the name","glorp discourse starts now",
      "agent took the scenic route to mate","that sente hit different","please show the PV",
      "the bot is farming suspense","how is that still alive","territory math is witchcraft",
      "the joseki has been abandoned","tiny agent huge aura","that trade was all vibes",
      "who let the eval cook","this is either genius or cursed","the confidence is unearned but fun",
      "I would resign emotionally","that move has plot armor","the bracket scriptwriters cooked",
      "this is peak artificial stubbornness","not even Stockfish would explain that","someone run the diff",
      "the code golf demons are winning","W just walked into the boss room","B with the villain arc",
      "that tactic had receipts","I smell a comeback","the board got quieter somehow",
      "endgame tablebase? never heard of her","this bot plays like a forum argument","the best move was friendship",
      "absolutely feral search depth","that ladder works on vibes alone","I am learning nothing and loving it",
      "the opening trap had a sequel","human devs in shambles","move ordering was immaculate",
      "this agent read Sun Tzu","big fork energy","that cut was disrespectful",
      "territory swing just hit different","the match is writing fanfic","no way that was intentional",
      "the sacrifice economy is booming","AI sports are so back","this is why we need instant replay",
      "the bot is tempo farming","I can feel the recursion","that move passed CI somehow",
      "the endgame is getting crunchy","this seed is blessed","someone protect the corner group",
      "the line went from weird to winning","agent personality leaking through","I trust the glyph",
      "that was a fork with emotional damage",
    ];
    const id = setInterval(() => {
      const now = Date.now();
      const newMsg: ChatMessage = {
        user: chatters[Math.floor(Math.random() * chatters.length)],
        tier: Math.random() > 0.85 ? "vip" : Math.random() > 0.7 ? "sub" : "",
        msg: lines[Math.floor(Math.random() * lines.length)],
        time: "now",
        source: "seed",
        createdAt: now,
        order: -now,
      };
      setSimMsgs(prev => [newMsg, ...prev].slice(0, 30));
    }, 5200);
    return () => clearInterval(id);
  }, []);

  const msgs = useMemo(
    () => [...simMsgs, ...messages]
      .sort((a, b) => (a.order ?? -(a.createdAt ?? 0)) - (b.order ?? -(b.createdAt ?? 0)))
      .slice(0, 60),
    [messages, simMsgs],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canSend || !onSend) return;
    setStatus("sending");
    setError("");
    try {
      await onSend(text);
      setDraft("");
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
      setStatus("error");
    }
  }

  const tierColor = (t: string) =>
    t === "mod" ? "var(--phos-green)" :
    t === "vip" ? "var(--phos-magenta)" :
    t === "sub" ? "var(--phos-amber)" : "var(--ink-300)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column-reverse", gap: 6 }}>
        {msgs.map((m, i) => (
          <div key={`${m.createdAt ?? i}-${m.user}-${m.msg}`} style={{ fontSize: 12, lineHeight: 1.4, animation: i === 0 ? "chatFadeIn 300ms var(--ease-out)" : "none" }}>
            <span style={{ color: tierColor(m.tier), fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {m.tier === "mod" && <span style={{ marginRight: 3 }}>⚔</span>}
              {m.tier === "vip" && <span style={{ marginRight: 3 }}>◆</span>}
              {m.source === "human" && <span style={{ marginRight: 3 }}>◉</span>}
              {m.user}:
            </span>
            <span style={{ color: "var(--ink-100)", marginLeft: 6 }}>{m.msg}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--line)", background: "var(--bg-panel)", position: "relative" }}>
        {/* Emoji picker popup */}
        {emojiOpen && (
          <div style={{
            position: "absolute", bottom: "100%", right: 0,
            padding: "8px 10px", background: "var(--bg-panel)",
            border: "1px solid var(--line)", display: "flex", flexWrap: "wrap",
            gap: 4, width: 220, zIndex: 10,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
          }}>
            {emojis.map((e, i) => (
              <button
                key={i} type="button"
                disabled={!canSend}
                onClick={() => { setDraft(d => `${d}${e}`.slice(0, 180)); setEmojiOpen(false); }}
                style={{ padding: "3px 6px", fontSize: 16, border: "1px solid var(--line)", background: "var(--bg-void)", cursor: canSend ? "pointer" : "not-allowed", opacity: canSend ? 1 : 0.45, borderRadius: 2 }}
              >{e}</button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          {/* Emoji toggle */}
          <button
            type="button"
            onClick={() => setEmojiOpen(o => !o)}
            disabled={!canSend}
            style={{
              flexShrink: 0, padding: "5px 7px", fontSize: 14, lineHeight: 1,
              border: `1px solid ${emojiOpen ? "var(--phos-amber)" : "var(--line)"}`,
              background: emojiOpen ? "rgba(255,181,71,0.1)" : "var(--bg-void)",
              color: emojiOpen ? "var(--phos-amber)" : "var(--ink-300)",
              cursor: canSend ? "pointer" : "not-allowed", opacity: canSend ? 1 : 0.45,
              borderRadius: 2,
            }}
            title="Emojis"
          >😀</button>

          {/* Text input */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={draft}
              onChange={e => { setDraft(e.target.value.slice(0, 180)); setError(""); }}
              onFocus={() => setEmojiOpen(false)}
              disabled={!canSend || status === "sending"}
              placeholder={canSend ? `chat as ${currentUserName ?? "spectator"}…` : "sign in to chat"}
              maxLength={180}
              style={{ width: "100%", padding: "5px 8px", background: "var(--bg-void)", border: "1px solid var(--line)", fontSize: 11, color: "var(--ink-100)", fontFamily: "var(--font-mono)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Send */}
          <button
            type="submit"
            disabled={!canSend || !draft.trim() || status === "sending"}
            className="btn"
            style={{ flexShrink: 0, padding: "5px 10px", fontSize: 9, opacity: !canSend || !draft.trim() || status === "sending" ? 0.5 : 1 }}
          >
            {status === "sending" ? "…" : "SEND"}
          </button>
        </form>

        {error && <div style={{ padding: "0 10px 6px", color: "var(--phos-red)", fontSize: 9, fontFamily: "var(--font-mono)" }}>✕ {error}</div>}
      </div>
    </div>
  );
}
