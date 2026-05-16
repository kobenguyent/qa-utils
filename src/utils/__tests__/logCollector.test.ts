import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need isolated state for each test.  The logCollector module uses module-level
// mutable state, so we re-import a fresh copy of the pure exported functions
// via named imports and reset state between tests by calling clearLogs().

import {
  getLogs,
  clearLogs,
  recordLog,
  subscribeToLogs,
  exportLogsAsText,
  exportLogsAsJson,
  installLogCollector,
} from '../logCollector';

describe('logCollector utility', () => {
  beforeEach(() => {
    clearLogs();
  });

  // ── recordLog ──────────────────────────────────────────────────────────────

  describe('recordLog', () => {
    it('adds an entry to the log store', () => {
      recordLog({ level: 'error', message: 'boom', source: 'test' });
      const logs = getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('boom');
      expect(logs[0].level).toBe('error');
      expect(logs[0].source).toBe('test');
    });

    it('assigns a unique id to each entry', () => {
      recordLog({ level: 'log', message: 'a', source: 'test' });
      recordLog({ level: 'log', message: 'b', source: 'test' });
      const logs = getLogs();
      expect(logs[0].id).not.toBe(logs[1].id);
    });

    it('adds a timestamp to each entry', () => {
      const before = Date.now();
      recordLog({ level: 'info', message: 'ts test', source: 'test' });
      const after = Date.now();
      const ts = getLogs()[0].timestamp.getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it('stores entries newest-first', () => {
      recordLog({ level: 'log', message: 'first', source: 'test' });
      recordLog({ level: 'log', message: 'second', source: 'test' });
      const logs = getLogs();
      expect(logs[0].message).toBe('second');
      expect(logs[1].message).toBe('first');
    });

    it('preserves optional stack field', () => {
      recordLog({ level: 'error', message: 'err', source: 'test', stack: 'Error\n  at foo' });
      expect(getLogs()[0].stack).toBe('Error\n  at foo');
    });
  });

  // ── clearLogs ─────────────────────────────────────────────────────────────

  describe('clearLogs', () => {
    it('removes all entries', () => {
      recordLog({ level: 'warn', message: 'x', source: 'test' });
      clearLogs();
      expect(getLogs()).toHaveLength(0);
    });
  });

  // ── getLogs ───────────────────────────────────────────────────────────────

  describe('getLogs', () => {
    it('returns a snapshot (not the live array)', () => {
      recordLog({ level: 'log', message: 'snap', source: 'test' });
      const snapshot = getLogs();
      clearLogs();
      // snapshot should still contain the old entry
      expect(snapshot).toHaveLength(1);
      expect(getLogs()).toHaveLength(0);
    });
  });

  // ── subscribeToLogs ───────────────────────────────────────────────────────

  describe('subscribeToLogs', () => {
    it('calls listener immediately with current entries', () => {
      recordLog({ level: 'info', message: 'immediate', source: 'test' });
      const listener = vi.fn();
      const unsub = subscribeToLogs(listener);
      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ message: 'immediate' })]),
      );
      unsub();
    });

    it('calls listener when new entries are added', () => {
      const listener = vi.fn();
      const unsub = subscribeToLogs(listener);
      listener.mockClear();
      recordLog({ level: 'warn', message: 'new entry', source: 'test' });
      expect(listener).toHaveBeenCalledTimes(1);
      unsub();
    });

    it('stops calling listener after unsubscribe', () => {
      const listener = vi.fn();
      const unsub = subscribeToLogs(listener);
      unsub();
      listener.mockClear();
      recordLog({ level: 'log', message: 'after unsub', source: 'test' });
      expect(listener).not.toHaveBeenCalled();
    });

    it('calls listener with empty array after clearLogs', () => {
      recordLog({ level: 'error', message: 'before clear', source: 'test' });
      const listener = vi.fn();
      const unsub = subscribeToLogs(listener);
      listener.mockClear();
      clearLogs();
      expect(listener).toHaveBeenCalledWith([]);
      unsub();
    });
  });

  // ── exportLogsAsText ──────────────────────────────────────────────────────

  describe('exportLogsAsText', () => {
    it('returns a string containing the export header', () => {
      const entries = getLogs();
      const text = exportLogsAsText(entries);
      expect(text).toContain('QA Utils — Log Export');
    });

    it('includes message content', () => {
      recordLog({ level: 'error', message: 'text export msg', source: 'test' });
      const text = exportLogsAsText(getLogs());
      expect(text).toContain('text export msg');
    });

    it('includes ERROR label for error entries', () => {
      recordLog({ level: 'error', message: 'oops', source: 'test' });
      const text = exportLogsAsText(getLogs());
      expect(text).toContain('[ERROR]');
    });

    it('includes stack when present', () => {
      recordLog({ level: 'error', message: 'oops', source: 'test', stack: 'Error\n  at bar' });
      const text = exportLogsAsText(getLogs());
      expect(text).toContain('at bar');
    });
  });

  // ── exportLogsAsJson ──────────────────────────────────────────────────────

  describe('exportLogsAsJson', () => {
    it('returns valid JSON', () => {
      recordLog({ level: 'info', message: 'json test', source: 'test' });
      const json = exportLogsAsJson(getLogs());
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('includes exportedAt and totalEntries fields', () => {
      recordLog({ level: 'log', message: 'meta test', source: 'test' });
      const parsed = JSON.parse(exportLogsAsJson(getLogs()));
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('totalEntries', 1);
    });

    it('serialises timestamp as ISO string', () => {
      recordLog({ level: 'warn', message: 'iso', source: 'test' });
      const parsed = JSON.parse(exportLogsAsJson(getLogs()));
      expect(typeof parsed.logs[0].timestamp).toBe('string');
      expect(parsed.logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('omits stack field when not present', () => {
      recordLog({ level: 'log', message: 'no stack', source: 'test' });
      const parsed = JSON.parse(exportLogsAsJson(getLogs()));
      expect(parsed.logs[0]).not.toHaveProperty('stack');
    });

    it('includes stack field when present', () => {
      recordLog({ level: 'error', message: 'with stack', source: 'test', stack: 'Error\n  at baz' });
      const parsed = JSON.parse(exportLogsAsJson(getLogs()));
      expect(parsed.logs[0]).toHaveProperty('stack');
    });
  });

  // ── installLogCollector ───────────────────────────────────────────────────

  describe('installLogCollector', () => {
    it('is idempotent — calling multiple times does not throw', () => {
      // installLogCollector is already called on module import;
      // subsequent calls should be no-ops and must not throw.
      expect(() => installLogCollector()).not.toThrow();
      expect(() => installLogCollector()).not.toThrow();
    });

    it('console methods still work after install', () => {
      expect(() => console.error('test idempotent error')).not.toThrow();
    });
  });
});
