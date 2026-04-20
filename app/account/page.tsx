"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Panel, Pill } from "../../components/ui";

const DEPOSIT_AMOUNTS = [100, 500, 1000, 5000];

function fmt$(n: number) {
  return "$" + n.toLocaleString();
}

export default function AccountPage() {
  const me = useQuery(api.queries.currentUser);
  const bets = useQuery(api.queries.myBets) ?? [];
  const deposit = useMutation(api.mutations.deposit);

  const [customAmount, setCustomAmount] = useState("");
  const [depositStatus, setDepositStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [depositErr, setDepositErr] = useState("");

  if (me === undefined) return <div style={{ padding: 40, color: "var(--ink-300)" }}>LOADING…</div>;
  if (!me) return (
    <div style={{ padding: 60, textAlign: "center", fontFamily: "var(--font-mono)" }}>
      <div className="t-display" style={{ fontSize: 22, marginBottom: 12 }}>SIGN IN REQUIRED</div>
      <div style={{ color: "var(--ink-300)", fontSize: 12 }}>Use the SIGN IN button in the top nav to access your account.</div>
    </div>
  );

  const balance = (me as any).balance ?? 0;
  const openBets = bets.filter(b => b.status === "open");
  const wonBets = bets.filter(b => b.status === "won");
  const totalWagered = bets.reduce((s, b) => s + b.amount, 0);
  const totalWon = wonBets.reduce((s, b) => s + (b.payout ?? 0), 0);

  async function handleDeposit(amount: number) {
    setDepositStatus("loading");
    setDepositErr("");
    try {
      await deposit({ amount });
      setDepositStatus("ok");
      setCustomAmount("");
      setTimeout(() => setDepositStatus("idle"), 2000);
    } catch (err: any) {
      setDepositStatus("err");
      setDepositErr(err.message ?? "Deposit failed");
    }
  }

  return (
    <div style={{ padding: "20px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ fontSize: 11, color: "var(--ink-300)", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
        <Link href="/">LOBBY</Link>
        <span style={{ margin: "0 8px", color: "var(--ink-400)" }}>/</span>
        <span style={{ color: "var(--phos-cyan)" }}>MY ACCOUNT</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="t-display" style={{ fontSize: 28 }}>
          {(me as any).name ?? (me as any).email?.split("@")[0] ?? "ACCOUNT"}
        </div>
        <div className="t-label" style={{ marginTop: 4, color: "var(--ink-400)" }}>{(me as any).email}</div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { k: "WALLET BALANCE", v: fmt$(balance), c: "var(--phos-cyan)", glow: true },
          { k: "OPEN BETS", v: String(openBets.length), c: "var(--phos-amber)", glow: false },
          { k: "TOTAL WAGERED", v: fmt$(totalWagered), c: "var(--ink-100)", glow: false },
          { k: "TOTAL WON", v: fmt$(totalWon), c: "var(--phos-green)", glow: true },
        ].map((s, i) => (
          <div key={i} style={{ padding: "16px 20px", border: `1px solid ${s.glow ? s.c : "var(--line)"}`, boxShadow: s.glow ? `0 0 20px ${s.c}22` : "none" }}>
            <div className="t-label" style={{ fontSize: 9 }}>{s.k}</div>
            <div className="t-num" style={{ fontSize: 28, color: s.c, textShadow: s.glow ? `0 0 10px ${s.c}` : "none" }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20 }}>
        {/* Deposit */}
        <Panel label="◆ DEPOSIT FUNDS">
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="t-num" style={{ fontSize: 32, color: "var(--phos-cyan)", textShadow: "var(--glow-cyan)" }}>
              {fmt$(balance)}
            </div>
            <div className="t-label" style={{ fontSize: 9, marginTop: -8 }}>CURRENT BALANCE</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
              {DEPOSIT_AMOUNTS.map(amt => (
                <button key={amt} onClick={() => handleDeposit(amt)} disabled={depositStatus === "loading"} className="btn" style={{ padding: "10px", fontSize: 12, justifyContent: "center" }}>
                  +{fmt$(amt)}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={customAmount} onChange={e => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Custom amount…"
                style={{
                  flex: 1, background: "var(--bg-void)", border: "1px solid var(--line)",
                  color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 12,
                  padding: "9px 12px", outline: "none",
                }}
              />
              <button
                onClick={() => { const n = parseInt(customAmount); if (n > 0) handleDeposit(n); }}
                disabled={!customAmount || depositStatus === "loading"}
                className="btn primary" style={{ flexShrink: 0 }}
              >
                ADD
              </button>
            </div>

            {depositStatus === "ok" && (
              <div style={{ color: "var(--phos-green)", fontSize: 11, fontFamily: "var(--font-mono)" }}>✓ FUNDS ADDED</div>
            )}
            {depositStatus === "err" && (
              <div style={{ color: "var(--phos-red)", fontSize: 11, fontFamily: "var(--font-mono)" }}>✕ {depositErr}</div>
            )}

            <div style={{ marginTop: 8, padding: "10px 12px", border: "1px solid var(--line)", fontSize: 10, color: "var(--ink-400)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
              This is a demo platform. No real money is transacted. All balances are virtual for wagering on AI agent matches.
            </div>
          </div>
        </Panel>

        {/* Bet history */}
        <Panel label="◼ BET HISTORY" right={<span className="t-label" style={{ fontSize: 9 }}>{bets.length} TOTAL</span>}>
          {bets.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ink-400)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              NO BETS YET<br />
              <span style={{ fontSize: 10, marginTop: 6, display: "block" }}>Watch a live match to place your first bet.</span>
              <Link href="/" className="btn" style={{ marginTop: 14, display: "inline-flex" }}>GO TO LOBBY →</Link>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 80px 80px 80px", padding: "8px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-panel-2)" }}>
                {["STATUS", "MATCH", "SIDE", "AMOUNT", "ODDS", "PAYOUT"].map(h => (
                  <span key={h} className="t-label" style={{ fontSize: 9 }}>{h}</span>
                ))}
              </div>
              {bets.slice(0, 20).map((b, i) => {
                const sc = b.status === "won" ? "var(--phos-green)" : b.status === "lost" ? "var(--phos-red)" : b.status === "open" ? "var(--phos-amber)" : "var(--ink-400)";
                return (
                  <div key={b._id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 80px 80px 80px", padding: "10px 16px", borderBottom: i < bets.length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}>
                    <Pill color={b.status === "won" ? "green" : b.status === "lost" ? "red" : b.status === "open" ? "amber" : "gray"}>{b.status.toUpperCase()}</Pill>
                    <Link href={`/match/${b.matchSlug}`} className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)" }}>{b.matchSlug}</Link>
                    <span className="t-label" style={{ fontSize: 10, color: "var(--phos-cyan)" }}>{b.side.toUpperCase()}</span>
                    <span className="t-num" style={{ fontSize: 11 }}>{fmt$(b.amount)}</span>
                    <span className="t-num" style={{ fontSize: 11, color: "var(--ink-300)" }}>{b.odds.toFixed(2)}x</span>
                    <span className="t-num" style={{ fontSize: 11, color: sc }}>{b.payout != null ? fmt$(b.payout) : "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
