import { Button, Container } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { v1 as uuidv1 } from 'uuid';
import { useState, useCallback } from 'react';
import CopyWithToast from '../CopyWithToast.tsx';

const VERSION_META = {
  v4: { label: 'v4 — Random', desc: 'Cryptographically random, most common', color: 'var(--primary)' },
  v1: { label: 'v1 — Time-based', desc: 'Based on current timestamp + MAC address', color: 'var(--accent-violet)' },
};

export const UuidGenerator = () => {
  const [version, setVersion] = useState<'v4' | 'v1'>('v4');
  const [uuids, setUuids] = useState<string[]>([uuidv4()]);
  const [count, setCount] = useState(1);

  const generate = useCallback(() => {
    const fn = version === 'v4' ? uuidv4 : uuidv1;
    setUuids(Array.from({ length: count }, () => fn()));
  }, [version, count]);

  const allText = uuids.join('\n');

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">🆔</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">UUID Generator</h1>
          <p className="tool-header-desc">Generate universally unique identifiers — v4 random or v1 time-based.</p>
        </div>
        <span className="tool-badge tool-badge-info" style={{ flexShrink: 0 }}>
          {uuids.length} UUID{uuids.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="tool-card mb-4">
        <div className="tool-card-header">⚙️ Options</div>
        <div className="tool-card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                Version
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['v4', 'v1'] as const).map(v => {
                  const active = version === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setVersion(v)}
                      style={{
                        padding: '0.45rem 1.1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${active ? VERSION_META[v].color : 'var(--border-color)'}`,
                        background: active ? `color-mix(in srgb, ${VERSION_META[v].color} 12%, transparent)` : 'transparent',
                        color: active ? VERSION_META[v].color : 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.83rem',
                        cursor: 'pointer',
                        transition: 'all var(--duration) var(--ease)',
                      }}
                    >
                      {VERSION_META[v].label}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
                {VERSION_META[version].desc}
              </div>
            </div>

            <div style={{ flex: 1, maxWidth: '260px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                Quantity: {count}
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                <span>1</span><span>20</span>
              </div>
            </div>

            <Button variant="primary" onClick={generate} style={{ whiteSpace: 'nowrap' }}>
              ⟳ Generate
            </Button>
          </div>
        </div>
      </div>

      <div className="tool-card">
        <div className="tool-card-header">
          📋 Output
          <div className="tool-action-row ms-auto">
            <CopyWithToast text={allText} />
          </div>
        </div>
        <div className="tool-card-body" style={{ padding: '0.75rem' }}>
          {uuids.map((id, i) => (
            <div
              key={id + i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
                marginBottom: '0.15rem',
              }}
            >
              <span style={{
                width: '22px', height: '22px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                border: '1px solid var(--border-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', flexShrink: 0,
              }}>{i + 1}</span>
              <code style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.83rem',
                color: 'var(--text)',
                letterSpacing: '0.5px',
                userSelect: 'all',
              }}>
                {id.split('-').map((part, pi) => (
                  <span key={pi} style={{ color: ['#60a5fa','#34d399','#f59e0b','#a78bfa','#f87171'][pi] }}>
                    {part}{pi < 4 ? '-' : ''}
                  </span>
                ))}
              </code>
              <CopyWithToast text={id} />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
