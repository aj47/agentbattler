/* global React */
// ============================================================
// Shared components for Agent Battler
// ============================================================
const { useState, useEffect, useRef } = React;

// ------------------------------------------------------------
// Panel — universal HUD panel with corner brackets
// ------------------------------------------------------------
function Panel({ children, style, label, right, className = '', noCorners = false }) {
  return (
    <div className={`panel ${className}`} style={style}>
      {!noCorners && <>
        <span className="panel-corner tl" />
        <span className="panel-corner tr" />
        <span className="panel-corner bl" />
        <span className="panel-corner br" />
      </>}
      {(label || right) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px', borderBottom: '1px solid var(--line)',
        }}>
          <span className="t-label">{label}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// LiveDot + small pills
// ------------------------------------------------------------
function LiveDot() { return <span className="live-dot" />; }

function Pill({ children, color = 'cyan', style, ...rest }) {
  const colors = {
    cyan: { border: 'var(--phos-cyan)', text: 'var(--phos-cyan)' },
    amber: { border: 'var(--phos-amber)', text: 'var(--phos-amber)' },
    green: { border: 'var(--phos-green)', text: 'var(--phos-green)' },
    magenta: { border: 'var(--phos-magenta)', text: 'var(--phos-magenta)' },
    violet: { border: 'var(--phos-violet)', text: 'var(--phos-violet)' },
    red: { border: 'var(--phos-red)', text: 'var(--phos-red)' },
    gray: { border: 'var(--line-2)', text: 'var(--ink-300)' },
  };
  const c = colors[color] || colors.cyan;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 6px',
      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em',
      textTransform: 'uppercase',
      border: `1px solid ${c.border}`, color: c.text,
      ...style,
    }} {...rest}>{children}</span>
  );
}

