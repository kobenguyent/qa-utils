/**
 * Playwright Trace Reader
 *
 * Reads and parses Playwright trace ZIP files independently, without using any
 * Playwright libraries (avoiding Apache-2.0 / license concerns). The Playwright
 * trace file format is an open data format documented publicly.
 *
 * Uses JSZip (MIT) to extract the ZIP archive in-browser.
 */

import JSZip from 'jszip';

// ─── Public types ────────────────────────────────────────────────────────────

export interface TraceMetadata {
  browserName: string;
  platform: string;
  wallTime: number;
  title?: string;
  sdkLanguage?: string;
  testIdAttributeName?: string;
}

export interface TraceAction {
  callId: string;
  apiName: string;
  /** Human-readable name, e.g. "page.goto" */
  name: string;
  params: Record<string, unknown>;
  startTime: number;
  endTime: number;
  /** Duration in milliseconds */
  duration: number;
  error: string | null;
  log: string[];
  /** sha1 hashes of screenshots captured around this action */
  screenshotSha1s: string[];
  pageId?: string;
}

export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  status: number | null;
  statusText: string | null;
  requestHeaders: Array<{ name: string; value: string }>;
  responseHeaders: Array<{ name: string; value: string }>;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  /** "completed" | "failed" | "pending" */
  state: string;
  errorText: string | null;
  isNavigationRequest: boolean;
  resourceType: string;
  mimeType: string | null;
}

export interface PlaywrightTrace {
  metadata: TraceMetadata;
  actions: TraceAction[];
  networkRequests: NetworkRequest[];
  /** Map of sha1 → Object URL (or empty string if not found) */
  screenshots: Record<string, string>;
  /** Raw error encountered during parsing, if any */
  parseError?: string;
}

// ─── Internal trace-entry shapes ─────────────────────────────────────────────

interface RawContextOptions {
  type: 'context-options';
  browserName?: string;
  platform?: string;
  wallTime?: number;
  title?: string;
  sdkLanguage?: string;
  testIdAttributeName?: string;
}

interface RawBefore {
  type: 'before';
  callId: string;
  startTime: number;
  apiName: string;
  params?: Record<string, unknown>;
  pageId?: string;
}

interface RawAfter {
  type: 'after';
  callId: string;
  endTime: number;
  error?: { message?: string } | null;
  log?: string[];
  snapshots?: Array<{ title: string; snapshotName: string }>;
}

interface RawScreencast {
  type: 'screencast-frame';
  sha1: string;
  timestamp: number;
  pageId?: string;
}

interface RawNetworkRequest {
  type: 'request';
  requestId: string;
  url: string;
  method: string;
  headers?: Array<{ name: string; value: string }>;
  isNavigationRequest?: boolean;
  resourceType?: string;
  timestamp?: number;
  frameId?: string;
}

interface RawNetworkResponse {
  type: 'response';
  requestId: string;
  status: number;
  statusText: string;
  headers?: Array<{ name: string; value: string }>;
  mimeType?: string;
  timestamp?: number;
}

interface RawNetworkFinished {
  type: 'requestfinished';
  requestId: string;
  responseEndTiming?: number;
  timestamp?: number;
}

interface RawNetworkFailed {
  type: 'requestfailed';
  requestId: string;
  errorText?: string;
  timestamp?: number;
}

type RawEntry =
  | RawContextOptions
  | RawBefore
  | RawAfter
  | RawScreencast
  | RawNetworkRequest
  | RawNetworkResponse
  | RawNetworkFinished
  | RawNetworkFailed
  | { type: string; [key: string]: unknown };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJsonl(text: string): RawEntry[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .flatMap(line => {
      try {
        return [JSON.parse(line) as RawEntry];
      } catch {
        return [];
      }
    });
}

/**
 * Convert a raw apiName like "Page.goto" → "page.goto".
 * Keeps any existing camelCase within the method name.
 */
