import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Container, Row, Col, Card, Badge, Button, Alert, Tab, Tabs, Spinner,
  Table, Form, InputGroup,
} from 'react-bootstrap';
import {
  parsePlaywrightTrace,
  fetchAndParseTraceFromUrl,
  getActionLabel,
  getActionStatusColor,
  getActionIcon,
  PlaywrightTrace,
  TraceAction,
  NetworkRequest,
  CallStackFrame,
} from '../../utils/playwrightTraceReader';

// ─── Timeline bar ─────────────────────────────────────────────────────────────

interface TimelineBarProps {
  startTime: number;
  endTime: number;
  traceStart: number;
  traceEnd: number;
  color: string;
}

const TimelineBar: React.FC<TimelineBarProps> = ({ startTime, endTime, traceStart, traceEnd, color }) => {
  const total = traceEnd - traceStart || 1;
  const left = ((startTime - traceStart) / total) * 100;
  const width = Math.max(((endTime - startTime) / total) * 100, 0.3);
  return (
    <div style={{ position: 'relative', height: 4, background: 'var(--bs-gray-200)', borderRadius: 2, marginTop: 4 }}>
      <div
        style={{
          position: 'absolute',
          left: `${left}%`,
          width: `${width}%`,
          height: '100%',
          background: `var(--bs-${color})`,
          borderRadius: 2,
          minWidth: 2,
        }}
      />
    </div>
  );
};

// ─── Action row ───────────────────────────────────────────────────────────────

interface ActionRowProps {
  action: TraceAction;
  index: number;
  screenshots: Record<string, string>;
  traceStart: number;
  traceEnd: number;
  onSelect: (a: TraceAction) => void;
  selected: boolean;
}

