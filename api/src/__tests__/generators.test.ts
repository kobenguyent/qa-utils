import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app';

const app = createApp();
const post = (path: string, body: unknown) =>
  request(app).post(path).send(body).set('Content-Type', 'application/json');

// ── /api/generators/uuid ──────────────────────────────────────────────────────

describe('POST /api/generators/uuid', () => {
  it('returns 1 UUID by default', async () => {
    const res = await post('/api/generators/uuid', {});
    expect(res.status).toBe(200);
    expect(res.body.uuids).toHaveLength(1);
    expect(res.body.count).toBe(1);
    expect(res.body.uuids[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('returns requested quantity', async () => {
    const res = await post('/api/generators/uuid', { quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.uuids).toHaveLength(5);
    expect(res.body.count).toBe(5);
  });

  it('rejects quantity > 100', async () => {
    const res = await post('/api/generators/uuid', { quantity: 999 });
    expect(res.status).toBe(400);
  });
});

// ── /api/generators/password ──────────────────────────────────────────────────

describe('POST /api/generators/password', () => {
  it('returns a password with default length 16', async () => {
    const res = await post('/api/generators/password', {});
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(16);
    expect(typeof res.body.password).toBe('string');
  });

  it('respects custom length', async () => {
    const res = await post('/api/generators/password', { length: 32 });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(32);
  });

  it('rejects length > 256', async () => {
    const res = await post('/api/generators/password', { length: 300 });
    expect(res.status).toBe(400);
  });
});

// ── /api/generators/nanoid ────────────────────────────────────────────────────

describe('POST /api/generators/nanoid', () => {
  it('returns 1 NanoID of size 21 by default', async () => {
    const res = await post('/api/generators/nanoid', {});
    expect(res.status).toBe(200);
    expect(res.body.ids).toHaveLength(1);
    expect(res.body.ids[0]).toHaveLength(21);
  });

  it('returns multiple IDs of custom size', async () => {
    const res = await post('/api/generators/nanoid', { size: 10, count: 3 });
    expect(res.status).toBe(200);
    expect(res.body.ids).toHaveLength(3);
    for (const id of res.body.ids as string[]) {
      expect(id).toHaveLength(10);
    }
  });
});

// ── /api/generators/lorem ─────────────────────────────────────────────────────

describe('POST /api/generators/lorem', () => {
  it('returns lorem ipsum text', async () => {
    const res = await post('/api/generators/lorem', { paragraphs: 2 });
    expect(res.status).toBe(200);
    expect(typeof res.body.text).toBe('string');
    expect(res.body.text.length).toBeGreaterThan(0);
    expect(res.body.paragraphs).toBe(2);
  });
});

// ── /api/generators/random-string ────────────────────────────────────────────

describe('POST /api/generators/random-string', () => {
  it('returns a random string of default length 16', async () => {
    const res = await post('/api/generators/random-string', {});
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(16);
    expect(typeof res.body.value).toBe('string');
  });

  it('returns a string of requested length', async () => {
    const res = await post('/api/generators/random-string', { length: 64 });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(64);
  });
});
