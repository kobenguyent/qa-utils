import { describe, it, expect } from 'vitest';
import { testRegex } from '../lib/tools.js';

describe('testRegex', () => {
  it('finds all matches in global mode', () => {
    const result = testRegex('\\d+', 'g', 'abc 123 def 456');
    expect(result.valid).toBe(true);
    expect(result.count).toBe(2);
    expect(result.matches[0].match).toBe('123');
    expect(result.matches[0].index).toBe(4);
    expect(result.matches[1].match).toBe('456');
  });

  it('adds the g flag automatically when not provided', () => {
    const result = testRegex('\\d+', '', 'abc 123 def 456');
    expect(result.valid).toBe(true);
    expect(result.count).toBe(2);
  });

  it('captures named-style groups via positional groups', () => {
    const result = testRegex('(\\w+)@(\\w+)', 'g', 'user@example and admin@test');
    expect(result.valid).toBe(true);
    expect(result.count).toBe(2);
    expect(result.matches[0].groups).toEqual(['user', 'example']);
    expect(result.matches[1].groups).toEqual(['admin', 'test']);
  });

  it('returns count 0 when no matches are found', () => {
    const result = testRegex('xyz', 'g', 'hello world');
    expect(result.valid).toBe(true);
    expect(result.count).toBe(0);
    expect(result.matches).toHaveLength(0);
  });

  it('returns valid=false and an error for invalid regex patterns', () => {
    const result = testRegex('[invalid', 'g', 'test');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.count).toBe(0);
  });

  it('handles case-insensitive matching', () => {
    const result = testRegex('hello', 'gi', 'Hello HELLO hello');
    expect(result.valid).toBe(true);
    expect(result.count).toBe(3);
  });

  it('strips invalid flag characters', () => {
    // 'z' is not a valid flag, should be ignored without throwing
    const result = testRegex('\\d', 'gz', '1 2 3');
    expect(result.valid).toBe(true);
    expect(result.count).toBe(3);
  });

  it('does not loop infinitely on zero-length matches', () => {
    const result = testRegex('a*', 'g', 'bbb');
    expect(result.valid).toBe(true);
    // Should complete without hanging
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});
