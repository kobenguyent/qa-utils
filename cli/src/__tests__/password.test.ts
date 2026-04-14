import { describe, it, expect } from 'vitest';
import { generatePassword } from '../lib/tools.js';

describe('generatePassword', () => {
  it('generates a password of the default length (16)', () => {
    const pwd = generatePassword();
    expect(pwd).toHaveLength(16);
  });

  it('generates a password of a custom length', () => {
    expect(generatePassword(24)).toHaveLength(24);
    expect(generatePassword(8)).toHaveLength(8);
  });

  it('caps length at 256', () => {
    expect(generatePassword(500)).toHaveLength(256);
  });

  it('enforces minimum length of 1', () => {
    expect(generatePassword(0)).toHaveLength(1);
    expect(generatePassword(-5)).toHaveLength(1);
  });

  it('includes uppercase when option is true', () => {
    const pwd = generatePassword(200, { uppercase: true, lowercase: false, numbers: false, symbols: false });
    expect(/[A-Z]/.test(pwd)).toBe(true);
    expect(/[a-z]/.test(pwd)).toBe(false);
  });

  it('includes lowercase when option is true', () => {
    const pwd = generatePassword(200, { uppercase: false, lowercase: true, numbers: false, symbols: false });
    expect(/[a-z]/.test(pwd)).toBe(true);
    expect(/[A-Z]/.test(pwd)).toBe(false);
  });

  it('includes numbers when option is true', () => {
    const pwd = generatePassword(200, { uppercase: false, lowercase: false, numbers: true, symbols: false });
    expect(/[0-9]/.test(pwd)).toBe(true);
  });

  it('includes symbols when option is true', () => {
    const pwd = generatePassword(200, { uppercase: false, lowercase: false, numbers: false, symbols: true });
    expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pwd)).toBe(true);
  });

  it('falls back to alphanumeric when all options are false', () => {
    const pwd = generatePassword(100, { uppercase: false, lowercase: false, numbers: false, symbols: false });
    expect(pwd).toHaveLength(100);
    expect(/^[A-Za-z0-9]+$/.test(pwd)).toBe(true);
  });

  it('generates different passwords each time', () => {
    const a = generatePassword(32);
    const b = generatePassword(32);
    // Extremely unlikely to be equal
    expect(a).not.toBe(b);
  });
});
