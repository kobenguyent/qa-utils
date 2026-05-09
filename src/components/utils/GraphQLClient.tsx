import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Container, Form, Badge, Spinner } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
  executeGraphQL,
  introspectSchema,
  buildCurlCommand,
  detectOperationType,
  validateQuery,
  validateVariables,
  formatGraphQLJson,
  SAMPLE_QUERIES,
  GraphQLResponse,
  SchemaInfo,
  IntrospectionType,
  HistoryEntry,
} from '../../utils/graphqlClient';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

// ─── Shared styles ─────────────────────────────────────────────────────────────
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

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.3rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.78rem',
  fontWeight: active ? 600 : 400,
  border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)',
  background: active ? 'var(--primary)18' : 'transparent',
  color: active ? 'var(--primary)' : 'var(--muted)',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

const pillBtnStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  padding: '0.15rem 0.5rem',
  borderRadius: '999px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--muted)',
  cursor: 'pointer',
};

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return '#34d399';
  if (status >= 300 && status < 400) return '#60a5fa';
  if (status >= 400 && status < 500) return '#f97316';
  return '#f87171';
}

function operationBadgeColor(op: string) {
  if (op === 'mutation') return { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: '#f9731633' };
  if (op === 'subscription') return { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '#8b5cf633' };
  return { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: '#34d39933' };
}

