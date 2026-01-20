import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateConfig,
  sendChatMessage,
  testConnection,
  getDefaultModel,
  getAllDefaultModels,
  fetchOpenAIModels,
  fetchOllamaModels,
  fetchAnthropicModels,
  fetchGoogleModels,
  fetchModels,
  estimateTokenCount,
  optimizeMessages,
  getSystemPrompt,
  enhanceMessagesWithSystemPrompt,
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

    it('should return true for 2xx response even with unexpected format', async () => {
      // Simulate a 2xx response but with unexpected/empty body
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
      };

      const result = await testConnection(config);
      expect(result).toBe(true);
    });

    it('should return false for 4xx response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'invalid-key',
      };

      const result = await testConnection(config);
      expect(result).toBe(false);
    });

    it('should return false for 5xx response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      const config: ChatConfig = {
        provider: 'openai',
        apiKey: 'sk-test123',
      };

      const result = await testConnection(config);
      expect(result).toBe(false);
    });

    it('should return false for invalid config', async () => {
      const config: ChatConfig = {
        provider: 'openai',
        // Missing API key
      };

      const result = await testConnection(config);
      expect(result).toBe(false);
    });

    it('should test connection for Ollama provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'test' }, model: 'llama2' }),
      });

      const config: ChatConfig = {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
      };

      const result = await testConnection(config);
      expect(result).toBe(true);
    });

    it('should test connection for Anthropic provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ text: 'test' }], model: 'claude-3' }),
      });

      const config: ChatConfig = {
        provider: 'anthropic',
        apiKey: 'sk-ant-test',
      };

      const result = await testConnection(config);
      expect(result).toBe(true);
    });

    it('should test connection for Google provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'test' }] } }] }),
      });

      const config: ChatConfig = {
        provider: 'google',
        apiKey: 'test-api-key',
      };

      const result = await testConnection(config);
      expect(result).toBe(true);
    });

    it('should test connection for Azure OpenAI provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'test' } }], model: 'gpt-35-turbo' }),
      });

      const config: ChatConfig = {
        provider: 'azure-openai',
        apiKey: 'test-key',
        endpoint: 'https://test.openai.azure.com',
      };

      const result = await testConnection(config);
      expect(result).toBe(true);
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

  describe('Model Management', () => {
    it('should get default model for OpenAI', () => {
      const model = getDefaultModel('openai');
      expect(model.provider).toBe('openai');
      expect(model.id).toBe('gpt-3.5-turbo');
      expect(model.isDefault).toBe(true);
    });

    it('should get default model for Ollama', () => {
      const model = getDefaultModel('ollama');
      expect(model.provider).toBe('ollama');
      expect(model.id).toBe('llama2');
      expect(model.isDefault).toBe(true);
    });

    it('should get all default models', () => {
      const models = getAllDefaultModels();
      expect(models.length).toBe(5);
      expect(models.some(m => m.provider === 'openai')).toBe(true);
      expect(models.some(m => m.provider === 'anthropic')).toBe(true);
      expect(models.some(m => m.provider === 'google')).toBe(true);
      expect(models.some(m => m.provider === 'azure-openai')).toBe(true);
      expect(models.some(m => m.provider === 'ollama')).toBe(true);
    });

    it('should fetch OpenAI models', async () => {
      const mockModels = {
        data: [
          { id: 'gpt-3.5-turbo' },
          { id: 'gpt-4' },
          { id: 'whisper-1' }, // Should be filtered out
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModels,
      });

      const models = await fetchOpenAIModels('sk-test123');
      expect(models.length).toBe(2);
      expect(models.every(m => m.id.includes('gpt'))).toBe(true);
    });

    it('should return default model when OpenAI fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const models = await fetchOpenAIModels('sk-test123');
      expect(models.length).toBe(1);
      expect(models[0].id).toBe('gpt-3.5-turbo');
    });

    it('should fetch Ollama models', async () => {
      const mockModels = {
        models: [
          { name: 'llama2' },
          { name: 'mistral' },
          { name: 'codellama' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModels,
      });

      const models = await fetchOllamaModels('http://localhost:11434');
      expect(models.length).toBe(3);
      expect(models[0].provider).toBe('ollama');
    });

    it('should return default model when Ollama fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const models = await fetchOllamaModels('http://localhost:11434');
      expect(models.length).toBe(1);
      expect(models[0].id).toBe('llama2');
    });

    it('should fetch Anthropic models', async () => {
      const models = await fetchAnthropicModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models.every(m => m.provider === 'anthropic')).toBe(true);
      expect(models.some(m => m.id.includes('claude'))).toBe(true);
    });

    it('should fetch Google models without API key (returns defaults)', async () => {
      const models = await fetchGoogleModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models.every(m => m.provider === 'google')).toBe(true);
      expect(models.some(m => m.id.includes('gemini'))).toBe(true);
    });

    it('should fetch Google models from API with valid API key', async () => {
      const mockModelsResponse = {
        models: [
          {
            name: 'models/gemini-1.5-flash',
            displayName: 'Gemini 1.5 Flash',
            supportedGenerationMethods: ['generateContent'],
            inputTokenLimit: 1048576,
          },
          {
            name: 'models/gemini-1.5-pro',
            displayName: 'Gemini 1.5 Pro',
            supportedGenerationMethods: ['generateContent'],
            inputTokenLimit: 2097152,
          },
          {
            name: 'models/gemini-pro',
            displayName: 'Gemini Pro',
            supportedGenerationMethods: ['generateContent'],
            inputTokenLimit: 32768,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsResponse,
      });

      const models = await fetchGoogleModels('test-api-key');
      expect(models.length).toBe(3);
      expect(models[0].id).toBe('gemini-1.5-flash');
      expect(models[0].name).toBe('Gemini 1.5 Flash');
      expect(models[0].contextWindow).toBe(1048576);
      expect(models[0].isDefault).toBe(true);
      expect(models[1].id).toBe('gemini-1.5-pro');
      expect(models[2].id).toBe('gemini-pro');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models?key=test-api-key',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should filter out non-generateContent models from Google API', async () => {
      const mockModelsResponse = {
        models: [
          {
            name: 'models/gemini-1.5-flash',
            displayName: 'Gemini 1.5 Flash',
            supportedGenerationMethods: ['generateContent'],
            inputTokenLimit: 1048576,
          },
          {
            name: 'models/embedding-001',
            displayName: 'Embedding Model',
            supportedGenerationMethods: ['embedContent'],
            inputTokenLimit: 2048,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsResponse,
      });

      const models = await fetchGoogleModels('test-api-key');
      expect(models.length).toBe(1);
      expect(models[0].id).toBe('gemini-1.5-flash');
    });

    it('should return default models when Google API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const models = await fetchGoogleModels('test-api-key');
      expect(models.length).toBeGreaterThan(0);
      expect(models.every(m => m.provider === 'google')).toBe(true);
      expect(models.some(m => m.id === 'gemini-1.5-flash')).toBe(true);
    });

    it('should return default models when Google API returns invalid data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      });

      const models = await fetchGoogleModels('test-api-key');
      expect(models.length).toBeGreaterThan(0);
      expect(models.some(m => m.id === 'gemini-1.5-flash')).toBe(true);
    });

    it('should return default models when Google API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const models = await fetchGoogleModels('invalid-api-key');
      expect(models.length).toBeGreaterThan(0);
      expect(models.some(m => m.id === 'gemini-1.5-flash')).toBe(true);
    });

    describe('fetchModels integration', () => {
      it('should fetch OpenAI models with API key', async () => {
        const mockModels = {
          data: [
            { id: 'gpt-3.5-turbo' },
            { id: 'gpt-4' },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockModels,
        });

        const models = await fetchModels('openai', { apiKey: 'sk-test123' });
        expect(models.length).toBe(2);
        expect(models.every(m => m.provider === 'openai')).toBe(true);
      });

      it('should return default model for OpenAI without API key', async () => {
        const models = await fetchModels('openai', {});
        expect(models.length).toBe(1);
        expect(models[0].id).toBe('gpt-3.5-turbo');
        expect(models[0].provider).toBe('openai');
      });

      it('should fetch Anthropic models (predefined list)', async () => {
        const models = await fetchModels('anthropic', {});
        expect(models.length).toBeGreaterThan(0);
        expect(models.every(m => m.provider === 'anthropic')).toBe(true);
        expect(models.some(m => m.id.includes('claude'))).toBe(true);
      });

      it('should fetch Google models with API key', async () => {
        const mockModelsResponse = {
          models: [
            {
              name: 'models/gemini-pro',
              displayName: 'Gemini Pro',
              supportedGenerationMethods: ['generateContent'],
              inputTokenLimit: 32768,
            },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockModelsResponse,
        });

        const models = await fetchModels('google', { apiKey: 'test-api-key' });
        expect(models.length).toBe(1);
        expect(models[0].provider).toBe('google');
        expect(models[0].id).toBe('gemini-pro');
      });

      it('should return default models for Google without API key', async () => {
        const models = await fetchModels('google', {});
        expect(models.length).toBeGreaterThan(0);
        expect(models.every(m => m.provider === 'google')).toBe(true);
        expect(models.some(m => m.id === 'gemini-1.5-flash')).toBe(true);
      });

      it('should return default model for Azure OpenAI', async () => {
        const models = await fetchModels('azure-openai', { apiKey: 'test-key', endpoint: 'https://test.openai.azure.com' });
        expect(models.length).toBe(1);
        expect(models[0].provider).toBe('azure-openai');
        expect(models[0].id).toBe('gpt-35-turbo');
      });

      it('should fetch Ollama models with endpoint', async () => {
        const mockModels = {
          models: [
            { name: 'llama2' },
            { name: 'mistral' },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockModels,
        });

        const models = await fetchModels('ollama', { endpoint: 'http://localhost:11434' });
        expect(models.length).toBe(2);
        expect(models.every(m => m.provider === 'ollama')).toBe(true);
      });

      it('should return default model for Ollama without endpoint', async () => {
        const models = await fetchModels('ollama', {});
        expect(models.length).toBe(1);
        expect(models[0].id).toBe('llama2');
        expect(models[0].provider).toBe('ollama');
      });
    });
  });

  describe('Token Optimization', () => {
    it('should estimate token count', () => {
      const text = 'Hello world, this is a test message.';
      const count = estimateTokenCount(text);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(text.length);
    });

    it('should optimize messages by removing extra whitespace', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello    world   with    extra   spaces' },
        { role: 'assistant', content: 'Line1\n\n\n\nLine2\n\n\n\nLine3' },
      ];

      const optimized = optimizeMessages(messages);
      expect(optimized[0].content).toBe('Hello world with extra spaces');
      // Multiple newlines replaced with double newline, then all whitespace normalized
      expect(optimized[1].content).not.toContain('\n\n\n');
      expect(optimized[1].content.length).toBeLessThan(messages[1].content.length);
    });

    it('should not modify messages with normal spacing', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Normal message' },
        { role: 'assistant', content: 'Normal response' },
      ];

      const optimized = optimizeMessages(messages);
      expect(optimized[0].content).toBe('Normal message');
      expect(optimized[1].content).toBe('Normal response');
    });
  });

  describe('System Prompts', () => {
    it('should get default system prompt', () => {
      const prompt = getSystemPrompt('default');
      expect(prompt).toContain('helpful');
      expect(prompt).toContain('accurate');
    });

    it('should get technical system prompt', () => {
      const prompt = getSystemPrompt('technical');
      expect(prompt).toContain('technical');
      expect(prompt).toContain('code examples');
    });

    it('should get creative system prompt', () => {
      const prompt = getSystemPrompt('creative');
      expect(prompt).toContain('creative');
      expect(prompt).toContain('innovative');
    });

    it('should use custom system prompt', () => {
      const custom = 'Custom prompt';
      const prompt = getSystemPrompt('default', custom);
      expect(prompt).toBe(custom);
    });

    it('should enhance messages with system prompt', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const enhanced = enhanceMessagesWithSystemPrompt(messages, 'System instruction');
      expect(enhanced.length).toBe(2);
      expect(enhanced[0].role).toBe('system');
      expect(enhanced[0].content).toBe('System instruction');
      expect(enhanced[1].role).toBe('user');
    });

    it('should not add system prompt if already present', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'Existing system' },
        { role: 'user', content: 'Hello' },
      ];

      const enhanced = enhanceMessagesWithSystemPrompt(messages, 'New system instruction');
      expect(enhanced.length).toBe(2);
      expect(enhanced[0].content).toBe('Existing system');
    });

    it('should not modify messages if no system prompt provided', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const enhanced = enhanceMessagesWithSystemPrompt(messages);
      expect(enhanced.length).toBe(1);
      expect(enhanced[0].role).toBe('user');
    });
  });
});
