import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIAssistant, getAIConfig } from '../../utils/useAIAssistant';

// Mock sendChatMessage
vi.mock('../../utils/aiChatClient', () => ({
  sendChatMessage: vi.fn(),
  validateConfig: vi.fn((config) => {
    if (!config.provider) return { valid: false, error: 'Provider is required' };
    if (['openai', 'anthropic', 'google', 'azure-openai'].includes(config.provider) && !config.apiKey) {
      return { valid: false, error: 'API key is required' };
    }
    if (config.provider === 'ollama' && !config.endpoint) {
      return { valid: false, error: 'Endpoint required for Ollama' };
    }
    return { valid: true };
  }),
}));

import { sendChatMessage } from '../../utils/aiChatClient';

const mockedSendChatMessage = vi.mocked(sendChatMessage);

describe('getAIConfig', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null when no AI config is in sessionStorage', () => {
    const config = getAIConfig();
    expect(config).toBeNull();
  });

  it('returns null when only provider is set without api key', () => {
    sessionStorage.setItem('aiChat_provider', JSON.stringify('openai'));
    const config = getAIConfig();
    expect(config).toBeNull();
  });

  it('returns config when provider and api key are set', () => {
    sessionStorage.setItem('aiChat_provider', JSON.stringify('openai'));
    sessionStorage.setItem('aiChat_apiKey', JSON.stringify('test-key'));
    const config = getAIConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('openai');
    expect(config?.apiKey).toBe('test-key');
  });

  it('returns config for ollama with endpoint', () => {
    sessionStorage.setItem('aiChat_provider', JSON.stringify('ollama'));
    sessionStorage.setItem('aiChat_endpoint', JSON.stringify('http://localhost:11434'));
    const config = getAIConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('ollama');
    expect(config?.endpoint).toBe('http://localhost:11434');
  });

  it('parses model and temperature from sessionStorage', () => {
    sessionStorage.setItem('aiChat_provider', JSON.stringify('openai'));
    sessionStorage.setItem('aiChat_apiKey', JSON.stringify('test-key'));
    sessionStorage.setItem('aiChat_model', JSON.stringify('gpt-4'));
    sessionStorage.setItem('aiChat_temperature', JSON.stringify(0.5));
    const config = getAIConfig();
    expect(config?.model).toBe('gpt-4');
    expect(config?.temperature).toBe(0.5);
  });

  it('returns null for invalid JSON in sessionStorage', () => {
    sessionStorage.setItem('aiChat_provider', 'not-valid-json{');
    const config = getAIConfig();
    expect(config).toBeNull();
  });
});

describe('useAIAssistant', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('returns isConfigured false when no config', () => {
    const { result } = renderHook(() => useAIAssistant());
    expect(result.current.isConfigured).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.result).toBe('');
  });

  it('returns isConfigured true when AI is configured', () => {
    sessionStorage.setItem('aiChat_provider', JSON.stringify('openai'));
    sessionStorage.setItem('aiChat_apiKey', JSON.stringify('test-key'));
    const { result } = renderHook(() => useAIAssistant());
    expect(result.current.isConfigured).toBe(true);
    expect(result.current.providerName).toBe('openai');
  });

  it('sendRequest succeeds and sets result', async () => {
    sessionStorage.setItem('aiChat_provider', JSON.stringify('openai'));
    sessionStorage.setItem('aiChat_apiKey', JSON.stringify('test-key'));

    mockedSendChatMessage.mockResolvedValueOnce({
      message: '  AI response text  ',
      model: 'gpt-4',
    });

    const { result } = renderHook(() => useAIAssistant());

    let response = '';
    await act(async () => {
      response = await result.current.sendRequest('system prompt', 'user prompt');
    });

    expect(response).toBe('AI response text');
    expect(result.current.result).toBe('AI response text');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('');

    expect(mockedSendChatMessage).toHaveBeenCalledWith(
      [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'user prompt' },
      ],
      expect.objectContaining({ provider: 'openai', apiKey: 'test-key' })
    );
  });

  it('sendRequest handles errors', async () => {
    sessionStorage.setItem('aiChat_provider', JSON.stringify('openai'));
    sessionStorage.setItem('aiChat_apiKey', JSON.stringify('test-key'));

    mockedSendChatMessage.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useAIAssistant());

    await act(async () => {
      try {
        await result.current.sendRequest('system', 'user');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toBe('');
  });

  it('sendRequest fails when config is not set', async () => {
    const { result } = renderHook(() => useAIAssistant());

    await act(async () => {
      try {
        await result.current.sendRequest('system', 'user');
      } catch (err) {
        expect((err as Error).message).toContain('not configured');
      }
    });

    expect(result.current.error).toContain('not configured');
  });

  it('clear resets result and error', async () => {
    sessionStorage.setItem('aiChat_provider', JSON.stringify('openai'));
    sessionStorage.setItem('aiChat_apiKey', JSON.stringify('test-key'));

    mockedSendChatMessage.mockResolvedValueOnce({
      message: 'response',
      model: 'gpt-4',
    });

    const { result } = renderHook(() => useAIAssistant());

    await act(async () => {
      await result.current.sendRequest('system', 'user');
    });
    expect(result.current.result).toBe('response');

    act(() => {
      result.current.clear();
    });
    expect(result.current.result).toBe('');
    expect(result.current.error).toBe('');
  });
});
