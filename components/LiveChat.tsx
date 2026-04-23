"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { ChatMessage } from "../lib/types";

type LiveChatProps = {
  messages: ChatMessage[];
  emojis: string[];
  canSend?: boolean;
  currentUserName?: string | null;
  onSend?: (message: string) => Promise<void>;
};

const crowdFill: ChatMessage[] = [
  { user: "linewatcher", tier: "", msg: "public still leaning white after that last territory swing", time: "-3m", source: "seed", order: 1000 },
  { user: "queen_tax", tier: "vip", msg: "black side keeps overperforming closing spots tonight", time: "-3m", source: "seed", order: 1001 },
  { user: "sharp_action", tier: "sub", msg: "favorite money is real but dogs keep finding outs", time: "-4m", source: "seed", order: 1002 },
  { user: "tesuji_alert", tier: "", msg: "white shape just got cleaner on the right side", time: "-4m", source: "seed", order: 1003 },
  { user: "ladderpolice", tier: "", msg: "whoever called that snapback two moves ago was early", time: "-4m", source: "seed", order: 1004 },
  { user: "steamchaser", tier: "vip", msg: "books were slow to move this number and chat noticed", time: "-5m", source: "seed", order: 1005 },
  { user: "overfit_otto", tier: "", msg: "aggressive opener but the endgame eval still loves discipline", time: "-5m", source: "seed", order: 1006 },
  { user: "varianceking", tier: "sub", msg: "this is why people keep backing chaos bots late", time: "-5m", source: "seed", order: 1007 },
  { user: "bookhunter", tier: "", msg: "opening prep ended a while ago, now it is instincts only", time: "-6m", source: "seed", order: 1008 },
  { user: "sente_only", tier: "", msg: "crowd wants fireworks but the clean line is probably enough", time: "-6m", source: "seed", order: 1009 },
  { user: "betslip.exe", tier: "vip", msg: "if black stabilizes here the live ticket holders breathe again", time: "-6m", source: "seed", order: 1010 },
  { user: "territorytruther", tier: "", msg: "white still has the prettier board even if chat hates hearing it", time: "-7m", source: "seed", order: 1011 },
  { user: "middlegamefm", tier: "mod", msg: "volume is up because both agents still have winning routes", time: "-7m", source: "seed", order: 1012 },
  { user: "payoutpilot", tier: "sub", msg: "favorite backers are loud because the handle is stacked there", time: "-8m", source: "seed", order: 1013 },
  { user: "fork_theory", tier: "", msg: "queen side pressure keeps showing up in these agent pools", time: "-8m", source: "seed", order: 1014 },
  { user: "tapegrinder", tier: "", msg: "this matchup always gets weird once both bots leave opening lines", time: "-8m", source: "seed", order: 1015 },
  { user: "oddsprinter", tier: "vip", msg: "live number tightened fast after that sequence in the corner", time: "-9m", source: "seed", order: 1016 },
  { user: "bookburner", tier: "", msg: "sportsbooks hate when chat spots momentum before the model does", time: "-9m", source: "seed", order: 1017 },
  { user: "shapeenjoyer", tier: "", msg: "white influence looks expensive but black has cleaner cashouts", time: "-10m", source: "seed", order: 1018 },
  { user: "dogbettor", tier: "sub", msg: "underdog tickets still live if this fight stays tactical", time: "-10m", source: "seed", order: 1019 },
  { user: "eval_hawk", tier: "", msg: "one sharp exchange and the whole sentiment flips again", time: "-10m", source: "seed", order: 1020 },
  { user: "crowdmodel", tier: "", msg: "market keeps pricing confidence but the board still looks fragile", time: "-11m", source: "seed", order: 1021 },
  { user: "ladderfund", tier: "vip", msg: "chat chasing the favorite again while the board says be careful", time: "-11m", source: "seed", order: 1022 },
  { user: "gameworker", tier: "sub", msg: "feels like a calm position until one bot starts forcing fights", time: "-11m", source: "seed", order: 1023 },
  { user: "edgefinder", tier: "", msg: "if white cleans the center this spread starts looking wrong", time: "-12m", source: "seed", order: 1024 },
  { user: "paperhands", tier: "", msg: "nobody wants to admit the late game edge might belong to black", time: "-12m", source: "seed", order: 1025 },
  { user: "sweatindex", tier: "mod", msg: "chat velocity still says nobody trusts this lead", time: "-12m", source: "seed", order: 1026 },
  { user: "bankrollzen", tier: "", msg: "favorite money usually gets loud right before the board punishes it", time: "-13m", source: "seed", order: 1027 },
  { user: "linechef", tier: "vip", msg: "there is real appetite for volatility every time these two load in", time: "-13m", source: "seed", order: 1028 },
  { user: "sidelight", tier: "", msg: "black still looks one clean sequence away from stealing this", time: "-13m", source: "seed", order: 1029 },
  { user: "tempofiend", tier: "", msg: "pressure is building even if the board still looks deceptively quiet", time: "-14m", source: "seed", order: 1030 },
  { user: "chalkwatch", tier: "sub", msg: "public is paying for certainty here and I do not think it exists", time: "-14m", source: "seed", order: 1031 },
];

export function LiveChat({ messages, emojis, canSend = false, currentUserName, onSend }: LiveChatProps) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const msgs = useMemo(
    () => {
      const seeded = [...messages]
      .sort((a, b) => (a.order ?? -(a.createdAt ?? 0)) - (b.order ?? -(b.createdAt ?? 0)))
      .slice(0, 60);

      if (seeded.length >= 32) return seeded;
      return [...seeded, ...crowdFill.slice(0, 32 - seeded.length)];
    },
    [messages],
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
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {msgs.map((m, i) => (
          <div key={`${m.createdAt ?? m.order ?? i}-${m.user}-${m.msg}`} style={{ fontSize: 12, lineHeight: 1.4, animation: i === 0 ? "chatFadeIn 300ms var(--ease-out)" : "none", opacity: m.source === "seed" ? 0.92 : 1 }}>
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
