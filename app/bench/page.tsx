import Link from "next/link";
import type { ReactNode } from "react";
import latest from "../../bench/results/latest.json";
import { Panel, Pill } from "../../components/ui";

type MatchLog = {
  gameId: string;
  white: string;
  black: string;
  result: string;
  reason: string;
  plies: number;
};

type BenchData = Omit<typeof latest, "matchLogs"> & { matchLogs: MatchLog[] };
const bench = latest as BenchData;

type BenchRow = (typeof bench.leaderboard)[number];

function statusColor(status: string) {
  if (status === "verified" || status === "complete") return "green";
  if (status === "failed" || status === "disqualified") return "red";
  if (status === "reference") return "amber";
  return "gray";
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)}kb`;
}

function formatMs(ms: number | null) {
  return ms === null ? "—" : `${Math.round(ms)}ms`;
}

function ExternalLink({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) return <span className="t-label" style={{ color: "var(--ink-400)" }}>UNAVAILABLE</span>;
  return <a className="btn" href={href} target="_blank" rel="noreferrer">{children}</a>;
}

function StatCard({ label, value, accent = "cyan" }: { label: string; value: string | number; accent?: string }) {
  return (
    <Panel style={{ padding: "14px 16px", minWidth: 0 }}>
      <div className="t-label" style={{ fontSize: 9 }}>{label}</div>
      <div className="t-display" style={{ marginTop: 6, fontSize: 28, color: `var(--phos-${accent})` }}>
        {value}
      </div>
    </Panel>
  );
}

function LeaderboardRow({ row }: { row: BenchRow }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "48px minmax(220px, 1.3fr) minmax(150px, 0.9fr) repeat(5, minmax(86px, auto))",
      gap: 12,
      alignItems: "center",
      padding: "13px 16px",
      borderTop: "1px solid var(--line)",
      minWidth: 920,
    }}>
      <div className="t-num" style={{ color: "var(--phos-cyan)", fontSize: 16 }}>#{row.rank}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="t-mono" style={{ color: "var(--ink-100)", fontWeight: 700 }}>{row.displayName}</span>
          <Pill color={statusColor(row.status)}>{row.status}</Pill>
        </div>
        <div className="t-label" style={{ marginTop: 4, fontSize: 9 }}>{row.agentPath}</div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="t-mono" style={{ color: "var(--ink-100)", fontSize: 12 }}>{row.modelName}</div>
        <div className="t-label" style={{ marginTop: 3, fontSize: 9 }}>{row.modelProvider} · {row.harnessName}</div>
      </div>
      <div className="t-num" style={{ color: "var(--phos-amber)", fontSize: 18 }}>{row.rating}</div>
      <div className="t-num">{row.wins}-{row.draws}-{row.losses}</div>
      <div className="t-num">{row.timeouts}/{row.illegalOutputs}</div>
      <div className="t-num">{formatMs(row.avgMoveMs)}</div>
      <div className="t-num">{formatBytes(row.agentSizeBytes)}</div>
    </div>
  );
}

export default function BenchPage() {
  const generatedAt = new Date(bench.generatedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <main className="page-shell" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <section style={{ display: "grid", gap: 18, marginBottom: 24 }}>
        <div>
          <div className="t-label" style={{ color: "var(--phos-cyan)", marginBottom: 8 }}>
            MODEL × HARNESS CHESS BENCH
          </div>
          <h1 className="t-display" style={{ fontSize: "clamp(40px, 8vw, 76px)", lineHeight: 0.95, margin: 0 }}>
            VERIFIED AGENT RATINGS
          </h1>
          <p className="t-mono" style={{ color: "var(--ink-300)", maxWidth: 860, marginTop: 14, lineHeight: 1.7 }}>
            Static MVP leaderboard for GitHub Actions benchmark runs. Agents are single-file JS chess bots
            under 50kb, using simplified FEN stdin and UCI stdout with a 5s move budget.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <StatCard label="VERIFIED AGENTS" value={bench.summary.verifiedAgents} />
          <StatCard label="REFERENCE AGENTS" value={bench.summary.referenceAgents} accent="amber" />
          <StatCard label="GAMES PLAYED" value={bench.summary.gamesPlayed} accent="green" />
          <StatCard label="MOVE BUDGET" value={`${bench.benchmark.turnBudgetMs / 1000}s`} accent="violet" />
        </div>
      </section>

      <Panel label="◈ BENCHMARK STATUS" right={<Pill color={statusColor(bench.status)}>{bench.status}</Pill>} style={{ marginBottom: 20 }}>
        <div style={{ padding: "16px 18px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span className="t-label">RUN <span className="t-num" style={{ color: "var(--ink-100)" }}>{bench.runId}</span></span>
          <span className="t-label">UPDATED <span className="t-num" style={{ color: "var(--ink-100)" }}>{generatedAt}</span></span>
          <span className="t-label">FORMAT <span className="t-num" style={{ color: "var(--ink-100)" }}>{bench.benchmark.format}</span></span>
          <span className="t-label">SCORING <span className="t-num" style={{ color: "var(--ink-100)" }}>{bench.benchmark.scoring}</span></span>
          <span className="t-label">DETAIL JSON <span className="t-num" style={{ color: "var(--ink-100)" }}>{bench.provenance.runDetailPath}</span></span>
          {bench.provenance.artifactName && (
            <span className="t-label">ARTIFACT <span className="t-num" style={{ color: "var(--ink-100)" }}>{bench.provenance.artifactName}</span></span>
          )}
        </div>
      </Panel>

      <Panel label="◬ PROVENANCE" right={<span className="t-label">GITHUB ACTIONS · AUDIT TRAIL</span>} style={{ marginBottom: 20 }}>
        <div style={{ padding: "16px 18px", display: "grid", gap: 14 }}>
          <p className="t-mono" style={{ color: "var(--ink-300)", lineHeight: 1.7, margin: 0 }}>
            Full per-move logs live in the run detail JSON and GitHub Actions artifact. Logs include
            FEN before/after, side to move, UCI output, runtime, stdout/stderr summaries, validations,
            source snapshots, and prompt artifacts when agents are generated by workflow.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ExternalLink href={bench.provenance.workflowUrl}>OPEN WORKFLOW RUN</ExternalLink>
            <ExternalLink href={bench.provenance.artifactUrl}>OPEN ARTIFACTS</ExternalLink>
          </div>
        </div>
      </Panel>

      <Panel label="▣ LEADERBOARD" right={<span className="t-label">STATIC JSON · MVP</span>}>
        <div className="table-scroll">
          <div style={{ minWidth: 920 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "48px minmax(220px, 1.3fr) minmax(150px, 0.9fr) repeat(5, minmax(86px, auto))",
              gap: 12,
              padding: "10px 16px",
            }}>
              {["RANK", "AGENT", "MODEL", "ELO", "W-D-L", "T/O · ILLEGAL", "AVG", "SIZE"].map(h => (
                <span key={h} className="t-label" style={{ fontSize: 8 }}>{h}</span>
              ))}
            </div>
            {bench.leaderboard.map(row => <LeaderboardRow key={row.agentSlug} row={row} />)}
          </div>
        </div>
      </Panel>

      <Panel label="▤ MATCH LOGS" right={<span className="t-label">FULL MOVES IN RUN JSON</span>} style={{ marginTop: 20 }}>
        <div className="table-scroll">
          <div style={{ minWidth: 760 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(260px, 1.3fr) repeat(5, minmax(90px, auto))",
              gap: 12,
              padding: "10px 16px",
            }}>
              {["GAME", "WHITE", "BLACK", "RESULT", "REASON", "PLIES"].map(h => (
                <span key={h} className="t-label" style={{ fontSize: 8 }}>{h}</span>
              ))}
            </div>
            {bench.matchLogs.length === 0 ? (
              <div className="t-mono" style={{ padding: "16px", borderTop: "1px solid var(--line)", color: "var(--ink-300)" }}>
                No match logs yet. Run a trusted benchmark with at least two agents to populate this table.
              </div>
            ) : bench.matchLogs.map(game => (
              <div key={game.gameId} style={{
                display: "grid",
                gridTemplateColumns: "minmax(260px, 1.3fr) repeat(5, minmax(90px, auto))",
                gap: 12,
                padding: "12px 16px",
                borderTop: "1px solid var(--line)",
                alignItems: "center",
              }}>
                <span className="t-mono" style={{ color: "var(--ink-100)", fontSize: 12 }}>{game.gameId}</span>
                <span className="t-num">{game.white}</span>
                <span className="t-num">{game.black}</span>
                <Pill color={game.result === "draw" ? "gray" : "green"}>{game.result}</Pill>
                <span className="t-num">{game.reason}</span>
                <span className="t-num">{game.plies}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="btn primary" href="/submit">SUBMIT AGENT →</Link>
        <Link className="btn" href="/">BACK TO LOBBY</Link>
      </div>
    </main>
  );
}