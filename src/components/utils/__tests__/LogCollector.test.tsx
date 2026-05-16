import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as logCollector from '../../../utils/logCollector';

// ── module mocks ─────────────────────────────────────────────────────────────

// Mock the logCollector utilities so tests are hermetic
vi.mock('../../../utils/logCollector', async (importOriginal) => {
  const actual = await importOriginal<typeof logCollector>();
  return {
    ...actual,
    getLogs: vi.fn(),
    clearLogs: vi.fn(),
    subscribeToLogs: vi.fn(),
    exportLogsAsText: vi.fn(() => 'plain text export'),
    exportLogsAsJson: vi.fn(() => '{"logs":[]}'),
    installLogCollector: vi.fn(),
  };
});

// Mock URL.createObjectURL and URL.revokeObjectURL (not available in jsdom)
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// ── helpers ───────────────────────────────────────────────────────────────────

import { LogCollector } from '../LogCollector';
import { LogEntry } from '../../../utils/logCollector';

const makeEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: 'test-1',
  level: 'error',
  message: 'Test error message',
  timestamp: new Date('2024-01-01T12:00:00Z'),
  source: 'console',
  ...overrides,
});

function setupMocks(entries: LogEntry[] = []) {
  vi.mocked(logCollector.getLogs).mockReturnValue(entries);
  vi.mocked(logCollector.subscribeToLogs).mockImplementation(listener => {
    listener(entries);
    return vi.fn();
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('LogCollector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    setupMocks();
    render(<LogCollector />);
    expect(screen.getByRole('heading', { name: /log collector/i })).toBeInTheDocument();
  });

  it('shows empty-state message when no logs are captured', () => {
    setupMocks([]);
    render(<LogCollector />);
    expect(screen.getByText(/no logs captured yet/i)).toBeInTheDocument();
  });

  it('renders log entries in the table', () => {
    const entries = [
      makeEntry({ id: 'e1', level: 'error', message: 'Something broke', source: 'console' }),
      makeEntry({ id: 'e2', level: 'warn', message: 'Watch out', source: 'console' }),
    ];
    setupMocks(entries);
    render(<LogCollector />);
    expect(screen.getByText('Something broke')).toBeInTheDocument();
    expect(screen.getByText('Watch out')).toBeInTheDocument();
  });

  it('renders level badges for each entry', () => {
    const entries = [
      makeEntry({ id: 'e1', level: 'error', message: 'error msg' }),
      makeEntry({ id: 'e2', level: 'warn', message: 'warn msg' }),
    ];
    setupMocks(entries);
    render(<LogCollector />);
    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(screen.getByText('WARN')).toBeInTheDocument();
  });

  it('shows filter buttons with counts', () => {
    const entries = [
      makeEntry({ id: 'e1', level: 'error' }),
      makeEntry({ id: 'e2', level: 'error' }),
      makeEntry({ id: 'e3', level: 'warn' }),
    ];
    setupMocks(entries);
    render(<LogCollector />);
    expect(screen.getByRole('button', { name: /show all logs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show error logs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show warn logs/i })).toBeInTheDocument();
  });

  it('filters entries by level when level button is clicked', () => {
    const entries = [
      makeEntry({ id: 'e1', level: 'error', message: 'error msg' }),
      makeEntry({ id: 'e2', level: 'warn', message: 'warn msg' }),
    ];
    setupMocks(entries);
    render(<LogCollector />);

    fireEvent.click(screen.getByRole('button', { name: /show error logs/i }));
    expect(screen.getByText('error msg')).toBeInTheDocument();
    expect(screen.queryByText('warn msg')).not.toBeInTheDocument();
  });

  it('shows no-match message when search finds nothing', () => {
    setupMocks([makeEntry({ message: 'hello world' })]);
    render(<LogCollector />);
    const searchInput = screen.getByPlaceholderText(/search messages/i);
    fireEvent.change(searchInput, { target: { value: 'zzznomatch' } });
    expect(screen.getByText(/no logs match the current filter/i)).toBeInTheDocument();
  });

  it('filters entries by search query', () => {
    const entries = [
      makeEntry({ id: 'e1', message: 'alpha error' }),
      makeEntry({ id: 'e2', message: 'beta warning' }),
    ];
    setupMocks(entries);
    render(<LogCollector />);
    const searchInput = screen.getByPlaceholderText(/search messages/i);
    fireEvent.change(searchInput, { target: { value: 'alpha' } });
    expect(screen.getByText('alpha error')).toBeInTheDocument();
    expect(screen.queryByText('beta warning')).not.toBeInTheDocument();
  });

  it('clears search when ✕ button is clicked', () => {
    setupMocks([makeEntry({ message: 'hello' })]);
    render(<LogCollector />);
    const searchInput = screen.getByPlaceholderText(/search messages/i);
    fireEvent.change(searchInput, { target: { value: 'hello' } });
    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearBtn);
    expect((searchInput as HTMLInputElement).value).toBe('');
  });

  it('calls clearLogs when Clear button is clicked', () => {
    setupMocks([makeEntry()]);
    render(<LogCollector />);
    fireEvent.click(screen.getByRole('button', { name: /clear all logs/i }));
    expect(logCollector.clearLogs).toHaveBeenCalledTimes(1);
  });

  it('Clear button is disabled when there are no logs', () => {
    setupMocks([]);
    render(<LogCollector />);
    expect(screen.getByRole('button', { name: /clear all logs/i })).toBeDisabled();
  });

  it('Export .txt button triggers download when logs exist', () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    setupMocks([makeEntry()]);
    render(<LogCollector />);
    fireEvent.click(screen.getByRole('button', { name: /export logs as plain text/i }));
    expect(clickSpy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('Export .json button triggers download when logs exist', () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    setupMocks([makeEntry()]);
    render(<LogCollector />);
    fireEvent.click(screen.getByRole('button', { name: /export logs as json/i }));
    expect(clickSpy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('Export buttons are disabled when no logs match the filter', () => {
    setupMocks([]);
    render(<LogCollector />);
    expect(screen.getByRole('button', { name: /export logs as plain text/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /export logs as json/i })).toBeDisabled();
  });

  it('Report Issue button renders a link to GitHub issues', () => {
    setupMocks([makeEntry()]);
    const { container } = render(<LogCollector />);
    const link = container.querySelector('a[aria-label="Report issue on GitHub"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toContain('github.com/kobenguyent/qa-utils/issues/new');
  });
  it('Pause button toggles live update state', () => {
    setupMocks([]);
    render(<LogCollector />);
    const pauseBtn = screen.getByRole('button', { name: /pause log updates/i });
    fireEvent.click(pauseBtn);
    expect(screen.getByRole('button', { name: /resume log updates/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /resume log updates/i }));
    expect(screen.getByRole('button', { name: /pause log updates/i })).toBeInTheDocument();
  });

  it('expands stack trace row when a row with a stack is clicked', () => {
    const entry = makeEntry({ stack: 'Error\n  at foo (bar.ts:1)' });
    setupMocks([entry]);
    const { container } = render(<LogCollector />);
    // Row should show the toggle indicator
    expect(screen.getByText(/show stack/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/show stack/i));
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain('at foo');
  });

  it('reactively updates when subscribeToLogs callback fires', () => {
    let capturedListener: ((entries: LogEntry[]) => void) | null = null;
    vi.mocked(logCollector.subscribeToLogs).mockImplementation(listener => {
      capturedListener = listener;
      listener([]);
      return vi.fn();
    });
    vi.mocked(logCollector.getLogs).mockReturnValue([]);
    render(<LogCollector />);
    expect(screen.getByText(/no logs captured yet/i)).toBeInTheDocument();

    act(() => {
      if (capturedListener) capturedListener([makeEntry({ message: 'live update msg' })]);
    });
    expect(screen.getByText('live update msg')).toBeInTheDocument();
  });
});
