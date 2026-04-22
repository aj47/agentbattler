"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ConvexArtifactLink({ staticRunId }: { staticRunId: string }) {
  const run = useQuery(api.benchmarks.latestBenchmarkRun);

  if (run === undefined) {
    return <span className="btn" style={{ opacity: 0.65 }}>CHECKING CONVEX…</span>;
  }

  if (!run?.artifactUrl) {
    return <span className="btn" style={{ opacity: 0.65 }}>CONVEX ARTIFACT PENDING</span>;
  }

  const label = run.runId === staticRunId ? "OPEN PERMANENT ARTIFACT" : "OPEN LATEST CONVEX ARTIFACT";

  return (
    <a className="btn primary" href={run.artifactUrl} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}