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

export function LiveChat({ messages, emojis, canSend = false, currentUserName, onSend }: LiveChatProps) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const msgs = useMemo(
    () => [...messages]
      .sort((a, b) => (a.order ?? -(a.createdAt ?? 0)) - (b.order ?? -(b.createdAt ?? 0)))
      .slice(0, 60),
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
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column-reverse", gap: 6 }}>
        {msgs.map((m, i) => (
          <div key={`${m.createdAt ?? i}-${m.user}-${m.msg}`} style={{ fontSize: 12, lineHeight: 1.4 }}>
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
