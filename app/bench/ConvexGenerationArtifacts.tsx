"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Pill } from "../../components/ui";

export function ConvexGenerationArtifacts() {
  const runs = useQuery(api.benchmarks.recentGenerationRuns, { limit: 6 });

  if (runs === undefined) {
    return <div className="t-mono" style={emptyStyle}>Loading public generation artifacts…</div>;
  }

  if (runs.length === 0) {
    return <div className="t-mono" style={emptyStyle}>No public generation artifacts have been uploaded yet.</div>;
  }

  return (
    <div className="table-scroll">
      <div style={{ minWidth: 860 }}>
        <div style={gridStyle}>
          {["AGENT", "MODEL", "STATUS", "SOURCE", "RUN", "ARTIFACT"].map((h) => (
            <span key={h} className="t-label" style={{ fontSize: 8 }}>{h}</span>
          ))}
        </div>
        {runs.map((run) => (
          <div key={run.generationId} style={{ ...gridStyle, borderTop: "1px solid var(--line)" }}>
            <span className="t-mono" style={{ color: "var(--ink-100)", fontSize: 12 }}>{run.agentSlug}</span>
            <span className="t-num">{run.auggieModel}</span>
            <Pill color={run.status === "complete" ? "green" : run.status === "generated" ? "amber" : "red"}>{run.status}</Pill>
            <span className="t-num">{run.sourceSizeBytes ? `${(run.sourceSizeBytes / 1024).toFixed(1)}kb` : "—"}</span>
            <a className="btn" href={run.workflowUrl ?? "#"} target="_blank" rel="noreferrer">WORKFLOW</a>
            <a className="btn primary" href={run.artifactUrl ?? "#"} target="_blank" rel="noreferrer">DOWNLOAD</a>
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyStyle = { padding: 16, borderTop: "1px solid var(--line)", color: "var(--ink-300)" };
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) 110px 110px 90px 110px 120px",
  gap: 12,
  padding: "12px 16px",
  alignItems: "center",
};