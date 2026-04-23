"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { AuthModal } from "./AuthModal";

const items = [
  { href: "/", label: "LOBBY", match: (p: string) => p === "/" },
  { href: "/leaderboard", label: "LEADERBOARD", match: (p: string) => p.startsWith("/leaderboard") },
  { href: "/match", label: "LIVE MATCH", match: (p: string) => p.startsWith("/match") },
  { href: "/agent", label: "AGENT", match: (p: string) => p.startsWith("/agent") },
  { href: "/bench", label: "BENCH", match: (p: string) => p.startsWith("/bench") },
];

export function TopNav() {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { signOut } = useAuthActions();
  const me = useQuery(api.queries.currentUser);
  const walletBalance = (me as any)?.balance ?? 0;
  const walletLabel = me
    ? `WALLET: $${walletBalance.toLocaleString()}`
    : "WALLET: LOGIN";

  return (
    <>
      <div className="nav-shell">
        <div className="nav-brand-row">
          <Link href="/" className="nav-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 0 6px var(--phos-cyan))" }}>
              <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="none" stroke="var(--phos-cyan)" strokeWidth="1.2" />
              <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" fill="none" stroke="var(--phos-cyan)" strokeWidth="1" opacity="0.6" />
              <circle cx="12" cy="12" r="2" fill="var(--phos-cyan)" />
            </svg>
            <div className="nav-brand-copy">
              <div className="t-display nav-brand-title">
                AGENT<span style={{ color: "var(--phos-cyan)" }}>⟡</span>BATTLER
              </div>
              <div className="t-label" style={{ fontSize: 8, marginTop: -2 }}>VIBE CODE CUP · S3</div>
            </div>
          </Link>

          <div className="nav-divider" />

          <nav className="nav-items" aria-label="Primary navigation">
            {items.map(i => {
              const active = i.match(pathname || "/");
              return (
                <Link key={i.href} href={i.href} className="nav-link" style={{
                  color: active ? "var(--phos-cyan)" : "var(--ink-300)",
                  border: "none",
                  borderBottom: `2px solid ${active ? "var(--phos-cyan)" : "transparent"}`,
                  background: "transparent",
                  boxShadow: "none",
                  textShadow: active ? "0 0 8px var(--phos-cyan-glow)" : "none",
                }}>{i.label}</Link>
              );
            })}
          </nav>
        </div>

        <div className="nav-status-row">
          <Link href="/match" className="nav-link nav-arena-cta">
            ENTER ARENA
          </Link>

          {me ? (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowUserMenu(v => !v)}
                className="nav-wallet-indicator"
              >
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "var(--phos-green)",
                  boxShadow: "0 0 6px var(--phos-green)",
                }} />
                <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)" }}>
                  {(me as any).name ?? (me as any).email?.split("@")[0] ?? "ACCOUNT"}
                </span>
                <span className="t-label">
                  {walletLabel}
                </span>
              </button>
              {showUserMenu && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100,
                  background: "var(--bg-panel)", border: "1px solid var(--line)",
                  minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}>
                  <Link href="/account" onClick={() => setShowUserMenu(false)} style={{
                    display: "block", padding: "10px 16px", fontSize: 11,
                    fontFamily: "var(--font-mono)", color: "var(--ink-200)",
                    borderBottom: "1px solid var(--line)",
                  }}>◈ MY ACCOUNT</Link>
                  <Link href="/bets" onClick={() => setShowUserMenu(false)} style={{
                    display: "block", padding: "10px 16px", fontSize: 11,
                    fontFamily: "var(--font-mono)", color: "var(--ink-200)",
                    borderBottom: "1px solid var(--line)",
                  }}>◆ MY BETS</Link>
                  <button onClick={() => { signOut(); setShowUserMenu(false); }} style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "10px 16px", fontSize: 11,
                    fontFamily: "var(--font-mono)", color: "var(--phos-red)",
                    background: "transparent", border: "none", cursor: "pointer",
                  }}>⟐ SIGN OUT</button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="nav-wallet-indicator"
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--phos-amber)",
                boxShadow: "0 0 6px var(--phos-amber)",
              }} />
              <span className="t-label">{walletLabel}</span>
            </button>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
