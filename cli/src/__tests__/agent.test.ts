import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseActionBlock, runCliAgent } from '../lib/cliAgentExecutor.js';

// Mock aiClient
vi.mock('../lib/aiClient.js', () => ({
  sendChat: vi.fn(),
}));

import { sendChat } from '../lib/aiClient.js';
const mockSendChat = vi.mocked(sendChat);

describe('parseActionBlock', () => {
  it('parses a valid action block', () => {
    const text = 'Let me generate a UUID.\n\n```action\n{"tool": "generate_uuid", "params": {"quantity": 1}}\n```';
    expect(parseActionBlock(text)).toEqual({ tool: 'generate_uuid', params: { quantity: 1 } });
  });

  it('returns null when no action block', () => {
    expect(parseActionBlock('Here is your answer.')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseActionBlock('```action\n{bad json}\n```')).toBeNull();
  });

  it('returns null when tool property missing', () => {
    expect(parseActionBlock('```action\n{"params": {}}\n```')).toBeNull();
  });

  it('defaults to empty params when params absent', () => {
    const result = parseActionBlock('```action\n{"tool": "current_timestamp"}\n```');
    expect(result).toEqual({ tool: 'current_timestamp', params: {} });
  });
});

describe('runCliAgent', () => {
  const config = { provider: 'ollama' as const, endpoint: 'http://localhost:11434', model: 'llama2' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success when AI gives direct answer', async () => {
    mockSendChat.mockResolvedValueOnce({ message: 'The answer is 42.', model: 'llama2' });

    const result = await runCliAgent('What is the answer?', config);
    expect(result.success).toBe(true);
    expect(result.answer).toBe('The answer is 42.');
    expect(result.iterationCount).toBe(1);
  });

  it('calls a tool and returns final answer', async () => {
    mockSendChat
      .mockResolvedValueOnce({ message: 'I will generate a UUID.\n\n```action\n{"tool": "generate_uuid", "params": {"quantity": 1}}\n```', model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Here is your UUID.', model: 'llama2' });

    const result = await runCliAgent('Generate a UUID', config);
    expect(result.success).toBe(true);
    expect(result.steps.some(s => s.type === 'tool_call')).toBe(true);
    expect(result.steps.some(s => s.type === 'tool_result')).toBe(true);
  });

  it('records step callback calls', async () => {
    mockSendChat.mockResolvedValueOnce({ message: 'Done.', model: 'llama2' });
    const steps: string[] = [];
    await runCliAgent('test', config, (step) => steps.push(step.type));
    expect(steps).toContain('answer');
  });

  it('handles unknown tool gracefully', async () => {
    mockSendChat
      .mockResolvedValueOnce({ message: 'Calling it.\n\n```action\n{"tool": "nonexistent_tool", "params": {}}\n```', model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Could not complete.', model: 'llama2' });

    const result = await runCliAgent('test', config);
    const toolResultStep = result.steps.find(s => s.type === 'tool_result');
    expect(toolResultStep?.content).toContain('Unknown tool');
  });

  it('returns error step on AI failure', async () => {
    mockSendChat.mockRejectedValueOnce(new Error('Network error'));

    const result = await runCliAgent('test', config);
    expect(result.success).toBe(false);
    expect(result.steps[0].type).toBe('error');
    expect(result.steps[0].content).toContain('Network error');
  });

  it('stops at max iterations', async () => {
    // Always return a tool call to force iterations
    mockSendChat.mockResolvedValue({
      message: '```action\n{"tool": "generate_uuid", "params": {}}\n```',
      model: 'llama2',
    });

    const result = await runCliAgent('generate forever', { ...config, maxIterations: 2 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Max iterations reached');
    expect(result.iterationCount).toBe(2);
  });
});
