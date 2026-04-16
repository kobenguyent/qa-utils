import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../app';

// Mock the agentExecutor to avoid real AI calls
vi.mock('../lib/agentExecutor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/agentExecutor')>();
  return {
    ...actual,
    runApiAgent: vi.fn(),
  };
});

import { runApiAgent } from '../lib/agentExecutor';
const mockRunAgent = vi.mocked(runApiAgent);

const app = createApp();
const get = (path: string) => request(app).get(path);
const post = (path: string, body: unknown) =>
  request(app).post(path).send(body).set('Content-Type', 'application/json');

describe('GET /api/agents/tools', () => {
  it('returns a list of agent tools', async () => {
    const res = await get('/api/agents/tools');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tools)).toBe(true);
    expect(res.body.tools.length).toBeGreaterThan(0);
    expect(res.body.count).toBe(res.body.tools.length);
  });

  it('each tool has id, description, params', async () => {
    const res = await get('/api/agents/tools');
    const tool = res.body.tools[0];
    expect(tool).toHaveProperty('id');
    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('params');
  });

  it('includes expected built-in tools', async () => {
    const res = await get('/api/agents/tools');
    const ids = res.body.tools.map((t: { id: string }) => t.id);
    expect(ids).toContain('generate_uuid');
    expect(ids).toContain('base64_encode');
    expect(ids).toContain('hash_text');
  });
});

describe('POST /api/agents/run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when task is missing', async () => {
    const res = await post('/api/agents/run', { provider: 'ollama' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when provider is missing', async () => {
    const res = await post('/api/agents/run', { task: 'test task' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for unknown provider', async () => {
    const res = await post('/api/agents/run', { task: 'test', provider: 'unknown-provider' });
    expect(res.status).toBe(400);
  });

  it('returns agent result on success', async () => {
    mockRunAgent.mockResolvedValueOnce({
      success: true,
      answer: 'Generated: abc-123',
      steps: [{ id: 's1', type: 'answer', content: 'Generated: abc-123', timestamp: Date.now() }],
      iterationCount: 1,
    });

    const res = await post('/api/agents/run', {
      task: 'Generate a UUID',
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.answer).toBe('Generated: abc-123');
    expect(Array.isArray(res.body.steps)).toBe(true);
  });

  it('returns 500 when runApiAgent throws', async () => {
    mockRunAgent.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await post('/api/agents/run', {
      task: 'do something',
      provider: 'ollama',
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Connection refused');
  });

  it('passes maxIterations and temperature to agent', async () => {
    mockRunAgent.mockResolvedValueOnce({ success: true, answer: 'ok', steps: [], iterationCount: 2 });

    await post('/api/agents/run', {
      task: 'test',
      provider: 'openai',
      apiKey: 'sk-test',
      maxIterations: 5,
      temperature: 0.5,
    });

    expect(mockRunAgent).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({ maxIterations: 5, temperature: 0.5 }),
    );
  });
});
