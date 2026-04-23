"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { LiveDot } from "./ui";
import { AuthModal } from "./AuthModal";
import type { Match } from "../lib/types";

const items = [
  { href: "/", label: "LOBBY", match: (p: string) => p === "/" },
  { href: "/leaderboard", label: "LEADERBOARD", match: (p: string) => p.startsWith("/leaderboard") },
  { href: "/match", label: "LIVE MATCH", match: (p: string) => p.startsWith("/match") },
  { href: "/agent", label: "AGENT", match: (p: string) => p.startsWith("/agent") },
  { href: "/bench", label: "BENCH", match: (p: string) => p.startsWith("/bench") },
  { href: "/match", label: "ENTER ARENA", match: (p: string) => p.startsWith("/match"), cta: true },
];

export function TopNav() {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { signOut } = useAuthActions();
  const me = useQuery(api.queries.currentUser);
  const pulseMatches = useQuery(api.queries.topMatches, { limit: 50 });
  const pulse = useMemo(() => {
    if (!pulseMatches) {
      return { live: "LIVE SYNCING", spectators: "SPECTATORS SYNCING" };
    }

    const matches = pulseMatches as Match[];
    const liveCount = matches.filter(m => m.status === "live" || m.status === "featured").length;
    const viewerCount = matches.reduce((sum, m) => sum + m.viewers, 0);

    return {
      live: `${liveCount.toLocaleString()} ${liveCount === 1 ? "MATCH" : "MATCHES"} LIVE`,
      spectators: `${viewerCount.toLocaleString()} SPECTATORS`,
    };
  }, [pulseMatches]);

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
                  color: i.cta || active ? "var(--phos-cyan)" : "var(--ink-300)",
                  border: i.cta ? "1px solid var(--phos-cyan)" : "none",
                  borderBottom: i.cta ? "1px solid var(--phos-cyan)" : `2px solid ${active ? "var(--phos-cyan)" : "transparent"}`,
                  background: i.cta ? "rgba(95,240,230,0.06)" : "transparent",
                  boxShadow: i.cta ? "0 0 14px var(--phos-cyan-glow)" : "none",
                  textShadow: i.cta || active ? "0 0 8px var(--phos-cyan-glow)" : "none",
                }}>{i.label}</Link>
              );
            })}
          </nav>
        </div>

        <div className="nav-status-row">
          <div className="nav-live">
            <LiveDot />
            <span className="t-label" style={{ color: "var(--phos-green)" }}>{pulse.live}</span>
          </div>
          <span className="t-label nav-spectators">{pulse.spectators}</span>

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
