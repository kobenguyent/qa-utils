import React, { useState, useEffect, useRef } from 'react';
import { Button, Container, Form, Badge } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
  WebSocketClient,
  WebSocketConfig,
  WebSocketResponse,
  isValidWebSocketUrl,
  formatWebSocketMessage,
  createWebSocketClient,
} from '../../utils/websocketClient';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

interface ConnectionHistory {
  id: string;
  config: WebSocketConfig;
  timestamp: number;
  status: 'success' | 'failed';
}

// ─── Message type colour map ──────────────────────────────────────────────────
const MSG_COLORS: Record<string, { bg: string; color: string }> = {
  sent:           { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  received:       { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
  error:          { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  connection:     { bg: 'rgba(56,189,248,0.15)',  color: '#38bdf8' },
  disconnection:  { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  connecting:   { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', label: 'Connecting…' },
  open:         { bg: 'rgba(52,211,153,0.15)',   color: '#34d399', label: 'Connected' },
  closing:      { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', label: 'Closing…' },
  closed:       { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'Disconnected' },
};

const codeStyle: React.CSSProperties = {
  background: 'var(--code-bg)',
  borderRadius: 'var(--radius-md)',
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  lineHeight: 1.7,
  color: 'var(--text)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
};

export const WebSocketClientComponent: React.FC = () => {
  const [config, setConfig] = useState<WebSocketConfig>({
    url: 'wss://echo.websocket.org',
    protocols: [],
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    timeout: 30000,
  });

  const [messageInput, setMessageInput] = useState('{"type": "ping", "data": "Hello WebSocket!"}');
  const [response, setResponse] = useState<WebSocketResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<ConnectionHistory[]>([]);
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const ai = useAIAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [response?.messages]);

  // ── handlers ─────────────────────────────────────────────────────
  const handleConnect = async () => {
    try {
      setError('');
      if (!isValidWebSocketUrl(config.url)) {
        setError('Please enter a valid WebSocket URL (ws:// or wss://)');
        return;
      }
      if (client) client.disconnect();
      const newClient = createWebSocketClient(config);
      newClient.onUpdateCallback((r: WebSocketResponse) => setResponse(r));
      await newClient.connect();
      setClient(newClient);
      setHistory(prev => [{ id: `conn_${Date.now()}`, config: { ...config }, timestamp: Date.now(), status: 'success' }, ...prev.slice(0, 9)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
      setHistory(prev => [{ id: `conn_${Date.now()}`, config: { ...config }, timestamp: Date.now(), status: 'failed' }, ...prev.slice(0, 9)]);
    }
  };

  const handleDisconnect = () => { if (client) { client.disconnect(); setClient(null); } };

  const handleSendMessage = () => {
    if (!client || client.getConnectionState() !== 'open') { setError('WebSocket is not connected'); return; }
    if (!messageInput.trim()) { setError('Please enter a message to send'); return; }
    try { client.sendMessage(messageInput); setError(''); } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleClearMessages = () => { if (client) client.clearMessages(); setResponse(null); };

  const connState = client?.getConnectionState() ?? 'closed';
  const st = STATUS_COLORS[connState] ?? STATUS_COLORS.closed;
  const isConnected = connState === 'open';
  const isConnecting = connState === 'connecting';

  // ── pill helper ──────────────────────────────────────────────────
  const Pill = ({ type, label }: { type: string; label: string }) => {
    const c = MSG_COLORS[type] ?? { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.55rem',
        borderRadius: '999px', background: c.bg, color: c.color,
        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
      }}>{label}</span>
    );
  };

  return (
    <Container className="py-4">
      {/* ── Header ── */}
      <div className="tool-header">
        <div className="tool-header-icon">🔌</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">WebSocket Client</h1>
          <p className="tool-header-desc">Real-time WebSocket testing and debugging tool</p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.75rem', borderRadius: '999px',
          background: st.bg, border: `1px solid ${st.color}44`, color: st.color,
          fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
        }}>
          ● {st.label}
        </span>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 'var(--radius-md)', padding: '0.65rem 1rem', marginBottom: '1rem',
          color: '#f87171', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1rem' }}>×</button>
        </div>
      )}

      {/* ── Connection Configuration ── */}
      <div className="tool-card" style={{ marginBottom: '1rem' }}>
        <div className="tool-card-header">🛰️ Connection Configuration</div>
        <div className="tool-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>WebSocket URL *</label>
              <Form.Control
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="wss://echo.websocket.org"
                disabled={isConnected || isConnecting}
                className="tool-textarea"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>Protocols</label>
              <Form.Control
                type="text"
                value={Array.isArray(config.protocols) ? config.protocols.join(', ') : config.protocols || ''}
                onChange={(e) => setConfig({ ...config, protocols: e.target.value.split(',').map(p => p.trim()).filter(p => p) })}
                placeholder="chat, superchat"
                disabled={isConnected || isConnecting}
                className="tool-textarea"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end', marginBottom: '1rem' }}>
            <Form.Check
              type="checkbox"
              label={<span style={{ fontSize: '0.82rem', fontWeight: 500 }}>Auto Reconnect</span>}
              checked={config.autoReconnect}
              onChange={(e) => setConfig({ ...config, autoReconnect: e.target.checked })}
              disabled={isConnected || isConnecting}
              style={{ paddingTop: '0.35rem' }}
            />
            {[
              { label: 'Reconnect Interval (ms)', key: 'reconnectInterval' as const, val: config.reconnectInterval || 3000, disabled: !config.autoReconnect },
              { label: 'Max Attempts', key: 'maxReconnectAttempts' as const, val: config.maxReconnectAttempts || 5, disabled: !config.autoReconnect },
              { label: 'Timeout (ms)', key: 'timeout' as const, val: config.timeout || 30000, disabled: false },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.2rem', display: 'block' }}>{f.label}</label>
                <Form.Control
                  type="number"
                  value={f.val}
                  onChange={(e) => setConfig({ ...config, [f.key]: parseInt(e.target.value) || 0 })}
                  disabled={isConnected || isConnecting || f.disabled}
                  className="tool-textarea"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button size="sm" onClick={handleConnect} disabled={isConnected || isConnecting}
              style={{ background: 'var(--primary)', border: 'none', fontWeight: 600, padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-md)' }}>
              {isConnecting ? '⏳ Connecting…' : '🔗 Connect'}
            </Button>
            <Button size="sm" variant="outline-danger" onClick={handleDisconnect} disabled={!isConnected && !isConnecting}
              style={{ fontWeight: 600, padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-md)' }}>
              ✕ Disconnect
            </Button>
          </div>
        </div>
      </div>

      {/* ── Send Message ── */}
      {isConnected && (
        <div className="tool-card" style={{ marginBottom: '1rem' }}>
          <div className="tool-card-header">📤 Send Message</div>
          <div className="tool-card-body">
            <textarea
              className="tool-textarea"
              rows={3}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder='Enter message to send (JSON recommended)'
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginBottom: '0.6rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button size="sm" onClick={handleSendMessage}
                style={{ background: '#34d399', border: 'none', fontWeight: 600, padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-md)', color: '#000' }}>
                🚀 Send
              </Button>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Tip: Use JSON for structured messages</span>
            </div>
            {ai.isConfigured ? (
              <AIAssistButton
                label="Generate Message"
                onClick={async () => {
                  try {
                    const r = await ai.sendRequest(
                      'You are a WebSocket messaging expert. Generate a JSON message payload based on the user\'s description. Return ONLY the JSON without any explanation or markdown formatting.',
                      `Generate a WebSocket JSON message for: ${messageInput || 'a test ping message'}`
                    );
                    setMessageInput(r);
                  } catch { /* error displayed by AIAssistButton */ }
                }}
                isLoading={ai.isLoading}
                error={ai.error}
                onClear={ai.clear}
                className="mt-2"
              />
            ) : (
              <AIConfigureHint className="mt-2" />
            )}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      {response && response.messages.length > 0 && (
        <div className="tool-card" style={{ marginBottom: '1rem' }}>
          <div className="tool-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>💬 Messages <Badge pill bg="" style={{ background: 'var(--primary)', fontSize: '0.7rem', marginLeft: '0.4rem' }}>{response.messages.length}</Badge></span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={handleClearMessages}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.2rem 0.6rem', fontSize: '0.72rem', color: 'var(--muted)', cursor: 'pointer' }}>
                🗑️ Clear
              </button>
              <CopyWithToast text={response.messages.map(msg => formatWebSocketMessage(msg)).join('\n\n')} />
            </div>
          </div>
          <div className="tool-card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {response.messages.map((message) => (
              <div key={message.id} style={{
                padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pill type={message.type} label={message.type} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.status && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--muted)', background: 'var(--bg-secondary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {message.status}
                      </span>
                    )}
                  </div>
                  <CopyWithToast text={formatWebSocketMessage(message)} />
                </div>
                <pre style={codeStyle}><code>{message.data}</code></pre>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* ── Connection History ── */}
      {history.length > 0 && (
        <div className="tool-card">
          <div className="tool-card-header">🕐 Connection History</div>
          <div className="tool-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {history.map((entry) => {
              const ok = entry.status === 'success';
              return (
                <div key={entry.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                  background: ok ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                  border: `1px solid ${ok ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pill type={ok ? 'received' : 'error'} label={entry.status} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{entry.config.url}</span>
                    {entry.config.protocols && Array.isArray(entry.config.protocols) && entry.config.protocols.length > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>({entry.config.protocols.join(', ')})</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Container>
  );
};