"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

type Mode = "signIn" | "signUp";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordMismatch = mode === "signUp" && confirm.length > 0 && password !== confirm;

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setConfirm("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signUp" && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const params: Record<string, string> = { email, password, flow: mode };
      if (mode === "signUp" && name) params.name = name;
      await signIn("password", params);
      onClose();
    } catch (err: unknown) {
      setError(authErrorMessage(err, mode));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(5,7,13,0.85)",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-panel)", border: "1px solid var(--line)",
        padding: 32, width: 380, position: "relative",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div className="t-display" style={{ fontSize: 20 }}>
              {mode === "signIn" ? "SIGN IN" : "CREATE ACCOUNT"}
            </div>
            <div className="t-label" style={{ fontSize: 9, marginTop: 3 }}>AGENT BATTLER · VIBE CODE CUP</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--ink-400)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signUp" && (
            <div>
              <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 6 }}>USERNAME <span style={{ color: "var(--phos-red)" }}>*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. @mina" required style={inputStyle} />
            </div>
          )}
          <div>
            <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 6 }}>EMAIL <span style={{ color: "var(--phos-red)" }}>*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="agent@example.com" style={inputStyle} />
          </div>
          <div>
            <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 6 }}>PASSWORD <span style={{ color: "var(--phos-red)" }}>*</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
          </div>
          {mode === "signUp" && (
            <div>
              <label className="t-label" style={{ fontSize: 9, display: "block", marginBottom: 6 }}>
                CONFIRM PASSWORD <span style={{ color: "var(--phos-red)" }}>*</span>
                {passwordMismatch && <span style={{ color: "var(--phos-red)", marginLeft: 8 }}>· DO NOT MATCH</span>}
                {!passwordMismatch && confirm.length > 0 && <span style={{ color: "var(--phos-green)", marginLeft: 8 }}>· ✓</span>}
              </label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required placeholder="••••••••"
                style={{ ...inputStyle, borderColor: passwordMismatch ? "var(--phos-red)" : confirm.length > 0 && !passwordMismatch ? "var(--phos-green)" : "var(--line)" }}
              />
            </div>
          )}

          {error && (
            <div style={{ padding: "8px 12px", border: "1px solid var(--phos-red)", color: "var(--phos-red)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              ✕ {error}
            </div>
          )}

          <button
            type="submit" disabled={loading || passwordMismatch}
            className="btn primary"
            style={{ width: "100%", justifyContent: "center", padding: "10px", opacity: loading || passwordMismatch ? 0.5 : 1, marginTop: 4 }}
          >
            {loading ? "…" : mode === "signIn" ? "SIGN IN →" : "CREATE ACCOUNT →"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-400)" }}>
          {mode === "signIn" ? (
            <>No account?{" "}
              <button onClick={() => switchMode("signUp")} style={{ background: "none", border: "none", color: "var(--phos-cyan)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                SIGN UP
              </button>
            </>
          ) : (
            <>Already have one?{" "}
              <button onClick={() => switchMode("signIn")} style={{ background: "none", border: "none", color: "var(--phos-cyan)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                SIGN IN
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "var(--bg-void)", border: "1px solid var(--line)",
  color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 12,
  padding: "9px 12px", outline: "none",
};

function authErrorMessage(err: unknown, mode: Mode) {
  const message = err instanceof Error ? err.message : String(err ?? "");

  if (/InvalidSecret|InvalidAccountId|Invalid credentials/i.test(message)) {
    return "Invalid email or password.";
  }
  if (/TooManyFailedAttempts/i.test(message)) {
    return "Too many failed attempts. Try again later.";
  }
  if (/already exists/i.test(message)) {
    return "An account already exists for this email. Try signing in.";
  }
  if (/Invalid password/i.test(message)) {
    return "Password must be at least 8 characters.";
  }

  return mode === "signUp" ? "Could not create account." : "Could not sign in.";
}