const ActionRow: React.FC<ActionRowProps> = ({
  action, index, screenshots, traceStart, traceEnd, onSelect, selected,
}) => {
  const color = getActionStatusColor(action);
  const firstSha1 = action.screenshotSha1s[0];
  const thumb = firstSha1 ? screenshots[firstSha1] : undefined;
  const label = getActionLabel(action);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(action)}
      onKeyDown={e => e.key === 'Enter' && onSelect(action)}
      aria-selected={selected}
      aria-label={`Action ${index + 1}: ${label}`}
      className={`d-flex align-items-center gap-2 px-2 py-1 mb-1 rounded ${selected ? 'shadow-sm' : ''}`}
      style={{
        cursor: 'pointer',
        borderLeft: `3px solid var(--bs-${color})`,
        background: selected ? 'var(--bs-primary-bg-subtle, rgba(13,110,253,.08))' : 'transparent',
        outline: selected ? '1px solid var(--bs-primary)' : undefined,
        minHeight: 44,
      }}
    >
      {/* Index */}
      <div className="text-muted" style={{ minWidth: 24, fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums' }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Screenshot thumbnail — always shown when available */}
      {thumb ? (
        <img
          src={thumb}
          alt=""
          aria-hidden="true"
          style={{ height: 36, width: 64, objectFit: 'cover', borderRadius: 3, flexShrink: 0, border: '1px solid var(--border-color)' }}
        />
      ) : (
        <div style={{ width: 64, height: 36, flexShrink: 0, background: 'var(--bs-gray-200)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
          {getActionIcon(action)}
        </div>
      )}

      {/* Label + api name + timeline */}
      <div className="flex-grow-1 overflow-hidden">
        <div className="fw-semibold text-truncate" style={{ fontSize: '0.8rem' }} title={label}>{label}</div>
        {action.name && (
          <div className="text-muted text-truncate" style={{ fontSize: '0.65rem' }}>{action.name}</div>
        )}
        <TimelineBar
          startTime={action.startTime}
          endTime={action.endTime}
          traceStart={traceStart}
          traceEnd={traceEnd}
          color={color}
        />
      </div>

      {/* Duration + error badge */}
      <div className="text-end flex-shrink-0 d-flex flex-column align-items-end gap-1">
        <Badge bg={color} style={{ fontSize: '0.62rem' }}>
          {action.duration < 1000 ? `${action.duration}ms` : `${(action.duration / 1000).toFixed(2)}s`}
        </Badge>
        {action.error && <Badge bg="danger" style={{ fontSize: '0.62rem' }}>⚠ fail</Badge>}
      </div>
    </div>
  );
};

// ─── Call stack display ───────────────────────────────────────────────────────

const CallStackDisplay: React.FC<{ frames: CallStackFrame[] }> = ({ frames }) => {
  if (frames.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="text-muted small mb-1 fw-semibold">📍 Call Stack</div>
      <div
        className="small p-2 rounded"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          maxHeight: 160,
          overflowY: 'auto',
        }}
      >
        {frames.map((f, i) => (
          <div key={i} className={i === 0 ? 'fw-bold' : 'text-muted'}>
            {f.function ? `${f.function} ` : ''}
            <span style={{ color: i === 0 ? 'var(--bs-info)' : undefined }}>
              {f.file}:{f.line}:{f.column}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Detail panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  action: TraceAction | null;
  screenshots: Record<string, string>;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ action, screenshots }) => {
  if (!action) {
    return (
      <Card className="h-100">
        <Card.Body className="d-flex align-items-center justify-content-center text-muted small">
          ← Select an action to see details
        </Card.Body>
      </Card>
    );
  }

  const firstSha1 = action.screenshotSha1s[0];
  const mainScreenshot = firstSha1 ? screenshots[firstSha1] : undefined;

  return (
    <Card className="h-100">
      <Card.Header className="py-2 d-flex align-items-center gap-2">
        <span>{getActionIcon(action)}</span>
        <strong className="text-truncate flex-grow-1" title={action.name || action.apiName || '(internal)'}>
          {action.name || action.apiName || '(internal)'}
        </strong>
        <Badge bg={getActionStatusColor(action)} style={{ fontSize: '0.7rem', flexShrink: 0 }}>
          {action.duration < 1000 ? `${action.duration}ms` : `${(action.duration / 1000).toFixed(2)}s`}
        </Badge>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: 600, padding: '0.75rem' }}>
        {action.error && (
          <Alert variant="danger" className="small py-2 mb-2">
            <strong>Error:</strong> {action.error}
          </Alert>
        )}

        {/* Main page screenshot — shown prominently at the top */}
        {mainScreenshot && (
          <div className="mb-3">
            <div className="text-muted small mb-1 fw-semibold">📸 Page State</div>
            <a href={mainScreenshot} target="_blank" rel="noopener noreferrer" title="Click to open full size">
              <img
                src={mainScreenshot}
                alt="page state after action"
                className="img-fluid rounded border d-block"
                style={{ maxHeight: 260, width: '100%', objectFit: 'contain', background: '#000' }}
              />
            </a>
            {action.screenshotSha1s.length > 1 && (
              <div className="d-flex gap-1 mt-1 flex-wrap">
                {action.screenshotSha1s.slice(1).map(sha1 =>
                  screenshots[sha1] ? (
                    <a key={sha1} href={screenshots[sha1]} target="_blank" rel="noopener noreferrer">
                      <img
                        src={screenshots[sha1]}
                        alt="additional screenshot"
                        style={{ height: 40, width: 72, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--border-color)' }}
                      />
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {/* Call stack */}
        {action.callStack && <CallStackDisplay frames={action.callStack} />}

        {/* Params */}
        {Object.keys(action.params).length > 0 && (
          <div className="mb-3">
            <div className="text-muted small mb-1 fw-semibold">Parameters</div>
            <pre
              className="small p-2 rounded mb-0"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border-color)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontSize: '0.72rem',
              }}
            >
              {JSON.stringify(action.params, null, 2)}
            </pre>
          </div>
        )}

        {/* Log */}
        {action.log.length > 0 && (
          <div className="mb-3">
            <div className="text-muted small mb-1 fw-semibold">Log</div>
            <pre
              className="small p-2 rounded mb-0"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border-color)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 160,
                overflowY: 'auto',
                fontSize: '0.72rem',
              }}
            >
              {action.log.join('\n')}
            </pre>
          </div>
        )}

        {/* Timing + page */}
        <div className="text-muted" style={{ fontSize: '0.68rem' }}>
          {action.pageId && <span className="me-2 badge bg-secondary fw-normal" style={{ fontSize: '0.65rem' }}>{action.pageId}</span>}
          <span className="me-3">Start: {new Date(action.startTime).toISOString()}</span>
          <span>End: {new Date(action.endTime).toISOString()}</span>
        </div>
      </Card.Body>
    </Card>
  );
};

// ─── Network waterfall ────────────────────────────────────────────────────────

interface NetworkTableProps {
  requests: NetworkRequest[];
}

const NetworkTable: React.FC<NetworkTableProps> = ({ requests }) => {
  const [filter, setFilter] = useState('');

  if (requests.length === 0) {
    return <Alert variant="secondary">No network requests recorded.</Alert>;
  }

  const statusBg = (status: number | null): string => {
    if (!status) return 'secondary';
    if (status < 300) return 'success';
    if (status < 400) return 'info';
    if (status < 500) return 'warning';
    return 'danger';
  };

  const resourceTypeColor: Record<string, string> = {
    xhr: '#3b82f6',
    fetch: '#6366f1',
    document: '#10b981',
    stylesheet: '#f59e0b',
    script: '#8b5cf6',
    image: '#ec4899',
    font: '#14b8a6',
    media: '#f97316',
    other: '#6b7280',
  };

  // Compute waterfall timings
  const nonZeroStarts = requests.map(r => r.startTime).filter(Boolean);
  const netStart = nonZeroStarts.length > 0 ? Math.min(...nonZeroStarts) : 0;
  const netEnd = Math.max(
    ...requests.map(r => r.endTime ?? r.startTime).filter(Boolean)
  );
  const netTotal = (netEnd - netStart) || 1;

  const filtered = filter
    ? requests.filter(r =>
        r.url.toLowerCase().includes(filter.toLowerCase()) ||
        r.method.toLowerCase().includes(filter.toLowerCase()) ||
        r.resourceType.toLowerCase().includes(filter.toLowerCase())
      )
    : requests;

  return (
    <div>
      <InputGroup size="sm" className="mb-2" style={{ maxWidth: 320 }}>
        <Form.Control
          placeholder="Filter by URL, method, type…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Filter network requests"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
        />
        {filter && (
          <Button variant="outline-secondary" size="sm" onClick={() => setFilter('')} aria-label="Clear filter">✕</Button>
        )}
      </InputGroup>
      <div style={{ overflowX: 'auto' }}>
        <Table size="sm" hover className="small mb-0" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Method</th>
              <th style={{ width: 60 }}>Status</th>
              <th>URL</th>
              <th style={{ width: 70 }}>Type</th>
              <th style={{ width: 70 }}>Duration</th>
              <th style={{ minWidth: 120 }}>Timeline</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const barLeft = netStart > 0 ? ((r.startTime - netStart) / netTotal) * 100 : 0;
              const barWidth = r.endTime && r.startTime
                ? Math.max(((r.endTime - r.startTime) / netTotal) * 100, 0.5)
                : 1;
              const typeColor = resourceTypeColor[r.resourceType] ?? resourceTypeColor.other;
              return (
                <tr key={r.requestId} className={r.state === 'failed' ? 'table-danger' : ''}>
                  <td><Badge bg="secondary" style={{ fontSize: '0.65rem' }}>{r.method}</Badge></td>
                  <td>
                    {r.state === 'failed'
                      ? <Badge bg="danger" style={{ fontSize: '0.65rem' }}>Failed</Badge>
                      : <Badge bg={statusBg(r.status)} style={{ fontSize: '0.65rem' }}>{r.status ?? '—'}</Badge>}
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <span
                      title={r.url}
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 300,
                        fontSize: '0.72rem',
                      }}
                    >
                      {r.isNavigationRequest && <span title="Navigation request" className="me-1">🧭</span>}
                      {r.url}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: typeColor,
                        color: '#fff',
                        fontSize: '0.62rem',
                        fontWeight: 500,
                        padding: '2px 5px',
                        borderRadius: 4,
                      }}
                    >
                      {r.resourceType}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.72rem' }}>{r.duration !== null ? `${r.duration}ms` : '—'}</td>
                  <td>
                    <div style={{ position: 'relative', height: 8, background: 'var(--bs-gray-200)', borderRadius: 4 }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: `${barLeft}%`,
                          width: `${barWidth}%`,
                          height: '100%',
                          background: typeColor,
                          borderRadius: 4,
                          minWidth: 2,
                          opacity: r.state === 'failed' ? 0.5 : 1,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {filtered.length === 0 && (
          <div className="text-muted text-center small py-3">No requests match the filter.</div>
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const PlaywrightTraceViewer: React.FC = () => {
  const [trace, setTrace] = useState<PlaywrightTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<TraceAction | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [filterText, setFilterText] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processTrace = useCallback(async (source: File | Blob | string) => {
    setLoading(true);
    setError(null);
    setTrace(null);
    setSelectedAction(null);
    setFilterText('');
    setErrorsOnly(false);

    try {
      const parsed = typeof source === 'string'
        ? await fetchAndParseTraceFromUrl(source)
        : await parsePlaywrightTrace(source);

      if (parsed.parseError) {
        setError(parsed.parseError);
      } else {
        setTrace(parsed);
      }
    } catch (err) {
      setError(`Unexpected error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processTrace(file);
  }, [processTrace]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processTrace(file);
  }, [processTrace]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleUrlLoad = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    await processTrace(url);
  }, [urlInput, processTrace]);

  const handleReset = () => {
    setTrace(null);
    setError(null);
    setSelectedAction(null);
    setUrlInput('');
    setFilterText('');
    setErrorsOnly(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Compute filtered actions unconditionally (Rules of Hooks — no hooks after early returns)
  const filteredActions = useMemo(() => {
    const allActions = trace?.actions ?? [];
    let result = allActions;
    if (errorsOnly) result = result.filter(a => a.error);
    if (filterText) {
      const lower = filterText.toLowerCase();
      result = result.filter(
        a =>
          getActionLabel(a).toLowerCase().includes(lower) ||
          (a.name ?? '').toLowerCase().includes(lower) ||
          (a.apiName ?? '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [trace, errorsOnly, filterText]);

  // ── Render upload area ──────────────────────────────────────────────────
  if (!trace && !loading) {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} lg={8}>
            <div className="mb-4">
              <h2 className="fw-bold">🎭 Playwright Trace Viewer</h2>
              <p className="text-muted">
                Upload a Playwright <code>.zip</code> trace file or load one from a remote URL.
                Traces are parsed locally in your browser — no data is sent to any server.
              </p>
              <Alert variant="info" className="small">
                <strong>How to generate a trace:</strong> Run your Playwright tests with{' '}
                <code>--trace on</code> (e.g.{' '}
                <code>npx playwright test --trace on</code>) and find the <code>.zip</code> files
                inside the <code>test-results/</code> directory. The ZIP may contain{' '}
                <code>0-trace.trace</code>, <code>0-trace.network</code>, <code>0-trace.stacks</code>{' '}
                and a <code>resources/</code> folder — all handled automatically.
              </Alert>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* URL input */}
            <div className="mb-3">
              <Form.Label className="fw-semibold">Load from URL</Form.Label>
              <InputGroup>
                <Form.Control
                  type="url"
                  placeholder="https://example.com/trace.zip"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlLoad()}
                  aria-label="Trace ZIP URL"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                />
                <Button
                  variant="primary"
                  onClick={handleUrlLoad}
                  disabled={!urlInput.trim()}
                  aria-label="Load trace from URL"
                >
                  Load
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                The remote server must allow CORS. Public trace reports (e.g. Playwright demo reports) work out of the box.
              </Form.Text>
            </div>

            <div className="text-center text-muted my-3">— or —</div>

            {/* File drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Upload Playwright trace ZIP file"
              className="text-center p-5 rounded"
              style={{
                border: '2px dashed var(--bs-primary)',
                cursor: 'pointer',
                background: 'var(--input-bg)',
                transition: 'background 0.2s',
              }}
            >
              <div className="display-4 mb-3">📂</div>
              <p className="fs-5 mb-1">Drop your <code>trace.zip</code> here</p>
              <p className="text-muted small">or click to browse files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="d-none"
                aria-label="Select trace zip file"
              />
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Parsing trace file…</span>
      </Container>
    );
  }

  // ── Render trace ────────────────────────────────────────────────────────
  if (!trace) return null;
  const { metadata, actions: traceActions, networkRequests, screenshots } = trace;
  const failedActions = traceActions.filter(a => a.error);
  const stackActions = traceActions.filter(a => a.callStack && a.callStack.length > 0);
  const traceStart = traceActions.length > 0 ? traceActions[0].startTime : 0;
  const traceEnd = traceActions.length > 0 ? traceActions[traceActions.length - 1].endTime : 0;
  const totalDuration = traceEnd - traceStart;

  return (
    <Container fluid className="py-3">
      {/* Header */}
      <Row className="align-items-center mb-3">
        <Col>
          <h5 className="fw-bold mb-0">
            🎭 Playwright Trace Viewer
            <Badge bg="secondary" className="ms-2 fw-normal" style={{ fontSize: '0.75rem' }}>
              {metadata.browserName} / {metadata.platform}
            </Badge>
            {metadata.sdkLanguage && (
              <Badge bg="info" className="ms-1 fw-normal" style={{ fontSize: '0.72rem' }}>
                {metadata.sdkLanguage}
              </Badge>
            )}
            {metadata.title && (
              <span className="text-muted ms-2" style={{ fontSize: '0.85rem', fontWeight: 400 }}>{metadata.title}</span>
            )}
          </h5>
        </Col>
        <Col xs="auto">
          <Button variant="outline-secondary" size="sm" onClick={handleReset}>
            ↩ Load another trace
          </Button>
        </Col>
      </Row>

      {/* Stats */}
      <Row className="g-2 mb-3">
        <Col xs={6} sm={3}>
          <Card className="text-center py-2">
            <div className="fs-4 fw-bold">{traceActions.length}</div>
            <div className="small text-muted">Actions</div>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className={`text-center py-2${failedActions.length > 0 ? ' border-danger' : ''}`}>
            <div className={`fs-4 fw-bold${failedActions.length > 0 ? ' text-danger' : ''}`}>
              {failedActions.length}
            </div>
            <div className="small text-muted">Failures</div>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="text-center py-2">
            <div className="fs-4 fw-bold">{networkRequests.length}</div>
            <div className="small text-muted">Network Requests</div>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="text-center py-2">
            <div className="fs-4 fw-bold">
              {totalDuration < 1000
                ? `${Math.round(totalDuration)}ms`
                : `${(totalDuration / 1000).toFixed(1)}s`}
            </div>
            <div className="small text-muted">Total Duration</div>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs defaultActiveKey="actions" className="mb-2">
        {/* Actions tab */}
        <Tab eventKey="actions" title={`▶️ Actions (${traceActions.length})`}>
          {/* Filter bar */}
          <div className="d-flex gap-2 mb-2 flex-wrap">
            <InputGroup size="sm" style={{ maxWidth: 280 }}>
              <Form.Control
                placeholder="Filter actions…"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                aria-label="Filter actions"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
              />
              {filterText && (
                <Button variant="outline-secondary" size="sm" onClick={() => setFilterText('')} aria-label="Clear filter">✕</Button>
              )}
            </InputGroup>
            <Form.Check
              type="switch"
              id="errors-only-switch"
              label={`Errors only${failedActions.length > 0 ? ` (${failedActions.length})` : ''}`}
              checked={errorsOnly}
              onChange={e => setErrorsOnly(e.target.checked)}
              className="small align-self-center"
            />
            {stackActions.length > 0 && (
              <span className="small text-muted align-self-center">
                📍 {stackActions.length} actions with call stacks
              </span>
            )}
            {filteredActions.length !== traceActions.length && (
              <span className="small text-muted align-self-center">
                Showing {filteredActions.length} of {traceActions.length}
              </span>
            )}
          </div>

          {traceActions.length === 0 ? (
            <Alert variant="secondary">No actions found in this trace.</Alert>
          ) : (
            <Row className="g-2">
              <Col xs={12} md={6} xl={5} style={{ maxHeight: 580, overflowY: 'auto' }}>
                {filteredActions.length === 0 ? (
                  <div className="text-muted small text-center py-3">No actions match the filter.</div>
                ) : filteredActions.map((a) => (
                  <ActionRow
                    key={a.callId}
                    action={a}
                    index={traceActions.indexOf(a)}
                    screenshots={screenshots}
                    traceStart={traceStart}
                    traceEnd={traceEnd}
                    onSelect={setSelectedAction}
                    selected={selectedAction?.callId === a.callId}
                  />
                ))}
              </Col>
              <Col xs={12} md={6} xl={7}>
                <DetailPanel action={selectedAction} screenshots={screenshots} />
              </Col>
            </Row>
          )}
        </Tab>

        {/* Network tab */}
        <Tab eventKey="network" title={`🌐 Network (${networkRequests.length})`}>
          <NetworkTable requests={networkRequests} />
        </Tab>

        {/* Info tab */}
        <Tab eventKey="info" title="ℹ️ Info">
          <Card>
            <Card.Body>
              <table className="table table-sm small mb-0">
                <tbody>
                  <tr><th style={{ width: 160 }}>Browser</th><td>{metadata.browserName}</td></tr>
                  <tr><th>Platform</th><td>{metadata.platform}</td></tr>
                  {metadata.title && <tr><th>Title</th><td>{metadata.title}</td></tr>}
                  {metadata.sdkLanguage && <tr><th>SDK Language</th><td>{metadata.sdkLanguage}</td></tr>}
                  <tr>
                    <th>Wall Time</th>
                    <td>{metadata.wallTime ? new Date(metadata.wallTime * 1000).toLocaleString() : '—'}</td>
                  </tr>
                  <tr><th>Actions</th><td>{traceActions.length}</td></tr>
                  <tr><th>Failed Actions</th><td className={failedActions.length > 0 ? 'text-danger fw-bold' : ''}>{failedActions.length}</td></tr>
                  <tr><th>Actions with Call Stack</th><td>{stackActions.length}</td></tr>
                  <tr><th>Network Requests</th><td>{networkRequests.length}</td></tr>
                  <tr>
                    <th>Total Duration</th>
                    <td>
                      {totalDuration < 1000
                        ? `${Math.round(totalDuration)}ms`
                        : `${(totalDuration / 1000).toFixed(2)}s`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};
