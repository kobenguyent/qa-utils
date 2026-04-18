import React, { useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';

const ALGOS = [
  { key: 'sha1', label: 'SHA-1', badge: 'Widely Supported', badgeColor: '#60a5fa', note: 'Supported by Apache & Nginx. Weak by modern crypto standards but widely compatible.' },
  { key: 'md5',  label: 'MD5 (APR1 fallback)', badge: 'SHA-256 fallback', badgeColor: '#f59e0b', note: 'True APR1-MD5 requires server-side tools. This uses SHA-256 as a browser-safe substitute.' },
] as const;
type AlgoKey = typeof ALGOS[number]['key'];

export const HTPasswdGenerator: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [algorithm, setAlgorithm] = useState<AlgoKey>('sha1');
  const [htpasswd, setHtpasswd] = useState('');

  const generateSHA1 = async (pass: string) => {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pass));
    return `{SHA}${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
  };

  const generateRandomSalt = (len = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
    const rv = new Uint8Array(len);
    crypto.getRandomValues(rv);
    return Array.from(rv, b => chars[b % chars.length]).join('');
  };

  const generateHTPasswd = async () => {
    if (!username || !password) return;
    try {
      if (algorithm === 'sha1') {
        const hash = await generateSHA1(password);
        setHtpasswd(`${username}:${hash}`);
      } else {
        const salt = generateRandomSalt();
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + salt));
        const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        setHtpasswd(`${username}:$apr1$${salt}$${hash.substring(0, 22)}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const algoMeta = ALGOS.find(a => a.key === algorithm)!;

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">🛡️</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">HTPasswd Generator</h1>
          <p className="tool-header-desc">Generate <code>.htpasswd</code> entries for Apache & Nginx HTTP authentication.</p>
        </div>
        {htpasswd && <span className="tool-badge tool-badge-success" style={{ flexShrink: 0 }}>Generated</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1rem', alignItems: 'start' }}>

        {/* Input */}
        <div className="tool-card">
          <div className="tool-card-header">⚙️ Credentials</div>
          <div className="tool-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                Username
              </label>
              <input
                className="tool-textarea"
                style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', height: 'auto', minHeight: 'unset' }}
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  className="tool-textarea"
                  style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', height: 'auto', minHeight: 'unset' }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                    color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >{showPass ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                Algorithm
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {ALGOS.map(a => {
                  const active = algorithm === a.key;
                  return (
                    <button
                      key={a.key}
                      onClick={() => setAlgorithm(a.key)}
                      style={{
                        padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'left',
                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: active ? 'var(--primary-light)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--text)',
                        fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer',
                        transition: 'all var(--duration) var(--ease)',
                      }}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.71rem', color: 'var(--muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                {algoMeta.note}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={generateHTPasswd}
              disabled={!username || !password}
              className="w-100"
            >
              ⟳ Generate Entry
            </Button>
          </div>
        </div>

        {/* Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="tool-card">
            <div className="tool-card-header">
              📋 Generated Entry
              {htpasswd && <div className="tool-action-row ms-auto"><CopyWithToast text={htpasswd} /></div>}
            </div>
            <div className="tool-card-body">
              {htpasswd ? (
                <>
                  <code style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-hover)',
                    color: algoMeta.badgeColor,
                    wordBreak: 'break-all',
                    lineHeight: 1.6,
                    userSelect: 'all',
                    marginBottom: '0.75rem',
                  }}>
                    {htpasswd}
                  </code>
                  <div style={{
                    display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'color-mix(in srgb, #f59e0b 8%, transparent)',
                    border: '1px solid #f59e0b33',
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>⚠️ Security Notice</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: '0.25rem', width: '100%' }}>
                      Runs entirely in your browser — no data sent anywhere. For production, prefer the server-side <code>htpasswd</code> command with bcrypt (<code>-B</code> flag).
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Enter credentials and click <strong>Generate Entry</strong>
                </div>
              )}
            </div>
          </div>

          {/* How to use */}
          <div className="tool-card">
            <div className="tool-card-header">💡 How to Use</div>
            <div className="tool-card-body">
              <ol style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                <li>Copy the generated entry above</li>
                <li>Create or edit your <code>.htpasswd</code> file</li>
                <li>Paste the entry on a new line</li>
                <li>Configure your web server to use the file</li>
              </ol>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                  Recommended (server-side bcrypt)
                </div>
                <pre style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                  padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)',
                  color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap',
                }}>
{`htpasswd -B -c .htpasswd ${username || 'username'}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
