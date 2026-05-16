import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Row, Col, Button, Form, Badge, ButtonGroup,
  InputGroup, Table, Tooltip, OverlayTrigger,
} from 'react-bootstrap';
import {
  getLogs, clearLogs, subscribeToLogs, exportLogsAsText, exportLogsAsJson,
  LogEntry, LogLevel,
} from '../../utils/logCollector';

// ── helpers ──────────────────────────────────────────────────────────────────

const LEVEL_VARIANTS: Record<LogLevel, string> = {
  error: 'danger',
  warn: 'warning',
  info: 'info',
  log: 'secondary',
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  error: '🔴 Error',
  warn:  '🟡 Warn',
  info:  '🔵 Info',
  log:   '⚪ Log',
};

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildGitHubIssueUrl(entries: LogEntry[]): string {
  const base = 'https://github.com/kobenguyent/qa-utils/issues/new';
  const title = encodeURIComponent('[Bug] Log report from QA Utils');
  const errors = entries.filter(e => e.level === 'error').slice(0, 5);
  const body = encodeURIComponent(
    [
      '## Bug Description',
      '',
      '<!-- Describe what happened -->',
      '',
      '## Log Snapshot',
      '',
      '```',
      errors.length
        ? errors.map(e => `[${e.timestamp.toISOString()}] [${e.level.toUpperCase()}] ${e.message}${e.stack ? `\n${e.stack}` : ''}`).join('\n---\n')
        : '(no errors captured — see attached log export)',
      '```',
      '',
      '## Steps to Reproduce',
      '',
      '1. ',
      '',
      '## Environment',
      `- App: ${window.location.href}`,
      `- User Agent: ${navigator.userAgent}`,
    ].join('\n'),
  );
  return `${base}?title=${title}&body=${body}&labels=bug`;
}

// ── component ─────────────────────────────────────────────────────────────────

type LevelFilter = LogLevel | 'all';

