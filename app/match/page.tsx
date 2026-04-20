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

  if (featured === undefined) return <div className="page-shell">LOADING…</div>;
  if (featured === null) return <div className="page-shell">No featured match. Seed the DB.</div>;
  return <div className="page-shell">Redirecting to featured match…</div>;
}
