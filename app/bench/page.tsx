import Link from "next/link";
import latest from "../../bench/results/latest.json";
import { Panel, Pill } from "../../components/ui";

type BenchRow = (typeof latest.leaderboard)[number];

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
  const generatedAt = new Date(latest.generatedAt).toLocaleString("en-US", {
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
          <StatCard label="VERIFIED AGENTS" value={latest.summary.verifiedAgents} />
          <StatCard label="REFERENCE AGENTS" value={latest.summary.referenceAgents} accent="amber" />
          <StatCard label="GAMES PLAYED" value={latest.summary.gamesPlayed} accent="green" />
          <StatCard label="MOVE BUDGET" value={`${latest.benchmark.turnBudgetMs / 1000}s`} accent="violet" />
        </div>
      </section>

      <Panel label="◈ BENCHMARK STATUS" right={<Pill color={statusColor(latest.status)}>{latest.status}</Pill>} style={{ marginBottom: 20 }}>
        <div style={{ padding: "16px 18px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span className="t-label">RUN <span className="t-num" style={{ color: "var(--ink-100)" }}>{latest.runId}</span></span>
          <span className="t-label">UPDATED <span className="t-num" style={{ color: "var(--ink-100)" }}>{generatedAt}</span></span>
          <span className="t-label">FORMAT <span className="t-num" style={{ color: "var(--ink-100)" }}>{latest.benchmark.format}</span></span>
          <span className="t-label">SCORING <span className="t-num" style={{ color: "var(--ink-100)" }}>{latest.benchmark.scoring}</span></span>
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
            {latest.leaderboard.map(row => <LeaderboardRow key={row.agentSlug} row={row} />)}
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