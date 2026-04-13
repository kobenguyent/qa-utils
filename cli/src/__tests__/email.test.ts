import { describe, it, expect } from 'vitest';
import { validateEmail } from '../lib/tools.js';

describe('validateEmail', () => {
  it('accepts a standard email address', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
  });

  it('accepts an email with a subdomain', () => {
    expect(validateEmail('user@mail.example.com').valid).toBe(true);
  });

  it('accepts an email with a plus alias', () => {
    expect(validateEmail('user+tag@example.com').valid).toBe(true);
  });

  it('accepts an email with dots in the local part', () => {
    expect(validateEmail('first.last@example.com').valid).toBe(true);
  });

  it('rejects an empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Email is empty');
  });

  it('rejects a whitespace-only string', () => {
    expect(validateEmail('   ').valid).toBe(false);
  });

  it('rejects an address without @', () => {
    expect(validateEmail('userexample.com').valid).toBe(false);
  });

  it('rejects an address without a domain', () => {
    expect(validateEmail('user@').valid).toBe(false);
  });

  it('rejects an address without a TLD', () => {
    expect(validateEmail('user@domain').valid).toBe(false);
  });

  it('rejects an address with spaces', () => {
    expect(validateEmail('user @example.com').valid).toBe(false);
  });

  it('provides a reason when invalid', () => {
    const result = validateEmail('bad-email');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('trims whitespace around a valid email', () => {
    expect(validateEmail('  user@example.com  ').valid).toBe(true);
  });
});
