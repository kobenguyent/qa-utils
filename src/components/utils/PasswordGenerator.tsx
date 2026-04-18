import React, { useState, useMemo } from 'react';
import { Container, Button } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

const CHAR_TYPES = [
  { key: 'upper', label: 'A–Z', desc: 'Uppercase', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', color: '#60a5fa' },
  { key: 'lower', label: 'a–z', desc: 'Lowercase', chars: 'abcdefghijklmnopqrstuvwxyz', color: '#34d399' },
  { key: 'numbers', label: '0–9', desc: 'Numbers', chars: '0123456789', color: '#f59e0b' },
  { key: 'symbols', label: '!@#', desc: 'Symbols', chars: '!@#$%^&*()_+-=[]{}|;:,.<>?', color: '#f87171' },
] as const;

type CharKey = typeof CHAR_TYPES[number]['key'];

const STRENGTH_CONFIG = [
  { label: 'Weak', color: '#f87171', segments: 1 },
  { label: 'Fair', color: '#f59e0b', segments: 2 },
  { label: 'Good', color: '#60a5fa', segments: 3 },
  { label: 'Strong', color: '#34d399', segments: 4 },
];

export const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [enabled, setEnabled] = useState<Record<CharKey, boolean>>({
    upper: true, lower: true, numbers: true, symbols: true,
  });
  const ai = useAIAssistant();

  const strengthIdx = useMemo(() => {
    if (!password) return -1;
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 20) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 1) return 0;
    if (score <= 2) return 1;
    if (score <= 3) return 2;
    return 3;
  }, [password]);

  const generatePassword = () => {
    const charset = CHAR_TYPES.filter(t => enabled[t.key]).map(t => t.chars).join('');
    if (!charset) return;
    setPassword(Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join(''));
  };

  const strength = strengthIdx >= 0 ? STRENGTH_CONFIG[strengthIdx] : null;

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">🔑</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Password Generator</h1>
          <p className="tool-header-desc">Generate secure random passwords with full control over complexity.</p>
        </div>
        {strength && (
          <span className="tool-badge" style={{
            flexShrink: 0,
            background: `color-mix(in srgb, ${strength.color} 12%, transparent)`,
            border: `1px solid ${strength.color}66`,
            color: strength.color,
          }}>
            {strength.label}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem', alignItems: 'start' }}>

        {/* Settings */}
        <div className="tool-card">
          <div className="tool-card-header">⚙️ Settings</div>
          <div className="tool-card-body">
            {/* Length */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Length</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>{length}</span>
              </div>
              <input
                type="range"
                min={4}
                max={64}
                value={length}
                onChange={e => setLength(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                <span>4</span><span>64</span>
              </div>
            </div>

            {/* Character type chips */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                Character Types
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {CHAR_TYPES.map(t => {
                  const on = enabled[t.key];
                  return (
                    <button
                      key={t.key}
                      onClick={() => setEnabled(prev => ({ ...prev, [t.key]: !prev[t.key] }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.7rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${on ? t.color : 'var(--border-color)'}`,
                        background: on ? `color-mix(in srgb, ${t.color} 10%, transparent)` : 'transparent',
                        color: on ? t.color : 'var(--muted)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all var(--duration) var(--ease)',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800 }}>{t.label}</span>
                      <span style={{ opacity: 0.8 }}>{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button variant="primary" onClick={generatePassword} className="w-100">
              ⟳ Generate Password
            </Button>

            {ai.isConfigured ? (
              <>
                <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                <AIAssistButton
                  label="Generate Passphrase"
                  onClick={async () => {
                    try {
                      const response = await ai.sendRequest(
                        'You are a security expert. Generate a single memorable but secure passphrase. Return ONLY the passphrase.',
                        `Generate a memorable passphrase approximately ${length} characters long.`
                      );
                      setPassword(response);
                    } catch { /* handled */ }
                  }}
                  isLoading={ai.isLoading}
                  error={ai.error}
                  onClear={ai.clear}
                />
              </>
            ) : (
              <AIConfigureHint className="mt-3" />
            )}
          </div>
        </div>

        {/* Output */}
        <div className="tool-card">
          <div className="tool-card-header">
            🔐 Output
            {password && <div className="tool-action-row ms-auto"><CopyWithToast text={password} /></div>}
          </div>
          <div className="tool-card-body">
            {password ? (
              <>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.05rem',
                  letterSpacing: '1.5px',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-hover)',
                  wordBreak: 'break-all',
                  lineHeight: 1.7,
                  color: 'var(--text)',
                  marginBottom: '0.75rem',
                  userSelect: 'all',
                }}>
                  {password.split('').map((ch, i) => {
                    const type = CHAR_TYPES.find(t => t.chars.includes(ch));
                    return <span key={i} style={{ color: type?.color ?? 'var(--text)' }}>{ch}</span>;
                  })}
                </div>

                {/* Strength bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Strength</span>
                    {strength && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: strength.color }}>{strength.label}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '3px', height: '5px' }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1,
                        borderRadius: '999px',
                        background: (strength && i < strength.segments) ? strength.color : 'var(--border-color)',
                        transition: 'background 0.3s ease',
                      }} />
                    ))}
                  </div>
                </div>

                {/* Character breakdown */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {CHAR_TYPES.map(t => {
                    const cnt = password.split('').filter(ch => t.chars.includes(ch)).length;
                    if (!cnt) return null;
                    return (
                      <span key={t.key} style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: `color-mix(in srgb, ${t.color} 10%, transparent)`,
                        border: `1px solid ${t.color}44`,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: t.color,
                      }}>
                        {t.desc}: {cnt}
                      </span>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Click <strong>Generate Password</strong> to create a secure password
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};
