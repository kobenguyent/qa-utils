import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app';

const app = createApp();
const post = (path: string, body: unknown) =>
  request(app).post(path).send(body).set('Content-Type', 'application/json');

// ── base64 ────────────────────────────────────────────────────────────────────

describe('POST /api/converters/base64/encode', () => {
  it('encodes a string', async () => {
    const res = await post('/api/converters/base64/encode', { value: 'Hello, World!' });
    expect(res.status).toBe(200);
    expect(res.body.encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
  });

  it('rejects missing value', async () => {
    const res = await post('/api/converters/base64/encode', {});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/converters/base64/decode', () => {
  it('decodes a base64 string', async () => {
    const res = await post('/api/converters/base64/decode', { value: 'SGVsbG8sIFdvcmxkIQ==' });
    expect(res.status).toBe(200);
    expect(res.body.decoded).toBe('Hello, World!');
  });

  it('returns 422 for invalid base64', async () => {
    const res = await post('/api/converters/base64/decode', { value: '!!not-base64!!' });
    expect(res.status).toBe(422);
  });
});

// ── url ───────────────────────────────────────────────────────────────────────

describe('POST /api/converters/url/encode', () => {
  it('encodes a URL string', async () => {
    const res = await post('/api/converters/url/encode', { text: 'hello world & more' });
    expect(res.status).toBe(200);
    expect(res.body.encoded).toBe('hello%20world%20%26%20more');
  });
});

describe('POST /api/converters/url/decode', () => {
  it('decodes a percent-encoded string', async () => {
    const res = await post('/api/converters/url/decode', { text: 'hello%20world' });
    expect(res.status).toBe(200);
    expect(res.body.decoded).toBe('hello world');
  });
});

describe('POST /api/converters/url/parse', () => {
  it('parses a URL into components', async () => {
    const res = await post('/api/converters/url/parse', { url: 'https://example.com/path?foo=bar#sec' });
    expect(res.status).toBe(200);
    expect(res.body.hostname).toBe('example.com');
    expect(res.body.pathname).toBe('/path');
    expect(res.body.params).toEqual({ foo: 'bar' });
    expect(res.body.hash).toBe('#sec');
  });

  it('returns 422 for an invalid URL', async () => {
    const res = await post('/api/converters/url/parse', { url: ':::bad:::' });
    expect(res.status).toBe(422);
  });
});

// ── hash ──────────────────────────────────────────────────────────────────────

describe('POST /api/converters/hash', () => {
  it('hashes with sha256 by default', async () => {
    const res = await post('/api/converters/hash', { value: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.algorithm).toBe('sha256');
    expect(res.body.hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('hashes with md5', async () => {
    const res = await post('/api/converters/hash', { value: 'hello', algorithm: 'md5' });
    expect(res.status).toBe(200);
    expect(res.body.hash).toBe('5d41402abc4b2a76b9719d911017c592');
  });
});

// ── color ─────────────────────────────────────────────────────────────────────

describe('POST /api/converters/color', () => {
  it('converts hex to rgb and hsl', async () => {
    const res = await post('/api/converters/color', { input: '#ff0000' });
    expect(res.status).toBe(200);
    expect(res.body.hex).toBe('#ff0000');
    expect(res.body.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(res.body.hsl.h).toBe(0);
  });

  it('returns 422 for unsupported format', async () => {
    const res = await post('/api/converters/color', { input: 'red' });
    expect(res.status).toBe(422);
  });
});

// ── timestamp ─────────────────────────────────────────────────────────────────

describe('POST /api/converters/timestamp', () => {
  it('returns current time when no value given', async () => {
    const res = await post('/api/converters/timestamp', {});
    expect(res.status).toBe(200);
    expect(typeof res.body.timestamp).toBe('number');
    expect(typeof res.body.iso).toBe('string');
  });

  it('converts a known unix timestamp', async () => {
    const res = await post('/api/converters/timestamp', { value: 0 });
    expect(res.status).toBe(200);
    expect(res.body.timestamp).toBe(0);
    expect(res.body.iso).toBe('1970-01-01T00:00:00.000Z');
  });
});

// ── base ──────────────────────────────────────────────────────────────────────

describe('POST /api/converters/base', () => {
  it('converts decimal 255 to hex FF', async () => {
    const res = await post('/api/converters/base', { value: '255', from: 10, to: 16 });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('FF');
    expect(res.body.decimal).toBe(255);
  });

  it('returns 422 for invalid number', async () => {
    const res = await post('/api/converters/base', { value: 'zzz', from: 10, to: 16 });
    expect(res.status).toBe(422);
  });
});

// ── case ──────────────────────────────────────────────────────────────────────

describe('POST /api/converters/case', () => {
  it('converts to camelCase', async () => {
    const res = await post('/api/converters/case', { text: 'hello world', to: 'camel' });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('helloWorld');
  });

  it('converts to snake_case', async () => {
    const res = await post('/api/converters/case', { text: 'hello world', to: 'snake' });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('hello_world');
  });

  it('rejects invalid style', async () => {
    const res = await post('/api/converters/case', { text: 'hello', to: 'invalid-style' });
    expect(res.status).toBe(400);
  });
});
