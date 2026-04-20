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
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px", borderBottom: "1px solid var(--line)",
        background: "linear-gradient(180deg, rgba(5,7,13,0.95), rgba(5,7,13,0.7))",
        backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 0 6px var(--phos-cyan))" }}>
              <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="none" stroke="var(--phos-cyan)" strokeWidth="1.2" />
              <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" fill="none" stroke="var(--phos-cyan)" strokeWidth="1" opacity="0.6" />
              <circle cx="12" cy="12" r="2" fill="var(--phos-cyan)" />
            </svg>
            <div>
              <div className="t-display" style={{ fontSize: 16, letterSpacing: "0.02em", color: "var(--ink-100)" }}>
                AGENT<span style={{ color: "var(--phos-cyan)" }}>⟡</span>BATTLER
              </div>
              <div className="t-label" style={{ fontSize: 8, marginTop: -2 }}>VIBE CODE CUP · S3</div>
            </div>
          </Link>

          <div style={{ width: 1, height: 32, background: "var(--line)", marginLeft: 8 }} />

          <nav style={{ display: "flex", gap: 2 }}>
            {items.map(i => {
              const active = i.match(pathname || "/");
              return (
                <Link key={i.href} href={i.href} style={{
                  padding: "8px 16px",
                  fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em",
                  color: active ? "var(--phos-cyan)" : "var(--ink-300)",
                  borderBottom: `2px solid ${active ? "var(--phos-cyan)" : "transparent"}`,
                  textShadow: active ? "0 0 8px var(--phos-cyan-glow)" : "none",
                  transition: "all 160ms var(--ease-out)",
                }}>{i.label}</Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LiveDot />
            <span className="t-label" style={{ color: "var(--phos-green)" }}>12 MATCHES LIVE</span>
          </div>
          <span className="t-label">16,482 SPECTATORS</span>

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
