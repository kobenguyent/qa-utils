import { describe, it, expect } from 'vitest';
import { convertTimestamp } from '../lib/tools.js';

describe('convertTimestamp', () => {
  it('returns the current time when called with no arguments', () => {
    const before = Math.floor(Date.now() / 1000);
    const result = convertTimestamp();
    const after = Math.floor(Date.now() / 1000);
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });

  it('converts a Unix timestamp in seconds', () => {
    const result = convertTimestamp(0);
    expect(result.iso).toBe('1970-01-01T00:00:00.000Z');
    expect(result.timestamp).toBe(0);
  });

  it('converts a Unix timestamp in milliseconds (> 1e10)', () => {
    const ms = 1700000000000; // definitely > 1e10
    const result = convertTimestamp(ms);
    expect(result.timestamp).toBe(1700000000);
  });

  it('converts a numeric string', () => {
    const result = convertTimestamp('0');
    expect(result.iso).toBe('1970-01-01T00:00:00.000Z');
  });

  it('converts an ISO date string', () => {
    const result = convertTimestamp('2024-01-01T00:00:00.000Z');
    expect(result.iso).toBe('2024-01-01T00:00:00.000Z');
    expect(result.timestamp).toBe(1704067200);
  });

  it('returns all four fields', () => {
    const result = convertTimestamp(1700000000);
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('iso');
    expect(result).toHaveProperty('utc');
    expect(result).toHaveProperty('local');
  });

  it('iso field is a valid ISO 8601 string', () => {
    const result = convertTimestamp(1700000000);
    expect(() => new Date(result.iso)).not.toThrow();
    expect(result.iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
