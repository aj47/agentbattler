"use client";

import { redirect } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function MatchIndex() {
  const featured = useQuery(api.queries.featuredMatch);
  if (featured === undefined) return <div style={{ padding: 40 }}>LOADING…</div>;
  if (featured === null) return <div style={{ padding: 40 }}>No featured match. Seed the DB.</div>;
  redirect(`/match/${featured.slug}`);
}
