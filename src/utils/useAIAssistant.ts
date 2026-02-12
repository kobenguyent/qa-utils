/**
 * useAIAssistant - A shared React hook for AI provider connectivity
 * 
 * Reads AI configuration from sessionStorage (same keys as KobeanAssistant)
 * and provides a simple interface for utilities to send AI-powered requests.
 */

import { useState, useCallback } from 'react';
import { sendChatMessage, ChatMessage, ChatConfig, AIProvider, validateConfig } from './aiChatClient';

export interface AIAssistantState {
  /** Whether AI provider is properly configured */
  isConfigured: boolean;
  /** Whether an AI request is currently in progress */
  isLoading: boolean;
  /** Error message from the last AI request, if any */
  error: string;
  /** The AI response from the last request */
  result: string;
  /** Send an AI request with a system prompt and user prompt */
  sendRequest: (systemPrompt: string, userPrompt: string) => Promise<string>;
  /** Clear the current result and error */
  clear: () => void;
  /** The configured AI provider name */
  providerName: string;
}

/**
 * Read AI chat config from sessionStorage
 * Uses the same keys as KobeanAssistant for consistency
 */
export function getAIConfig(): ChatConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const providerRaw = window.sessionStorage.getItem('aiChat_provider');
    const apiKeyRaw = window.sessionStorage.getItem('aiChat_apiKey');
    const endpointRaw = window.sessionStorage.getItem('aiChat_endpoint');
    const modelRaw = window.sessionStorage.getItem('aiChat_model');
    const temperatureRaw = window.sessionStorage.getItem('aiChat_temperature');

    const provider: AIProvider | null = providerRaw ? JSON.parse(providerRaw) : null;
    if (!provider) return null;

    const apiKey: string = apiKeyRaw ? JSON.parse(apiKeyRaw) : '';
    const endpoint: string = endpointRaw ? JSON.parse(endpointRaw) : '';
    const model: string = modelRaw ? JSON.parse(modelRaw) : '';
    const temperature: number = temperatureRaw ? JSON.parse(temperatureRaw) : 0.7;

    const config: ChatConfig = {
      provider,
      apiKey: apiKey || undefined,
      endpoint: endpoint || undefined,
      model: model || undefined,
      temperature,
      maxTokens: 2048,
      timeout: 60000,
    };

    const validation = validateConfig(config);
    if (!validation.valid) return null;

    return config;
  } catch {
    return null;
  }
}

/**
 * Hook that provides AI assistant capabilities to any utility component.
 * Reads config from sessionStorage and provides a sendRequest function.
 */
export function useAIAssistant(): AIAssistantState {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const config = getAIConfig();

  const isConfigured = config !== null;
  const providerName = config?.provider || '';

  const sendRequest = useCallback(async (systemPrompt: string, userPrompt: string): Promise<string> => {
    // Re-read config at request time to get latest values
    const currentConfig = getAIConfig();
    if (!currentConfig) {
      const errMsg = 'AI provider is not configured. Please configure it in the AI Chat settings.';
      setError(errMsg);
      throw new Error(errMsg);
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await sendChatMessage(messages, currentConfig);
      const responseText = response.message.trim();
      setResult(responseText);
      return responseText;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'AI request failed';
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult('');
    setError('');
  }, []);

  return {
    isConfigured,
    isLoading,
    error,
    result,
    sendRequest,
    clear,
    providerName,
  };
}
