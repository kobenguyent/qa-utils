import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseActionBlock, buildToolDescriptions, runAgent, AgentStep } from '../agentExecutor';

// Mock the aiChatClient module
vi.mock('../aiChatClient', () => ({
  sendChatMessage: vi.fn(),
}));

import { sendChatMessage } from '../aiChatClient';
const mockSendChat = vi.mocked(sendChatMessage);

describe('agentExecutor', () => {
  describe('parseActionBlock', () => {
    it('should parse a valid fenced action block', () => {
      const text = `Let me generate a UUID.\n\n\`\`\`action\n{"tool": "uuid-generator", "params": {"quantity": 1}}\n\`\`\``;
      const result = parseActionBlock(text);
      expect(result).toEqual({
        tool: 'uuid-generator',
        params: { quantity: 1 },
      });
    });

    it('should return null when no action block is present', () => {
      const text = 'Here is your final answer: The UUID is abc-123.';
      expect(parseActionBlock(text)).toBeNull();
    });

    it('should return null for malformed JSON in action block', () => {
      const text = '```action\n{invalid json}\n```';
      expect(parseActionBlock(text)).toBeNull();
    });

    it('should return null when action block lacks tool property', () => {
      const text = '```action\n{"params": {"value": "hello"}}\n```';
      expect(parseActionBlock(text)).toBeNull();
    });

    it('should handle action block with no params', () => {
      const text = '```action\n{"tool": "uuid-generator"}\n```';
      const result = parseActionBlock(text);
      expect(result).toEqual({ tool: 'uuid-generator', params: {} });
    });

    it('should parse action block with surrounding text', () => {
      const text = `I'll generate a UUID for you.\n\n\`\`\`action\n{"tool": "uuid-generator", "params": {"quantity": 3}}\n\`\`\`\n\nThis will create 3 UUIDs.`;
      const result = parseActionBlock(text);
      expect(result).toEqual({
        tool: 'uuid-generator',
        params: { quantity: 3 },
      });
    });
  });

  describe('buildToolDescriptions', () => {
    it('should return a non-empty string with tool descriptions', () => {
      const descriptions = buildToolDescriptions();
      expect(descriptions).toBeTruthy();
      expect(typeof descriptions).toBe('string');
    });

    it('should include executable tools', () => {
      const descriptions = buildToolDescriptions();
      // uuid-generator is an executable tool
      expect(descriptions).toContain('uuid-generator');
    });

    it('should not include navigable-only tools', () => {
      const descriptions = buildToolDescriptions();
      // jwt-debugger is navigable only (no execute function)
      expect(descriptions).not.toContain('### jwt-debugger');
    });
  });

  describe('runAgent', () => {
    const baseConfig = {
      provider: 'ollama' as const,
      endpoint: 'http://localhost:11434',
      model: 'test-model',
      maxIterations: 5,
    };

    beforeEach(() => {
      mockSendChat.mockReset();
    });

    it('should return a final answer when AI responds without action block', async () => {
      mockSendChat.mockResolvedValueOnce({
        message: 'The answer is 42.',
        model: 'test-model',
      });

      const result = await runAgent('What is the answer?', baseConfig);
      expect(result.success).toBe(true);
      expect(result.answer).toBe('The answer is 42.');
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].type).toBe('answer');
      expect(result.iterationCount).toBe(1);
    });

    it('should execute a tool when AI responds with action block', async () => {
      // First response: AI calls a tool
      mockSendChat.mockResolvedValueOnce({
        message: 'Let me generate a UUID.\n\n```action\n{"tool": "uuid-generator", "params": {"quantity": 1}}\n```',
        model: 'test-model',
      });
      // Second response: AI gives final answer
      mockSendChat.mockResolvedValueOnce({
        message: 'Here is your UUID: <uuid>',
        model: 'test-model',
      });

      const steps: AgentStep[] = [];
      const result = await runAgent('Generate a UUID', baseConfig, (step) => {
        steps.push(step);
      });

      expect(result.success).toBe(true);
      expect(result.iterationCount).toBe(2);

      // Should have: thinking + tool_call + tool_result + answer
      const toolCalls = steps.filter(s => s.type === 'tool_call');
      const toolResults = steps.filter(s => s.type === 'tool_result');
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].toolName).toBe('uuid-generator');
      expect(toolResults).toHaveLength(1);
      expect(toolResults[0].toolResult?.success).toBe(true);
    });

    it('should handle AI request failure gracefully', async () => {
      mockSendChat.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await runAgent('Do something', baseConfig);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection refused');
      expect(result.steps.some(s => s.type === 'error')).toBe(true);
    });

    it('should respect maxIterations', async () => {
      // AI always responds with action block (never finishes)
      mockSendChat.mockResolvedValue({
        message: '```action\n{"tool": "uuid-generator", "params": {"quantity": 1}}\n```',
        model: 'test-model',
      });

      const config = { ...baseConfig, maxIterations: 2 };
      const result = await runAgent('Infinite loop task', config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Max iterations reached');
      expect(result.iterationCount).toBe(2);
    });

    it('should call onStep callback for each step', async () => {
      mockSendChat.mockResolvedValueOnce({
        message: 'Here is your answer.',
        model: 'test-model',
      });

      const onStep = vi.fn();
      await runAgent('Simple question', baseConfig, onStep);

      expect(onStep).toHaveBeenCalledTimes(1);
      expect(onStep).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'answer' }),
      );
    });

    it('should handle tool execution errors', async () => {
      // AI calls a non-existent tool
      mockSendChat.mockResolvedValueOnce({
        message: '```action\n{"tool": "nonexistent-tool", "params": {}}\n```',
        model: 'test-model',
      });
      // AI gives final answer after error
      mockSendChat.mockResolvedValueOnce({
        message: 'The tool failed, sorry.',
        model: 'test-model',
      });

      const steps: AgentStep[] = [];
      const result = await runAgent('Use fake tool', baseConfig, (step) => {
        steps.push(step);
      });

      expect(result.success).toBe(true);
      const toolResults = steps.filter(s => s.type === 'tool_result');
      expect(toolResults).toHaveLength(1);
      expect(toolResults[0].content).toContain('Error');
    });
  });
});
