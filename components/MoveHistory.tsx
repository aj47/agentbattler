import { matchNumberFromSlug } from "../lib/matches";

type MoveHistoryProps = {
  notation?: readonly string[] | null;
  moveCount: number;
  matchSlug: string;
  gameLabel: string;
  maxMoves?: number;
  compact?: boolean;
};

export function MoveHistory({
  notation,
  moveCount,
  matchSlug,
  gameLabel,
  maxMoves = 32,
  compact = false,
}: MoveHistoryProps) {
  const moves = notation ?? [];
  const visible = moves.slice(-maxMoves);
  const firstMoveNumber = Math.max(1, moveCount - visible.length + 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center",
        padding: compact ? "8px 10px" : "10px 12px", borderBottom: "1px solid var(--line)",
        background: "rgba(5,7,13,0.38)", flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div className="t-label" style={{ fontSize: 8, color: "var(--ink-400)" }}>MATCH #{matchNumberFromSlug(matchSlug)}</div>
          <div className="t-mono" style={{ fontSize: compact ? 10 : 11, color: "var(--ink-100)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {gameLabel} · MOVE {moveCount}
          </div>
        </div>
        <span className="t-label" style={{ color: "var(--phos-cyan)", fontSize: 9 }}>{visible.length} SHOWN</span>
      </div>

      <div aria-live="polite" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: compact ? 8 : 10 }}>
        {visible.length === 0 ? (
          <div style={{
            height: "100%", minHeight: 120, display: "grid", placeItems: "center",
            color: "var(--ink-500)", fontFamily: "var(--font-mono)", fontSize: 10,
            letterSpacing: "0.12em", textAlign: "center",
          }}>
            WAITING FOR FIRST RECORDED MOVE
          </div>
        ) : visible.map((move, index) => {
          const moveNo = firstMoveNumber + index;
          const color = moveNo % 2 === 1 ? "var(--phos-cyan)" : "var(--phos-amber)";
          return (
            <div key={`${moveNo}-${move}`} style={{
              display: "grid", gridTemplateColumns: compact ? "38px 18px 1fr" : "46px 22px 1fr",
              gap: compact ? 6 : 8, alignItems: "baseline", padding: compact ? "5px 4px" : "7px 6px",
              borderBottom: "1px solid rgba(95,240,230,0.08)",
            }}>
              <span className="t-num" style={{ fontSize: compact ? 10 : 11, color: "var(--ink-400)" }}>{moveNo}</span>
              <span className="t-label" style={{ fontSize: 9, color }}>{moveNo % 2 === 1 ? "B" : "W"}</span>
              <span className="t-mono" style={{ fontSize: compact ? 10 : 11, color: "var(--ink-100)", overflowWrap: "anywhere" }}>{move}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}