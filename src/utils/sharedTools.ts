/**
 * Shared Tool Implementations
 *
 * Platform-agnostic utility functions used by both the UI tools and the
 * MCP server. Keep this module free of Node.js-only or browser-only APIs
 * so it can be consumed from either environment.
 */

// ---------------------------------------------------------------------------
// Lorem Ipsum
// ---------------------------------------------------------------------------

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
];

/**
 * Generate lorem ipsum placeholder text.
 */
export function generateLoremIpsum(paragraphs = 1): string {
  const count = Math.max(1, Math.min(paragraphs, 20));
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(LOREM_PARAGRAPHS[i % LOREM_PARAGRAPHS.length]);
  }
  return result.join('\n\n');
}

// ---------------------------------------------------------------------------
// Text analysis
// ---------------------------------------------------------------------------

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  lines: number;
  paragraphs: number;
}

/**
 * Count characters, words, sentences, lines, and paragraphs in text.
 */
export function countTextStats(value: string): TextStats {
  const trimmed = value.trim();
  return {
    characters: value.length,
    charactersNoSpaces: value.replace(/\s/g, '').length,
    words: trimmed === '' ? 0 : trimmed.split(/\s+/).length,
    sentences:
      trimmed === '' ? 0 : trimmed.split(/[.!?]+/).filter(Boolean).length,
    lines: trimmed === '' ? 0 : trimmed.split(/\r?\n/).length,
    paragraphs:
      trimmed === ''
        ? 0
        : trimmed.split(/\n\s*\n/).filter(Boolean).length,
  };
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate an email address.
 */
export function validateEmail(email: string): EmailValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim() === '') {
    return { valid: false, reason: 'Email is empty' };
  }
  if (!emailRegex.test(email.trim())) {
    return { valid: false, reason: 'Invalid email format' };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// JSON formatting
// ---------------------------------------------------------------------------

export interface JsonFormatResult {
  formatted: string;
  valid: boolean;
  error?: string;
}

/**
 * Format and validate JSON.
 */
export function formatJson(
  input: string,
  indent = 2,
): JsonFormatResult {
  try {
    const parsed = JSON.parse(input);
    return { formatted: JSON.stringify(parsed, null, indent), valid: true };
  } catch (e) {
    return {
      formatted: input,
      valid: false,
      error: e instanceof Error ? e.message : 'Invalid JSON',
    };
  }
}

// ---------------------------------------------------------------------------
// Timestamp conversion
// ---------------------------------------------------------------------------

export interface TimestampResult {
  timestamp: number;
  iso: string;
  utc: string;
  local: string;
}

/**
 * Convert Unix timestamp to date string or current time to timestamp.
 */
export function convertTimestamp(
  value?: string | number,
): TimestampResult {
  let date: Date;
  if (value !== undefined && value !== '') {
    const numValue = typeof value === 'string' ? Number(value) : value;
    if (!isNaN(numValue)) {
      date = new Date(numValue < 1e10 ? numValue * 1000 : numValue);
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      date = new Date();
    }
  } else {
    date = new Date();
  }

  return {
    timestamp: Math.floor(date.getTime() / 1000),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
  };
}

// ---------------------------------------------------------------------------
// SQL generation
// ---------------------------------------------------------------------------

export type SqlOperation =
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'CREATE_TABLE';

export const SQL_OPERATIONS: SqlOperation[] = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'CREATE_TABLE',
];

/**
 * Generate SQL commands.
 *
 * NOTE: Generated SQL is for development/testing convenience only. Values are
 * escaped with basic single-quote doubling but this should NOT be relied upon
 * for production queries. Always use parameterized queries in production code.
 */
