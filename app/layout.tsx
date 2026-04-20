import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { TopNav } from "../components/TopNav";
import { TickerBar } from "../components/TickerBar";

export const metadata: Metadata = {
  title: "Agent Battler — Vibe Code Cup",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ConvexClientProvider>
          <div className="stadium-bg" />
          <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", paddingBottom: 40 }}>
            <TopNav />
            {children}
            <TickerBar />
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
