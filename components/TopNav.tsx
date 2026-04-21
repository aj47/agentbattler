"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { LiveDot } from "./ui";
import { AuthModal } from "./AuthModal";

const items = [
  { href: "/", label: "LOBBY", match: (p: string) => p === "/" },
  { href: "/match", label: "LIVE MATCH", match: (p: string) => p.startsWith("/match") },
  { href: "/agent", label: "AGENT", match: (p: string) => p.startsWith("/agent") },
  { href: "/submit", label: "SUBMIT", match: (p: string) => p.startsWith("/submit") },
];

export function TopNav() {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { signOut } = useAuthActions();
  const me = useQuery(api.queries.currentUser);

  return (
    <>
      <div className="nav-shell">
        <div className="nav-brand-row">
          <Link href="/" className="nav-brand">
            <img src="/logo.svg" alt="AgentBattler" height="36" style={{ display: "block" }} />
          </Link>

          <div className="nav-divider" />

          <nav className="nav-items" aria-label="Primary navigation">
            {items.map(i => {
              const active = i.match(pathname || "/");
              return (
                <Link key={i.href} href={i.href} className="nav-link" style={{
                  color: active ? "var(--phos-cyan)" : "var(--ink-300)",
                  borderBottom: `2px solid ${active ? "var(--phos-cyan)" : "transparent"}`,
                  textShadow: active ? "0 0 8px var(--phos-cyan-glow)" : "none",
                }}>{i.label}</Link>
              );
            })}
          </nav>
        </div>

        <div className="nav-status-row">
          <div className="nav-live">
            <LiveDot />
            <span className="t-label" style={{ color: "var(--phos-green)" }}>12 MATCHES LIVE</span>
          </div>
          <span className="t-label nav-spectators">16,482 SPECTATORS</span>

          {me ? (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowUserMenu(v => !v)} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--bg-panel)", border: "1px solid var(--line)",
                padding: "6px 12px", cursor: "pointer",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--phos-green)", boxShadow: "0 0 6px var(--phos-green)" }} />
                <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-100)" }}>
                  {(me as any).name ?? (me as any).email?.split("@")[0] ?? "ACCOUNT"}
                </span>
                <span className="t-num" style={{ fontSize: 11, color: "var(--phos-cyan)" }}>
                  ${((me as any).balance ?? 0).toLocaleString()}
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
            <button onClick={() => setShowAuth(true)} className="btn primary">
              SIGN IN / REGISTER
            </button>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
