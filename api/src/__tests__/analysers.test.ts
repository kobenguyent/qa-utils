import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app';

const app = createApp();
const post = (path: string, body: unknown) =>
  request(app).post(path).send(body).set('Content-Type', 'application/json');

// ── text-stats ────────────────────────────────────────────────────────────────

describe('POST /api/analysers/text-stats', () => {
  it('returns correct stats for simple text', async () => {
    const res = await post('/api/analysers/text-stats', { value: 'Hello world. How are you?' });
    expect(res.status).toBe(200);
    expect(res.body.words).toBe(5);
    expect(res.body.characters).toBe(25);
  });

  it('returns zeros for empty string', async () => {
    const res = await post('/api/analysers/text-stats', { value: '' });
    expect(res.status).toBe(200);
    expect(res.body.words).toBe(0);
    expect(res.body.characters).toBe(0);
  });
});

// ── email ─────────────────────────────────────────────────────────────────────

describe('POST /api/analysers/email', () => {
  it('validates a correct email', async () => {
    const res = await post('/api/analysers/email', { email: 'user@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('invalidates a bad email', async () => {
    const res = await post('/api/analysers/email', { email: 'not-an-email' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(typeof res.body.reason).toBe('string');
  });

  it('rejects missing email field', async () => {
    const res = await post('/api/analysers/email', {});
    expect(res.status).toBe(400);
  });
});

// ── jwt ───────────────────────────────────────────────────────────────────────

describe('POST /api/analysers/jwt', () => {
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
    '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
    '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('decodes a valid JWT', async () => {
    const res = await post('/api/analysers/jwt', { token: validToken });
    expect(res.status).toBe(200);
    expect(res.body.header).toBeTruthy();
    expect(res.body.payload).toBeTruthy();
    expect((res.body.payload as Record<string, unknown>)['sub']).toBe('1234567890');
  });

  it('returns error for invalid JWT', async () => {
    const res = await post('/api/analysers/jwt', { token: 'not.a.jwt' });
    expect(res.status).toBe(200);
    expect(typeof res.body.error).toBe('string');
  });

  it('rejects missing token', async () => {
    const res = await post('/api/analysers/jwt', {});
    expect(res.status).toBe(400);
  });
});

// ── regex ─────────────────────────────────────────────────────────────────────

describe('POST /api/analysers/regex', () => {
  it('finds all matches', async () => {
    const res = await post('/api/analysers/regex', {
      pattern: '\\d+',
      text: 'Order 123 and item 456',
      flags: 'g',
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.matches[0].match).toBe('123');
    expect(res.body.matches[1].match).toBe('456');
  });

  it('returns valid=false for an invalid regex', async () => {
    const res = await post('/api/analysers/regex', {
      pattern: '[invalid',
      text: 'some text',
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });

  it('rejects missing pattern', async () => {
    const res = await post('/api/analysers/regex', { text: 'hello' });
    expect(res.status).toBe(400);
  });
});

// ── compare ──────────────────────────────────────────────────────────────────

describe('POST /api/analysers/compare', () => {
  it('returns 100% similarity for identical texts', async () => {
    const res = await post('/api/analysers/compare', {
      text1: 'line 1\nline 2',
      text2: 'line 1\nline 2',
    });
    expect(res.status).toBe(200);
    expect(res.body.similarity).toBe(100);
    expect(res.body.stats.sameLines).toBe(2);
    expect(res.body.stats.addedLines).toBe(0);
    expect(res.body.stats.removedLines).toBe(0);
  });

  it('detects differences between texts', async () => {
    const res = await post('/api/analysers/compare', {
      text1: 'hello\nworld',
      text2: 'hello\nearth',
    });
    expect(res.status).toBe(200);
    expect(res.body.stats.sameLines).toBe(1);
    expect(res.body.diffLines).toBeInstanceOf(Array);
    expect(res.body.diffLines.length).toBeGreaterThan(0);
  });

  it('respects ignoreCase option', async () => {
    const res = await post('/api/analysers/compare', {
      text1: 'Hello',
      text2: 'hello',
      ignoreCase: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.similarity).toBe(100);
  });

  it('respects ignoreWhitespace option', async () => {
    const res = await post('/api/analysers/compare', {
      text1: 'hello   world',
      text2: 'hello world',
      ignoreWhitespace: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.similarity).toBe(100);
  });
});