function formatApiName(raw: string): string {
  if (!raw) return raw;
  // "Page.goto" → "page.goto"; "BrowserContext.newPage" → "browserContext.newPage"
  return raw.replace(/^([A-Z][a-zA-Z]*)\./, (_m, cls: string) => `${cls.charAt(0).toLowerCase()}${cls.slice(1)}.`);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch a Playwright trace ZIP from a remote URL and parse it.
 *
 * The request is made with `mode: 'cors'` so the remote server must include
 * appropriate CORS headers.  If CORS is blocked the function returns a
 * `parseError` describing the problem so the caller can surface it to the user.
 *
 * @param url - A fully-qualified URL pointing to a `.zip` trace file
 */
export async function fetchAndParseTraceFromUrl(url: string): Promise<PlaywrightTrace> {
  const errorResult = (): PlaywrightTrace => ({
    metadata: { browserName: 'unknown', platform: 'unknown', wallTime: 0 },
    actions: [],
    networkRequests: [],
    screenshots: {},
  });

  let blob: Blob;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      return { ...errorResult(), parseError: `Failed to fetch trace: HTTP ${response.status} ${response.statusText}` };
    }
    blob = await response.blob();
  } catch (err) {
    return {
      ...errorResult(),
      parseError: `Failed to fetch trace from URL: ${(err as Error).message}. Make sure the server allows CORS.`,
    };
  }

  return parsePlaywrightTrace(blob);
}

/**
 * Parse a Playwright `.zip` trace file (as a File/Blob) and return a
 * structured {@link PlaywrightTrace} object.
 *
 * This function is entirely self-contained and does not depend on any
 * Playwright runtime code, avoiding licensing complications.
 *
 * @param file - The trace ZIP file chosen by the user
 */
