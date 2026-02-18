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

export interface CallStackFrame {
  file: string;
  line: number;
  column: number;
  function: string;
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
  /** Call stack from 0-trace.stacks showing where in test code the action was triggered */
  callStack?: CallStackFrame[];
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

/** Entry shape inside a 0-trace.stacks file */
interface RawStackEntry {
  callId: string;
  callStack?: Array<{
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  }>;
  stack?: Array<{
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  }>;
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

function parseJsonlGeneric<T>(text: string): T[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .flatMap(line => {
      try {
        return [JSON.parse(line) as T];
      } catch {
        return [];
      }
    });
}

/**
 * Convert a raw apiName like "Page.goto" → "page.goto".
 * Keeps any existing camelCase within the method name.
 */
function formatApiName(raw: string | undefined): string {
  if (!raw) return '';
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
  const isStacksFile = (name: string) =>
    /(?:^|\/)\d*-?trace\.stacks$/.test(name) || name === 'trace.stacks';

  const traceFiles = allFiles.filter(f => !f.dir && isTraceFile(f.name));
  const networkFiles = allFiles.filter(f => !f.dir && isNetworkFile(f.name));
  const stackFiles = allFiles.filter(f => !f.dir && isStacksFile(f.name));

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

  // ── 2. Parse call stacks (0-trace.stacks) ────────────────────────────────
  // callId in stacks may be bare (same as action) or prefixed with "s@"
  const stackMap = new Map<string, CallStackFrame[]>();
  if (stackFiles.length > 0) {
    stackFiles.sort((a, b) => a.name.localeCompare(b.name));
    const stackTexts = await Promise.all(stackFiles.map(f => f.async('string')));
    const stackEntries = parseJsonlGeneric<RawStackEntry>(stackTexts.join('\n'));
    for (const entry of stackEntries) {
      if (!entry.callId) continue;
      const rawFrames = entry.callStack ?? entry.stack ?? [];
      const frames: CallStackFrame[] = rawFrames.map(f => ({
        file: f.file ?? '',
        line: f.line ?? 0,
        column: f.column ?? 0,
        function: f.function ?? '',
      }));
      // Strip the "s@" prefix sometimes used in the stacks file
      const id = entry.callId.startsWith('s@') ? entry.callId.slice(2) : entry.callId;
      stackMap.set(id, frames);
      // Also store under the original key in case it differs
      stackMap.set(entry.callId, frames);
    }
  }

  // ── 3. Extract metadata ───────────────────────────────────────────────────
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

  // ── 4. Build actions from before/after pairs ──────────────────────────────
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

      // Collect screencast frames that occurred during this action's time window.
      // NOTE: after.snapshots are DOM/accessibility snapshots (not JPEG images) –
      //       the actual screenshot images come only from screencast-frame entries.
      const sha1s: string[] = [];
      screencasts
        .filter(s => s.timestamp >= before.startTime && s.timestamp <= after.endTime)
        .forEach(s => { if (!sha1s.includes(s.sha1)) sha1s.push(s.sha1); });

      screenshotMap.set(after.callId, sha1s);

      // Skip purely internal Playwright events that have no apiName and no params –
      // they are framework bookkeeping entries that add no value to the user view.
      if (!before.apiName && Object.keys(before.params ?? {}).length === 0) continue;

      const action: TraceAction = {
        callId: after.callId,
        apiName: before.apiName ?? '',
        name: formatApiName(before.apiName),
        params: before.params ?? {},
        startTime: before.startTime,
        endTime: after.endTime,
        duration: Math.round(after.endTime - before.startTime),
        error: after.error?.message ?? null,
        log: after.log ?? [],
        screenshotSha1s: sha1s,
        pageId: before.pageId,
        callStack: stackMap.get(after.callId) ?? stackMap.get(`s@${after.callId}`),
      };
      result.actions.push(action);
    }
  }

  // ── 5. Parse network file(s) ─────────────────────────────────────────────
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

  // ── 6. Extract screenshot images ──────────────────────────────────────────
  // Collect all screencast sha1s: from action windows plus ALL frames recorded
  const allSha1s = new Set(result.actions.flatMap(a => a.screenshotSha1s));
  screencasts.forEach(s => { if (s.sha1) allSha1s.add(s.sha1); });

  // Build a map from sha1 → JSZip file for fast lookup.
  // Playwright stores screencast frames as "resources/<sha1>.jpeg" (some versions
  // drop the extension entirely and store "resources/<sha1>").
  const resourceFileBySha1 = new Map<string, JSZip.JSZipObject>();
  for (const f of Object.values(zip.files)) {
    if (f.dir) continue;
    const base = f.name.split('/').pop() ?? '';
    // Match with extension: "<sha1>.jpeg", "<sha1>.png", "<sha1>.webp"
    const withExt = base.match(/^([0-9a-f]{20,})\.(jpeg|jpg|png|webp)$/i);
    if (withExt) {
      resourceFileBySha1.set(withExt[1], f);
      continue;
    }
    // Match extensionless: "<sha1>" (hex-only, ≥20 chars)
    if (/^[0-9a-f]{20,}$/i.test(base)) {
      resourceFileBySha1.set(base, f);
    }
  }

