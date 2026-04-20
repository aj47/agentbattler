"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <div style={{ padding: 24, fontFamily: "monospace", color: "#ff5f6d" }}>
        NEXT_PUBLIC_CONVEX_URL is not set. Run <code>npx convex dev</code> once and copy the URL into <code>.env.local</code>.
      </div>
    );
  }
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
