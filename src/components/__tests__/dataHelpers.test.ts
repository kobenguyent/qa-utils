import { describe, it, expect } from 'vitest';

describe('Data Processing Helpers', () => {
  it('should handle token expiration calculation', () => {
    const calculateTimeRemaining = (expTimestamp: number) => {
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = expTimestamp - now;
      
      if (timeRemaining <= 0) {
        return { expired: true, remaining: 0, message: 'Token has expired' };
      }
      
      const hours = Math.floor(timeRemaining / 3600);
      const minutes = Math.floor((timeRemaining % 3600) / 60);
      
      return {
        expired: false,
        remaining: timeRemaining,
        message: `Token expires in ${hours}h ${minutes}m`
      };
    };

    const futureTime = Math.floor(Date.now() / 1000) + 3661; // 1 hour 1 minute from now
    const pastTime = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago

    const futureResult = calculateTimeRemaining(futureTime);
    expect(futureResult.expired).toBe(false);
    expect(futureResult.remaining).toBeGreaterThan(0);
    expect(futureResult.message).toContain('1h 1m');

    const pastResult = calculateTimeRemaining(pastTime);
    expect(pastResult.expired).toBe(true);
    expect(pastResult.remaining).toBe(0);
    expect(pastResult.message).toBe('Token has expired');
  });

  it('should format JSON data safely', () => {
    const formatJSON = (data: any, indent = 2) => {
      try {
        if (typeof data === 'string') {
          return JSON.stringify(JSON.parse(data), null, indent);
        }
        return JSON.stringify(data, null, indent);
      } catch (error) {
        return 'Invalid JSON';
      }
    };

    const validObject = { name: 'John', age: 30 };
    const validString = '{"name":"Jane","age":25}';
    const invalidString = '{"name":"Bob",age:}';

    expect(formatJSON(validObject)).toContain('{\n  "name": "John"');
    expect(formatJSON(validString)).toContain('{\n  "name": "Jane"');
    expect(formatJSON(invalidString)).toBe('Invalid JSON');
  });

  it('should handle Base64 encoding/decoding', () => {
    const base64Encode = (text: string) => {
      try {
        return btoa(text);
      } catch (error) {
        return 'Error encoding to Base64';
      }
    };

    const base64Decode = (encoded: string) => {
      try {
        return atob(encoded);
      } catch (error) {
        return 'Error decoding from Base64';
      }
    };

    const originalText = 'Hello, World!';
    const encoded = base64Encode(originalText);
    const decoded = base64Decode(encoded);

    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
    expect(decoded).toBe(originalText);
    expect(base64Decode('invalid!')).toBe('Error decoding from Base64');
  });

  it('should validate input lengths and content', () => {
    const validateInput = (text: string, options = { maxLength: 1000, required: true }) => {
      const errors: string[] = [];
      
      if (options.required && !text.trim()) {
        errors.push('This field is required');
      }
      
      if (text.length > options.maxLength) {
        errors.push(`Text exceeds maximum length of ${options.maxLength} characters`);
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        length: text.length
      };
    };

    expect(validateInput('Valid text')).toEqual({
      isValid: true,
      errors: [],
      length: 10
    });

    expect(validateInput('', { maxLength: 100, required: true })).toEqual({
      isValid: false,
      errors: ['This field is required'],
      length: 0
    });

    const longText = 'x'.repeat(1500);
    expect(validateInput(longText, { maxLength: 1000, required: true })).toEqual({
      isValid: false,
      errors: ['Text exceeds maximum length of 1000 characters'],
      length: 1500
    });
  });

  it('should handle URL hash navigation', () => {
    const parseHashRoute = (hash: string) => {
      const cleanHash = hash.replace(/^#\/?/, '');
      const parts = cleanHash.split('/');
      
      return {
        route: parts[0] || 'home',
        params: parts.slice(1),
        isRoot: !cleanHash || cleanHash === 'home'
      };
    };

    expect(parseHashRoute('#/jwtDebugger')).toEqual({
      route: 'jwtDebugger',
      params: [],
      isRoot: false
    });

    expect(parseHashRoute('#/user/123/settings')).toEqual({
      route: 'user',
      params: ['123', 'settings'],
      isRoot: false
    });

    expect(parseHashRoute('#')).toEqual({
      route: 'home',
      params: [],
      isRoot: true
    });
  });
});