  for (const sha1 of allSha1s) {
    if (!sha1) continue;
    const resourceFile = resourceFileBySha1.get(sha1);
    if (resourceFile) {
      const blob = await resourceFile.async('blob');
      // Ensure blob has image MIME type so the browser renders it
      const imgBlob = blob.type.startsWith('image/')
        ? blob
        : new Blob([blob], { type: 'image/jpeg' });
      result.screenshots[sha1] = URL.createObjectURL(imgBlob);
    }
  }

  // Attach screencast frames to actions that don't already have screenshots.
  // Use the most recent frame whose timestamp is ≤ action.endTime so every
  // action has a "current page state" screenshot when screencast is enabled.
  const sortedScreencasts = [...screencasts].sort((a, b) => a.timestamp - b.timestamp);
  for (const action of result.actions) {
    if (action.screenshotSha1s.length === 0) {
      // Find the latest screencast frame captured at or before the action ends
      let best: RawScreencast | undefined;
      for (const sc of sortedScreencasts) {
        if (sc.timestamp <= action.endTime) best = sc;
        else break;
      }
      if (best && result.screenshots[best.sha1]) {
        action.screenshotSha1s.push(best.sha1);
      }
    }
  }

  return result;
}

/**
 * Get a human-readable label for an action (suitable for display).
 */
export function getActionLabel(action: TraceAction): string {
  const name = action.name ?? '';
  const p = action.params;
  switch (true) {
    case name.includes('goto'):
      return `Navigate to ${String(p.url ?? '')}`;
    case name.includes('dblclick') || name.includes('doubleClick'):
      return `Double-click ${String(p.selector ?? '')}`;
    case name.includes('click'):
      return `Click ${String(p.selector ?? '')}`;
    case name.includes('fill'):
      return `Fill "${String(p.value ?? '')}" in ${String(p.selector ?? '')}`;
    case name.includes('type'):
      return `Type "${String(p.text ?? '')}"`;
    case name.includes('uncheck'):
      return `Uncheck ${String(p.selector ?? '')}`;
    case name.includes('check'):
      return `Check ${String(p.selector ?? '')}`;
    case name.includes('selectOption') || name.includes('select'):
      return `Select option in ${String(p.selector ?? '')}`;
    case name.includes('hover'):
      return `Hover ${String(p.selector ?? '')}`;
    case name.includes('focus'):
      return `Focus ${String(p.selector ?? '')}`;
    case name.includes('press'):
      return `Press ${String(p.key ?? '')}`;
    case name.includes('keyboard'):
      return `Keyboard: ${String(p.key ?? p.text ?? '')}`;
    case name.includes('waitForLoadState') || name.includes('waitUntil'):
      return `Wait for load: ${String(p.state ?? '')}`;
    case name.includes('waitFor'):
      return `Wait for ${String(p.selector ?? p.state ?? '')}`;
    case name.includes('reload'):
      return 'Reload page';
    case name.includes('goBack'):
      return 'Go back';
    case name.includes('goForward'):
      return 'Go forward';
    case name.includes('screenshot'):
      return 'Take screenshot';
    case name.includes('evaluate') || name.includes('evaluateHandle'):
      return 'Evaluate JS';
    case name.includes('dispatchEvent'):
      return `Dispatch ${String(p.type ?? '')} on ${String(p.selector ?? '')}`;
    case name.includes('expect') || name.includes('assert'):
      return `Expect ${String(p.expression ?? p.selector ?? '')}`;
    case name.includes('newPage') || name.includes('newContext'):
      return action.apiName ? action.apiName : 'New page';
    case name.includes('close'):
      return action.apiName ? `Close ${action.apiName.split('.')[0]}` : 'Close';
    case name.includes('route') || name.includes('unroute'):
      return `Route ${String(p.url ?? '')}`;
    default:
      // Format "Class.method" → "Class: method" for readability
      if (action.apiName) {
        const parts = action.apiName.split('.');
        if (parts.length === 2) return `${parts[0]}: ${parts[1]}`;
        return action.apiName;
      }
      return name || '(internal)';
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
  const name = (action.name ?? '').toLowerCase();
  if (name.includes('goto') || name.includes('navigate')) return '🌐';
  if (name.includes('dblclick') || name.includes('doubleclick')) return '🖱️';
  if (name.includes('click')) return '🖱️';
  if (name.includes('fill') || name.includes('type')) return '⌨️';
  if (name.includes('screenshot')) return '📸';
  if (name.includes('wait')) return '⏳';
  if (name.includes('assert') || name.includes('expect')) return '✅';
  if (name.includes('uncheck')) return '☑️';
  if (name.includes('check')) return '☑️';
  if (name.includes('select')) return '📋';
  if (name.includes('hover')) return '👆';
  if (name.includes('focus')) return '🎯';
  if (name.includes('press') || name.includes('keyboard')) return '🔑';
  if (name.includes('evaluate')) return '⚙️';
  if (name.includes('reload') || name.includes('goback') || name.includes('goforward')) return '🔄';
  if (name.includes('route') || name.includes('unroute')) return '🔀';
  if (name.includes('close')) return '❌';
  if (name.includes('new') || name.includes('launch')) return '🚀';
  // For any remaining API name (Class.method style), show a generic API icon
  if (action.apiName) return '⚙️';
  return '▶️';
}

