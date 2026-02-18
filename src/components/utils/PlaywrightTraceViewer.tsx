import React, { useState, useCallback, useRef } from 'react';
import {
  Container, Row, Col, Card, Badge, Button, Alert, Tab, Tabs, Spinner, Table, Form, InputGroup,
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
} from '../../utils/playwrightTraceReader';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ActionRowProps {
  action: TraceAction;
  screenshots: Record<string, string>;
  onSelect: (a: TraceAction) => void;
  selected: boolean;
}

const ActionRow: React.FC<ActionRowProps> = ({ action, screenshots, onSelect, selected }) => {
  const color = getActionStatusColor(action);
  const firstSha1 = action.screenshotSha1s[0];
  const thumb = firstSha1 ? screenshots[firstSha1] : undefined;

  return (
    <Card
      className={`mb-2 cursor-pointer border-${color}${selected ? ' shadow' : ''}`}
      onClick={() => onSelect(action)}
      style={{ cursor: 'pointer', borderLeft: `4px solid var(--bs-${color})` }}
    >
      <Card.Body className="py-2 px-3">
        <Row className="align-items-center g-2">
          <Col xs="auto" className="fs-5">
            {getActionIcon(action)}
          </Col>
          <Col>
            <div className="fw-semibold small">{getActionLabel(action)}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{action.name}</div>
          </Col>
          <Col xs="auto" className="text-end">
            <Badge bg={color} className="me-1">
              {action.duration < 1000
                ? `${action.duration}ms`
                : `${(action.duration / 1000).toFixed(2)}s`}
            </Badge>
            {action.error && (
              <Badge bg="danger" title={action.error}>⚠ Error</Badge>
            )}
          </Col>
          {thumb && (
            <Col xs="auto">
              <img
                src={thumb}
                alt="screenshot"
                style={{ height: 36, width: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-color)' }}
              />
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  );
};

// ─── Network table ────────────────────────────────────────────────────────────

interface NetworkTableProps {
  requests: NetworkRequest[];
}

const NetworkTable: React.FC<NetworkTableProps> = ({ requests }) => {
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

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table size="sm" hover className="small">
        <thead>
          <tr>
            <th>Method</th>
            <th>Status</th>
            <th style={{ maxWidth: 400 }}>URL</th>
            <th>Type</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r.requestId}>
              <td><Badge bg="secondary">{r.method}</Badge></td>
              <td>
                {r.state === 'failed'
                  ? <Badge bg="danger">Failed</Badge>
                  : <Badge bg={statusBg(r.status)}>{r.status ?? '—'}</Badge>}
              </td>
              <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span title={r.url}>{r.url}</span>
              </td>
              <td>{r.resourceType}</td>
              <td>{r.duration !== null ? `${r.duration}ms` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
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
        <Card.Body className="d-flex align-items-center justify-content-center text-muted">
          Select an action to see details
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="h-100">
      <Card.Header>
        <strong>{getActionIcon(action)} {action.name}</strong>
        {' '}
        <Badge bg={getActionStatusColor(action)}>
          {action.duration < 1000 ? `${action.duration}ms` : `${(action.duration / 1000).toFixed(2)}s`}
        </Badge>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: 520 }}>
        {action.error && (
          <Alert variant="danger" className="small py-2">
            <strong>Error:</strong> {action.error}
          </Alert>
        )}

        {/* Screenshots */}
        {action.screenshotSha1s.length > 0 && (
          <div className="mb-3">
            {action.screenshotSha1s.map(sha1 =>
              screenshots[sha1] ? (
                <img
                  key={sha1}
                  src={screenshots[sha1]}
                  alt="action screenshot"
                  className="img-fluid rounded border mb-2"
                  style={{ maxHeight: 240 }}
                />
              ) : null
            )}
          </div>
        )}

        {/* Params */}
        {Object.keys(action.params).length > 0 && (
          <div className="mb-3">
            <div className="text-muted small mb-1 fw-semibold">Parameters</div>
            <pre
              className="small p-2 rounded"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border-color)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {JSON.stringify(action.params, null, 2)}
            </pre>
          </div>
        )}

        {/* Log */}
        {action.log.length > 0 && (
          <div>
            <div className="text-muted small mb-1 fw-semibold">Log</div>
            <pre
              className="small p-2 rounded"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border-color)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {action.log.join('\n')}
            </pre>
          </div>
        )}

        {/* Timing */}
        <div className="text-muted small mt-2">
          <span className="me-3">Start: {new Date(action.startTime).toISOString()}</span>
          <span>End: {new Date(action.endTime).toISOString()}</span>
        </div>
      </Card.Body>
    </Card>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const PlaywrightTraceViewer: React.FC = () => {
  const [trace, setTrace] = useState<PlaywrightTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<TraceAction | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processTrace = useCallback(async (source: File | Blob | string) => {
    setLoading(true);
    setError(null);
    setTrace(null);
    setSelectedAction(null);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
                inside the <code>test-results/</code> directory.
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
  const { metadata, actions, networkRequests, screenshots } = trace;
  const failedActions = actions.filter(a => a.error);
  const totalDuration = actions.length > 0
    ? actions[actions.length - 1].endTime - actions[0].startTime
    : 0;

  return (
    <Container fluid className="py-3">
      {/* Header */}
      <Row className="align-items-center mb-3">
        <Col>
          <h4 className="fw-bold mb-0">
            🎭 Playwright Trace Viewer
            <Badge bg="secondary" className="ms-2 fs-6 fw-normal">
              {metadata.browserName} / {metadata.platform}
            </Badge>
            {metadata.title && (
              <span className="text-muted fs-6 ms-2">{metadata.title}</span>
            )}
          </h4>
        </Col>
        <Col xs="auto">
          <Button variant="outline-secondary" size="sm" onClick={handleReset}>
            ↩ Load another trace
          </Button>
        </Col>
      </Row>

      {/* Stats */}
      <Row className="g-3 mb-3">
        <Col xs={6} sm={3}>
          <Card className="text-center py-2">
            <div className="fs-3 fw-bold">{actions.length}</div>
            <div className="small text-muted">Actions</div>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className={`text-center py-2${failedActions.length > 0 ? ' border-danger' : ''}`}>
            <div className={`fs-3 fw-bold${failedActions.length > 0 ? ' text-danger' : ''}`}>
              {failedActions.length}
            </div>
            <div className="small text-muted">Failures</div>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="text-center py-2">
            <div className="fs-3 fw-bold">{networkRequests.length}</div>
            <div className="small text-muted">Network Requests</div>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="text-center py-2">
            <div className="fs-3 fw-bold">
              {totalDuration < 1000
                ? `${Math.round(totalDuration)}ms`
                : `${(totalDuration / 1000).toFixed(1)}s`}
            </div>
            <div className="small text-muted">Total Duration</div>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs defaultActiveKey="actions" className="mb-3">
        {/* Actions tab */}
        <Tab eventKey="actions" title={`▶️ Actions (${actions.length})`}>
          {actions.length === 0 ? (
            <Alert variant="secondary">No actions found in this trace.</Alert>
          ) : (
            <Row className="g-3">
              <Col xs={12} md={6} xl={5} style={{ maxHeight: 600, overflowY: 'auto' }}>
                {actions.map(a => (
                  <ActionRow
                    key={a.callId}
                    action={a}
                    screenshots={screenshots}
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
        <Tab
          eventKey="network"
          title={`🌐 Network (${networkRequests.length})`}
        >
          <NetworkTable requests={networkRequests} />
        </Tab>

        {/* Info tab */}
        <Tab eventKey="info" title="ℹ️ Info">
          <Card>
            <Card.Body>
              <table className="table table-sm small">
                <tbody>
                  <tr><th>Browser</th><td>{metadata.browserName}</td></tr>
                  <tr><th>Platform</th><td>{metadata.platform}</td></tr>
                  {metadata.title && <tr><th>Title</th><td>{metadata.title}</td></tr>}
                  {metadata.sdkLanguage && (
                    <tr><th>SDK Language</th><td>{metadata.sdkLanguage}</td></tr>
                  )}
                  <tr>
                    <th>Wall Time</th>
                    <td>{metadata.wallTime ? new Date(metadata.wallTime * 1000).toLocaleString() : '—'}</td>
                  </tr>
                  <tr><th>Actions</th><td>{actions.length}</td></tr>
                  <tr><th>Failed Actions</th><td>{failedActions.length}</td></tr>
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