export async function parsePlaywrightTrace(file: File | Blob): Promise<PlaywrightTrace> {
  const result: PlaywrightTrace = {
    metadata: { browserName: 'unknown', platform: 'unknown', wallTime: 0 },
    actions: [],
    networkRequests: [],
    screenshots: {},
  };

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (err) {
    result.parseError = `Failed to open ZIP archive: ${(err as Error).message}`;
    return result;
  }

  // ── 1. Locate trace file(s) (real Playwright traces use "0-trace.trace",
  //      "1-trace.trace", etc.; older/test zips may use plain "trace.trace")
  //      We collect ALL matching files and concatenate their JSONL contents
  //      so multi-chunk traces are handled correctly.
  const allFiles = Object.values(zip.files);

  /** Returns true if the basename matches any of the Playwright trace suffixes */
  const isTraceFile = (name: string) =>
    /(?:^|\/)\d*-?trace\.trace$/.test(name) || name === 'trace.trace';
  const isNetworkFile = (name: string) =>
    /(?:^|\/)\d*-?trace\.network$/.test(name) || name === 'trace.network';

  const traceFiles = allFiles.filter(f => !f.dir && isTraceFile(f.name));
  const networkFiles = allFiles.filter(f => !f.dir && isNetworkFile(f.name));

  if (traceFiles.length === 0) {
    result.parseError =
      'No trace file found in the ZIP archive. ' +
      'Expected files like "trace.trace" or "0-trace.trace".';
    return result;
  }

  // Read and merge all trace JSONL files (sorted by name for deterministic order)
  traceFiles.sort((a, b) => a.name.localeCompare(b.name));
  const traceTexts = await Promise.all(traceFiles.map(f => f.async('string')));
  const traceEntries = parseJsonl(traceTexts.join('\n'));

  // ── 2. Extract metadata ───────────────────────────────────────────────────
  const ctxEntry = traceEntries.find(e => e.type === 'context-options') as RawContextOptions | undefined;
  if (ctxEntry) {
    result.metadata = {
      browserName: ctxEntry.browserName ?? 'unknown',
      platform: ctxEntry.platform ?? 'unknown',
      wallTime: ctxEntry.wallTime ?? 0,
      title: ctxEntry.title,
      sdkLanguage: ctxEntry.sdkLanguage,
      testIdAttributeName: ctxEntry.testIdAttributeName,
    };
  }

  // ── 3. Build actions from before/after pairs ──────────────────────────────
  const beforeMap = new Map<string, RawBefore>();
  const screenshotMap = new Map<string, string[]>(); // callId → sha1[]

  // Collect screencast frames and assign them to the nearest preceding action
  const screencasts = traceEntries.filter((e): e is RawScreencast => e.type === 'screencast-frame');

  for (const entry of traceEntries) {
    if (entry.type === 'before') {
      beforeMap.set((entry as RawBefore).callId, entry as RawBefore);
    } else if (entry.type === 'after') {
      const after = entry as RawAfter;
      const before = beforeMap.get(after.callId);
      if (!before) continue;

      // Collect screenshot sha1s mentioned in snapshots
      const sha1s: string[] = [];
      if (after.snapshots) {
        for (const snap of after.snapshots) {
          // snapshotName may be like "resources/abc123.png" or just "abc123"
          const parts = snap.snapshotName.split('/');
          const name = parts[parts.length - 1];
          if (name) sha1s.push(name.replace(/\.[^.]+$/, ''));
        }
      }

      // Also capture screencast frames that occurred between this action's start/end
      screencasts
        .filter(s => s.timestamp >= before.startTime && s.timestamp <= after.endTime)
        .forEach(s => sha1s.push(s.sha1));

      screenshotMap.set(after.callId, sha1s);

      const action: TraceAction = {
        callId: after.callId,
        apiName: before.apiName,
        name: formatApiName(before.apiName),
        params: before.params ?? {},
        startTime: before.startTime,
        endTime: after.endTime,
        duration: Math.round(after.endTime - before.startTime),
        error: after.error?.message ?? null,
        log: after.log ?? [],
        screenshotSha1s: sha1s,
        pageId: before.pageId,
      };
      result.actions.push(action);
    }
  }

  // ── 4. Parse network file(s) ─────────────────────────────────────────────
  if (networkFiles.length > 0) {
    networkFiles.sort((a, b) => a.name.localeCompare(b.name));
    const netTexts = await Promise.all(networkFiles.map(f => f.async('string')));
    const netEntries = parseJsonl(netTexts.join('\n'));
    const reqMap = new Map<string, NetworkRequest>();

    for (const entry of netEntries) {
      switch (entry.type) {
        case 'request': {
          const r = entry as RawNetworkRequest;
          reqMap.set(r.requestId, {
            requestId: r.requestId,
            url: r.url,
            method: r.method,
            status: null,
            statusText: null,
            requestHeaders: r.headers ?? [],
            responseHeaders: [],
            startTime: r.timestamp ?? 0,
            endTime: null,
            duration: null,
            state: 'pending',
            errorText: null,
            isNavigationRequest: r.isNavigationRequest ?? false,
            resourceType: r.resourceType ?? 'other',
            mimeType: null,
          });
          break;
        }
        case 'response': {
          const r = entry as RawNetworkResponse;
          const req = reqMap.get(r.requestId);
          if (req) {
            req.status = r.status;
            req.statusText = r.statusText;
            req.responseHeaders = r.headers ?? [];
            req.mimeType = r.mimeType ?? null;
          }
          break;
        }
        case 'requestfinished': {
          const r = entry as RawNetworkFinished;
          const req = reqMap.get(r.requestId);
          if (req) {
            req.state = 'completed';
            req.endTime = r.timestamp ?? null;
            if (req.startTime && req.endTime) {
              req.duration = Math.round(req.endTime - req.startTime);
            }
          }
          break;
        }
        case 'requestfailed': {
          const r = entry as RawNetworkFailed;
          const req = reqMap.get(r.requestId);
          if (req) {
            req.state = 'failed';
            req.errorText = r.errorText ?? 'Request failed';
            req.endTime = r.timestamp ?? null;
          }
          break;
        }
      }
    }
    result.networkRequests = Array.from(reqMap.values());
  }

  // ── 5. Extract screenshot images ──────────────────────────────────────────
  const allSha1s = new Set(result.actions.flatMap(a => a.screenshotSha1s));
  // Also pick up any screencast frames not yet captured
  screencasts.forEach(s => allSha1s.add(s.sha1));

  for (const sha1 of allSha1s) {
    if (!sha1) continue;
    // Playwright stores screenshots as resources/<sha1>.jpeg or resources/<sha1>.png
    const resourceFile =
      zip.file(`resources/${sha1}.jpeg`) ??
      zip.file(`resources/${sha1}.png`) ??
      zip.file(`resources/${sha1}.jpg`) ??
      Object.values(zip.files).find(
        f => f.name.endsWith(`/${sha1}.jpeg`) || f.name.endsWith(`/${sha1}.png`) || f.name.endsWith(`/${sha1}.jpg`)
      );

    if (resourceFile) {
      const blob = await resourceFile.async('blob');
      result.screenshots[sha1] = URL.createObjectURL(blob);
    }
  }

  // Attach screencast frames to actions that don't already have screenshots
  for (const action of result.actions) {
    if (action.screenshotSha1s.length === 0) {
      // Find the nearest screencast frame within the action window
      const frame = screencasts.find(
        s => s.timestamp >= action.startTime && s.timestamp <= action.endTime
      );
      if (frame && result.screenshots[frame.sha1]) {
        action.screenshotSha1s.push(frame.sha1);
      }
    }
  }

  return result;
}