// ─── Mini JSON Highlighter ──────────────────────────────────────────────────
function JsonHighlighted({ value }: { value: string }) {
  const highlighted = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span style="color:#93c5fd">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:#86efac">"$1"</span>')
    .replace(/: (true|false)/g, ': <span style="color:#fb923c">$1</span>')
    .replace(/: (null)/g, ': <span style="color:#94a3b8">$1</span>')
    .replace(/: (-?\d+(?:\.\d+)?)/g, ': <span style="color:#c4b5fd">$1</span>');

  return (
    <pre
      style={codeStyle}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

// ─── Schema Explorer panel ─────────────────────────────────────────────────
function SchemaExplorer({
  schema,
  onInsertQuery,
}: {
  schema: SchemaInfo;
  onInsertQuery: (query: string) => void;
}) {
  const [selectedType, setSelectedType] = useState<IntrospectionType | null>(null);
  const [filter, setFilter] = useState('');

  const userTypes = schema.types.filter(
    (t) =>
      !['String', 'Boolean', 'Int', 'Float', 'ID'].includes(t.name) &&
      t.kind !== 'SCALAR' &&
      filter
        ? t.name.toLowerCase().includes(filter.toLowerCase())
        : true,
  );

  const rootTypes = [
    schema.queryType,
    schema.mutationType,
    schema.subscriptionType,
  ].filter(Boolean) as string[];

  return (
    <div style={{ display: 'flex', gap: '1rem', height: '380px' }}>
      {/* Left sidebar – type list */}
      <div
        style={{
          width: '200px',
          flexShrink: 0,
          borderRight: '1px solid var(--border-color)',
          overflowY: 'auto',
          paddingRight: '0.5rem',
        }}
      >
        <input
          type="text"
          placeholder="Filter types…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: '100%',
            marginBottom: '0.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text)',
            fontSize: '0.78rem',
            padding: '0.3rem 0.5rem',
          }}
          aria-label="Filter schema types"
        />
        {rootTypes.map((name) => (
          <div
            key={name}
            onClick={() => {
              const t = schema.types.find((x) => x.name === name);
              setSelectedType(t ?? null);
            }}
            style={{
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              color:
                selectedType?.name === name
                  ? 'var(--primary)'
                  : 'var(--text)',
              background:
                selectedType?.name === name
                  ? 'var(--primary)18'
                  : 'transparent',
              marginBottom: '0.15rem',
            }}
          >
            {name === schema.queryType && '⬡ '}
            {name === schema.mutationType && '✏️ '}
            {name === schema.subscriptionType && '📡 '}
            {name}
          </div>
        ))}
        <div
          style={{
            fontSize: '0.68rem',
            color: 'var(--muted)',
            margin: '0.5rem 0 0.3rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Types
        </div>
        {userTypes.map((t) => (
          <div
            key={t.name}
            onClick={() => setSelectedType(t)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              color:
                selectedType?.name === t.name
                  ? 'var(--primary)'
                  : 'var(--muted)',
              background:
                selectedType?.name === t.name
                  ? 'var(--primary)18'
                  : 'transparent',
              marginBottom: '0.1rem',
            }}
          >
            {t.name}
          </div>
        ))}
      </div>

      {/* Right pane – type detail */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selectedType ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '0.5rem',
              color: 'var(--muted)',
            }}
          >
            <span style={{ fontSize: '2rem', opacity: 0.4 }}>🔭</span>
            <span style={{ fontSize: '0.85rem' }}>
              Select a type to inspect its fields
            </span>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--text)',
                }}
              >
                {selectedType.name}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  background: 'var(--primary)18',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)33',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {selectedType.kind}
              </span>
              {selectedType.name === schema.queryType && (
                <button
                  onClick={() => {
                    const fields = selectedType.fields ?? [];
                    if (fields.length > 0) {
                      const sample = `query Example {\n${fields
                        .slice(0, 3)
                        .map((f) => `  ${f.name}`)
                        .join('\n')}\n}`;
                      onInsertQuery(sample);
                    }
                  }}
                  style={pillBtnStyle}
                  aria-label="Insert sample query"
                >
                  ↑ Insert sample query
                </button>
              )}
            </div>
            {selectedType.description && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  marginBottom: '0.75rem',
                  fontStyle: 'italic',
                }}
              >
                {selectedType.description}
              </p>
            )}

            {/* Fields */}
            {(selectedType.fields ?? []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {(selectedType.fields ?? []).map((f) => (
                  <div
                    key={f.name}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem 0.65rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          color: 'var(--text)',
                          fontWeight: 600,
                        }}
                      >
                        {f.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          color: '#c4b5fd',
                        }}
                      >
                        {f.type}
                      </span>
                    </div>
                    {f.description && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--muted)',
                          marginTop: '0.2rem',
                        }}
                      >
                        {f.description}
                      </div>
                    )}
                    {(f.args ?? []).length > 0 && (
                      <div
                        style={{
                          marginTop: '0.35rem',
                          paddingLeft: '0.75rem',
                          borderLeft: '2px solid var(--border-color)',
                        }}
                      >
                        {(f.args ?? []).map((a) => (
                          <div
                            key={a.name}
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--muted)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            <span style={{ color: '#fb923c' }}>{a.name}</span>
                            {': '}
                            <span style={{ color: '#c4b5fd' }}>{a.type}</span>
                            {a.defaultValue !== null &&
                              a.defaultValue !== undefined && (
                                <span style={{ color: 'var(--muted)' }}>
                                  {' '}
                                  = {a.defaultValue}
                                </span>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Input fields */}
            {(selectedType.inputFields ?? []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.2rem',
                  }}
                >
                  Input Fields
                </div>
                {(selectedType.inputFields ?? []).map((f) => (
                  <div
                    key={f.name}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 0.65rem',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{ color: 'var(--text)' }}>{f.name}</span>
                    <span style={{ color: '#c4b5fd' }}>{f.type}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Enum values */}
            {(selectedType.enumValues ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                <div
                  style={{
                    width: '100%',
                    fontSize: '0.68rem',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.2rem',
                  }}
                >
                  Enum Values
                </div>
                {(selectedType.enumValues ?? []).map((e) => (
                  <span
                    key={e.name}
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: 'var(--primary)18',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)33',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {e.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const GraphQLClient: React.FC = () => {
  const [endpoint, setEndpoint] = useState(
    'https://countries.trevorblades.com/graphql',
  );
  const [query, setQuery] = useState(
    `query GetCountries {\n  countries {\n    code\n    name\n    emoji\n    capital\n  }\n}`,
  );
  const [variables, setVariables] = useState('{}');
  const [operationName, setOperationName] = useState('');
  const [headersText, setHeadersText] = useState('');

  const [response, setResponse] = useState<GraphQLResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState('');

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<
    'editor' | 'schema' | 'history' | 'samples'
  >('editor');
  const [responseTab, setResponseTab] = useState<
    'data' | 'errors' | 'raw' | 'headers' | 'extensions'
  >('data');

  const ai = useAIAssistant();
  const queryRef = useRef<HTMLTextAreaElement>(null);

  const opType = detectOperationType(query);
  const opColors = operationBadgeColor(opType);

  const parseHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    headersText.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key) headers[key] = val;
      }
    });
    return headers;
  }, [headersText]);

  const handleExecute = useCallback(async () => {
    const qErr = validateQuery(query);
    if (qErr) { setError(qErr); return; }
    const vErr = validateVariables(variables);
    if (vErr) { setError(vErr); return; }

    let parsedVars: Record<string, unknown> = {};
    try {
      parsedVars = variables.trim() ? JSON.parse(variables) : {};
    } catch {
      setError('Variables must be valid JSON');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    const request = {
      query,
      variables: parsedVars,
      ...(operationName.trim() ? { operationName: operationName.trim() } : {}),
    };

    try {
      const res = await executeGraphQL(
        { endpoint, headers: parseHeaders() },
        request,
      );
      setResponse(res);
      setResponseTab(
        res.errors?.length ? 'errors' : 'data',
      );

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        endpoint,
        request,
        response: res,
      };
      setHistory((h) => [entry, ...h].slice(0, 50));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        endpoint,
        request,
        error: msg,
      };
      setHistory((h) => [entry, ...h].slice(0, 50));
    } finally {
      setLoading(false);
    }
  }, [query, variables, operationName, endpoint, parseHeaders]);

  const handleIntrospect = useCallback(async () => {
    setSchemaLoading(true);
    setSchemaError('');
    setSchema(null);
    try {
      const s = await introspectSchema({ endpoint, headers: parseHeaders() });
      setSchema(s);
      setActiveTab('schema');
    } catch (e) {
      setSchemaError(e instanceof Error ? e.message : String(e));
    } finally {
      setSchemaLoading(false);
    }
  }, [endpoint, parseHeaders]);

  const loadSample = (idx: number) => {
    const s = SAMPLE_QUERIES[idx];
    setEndpoint(s.endpoint);
    setQuery(s.query);
    setVariables(s.variables);
    setActiveTab('editor');
  };

  // keyboard shortcut Ctrl/Cmd+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleExecute]);

  const curl = (() => {
    try {
      return buildCurlCommand(
        endpoint,
        { query, variables: JSON.parse(variables || '{}'), operationName: operationName || undefined },
        parseHeaders(),
      );
    } catch {
      return '';
    }
  })();

  return (
    <Container className="py-4">
      {/* ── Header ── */}
      <div className="tool-header">
        <div className="tool-header-icon">⬡</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">GraphQL Client</h1>
          <p className="tool-header-desc">
            Execute queries &amp; mutations, explore schemas, and test GraphQL
            APIs — with introspection, history, and AI analysis.
          </p>
        </div>
        {response && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              background: `${getStatusColor(response.status)}18`,
              border: `1px solid ${getStatusColor(response.status)}44`,
              color: getStatusColor(response.status),
              fontSize: '0.8rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {response.status} {response.statusText}
          </span>
        )}
      </div>

      {/* ── Endpoint bar ── */}
      <div className="tool-card mb-3">
        <div className="tool-card-body">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
            {/* Operation type pill */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: opColors.bg,
                color: opColors.color,
                border: `1px solid ${opColors.border}`,
                flexShrink: 0,
              }}
              aria-label={`Operation type: ${opType}`}
            >
              {opType === 'unknown' ? 'GQL' : opType}
            </span>

            <Form.Control
              type="url"
              placeholder="https://api.example.com/graphql"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                border: '1px solid var(--border-color)',
              }}
              aria-label="GraphQL endpoint URL"
            />

            <Button
              onClick={handleExecute}
              disabled={loading || !endpoint.trim()}
              style={{
                background: 'var(--primary)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                minWidth: '96px',
                flexShrink: 0,
              }}
              aria-label="Execute GraphQL request"
            >
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                '▶ Run'
              )}
            </Button>

            <Button
              variant="outline-secondary"
              onClick={handleIntrospect}
              disabled={schemaLoading || !endpoint.trim()}
              style={{ fontSize: '0.82rem', flexShrink: 0 }}
              title="Fetch schema via introspection"
              aria-label="Fetch schema via introspection"
            >
              {schemaLoading ? <Spinner size="sm" animation="border" /> : '🔭 Schema'}
            </Button>
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--muted)',
              marginTop: '0.35rem',
            }}
          >
            Press{' '}
            <kbd
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                padding: '0 4px',
                fontSize: '0.68rem',
              }}
            >
              ⌘/Ctrl + Enter
            </kbd>{' '}
            to execute · POST to endpoint with{' '}
            <code style={{ fontSize: '0.68rem' }}>Content-Type: application/json</code>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.3rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {(
          [
            { key: 'editor', label: '✏️ Editor' },
            { key: 'schema', label: '🔭 Schema' },
            { key: 'history', label: `🕐 History${history.length > 0 ? ` (${history.length})` : ''}` },
            { key: 'samples', label: '📂 Samples' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={tabBtnStyle(activeTab === key)}
            aria-label={`Switch to ${label} tab`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Editor tab ── */}
      {activeTab === 'editor' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            {/* Query */}
            <div className="tool-card">
              <div className="tool-card-header">
                📝 Query / Mutation
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.7rem',
                    color: 'var(--muted)',
                  }}
                >
                  {query.split('\n').length} lines
                </span>
              </div>
              <div className="tool-card-body" style={{ padding: 0 }}>
                <textarea
                  ref={queryRef}
                  className="tool-textarea"
                  rows={14}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    border: 'none',
                    resize: 'vertical',
                    padding: '0.75rem 1rem',
                    minHeight: '220px',
                    background: 'var(--code-bg)',
                    color: 'var(--text)',
                    width: '100%',
                  }}
                  placeholder={`query Example {\n  field {\n    subfield\n  }\n}`}
                  spellCheck={false}
                  aria-label="GraphQL query editor"
                />
              </div>
            </div>

            {/* Variables + headers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="tool-card" style={{ flex: 1 }}>
                <div className="tool-card-header">
                  {'{ }'} Variables
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--muted)' }}>
                    JSON
                  </span>
                </div>
                <div className="tool-card-body" style={{ padding: 0 }}>
                  <textarea
                    className="tool-textarea"
                    rows={6}
                    value={variables}
                    onChange={(e) => setVariables(e.target.value)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                      border: 'none',
                      resize: 'vertical',
                      padding: '0.75rem 1rem',
                      background: 'var(--code-bg)',
                      color: 'var(--text)',
                      width: '100%',
                    }}
                    placeholder='{\n  "id": 1\n}'
                    spellCheck={false}
                    aria-label="GraphQL variables"
                  />
                </div>
              </div>

              <div className="tool-card">
                <div className="tool-card-header">🔑 Headers</div>
                <div className="tool-card-body">
                  <textarea
                    className="tool-textarea"
                    rows={3}
                    value={headersText}
                    onChange={(e) => setHeadersText(e.target.value)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      resize: 'vertical',
                      background: 'var(--code-bg)',
                      color: 'var(--text)',
                      width: '100%',
                    }}
                    placeholder="Authorization: Bearer token&#10;X-Custom-Header: value"
                    spellCheck={false}
                    aria-label="HTTP headers"
                  />
                  <div style={{ marginTop: '0.5rem' }}>
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="Operation name (optional)"
                      value={operationName}
                      onChange={(e) => setOperationName(e.target.value)}
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.8rem',
                      }}
                      aria-label="GraphQL operation name"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Curl preview */}
          {curl && (
            <div className="tool-card mb-3">
              <div className="tool-card-header">
                💻 Equivalent curl
                <div className="ms-auto">
                  <CopyWithToast text={curl} />
                </div>
              </div>
              <div className="tool-card-body" style={{ padding: 0 }}>
                <pre
                  style={{
                    ...codeStyle,
                    color: '#34d399',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                  }}
                >
                  {curl}
                </pre>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Schema tab ── */}
      {activeTab === 'schema' && (
        <div className="tool-card mb-3">
          <div className="tool-card-header">
            🔭 Schema Explorer
            {schema && (
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted)' }}>
                {schema.types.length} types ·{' '}
                {schema.queryType && <span style={{ color: '#34d399' }}>Query</span>}
                {schema.mutationType && <> · <span style={{ color: '#f97316' }}>Mutation</span></>}
                {schema.subscriptionType && <> · <span style={{ color: '#8b5cf6' }}>Subscription</span></>}
              </span>
            )}
          </div>
          <div className="tool-card-body">
            {schemaError && (
              <div
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  color: '#f87171',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  marginBottom: '0.75rem',
                }}
              >
                ⚠️ {schemaError}
              </div>
            )}
            {!schema && !schemaError && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'var(--muted)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.4 }}>🔭</div>
                <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Click{' '}
                  <strong>🔭 Schema</strong> button to fetch the schema via
                  introspection
                </div>
                <Button
                  onClick={handleIntrospect}
                  disabled={schemaLoading}
                  style={{ background: 'var(--primary)', border: 'none' }}
                  aria-label="Fetch schema"
                >
                  {schemaLoading ? <Spinner size="sm" animation="border" /> : 'Fetch Schema'}
                </Button>
              </div>
            )}
            {schema && (
              <SchemaExplorer
                schema={schema}
                onInsertQuery={(q) => {
                  setQuery(q);
                  setActiveTab('editor');
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Samples tab ── */}
      {activeTab === 'samples' && (
        <div className="tool-card mb-3">
          <div className="tool-card-header">📂 Sample Queries</div>
          <div className="tool-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {SAMPLE_QUERIES.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        color: 'var(--text)',
                      }}
                    >
                      {s.label}
                    </span>
                    <button
                      onClick={() => loadSample(i)}
                      style={{
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.2rem 0.65rem',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      aria-label={`Load sample: ${s.label}`}
                    >
                      Load
                    </button>
                  </div>
                  <code
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {s.endpoint}
                  </code>
                  <pre
                    style={{
                      ...codeStyle,
                      maxHeight: '120px',
                      marginTop: '0.35rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {s.query}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── History tab ── */}
      {activeTab === 'history' && (
        <div className="tool-card mb-3">
          <div className="tool-card-header">
            🕐 Request History
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                style={{ ...pillBtnStyle, marginLeft: 'auto' }}
                aria-label="Clear history"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="tool-card-body">
            {history.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'var(--muted)',
                  fontSize: '0.88rem',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: '0.5rem',
                    opacity: 0.4,
                  }}
                >
                  🕐
                </div>
                No requests yet — run one to see it here.
              </div>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                {history.map((item) => {
                  const oc = operationBadgeColor(
                    detectOperationType(item.request.query),
                  );
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setEndpoint(item.endpoint);
                        setQuery(item.request.query);
                        setVariables(
                          item.request.variables
                            ? JSON.stringify(item.request.variables, null, 2)
                            : '{}',
                        );
                        setOperationName(item.request.operationName ?? '');
                        setActiveTab('editor');
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEndpoint(item.endpoint);
                          setQuery(item.request.query);
                          setActiveTab('editor');
                        }
                      }}
                      aria-label={`Restore request to ${item.endpoint}`}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: oc.bg,
                          color: oc.color,
                          border: `1px solid ${oc.border}`,
                          flexShrink: 0,
                          textTransform: 'uppercase',
                        }}
                      >
                        {detectOperationType(item.request.query) === 'unknown'
                          ? 'GQL'
                          : detectOperationType(item.request.query)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.endpoint}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.request.query.trim().split('\n')[0]}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.2rem',
                          flexShrink: 0,
                        }}
                      >
                        {item.response && (
                          <Badge
                            style={{
                              background: `${getStatusColor(item.response.status)}18`,
                              color: getStatusColor(item.response.status),
                              border: `1px solid ${getStatusColor(item.response.status)}44`,
                              fontSize: '0.68rem',
                            }}
                          >
                            {item.response.status}
                          </Badge>
                        )}
                        {item.error && (
                          <Badge bg="danger" style={{ fontSize: '0.68rem' }}>
                            error
                          </Badge>
                        )}
                        {item.response && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--muted)',
                            }}
                          >
                            {item.response.duration}ms
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--muted)',
                          }}
                        >
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
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
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.25)',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Response ── */}
      {response && (
        <div className="tool-card mb-4">
          <div className="tool-card-header">
            📨 Response
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginLeft: 'auto',
              }}
            >
              <span
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: `${getStatusColor(response.status)}18`,
                  color: getStatusColor(response.status),
                  border: `1px solid ${getStatusColor(response.status)}44`,
                }}
              >
                {response.status} {response.statusText}
              </span>
              <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
                {response.duration}ms
              </Badge>
              {response.errors?.length ? (
                <Badge bg="danger" style={{ fontSize: '0.7rem' }}>
                  {response.errors.length} error{response.errors.length !== 1 ? 's' : ''}
                </Badge>
              ) : null}
              <CopyWithToast text={response.raw} />
            </div>
          </div>
          <div className="tool-card-body">
            {/* Response sub-tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.3rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              {(
                [
                  { key: 'data', label: '{ } Data' },
                  { key: 'errors', label: `⚠️ Errors${response.errors?.length ? ` (${response.errors.length})` : ''}` },
                  { key: 'raw', label: '📄 Raw' },
                  { key: 'headers', label: '📋 Headers' },
                  ...(response.extensions
                    ? [{ key: 'extensions', label: '🔧 Extensions' }]
                    : []),
                ] as { key: typeof responseTab; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setResponseTab(key)}
                  style={tabBtnStyle(responseTab === key)}
                  aria-label={`View response ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {responseTab === 'data' && (
              <JsonHighlighted
                value={formatGraphQLJson(response.data)}
              />
            )}
            {responseTab === 'errors' && (
              response.errors?.length ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {response.errors.map((err, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(248,113,113,0.07)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem 1rem',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#f87171',
                          marginBottom: '0.25rem',
                          fontSize: '0.88rem',
                        }}
                      >
                        {err.message}
                      </div>
                      {err.locations && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {err.locations.map((l) => `line ${l.line}:${l.column}`).join(', ')}
                        </div>
                      )}
                      {err.path && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          path: {err.path.join(' → ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#34d399',
                    fontSize: '0.9rem',
                  }}
                >
                  ✅ No errors
                </div>
              )
            )}
            {responseTab === 'raw' && (
              <pre style={codeStyle}>{response.raw}</pre>
            )}
            {responseTab === 'headers' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                }}
              >
                {Object.entries(response.responseHeaders).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.35rem 0.65rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{ color: '#93c5fd', minWidth: '180px', flexShrink: 0 }}>
                      {k}
                    </span>
                    <span style={{ color: '#86efac', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            {responseTab === 'extensions' && response.extensions && (
              <JsonHighlighted value={formatGraphQLJson(response.extensions)} />
            )}

            {/* AI analysis */}
            <div style={{ marginTop: '1rem' }}>
              {ai.isConfigured ? (
                <AIAssistButton
                  label="🤖 Analyse with AI"
                  onClick={async () => {
                    try {
                      await ai.sendRequest(
                        'You are a GraphQL expert. Analyse the response and provide insights about the data structure, potential issues, and optimisation suggestions. Be concise.',
                        `Endpoint: ${endpoint}\nStatus: ${response.status}\nDuration: ${response.duration}ms\nErrors: ${response.errors?.length ?? 0}\nData (truncated):\n${response.raw.substring(0, 2000)}`,
                      );
                    } catch {
                      /* handled by AIAssistButton */
                    }
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

export default GraphQLClient;
