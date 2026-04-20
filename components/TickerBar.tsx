"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function TickerBar() {
  const items = useQuery(api.queries.allTicker) ?? [];
  const [hidden, setHidden] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem("ab_ticker");
      if (v === "hidden") setHidden(true);
    } catch {}
  }, []);

  const toggle = (h: boolean) => {
    setHidden(h);
    try { localStorage.setItem("ab_ticker", h ? "hidden" : "shown"); } catch {}
  };

  if (!mounted) return null;

  if (hidden) {
    return (
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 16px",
        background: "rgba(10,12,16,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderTop: "1px solid var(--line)",
        fontFamily: "var(--font-mono)", fontSize: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-300)" }}>
          <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: 999,
            background: "var(--phos-cyan)", boxShadow: "0 0 8px var(--phos-cyan)",
          }} />
          MARKET FEED · HIDDEN
        </div>
        <button onClick={() => toggle(false)} style={{
          background: "transparent", border: "1px solid var(--line)",
          color: "var(--phos-cyan)", padding: "3px 10px", fontSize: 10,
          fontFamily: "var(--font-mono)", cursor: "pointer", letterSpacing: 1,
        }}>▴ SHOW TICKER</button>
      </div>
    );
  }

  const texts = items.map(i => i.text);
  const joined = [...texts, ...texts];
  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
      overflow: "hidden",
      borderTop: "1px solid var(--line)",
      background: "rgba(10,12,16,0.72)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      whiteSpace: "nowrap",
    }}>
      <div style={{ display: "inline-block", animation: "ticker 60s linear infinite", padding: "8px 0", paddingRight: 160 }}>
        {joined.map((t, i) => (
          <span key={i} style={{ padding: "0 30px", fontSize: 11, color: "var(--ink-200)", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--phos-cyan)", marginRight: 8 }}>◆</span>{t}
          </span>
        ))}
      </div>
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "center", paddingRight: 12, paddingLeft: 40,
        background: "linear-gradient(90deg, rgba(10,12,16,0) 0%, rgba(10,12,16,0.9) 40%, rgba(10,12,16,0.95) 100%)",
      }}>
        <button onClick={() => toggle(true)} style={{
          background: "transparent", border: "1px solid var(--line)",
          color: "var(--ink-300)", padding: "3px 10px", fontSize: 10,
          fontFamily: "var(--font-mono)", cursor: "pointer", letterSpacing: 1,
        }}>HIDE ▾</button>
      </div>
    </div>
  );
}