/**
 * Get a human-readable label for an action (suitable for display).
 */
export function getActionLabel(action: TraceAction): string {
  const p = action.params;
  switch (true) {
    case action.name.includes('goto'):
      return `Navigate to ${String(p.url ?? '')}`;
    case action.name.includes('click'):
      return `Click ${String(p.selector ?? '')}`;
    case action.name.includes('fill'):
      return `Fill "${String(p.value ?? '')}" in ${String(p.selector ?? '')}`;
    case action.name.includes('type'):
      return `Type "${String(p.text ?? '')}"`;
    case action.name.includes('check'):
      return `Check ${String(p.selector ?? '')}`;
    case action.name.includes('uncheck'):
      return `Uncheck ${String(p.selector ?? '')}`;
    case action.name.includes('select'):
      return `Select option in ${String(p.selector ?? '')}`;
    case action.name.includes('hover'):
      return `Hover ${String(p.selector ?? '')}`;
    case action.name.includes('press'):
      return `Press ${String(p.key ?? '')}`;
    case action.name.includes('waitFor'):
      return `Wait for ${String(p.selector ?? p.state ?? '')}`;
    case action.name.includes('screenshot'):
      return 'Take screenshot';
    case action.name.includes('evaluate'):
      return 'Evaluate JS';
    case action.name.includes('expect'):
      return `Expect ${String(p.expression ?? '')}`;
    default:
      return action.name;
  }
}

/**
 * Get a Bootstrap color class for an action based on its outcome.
 */
export function getActionStatusColor(action: TraceAction): string {
  if (action.error) return 'danger';
  if (action.duration > 5000) return 'warning';
  return 'success';
}

/**
 * Get an emoji icon for an action name.
 */
export function getActionIcon(action: TraceAction): string {
  const name = action.name.toLowerCase();
  if (name.includes('goto') || name.includes('navigate')) return '🌐';
  if (name.includes('click')) return '🖱️';
  if (name.includes('fill') || name.includes('type')) return '⌨️';
  if (name.includes('screenshot')) return '📸';
  if (name.includes('wait')) return '⏳';
  if (name.includes('assert') || name.includes('expect')) return '✅';
  if (name.includes('check')) return '☑️';
  if (name.includes('select')) return '📋';
  if (name.includes('hover')) return '👆';
  if (name.includes('press')) return '🔑';
  if (name.includes('evaluate')) return '⚙️';
  if (name.includes('close')) return '❌';
  if (name.includes('new') || name.includes('launch')) return '🚀';
  return '▶️';
}
