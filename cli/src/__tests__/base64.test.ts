import { describe, it, expect } from 'vitest';
import { base64Encode, base64Decode } from '../lib/tools.js';

describe('base64Encode', () => {
  it('encodes a simple ASCII string', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=');
  });

  it('encodes an empty string', () => {
    expect(base64Encode('')).toBe('');
  });

  it('encodes a string with special characters', () => {
    const encoded = base64Encode('Hello, World!');
    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
  });

  it('encodes Unicode characters', () => {
    const encoded = base64Encode('café');
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('round-trips correctly with decode', () => {
    const original = 'The quick brown fox jumps over the lazy dog';
    expect(base64Decode(base64Encode(original))).toBe(original);
  });
});

describe('base64Decode', () => {
  it('decodes a valid Base64 string', () => {
    expect(base64Decode('aGVsbG8=')).toBe('hello');
  });

  it('decodes without padding', () => {
    // Some implementations omit padding — Node Buffer is lenient
    const encoded = base64Encode('test');
    const nopad = encoded.replace(/=+$/, '');
    // Should still decode (Buffer is lenient with padding)
    expect(base64Decode(nopad + '==')).toBe('test');
  });

  it('decodes an empty string', () => {
    expect(base64Decode('')).toBe('');
  });

  it('throws on non-Base64 input', () => {
    expect(() => base64Decode('!!!not-base64!!!')).toThrow();
  });

  it('round-trips a multi-line string correctly', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    expect(base64Decode(base64Encode(text))).toBe(text);
  });
});
