import { describe, it, expect } from 'vitest';
import {
  generateUuids,
  base64Encode,
  base64Decode,
  generatePassword,
  convertTimestamp,
  generateHash,
  generateLoremIpsum,
  countCharacters,
  validateEmail,
  formatJson,
  decodeJwt,
  generateSql,
  convertColor,
  generateRandomString,
  sanitizeHtml,
} from '../tools.js';

describe('generateUuids', () => {
  it('should generate a single UUID by default', () => {
    const result = generateUuids();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('should generate multiple UUIDs', () => {
    const result = generateUuids(5);
    expect(result).toHaveLength(5);
    result.forEach((uuid) => {
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });
  });

  it('should cap at 100 UUIDs', () => {
    const result = generateUuids(200);
    expect(result).toHaveLength(100);
  });
});

describe('base64Encode / base64Decode', () => {
  it('should encode and decode a string', () => {
    const original = 'Hello, World!';
    const encoded = base64Encode(original);
    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
    expect(base64Decode(encoded)).toBe(original);
  });

  it('should handle empty string', () => {
    expect(base64Encode('')).toBe('');
    expect(base64Decode('')).toBe('');
  });

  it('should handle unicode', () => {
    const original = '日本語テスト';
    const encoded = base64Encode(original);
    expect(base64Decode(encoded)).toBe(original);
  });
});

describe('generatePassword', () => {
  it('should generate a password of default length', () => {
    const password = generatePassword();
    expect(password).toHaveLength(16);
  });

  it('should generate a password of specified length', () => {
    const password = generatePassword(32);
    expect(password).toHaveLength(32);
  });

  it('should respect character set options', () => {
    const numbersOnly = generatePassword(20, {
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
    });
    expect(numbersOnly).toMatch(/^\d+$/);
  });

  it('should use default charset if all options are false', () => {
    const password = generatePassword(10, {
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
    });
    expect(password).toHaveLength(10);
    expect(password).toMatch(/^[a-zA-Z0-9]+$/);
  });
});

describe('convertTimestamp', () => {
  it('should return current time when no value is given', () => {
    const result = convertTimestamp();
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.iso).toBeTruthy();
  });

  it('should convert a Unix timestamp in seconds', () => {
    const result = convertTimestamp('1700000000');
    expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('should convert a Unix timestamp in milliseconds', () => {
    const result = convertTimestamp('1700000000000');
    expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('should convert an ISO date string', () => {
    const result = convertTimestamp('2024-01-01T00:00:00Z');
    expect(result.timestamp).toBe(1704067200);
  });
});

describe('generateHash', () => {
  it('should generate SHA-256 hash by default', () => {
    const hash = generateHash('hello');
    expect(hash).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  it('should generate MD5 hash', () => {
    const hash = generateHash('hello', 'md5');
    expect(hash).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('should generate SHA-1 hash', () => {
    const hash = generateHash('hello', 'sha1');
    expect(hash).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });
});

describe('generateLoremIpsum', () => {
  it('should generate one paragraph by default', () => {
    const text = generateLoremIpsum();
    expect(text).toContain('Lorem ipsum');
    expect(text.split('\n\n')).toHaveLength(1);
  });

  it('should generate multiple paragraphs', () => {
    const text = generateLoremIpsum(3);
    expect(text.split('\n\n')).toHaveLength(3);
  });

  it('should cap at 20 paragraphs', () => {
    const text = generateLoremIpsum(50);
    expect(text.split('\n\n')).toHaveLength(20);
  });
});

describe('countCharacters', () => {
  it('should count characters in text', () => {
    const result = countCharacters('Hello World');
    expect(result.characters).toBe(11);
    expect(result.words).toBe(2);
  });

  it('should handle empty string', () => {
    const result = countCharacters('');
    expect(result.characters).toBe(0);
    expect(result.words).toBe(0);
    expect(result.sentences).toBe(0);
  });

  it('should count sentences', () => {
    const result = countCharacters('Hello. How are you? I am fine!');
    expect(result.sentences).toBe(3);
  });

  it('should count lines and paragraphs', () => {
    const result = countCharacters('Line 1\nLine 2\n\nParagraph 2');
    expect(result.lines).toBe(4);
    expect(result.paragraphs).toBe(2);
  });
});

describe('validateEmail', () => {
  it('should validate correct email', () => {
    expect(validateEmail('test@example.com')).toEqual({ valid: true });
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
  });

  it('should reject invalid email', () => {
    expect(validateEmail('not-an-email').valid).toBe(false);
    expect(validateEmail('missing@domain').valid).toBe(false);
    expect(validateEmail('@no-local.com').valid).toBe(false);
  });
});

describe('formatJson', () => {
  it('should format valid JSON', () => {
    const result = formatJson('{"a":1,"b":2}');
    expect(result.valid).toBe(true);
    expect(result.formatted).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it('should report invalid JSON', () => {
    const result = formatJson('{invalid}');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should respect custom indent', () => {
    const result = formatJson('{"a":1}', 4);
    expect(result.formatted).toContain('    "a"');
  });
});

describe('decodeJwt', () => {
  it('should decode a valid JWT', () => {
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = decodeJwt(token);
    expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(result.payload).toMatchObject({ sub: '1234567890', name: 'John Doe' });
    expect(result.signature).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  it('should report error for invalid JWT', () => {
    const result = decodeJwt('not-a-jwt');
    expect(result.error).toBeTruthy();
  });

  it('should detect expired token', () => {
    // JWT with exp in the past
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: '1', exp: 1000000000 })).toString('base64url');
    const token = `${header}.${payload}.signature`;
    const result = decodeJwt(token);
    expect(result.expired).toBe(true);
  });
});

describe('generateSql', () => {
  it('should generate SELECT query', () => {
    const sql = generateSql({
      operation: 'SELECT',
      tableName: 'users',
      columns: ['name', 'email'],
      whereClause: 'active = 1',
      orderBy: 'name ASC',
      limit: 10,
    });
    expect(sql).toBe('SELECT name, email FROM users WHERE active = 1 ORDER BY name ASC LIMIT 10;');
  });

  it('should generate INSERT query', () => {
    const sql = generateSql({
      operation: 'INSERT',
      tableName: 'users',
      columns: ['name', 'email'],
      values: ['John', 'john@example.com'],
    });
    expect(sql).toContain('INSERT INTO users');
    expect(sql).toContain("'John'");
  });

  it('should generate DELETE query', () => {
    const sql = generateSql({
      operation: 'DELETE',
      tableName: 'users',
      whereClause: 'id = 1',
    });
    expect(sql).toBe('DELETE FROM users WHERE id = 1;');
  });

  it('should generate CREATE TABLE', () => {
    const sql = generateSql({
      operation: 'CREATE_TABLE',
      tableName: 'users',
      columns: ['id', 'name', 'email'],
    });
    expect(sql).toContain('CREATE TABLE users');
    expect(sql).toContain('id TEXT');
  });
});

describe('convertColor', () => {
  it('should convert hex to RGB and HSL', () => {
    const result = convertColor('#FF0000');
    expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(result.hsl).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('should handle 3-digit hex', () => {
    const result = convertColor('#F00');
    expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('should convert RGB string', () => {
    const result = convertColor('rgb(0, 255, 0)');
    expect(result.hex).toBe('#00ff00');
    expect(result.hsl.h).toBe(120);
  });

  it('should return error for invalid color', () => {
    const result = convertColor('not-a-color');
    expect(result.error).toBeTruthy();
  });
});

describe('generateRandomString', () => {
  it('should generate a string of default length', () => {
    const str = generateRandomString();
    expect(str).toHaveLength(16);
    expect(str).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('should generate a string of specified length', () => {
    const str = generateRandomString(32);
    expect(str).toHaveLength(32);
  });
});

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
    expect(result).toBe('<p>Hello</p>');
  });

  it('should remove event handlers', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">Hello</div>');
    expect(result).toBe('<div>Hello</div>');
  });

  it('should leave safe HTML intact', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });
});
