"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Panel, Pill } from "../../components/ui";
import type { Id } from "../../convex/_generated/dataModel";

const TOKEN_KEY = "agentbattler:adminToken";

type Status = "pending" | "approved" | "rejected";
type Filter = Status | "all";

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminPage() {
  const submissions = useQuery(api.queries.allSubmissions) ?? [];
  const approveAgent = useAction(api.engine.approveAgent);
  const rejectSubmission = useMutation(api.mutations.rejectSubmission);

  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [selectedId, setSelectedId] = useState<Id<"submissions"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (saved) setToken(saved);
  }, []);

  function saveToken() {
    const t = tokenInput.trim();
    if (!t) return;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setBanner(null);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setTokenInput("");
  }

  const filtered = submissions.filter(s => filter === "all" ? true : s.status === filter);
  const selected = submissions.find(s => s._id === selectedId) ?? null;
  const counts = {
    pending: submissions.filter(s => s.status === "pending").length,
    approved: submissions.filter(s => s.status === "approved").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
  };

  async function handleApprove(id: Id<"submissions">) {
    if (!token) { setBanner({ kind: "err", msg: "Enter admin token first" }); return; }
    setBusy(true);
    setBanner(null);
    try {
      const res = await approveAgent({ submissionId: id, adminToken: token });
      setBanner({ kind: "ok", msg: `Approved → ${res.slug} · smoke move ${res.smokeMove}` });
    } catch (err: any) {
      setBanner({ kind: "err", msg: err?.message ?? "Approval failed" });
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(id: Id<"submissions">) {
    if (!token) { setBanner({ kind: "err", msg: "Enter admin token first" }); return; }
    setBusy(true);
    setBanner(null);
    try {
      await rejectSubmission({ submissionId: id, adminToken: token });
      setBanner({ kind: "ok", msg: "Rejected" });
    } catch (err: any) {
      setBanner({ kind: "err", msg: err?.message ?? "Reject failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "20px 28px", maxWidth: 1600, margin: "0 auto" }}>
      <div style={{ fontSize: 11, color: "var(--ink-300)", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
        <Link href="/">LOBBY</Link>
        <span style={{ margin: "0 8px", color: "var(--ink-400)" }}>/</span>
        <span style={{ color: "var(--phos-cyan)" }}>ADMIN</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="t-display" style={{ fontSize: 28 }}>
          ADMIN <span style={{ color: "var(--phos-cyan)" }}>· SUBMISSION REVIEW</span>
        </div>
        <div className="t-label" style={{ marginTop: 4 }}>
          APPROVE RUNS SMOKE TEST · CHESS AGENTS ONLY · REQUIRES ADMIN TOKEN
        </div>
      </div>

      {/* Token setup */}
      {!token ? (
        <Panel label="⌬ ADMIN TOKEN REQUIRED">
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, maxWidth: 600 }}>
            <div style={{ fontSize: 11, color: "var(--ink-300)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
              Set <code style={{ color: "var(--phos-cyan)" }}>AGENT_ADMIN_TOKEN</code> in Convex env, then paste the value here.
              Stored in localStorage — never sent anywhere except Convex.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="admin token"
                style={inputStyle}
                onKeyDown={e => { if (e.key === "Enter") saveToken(); }}
              />
              <button className="btn primary" onClick={saveToken} style={{ padding: "0 20px" }}>
                SET TOKEN →
              </button>
            </div>
          </div>
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }}>
          {/* Left: list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {(["pending", "approved", "rejected", "all"] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    border: `1px solid ${filter === f ? "var(--phos-cyan)" : "var(--line)"}`,
                    background: filter === f ? "rgba(95,240,230,0.08)" : "var(--bg-void)",
                    color: filter === f ? "var(--phos-cyan)" : "var(--ink-300)",
                    cursor: "pointer",
                  }}
                >
                  {f.toUpperCase()} {f !== "all" && `· ${counts[f as Status]}`}
                </button>
              ))}
              <button
                onClick={clearToken}
                style={{
                  marginLeft: "auto",
                  padding: "6px 12px",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  border: "1px solid var(--line)",
                  background: "transparent",
                  color: "var(--ink-400)",
                  cursor: "pointer",
                }}
              >
                CLEAR TOKEN
              </button>
            </div>

            <Panel label={`◼ SUBMISSIONS · ${filtered.length}`}>
              {filtered.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--ink-400)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  NONE
                </div>
              ) : (
                <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  {filtered.map((s, i) => {
                    const active = s._id === selectedId;
                    const statusColor = s.status === "approved" ? "green" : s.status === "rejected" ? "red" : "amber";
                    return (
                      <button
                        key={s._id}
                        onClick={() => setSelectedId(s._id)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "30px 1fr auto",
                          gap: 10,
                          alignItems: "center",
                          width: "100%",
                          padding: "10px 14px",
                          borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none",
                          background: active ? "rgba(95,240,230,0.06)" : "transparent",
                          borderLeft: active ? "2px solid var(--phos-cyan)" : "2px solid transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          color: "inherit",
                          fontFamily: "inherit",
                        }}
                      >
                        <div style={{ fontSize: 16, color: "var(--ink-200)" }}>{s.glyph}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className="t-mono" style={{ fontSize: 12, color: "var(--ink-100)" }}>{s.handle}</div>
                          <div style={{ fontSize: 9, color: "var(--ink-400)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                            {s.game.toUpperCase()} · {s.sizeKb}kb · {timeAgo(s.submittedAt)}
                          </div>
                        </div>
                        <Pill color={statusColor}>{s.status.toUpperCase()}</Pill>
                      </button>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          {/* Right: detail */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {banner && (
              <div style={{
                padding: "10px 14px",
                border: `1px solid ${banner.kind === "ok" ? "var(--phos-green)" : "var(--phos-red)"}`,
                color: banner.kind === "ok" ? "var(--phos-green)" : "var(--phos-red)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}>
                {banner.kind === "ok" ? "✓ " : "✕ "}{banner.msg}
              </div>
            )}

            {!selected ? (
              <Panel label="◆ SELECT A SUBMISSION">
                <div style={{ padding: 40, textAlign: "center", color: "var(--ink-400)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  Pick a row on the left to review its source and approve or reject.
                </div>
              </Panel>
            ) : (
              <Panel label={`◆ ${selected.handle.toUpperCase()} · ${selected.game.toUpperCase()}`}>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    <Meta k="AUTHOR" v={selected.author} />
                    <Meta k="SIZE" v={`${selected.sizeKb}kb`} />
                    <Meta k="STATUS" v={selected.status.toUpperCase()} />
                    <Meta k="SUBMITTED" v={timeAgo(selected.submittedAt)} />
                  </div>

                  {selected.personality && (
                    <div style={{ fontSize: 11, color: "var(--ink-200)", fontFamily: "var(--font-mono)" }}>
                      <span className="t-label" style={{ fontSize: 9, color: "var(--ink-400)", marginRight: 8 }}>PERSONALITY</span>
                      {selected.personality}
                    </div>
                  )}
                  {selected.bio && (
                    <div style={{ fontSize: 11, color: "var(--ink-300)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
                      <span className="t-label" style={{ fontSize: 9, color: "var(--ink-400)", marginRight: 8, display: "block", marginBottom: 4 }}>BIO</span>
                      {selected.bio}
                    </div>
                  )}

                  <div>
                    <div className="t-label" style={{ fontSize: 9, marginBottom: 6 }}>SOURCE</div>
                    <pre style={{
                      background: "var(--bg-void)",
                      border: "1px solid var(--line)",
                      padding: 12,
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--ink-100)",
                      maxHeight: 400,
                      overflow: "auto",
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}>{selected.code}</pre>
                  </div>

                  {selected.status === "pending" && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        disabled={busy}
                        onClick={() => handleApprove(selected._id)}
                        className="btn primary"
                        style={{ padding: "10px 24px", opacity: busy ? 0.5 : 1 }}
                      >
                        {busy ? "RUNNING SMOKE TEST…" : "✓ APPROVE (RUNS SMOKE TEST)"}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => handleReject(selected._id)}
                        style={{
                          padding: "10px 24px",
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.08em",
                          background: "transparent",
                          border: "1px solid var(--phos-red)",
                          color: "var(--phos-red)",
                          cursor: busy ? "not-allowed" : "pointer",
                          opacity: busy ? 0.5 : 1,
                        }}
                      >
                        ✕ REJECT
                      </button>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ padding: "8px 10px", border: "1px solid var(--line)" }}>
      <div className="t-label" style={{ fontSize: 9 }}>{k}</div>
      <div className="t-mono" style={{ fontSize: 12, color: "var(--ink-100)", marginTop: 2 }}>{v}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  boxSizing: "border-box",
  background: "var(--bg-void)",
  border: "1px solid var(--line)",
  color: "var(--ink-100)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  padding: "9px 12px",
  outline: "none",
};
