import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import JSZip from 'jszip';
import {
  parsePlaywrightTrace,
  fetchAndParseTraceFromUrl,
  getActionLabel,
  getActionStatusColor,
  getActionIcon,
  TraceAction,
} from '../playwrightTraceReader';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal .zip Blob that mimics a Playwright trace archive. */
async function buildTraceZip(
  traceLines: object[],
  networkLines: object[] = [],
  prefix = '',
): Promise<Blob> {
  const zip = new JSZip();
  const traceFileName = prefix ? `${prefix}trace.trace` : 'trace.trace';
  const netFileName = prefix ? `${prefix}trace.network` : 'trace.network';
  zip.file(traceFileName, traceLines.map(l => JSON.stringify(l)).join('\n'));
  if (networkLines.length > 0) {
    zip.file(netFileName, networkLines.map(l => JSON.stringify(l)).join('\n'));
  }
  return zip.generateAsync({ type: 'blob' });
}

function makeFile(blob: Blob, name = 'trace.zip'): File {
  return new File([blob], name, { type: 'application/zip' });
}

// ─── Sample trace data ────────────────────────────────────────────────────────

const CONTEXT_OPTIONS = {
  type: 'context-options',
  browserName: 'chromium',
  platform: 'linux',
  wallTime: 1700000000,
  title: 'My test',
  sdkLanguage: 'javascript',
};

const BEFORE_GOTO = {
  type: 'before',
  callId: 'call1',
  startTime: 1000,
  apiName: 'Page.goto',
  params: { url: 'https://example.com' },
  pageId: 'page1',
};

const AFTER_GOTO = {
  type: 'after',
  callId: 'call1',
  endTime: 1500,
  error: null,
  log: ['navigating to https://example.com'],
  snapshots: [],
};

const BEFORE_CLICK = {
  type: 'before',
  callId: 'call2',
  startTime: 1600,
  apiName: 'Locator.click',
  params: { selector: 'button#submit' },
  pageId: 'page1',
};

const AFTER_CLICK = {
  type: 'after',
  callId: 'call2',
  endTime: 1650,
  error: null,
  log: [],
  snapshots: [],
};

const BEFORE_FILL = {
  type: 'before',
  callId: 'call3',
  startTime: 1700,
  apiName: 'Locator.fill',
  params: { selector: '#email', value: 'user@example.com' },
  pageId: 'page1',
};

const AFTER_FILL_ERROR = {
  type: 'after',
  callId: 'call3',
  endTime: 1750,
  error: { message: 'Element not found' },
  log: [],
  snapshots: [],
};

const NET_REQUEST = {
  type: 'request',
  requestId: 'req1',
  url: 'https://example.com/api/data',
  method: 'GET',
  headers: [{ name: 'accept', value: 'application/json' }],
  isNavigationRequest: false,
  resourceType: 'xhr',
  timestamp: 1100,
};

const NET_RESPONSE = {
  type: 'response',
  requestId: 'req1',
  status: 200,
  statusText: 'OK',
  headers: [{ name: 'content-type', value: 'application/json' }],
  mimeType: 'application/json',
  timestamp: 1200,
};

const NET_FINISHED = {
  type: 'requestfinished',
  requestId: 'req1',
  timestamp: 1210,
};

const NET_REQUEST_FAILED = {
  type: 'request',
  requestId: 'req2',
  url: 'https://example.com/missing',
  method: 'GET',
  headers: [],
  isNavigationRequest: false,
  resourceType: 'document',
  timestamp: 1300,
};

