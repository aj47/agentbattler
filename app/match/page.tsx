"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function MatchIndex() {
  const router = useRouter();
  const featured = useQuery(api.queries.featuredMatch);

  useEffect(() => {
    if (featured) router.replace(`/match/${featured.slug}`);
  }, [featured, router]);

  if (featured === undefined) return <div style={{ padding: 40 }}>LOADING…</div>;
  if (featured === null) return <div style={{ padding: 40 }}>No featured match. Seed the DB.</div>;
  return <div style={{ padding: 40 }}>Redirecting to featured match…</div>;
}
