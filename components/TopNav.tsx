"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LiveDot } from "./ui";

const items = [
  { href: "/", label: "LOBBY", match: (p: string) => p === "/" },
  { href: "/match", label: "LIVE MATCH", match: (p: string) => p.startsWith("/match") },
  { href: "/bracket", label: "BRACKET", match: (p: string) => p.startsWith("/bracket") },
  { href: "/agent", label: "AGENT", match: (p: string) => p.startsWith("/agent") },
];

export function TopNav() {
  const pathname = usePathname();
  return (
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
        <button className="btn primary">◉ REC</button>
      </div>
    </div>
  );
}
