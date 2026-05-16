/**
 * Log Collector — singleton service that captures console output and global
 * unhandled errors so they can be inspected, filtered, and exported from the
 * LogCollector tool page.
 *
 * The collector is installed automatically when this module is first imported.
 * It patches console.error / warn / info / log and listens for window error
 * and unhandledrejection events.  The original console methods are still
 * called, so DevTools output is unchanged.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'log';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  /** Optional stack trace (errors only) */
  stack?: string;
  /** Source tag — 'console' | 'window.onerror' | 'unhandledrejection' | 'ErrorBoundary' */
  source: string;
}

type LogListener = (entries: LogEntry[]) => void;

const MAX_ENTRIES = 500;

let _entries: LogEntry[] = [];
let _idCounter = 0;
let _installed = false;
const _listeners = new Set<LogListener>();

/** Notify all registered listeners with the current snapshot. */
function _notify(): void {
  const snapshot = [..._entries];
  _listeners.forEach(fn => fn(snapshot));
}

function _makeId(): string {
  return `log-${Date.now()}-${++_idCounter}`;
}

function _addEntry(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
  const full: LogEntry = {
    id: _makeId(),
    timestamp: new Date(),
    ...entry,
  };
  _entries = [full, ..._entries].slice(0, MAX_ENTRIES);
  _notify();
}

/** Serialize any number of console arguments to a single string. */
function _argsToString(args: unknown[]): string {
  return args
    .map(a => {
      if (a === null) return 'null';
      if (a === undefined) return 'undefined';
      if (a instanceof Error) return `${a.name}: ${a.message}`;
      if (typeof a === 'object') {
        try { return JSON.stringify(a, null, 2); } catch { return String(a); }
      }
      return String(a);
    })
    .join(' ');
}

/** Install console patches and global error listeners.  Safe to call twice. */
export function installLogCollector(): void {
  if (_installed || typeof window === 'undefined') return;
  _installed = true;

  const originalConsole = {
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
    log: console.log.bind(console),
  };

  const patch = (level: LogLevel) =>
    (...args: unknown[]) => {
      // Call original first so DevTools stays unaffected
      (originalConsole[level] as (...a: unknown[]) => void)(...args);
      const first = args[0];
      const stack = first instanceof Error ? first.stack : undefined;
      _addEntry({ level, message: _argsToString(args), source: 'console', stack });
    };

  console.error = patch('error');
  console.warn  = patch('warn');
  console.info  = patch('info');
  console.log   = patch('log');

  window.addEventListener('error', (event: ErrorEvent) => {
    _addEntry({
      level: 'error',
      message: event.message || 'Unknown error',
      source: 'window.onerror',
      stack: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? `${reason.name}: ${reason.message}`
        : String(reason ?? 'Unhandled promise rejection');
    _addEntry({
      level: 'error',
      message,
      source: 'unhandledrejection',
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Return a snapshot of all collected log entries (newest first). */
export function getLogs(): LogEntry[] {
  return [..._entries];
}

/** Remove all stored log entries and notify listeners. */
export function clearLogs(): void {
  _entries = [];
  _notify();
}

/**
 * Record a log entry directly — used by ErrorBoundary and other non-console
 * error paths.
 */
export function recordLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
  _addEntry(entry);
}

/** Subscribe to log updates.  Returns an unsubscribe function. */
export function subscribeToLogs(listener: LogListener): () => void {
  _listeners.add(listener);
  // Immediately deliver current snapshot
  listener([..._entries]);
  return () => { _listeners.delete(listener); };
}

/**
 * Build a plain-text representation of the logs suitable for a bug report.
 */
export function exportLogsAsText(entries: LogEntry[]): string {
  const header = [
    '=== QA Utils — Log Export ===',
    `Exported: ${new Date().toISOString()}`,
    `Total entries: ${entries.length}`,
    '',
  ].join('\n');

  const body = entries
    .map(e => {
      const lines = [
        `[${e.timestamp.toISOString()}] [${e.level.toUpperCase()}] [${e.source}]`,
        e.message,
      ];
      if (e.stack) lines.push(e.stack);
      return lines.join('\n');
    })
    .join('\n---\n');

  return header + body;
}

/**
 * Build a JSON string representation of the logs.
 */
export function exportLogsAsJson(entries: LogEntry[]): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    totalEntries: entries.length,
    logs: entries.map(e => ({
      id: e.id,
      timestamp: e.timestamp.toISOString(),
      level: e.level,
      source: e.source,
      message: e.message,
      ...(e.stack ? { stack: e.stack } : {}),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

// Auto-install when this module is loaded in a browser context
installLogCollector();
