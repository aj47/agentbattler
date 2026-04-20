/* global React, window */
// ============================================================
// SCREEN: AGENT PROFILE — dossier
// ============================================================

function ProfileScreen({ agent, setScreen, setSelectedMatch, setSelectedAgent }) {
  const a = agent || window.agentById('go_master_v3');
  const color = `var(--phos-${a.color})`;
  const rank = window.LEADERBOARD.findIndex(x => x.id === a.id) + 1;
  const winrate = Math.round((a.wins / (a.wins + a.loss)) * 100);

  return (
    <div style={{ padding: '20px 28px', maxWidth: 1760, margin: '0 auto' }}>

      <div style={{ fontSize: 11, color: 'var(--ink-300)', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
        <span onClick={() => setScreen('lobby')} style={{ cursor: 'pointer' }}>LOBBY</span>
        <span style={{ margin: '0 8px', color: 'var(--ink-400)' }}>/</span>
        <span onClick={() => setScreen('bracket')} style={{ cursor: 'pointer' }}>BRACKET</span>
        <span style={{ margin: '0 8px', color: 'var(--ink-400)' }}>/</span>
        <span style={{ color: color }}>AGENT · {a.handle}</span>
      </div>

      {/* Hero */}
      <window.Panel>
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr auto',
          gap: 28, padding: '28px 32px', alignItems: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* faded glyph background */}
          <div style={{
            position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)',
            fontSize: 400, fontFamily: 'var(--font-display)',
            color: color, opacity: 0.05, lineHeight: 0.7,
            pointerEvents: 'none',
          }}>{a.glyph}</div>

          <window.AgentGlyph agent={a} size={140} />

          <div style={{ zIndex: 1 }}>
            <div className="t-label" style={{ color: color }}>#{rank} GLOBAL · {a.author}</div>
            <div className="t-display" style={{ fontSize: 48, letterSpacing: '-0.02em', marginTop: 6 }}>
              {a.handle}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-200)', maxWidth: 640, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--ink-400)' }}>{'/* '}</span>{a.bio}<span style={{ color: 'var(--ink-400)' }}>{' */'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {a.hot && <window.Pill color="magenta">◉ HOT</window.Pill>}
              {a.streak > 5 && <window.Pill color="green">W{a.streak} STREAK</window.Pill>}
              <window.Pill color="cyan">{a.personality.toUpperCase()}</window.Pill>
              <window.Pill color="gray">{a.size}kb / 50kb</window.Pill>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, zIndex: 1 }}>
            {[
              { k: 'NET PNL · 30D', v: '+$' + (window.PROFILE_PNL.total30d/1000).toFixed(1) + 'k', c: 'var(--phos-green)', glow: true },
              { k: 'ALL-TIME', v: '$' + (window.PROFILE_PNL.totalAllTime/1000).toFixed(0) + 'k', c: 'var(--phos-cyan)' },
              { k: 'SHARPE', v: window.PROFILE_PNL.sharpe.toFixed(2), c: color },
              { k: 'WINRATE · ELO', v: winrate + '% · ' + a.elo, c: 'var(--ink-100)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '10px 14px', border: '1px solid var(--line)', minWidth: 140 }}>
                <div className="t-label" style={{ fontSize: 9 }}>{s.k}</div>
                <div className="t-num" style={{
                  fontSize: 22, color: s.c,
                  textShadow: s.glow ? `0 0 10px ${s.c}` : 'none',
                }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* size bar */}
        <div style={{ padding: '0 32px 20px', marginTop: -6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="t-label" style={{ fontSize: 9 }}>SOURCE SIZE · {a.size}KB USED OF 50KB LIMIT</span>
            <span className="t-num" style={{ fontSize: 10, color: 'var(--ink-300)' }}>{Math.round((a.size / 50) * 100)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-void)', border: '1px solid var(--line)' }}>
            <div style={{ height: '100%', width: `${(a.size / 50) * 100}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
          </div>
        </div>
      </window.Panel>

      {/* PnL equity curve — full-width */}
      <window.Panel label="◆ PNL · EQUITY CURVE · LAST 30 DAYS" right={
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="t-label" style={{ fontSize: 9 }}>7D <span className="t-num" style={{ color: 'var(--phos-green)', marginLeft: 4 }}>+${(window.PROFILE_PNL.total7d/1000).toFixed(1)}k</span></span>
          <span className="t-label" style={{ fontSize: 9 }}>MAX DD <span className="t-num" style={{ color: 'var(--phos-red)', marginLeft: 4 }}>${(window.PROFILE_PNL.maxDrawdown/1000).toFixed(1)}k</span></span>
          <span className="t-label" style={{ fontSize: 9 }}>AVG TICKET <span className="t-num" style={{ color: 'var(--ink-200)', marginLeft: 4 }}>${(window.PROFILE_PNL.avgTicket/1000).toFixed(1)}k</span></span>
        </div>
      } style={{ marginTop: 16 }}>
        <PnLChart curve={window.PROFILE_PNL.curve30d} color={color} />
      </window.Panel>

      {/* Match history — brought up, now with PnL */}
      <window.Panel label="◼ RECENT MATCHES" right={<button className="btn ghost" style={{ fontSize: 10 }}>VIEW ALL →</button>} style={{ marginTop: 16 }}>
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: '90px 1fr 90px 90px 110px 70px 80px',
            padding: '8px 16px', borderBottom: '1px solid var(--line)',
            background: 'var(--bg-panel-2)',
          }}>
            {['RESULT', 'OPPONENT', 'GAME', 'SCORE', 'PNL', 'DATE', ''].map(h => (
              <span key={h} className="t-label" style={{ fontSize: 9 }}>{h}</span>
            ))}
          </div>
          {window.PROFILE_MATCHES.map((m, i) => {
            const opp = window.agentById(m.opp);
            const rc = m.result === 'WIN' ? 'var(--phos-green)' : m.result === 'LOSS' ? 'var(--phos-red)' : 'var(--phos-cyan)';
            const pnlColor = m.pnl == null ? 'var(--ink-400)' : m.pnl > 0 ? 'var(--phos-green)' : 'var(--phos-red)';
            const pnlLabel = m.pnl == null ? '—' : (m.pnl > 0 ? '+' : '') + '$' + Math.abs(m.pnl).toLocaleString();
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 90px 90px 110px 70px 80px',
                padding: '10px 16px',
                borderBottom: i < window.PROFILE_MATCHES.length - 1 ? '1px solid var(--line)' : 'none',
                alignItems: 'center',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span className="t-mono" style={{
                  fontSize: 11, color: rc, fontWeight: 600,
                  textShadow: `0 0 6px ${rc}`,
                }}>{m.result === 'LIVE' ? '● LIVE' : m.result}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={() => { setSelectedAgent(opp); }}>
                  <window.AgentGlyph agent={opp} size={20} spin={false} />
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-100)' }}>{opp.handle}</span>
                </div>
                <span className="t-label" style={{ fontSize: 10, color: 'var(--phos-cyan)' }}>{m.game}</span>
                <span className="t-num" style={{ fontSize: 11, color: 'var(--ink-200)' }}>{m.score}</span>
                <span className="t-num" style={{
                  fontSize: 13, color: pnlColor, fontWeight: 600,
                  textShadow: m.pnl != null ? `0 0 6px ${pnlColor}` : 'none',
                }}>{pnlLabel}</span>
                <span className="t-label" style={{ fontSize: 9 }}>{m.date}</span>
                <button className="btn ghost" style={{ fontSize: 9, padding: '4px 8px' }}>REPLAY</button>
              </div>
            );
          })}
        </div>
      </window.Panel>
    </div>
  );
}

// PnL equity curve chart
function PnLChart({ curve, color }) {
  const W = 1200, H = 220;
  const max = Math.max(...curve);
  const min = Math.min(...curve, 0);
  const range = max - min || 1;
  const pad = 24;
  const xStep = (W - pad * 2) / (curve.length - 1);
  const y = (v) => pad + (H - pad * 2) * (1 - (v - min) / range);
  const zeroY = y(0);

  const pts = curve.map((v, i) => [pad + i * xStep, y(v)]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L ${pts[pts.length-1][0]} ${zeroY} L ${pad} ${zeroY} Z`;

  // horizontal grid lines at $0, $50k, $100k, $150k
  const grids = [];
  for (let v = 0; v <= max; v += 50000) grids.push(v);

  return (
    <div style={{ padding: '18px 20px' }}>
      <div style={{ position: 'relative' }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="pnlArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* grid */}
          {grids.map((v, i) => (
            <g key={i}>
              <line x1={pad} y1={y(v)} x2={W - pad} y2={y(v)}
                stroke={v === 0 ? 'var(--line-2)' : 'var(--line)'}
                strokeWidth={v === 0 ? 0.8 : 0.4}
                strokeDasharray={v === 0 ? '0' : '3 4'} />
              <text x={W - pad + 4} y={y(v) + 3} fill="var(--ink-400)"
                fontSize="9" fontFamily="var(--font-mono)">${v/1000}k</text>
            </g>
          ))}
          {/* area */}
          <path d={area} fill="url(#pnlArea)" />
          {/* line */}
          <path d={path} fill="none" stroke={color} strokeWidth="1.6"
            style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
          {/* last-point pulse */}
          <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="5" fill={color} />
          <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.6">
            <animate attributeName="r" from="5" to="16" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
        <span className="t-label" style={{ fontSize: 9 }}>30D AGO · <span style={{ color: 'var(--ink-300)' }}>$0</span></span>
        <span className="t-label" style={{ fontSize: 9, color: 'var(--phos-green)' }}>BIGGEST WIN +${(window.PROFILE_PNL.biggestWin/1000).toFixed(1)}k · vs stone.singer</span>
        <span className="t-label" style={{ fontSize: 9, color: 'var(--phos-red)' }}>BIGGEST LOSS ${(window.PROFILE_PNL.biggestLoss/1000).toFixed(1)}k · vs null.ptr()</span>
        <span className="t-label" style={{ fontSize: 9 }}>NOW · <span className="t-num" style={{ color: 'var(--phos-green)', textShadow: `0 0 6px var(--phos-green)` }}>+${(window.PROFILE_PNL.total30d/1000).toFixed(1)}k</span></span>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
