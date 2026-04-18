import React, { useState } from 'react';
import { Button, Container, Form, Spinner, Badge } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
  makeRequest,
  curlToRequestConfig,
  requestConfigToCurl,
  isValidUrl,
  formatJsonResponse,
  RequestConfig,
  RestResponse,
} from '../../utils/restClient';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

interface RequestHistory {
  id: string;
  config: RequestConfig;
  response?: RestResponse;
  error?: string;
  timestamp: number;
}

interface UIRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  headers: string;
  body: string;
  timeout?: number;
}

// ─── Method colour map ────────────────────────────────────────────────────────
const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  GET:    { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
  POST:   { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  PUT:    { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
  PATCH:  { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  DELETE: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  HEAD:   { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return '#34d399';
  if (status >= 300 && status < 400) return '#60a5fa';
  if (status >= 400 && status < 500) return '#f59e0b';
  return '#f87171';
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const codeStyle: React.CSSProperties = {
  background: 'var(--code-bg)',
  borderRadius: 'var(--radius-md)',
  padding: '1rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  lineHeight: 1.7,
  color: 'var(--text)',
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: '420px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
};

export const RestClient: React.FC = () => {
  const [config, setConfig] = useState<UIRequestConfig>({
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    headers: '',
    body: '',
  });

  const [curlInput, setCurlInput] = useState('');
  const [response, setResponse] = useState<RestResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'curl' | 'history'>('manual');
  const [responseTab, setResponseTab] = useState<'formatted' | 'raw' | 'headers'>('formatted');
  const ai = useAIAssistant();

  const parseHeaders = (headersText: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    headersText.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(':').trim();
      }
    });
    return headers;
  };

  const headersToText = (headers: Record<string, string>): string =>
    Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');

  const handleSendRequest = async () => {
    setError('');
    setResponse(null);
    setLoading(true);
    try {
      if (!isValidUrl(config.url)) throw new Error('Please enter a valid URL');
      const parsedHeaders = parseHeaders(config.headers);
      const requestConfig: RequestConfig = {
        ...config,
        headers: parsedHeaders,
        body: config.body || undefined,
      };
      const result = await makeRequest(requestConfig);
      setResponse(result);
      setHistory(prev => [{
        id: Date.now().toString(),
        config: requestConfig,
        response: result,
        timestamp: Date.now(),
      }, ...prev.slice(0, 9)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      setHistory(prev => [{
        id: Date.now().toString(),
        config: { url: config.url, method: config.method, headers: parseHeaders(config.headers), body: config.body || undefined },
        error: msg,
        timestamp: Date.now(),
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCurl = () => {
    try {
      if (!curlInput.trim()) { setError('Please enter a curl command'); return; }
      const parsed = curlToRequestConfig(curlInput);
      setConfig({
        url: parsed.url,
        method: parsed.method as UIRequestConfig['method'],
        headers: headersToText(parsed.headers ?? {}),
        body: parsed.body ?? '',
      });
      setError('');
      setActiveTab('manual');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse curl command');
    }
  };

  const loadFromHistory = (item: RequestHistory) => {
    setConfig({
      url: item.config.url,
      method: item.config.method as UIRequestConfig['method'],
      headers: headersToText(item.config.headers ?? {}),
      body: item.config.body ?? '',
    });
    setResponse(item.response ?? null);
    setError(item.error ?? '');
    setActiveTab('manual');
  };

  const mc = METHOD_COLORS[config.method] ?? METHOD_COLORS.GET;
  const generatedCurl = isValidUrl(config.url)
    ? requestConfigToCurl({ ...config, headers: parseHeaders(config.headers) })
    : '';

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">🌐</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">REST Client</h1>
          <p className="tool-header-desc">Make RESTful requests, import curl commands, and inspect responses.</p>
        </div>
        {response && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: '999px',
            background: `${getStatusColor(response.status)}18`,
            border: `1px solid ${getStatusColor(response.status)}44`,
            color: getStatusColor(response.status),
            fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
          }}>
            {response.status} {response.statusText}
            <span style={{ fontWeight: 400, fontSize: '0.72rem', opacity: 0.8 }}>· {response.duration}ms</span>
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['manual', 'curl', 'history'] as const).map(tab => {
          const labels: Record<string, string> = {
            manual: '⚡ Manual Request',
            curl: '📥 Import Curl',
            history: `🕐 History (${history.length})`,
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                border: activeTab === tab ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                background: activeTab === tab ? 'var(--primary-light)' : 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--muted)',
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Manual Request ── */}
      {activeTab === 'manual' && (
        <div className="tool-card mb-4">
          <div className="tool-card-header">⚡ Request</div>
          <div className="tool-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            {/* URL bar */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <Form.Select
                value={config.method}
                onChange={e => setConfig(p => ({ ...p, method: e.target.value as UIRequestConfig['method'] }))}
                style={{
                  width: 'auto',
                  minWidth: '105px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  background: mc.bg,
                  color: mc.color,
                  border: `1px solid ${mc.color}44`,
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                }}
              >
                {Object.keys(METHOD_COLORS).map(m => <option key={m} value={m}>{m}</option>)}
              </Form.Select>

              <Form.Control
                type="url"
                placeholder="https://api.example.com/endpoint"
                value={config.url}
                onChange={e => setConfig(p => ({ ...p, url: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />

              <Button
                onClick={handleSendRequest}
                disabled={loading}
                style={{
                  minWidth: '90px',
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : '▶ Send'}
              </Button>
            </div>

            {/* Headers + Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                  Headers <span style={{ fontWeight: 400, textTransform: 'none' }}>(key: value, one per line)</span>
                </div>
                <textarea
                  className="tool-textarea"
                  rows={5}
                  placeholder={'Content-Type: application/json\nAuthorization: Bearer token'}
                  value={config.headers}
                  onChange={e => setConfig(p => ({ ...p, headers: e.target.value }))}
                />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                  Request Body
                </div>
                <textarea
                  className="tool-textarea"
                  rows={5}
                  placeholder={'{"key": "value"}'}
                  value={config.body}
                  onChange={e => setConfig(p => ({ ...p, body: e.target.value }))}
                  disabled={config.method === 'GET' || config.method === 'HEAD'}
                  style={{ opacity: (config.method === 'GET' || config.method === 'HEAD') ? 0.45 : 1 }}
                />
              </div>
            </div>

            {/* Quick headers */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', alignSelf: 'center' }}>Quick add:</span>
              {[
                ['Content-Type: application/json', 'JSON'],
                ['Accept: application/json', 'Accept JSON'],
                ['Content-Type: application/x-www-form-urlencoded', 'Form'],
              ].map(([value, label]) => (
                <button
                  key={label}
                  onClick={() => {
                    const lines = config.headers.trim().split('\n').filter(Boolean);
                    if (!lines.some(l => l.startsWith(value.split(':')[0]))) {
                      setConfig(p => ({ ...p, headers: [...lines, value].join('\n') }));
                    }
                  }}
                  style={{
                    fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px',
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                    color: 'var(--muted)', cursor: 'pointer',
                  }}
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Import Curl ── */}
      {activeTab === 'curl' && (
        <div className="tool-card mb-4">
          <div className="tool-card-header">📥 Import Curl Command</div>
          <div className="tool-card-body">
            <textarea
              className="tool-textarea"
              rows={7}
              placeholder={"curl -X POST https://api.example.com/users \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\": \"John\"}'"}
              value={curlInput}
              onChange={e => setCurlInput(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <Button
                onClick={handleImportCurl}
                style={{ background: 'var(--primary)', border: 'none', fontWeight: 600, fontSize: '0.85rem' }}
              >
                📥 Import & Switch to Manual
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setCurlInput('')}
                style={{ fontSize: '0.85rem' }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── History ── */}
      {activeTab === 'history' && (
        <div className="tool-card mb-4">
          <div className="tool-card-header">
            🕐 Request History
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="tool-card-body">
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>🕐</div>
                No requests yet — send one to see it here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {history.map(item => {
                  const hmc = METHOD_COLORS[item.config.method] ?? METHOD_COLORS.GET;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      }}
                    >
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.18rem 0.5rem',
                        borderRadius: '6px', background: hmc.bg, color: hmc.color,
                        border: `1px solid ${hmc.color}33`, flexShrink: 0,
                      }}>
                        {item.config.method}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.config.url}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                          {item.response && (
                            <span style={{ marginLeft: '0.5rem', color: getStatusColor(item.response.status), fontWeight: 600 }}>
                              {item.response.status} · {item.response.duration}ms
                            </span>
                          )}
                          {item.error && <span style={{ marginLeft: '0.5rem', color: '#f87171' }}>Error</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => loadFromHistory(item)}
                        style={{
                          fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px',
                          border: '1px solid var(--primary)', background: 'var(--primary-light)',
                          color: 'var(--primary)', cursor: 'pointer', flexShrink: 0, fontWeight: 600,
                        }}
                      >
                        Load
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem',
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
          color: '#f87171', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
        }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Generated Curl ── */}
      {generatedCurl && (
        <div className="tool-card mb-4">
          <div className="tool-card-header">
            💻 Generated Curl
            <div className="ms-auto">
              <CopyWithToast text={generatedCurl} />
            </div>
          </div>
          <div className="tool-card-body" style={{ padding: 0 }}>
            <pre style={{ ...codeStyle, borderRadius: '0 0 var(--radius-md) var(--radius-md)', color: '#34d399' }}>
              {generatedCurl}
            </pre>
          </div>
        </div>
      )}

      {/* ── Response ── */}
      {response && (
        <div className="tool-card mb-4">
          <div className="tool-card-header">
            📨 Response
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                background: `${getStatusColor(response.status)}18`,
                color: getStatusColor(response.status),
                border: `1px solid ${getStatusColor(response.status)}44`,
              }}>
                {response.status} {response.statusText}
              </span>
              <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>{response.duration}ms</Badge>
              <CopyWithToast text={response.data} />
            </div>
          </div>
          <div className="tool-card-body">
            {/* Response sub-tabs */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem' }}>
              {(['formatted', 'raw', 'headers'] as const).map(t => {
                const labels = { formatted: '{ } Formatted', raw: '📄 Raw', headers: '📋 Headers' };
                return (
                  <button
                    key={t}
                    onClick={() => setResponseTab(t)}
                    style={{
                      padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.76rem',
                      border: responseTab === t ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      background: responseTab === t ? 'var(--primary-light)' : 'transparent',
                      color: responseTab === t ? 'var(--primary)' : 'var(--muted)',
                      cursor: 'pointer', fontWeight: responseTab === t ? 700 : 400,
                    }}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {responseTab === 'formatted' && (
              <pre style={codeStyle}>{formatJsonResponse(response.data)}</pre>
            )}
            {responseTab === 'raw' && (
              <pre style={codeStyle}>{response.data}</pre>
            )}
            {responseTab === 'headers' && (
              <pre style={codeStyle}>
                {Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
              </pre>
            )}

            <div style={{ marginTop: '0.85rem' }}>
              {ai.isConfigured ? (
                <AIAssistButton
                  label="🤖 Analyze Response"
                  onClick={async () => {
                    try {
                      await ai.sendRequest(
                        'You are an API expert. Analyze the HTTP response and provide insights about the data structure, potential issues, and suggestions. Be concise.',
                        `Status: ${response.status} ${response.statusText}\nDuration: ${response.duration}ms\nBody${response.data.length > 2000 ? ' (truncated)' : ''}:\n${response.data.substring(0, 2000)}`
                      );
                    } catch { /* handled by AIAssistButton */ }
                  }}
                  isLoading={ai.isLoading}
                  error={ai.error}
                  result={ai.result}
                  onClear={ai.clear}
                />
              ) : (
                <AIConfigureHint />
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};
