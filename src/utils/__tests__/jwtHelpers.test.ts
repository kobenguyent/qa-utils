import { describe, it, expect } from 'vitest';
import {
  base64UrlDecode,
  splitJWT,
  decodeJWTHeader,
  decodeJWTPayload,
  getJWTSignature,
  isValidJWTStructure,
  isJWTExpired,
  formatTimestamp,
  getTimeUntilExpiry,
} from '../jwtHelpers';

describe('JWT Helpers', () => {
  const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  describe('base64UrlDecode', () => {
    it('should decode a valid base64url string', () => {
      const encoded = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const decoded = base64UrlDecode(encoded);
      expect(decoded).toBe('{"alg":"HS256","typ":"JWT"}');
    });

    it('should handle base64url with different padding', () => {
      const encoded = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
      const decoded = base64UrlDecode(encoded);
      expect(decoded).toContain('sub');
      expect(decoded).toContain('1234567890');
    });

    it('should throw error for invalid base64url string', () => {
      expect(() => base64UrlDecode('invalid!')).toThrow();
    });
  });

  describe('splitJWT', () => {
    it('should split a valid JWT into three parts', () => {
      const parts = splitJWT(validJWT);
      expect(parts).not.toBeNull();
      expect(parts?.header).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(parts?.payload).toBe('eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ');
      expect(parts?.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });

    it('should return null for invalid JWT format', () => {
      expect(splitJWT('invalid')).toBeNull();
      expect(splitJWT('part1.part2')).toBeNull();
      expect(splitJWT('')).toBeNull();
    });
  });

  describe('decodeJWTHeader', () => {
    it('should decode JWT header correctly', () => {
      const header = decodeJWTHeader(validJWT);
      expect(header).not.toBeNull();
      expect(header?.alg).toBe('HS256');
      expect(header?.typ).toBe('JWT');
    });

    it('should return null for invalid JWT', () => {
      expect(decodeJWTHeader('invalid')).toBeNull();
      expect(decodeJWTHeader('')).toBeNull();
    });

    it('should handle JWT with kid in header', () => {
      const jwtWithKid = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMyJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';
      const header = decodeJWTHeader(jwtWithKid);
      expect(header?.alg).toBe('RS256');
      expect(header?.kid).toBe('123');
    });
  });

  describe('decodeJWTPayload', () => {
    it('should decode JWT payload correctly', () => {
      const payload = decodeJWTPayload(validJWT);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('1234567890');
      expect(payload?.name).toBe('John Doe');
      expect(payload?.iat).toBe(1516239022);
    });

    it('should return null for invalid JWT', () => {
      expect(decodeJWTPayload('invalid')).toBeNull();
      expect(decodeJWTPayload('')).toBeNull();
    });
  });

  describe('getJWTSignature', () => {
    it('should extract JWT signature', () => {
      const signature = getJWTSignature(validJWT);
      expect(signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });

    it('should return null for invalid JWT', () => {
      expect(getJWTSignature('invalid')).toBeNull();
      expect(getJWTSignature('')).toBeNull();
    });
  });

  describe('isValidJWTStructure', () => {
    it('should validate correct JWT structure', () => {
      expect(isValidJWTStructure(validJWT)).toBe(true);
    });

    it('should reject invalid JWT structures', () => {
      expect(isValidJWTStructure('invalid')).toBe(false);
      expect(isValidJWTStructure('part1.part2')).toBe(false);
      expect(isValidJWTStructure('')).toBe(false);
      expect(isValidJWTStructure('part1..part3')).toBe(false);
    });

    it('should handle non-string inputs', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidJWTStructure(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidJWTStructure(undefined)).toBe(false);
    });
  });

  describe('isJWTExpired', () => {
    it('should detect expired tokens', () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      expect(isJWTExpired(expiredPayload)).toBe(true);
    });

    it('should detect valid (not expired) tokens', () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      expect(isJWTExpired(validPayload)).toBe(false);
    });

    it('should return false for tokens without exp', () => {
      expect(isJWTExpired({ sub: '123' })).toBe(false);
      expect(isJWTExpired(null)).toBe(false);
    });
  });

  describe('formatTimestamp', () => {
    it('should format Unix timestamp to readable date', () => {
      const timestamp = 1516239022;
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toContain('2018');
    });

    it('should handle different timestamps', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return "Expired" for past timestamps', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;
      expect(getTimeUntilExpiry(pastTimestamp)).toBe('Expired');
    });

    it('should calculate days and hours for future timestamps', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60); // 2 days
      const result = getTimeUntilExpiry(futureTimestamp);
      expect(result).toContain('day');
    });

    it('should show hours and minutes when less than a day', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + (2 * 60 * 60); // 2 hours
      const result = getTimeUntilExpiry(futureTimestamp);
      expect(result).toContain('hour');
    });

    it('should show only minutes when less than an hour', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + (30 * 60); // 30 minutes
      const result = getTimeUntilExpiry(futureTimestamp);
      expect(result).toContain('minute');
      expect(result).not.toContain('hour');
    });
  });
});
