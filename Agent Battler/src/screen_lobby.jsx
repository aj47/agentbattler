/* global React, window */
// ============================================================
// SCREEN: LOBBY
// Featured live match center, gallery grid, leaderboard + upsets sidebar
// ============================================================
function LobbyScreen({ setScreen, setSelectedAgent, setSelectedMatch }) {
  const featured = window.ONGOING_MATCHES.find(m => m.status === 'featured');
  const others = window.ONGOING_MATCHES.filter(m => m.status !== 'featured');
  const [emojiStream, setEmojiStream] = React.useState([]);

  // Emoji spam stream over featured match
  React.useEffect(() => {
    const id = setInterval(() => {
      setEmojiStream(prev => {
        const e = window.CROWD_EMOJI[Math.floor(Math.random() * window.CROWD_EMOJI.length)];
        const next = [...prev, {
          e, id: Math.random(),
          x: 20 + Math.random() * 60,
          dur: 2.5 + Math.random() * 1.5,
        }].slice(-12);
        return next;
      });
    }, 450);
    return () => clearInterval(id);
  }, []);

  const featA = window.agentById(featured.a);
  const featB = window.agentById(featured.b);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gap: 20,
      padding: '20px 24px',
      maxWidth: 1760, margin: '0 auto',
    }}>
      {/* ==== LEFT: featured + gallery ==== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* FEATURED MATCH HERO */}
        <window.Panel>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderBottom: '1px solid var(--line)',
            background: 'linear-gradient(90deg, rgba(95,240,230,0.08), transparent 40%, rgba(255,181,71,0.08))',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <window.LiveDot />
              <span className="t-label" style={{ color: 'var(--phos-green)' }}>LIVE · FEATURED</span>
              <span className="t-label">MATCH #{featured.id.slice(1)}</span>
              <span className="t-label">·</span>
              <span className="t-label" style={{ color: 'var(--phos-cyan)' }}>GO 19×19</span>
              <span className="t-label">·</span>
              <span className="t-label">MOVE {featured.move}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="t-label">👁 {featured.viewers.toLocaleString()}</span>
              <button className="btn primary" onClick={() => { setSelectedMatch(featured); setScreen('match'); }}>
                ENTER ARENA →
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            gap: 20, padding: '24px 24px 20px',
            alignItems: 'center',
          }}>
            {/* Left agent */}
            <div>
              <window.AgentCard agent={featA} side="L" score="B" />
              <div style={{ padding: '10px 14px 0', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-300)' }}>
                <div>TERRITORY <span className="t-num" style={{ color: 'var(--phos-cyan)', fontSize: 14 }}>58.5</span></div>
                <div style={{ marginTop: 4 }}>CAPTURES <span className="t-num" style={{ color: 'var(--ink-100)' }}>12</span></div>
                <div style={{ marginTop: 4 }}>TIME <span className="t-num" style={{ color: 'var(--ink-100)' }}>4:12</span></div>
              </div>
            </div>

            {/* Center: hologram board */}
            <div style={{ position: 'relative' }}>
              <window.HoloBoardGo
                stones={window.FEATURED_GO_STONES}
                lastMove={window.FEATURED_LAST_MOVE}
                hot={window.FEATURED_HOT}
                size={460}
                tilt={40}
              />
              {/* floating emoji spam */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {emojiStream.map(e => (
                  <span key={e.id} style={{
                    position: 'absolute', bottom: 0, left: `${e.x}%`,
                    fontSize: 22,
                    animation: `floatUp ${e.dur}s linear forwards`,
                    opacity: 0.85,
                  }}>{e.e}</span>
                ))}
              </div>
            </div>

            {/* Right agent */}
            <div>
              <window.AgentCard agent={featB} side="R" score="W" />
              <div style={{ padding: '10px 14px 0', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-300)', textAlign: 'right' }}>
                <div>TERRITORY <span className="t-num" style={{ color: 'var(--phos-amber)', fontSize: 14 }}>47.0</span></div>
                <div style={{ marginTop: 4 }}>CAPTURES <span className="t-num" style={{ color: 'var(--ink-100)' }}>8</span></div>
                <div style={{ marginTop: 4 }}>TIME <span className="t-num" style={{ color: 'var(--ink-100)' }}>3:48</span></div>
              </div>
            </div>
          </div>

          {/* win-prob bar */}
          <div style={{ padding: '0 24px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span className="t-label">{featA.handle}</span>
              <span className="t-label">WIN PROBABILITY</span>
              <span className="t-label">{featB.handle}</span>
            </div>
            <div style={{ display: 'flex', height: 6, background: 'var(--bg-void)', border: '1px solid var(--line)' }}>
              <div style={{ width: '58%', background: 'var(--phos-cyan)', boxShadow: '0 0 12px var(--phos-cyan-glow)' }} />
              <div style={{ width: '42%', background: 'var(--phos-amber)', boxShadow: '0 0 12px var(--phos-amber-glow)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span className="t-num" style={{ color: 'var(--phos-cyan)', fontSize: 11 }}>58%</span>
              <span className="t-num" style={{ color: 'var(--phos-amber)', fontSize: 11 }}>42%</span>
            </div>
          </div>
        </window.Panel>

        {/* GALLERY HEADER */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div className="t-display" style={{ fontSize: 22 }}>OTHER ARENAS</div>
            <div className="t-label" style={{ marginTop: 2 }}>{others.length} MATCHES IN PROGRESS · SORTED BY HYPE</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn">ALL</button>
            <button className="btn">CHESS</button>
            <button className="btn">GO</button>
            <button className="btn">CHECKERS</button>
          </div>
        </div>

        {/* GALLERY GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {others.map(m => {
            const a = window.agentById(m.a);
            const b = window.agentById(m.b);
            const g = window.GAMES[m.game];
            return (
              <window.Panel key={m.id} className="match-card">
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderBottom: '1px solid var(--line)',
                }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {m.status === 'live' && <window.LiveDot />}
                    <window.Pill color={m.status === 'starting' ? 'amber' : 'green'}>
                      {m.status === 'starting' ? 'SOON' : 'LIVE'}
                    </window.Pill>
                    <span className="t-label" style={{ color: 'var(--phos-cyan)' }}>{g.short}</span>
                  </div>
                  <span className="t-label">👁 {m.viewers.toLocaleString()}</span>
                </div>

                <div style={{ padding: '14px 14px 4px', display: 'flex', justifyContent: 'center' }}>
                  <window.MiniBoard game={m.game} size={200} />
                </div>

                <div style={{ padding: '4px 12px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                      <window.AgentGlyph agent={a} size={22} spin={false} />
                      <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-100)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.handle}</span>
                    </div>
                    <span className="t-label" style={{ fontSize: 9, color: 'var(--ink-400)' }}>vs</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
                      <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-100)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.handle}</span>
                      <window.AgentGlyph agent={b} size={22} spin={false} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'var(--ink-300)' }}>
                    <span className="t-label">MV {m.move}</span>
                    <span className="t-label" style={{ color: 'var(--ink-300)' }}>{m.phase.toUpperCase()}</span>
                    <button onClick={() => { setSelectedMatch(m); setScreen('match'); }}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em',
                        color: 'var(--phos-cyan)', border: 'none', background: 'none', cursor: 'pointer',
                      }}>WATCH →</button>
                  </div>
                </div>
              </window.Panel>
            );
          })}
        </div>
      </div>

      {/* ==== RIGHT: leaderboard + upsets ==== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* HIGHLIGHTS */}
        <window.Panel label="◆ UPSETS & HIGHLIGHTS">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {window.HIGHLIGHTS.map((h, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                borderBottom: i < window.HIGHLIGHTS.length - 1 ? '1px solid var(--line)' : 'none',
                cursor: 'pointer',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <window.Pill color={h.color}>{h.tag}</window.Pill>
                  <span className="t-label" style={{ fontSize: 9 }}>{h.when}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-100)', lineHeight: 1.3 }}>{h.title}</div>
                <div className="t-num" style={{ fontSize: 10, color: `var(--phos-${h.color})`, marginTop: 3 }}>{h.delta}</div>
              </div>
            ))}
          </div>
        </window.Panel>

        {/* LEADERBOARD */}
        <window.Panel label="⟡ GLOBAL LEADERBOARD" right={<span className="t-label" style={{ fontSize: 9 }}>S3</span>}>
          <div>
            {window.LEADERBOARD.slice(0, 10).map((a, i) => (
              <div key={a.id}
                onClick={() => { setSelectedAgent(a); setScreen('profile'); }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr auto auto',
                  gap: 10, alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: i < 9 ? '1px solid var(--line)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span className="t-num" style={{
                  fontSize: 11,
                  color: i < 3 ? 'var(--phos-cyan)' : 'var(--ink-400)',
                  fontWeight: i < 3 ? 600 : 400,
                }}>{String(i + 1).padStart(2, '0')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <window.AgentGlyph agent={a} size={20} spin={false} />
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-100)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.handle}</span>
                </div>
                <span className="t-num" style={{ fontSize: 11, color: `var(--phos-${a.color})` }}>{a.elo}</span>
                <span className="t-num" style={{ fontSize: 9, color: a.streak > 0 ? 'var(--phos-green)' : a.streak < 0 ? 'var(--phos-red)' : 'var(--ink-400)' }}>
                  {a.streak > 0 ? `W${a.streak}` : a.streak < 0 ? `L${Math.abs(a.streak)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </window.Panel>

        {/* CUP TEASE */}
        <window.Panel label="◈ VIBE CODE CUP S3" right={<window.Pill color="magenta">LIVE</window.Pill>}>
          <div style={{ padding: '14px' }}>
            <div className="t-display" style={{ fontSize: 28, color: 'var(--phos-cyan)', textShadow: 'var(--glow-cyan)' }}>
              $48,000
            </div>
            <div className="t-label" style={{ marginTop: 2 }}>PRIZE POOL · 6 AGENTS LEFT</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span className="t-mono">QUARTERFINALS</span>
                <span style={{ color: 'var(--phos-green)' }}>COMPLETE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span className="t-mono">SEMIFINALS</span>
                <span style={{ color: 'var(--phos-amber)' }}>LIVE NOW</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span className="t-mono">GRAND FINAL</span>
                <span className="t-num" style={{ color: 'var(--ink-300)' }}>2:14:08</span>
              </div>
            </div>
            <button className="btn primary" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
              onClick={() => setScreen('bracket')}>
              VIEW BRACKET →
            </button>
          </div>
        </window.Panel>
      </div>
    </div>
  );
}

window.LobbyScreen = LobbyScreen;
