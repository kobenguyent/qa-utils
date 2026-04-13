/**
 * qautils-cli — Core Tool Implementations
 *
 * Self-contained, Node.js-compatible implementations of all QA utility
 * functions. These are the pure-logic functions that CLI commands invoke,
 * making them easy to unit-test without spinning up a full CLI process.
 *
 * Node.js-specific APIs (crypto, Buffer) are used for UUID, hash, password,
 * random-string, base64, and JWT operations. All other functions are
 * platform-agnostic.
 */

import { createHash, randomUUID, randomInt } from 'node:crypto';

// ============================================================================
// UUID
// ============================================================================

/**
 * Generate one or more v4 UUIDs.
 * @param quantity Number of UUIDs to generate (capped at 100).
 */
export function generateUuids(quantity = 1): string[] {
  const uuids: string[] = [];
  for (let i = 0; i < Math.min(Math.max(1, quantity), 100); i++) {
    uuids.push(randomUUID());
  }
  return uuids;
}

// ============================================================================
// Base64
// ============================================================================

/** Encode a UTF-8 string to Base64. */
export function base64Encode(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64');
}

/** Decode a Base64 string to UTF-8. Throws if the input is invalid. */
export function base64Decode(value: string): string {
  // Allow empty string — encodes to empty string
  if (value === '') return '';
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value.trim())) {
    throw new Error('Invalid Base64 string');
  }
  return Buffer.from(value.trim(), 'base64').toString('utf-8');
}

// ============================================================================
// Password generation
// ============================================================================

export interface PasswordOptions {
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

/**
 * Generate a cryptographically random password.
 * @param length   Desired length (1–256, default 16).
 * @param options  Character classes to include.
 */
export function generatePassword(
  length = 16,
  options: PasswordOptions = {},
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (charset.length === 0) {
    charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }

  const safeLength = Math.max(1, Math.min(length, 256));
  let password = '';
  for (let i = 0; i < safeLength; i++) {
    password += charset[randomInt(charset.length)];
  }
  return password;
}

// ============================================================================
// Hash
// ============================================================================

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512';
export const HASH_ALGORITHMS: HashAlgorithm[] = [
  'md5',
  'sha1',
  'sha256',
  'sha384',
  'sha512',
];

/**
 * Generate a hex-encoded hash of a string.
 * @param value     Input text to hash.
 * @param algorithm Hash algorithm (default: sha256).
 */
export function generateHash(
  value: string,
  algorithm: HashAlgorithm = 'sha256',
): string {
  return createHash(algorithm).update(value, 'utf-8').digest('hex');
}

// ============================================================================
// Random string
// ============================================================================

/**
 * Generate a cryptographically random alphanumeric string.
 * @param length Desired length (1–1024, default 16).
 */
export function generateRandomString(length = 16): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const safeLength = Math.max(1, Math.min(length, 1024));
  let result = '';
  for (let i = 0; i < safeLength; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}

// ============================================================================
// JWT decoding (Node.js — uses Buffer for base64url)
// ============================================================================

export interface JwtDecodeResult {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string | null;
  /** `null` when the token has no `exp` claim. */
  expired: boolean | null;
  error?: string;
}

/**
 * Decode a JWT token without verifying its signature.
 *
 * WARNING: This does NOT verify the token signature. Do not use decoded
 * contents to make security decisions in production code.
 */
export function decodeJwt(token: string): JwtDecodeResult {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      return {
        header: null,
        payload: null,
        signature: null,
        expired: null,
        error: 'Invalid JWT format: expected 3 parts separated by dots',
      };
    }

    const b64Decode = (str: string): string => {
      const padded = str.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(padded, 'base64').toString('utf-8');
    };

    const header = JSON.parse(b64Decode(parts[0])) as Record<string, unknown>;
    const payload = JSON.parse(b64Decode(parts[1])) as Record<string, unknown>;
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

// ============================================================================
// Lorem Ipsum
// ============================================================================

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
];

/**
 * Generate Lorem Ipsum placeholder text.
 * @param paragraphs Number of paragraphs (1–20, default 1).
 */
export function generateLoremIpsum(paragraphs = 1): string {
  const count = Math.max(1, Math.min(paragraphs, 20));
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(LOREM_PARAGRAPHS[i % LOREM_PARAGRAPHS.length]);
  }
  return result.join('\n\n');
}

// ============================================================================
// Text statistics
// ============================================================================

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
      trimmed === '' ? 0 : trimmed.split(/\n\s*\n/).filter(Boolean).length,
  };
}

// ============================================================================
// Email validation
// ============================================================================

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate an email address with a basic regex check.
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || email.trim() === '') {
    return { valid: false, reason: 'Email is empty' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, reason: 'Invalid email format' };
  }
  return { valid: true };
}

// ============================================================================
// JSON formatting
// ============================================================================

export interface JsonFormatResult {
  formatted: string;
  valid: boolean;
  error?: string;
}

/**
 * Parse and pretty-print JSON.
 * @param input  Raw JSON string.
 * @param indent Number of spaces for indentation (default 2).
 */
export function formatJson(input: string, indent = 2): JsonFormatResult {
  try {
    const parsed: unknown = JSON.parse(input);
    return { formatted: JSON.stringify(parsed, null, indent), valid: true };
  } catch (e) {
    return {
      formatted: input,
      valid: false,
      error: e instanceof Error ? e.message : 'Invalid JSON',
    };
  }
}

// ============================================================================
// Unix timestamp conversion
// ============================================================================

export interface TimestampResult {
  timestamp: number;
  iso: string;
  utc: string;
  local: string;
}

/**
 * Convert a Unix timestamp (seconds or ms) or ISO string to date representations.
 * When called without arguments, returns the current time.
 */
export function convertTimestamp(value?: string | number): TimestampResult {
  let date: Date;

  if (value !== undefined && value !== '') {
    const numValue = typeof value === 'string' ? Number(value) : value;
    if (!isNaN(numValue)) {
      // Heuristic: values < 1e10 are seconds, larger values are ms
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

// ============================================================================
// SQL generation
// ============================================================================

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
 * Generate SQL statements for common operations.
 *
 * NOTE: Values are escaped with basic single-quote doubling. Do NOT rely on
 * this for production queries — always use parameterized statements.
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
  const { operation, tableName, columns, values, whereClause, orderBy, limit } =
    options;

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
        return `-- Error: UPDATE requires --columns and --values`;
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

// ============================================================================
// Color conversion
// ============================================================================

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

/**
 * Convert a color between hex, RGB, and HSL representations.
 * Accepts: `#RRGGBB`, `#RGB`, `rgb(r, g, b)`.
 */
export function convertColor(input: string): ColorResult {
  const defaultResult: ColorResult = {
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    hsl: { h: 0, s: 0, l: 0 },
  };

  try {
    let r: number, g: number, b: number;

    const hexMatch = input.trim().match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (/^rgb/i.test(input)) {
      const rgbMatch = input.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!rgbMatch) {
        return { ...defaultResult, error: 'Invalid RGB format. Expected: rgb(255, 0, 0)' };
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
      '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

    const rn = r / 255,
      gn = g / 255,
      bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    let h = 0,
      s = 0;

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

// ============================================================================
// HTML sanitization
// ============================================================================

/**
 * Remove `<script>` tags and inline `on*` event handlers from HTML.
 *
 * NOTE: This is a basic sanitizer. For production use prefer a dedicated
 * library such as DOMPurify.
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
