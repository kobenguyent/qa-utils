import { describe, it, expect } from 'vitest';
import { urlEncode, urlDecode, parseUrl } from '../lib/tools.js';

describe('urlEncode', () => {
  it('encodes spaces and special characters', () => {
    expect(urlEncode('hello world')).toBe('hello%20world');
    expect(urlEncode('a=1&b=2')).toBe('a%3D1%26b%3D2');
  });

  it('encodes Unicode characters', () => {
    expect(urlEncode('café')).toBe('caf%C3%A9');
  });

  it('leaves safe characters unchanged', () => {
    expect(urlEncode('hello')).toBe('hello');
    expect(urlEncode('abc-123_test~ok')).toBe('abc-123_test~ok');
  });

  it('handles empty string', () => {
    expect(urlEncode('')).toBe('');
  });
});

describe('urlDecode', () => {
  it('decodes percent-encoded strings', () => {
    expect(urlDecode('hello%20world')).toBe('hello world');
    expect(urlDecode('a%3D1%26b%3D2')).toBe('a=1&b=2');
  });

  it('decodes Unicode characters', () => {
    expect(urlDecode('caf%C3%A9')).toBe('café');
  });

  it('handles already-decoded strings', () => {
    expect(urlDecode('hello')).toBe('hello');
  });

  it('throws on invalid percent-encoded sequences', () => {
    expect(() => urlDecode('%ZZ')).toThrow('Invalid percent-encoded string');
  });

  it('handles empty string', () => {
    expect(urlDecode('')).toBe('');
  });
});

describe('parseUrl', () => {
  it('parses a full URL into its components', () => {
    const { parsed } = parseUrl('https://example.com:8080/path?foo=bar&baz=qux#section');
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('example.com');
    expect(parsed.port).toBe('8080');
    expect(parsed.pathname).toBe('/path');
    expect(parsed.search).toBe('?foo=bar&baz=qux');
    expect(parsed.hash).toBe('#section');
    expect(parsed.params).toEqual({ foo: 'bar', baz: 'qux' });
  });

  it('automatically prepends https:// when protocol is missing', () => {
    const { parsed } = parseUrl('example.com/path');
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    expect(parsed.hostname).toBe('example.com');
    expect(parsed.pathname).toBe('/path');
  });

  it('returns empty params object when there is no query string', () => {
    const { parsed } = parseUrl('https://example.com/');
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    expect(parsed.params).toEqual({});
  });

  it('returns an error for clearly invalid input', () => {
    const { parsed, error } = parseUrl('not a url !!!@###');
    expect(parsed).toBeNull();
    expect(error).toBeTruthy();
  });
});
