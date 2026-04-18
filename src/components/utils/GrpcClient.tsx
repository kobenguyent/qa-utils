import React, { useState } from 'react';
import { Button, Container, Form, Badge } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
  GrpcClient,
  GrpcConfig,
  GrpcMessage,
  GrpcResponse,
  isValidGrpcUrl,
  formatGrpcMessage,
  parseProtobufDefinition,
  createGrpcClient,
} from '../../utils/grpcClient';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

interface RequestHistory {
  id: string;
  config: GrpcConfig;
  request: string;
  response?: GrpcResponse;
  error?: string;
  timestamp: number;
}

interface UIGrpcConfig {
  url: string;
  service: string;
  method: string;
  metadata: string; // UI state as string
  timeout: number;
}

export const GrpcClientComponent: React.FC = () => {
  const [config, setConfig] = useState<UIGrpcConfig>({
    url: 'https://api.example.com',
    service: 'UserService',
    method: 'GetUser',
    metadata: '',
    timeout: 30000,
  });

  const [request, setRequest] = useState('{\n  "id": 123\n}');
  const [protoDefinition, setProtoDefinition] = useState('');
  const [response, setResponse] = useState<GrpcResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [client, setClient] = useState<GrpcClient | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<GrpcMessage[]>([]);
  const ai = useAIAssistant();

  // Parse metadata from textarea
  const parseMetadata = (metadataText: string): Record<string, string> => {
    const metadata: Record<string, string> = {};
    metadataText.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        metadata[key.trim()] = valueParts.join(':').trim();
      }
    });
    return metadata;
  };

  // Format metadata for display
  const formatMetadata = (metadata: Record<string, string>): string => {
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  const handleUnaryCall = async () => {
    try {
      setLoading(true);
      setError('');
      setResponse(null);

      if (!isValidGrpcUrl(config.url)) {
        setError('Please enter a valid gRPC URL (http:// or https://)');
        return;
      }

      if (!config.service.trim() || !config.method.trim()) {
        setError('Service and Method names are required');
        return;
      }

      if (!request.trim()) {
        setError('Request body is required');
        return;
      }

      // Validate JSON request
      try {
        JSON.parse(request);
      } catch {
        setError('Request must be valid JSON');
        return;
      }

      const grpcConfig: GrpcConfig = {
        url: config.url,
        service: config.service,
        method: config.method,
        metadata: parseMetadata(config.metadata),
        timeout: config.timeout,
      };

      const grpcClient = createGrpcClient(grpcConfig);
      setClient(grpcClient);

      const result = await grpcClient.makeUnaryCall(request);
      setResponse(result);

      // Add to history
      const historyEntry: RequestHistory = {
        id: `req_${Date.now()}`,
        config: grpcConfig,
        request,
        response: result,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

    } catch (err: any) {
      const errorMsg = err.message || 'gRPC call failed';
      setError(errorMsg);
      
      // Add error to history
      const historyEntry: RequestHistory = {
        id: `req_${Date.now()}`,
        config: {
          url: config.url,
          service: config.service,
          method: config.method,
          metadata: parseMetadata(config.metadata),
          timeout: config.timeout,
        },
        request,
        error: errorMsg,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamingCall = async () => {
    try {
      setLoading(true);
      setError('');
      setStreamingMessages([]);

      if (!isValidGrpcUrl(config.url)) {
        setError('Please enter a valid gRPC URL (http:// or https://)');
        return;
      }

      if (!config.service.trim() || !config.method.trim()) {
        setError('Service and Method names are required');
        return;
      }

      // Validate JSON request
      try {
        JSON.parse(request);
      } catch {
        setError('Request must be valid JSON');
        return;
      }

      const grpcConfig: GrpcConfig = {
        url: config.url,
        service: config.service,
        method: config.method,
        metadata: parseMetadata(config.metadata),
        timeout: config.timeout,
      };

      const grpcClient = createGrpcClient(grpcConfig);
      setClient(grpcClient);

      const onMessage = (message: GrpcMessage) => {
        setStreamingMessages(prev => [...prev, message]);
      };

      const result = await grpcClient.makeStreamingCall(request, onMessage);
      setResponse(result);

    } catch (err: any) {
      setError(err.message || 'gRPC streaming call failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (client) {
      client.cancel();
      setLoading(false);
    }
  };

  const loadFromHistory = (entry: RequestHistory) => {
    setConfig({
      url: entry.config.url,
      service: entry.config.service,
      method: entry.config.method,
      metadata: formatMetadata(entry.config.metadata || {}),
      timeout: entry.config.timeout || 30000,
    });
    setRequest(entry.request);
    setResponse(entry.response || null);
    setError(entry.error || '');
  };

  const parseProtoFile = () => {
    if (!protoDefinition.trim()) {
      setError('Please enter a protobuf definition');
      return;
    }

    try {
      const definition = parseProtobufDefinition(protoDefinition);
      setConfig(prev => ({
        ...prev,
        service: definition.serviceName,
        method: definition.methods[0]?.name || '',
      }));
      setError('');
    } catch (err: any) {
      setError(`Failed to parse protobuf: ${err.message}`);
    }
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return '#f87171';
    if (status >= 200 && status < 300) return '#34d399';
    if (status >= 400) return '#f87171';
    return '#fbbf24';
  };

  const getMsgColor = (type: GrpcMessage['type']) => {
    const map: Record<string, { bg: string; color: string }> = {
      request:  { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
      response: { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
      error:    { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
      stream:   { bg: 'rgba(56,189,248,0.15)',  color: '#38bdf8' },
    };
    return map[type] ?? { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
  };

  const Pill = ({ type, label }: { type: string; label: string }) => {
    const c = getMsgColor(type as GrpcMessage['type']);
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.55rem',
        borderRadius: '999px', background: c.bg, color: c.color,
        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
      }}>{label}</span>
    );
  };

  const codeStyle: React.CSSProperties = {
    background: 'var(--code-bg)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
    fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.7, color: 'var(--text)',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, overflowX: 'auto',
  };

  return (
    <Container className="py-4">
      {/* ── Header ── */}
      <div className="tool-header">
        <div className="tool-header-icon">⚡</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">gRPC Client</h1>
          <p className="tool-header-desc">Test gRPC services with gRPC-Web support</p>
        </div>
        {response && (() => {
          const sc = getStatusColor(response.status);
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.75rem', borderRadius: '999px',
              background: `${sc}18`, border: `1px solid ${sc}44`, color: sc,
              fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
            }}>
              {response.status === 0 ? 'No Response' : response.status}
              <span style={{ fontWeight: 400, fontSize: '0.72rem', opacity: 0.8 }}>· {response.duration}ms</span>
            </span>
          );
        })()}
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

      {/* ── Tab switcher ── */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
        {(['manual', 'proto'] as const).map(tab => {
          const labels: Record<string, string> = { manual: '⚙️ Manual Configuration', proto: '📋 Protobuf Definition' };
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.4rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--muted)',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
              }}>
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Manual Configuration Tab ── */}
      {activeTab === 'manual' && (
        <>
          <div className="tool-card" style={{ marginBottom: '1rem' }}>
            <div className="tool-card-header">🛰️ gRPC Configuration</div>
            <div className="tool-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>Server URL *</label>
                  <Form.Control type="text" value={config.url} onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://api.example.com" className="tool-textarea" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
                </div>
                <div style={{ minWidth: '140px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>Service *</label>
                  <Form.Control type="text" value={config.service} onChange={(e) => setConfig({ ...config, service: e.target.value })}
                    placeholder="UserService" className="tool-textarea" style={{ fontSize: '0.85rem' }} />
                </div>
                <div style={{ minWidth: '140px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>Method *</label>
                  <Form.Control type="text" value={config.method} onChange={(e) => setConfig({ ...config, method: e.target.value })}
                    placeholder="GetUser" className="tool-textarea" style={{ fontSize: '0.85rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>Metadata (key: value per line)</label>
                  <textarea className="tool-textarea" rows={3} value={config.metadata}
                    onChange={(e) => setConfig({ ...config, metadata: e.target.value })}
                    placeholder={`authorization: Bearer token\nuser-id: 12345`}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }} />
                </div>
                <div style={{ minWidth: '120px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>Timeout (ms)</label>
                  <Form.Control type="number" value={config.timeout} onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) || 30000 })}
                    className="tool-textarea" style={{ fontSize: '0.85rem' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="tool-card" style={{ marginBottom: '1rem' }}>
            <div className="tool-card-header">📤 Request</div>
            <div className="tool-card-body">
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>Request Body (JSON) *</label>
              <textarea className="tool-textarea" rows={8} value={request} onChange={(e) => setRequest(e.target.value)}
                placeholder={`{\n  "id": 123,\n  "name": "John Doe"\n}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginBottom: '0.6rem' }} />
              {ai.isConfigured ? (
                <AIAssistButton
                  label="Generate Request Body"
                  onClick={async () => {
                    try {
                      const r = await ai.sendRequest(
                        'You are a gRPC expert. Generate a JSON request body for the given gRPC service and method. Return ONLY the JSON without any explanation or markdown formatting.',
                        `Generate a gRPC JSON request body for service "${config.service}", method "${config.method}". ${protoDefinition ? `Proto definition:\n${protoDefinition}` : 'Generate a reasonable sample request.'}`
                      );
                      setRequest(r);
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
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <Button size="sm" onClick={handleUnaryCall} disabled={loading}
                  style={{ background: 'var(--primary)', border: 'none', fontWeight: 600, padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-md)' }}>
                  {loading ? '⏳ Calling…' : '📡 Unary Call'}
                </Button>
                <Button size="sm" onClick={handleStreamingCall} disabled={loading}
                  style={{ background: '#38bdf8', border: 'none', fontWeight: 600, padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-md)', color: '#000' }}>
                  {loading ? '⏳ Streaming…' : '🌊 Streaming Call'}
                </Button>
                {loading && (
                  <Button size="sm" variant="outline-danger" onClick={handleCancel}
                    style={{ fontWeight: 600, padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-md)' }}>
                    ✕ Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Protobuf Definition Tab ── */}
      {activeTab === 'proto' && (
        <div className="tool-card" style={{ marginBottom: '1rem' }}>
          <div className="tool-card-header">📋 Parse Protobuf Definition</div>
          <div className="tool-card-body">
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>
              .proto file content
            </label>
            <textarea className="tool-textarea" rows={12} value={protoDefinition} onChange={(e) => setProtoDefinition(e.target.value)}
              placeholder={`syntax = "proto3";\n\nservice UserService {\n  rpc GetUser(GetUserRequest) returns (GetUserResponse);\n}\n\nmessage GetUserRequest {\n  int32 id = 1;\n}`}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginBottom: '0.6rem' }} />
            <Button size="sm" onClick={parseProtoFile}
              style={{ background: 'var(--primary)', border: 'none', fontWeight: 600, padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-md)' }}>
              ⚙️ Parse & Configure
            </Button>
          </div>
        </div>
      )}

      {/* ── Response ── */}
      {response && (
        <div className="tool-card" style={{ marginBottom: '1rem' }}>
          <div className="tool-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📥 Response</span>
            <CopyWithToast text={JSON.stringify(response, null, 2)} />
          </div>
          <div className="tool-card-body">
            <div style={{ marginBottom: '0.75rem' }}>
              {response.messages.map((message) => (
                <div key={message.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Pill type={message.type} label={message.type} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{new Date(message.timestamp).toLocaleTimeString()}</span>
                      {message.duration && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>({message.duration}ms)</span>}
                    </div>
                    <CopyWithToast text={formatGrpcMessage(message)} />
                  </div>
                  <pre style={codeStyle}><code>{message.data}</code></pre>
                </div>
              ))}
            </div>
            {Object.keys(response.metadata).length > 0 && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem', display: 'block' }}>Response Metadata</label>
                <pre style={codeStyle}><code>{Object.entries(response.metadata).map(([k, v]) => `${k}: ${v}`).join('\n')}</code></pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Streaming Messages ── */}
      {streamingMessages.length > 0 && (
        <div className="tool-card" style={{ marginBottom: '1rem' }}>
          <div className="tool-card-header">
            🌊 Streaming Messages <Badge pill bg="" style={{ background: 'var(--primary)', fontSize: '0.7rem', marginLeft: '0.4rem' }}>{streamingMessages.length}</Badge>
          </div>
          <div className="tool-card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {streamingMessages.map((message) => (
              <div key={message.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <Pill type={message.type} label={message.type} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre style={{ ...codeStyle, padding: '0.5rem 0.75rem' }}><code>{message.data}</code></pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Request History ── */}
      {history.length > 0 && (
        <div className="tool-card">
          <div className="tool-card-header">🕐 Request History</div>
          <div className="tool-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {history.map((entry) => {
              const ok = !entry.error;
              return (
                <div key={entry.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                  background: ok ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                  border: `1px solid ${ok ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pill type={ok ? 'response' : 'error'} label={entry.error ? 'ERROR' : String(entry.response?.status ?? '')} />
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)' }}>
                      {entry.config.service}.{entry.config.method}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{entry.config.url}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => loadFromHistory(entry)}
                      style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.2rem 0.6rem', fontSize: '0.72rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                      Load
                    </button>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Container>
  );
};