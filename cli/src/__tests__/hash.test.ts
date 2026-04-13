import { describe, it, expect } from 'vitest';
import { generateHash, HASH_ALGORITHMS } from '../lib/tools.js';

describe('generateHash', () => {
  it('defaults to sha256', () => {
    const hash = generateHash('hello');
    // sha256 of "hello"
    expect(hash).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('generates md5', () => {
    const hash = generateHash('hello', 'md5');
    expect(hash).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('generates sha1', () => {
    const hash = generateHash('hello', 'sha1');
    expect(hash).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  it('generates sha512', () => {
    const hash = generateHash('hello', 'sha512');
    expect(hash).toHaveLength(128); // sha512 = 64 bytes = 128 hex chars
  });

  it('generates sha384', () => {
    const hash = generateHash('hello', 'sha384');
    expect(hash).toHaveLength(96); // sha384 = 48 bytes = 96 hex chars
  });

  it('produces deterministic output', () => {
    expect(generateHash('deterministic', 'sha256')).toBe(
      generateHash('deterministic', 'sha256'),
    );
  });

  it('produces different hashes for different inputs', () => {
    expect(generateHash('foo', 'sha256')).not.toBe(
      generateHash('bar', 'sha256'),
    );
  });

  it('handles empty string input', () => {
    const hash = generateHash('');
    expect(typeof hash).toBe('string');
    expect(hash).toHaveLength(64); // sha256 always 64 hex chars
  });

  it('exports all expected algorithms', () => {
    expect(HASH_ALGORITHMS).toEqual(['md5', 'sha1', 'sha256', 'sha384', 'sha512']);
  });
});
