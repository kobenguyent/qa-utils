import { describe, it, expect } from 'vitest';
import { convertBase, convertCase, generateNanoId, CASE_TYPES } from '../lib/tools.js';

// ── convertBase ───────────────────────────────────────────────────────────────

describe('convertBase', () => {
  it('converts decimal to hexadecimal', () => {
    const r = convertBase('255', 10, 16);
    expect(r.error).toBeUndefined();
    expect(r.result).toBe('FF');
    expect(r.decimal).toBe(255);
  });

  it('converts hexadecimal to binary', () => {
    const r = convertBase('FF', 16, 2);
    expect(r.error).toBeUndefined();
    expect(r.result).toBe('11111111');
  });

  it('converts decimal to octal', () => {
    const r = convertBase('8', 10, 8);
    expect(r.error).toBeUndefined();
    expect(r.result).toBe('10');
  });

  it('converts binary to decimal', () => {
    const r = convertBase('1010', 2, 10);
    expect(r.error).toBeUndefined();
    expect(r.result).toBe('10');
    expect(r.decimal).toBe(10);
  });

  it('returns the result in uppercase', () => {
    const r = convertBase('255', 10, 16);
    expect(r.result).toBe(r.result.toUpperCase());
  });

  it('returns an error for an invalid source value', () => {
    const r = convertBase('XYZ', 10, 16);
    expect(r.error).toBeTruthy();
    expect(r.result).toBe('');
  });

  it('returns an error when the base is out of range', () => {
    expect(convertBase('10', 1, 10).error).toBeTruthy();
    expect(convertBase('10', 10, 37).error).toBeTruthy();
  });

  it('handles base-36 (alphanumeric) conversions', () => {
    const r = convertBase('35', 10, 36);
    expect(r.error).toBeUndefined();
    expect(r.result).toBe('Z');
  });
});

// ── convertCase ───────────────────────────────────────────────────────────────

describe('convertCase', () => {
  it('exports all expected CASE_TYPES', () => {
    expect(CASE_TYPES).toContain('upper');
    expect(CASE_TYPES).toContain('lower');
    expect(CASE_TYPES).toContain('title');
    expect(CASE_TYPES).toContain('camel');
    expect(CASE_TYPES).toContain('pascal');
    expect(CASE_TYPES).toContain('snake');
    expect(CASE_TYPES).toContain('kebab');
    expect(CASE_TYPES).toContain('constant');
  });

  it('converts to uppercase', () => {
    expect(convertCase('hello world', 'upper')).toBe('HELLO WORLD');
  });

  it('converts to lowercase', () => {
    expect(convertCase('HELLO WORLD', 'lower')).toBe('hello world');
  });

  it('converts to Title Case', () => {
    expect(convertCase('hello world', 'title')).toBe('Hello World');
  });

  it('converts to camelCase from space-separated words', () => {
    expect(convertCase('hello world foo', 'camel')).toBe('helloWorldFoo');
  });

  it('converts to PascalCase', () => {
    expect(convertCase('hello world', 'pascal')).toBe('HelloWorld');
  });

  it('converts to snake_case', () => {
    expect(convertCase('hello world', 'snake')).toBe('hello_world');
    expect(convertCase('helloWorld', 'snake')).toBe('hello_world');
  });

  it('converts to kebab-case', () => {
    expect(convertCase('hello world', 'kebab')).toBe('hello-world');
    expect(convertCase('helloWorld', 'kebab')).toBe('hello-world');
  });

  it('converts to CONSTANT_CASE', () => {
    expect(convertCase('hello world', 'constant')).toBe('HELLO_WORLD');
  });

  it('handles camelCase input correctly', () => {
    expect(convertCase('helloWorld', 'snake')).toBe('hello_world');
    expect(convertCase('helloWorld', 'kebab')).toBe('hello-world');
  });

  it('handles PascalCase input correctly', () => {
    expect(convertCase('HelloWorld', 'snake')).toBe('hello_world');
    expect(convertCase('HelloWorld', 'camel')).toBe('helloWorld');
  });

  it('handles snake_case input correctly', () => {
    expect(convertCase('hello_world', 'camel')).toBe('helloWorld');
    expect(convertCase('hello_world', 'pascal')).toBe('HelloWorld');
  });
});

// ── generateNanoId ────────────────────────────────────────────────────────────

const NANO_REGEX = /^[A-Za-z0-9_-]+$/;

describe('generateNanoId', () => {
  it('generates an ID of the default length (21)', () => {
    const id = generateNanoId();
    expect(id).toHaveLength(21);
    expect(id).toMatch(NANO_REGEX);
  });

  it('generates an ID of the specified length', () => {
    expect(generateNanoId(10)).toHaveLength(10);
    expect(generateNanoId(64)).toHaveLength(64);
  });

  it('clamps to a minimum length of 1', () => {
    expect(generateNanoId(0)).toHaveLength(1);
    expect(generateNanoId(-5)).toHaveLength(1);
  });

  it('clamps to a maximum length of 128', () => {
    expect(generateNanoId(200)).toHaveLength(128);
  });

  it('uses only the NanoID alphabet characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateNanoId(32)).toMatch(NANO_REGEX);
    }
  });

  it('produces unique IDs on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateNanoId()));
    expect(ids.size).toBe(100);
  });
});
