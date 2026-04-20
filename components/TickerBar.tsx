"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function TickerBar() {
  const items = useQuery(api.queries.allTicker) ?? [];
  const texts = items.map(i => i.text);
  const joined = [...texts, ...texts];
  return (
    <div style={{
      overflow: "hidden",
      borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
      background: "linear-gradient(90deg, rgba(95,240,230,0.05), transparent 50%, rgba(255,181,71,0.05))",
      whiteSpace: "nowrap", position: "relative",
    }}>
      <div style={{ display: "inline-block", animation: "ticker 60s linear infinite", padding: "8px 0" }}>
        {joined.map((t, i) => (
          <span key={i} style={{ padding: "0 30px", fontSize: 11, color: "var(--ink-200)", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--phos-cyan)", marginRight: 8 }}>◆</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}