export const LogCollector: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(() => getLogs());
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const unsub = subscribeToLogs(incoming => {
      if (!pausedRef.current) setLogs(incoming);
    });
    return unsub;
  }, []);

  const counts = logs.reduce<Record<LogLevel, number>>(
    (acc, e) => { acc[e.level] = (acc[e.level] ?? 0) + 1; return acc; },
    { error: 0, warn: 0, info: 0, log: 0 },
  );

  const filtered = logs.filter(e => {
    if (levelFilter !== 'all' && e.level !== levelFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.message.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        (e.stack ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleClear = useCallback(() => {
    clearLogs();
    setLogs([]);
  }, []);

  const handleExportText = useCallback(() => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(exportLogsAsText(filtered), `qa-utils-logs-${ts}.txt`, 'text/plain');
  }, [filtered]);

  const handleExportJson = useCallback(() => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(exportLogsAsJson(filtered), `qa-utils-logs-${ts}.json`, 'application/json');
  }, [filtered]);

  return (
    <Container className="tool-page">
      {/* ── Header ── */}
      <div className="tool-header animate-fade-in-up">
        <div className="tool-header-icon">📋</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title mb-0">Log Collector</h1>
          <p className="tool-header-desc mt-1">
            Capture, filter, and export application logs to diagnose errors and
            report issues on GitHub.
          </p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="tool-card mb-3">
        <div className="tool-card-body">
          <Row className="g-2 align-items-center">
            {/* Level filter */}
            <Col xs={12} md="auto">
              <ButtonGroup size="sm" aria-label="Filter by log level">
                {(['all', 'error', 'warn', 'info', 'log'] as const).map(lvl => (
                  <Button
                    key={lvl}
                    variant={levelFilter === lvl ? 'primary' : 'outline-secondary'}
                    onClick={() => setLevelFilter(lvl)}
                    aria-pressed={levelFilter === lvl}
                    aria-label={`Show ${lvl} logs`}
                  >
                    {lvl === 'all'
                      ? `All (${logs.length})`
                      : `${LEVEL_LABELS[lvl]} (${counts[lvl]})`}
                  </Button>
                ))}
              </ButtonGroup>
            </Col>

            {/* Search */}
            <Col xs={12} md>
              <InputGroup size="sm">
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Search messages…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search log messages"
                />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch('')} aria-label="Clear search">
                    ✕
                  </Button>
                )}
              </InputGroup>
            </Col>

            {/* Action buttons */}
            <Col xs={12} md="auto" className="d-flex gap-2 flex-wrap">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="pause-tip">{paused ? 'Resume live updates' : 'Pause live updates'}</Tooltip>}
              >
                <Button
                  size="sm"
                  variant={paused ? 'warning' : 'outline-secondary'}
                  onClick={() => setPaused(p => !p)}
                  aria-label={paused ? 'Resume log updates' : 'Pause log updates'}
                >
                  {paused ? '▶ Resume' : '⏸ Pause'}
                </Button>
              </OverlayTrigger>

              <Button
                size="sm"
                variant="outline-danger"
                onClick={handleClear}
                disabled={logs.length === 0}
                aria-label="Clear all logs"
              >
                🗑 Clear
              </Button>

              <Button
                size="sm"
                variant="outline-secondary"
                onClick={handleExportText}
                disabled={filtered.length === 0}
                aria-label="Export logs as plain text"
              >
                ⬇ Export .txt
              </Button>

              <Button
                size="sm"
                variant="outline-secondary"
                onClick={handleExportJson}
                disabled={filtered.length === 0}
                aria-label="Export logs as JSON"
              >
                ⬇ Export .json
              </Button>

              <Button
                size="sm"
                variant="outline-primary"
                href={buildGitHubIssueUrl(logs)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Report issue on GitHub"
              >
                🐛 Report Issue
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {/* ── Log table ── */}
      <div className="tool-card">
        <div className="tool-card-body p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'var(--muted)' }}>
              <div style={{ fontSize: '2.5rem' }}>📭</div>
              <p className="mt-2 mb-0">
                {logs.length === 0
                  ? 'No logs captured yet. Interact with the app to generate logs.'
                  : 'No logs match the current filter.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table
                size="sm"
                hover
                className="mb-0"
                style={{
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ width: '8rem', whiteSpace: 'nowrap' }}>Time</th>
                    <th style={{ width: '5.5rem' }}>Level</th>
                    <th style={{ width: '7rem' }}>Source</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(entry => (
                    <LogRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-end mt-2" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
          Showing {filtered.length} of {logs.length} entries
          {paused && <span className="ms-2" style={{ color: 'var(--warning)' }}>⏸ Paused</span>}
        </p>
      )}
    </Container>
  );
};

// ── LogRow ────────────────────────────────────────────────────────────────────

interface LogRowProps {
  entry: LogEntry;
}

const LogRow: React.FC<LogRowProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const hasStack = Boolean(entry.stack);

  const timeStr = entry.timestamp.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <>
      <tr
        onClick={() => { if (hasStack) setExpanded(e => !e); }}
        style={{
          cursor: hasStack ? 'pointer' : 'default',
          verticalAlign: 'top',
          borderLeft: `3px solid var(--${LEVEL_VARIANTS[entry.level]})`,
        }}
        aria-expanded={hasStack ? expanded : undefined}
        aria-label={`${entry.level} log at ${timeStr}: ${entry.message.slice(0, 80)}`}
      >
        <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {timeStr}
        </td>
        <td>
          <Badge bg={LEVEL_VARIANTS[entry.level]} style={{ fontSize: '0.65rem' }}>
            {entry.level.toUpperCase()}
          </Badge>
        </td>
        <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '7rem' }}>
          {entry.source}
        </td>
        <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {entry.message}
          {hasStack && (
            <span style={{ color: 'var(--muted)', marginLeft: '0.4rem', fontSize: '0.7rem' }}>
              {expanded ? '▲ hide stack' : '▼ show stack'}
            </span>
          )}
        </td>
      </tr>
      {expanded && hasStack && (
        <tr>
          <td colSpan={4} style={{ padding: '0 0.5rem 0.5rem 3.5rem', background: 'var(--bg-secondary)' }}>
            <pre
              style={{
                margin: 0,
                fontSize: '0.7rem',
                color: 'var(--danger)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {entry.stack}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
};

export default LogCollector;
