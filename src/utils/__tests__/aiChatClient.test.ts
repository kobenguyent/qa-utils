import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateConfig,
  sendChatMessage,
  testConnection,
  ChatConfig,
  ChatMessage,
} from '../aiChatClient';

describe('aiChatClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateConfig', () => {
    it('should validate OpenAI config requires API key', () => {
      const config: ChatConfig = {
        provider: 'openai',
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('API key');
    });

    it('should validate OpenAI config with API key', () => {
      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate Ollama config requires endpoint', () => {
      const config: ChatConfig = {
        provider: 'ollama',
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Endpoint');
    });

    it('should validate Ollama config with endpoint', () => {
      const config: ChatConfig = {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should require provider', () => {
      const config = {} as ChatConfig;

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Provider');
    });
  });

  describe('sendChatMessage - OpenAI', () => {
    it('should send message to OpenAI successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello! How can I help you?',
            },
          },
        ],
        model: 'gpt-3.5-turbo',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
        model: 'gpt-3.5-turbo',
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const result = await sendChatMessage(messages, config);

      expect(result.message).toBe('Hello! How can I help you?');
      expect(result.model).toBe('gpt-3.5-turbo');
      expect(result.usage?.totalTokens).toBe(30);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer sk-test123',
          }),
        })
      );
    });

    it('should handle OpenAI API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: { message: 'Invalid API key' },
        }),
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'invalid-key',
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await expect(sendChatMessage(messages, config)).rejects.toThrow('Invalid API key');
    });

    it('should handle no response from OpenAI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await expect(sendChatMessage(messages, config)).rejects.toThrow('No response from OpenAI');
    });

    it('should use custom endpoint for OpenAI', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-3.5-turbo',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
        endpoint: 'https://custom.endpoint.com/v1/chat/completions',
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await sendChatMessage(messages, config);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.endpoint.com/v1/chat/completions',
        expect.any(Object)
      );
    });
  });

  describe('sendChatMessage - Ollama', () => {
    it('should send message to Ollama successfully', async () => {
      const mockResponse = {
        message: {
          content: 'Hello! How can I assist you?',
        },
        model: 'llama2',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const config: ChatConfig = {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        model: 'llama2',
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const result = await sendChatMessage(messages, config);

      expect(result.message).toBe('Hello! How can I assist you?');
      expect(result.model).toBe('llama2');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle Ollama API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: 'Model not found',
        }),
      });

      const config: ChatConfig = {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await expect(sendChatMessage(messages, config)).rejects.toThrow('Model not found');
    });

    it('should handle no response from Ollama', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const config: ChatConfig = {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await expect(sendChatMessage(messages, config)).rejects.toThrow('No response from Ollama');
    });

    it('should provide helpful CORS error message for Ollama fetch failures', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const config: ChatConfig = {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const error = await sendChatMessage(messages, config).catch(e => e);
      expect(error.message).toContain('CORS issue');
      expect(error.message).toContain('OLLAMA_ORIGINS');
    });
  });

  describe('sendChatMessage - validation', () => {
    it('should reject invalid config', async () => {
      const config: ChatConfig = {
        provider: 'openai',
        // Missing API key
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await expect(sendChatMessage(messages, config)).rejects.toThrow('API key');
    });

    it('should reject empty messages', async () => {
      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
      };

      await expect(sendChatMessage([], config)).rejects.toThrow('At least one message is required');
    });

    it('should reject unsupported provider', async () => {
      const config = {
        provider: 'unsupported',
        apiKey: 'test',
      } as unknown as ChatConfig;

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await expect(sendChatMessage(messages, config)).rejects.toThrow('Unsupported provider');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection test', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Hi' } }],
        model: 'gpt-3.5-turbo',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
      };

      const result = await testConnection(config);
      expect(result).toBe(true);
    });

    it('should return false for failed connection test', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
      };

      const result = await testConnection(config);
      expect(result).toBe(false);
    });
  });

  describe('configuration options', () => {
    it('should use custom temperature and maxTokens for OpenAI', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-3.5-turbo',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
        temperature: 0.5,
        maxTokens: 100,
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await sendChatMessage(messages, config);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.temperature).toBe(0.5);
      expect(requestBody.max_tokens).toBe(100);
    });

    it('should use custom temperature for Ollama', async () => {
      const mockResponse = {
        message: { content: 'Response' },
        model: 'llama2',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const config: ChatConfig = {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        temperature: 0.9,
      };

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      await sendChatMessage(messages, config);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.options.temperature).toBe(0.9);
    });
  });
});
