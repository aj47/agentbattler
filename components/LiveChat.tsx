"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "../lib/types";

export function LiveChat({ messages, emojis }: { messages: ChatMessage[]; emojis: string[] }) {
  const [msgs, setMsgs] = useState<ChatMessage[]>(messages);

  useEffect(() => { setMsgs(messages); }, [messages]);

  useEffect(() => {
    const chatters = ["tenuki_dad","ko_threat","dame_haver","stone_enjoyer","byoyomi","fusekifan","sgf_master","ladder_king","eye_shape","atari_bot"];
    const lines = [
      "what a shape","that's a ladder breaker","agent thinking for 0.8s = eternity",
      "CODE SMELL. beautiful.","knight.gpt would have taken that","not the hane omg",
      "influence > territory change my mind","is 48kb even fair","12.8kb of pure violence",
      "W down 11 points","tenuki city","double hane DEEP","AI moves hit different",
    ];
    const id = setInterval(() => {
      const newMsg: ChatMessage = {
        user: chatters[Math.floor(Math.random() * chatters.length)],
        tier: Math.random() > 0.85 ? "vip" : Math.random() > 0.7 ? "sub" : "",
        msg: lines[Math.floor(Math.random() * lines.length)],
        time: "now",
      };
      setMsgs(prev => [newMsg, ...prev].slice(0, 60));
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const tierColor = (t: string) =>
    t === "mod" ? "var(--phos-green)" :
    t === "vip" ? "var(--phos-magenta)" :
    t === "sub" ? "var(--phos-amber)" : "var(--ink-300)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column-reverse", gap: 6 }}>
        {msgs.map((m, i) => (
          <div key={`${i}-${m.user}-${m.msg}`} style={{ fontSize: 12, lineHeight: 1.4, animation: i === 0 ? "chatFadeIn 300ms var(--ease-out)" : "none" }}>
            <span style={{ color: tierColor(m.tier), fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {m.tier === "mod" && <span style={{ marginRight: 3 }}>⚔</span>}
              {m.tier === "vip" && <span style={{ marginRight: 3 }}>◆</span>}
              {m.user}:
            </span>
            <span style={{ color: "var(--ink-100)", marginLeft: 6 }}>{m.msg}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-panel)" }}>
        <span className="t-label" style={{ fontSize: 9 }}>SEND</span>
        <div style={{ flex: 1, padding: "4px 8px", background: "var(--bg-void)", border: "1px solid var(--line)", fontSize: 11, color: "var(--ink-400)" }}>_</div>
        <span style={{ display: "flex", gap: 4 }}>
          {emojis.slice(0, 5).map((e, i) => (
            <button key={i} style={{ padding: "2px 6px", fontSize: 14, border: "1px solid var(--line)", background: "var(--bg-panel-2)" }}>{e}</button>
          ))}
        </span>
      </div>
    </div>
  );
}
