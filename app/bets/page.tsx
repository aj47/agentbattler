"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Panel, Pill } from "../../components/ui";

function fmt$(n: number) {
  return "$" + n.toLocaleString();
}

export default function BetsPage() {
  const me = useQuery(api.queries.currentUser);
  const bets = useQuery(api.queries.myBets) ?? [];

  if (me === undefined) return <div style={{ padding: 40, color: "var(--ink-300)" }}>LOADING…</div>;
  if (!me) return (
    <div style={{ padding: 60, textAlign: "center", fontFamily: "var(--font-mono)" }}>
      <div className="t-display" style={{ fontSize: 22, marginBottom: 12 }}>SIGN IN REQUIRED</div>
      <div style={{ color: "var(--ink-300)", fontSize: 12 }}>Use the SIGN IN button in the top nav to access your bets.</div>
    </div>
  );

  const open = bets.filter(b => b.status === "open");
  const settled = bets.filter(b => b.status !== "open");
  const totalWagered = bets.reduce((s, b) => s + b.amount, 0);
  const totalWon = bets.filter(b => b.status === "won").reduce((s, b) => s + (b.payout ?? 0), 0);
  const totalLost = bets.filter(b => b.status === "lost").reduce((s, b) => s + b.amount, 0);
  const net = totalWon - totalLost;

  return (
    <div style={{ padding: "20px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ fontSize: 11, color: "var(--ink-300)", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
        <Link href="/">LOBBY</Link>
        <span style={{ margin: "0 8px", color: "var(--ink-400)" }}>/</span>
        <Link href="/account">ACCOUNT</Link>
        <span style={{ margin: "0 8px", color: "var(--ink-400)" }}>/</span>
        <span style={{ color: "var(--phos-cyan)" }}>MY BETS</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="t-display" style={{ fontSize: 28 }}>MY BETS</div>
        <div className="t-label" style={{ marginTop: 4 }}>{bets.length} TOTAL · {open.length} OPEN</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { k: "OPEN BETS",      v: String(open.length),    c: "var(--phos-amber)", glow: false },
          { k: "TOTAL WAGERED",  v: fmt$(totalWagered),     c: "var(--ink-100)",    glow: false },
          { k: "TOTAL WON",      v: fmt$(totalWon),         c: "var(--phos-green)", glow: totalWon > 0 },
          { k: "NET P&L",        v: (net >= 0 ? "+" : "") + fmt$(net), c: net >= 0 ? "var(--phos-green)" : "var(--phos-red)", glow: net !== 0 },
        ].map((s, i) => (
          <div key={i} style={{ padding: "16px 20px", border: `1px solid ${s.glow ? s.c : "var(--line)"}`, boxShadow: s.glow ? `0 0 20px ${s.c}22` : "none" }}>
            <div className="t-label" style={{ fontSize: 9 }}>{s.k}</div>
            <div className="t-num" style={{ fontSize: 26, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {open.length > 0 && (
        <Panel label="◉ OPEN BETS" style={{ marginBottom: 16 }}>
          <BetTable bets={open} />
        </Panel>
      )}

      <Panel label="◼ SETTLED BETS" right={<span className="t-label" style={{ fontSize: 9 }}>{settled.length} TOTAL</span>}>
        {settled.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ink-400)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
            NO SETTLED BETS YET
            <br />
            <Link href="/" className="btn" style={{ marginTop: 14, display: "inline-flex" }}>WATCH LIVE MATCHES →</Link>
          </div>
        ) : (
          <BetTable bets={settled} />
        )}
      </Panel>
    </div>
  );
}

function BetTable({ bets }: { bets: any[] }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 60px 90px 70px 90px 90px", padding: "8px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-panel-2)" }}>
        {["STATUS", "MATCH", "SIDE", "AMOUNT", "ODDS", "PAYOUT", "DATE"].map(h => (
          <span key={h} className="t-label" style={{ fontSize: 9 }}>{h}</span>
        ))}
      </div>
      {bets.map((b, i) => {
        const sc = b.status === "won" ? "var(--phos-green)" : b.status === "lost" ? "var(--phos-red)" : "var(--phos-amber)";
        const date = new Date(b.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        return (
          <div key={b._id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 60px 90px 70px 90px 90px", padding: "10px 16px", borderBottom: i < bets.length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}>
            <Pill color={b.status === "won" ? "green" : b.status === "lost" ? "red" : "amber"}>{b.status.toUpperCase()}</Pill>
            <Link href={`/match/${b.matchSlug}`} className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)" }}>{b.matchSlug}</Link>
            <span className="t-label" style={{ fontSize: 10, color: "var(--phos-cyan)" }}>{b.side.toUpperCase()}</span>
            <span className="t-num" style={{ fontSize: 11 }}>${b.amount.toLocaleString()}</span>
            <span className="t-num" style={{ fontSize: 11, color: "var(--ink-300)" }}>{b.odds.toFixed(2)}x</span>
            <span className="t-num" style={{ fontSize: 11, color: sc }}>{b.payout != null ? "$" + b.payout.toLocaleString() : "—"}</span>
            <span className="t-label" style={{ fontSize: 9 }}>{date}</span>
          </div>
        );
      })}
    </div>
  );
}