const NET_FAILED = {
  type: 'requestfailed',
  requestId: 'req2',
  errorText: 'net::ERR_NAME_NOT_RESOLVED',
  timestamp: 1400,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('playwrightTraceReader', () => {
  // Mock URL.createObjectURL which is not available in jsdom
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  describe('parsePlaywrightTrace', () => {
    it('returns a parseError when given an invalid ZIP', async () => {
      const badBlob = new Blob(['not a zip'], { type: 'application/zip' });
      const result = await parsePlaywrightTrace(badBlob);
      expect(result.parseError).toBeTruthy();
    });

    it('returns a parseError when trace.trace is missing', async () => {
      const zip = new JSZip();
      zip.file('other.txt', 'hello');
      const blob = await zip.generateAsync({ type: 'blob' });
      const result = await parsePlaywrightTrace(blob);
      expect(result.parseError).toContain('trace');
    });

    it('parses metadata from context-options', async () => {
      const blob = await buildTraceZip([CONTEXT_OPTIONS, BEFORE_GOTO, AFTER_GOTO]);
      const result = await parsePlaywrightTrace(makeFile(blob));

      expect(result.metadata.browserName).toBe('chromium');
      expect(result.metadata.platform).toBe('linux');
      expect(result.metadata.wallTime).toBe(1700000000);
      expect(result.metadata.title).toBe('My test');
      expect(result.metadata.sdkLanguage).toBe('javascript');
    });

    it('builds actions from before/after pairs', async () => {
      const blob = await buildTraceZip([BEFORE_GOTO, AFTER_GOTO, BEFORE_CLICK, AFTER_CLICK]);
      const result = await parsePlaywrightTrace(makeFile(blob));

      expect(result.actions).toHaveLength(2);

      const goto = result.actions[0];
      expect(goto.callId).toBe('call1');
      expect(goto.apiName).toBe('Page.goto');
      expect(goto.name).toBe('page.goto');
      expect(goto.params).toEqual({ url: 'https://example.com' });
      expect(goto.startTime).toBe(1000);
      expect(goto.endTime).toBe(1500);
      expect(goto.duration).toBe(500);
      expect(goto.error).toBeNull();
      expect(goto.log).toEqual(['navigating to https://example.com']);
      expect(goto.pageId).toBe('page1');
    });

    it('captures error from after entry', async () => {
      const blob = await buildTraceZip([BEFORE_FILL, AFTER_FILL_ERROR]);
      const result = await parsePlaywrightTrace(makeFile(blob));

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].error).toBe('Element not found');
    });

    it('ignores orphaned after entries', async () => {
      const blob = await buildTraceZip([AFTER_GOTO]); // no before
      const result = await parsePlaywrightTrace(makeFile(blob));
      expect(result.actions).toHaveLength(0);
    });

    it('parses network requests', async () => {
      const blob = await buildTraceZip(
        [CONTEXT_OPTIONS],
        [NET_REQUEST, NET_RESPONSE, NET_FINISHED],
      );
      const result = await parsePlaywrightTrace(makeFile(blob));

      expect(result.networkRequests).toHaveLength(1);
      const req = result.networkRequests[0];
      expect(req.url).toBe('https://example.com/api/data');
      expect(req.method).toBe('GET');
      expect(req.status).toBe(200);
      expect(req.statusText).toBe('OK');
      expect(req.state).toBe('completed');
      expect(req.resourceType).toBe('xhr');
      expect(req.mimeType).toBe('application/json');
    });

    it('handles failed network requests', async () => {
      const blob = await buildTraceZip(
        [CONTEXT_OPTIONS],
        [NET_REQUEST_FAILED, NET_FAILED],
      );
      const result = await parsePlaywrightTrace(makeFile(blob));

      expect(result.networkRequests).toHaveLength(1);
      const req = result.networkRequests[0];
      expect(req.state).toBe('failed');
      expect(req.errorText).toBe('net::ERR_NAME_NOT_RESOLVED');
    });

    it('returns empty actions and network for empty trace.trace', async () => {
      const blob = await buildTraceZip([]);
      const result = await parsePlaywrightTrace(makeFile(blob));
      expect(result.actions).toHaveLength(0);
      expect(result.networkRequests).toHaveLength(0);
    });

    it('handles before entries with missing apiName without crashing', async () => {
      // Real traces can omit apiName; these entries are now filtered out (no apiName + no params = internal event)
      // An entry with apiName=undefined AND empty params is skipped as an internal event
      const beforeNoApi = { type: 'before', callId: 'c1', startTime: 100, params: {} };
      const afterNoApi = { type: 'after', callId: 'c1', endTime: 200, error: null, log: [] };
      const blob = await buildTraceZip([beforeNoApi, afterNoApi]);
      const result = await parsePlaywrightTrace(makeFile(blob));
      // Skipped because no apiName and no params — doesn't crash
      expect(result.actions).toHaveLength(0);
    });

    it('keeps before entries that have no apiName but do have params', async () => {
      // If params are present, the entry is not purely internal and should be kept
      const beforeWithParams = { type: 'before', callId: 'c1', startTime: 100, params: { selector: '#btn' } };
      const afterWithParams = { type: 'after', callId: 'c1', endTime: 200, error: null, log: [] };
      const blob = await buildTraceZip([beforeWithParams, afterWithParams]);
      const result = await parsePlaywrightTrace(makeFile(blob));
      expect(result.actions).toHaveLength(1);
      expect(typeof result.actions[0].name).toBe('string');
    });

    it('gracefully skips malformed JSONL lines', async () => {
      const zip = new JSZip();
      zip.file(
        'trace.trace',
        [
          JSON.stringify(CONTEXT_OPTIONS),
          'not valid json }{',
          JSON.stringify(BEFORE_GOTO),
          JSON.stringify(AFTER_GOTO),
        ].join('\n'),
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      const result = await parsePlaywrightTrace(blob);
      // Should still parse the valid entries
      expect(result.metadata.browserName).toBe('chromium');
      expect(result.actions).toHaveLength(1);
    });

    it('finds trace.trace inside a sub-folder (Playwright test-results structure)', async () => {
      const zip = new JSZip();
      zip.file('test-name/trace.trace', [CONTEXT_OPTIONS, BEFORE_GOTO, AFTER_GOTO].map(l => JSON.stringify(l)).join('\n'));
      const blob = await zip.generateAsync({ type: 'blob' });
      const result = await parsePlaywrightTrace(blob);
      expect(result.actions).toHaveLength(1);
    });

    it('handles real Playwright ZIP format with "0-trace.trace" prefix', async () => {
      const blob = await buildTraceZip([CONTEXT_OPTIONS, BEFORE_GOTO, AFTER_GOTO], [], '0-');
      const result = await parsePlaywrightTrace(makeFile(blob));
      expect(result.metadata.browserName).toBe('chromium');
      expect(result.actions).toHaveLength(1);
    });

    it('handles multiple prefixed trace files (merges them)', async () => {
      const zip = new JSZip();
      zip.file('0-trace.trace', [CONTEXT_OPTIONS, BEFORE_GOTO, AFTER_GOTO].map(l => JSON.stringify(l)).join('\n'));
      zip.file('1-trace.trace', [BEFORE_CLICK, AFTER_CLICK].map(l => JSON.stringify(l)).join('\n'));
      const blob = await zip.generateAsync({ type: 'blob' });
      const result = await parsePlaywrightTrace(blob);
      expect(result.actions).toHaveLength(2);
    });

    it('handles real Playwright ZIP format with "0-trace.network" prefix', async () => {
      const blob = await buildTraceZip(
        [CONTEXT_OPTIONS, BEFORE_GOTO, AFTER_GOTO],
        [NET_REQUEST, NET_RESPONSE, NET_FINISHED],
        '0-',
      );
      const result = await parsePlaywrightTrace(makeFile(blob));
      expect(result.networkRequests).toHaveLength(1);
      expect(result.networkRequests[0].status).toBe(200);
    });

    it('returns screenshots map (empty when no resource files)', async () => {
      const blob = await buildTraceZip([
        BEFORE_GOTO,
        { ...AFTER_GOTO, snapshots: [{ title: 'before', snapshotName: 'resources/abc123.png' }] },
      ]);
      const result = await parsePlaywrightTrace(makeFile(blob));
      // The sha1 is extracted but no file exists in the zip
      expect(result.screenshots).toBeDefined();
    });

    it('includes screenshot sha1s from snapshots', async () => {
      const afterWithSnapshot = {
        ...AFTER_GOTO,
        snapshots: [{ title: 'before', snapshotName: 'resources/deadbeef.png' }],
      };
      const blob = await buildTraceZip([BEFORE_GOTO, afterWithSnapshot]);
      const result = await parsePlaywrightTrace(makeFile(blob));
      expect(result.actions[0].screenshotSha1s).toContain('deadbeef');
    });

    it('parses call stacks from 0-trace.stacks and attaches to actions', async () => {
      const stackEntry = {
        callId: 'call1',
        callStack: [
          { file: 'test.spec.ts', line: 10, column: 3, function: 'myTest' },
          { file: 'helpers.ts', line: 55, column: 1, function: 'setup' },
        ],
      };
      const zip = new JSZip();
      zip.file('0-trace.trace', [CONTEXT_OPTIONS, BEFORE_GOTO, AFTER_GOTO].map(l => JSON.stringify(l)).join('\n'));
      zip.file('0-trace.stacks', JSON.stringify(stackEntry));
      const blob = await zip.generateAsync({ type: 'blob' });
      const result = await parsePlaywrightTrace(blob);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].callStack).toBeDefined();
      expect(result.actions[0].callStack).toHaveLength(2);
      expect(result.actions[0].callStack?.[0].file).toBe('test.spec.ts');
      expect(result.actions[0].callStack?.[0].line).toBe(10);
      expect(result.actions[0].callStack?.[0].function).toBe('myTest');
    });

    it('handles stacks entries with "stack" key instead of "callStack"', async () => {
      const stackEntry = {
        callId: 'call1',
        stack: [{ file: 'test.spec.ts', line: 5, column: 1, function: 'test' }],
      };
      const zip = new JSZip();
      zip.file('0-trace.trace', [BEFORE_GOTO, AFTER_GOTO].map(l => JSON.stringify(l)).join('\n'));
      zip.file('0-trace.stacks', JSON.stringify(stackEntry));
      const blob = await zip.generateAsync({ type: 'blob' });
      const result = await parsePlaywrightTrace(blob);
      expect(result.actions[0].callStack?.[0].file).toBe('test.spec.ts');
    });

    it('handles stacks callId with "s@" prefix', async () => {
      const stackEntry = { callId: 's@call1', callStack: [{ file: 'a.ts', line: 1, column: 0, function: '' }] };
      const zip = new JSZip();
      zip.file('0-trace.trace', [BEFORE_GOTO, AFTER_GOTO].map(l => JSON.stringify(l)).join('\n'));
      zip.file('0-trace.stacks', JSON.stringify(stackEntry));
      const blob = await zip.generateAsync({ type: 'blob' });
      const result = await parsePlaywrightTrace(blob);
      expect(result.actions[0].callStack).toBeDefined();
    });

    it('leaves callStack undefined when no stacks file present', async () => {
      const blob = await buildTraceZip([BEFORE_GOTO, AFTER_GOTO]);
      const result = await parsePlaywrightTrace(makeFile(blob));
      expect(result.actions[0].callStack).toBeUndefined();
    });
  });

  // ─── getActionLabel ─────────────────────────────────────────────────────────
  describe('getActionLabel', () => {
    const makeAction = (name: string, params: Record<string, unknown>): TraceAction => ({
      callId: 'x',
      apiName: name,
      name,
      params,
      startTime: 0,
      endTime: 100,
      duration: 100,
      error: null,
      log: [],
      screenshotSha1s: [],
    });

    it('formats goto', () => {
      expect(getActionLabel(makeAction('page.goto', { url: 'https://example.com' }))).toBe(
        'Navigate to https://example.com',
      );
    });

    it('formats click', () => {
      expect(getActionLabel(makeAction('locator.click', { selector: '#btn' }))).toBe('Click #btn');
    });

    it('formats fill', () => {
      expect(getActionLabel(makeAction('locator.fill', { selector: '#email', value: 'a@b.com' }))).toBe(
        'Fill "a@b.com" in #email',
      );
    });

    it('formats screenshot', () => {
      expect(getActionLabel(makeAction('page.screenshot', {}))).toBe('Take screenshot');
    });

    it('falls back to formatted apiName for unknown actions', () => {
      // "page.someUnknown" → "page: someUnknown" (Class: method format)
      expect(getActionLabel(makeAction('page.someUnknown', {}))).toBe('page: someUnknown');
    });
  });

  // ─── getActionStatusColor ───────────────────────────────────────────────────
  describe('getActionStatusColor', () => {
    const makeAction = (error: string | null, duration: number): TraceAction => ({
      callId: 'x',
      apiName: '',
      name: '',
      params: {},
      startTime: 0,
      endTime: duration,
      duration,
      error,
      log: [],
      screenshotSha1s: [],
    });

    it('returns danger for errored actions', () => {
      expect(getActionStatusColor(makeAction('oops', 100))).toBe('danger');
    });

    it('returns warning for slow actions', () => {
      expect(getActionStatusColor(makeAction(null, 6000))).toBe('warning');
    });

    it('returns success for normal actions', () => {
      expect(getActionStatusColor(makeAction(null, 200))).toBe('success');
    });
  });

  // ─── getActionIcon ──────────────────────────────────────────────────────────
  describe('getActionIcon', () => {
    const makeAction = (name: string): TraceAction => ({
      callId: 'x',
      apiName: '',
      name,
      params: {},
      startTime: 0,
      endTime: 0,
      duration: 0,
      error: null,
      log: [],
      screenshotSha1s: [],
    });

    it('returns globe for goto', () => {
      expect(getActionIcon(makeAction('page.goto'))).toBe('🌐');
    });

    it('returns mouse for click', () => {
      expect(getActionIcon(makeAction('locator.click'))).toBe('🖱️');
    });

    it('returns keyboard for fill', () => {
      expect(getActionIcon(makeAction('locator.fill'))).toBe('⌨️');
    });

    it('returns camera for screenshot', () => {
      expect(getActionIcon(makeAction('page.screenshot'))).toBe('📸');
    });

    it('returns play for unknown actions', () => {
      expect(getActionIcon(makeAction('page.unknownAction'))).toBe('▶️');
    });

    it('does not crash when action.name is empty string (missing apiName)', () => {
      // Regression: real traces can have before entries without apiName,
      // resulting in action.name === ''. Must not throw.
      expect(() => getActionIcon(makeAction(''))).not.toThrow();
      expect(() => getActionLabel({ ...makeAction(''), apiName: '', params: {} } as TraceAction)).not.toThrow();
    });
  });

  // ─── fetchAndParseTraceFromUrl ──────────────────────────────────────────────
  describe('fetchAndParseTraceFromUrl', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns parseError when fetch fails (network error)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      const result = await fetchAndParseTraceFromUrl('https://example.com/trace.zip');
      expect(result.parseError).toMatch(/Failed to fetch trace from URL/);
      expect(result.parseError).toMatch(/CORS/);
    });

    it('returns parseError on non-OK HTTP response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        blob: vi.fn(),
      }));
      const result = await fetchAndParseTraceFromUrl('https://example.com/missing.zip');
      expect(result.parseError).toMatch(/HTTP 404/);
    });

    it('parses a valid trace fetched from URL', async () => {
      const zip = new JSZip();
      zip.file(
        'trace.trace',
        [CONTEXT_OPTIONS, BEFORE_GOTO, AFTER_GOTO].map(l => JSON.stringify(l)).join('\n'),
      );
      const blob = await zip.generateAsync({ type: 'blob' });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        blob: vi.fn().mockResolvedValue(blob),
      }));

      const result = await fetchAndParseTraceFromUrl('https://example.com/trace.zip');
      expect(result.parseError).toBeUndefined();
      expect(result.metadata.browserName).toBe('chromium');
      expect(result.actions).toHaveLength(1);
    });
  });
});
