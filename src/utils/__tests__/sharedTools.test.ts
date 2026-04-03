import { describe, it, expect } from 'vitest';
import {
  generateLoremIpsum,
  countTextStats,
  validateEmail,
  formatJson,
  convertTimestamp,
  generateSql,
  convertSimpleColor,
  sanitizeHtml,
  decodeJwt,
} from '../sharedTools';

describe('sharedTools', () => {
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

  describe('countTextStats', () => {
    it('should count characters in text', () => {
      const result = countTextStats('Hello World');
      expect(result.characters).toBe(11);
      expect(result.words).toBe(2);
    });

    it('should handle empty string', () => {
      const result = countTextStats('');
      expect(result.characters).toBe(0);
      expect(result.words).toBe(0);
      expect(result.sentences).toBe(0);
    });

    it('should count sentences', () => {
      const result = countTextStats('Hello. How are you? I am fine!');
      expect(result.sentences).toBe(3);
    });

    it('should count lines and paragraphs', () => {
      const result = countTextStats('Line 1\nLine 2\n\nParagraph 2');
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
  });

  describe('generateSql', () => {
    it('should generate SELECT query', () => {
      const sql = generateSql({
        operation: 'SELECT',
        tableName: 'users',
        columns: ['name', 'email'],
        whereClause: 'active = 1',
      });
      expect(sql).toBe('SELECT name, email FROM users WHERE active = 1;');
    });

    it('should escape single quotes in INSERT values', () => {
      const sql = generateSql({
        operation: 'INSERT',
        tableName: 'users',
        columns: ['name'],
        values: ["O'Brien"],
      });
      expect(sql).toContain("'O''Brien'");
    });
  });

  describe('convertSimpleColor', () => {
    it('should convert hex to RGB and HSL', () => {
      const result = convertSimpleColor('#FF0000');
      expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
      expect(result.hsl).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('should convert RGB string', () => {
      const result = convertSimpleColor('rgb(0, 255, 0)');
      expect(result.hex).toBe('#00ff00');
    });

    it('should return error for invalid color', () => {
      const result = convertSimpleColor('not-a-color');
      expect(result.error).toBeTruthy();
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

  describe('decodeJwt', () => {
    it('should decode a valid JWT', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      // Use atob-based decoder for browser-compatible test
      const b64Decode = (str: string): string => {
        const padded = str.replace(/-/g, '+').replace(/_/g, '/');
        return atob(padded);
      };

      const result = decodeJwt(token, b64Decode);
      expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(result.payload).toMatchObject({ sub: '1234567890', name: 'John Doe' });
      expect(result.signature).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should report error for invalid JWT', () => {
      const result = decodeJwt('not-a-jwt', () => '');
      expect(result.error).toBeTruthy();
    });
  });
});