export function generateSql(options: {
  operation: SqlOperation;
  tableName: string;
  columns?: string[];
  values?: string[];
  whereClause?: string;
  orderBy?: string;
  limit?: number;
}): string {
  const {
    operation,
    tableName,
    columns,
    values,
    whereClause,
    orderBy,
    limit,
  } = options;

  const escapeValue = (v: string): string => v.replace(/'/g, "''");

  switch (operation) {
    case 'SELECT': {
      const cols = columns?.length ? columns.join(', ') : '*';
      let sql = `SELECT ${cols} FROM ${tableName}`;
      if (whereClause) sql += ` WHERE ${whereClause}`;
      if (orderBy) sql += ` ORDER BY ${orderBy}`;
      if (limit !== undefined) sql += ` LIMIT ${limit}`;
      return sql + ';';
    }
    case 'INSERT': {
      const cols = columns?.length ? columns.join(', ') : '';
      const vals = values?.length
        ? values.map((v) => `'${escapeValue(v)}'`).join(', ')
        : '';
      return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`;
    }
    case 'UPDATE': {
      if (!columns?.length || !values?.length) {
        return `-- Error: UPDATE requires columns and values`;
      }
      const sets = columns
        .map((col, i) => `${col} = '${escapeValue(values[i] ?? '')}'`)
        .join(', ');
      let sql = `UPDATE ${tableName} SET ${sets}`;
      if (whereClause) sql += ` WHERE ${whereClause}`;
      return sql + ';';
    }
    case 'DELETE': {
      let sql = `DELETE FROM ${tableName}`;
      if (whereClause) sql += ` WHERE ${whereClause}`;
      return sql + ';';
    }
    case 'CREATE_TABLE': {
      const cols = columns?.length
        ? columns.map((col) => `  ${col} TEXT`).join(',\n')
        : '  id INTEGER PRIMARY KEY';
      return `CREATE TABLE ${tableName} (\n${cols}\n);`;
    }
    default:
      return `-- Unsupported operation: ${operation as string}`;
  }
}

// ---------------------------------------------------------------------------
// Color conversion
// ---------------------------------------------------------------------------

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface ColorResult {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  error?: string;
}

/** @deprecated Use ColorResult instead */
export type SimpleColorResult = ColorResult;

/**
 * Convert colors between hex, RGB, and HSL formats.
 */
export function convertSimpleColor(input: string): ColorResult {
  const defaultResult: ColorResult = {
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    hsl: { h: 0, s: 0, l: 0 },
  };

  try {
    let r: number, g: number, b: number;

    const hexMatch = input.match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (input.match(/^rgb/i)) {
      const rgbMatch = input.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!rgbMatch) {
        return { ...defaultResult, error: 'Invalid RGB format' };
      }
      r = parseInt(rgbMatch[1], 10);
      g = parseInt(rgbMatch[2], 10);
      b = parseInt(rgbMatch[3], 10);
    } else {
      return {
        ...defaultResult,
        error: 'Unsupported color format. Use hex (#FF0000) or rgb(255, 0, 0)',
      };
    }

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    const hex =
      '#' +
      [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      else if (max === gn) h = ((bn - rn) / d + 2) / 6;
      else h = ((rn - gn) / d + 4) / 6;
    }

    return {
      hex,
      rgb: { r, g, b },
      hsl: {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
      },
    };
  } catch {
    return { ...defaultResult, error: 'Failed to parse color' };
  }
}

// ---------------------------------------------------------------------------
// HTML sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize HTML by removing script tags and event handlers.
 *
 * NOTE: This is a basic sanitizer for convenience. It removes `<script>` tags
 * and inline `on*` event handlers but does NOT protect against all XSS vectors
 * (e.g. `javascript:` URIs, data URIs, or SVG-based attacks). For production
 * use, prefer a dedicated library such as DOMPurify.
 */
export function sanitizeHtml(html: string): string {
  let result = html;
  const scriptPattern = /<script\b[^]*?<\/script[^>]*>/gi;
  const eventDoubleQuote = /\son\w+="[^"]*"/gi;
  const eventSingleQuote = /\son\w+='[^']*'/gi;

  let previous: string;
  do {
    previous = result;
    result = result
      .replace(scriptPattern, '')
      .replace(eventDoubleQuote, '')
      .replace(eventSingleQuote, '');
  } while (result !== previous);

  return result;
}

// ---------------------------------------------------------------------------
// JWT decoding
// ---------------------------------------------------------------------------

export interface JwtDecodeResult {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string | null;
  expired: boolean | null;
  error?: string;
}

/**
 * Decode a JWT token (without verification).
 *
 * WARNING: This does NOT verify the token signature. Do not use decoded
 * contents to make security decisions. Use a proper JWT verification
 * library for that purpose.
 *
 * @param token       The JWT string to decode.
 * @param b64Decode   A function that decodes a base64url string to UTF-8.
 *                    Callers provide a platform-appropriate implementation
 *                    (Buffer on Node.js, atob in browsers).
 */
export function decodeJwt(
  token: string,
  b64Decode: (str: string) => string,
): JwtDecodeResult {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        header: null,
        payload: null,
        signature: null,
        expired: null,
        error: 'Invalid JWT format: expected 3 parts separated by dots',
      };
    }

    const header = JSON.parse(b64Decode(parts[0]));
    const payload = JSON.parse(b64Decode(parts[1]));
    const signature = parts[2];

    let expired: boolean | null = null;
    if (typeof payload['exp'] === 'number') {
      expired = Date.now() / 1000 > payload['exp'];
    }

    return { header, payload, signature, expired };
  } catch (e) {
    return {
      header: null,
      payload: null,
      signature: null,
      expired: null,
      error: e instanceof Error ? e.message : 'Failed to decode JWT',
    };
  }
}

// ---------------------------------------------------------------------------
// Password options (shared types)
// ---------------------------------------------------------------------------

export interface PasswordOptions {
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

// ---------------------------------------------------------------------------
// Hash algorithm types (shared constants)
// ---------------------------------------------------------------------------

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512';

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  'md5',
  'sha1',
  'sha256',
  'sha384',
  'sha512',
];

// ---------------------------------------------------------------------------
// NanoID alphabet (shared constant, generation is platform-specific)
// ---------------------------------------------------------------------------

export const NANO_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

// ---------------------------------------------------------------------------
// URL utilities
// ---------------------------------------------------------------------------

/** Percent-encode a string using encodeURIComponent. */
export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

/** Decode a percent-encoded string. Throws if the input is malformed. */
export function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    throw new Error('Invalid percent-encoded string');
  }
}

export interface ParsedUrl {
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
}

export interface UrlParseResult {
  parsed: ParsedUrl | null;
  error?: string;
}

/**
 * Parse a URL into its components.
 * Automatically prepends `https://` when no protocol is present.
 */
export function parseUrl(rawUrl: string): UrlParseResult {
  try {
    const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(rawUrl)
      ? rawUrl
      : `https://${rawUrl}`;
    const u = new URL(normalized);
    const params: Record<string, string> = {};
    u.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return {
      parsed: {
        protocol: u.protocol,
        host: u.host,
        hostname: u.hostname,
        port: u.port,
        pathname: u.pathname,
        search: u.search,
        hash: u.hash,
        params,
      },
    };
  } catch {
    return { parsed: null, error: 'Invalid URL' };
  }
}

// ---------------------------------------------------------------------------
// Regex tester
// ---------------------------------------------------------------------------

export interface RegexMatch {
  index: number;
  match: string;
  groups: (string | undefined)[];
}

export interface RegexTestResult {
  valid: boolean;
  matches: RegexMatch[];
  count: number;
  error?: string;
}

/**
 * Test a regular expression against text, returning all matches.
 * Always adds the `g` flag so all matches are collected.
 *
 * NOTE: The pattern is user-supplied by design — this is a regex tester tool.
 * A maximum pattern length is enforced to limit ReDoS exposure.
 */
export function testRegex(
  pattern: string,
  flags: string,
  text: string,
): RegexTestResult {
  if (pattern.length > 2048) {
    return {
      valid: false,
      matches: [],
      count: 0,
      error: 'Pattern is too long (max 2048 characters)',
    };
  }
  try {
    const safeFlags = flags.replace(/[^gimsuy]/g, '');
    const globalFlags = safeFlags.includes('g') ? safeFlags : `${safeFlags}g`;
    const regex = new RegExp(pattern, globalFlags);
    const matches: RegexMatch[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ index: m.index, match: m[0], groups: m.slice(1) });
      if (m[0].length === 0) regex.lastIndex++;
    }
    return { valid: true, matches, count: matches.length };
  } catch (e) {
    return {
      valid: false,
      matches: [],
      count: 0,
      error: e instanceof Error ? e.message : 'Invalid regular expression',
    };
  }
}

// ---------------------------------------------------------------------------
// Number base converter
// ---------------------------------------------------------------------------

export interface BaseConversionResult {
  result: string;
  decimal: number;
  error?: string;
}

/**
 * Convert a number string from one base to another (2–36).
 * The result is returned in uppercase.
 */
export function convertBase(
  value: string,
  fromBase: number,
  toBase: number,
): BaseConversionResult {
  if (
    !Number.isInteger(fromBase) ||
    fromBase < 2 ||
    fromBase > 36 ||
    !Number.isInteger(toBase) ||
    toBase < 2 ||
    toBase > 36
  ) {
    return {
      result: '',
      decimal: 0,
      error: 'Base must be an integer between 2 and 36',
    };
  }
  const clean = value.replace(/\s/g, '');
  const decimal = parseInt(clean, fromBase);
  if (isNaN(decimal)) {
    return {
      result: '',
      decimal: 0,
      error: `"${value}" is not a valid base-${fromBase} number`,
    };
  }
  return { result: decimal.toString(toBase).toUpperCase(), decimal };
}

// ---------------------------------------------------------------------------
// Case converter
// ---------------------------------------------------------------------------

export const CASE_TYPES = [
  'upper',
  'lower',
  'title',
  'camel',
  'pascal',
  'snake',
  'kebab',
  'constant',
] as const;

export type CaseType = (typeof CASE_TYPES)[number];

/**
 * Convert a string to a different case style.
 * Handles camelCase, PascalCase, snake_case, kebab-case, and space-separated input.
 */
export function convertCase(text: string, to: CaseType): string {
  const words = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[\s_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  switch (to) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    case 'camel':
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        )
        .join('');
    case 'pascal':
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    case 'snake':
      return words.map((w) => w.toLowerCase()).join('_');
    case 'kebab':
      return words.map((w) => w.toLowerCase()).join('-');
    case 'constant':
      return words.map((w) => w.toUpperCase()).join('_');
    default:
      return text;
  }
}

// ---------------------------------------------------------------------------
// Markdown → Confluence Wiki markup converter
// ---------------------------------------------------------------------------

/**
 * Convert Markdown text to Confluence Wiki markup.
 *
 * Supported conversions:
 * - ATX headings (#, ##, … → h1., h2., …)
 * - Bold (**text** / __text__ → *text*)
 * - Italic (*text* / _text_ → _text_)
 * - Strikethrough (~~text~~ → -text-)
 * - Inline code (`code` → {{code}})
 * - Fenced code blocks (```lang … ``` → {code:language=lang} … {code})
 * - Unordered lists (- / * with nesting → *, **, ***)
 * - Ordered lists (1. with nesting → #, ##, ###)
 * - Links ([text](url) → [text|url])
 * - Images (![alt](url) → !url|alt=alt!)
 * - Blockquotes (> … → {quote} … {quote})
 * - Horizontal rules (--- → ----)
 * - GFM tables (→ Confluence table with || header row)
 */
export function convertMarkdownToConfluence(markdown: string): string {
  const lines = markdown.split('\n');
  const output: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ──────────────────────────────────────────────────
    const fenceMatch = line.match(/^(`{3,}|~{3,})\s*(\S*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[2] || '';
      const langAttr = lang ? `:language=${lang}` : '';
      output.push(`{code${langAttr}}`);
      i++;
      const fence = fenceMatch[1];
      while (i < lines.length && !lines[i].startsWith(fence)) {
        output.push(lines[i]);
        i++;
      }
      output.push('{code}');
      i++; // skip closing fence
      continue;
    }

    // ── Blockquote block ───────────────────────────────────────────────────
    if (/^>/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      output.push('{quote}');
      quoteLines.forEach((ql) => output.push(applyInline(ql)));
      output.push('{quote}');
      continue;
    }

    // ── GFM table ─────────────────────────────────────────────────────────
    // A table starts with a line containing | and is followed by a separator row
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[-| :]+\|/.test(lines[i + 1])) {
      // header row
      const cells = parseTableRow(line);
      output.push('|| ' + cells.map(applyInline).join(' || ') + ' ||');
      i += 2; // skip separator row
      while (i < lines.length && /^\|/.test(lines[i])) {
        const dataCells = parseTableRow(lines[i]);
        output.push('| ' + dataCells.map(applyInline).join(' | ') + ' |');
        i++;
      }
      continue;
    }

    // ── Horizontal rule ────────────────────────────────────────────────────
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      output.push('----');
      i++;
      continue;
    }

    // ── ATX Heading ────────────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = applyInline(headingMatch[2].trim());
      output.push(`h${level}. ${text}`);
      i++;
      continue;
    }

    // ── Unordered list ────────────────────────────────────────────────────
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      const depth = Math.floor(ulMatch[1].length / 2) + 1;
      output.push('*'.repeat(depth) + ' ' + applyInline(ulMatch[2]));
      i++;
      continue;
    }

    // ── Ordered list ──────────────────────────────────────────────────────
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      const depth = Math.floor(olMatch[1].length / 2) + 1;
      output.push('#'.repeat(depth) + ' ' + applyInline(olMatch[2]));
      i++;
      continue;
    }

    // ── Regular line (apply inline transformations) ────────────────────────
    output.push(applyInline(line));
    i++;
  }

  return output.join('\n');
}

/** Apply inline Markdown → Confluence conversions to a single line. */
function applyInline(text: string): string {
  // Images before links (more specific)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) =>
    alt ? `!${url}|alt=${alt}!` : `!${url}!`
  );

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]');

  // Inline code (must come before bold/italic to avoid interference)
  text = text.replace(/`([^`]+)`/g, '{{$1}}');

  // Bold (**text** or __text__) — use a placeholder so the italic pass below
  // does not accidentally re-interpret the resulting single-star syntax.
  const BOLD_PLACEHOLDER = '\x00BOLD\x00';
  text = text.replace(/\*\*([^*]+)\*\*/g, `${BOLD_PLACEHOLDER}$1${BOLD_PLACEHOLDER}`);
  text = text.replace(/__([^_]+)__/g, `${BOLD_PLACEHOLDER}$1${BOLD_PLACEHOLDER}`);

  // Italic (*text* — single asterisk; _text_)
  text = text.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '_$1_');
  text = text.replace(/(?<!_)_(?!_)([^_]+?)(?<!_)_(?!_)/g, '_$1_');

  // Restore bold placeholders to Confluence bold (*text*)
  text = text.replace(new RegExp(`${BOLD_PLACEHOLDER}([^${BOLD_PLACEHOLDER}]+)${BOLD_PLACEHOLDER}`, 'g'), '*$1*');

  // Strikethrough
  text = text.replace(/~~([^~]+)~~/g, '-$1-');

  return text;
}

/** Parse cells from a GFM table row, trimming leading/trailing pipes and whitespace. */
function parseTableRow(row: string): string[] {
  return row
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());
}
