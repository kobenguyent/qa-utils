import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge, Button, ButtonGroup, Form, InputGroup, Table } from 'react-bootstrap';
import {
  getLogs,
  clearLogs,
  subscribeToLogs,
  exportLogsAsText,
  exportLogsAsJson,
  LogEntry,
  LogLevel,
} from '../utils/logCollector';
import './LogCollectorWidget.css';

// ── helpers ──────────────────────────────────────────────────────────────────

const LEVEL_VARIANTS: Record<LogLevel, string> = {
  error: 'danger',
  warn: 'warning',
  info: 'info',
  log: 'secondary',
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
        ? errors
            .map(e => `[${e.timestamp.toISOString()}] [${e.level.toUpperCase()}] ${e.message}${e.stack ? `\n${e.stack}` : ''}`)
            .join('\n---\n')
        : '(no errors captured — see attached log export)',
      '```',
      '',
      '## Steps to Reproduce',
      '',
      '1. ',
      '',
      '## Environment',
      `- App: ${typeof window !== 'undefined' ? window.location.href : ''}`,
      `- User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
    ].join('\n'),
  );
  return `${base}?title=${title}&body=${body}&labels=bug`;
}

type LevelFilter = LogLevel | 'all';

// ── Log row component ─────────────────────────────────────────────────────────

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
      >
        <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
          {timeStr}
        </td>
        <td>
          <Badge bg={LEVEL_VARIANTS[entry.level]} style={{ fontSize: '0.6rem' }}>
            {entry.level.toUpperCase()}
          </Badge>
        </td>
        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {entry.message}
          {hasStack && (
            <span style={{ color: 'var(--muted)', marginLeft: '0.4rem', fontSize: '0.65rem' }}>
              {expanded ? '▲' : '▼ stack'}
            </span>
          )}
        </td>
      </tr>
      {expanded && hasStack && (
        <tr>
          <td colSpan={3} style={{ padding: '0 0.5rem 0.5rem 2rem', background: 'var(--bg-secondary)' }}>
            <pre
              style={{
                margin: 0,
                fontSize: '0.65rem',
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

// ── Main widget ──────────────────────────────────────────────────────────────

export const LogCollectorWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => getLogs());
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');
  const pausedRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeToLogs(incoming => {
      if (!pausedRef.current) setLogs(incoming);
    });
    return unsub;
  }, []);

  const errorCount = logs.filter(e => e.level === 'error').length;

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

  const makeExportTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

  const handleExportText = useCallback(() => {
    downloadFile(exportLogsAsText(filtered), `qa-utils-logs-${makeExportTimestamp()}.txt`, 'text/plain');
  }, [filtered]);

  const handleExportJson = useCallback(() => {
    downloadFile(exportLogsAsJson(filtered), `qa-utils-logs-${makeExportTimestamp()}.json`, 'application/json');
  }, [filtered]);

  return (
    <div className="log-collector-widget" aria-label="Log Collector widget">
      {/* Floating Action Button */}
      <button
        className={`log-collector-fab${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        title={isOpen ? 'Close Log Collector' : 'Open Log Collector'}
        aria-label={isOpen ? 'Close Log Collector' : 'Open Log Collector'}
      >
        {isOpen ? '✕' : '🐛'}
        {!isOpen && errorCount > 0 && (
          <span className="log-collector-badge" aria-label={`${errorCount} errors`}>
            {errorCount > 99 ? '99+' : errorCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="log-collector-panel" role="dialog" aria-label="Log Collector panel">
          {/* Header */}
          <div className="log-collector-header">
            <span>🐛 Log Collector</span>
            <div className="log-collector-header-actions">
              <a
                href="#/log-collector"
                className="log-collector-expand"
                title="Open full-page view"
                aria-label="Open full-page Log Collector"
                onClick={() => setIsOpen(false)}
              >
                ↗
              </a>
            </div>
          </div>

          {/* Toolbar */}
          <div className="log-collector-toolbar">
            {/* Level filter */}
            <ButtonGroup size="sm" className="log-collector-levels" aria-label="Filter by log level">
              {(['all', 'error', 'warn', 'info', 'log'] as const).map(lvl => {
                const count = lvl === 'all' ? logs.length : logs.filter(e => e.level === lvl).length;
                return (
                  <Button
                    key={lvl}
                    size="sm"
                    variant={levelFilter === lvl ? 'primary' : 'outline-secondary'}
                    onClick={() => setLevelFilter(lvl)}
                    aria-pressed={levelFilter === lvl}
                    aria-label={`Show ${lvl} logs`}
                    style={{ fontSize: '0.65rem', padding: '1px 6px' }}
                  >
                    {lvl === 'all' ? `All ${count}` : `${lvl} ${count}`}
                  </Button>
                );
              })}
            </ButtonGroup>

            {/* Search */}
            <InputGroup size="sm" style={{ marginTop: '6px' }}>
              <Form.Control
                type="search"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search log messages"
                style={{ fontSize: '0.75rem' }}
              />
            </InputGroup>
          </div>

          {/* Log list */}
          <div className="log-collector-body">
            {filtered.length === 0 ? (
              <div className="log-collector-empty">
                {logs.length === 0 ? 'No logs captured yet.' : 'No logs match the filter.'}
              </div>
            ) : (
              <Table size="sm" hover className="mb-0 log-collector-table" style={{ color: 'var(--text)' }}>
                <tbody>
                  {filtered.map(entry => (
                    <LogRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {/* Footer actions */}
          <div className="log-collector-footer">
            <Button
              size="sm"
              variant="outline-danger"
              onClick={handleClear}
              disabled={logs.length === 0}
              aria-label="Clear all logs"
              style={{ fontSize: '0.7rem' }}
            >
              🗑 Clear
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={handleExportText}
              disabled={filtered.length === 0}
              aria-label="Export logs as plain text"
              style={{ fontSize: '0.7rem' }}
            >
              ⬇ .txt
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={handleExportJson}
              disabled={filtered.length === 0}
              aria-label="Export logs as JSON"
              style={{ fontSize: '0.7rem' }}
            >
              ⬇ .json
            </Button>
            <Button
              as="a"
              size="sm"
              variant="outline-primary"
              href={buildGitHubIssueUrl(logs)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Report issue on GitHub"
              style={{ fontSize: '0.7rem' }}
            >
              🐛 Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogCollectorWidget;
