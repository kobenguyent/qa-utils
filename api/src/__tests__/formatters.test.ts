import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app';

const app = createApp();
const post = (path: string, body: unknown) =>
  request(app).post(path).send(body).set('Content-Type', 'application/json');

// ── json ──────────────────────────────────────────────────────────────────────

describe('POST /api/formatters/json', () => {
  it('formats valid JSON', async () => {
    const res = await post('/api/formatters/json', { input: '{"a":1,"b":2}' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.formatted).toContain('"a": 1');
  });

  it('reports invalid JSON without throwing', async () => {
    const res = await post('/api/formatters/json', { input: '{bad json}' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });

  it('respects custom indent', async () => {
    const res = await post('/api/formatters/json', { input: '{"x":1}', indent: 4 });
    expect(res.status).toBe(200);
    expect(res.body.formatted).toContain('    "x"');
  });

  it('rejects missing input', async () => {
    const res = await post('/api/formatters/json', {});
    expect(res.status).toBe(400);
  });
});

// ── html-sanitize ─────────────────────────────────────────────────────────────

describe('POST /api/formatters/html-sanitize', () => {
  it('removes script tags', async () => {
    const res = await post('/api/formatters/html-sanitize', {
      html: '<p>Hello</p><script>alert(1)</script>',
    });
    expect(res.status).toBe(200);
    expect(res.body.sanitized).toBe('<p>Hello</p>');
  });

  it('removes inline event handlers', async () => {
    const res = await post('/api/formatters/html-sanitize', {
      html: '<p onclick="alert(1)">Hello</p>',
    });
    expect(res.status).toBe(200);
    expect(res.body.sanitized).toBe('<p>Hello</p>');
  });

  it('rejects missing html field', async () => {
    const res = await post('/api/formatters/html-sanitize', {});
    expect(res.status).toBe(400);
  });
});

// ── sql ───────────────────────────────────────────────────────────────────────

describe('POST /api/formatters/sql', () => {
  it('generates a SELECT statement', async () => {
    const res = await post('/api/formatters/sql', {
      operation: 'SELECT',
      tableName: 'users',
      columns: ['id', 'name'],
      whereClause: 'id = 1',
      limit: 10,
    });
    expect(res.status).toBe(200);
    expect(res.body.sql).toBe('SELECT id, name FROM users WHERE id = 1 LIMIT 10;');
  });

  it('generates an INSERT statement', async () => {
    const res = await post('/api/formatters/sql', {
      operation: 'INSERT',
      tableName: 'users',
      columns: ['name', 'email'],
      values: ['Alice', 'alice@example.com'],
    });
    expect(res.status).toBe(200);
    expect(res.body.sql).toContain("INSERT INTO users");
    expect(res.body.sql).toContain("'Alice'");
  });

  it('generates a CREATE TABLE statement', async () => {
    const res = await post('/api/formatters/sql', {
      operation: 'CREATE_TABLE',
      tableName: 'products',
      columns: ['id', 'name', 'price'],
    });
    expect(res.status).toBe(200);
    expect(res.body.sql).toContain('CREATE TABLE products');
    expect(res.body.sql).toContain('id TEXT');
  });

  it('rejects missing tableName', async () => {
    const res = await post('/api/formatters/sql', { operation: 'SELECT' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid operation', async () => {
    const res = await post('/api/formatters/sql', { operation: 'DROP', tableName: 'users' });
    expect(res.status).toBe(400);
  });
});
