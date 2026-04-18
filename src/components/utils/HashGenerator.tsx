import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Button } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

const ALGOS = [
  { key: 'sha256', label: 'SHA-256', badge: '✅ Recommended', badgeColor: '#34d399', note: 'Most widely used, secure for most applications.' },
  { key: 'sha512', label: 'SHA-512', badge: '🔒 Most Secure', badgeColor: '#60a5fa', note: 'Higher security, larger hash output.' },
  { key: 'sha1',   label: 'SHA-1',   badge: '⚠️ Deprecated', badgeColor: '#f59e0b', note: 'Deprecated for security use. Legacy only.' },
] as const;
type AlgoKey = typeof ALGOS[number]['key'];

export const HashGenerator: React.FC = () => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Partial<Record<AlgoKey, string>>>({});
  const [isHashing, setIsHashing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ai = useAIAssistant();

  const bufferToHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

  const generateHashes = useCallback(async (text: string) => {
    if (!text.trim()) { setHashes({}); return; }
    setIsHashing(true);
    const data = new TextEncoder().encode(text);
    const results: Partial<Record<AlgoKey, string>> = {};
    try {
      results.sha256 = bufferToHex(await crypto.subtle.digest('SHA-256', data));
      results.sha512 = bufferToHex(await crypto.subtle.digest('SHA-512', data));
      results.sha1   = bufferToHex(await crypto.subtle.digest('SHA-1',   data));
      setHashes(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHashing(false);
    }
  }, []);

  // Live hashing — debounced 300 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => generateHashes(input), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, generateHashes]);

  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasResults = Object.keys(hashes).length > 0;
  const byteCount = new TextEncoder().encode(input).length;

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      textareaRef.current?.focus();
    } catch { /* permission denied */ }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('text')) {
      const reader = new FileReader();
      reader.onload = ev => setInput(String(ev.target?.result ?? ''));
      reader.readAsText(file);
    } else {
      const text = e.dataTransfer.getData('text/plain');
      if (text) setInput(text);
    }
  };

  const copyAll = () => {
    const text = ALGOS
      .map(a => `${a.label}: ${hashes[a.key] ?? ''}`)
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">#️⃣</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Hash Generator</h1>
          <p className="tool-header-desc">Generate cryptographic hashes — SHA-256, SHA-512, and SHA-1.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'clamp(280px,38%,420px) 1fr', gap: '1rem', alignItems: 'start' }}>

        {/* Input */}
        <div>
          <div className="tool-card mb-4">
            <div className="tool-card-header" style={{ justifyContent: 'space-between' }}>
              <span>✏️ Input</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  aria-label="Paste from clipboard"
                  onClick={pasteFromClipboard}
                  title="Paste from clipboard"
                  style={{
                    background: 'transparent', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)', padding: '0.1rem 0.5rem',
                    cursor: 'pointer', color: 'var(--muted)', fontSize: '0.68rem',
                    fontWeight: 600, letterSpacing: '0.3px',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)'; }}
                >
                  📋 Paste
                </button>
                {input && (
                  <button
                    aria-label="Clear input"
                    onClick={() => { setInput(''); textareaRef.current?.focus(); }}
                    title="Clear"
                    style={{
                      background: 'transparent', border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)', padding: '0.1rem 0.5rem',
                      cursor: 'pointer', color: 'var(--muted)', fontSize: '0.68rem',
                      fontWeight: 600, letterSpacing: '0.3px',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger, #dc2626)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--danger, #dc2626)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)'; }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
            <div className="tool-card-body" style={{ padding: '0.85rem' }}>
              {/* Drop zone wrapper */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                  borderRadius: 'var(--radius-md)',
                  outline: isDragging ? '2px dashed var(--primary)' : '2px dashed transparent',
                  outlineOffset: '3px',
                  transition: 'outline-color 0.15s',
                }}
              >
                <textarea
                  ref={textareaRef}
                  className="tool-textarea"
                  rows={8}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type, paste, or drop a text file here…"
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                  }}
                />
              </div>
              {/* Stats bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
                fontSize: '0.72rem',
                color: input ? 'var(--muted)' : 'transparent',
                transition: 'color 0.2s',
                userSelect: 'none',
              }}>
                <span>{input.length.toLocaleString()} chars</span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  {isHashing && (
                    <span style={{
                      display: 'inline-block', width: '0.5rem', height: '0.5rem',
                      borderRadius: '50%', background: 'var(--primary)',
                      animation: 'pulse 1s ease-in-out infinite',
                    }} />
                  )}
                  {byteCount.toLocaleString()} bytes
                </span>
              </div>
            </div>
          </div>

          {/* Info + AI */}
          <div className="tool-card">
            <div className="tool-card-header">ℹ️ About Hashing</div>
            <div className="tool-card-body">
              <ul style={{ fontSize: '0.82rem', color: 'var(--muted)', paddingLeft: '1.1rem', margin: 0 }}>
                <li style={{ marginBottom: '0.35rem' }}>Hashes are <strong>one-way</strong> — you cannot reverse them</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>SHA-256</strong> is recommended for most use cases</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>SHA-512</strong> is stronger but produces longer output</li>
                <li><strong>SHA-1</strong> is deprecated for security-sensitive use</li>
              </ul>

              {ai.isConfigured ? (
                <div style={{ marginTop: '1rem' }}>
                  <AIAssistButton
                    label="Explain Hash Security"
                    onClick={async () => {
                      try {
                        await ai.sendRequest(
                          'You are a cryptography expert. Explain hash algorithm security concisely.',
                          `The user hashed "${input}" using SHA-1, SHA-256, and SHA-512. Explain the security of each.`
                        );
                      } catch { /* handled */ }
                    }}
                    isLoading={ai.isLoading}
                    disabled={!input.trim()}
                    error={ai.error}
                    result={ai.result}
                    onClear={ai.clear}
                  />
                </div>
              ) : (
                <AIConfigureHint className="mt-3" />
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="tool-card">
          <div className="tool-card-header" style={{ justifyContent: 'space-between' }}>
            <span>🔐 Hash Results</span>
            {hasResults && (
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={copyAll}
                style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', marginLeft: 'auto' }}
              >
                Copy All
              </Button>
            )}
          </div>
          <div className="tool-card-body">
            {input.trim() ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ALGOS.map(algo => {
                  const hash = hashes[algo.key];
                  return (
                    <div key={algo.key} style={{
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden',
                      opacity: isHashing ? 0.6 : 1,
                      transition: 'opacity 0.2s ease',
                    }}>
                      {/* Algorithm header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.55rem 0.85rem',
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)' }}>{algo.label}</span>
                        <span style={{
                          padding: '0.1rem 0.5rem',
                          borderRadius: '999px',
                          background: `color-mix(in srgb, ${algo.badgeColor} 12%, transparent)`,
                          border: `1px solid ${algo.badgeColor}44`,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: algo.badgeColor,
                        }}>
                          {algo.badge}
                        </span>
                        <div className="ms-auto">
                          {hash && <CopyWithToast text={hash} />}
                        </div>
                      </div>
                      {/* Hash value */}
                      <div style={{ padding: '0.65rem 0.85rem' }}>
                        {hash ? (
                          <>
                            <code style={{
                              display: 'block',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.72rem',
                              color: algo.badgeColor,
                              wordBreak: 'break-all',
                              lineHeight: 1.6,
                              userSelect: 'all',
                            }}>
                              {hash}
                            </code>
                            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                              {hash.length / 2 * 8} bits · {hash.length} hex chars
                            </div>
                          </>
                        ) : (
                          /* Skeleton shimmer while hashing */
                          <div style={{
                            height: '2.4rem', borderRadius: 'var(--radius-sm)',
                            background: 'linear-gradient(90deg, var(--border-color) 25%, var(--bg-secondary) 50%, var(--border-color) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.4s infinite',
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* True empty state — skeleton cards hint at what's coming */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', opacity: 0.35 }}>🔐</span>
                  Start typing to generate hashes instantly
                </div>
                {ALGOS.map(algo => (
                  <div key={algo.key} style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    marginBottom: '0.75rem',
                    opacity: 0.45,
                  }}>
                    <div style={{
                      padding: '0.55rem 0.85rem',
                      background: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                    }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)' }}>{algo.label}</span>
                      <span style={{
                        padding: '0.1rem 0.5rem', borderRadius: '999px',
                        background: `color-mix(in srgb, ${algo.badgeColor} 12%, transparent)`,
                        border: `1px solid ${algo.badgeColor}44`,
                        fontSize: '0.68rem', fontWeight: 700, color: algo.badgeColor,
                      }}>{algo.badge}</span>
                    </div>
                    <div style={{ padding: '0.65rem 0.85rem' }}>
                      <div style={{
                        height: '1rem', borderRadius: 4,
                        background: 'var(--border-color)', width: '90%',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};