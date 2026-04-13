import { describe, it, expect } from 'vitest';
import { formatJson } from '../lib/tools.js';

describe('formatJson', () => {
  it('formats a valid JSON string with 2-space indent by default', () => {
    const result = formatJson('{"a":1,"b":2}');
    expect(result.valid).toBe(true);
    expect(result.formatted).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it('formats with custom indentation', () => {
    const result = formatJson('{"x":1}', 4);
    expect(result.formatted).toBe('{\n    "x": 1\n}');
  });

  it('returns valid: false for invalid JSON', () => {
    const result = formatJson('{invalid json}');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns the original string when invalid', () => {
    const bad = 'not json at all';
    const result = formatJson(bad);
    expect(result.formatted).toBe(bad);
  });

  it('handles JSON arrays', () => {
    const result = formatJson('[1,2,3]');
    expect(result.valid).toBe(true);
    expect(result.formatted).toBe('[\n  1,\n  2,\n  3\n]');
  });

  it('handles deeply nested objects', () => {
    const input = JSON.stringify({ a: { b: { c: 42 } } });
    const result = formatJson(input);
    expect(result.valid).toBe(true);
    expect(result.formatted).toContain('"c": 42');
  });

  it('handles null JSON values', () => {
    const result = formatJson('null');
    expect(result.valid).toBe(true);
    expect(result.formatted).toBe('null');
  });

  it('handles JSON booleans', () => {
    const result = formatJson('true');
    expect(result.valid).toBe(true);
    expect(result.formatted).toBe('true');
  });

  it('handles an empty object', () => {
    const result = formatJson('{}');
    expect(result.valid).toBe(true);
    expect(result.formatted).toBe('{}');
  });

  it('handles an empty array', () => {
    const result = formatJson('[]');
    expect(result.valid).toBe(true);
    expect(result.formatted).toBe('[]');
  });
});