// ------------------------------------------------------------
// AgentGlyph — the animated holographic sigil used on cards
// ------------------------------------------------------------
function AgentGlyph({ agent, size = 48, spin = true }) {
  const c = `var(--phos-${agent.color})`;
  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      display: 'grid', placeItems: 'center',
      flexShrink: 0,
    }}>
      {/* rings */}
      <div style={{
        position: 'absolute', inset: 0,
        border: `1px solid ${c}`, borderRadius: '50%',
        opacity: 0.6,
        animation: spin ? 'rot 12s linear infinite' : 'none',
        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 80% 50%, 80% 55%, 100% 55%, 100% 100%, 0 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 4,
        border: `1px dashed ${c}`, borderRadius: '50%',
        opacity: 0.3,
        animation: spin ? 'rot 20s linear infinite reverse' : 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 6,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${c} 0%, transparent 70%)`,
        opacity: 0.25,
        filter: 'blur(4px)',
      }} />
      {/* glyph */}
      <span style={{
        fontSize: size * 0.5,
        color: c,
        textShadow: `0 0 12px ${c}`,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        zIndex: 1,
      }}>{agent.glyph}</span>
    </div>
  );
}

// ------------------------------------------------------------
// AgentCard — compact / full variants
// ------------------------------------------------------------
function AgentCard({ agent, side = 'L', compact = false, active = false, score }) {
  const c = `var(--phos-${agent.color})`;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: compact ? '10px 12px' : '14px 16px',
      background: active ? 'rgba(95,240,230,0.04)' : 'var(--bg-panel)',
      border: `1px solid ${active ? c : 'var(--line)'}`,
      position: 'relative',
      flexDirection: side === 'R' ? 'row-reverse' : 'row',
      textAlign: side === 'R' ? 'right' : 'left',
    }}>
      <AgentGlyph agent={agent} size={compact ? 40 : 54} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', flexDirection: side === 'R' ? 'row-reverse' : 'row' }}>
          <span className="t-mono" style={{
            fontSize: compact ? 13 : 15, fontWeight: 600,
            color: 'var(--ink-100)', textShadow: `0 0 8px ${c}`,
          }}>{agent.handle}</span>
          {agent.hot && <Pill color="magenta" style={{ fontSize: 8, padding: '1px 4px' }}>HOT</Pill>}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 3, flexDirection: side === 'R' ? 'row-reverse' : 'row' }}>
          <span className="t-label" style={{ fontSize: 9 }}>ELO <span className="t-num" style={{ color: c }}>{agent.elo}</span></span>
          <span className="t-label" style={{ fontSize: 9 }}>{agent.size}<span style={{ opacity: 0.5 }}>kb</span></span>
          <span className="t-label" style={{ fontSize: 9 }}>{agent.author}</span>
        </div>
        {!compact && (
          <div style={{
            marginTop: 6, fontSize: 10, fontFamily: 'var(--font-mono)',
            color: 'var(--ink-300)', fontStyle: 'italic',
          }}>// {agent.personality}</div>
        )}
      </div>
      {score !== undefined && (
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: compact ? 24 : 36,
          fontWeight: 700, color: c, textShadow: `0 0 14px ${c}`,
          minWidth: 36, textAlign: 'center',
        }}>{score}</div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// HoloBoard — GO 19x19 hologram, tilted
// ------------------------------------------------------------
function HoloBoardGo({ stones = [], lastMove, hot = [], size = 520, tilt = 38 }) {
  const N = 19;
  const pad = 18;
  const step = (size - pad * 2) / (N - 1);

  return (
    <div style={{
      perspective: '1400px',
      perspectiveOrigin: '50% 20%',
      width: size, height: size * 0.8,
      position: 'relative',
    }}>
      {/* glow floor */}
      <div style={{
        position: 'absolute', left: '50%', bottom: '-10%',
        width: size * 0.9, height: 40, transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse, var(--phos-cyan-glow), transparent 70%)',
        filter: 'blur(16px)', opacity: 0.8,
      }} />

      <div style={{
        width: size, height: size,
        transform: `rotateX(${tilt}deg)`,
        transformOrigin: '50% 60%',
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(95,240,230,0.03) 0%, rgba(95,240,230,0.08) 100%)',
        border: '1px solid rgba(95,240,230,0.25)',
        boxShadow: 'inset 0 0 60px rgba(95,240,230,0.08), 0 0 40px rgba(95,240,230,0.2)',
      }}>
        {/* grid */}
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="stoneB" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#4a5670" />
              <stop offset="60%" stopColor="#0a0e1a" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
            <radialGradient id="stoneW" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#c8d4e8" />
              <stop offset="100%" stopColor="#5a6580" />
            </radialGradient>
            <filter id="glowCyan">
              <feGaussianBlur stdDeviation="3" />
              <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* lines */}
          {Array.from({ length: N }).map((_, i) => (
            <g key={i}>
              <line x1={pad + i * step} y1={pad} x2={pad + i * step} y2={size - pad}
                stroke="rgba(95,240,230,0.45)" strokeWidth="0.8" />
              <line x1={pad} y1={pad + i * step} x2={size - pad} y2={pad + i * step}
                stroke="rgba(95,240,230,0.45)" strokeWidth="0.8" />
            </g>
          ))}
          {/* star points */}
          {[3, 9, 15].flatMap(x => [3, 9, 15].map(y => (
            <circle key={`${x}-${y}`} cx={pad + x * step} cy={pad + y * step} r="2.5"
              fill="var(--phos-cyan)" opacity="0.8" />
          )))}

          {/* hot-move pulses */}
          {hot.map((h, i) => (
            <circle key={i} cx={pad + h.x * step} cy={pad + h.y * step}
              r={step * 0.9} fill="none" stroke="var(--phos-magenta)" strokeWidth="1"
              opacity="0.5" style={{ animation: `pulseHot 2.2s ease-out ${i * 0.4}s infinite` }} />
          ))}

          {/* stones */}
          {stones.map((s, i) => {
            const cx = pad + s.x * step;
            const cy = pad + s.y * step;
            const r = step * 0.46;
            const fill = s.c === 'b' ? 'url(#stoneB)' : 'url(#stoneW)';
            const glow = s.c === 'b' ? 'var(--phos-amber-glow)' : 'rgba(255,255,255,0.4)';
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r + 2} fill={glow} opacity="0.35" filter="url(#glowCyan)" />
                <circle cx={cx} cy={cy} r={r} fill={fill}
                  stroke={s.c === 'b' ? 'var(--phos-amber)' : 'var(--phos-cyan)'}
                  strokeWidth="0.6" strokeOpacity="0.7" />
              </g>
            );
          })}

          {/* last-move marker */}
          {lastMove && (
            <circle cx={pad + lastMove.x * step} cy={pad + lastMove.y * step}
              r={step * 0.2} fill="none" stroke="var(--phos-magenta)" strokeWidth="1.5"
              style={{ animation: 'pulseHot 1.4s ease-out infinite' }} />
          )}
        </svg>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// HoloBoardChess — small 8x8 hologram preview
// ------------------------------------------------------------
function HoloBoardChess({ size = 220, tilt = 36, fen }) {
  // Minimal FEN render; hardcode a plausible position if none
  const f = fen || 'r3kb1r/ppp2ppp/2n1bn2/3pp3/3PP3/2N1BN2/PPP2PPP/R3KB1R';
  const pieces = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  };
  const rows = f.split('/').slice(0, 8);
  const cells = [];
  rows.forEach((row, y) => {
    let x = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { x += parseInt(ch, 10); }
      else { cells.push({ x, y, p: ch }); x++; }
    }
  });
  const pad = 10;
  const step = (size - pad * 2) / 8;

  return (
    <div style={{ perspective: '1000px', width: size, height: size * 0.78, position: 'relative' }}>
      <div style={{
        position: 'absolute', left: '50%', bottom: '-8%',
        width: size * 0.85, height: 20, transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse, rgba(255,181,71,0.35), transparent 70%)',
        filter: 'blur(10px)',
      }} />
      <div style={{
        width: size, height: size,
        transform: `rotateX(${tilt}deg)`,
        transformOrigin: '50% 60%',
        position: 'relative',
      }}>
        <svg width={size} height={size}>
          {Array.from({ length: 8 }).map((_, y) =>
            Array.from({ length: 8 }).map((_, x) => {
              const dark = (x + y) % 2 === 1;
              return (
                <rect key={`${x}-${y}`}
                  x={pad + x * step} y={pad + y * step}
                  width={step} height={step}
                  fill={dark ? 'rgba(95,240,230,0.10)' : 'rgba(95,240,230,0.02)'}
                  stroke="rgba(95,240,230,0.3)" strokeWidth="0.4" />
              );
            })
          )}
          {cells.map((c, i) => {
            const isWhite = c.p === c.p.toUpperCase();
            const color = isWhite ? 'var(--phos-cyan)' : 'var(--phos-amber)';
            return (
              <text key={i}
                x={pad + c.x * step + step / 2}
                y={pad + c.y * step + step / 2 + step * 0.28}
                textAnchor="middle"
                fontSize={step * 0.75}
                fill={color}
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              >{pieces[c.p] || '?'}</text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// HoloBoardCheckers — 8x8 holo w/ stacked discs
// ------------------------------------------------------------
function HoloBoardCheckers({ size = 220, tilt = 36 }) {
  // Hardcoded mid-game
  const discs = [
    {x:0,y:5,c:'r'},{x:2,y:5,c:'r'},{x:4,y:5,c:'r'},
    {x:1,y:6,c:'r'},{x:3,y:6,c:'r'},{x:5,y:6,c:'r',k:true},
    {x:0,y:7,c:'r'},{x:6,y:7,c:'r'},
    {x:1,y:0,c:'b'},{x:3,y:0,c:'b'},{x:5,y:0,c:'b'},{x:7,y:0,c:'b'},
    {x:0,y:1,c:'b'},{x:2,y:1,c:'b'},{x:4,y:1,c:'b',k:true},
    {x:3,y:2,c:'b'},{x:5,y:4,c:'r'},
  ];
  const pad = 10;
  const step = (size - pad * 2) / 8;

  return (
    <div style={{ perspective: '1000px', width: size, height: size * 0.78, position: 'relative' }}>
      <div style={{
        position: 'absolute', left: '50%', bottom: '-8%',
        width: size * 0.85, height: 20, transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse, rgba(125,255,156,0.35), transparent 70%)',
        filter: 'blur(10px)',
      }} />
      <div style={{
        width: size, height: size,
        transform: `rotateX(${tilt}deg)`,
        transformOrigin: '50% 60%',
      }}>
        <svg width={size} height={size}>
          {Array.from({ length: 8 }).map((_, y) =>
            Array.from({ length: 8 }).map((_, x) => {
              const dark = (x + y) % 2 === 1;
              return (
                <rect key={`${x}-${y}`}
                  x={pad + x * step} y={pad + y * step}
                  width={step} height={step}
                  fill={dark ? 'rgba(125,255,156,0.12)' : 'rgba(125,255,156,0.02)'}
                  stroke="rgba(125,255,156,0.3)" strokeWidth="0.4" />
              );
            })
          )}
          {discs.map((d, i) => {
            const cx = pad + d.x * step + step/2;
            const cy = pad + d.y * step + step/2;
            const color = d.c === 'r' ? 'var(--phos-red)' : 'var(--phos-cyan)';
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={step*0.38} fill="rgba(0,0,0,0.6)"
                  stroke={color} strokeWidth="1.2"
                  style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
                {d.k && <text x={cx} y={cy + step*0.12} textAnchor="middle"
                  fontSize={step*0.4} fill={color}>♛</text>}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Dispatcher
function MiniBoard({ game, size }) {
  if (game === 'go19') {
    return <HoloBoardGo stones={window.FEATURED_GO_STONES.slice(0, 24)} size={size} tilt={42} />;
  }
  if (game === 'checkers') return <HoloBoardCheckers size={size} />;
  return <HoloBoardChess size={size} />;
}

// ------------------------------------------------------------
// Ticker — caster-style scrolling bar
// ------------------------------------------------------------
function Ticker({ items = [] }) {
  const joined = [...items, ...items];
  return (
    <div style={{
      overflow: 'hidden',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
      background: 'linear-gradient(90deg, rgba(95,240,230,0.05), transparent 50%, rgba(255,181,71,0.05))',
      whiteSpace: 'nowrap',
      position: 'relative',
    }}>
      <div style={{
        display: 'inline-block',
        animation: 'ticker 60s linear infinite',
        padding: '8px 0',
      }}>
        {joined.map((t, i) => (
          <span key={i} style={{ padding: '0 30px', fontSize: 11, color: 'var(--ink-200)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--phos-cyan)', marginRight: 8 }}>◆</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Chat — spectator live chat
// ------------------------------------------------------------
function LiveChat({ messages = [], emojis = [] }) {
  const [msgs, setMsgs] = useState(messages);
  const scrollRef = useRef(null);

  useEffect(() => {
    const chatters = ['tenuki_dad','ko_threat','dame_haver','stone_enjoyer','byoyomi','fusekifan','sgf_master','ladder_king','eye_shape','atari_bot'];
    const lines = [
      'what a shape',
      'that\'s a ladder breaker',
      'agent thinking for 0.8s = eternity',
      'CODE SMELL. beautiful.',
      'knight.gpt would have taken that',
      'not the hane omg',
      'influence > territory change my mind',
      'is 48kb even fair',
      '12.8kb of pure violence',
      'W down 11 points',
      'tenuki city',
      'double hane DEEP',
      'AI moves hit different',
    ];
    const id = setInterval(() => {
      const newMsg = {
        user: chatters[Math.floor(Math.random() * chatters.length)],
        tier: Math.random() > 0.85 ? 'vip' : Math.random() > 0.7 ? 'sub' : '',
        msg: lines[Math.floor(Math.random() * lines.length)],
        time: 'now',
      };
      setMsgs(prev => [newMsg, ...prev].slice(0, 60));
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const tierColor = (t) => t === 'mod' ? 'var(--phos-green)' : t === 'vip' ? 'var(--phos-magenta)' : t === 'sub' ? 'var(--phos-amber)' : 'var(--ink-300)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '10px 12px',
        display: 'flex', flexDirection: 'column-reverse', gap: 6,
      }}>
        {msgs.map((m, i) => (
          <div key={`${i}-${m.user}-${m.msg}`} style={{
            fontSize: 12, lineHeight: 1.4,
            animation: i === 0 ? 'chatFadeIn 300ms var(--ease-out)' : 'none',
          }}>
            <span style={{
              color: tierColor(m.tier), fontWeight: 600,
              fontFamily: 'var(--font-mono)', fontSize: 11,
            }}>
              {m.tier === 'mod' && <span style={{ marginRight: 3 }}>⚔</span>}
              {m.tier === 'vip' && <span style={{ marginRight: 3 }}>◆</span>}
              {m.user}:
            </span>
            <span style={{ color: 'var(--ink-100)', marginLeft: 6 }}>{m.msg}</span>
          </div>
        ))}
      </div>
      <div style={{
        padding: '8px 12px', borderTop: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-panel)',
      }}>
        <span className="t-label" style={{ fontSize: 9 }}>SEND</span>
        <div style={{
          flex: 1, padding: '4px 8px',
          background: 'var(--bg-void)', border: '1px solid var(--line)',
          fontSize: 11, color: 'var(--ink-400)',
        }}>_</div>
        <span style={{ display: 'flex', gap: 4 }}>
          {emojis.slice(0, 5).map((e, i) => (
            <button key={i} style={{
              padding: '2px 6px', fontSize: 14,
              border: '1px solid var(--line)', background: 'var(--bg-panel-2)',
            }}>{e}</button>
          ))}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// TopNav — screen switcher
// ------------------------------------------------------------
function TopNav({ screen, setScreen }) {
  const items = [
    { id: 'lobby', label: 'LOBBY' },
    { id: 'match', label: 'LIVE MATCH' },
    { id: 'bracket', label: 'BRACKET' },
    { id: 'profile', label: 'AGENT' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px',
      borderBottom: '1px solid var(--line)',
      background: 'linear-gradient(180deg, rgba(5,7,13,0.95), rgba(5,7,13,0.7))',
      backdropFilter: 'blur(8px)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 6px var(--phos-cyan))' }}>
            <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="none" stroke="var(--phos-cyan)" strokeWidth="1.2" />
            <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" fill="none" stroke="var(--phos-cyan)" strokeWidth="1" opacity="0.6" />
            <circle cx="12" cy="12" r="2" fill="var(--phos-cyan)" />
          </svg>
          <div>
            <div className="t-display" style={{ fontSize: 16, letterSpacing: '0.02em', color: 'var(--ink-100)' }}>
              AGENT<span style={{ color: 'var(--phos-cyan)' }}>⟡</span>BATTLER
            </div>
            <div className="t-label" style={{ fontSize: 8, marginTop: -2 }}>VIBE CODE CUP · S3</div>
          </div>
        </div>

        <div style={{ width: 1, height: 32, background: 'var(--line)', marginLeft: 8 }} />

        <nav style={{ display: 'flex', gap: 2 }}>
          {items.map(i => (
            <button key={i.id}
              onClick={() => setScreen(i.id)}
              style={{
                padding: '8px 16px',
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em',
                color: screen === i.id ? 'var(--phos-cyan)' : 'var(--ink-300)',
                borderBottom: `2px solid ${screen === i.id ? 'var(--phos-cyan)' : 'transparent'}`,
                textShadow: screen === i.id ? '0 0 8px var(--phos-cyan-glow)' : 'none',
                transition: 'all 160ms var(--ease-out)',
              }}>
              {i.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LiveDot />
          <span className="t-label" style={{ color: 'var(--phos-green)' }}>12 MATCHES LIVE</span>
        </div>
        <span className="t-label">16,482 SPECTATORS</span>
        <button className="btn primary">◉ REC</button>
      </div>
    </div>
  );
}

// ==== export to window ====
Object.assign(window, {
  Panel, LiveDot, Pill, AgentGlyph, AgentCard,
  HoloBoardGo, HoloBoardChess, HoloBoardCheckers, MiniBoard,
  Ticker, LiveChat, TopNav,
});
