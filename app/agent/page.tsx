"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_AGENT_SLUG } from "../../lib/staticRoutes";

export default function AgentIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/agent/${DEFAULT_AGENT_SLUG}`);
  }, [router]);

  return <div className="page-shell">Redirecting to featured agent…</div>;
}
