import { describe, it, expect } from 'vitest';
import { generateRandomString } from '../lib/tools.js';

describe('generateRandomString', () => {
  it('generates a string of the default length (16)', () => {
    expect(generateRandomString()).toHaveLength(16);
  });

  it('generates a string of a custom length', () => {
    expect(generateRandomString(32)).toHaveLength(32);
    expect(generateRandomString(1)).toHaveLength(1);
  });

  it('caps length at 1024', () => {
    expect(generateRandomString(2000)).toHaveLength(1024);
  });

  it('enforces minimum length of 1', () => {
    expect(generateRandomString(0)).toHaveLength(1);
    expect(generateRandomString(-10)).toHaveLength(1);
  });

  it('contains only alphanumeric characters', () => {
    const str = generateRandomString(200);
    expect(/^[A-Za-z0-9]+$/.test(str)).toBe(true);
  });

  it('produces different strings on repeated calls', () => {
    const a = generateRandomString(32);
    const b = generateRandomString(32);
    expect(a).not.toBe(b);
  });
});
