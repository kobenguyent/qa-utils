/**
 * AI Chat Client Utilities
 * Supports OpenAI API and local LLM services like Ollama
 */

export type AIProvider = 'openai' | 'ollama';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatConfig {
  provider: AIProvider;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface ChatResponse {
  message: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Validates the chat configuration
 */
export function validateConfig(config: ChatConfig): { valid: boolean; error?: string } {
  if (!config.provider) {
    return { valid: false, error: 'Provider is required' };
  }

  if (config.provider === 'openai' && !config.apiKey) {
    return { valid: false, error: 'API key is required for OpenAI' };
  }

  if (config.provider === 'ollama' && !config.endpoint) {
    return { valid: false, error: 'Endpoint is required for Ollama' };
  }

  return { valid: true };
}

/**
 * Send a chat message to OpenAI API
 */
async function sendToOpenAI(
  messages: ChatMessage[],
  config: ChatConfig
): Promise<ChatResponse> {
  const apiKey = config.apiKey;
  const model = config.model || 'gpt-3.5-turbo';
  const endpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';

  const requestBody = {
    model,
    messages,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeout || DEFAULT_TIMEOUT
  );

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    return {
      message: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Send a chat message to Ollama
 */
async function sendToOllama(
  messages: ChatMessage[],
  config: ChatConfig
): Promise<ChatResponse> {
  const endpoint = config.endpoint || 'http://localhost:11434';
  const model = config.model || 'llama2';
  const url = `${endpoint}/api/chat`;

  const requestBody = {
    model,
    messages,
    stream: false,
    options: {
      temperature: config.temperature ?? 0.7,
      num_predict: config.maxTokens,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeout || DEFAULT_TIMEOUT
  );

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Ollama API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.message || !data.message.content) {
      throw new Error('No response from Ollama');
    }

    return {
      message: data.message.content,
      model: data.model,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Send a chat message using the specified provider
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  config: ChatConfig
): Promise<ChatResponse> {
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (messages.length === 0) {
    throw new Error('At least one message is required');
  }

  switch (config.provider) {
    case 'openai':
      return sendToOpenAI(messages, config);
    case 'ollama':
      return sendToOllama(messages, config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

/**
 * Test connection to the AI service
 */
export async function testConnection(config: ChatConfig): Promise<boolean> {
  try {
    const testMessage: ChatMessage = {
      role: 'user',
      content: 'Hello',
    };

    await sendChatMessage([testMessage], {
      ...config,
      maxTokens: 10,
      timeout: 10000,
    });

    return true;
  } catch (error) {
    return false;
  }
}
