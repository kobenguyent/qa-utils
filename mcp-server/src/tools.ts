import { createHash, randomUUID, randomInt } from 'node:crypto';

/**
 * Generate one or more UUIDs.
 */
export function generateUuids(quantity: number = 1): string[] {
  const uuids: string[] = [];
  for (let i = 0; i < Math.min(quantity, 100); i++) {
    uuids.push(randomUUID());
  }
  return uuids;
}

/**
 * Encode a string to Base64.
 */
export function base64Encode(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64');
}

/**
 * Decode a Base64 string.
 */
export function base64Decode(value: string): string {
  return Buffer.from(value, 'base64').toString('utf-8');
}

/**
 * Generate a secure random password.
 */
export function generatePassword(
  length: number = 16,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}
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
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }

  const safeLength = Math.max(1, Math.min(length, 256));
  let password = '';
  for (let i = 0; i < safeLength; i++) {
    password += charset[randomInt(charset.length)];
  }
  return password;
}

/**
 * Convert Unix timestamp to date string or current time to timestamp.
 */
export function convertTimestamp(value?: string | number): {
  timestamp: number;
  iso: string;
  utc: string;
  local: string;
} {
  let date: Date;
  if (value !== undefined && value !== '') {
    const numValue = typeof value === 'string' ? Number(value) : value;
    if (!isNaN(numValue)) {
      // If the number is likely in seconds (< 10 billion), convert to ms
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

/**
 * Generate a hash of the given value.
 */
export function generateHash(
  value: string,
  algorithm: 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'md5' = 'sha256'
): string {
  return createHash(algorithm).update(value).digest('hex');
}

/**
 * Generate lorem ipsum text.
 */
export function generateLoremIpsum(paragraphs: number = 1): string {
  const loremParagraphs = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
    'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
  ];

  const count = Math.max(1, Math.min(paragraphs, 20));
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(loremParagraphs[i % loremParagraphs.length]);
  }
  return result.join('\n\n');
}

/**
 * Count characters, words, sentences, and lines in text.
 */
export function countCharacters(value: string): {
  characters: number;
  words: number;
  sentences: number;
  lines: number;
  paragraphs: number;
} {
  const trimmed = value.trim();
  return {
    characters: value.length,
    words: trimmed === '' ? 0 : trimmed.split(/\s+/).length,
    sentences: trimmed === '' ? 0 : trimmed.split(/[.!?]+/).filter(Boolean).length,
    lines: trimmed === '' ? 0 : trimmed.split(/\r?\n/).length,
    paragraphs: trimmed === '' ? 0 : trimmed.split(/\n\s*\n/).filter(Boolean).length,
  };
}

/**
 * Validate an email address.
 */
export function validateEmail(email: string): {
  valid: boolean;
  reason?: string;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim() === '') {
    return { valid: false, reason: 'Email is empty' };
  }
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Format and validate JSON.
 */
export function formatJson(
  input: string,
  indent: number = 2
): { formatted: string; valid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(input);
    return {
      formatted: JSON.stringify(parsed, null, indent),
      valid: true,
    };
  } catch (e) {
    return {
      formatted: input,
      valid: false,
      error: e instanceof Error ? e.message : 'Invalid JSON',
    };
  }
}

/**
 * Decode a JWT token (without verification).
 * WARNING: This does NOT verify the token signature. Do not use decoded
 * contents to make security decisions. Use a proper JWT verification
 * library for that purpose.
 */
export function decodeJwt(token: string): {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string | null;
  expired: boolean | null;
  error?: string;
} {
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

    const decodeBase64Url = (str: string): string => {
      const padded = str.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(padded, 'base64').toString('utf-8');
    };

    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    const signature = parts[2];

    let expired: boolean | null = null;
    if (payload.exp) {
      expired = Date.now() / 1000 > payload.exp;
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

export type SqlOperation =
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'CREATE_TABLE';

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
  const { operation, tableName, columns, values, whereClause, orderBy, limit } =
    options;

  const escapeValue = (v: string): string => v.replace(/'/g, "''");

  switch (operation) {
    case 'SELECT': {
      const cols = columns?.length ? columns.join(', ') : '*';
      let sql = `SELECT ${cols} FROM ${tableName}`;
      if (whereClause) sql += ` WHERE ${whereClause}`;
      if (orderBy) sql += ` ORDER BY ${orderBy}`;
      if (limit) sql += ` LIMIT ${limit}`;
      return sql + ';';
    }
    case 'INSERT': {
      const cols = columns?.length ? columns.join(', ') : '';
      const vals = values?.length ? values.map((v) => `'${escapeValue(v)}'`).join(', ') : '';
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

/**
 * Convert colors between hex, RGB, and HSL formats.
 */
export function convertColor(input: string): {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  error?: string;
} {
  const defaultResult = {
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    hsl: { h: 0, s: 0, l: 0 },
  };

  try {
    let r: number, g: number, b: number;

    // Try hex format
    const hexMatch = input.match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    // Try rgb format
    else if (input.match(/^rgb/i)) {
      const rgbMatch = input.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!rgbMatch) {
        return { ...defaultResult, error: 'Invalid RGB format' };
      }
      r = parseInt(rgbMatch[1], 10);
      g = parseInt(rgbMatch[2], 10);
      b = parseInt(rgbMatch[3], 10);
    } else {
      return { ...defaultResult, error: 'Unsupported color format. Use hex (#FF0000) or rgb(255, 0, 0)' };
    }

    // Clamp values
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

    // RGB to HSL
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

/**
 * Generate a random string of given length.
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const safeLength = Math.max(1, Math.min(length, 1024));
  let result = '';
  for (let i = 0; i < safeLength; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}

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

  // Loop to handle nested/recursive patterns
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
