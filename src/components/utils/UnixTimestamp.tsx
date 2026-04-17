import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import CopyWithToast from '../CopyWithToast.tsx';

export const UnixTimestamp = () => {
  const [tsInput, setTsInput] = useState<string>(Date.now().toString());
  const [dateInput, setDateInput] = useState<string>('');
  const [now, setNow] = useState<number>(Date.now());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Convert Unix timestamp to human-readable dates
  const convertTimestamp = (timestamp: string): { gmt: string; local: string; ms: string } => {
    const raw = parseInt(timestamp, 10);
    if (isNaN(raw)) return { gmt: '—', local: '—', ms: '—' };
    // Handle both seconds and milliseconds
    const ms = raw > 1e12 ? raw : raw * 1000;
    const date = new Date(ms);
    return {
      gmt: date.toUTCString(),
      local: date.toLocaleString(),
      ms: ms.toString(),
    };
  };

  // Convert date string to Unix timestamps
  const convertDate = (dateStr: string): { seconds: string; ms: string } => {
    if (!dateStr.trim()) return { seconds: '—', ms: '—' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { seconds: 'Invalid date', ms: 'Invalid date' };
    return {
      seconds: Math.floor(d.getTime() / 1000).toString(),
      ms: d.getTime().toString(),
    };
  };

  const { gmt, local } = convertTimestamp(tsInput);
  const { seconds, ms: msOut } = convertDate(dateInput);

  const nowSec = Math.floor(now / 1000).toString();

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">⏰</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Unix Timestamp Converter</h1>
          <p className="tool-header-desc">
            Convert Unix timestamps to human-readable dates and back. Supports both seconds and milliseconds.
          </p>
        </div>
      </div>

      {/* Live clock */}
      <div className="tool-card mb-4">
        <div className="tool-card-header">
          <span>🕐</span>
          <span>Current Time</span>
          <span className="tool-badge tool-badge-success ms-auto">Live</span>
        </div>
        <div className="tool-card-body">
          <Row className="g-3 align-items-center">
            <Col xs={12} sm={6} lg={3}>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>UNIX (seconds)</div>
              <div className="d-flex align-items-center gap-2">
                <code style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{nowSec}</code>
                <CopyWithToast text={nowSec} />
              </div>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>UNIX (ms)</div>
              <div className="d-flex align-items-center gap-2">
                <code style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{now}</code>
                <CopyWithToast text={now.toString()} />
              </div>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>UTC</div>
              <code style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{new Date(now).toUTCString()}</code>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>LOCAL</div>
              <code style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{new Date(now).toLocaleString()}</code>
            </Col>
          </Row>
        </div>
      </div>

      <Row className="g-3">
        {/* Timestamp → Date */}
        <Col xs={12} lg={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>🔢</span>
              <span>Timestamp → Human Date</span>
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              <div>
                <Form.Label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)' }}>
                  Unix Timestamp (seconds or ms)
                </Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    className="tool-textarea"
                    value={tsInput}
                    onChange={(e) => setTsInput(e.target.value)}
                    placeholder="e.g. 1700000000"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setTsInput(nowSec)}
                    title="Use current timestamp"
                  >
                    Now
                  </Button>
                </div>
              </div>

              <div className="tool-divider">Results</div>

              <div className="d-flex flex-column gap-2">
                {[
                  { label: 'UTC / GMT', value: gmt },
                  { label: 'Local Time', value: local },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded" style={{ background: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="text-muted mb-1" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px' }}>{label.toUpperCase()}</div>
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <code style={{ fontSize: '0.87rem', color: 'var(--text)', wordBreak: 'break-all' }}>{value}</code>
                      {value !== '—' && <CopyWithToast text={value} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>

        {/* Date → Timestamp */}
        <Col xs={12} lg={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>📅</span>
              <span>Human Date → Timestamp</span>
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              <div>
                <Form.Label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)' }}>
                  Date / Date-time string
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  className="tool-textarea"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="tool-divider">Results</div>

              <div className="d-flex flex-column gap-2">
                {[
                  { label: 'Unix (seconds)', value: seconds },
                  { label: 'Unix (milliseconds)', value: msOut },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded" style={{ background: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="text-muted mb-1" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px' }}>{label.toUpperCase()}</div>
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <code style={{ fontSize: '0.87rem', color: 'var(--text)' }}>{value}</code>
                      {value !== '—' && value !== 'Invalid date' && <CopyWithToast text={value} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
