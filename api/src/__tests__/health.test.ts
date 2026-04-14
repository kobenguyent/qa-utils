import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app';

const app = createApp();

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('1.0.0');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('GET /openapi.json', () => {
  it('returns a valid OpenAPI 3.0 spec', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('QA Utils API');
    expect(Array.isArray(res.body.tags)).toBe(true);
  });
});

describe('GET /unknown-route', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/not-a-real-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
