/**
 * AI Chat Client Utilities
 * Supports multiple AI providers: OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI, and Ollama
 * Enhanced with knowledge management, token optimization, and prompt guidance
 */

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'azure-openai' | 'ollama';

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
  contextWindow?: number; // Support for large context windows
  azureApiVersion?: string; // For Azure OpenAI
  optimizeTokens?: boolean; // Enable token optimization
  systemPrompt?: string; // Custom system prompt for guidance
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

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  provider: AIProvider;
  isDefault?: boolean;
}

// Google Gemini API response types
interface GeminiModel {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
  inputTokenLimit?: number;
}

interface GeminiModelsResponse {
  models?: GeminiModel[];
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Default models configuration
const DEFAULT_MODELS: Record<AIProvider, ModelInfo> = {
  openai: {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    contextWindow: 4096,
    provider: 'openai',
    isDefault: true,
  },
  anthropic: {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    contextWindow: 200000,
    provider: 'anthropic',
    isDefault: true,
  },
  google: {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    contextWindow: 32768,
    provider: 'google',
    isDefault: true,
  },
  'azure-openai': {
    id: 'gpt-35-turbo',
    name: 'GPT-3.5 Turbo (Azure)',
    contextWindow: 4096,
    provider: 'azure-openai',
    isDefault: true,
  },
  ollama: {
    id: 'llama2',
    name: 'Llama 2',
    contextWindow: 4096,
    provider: 'ollama',
    isDefault: true,
  },
};

// System prompts for better AI responses
const SYSTEM_PROMPTS = {
  default: `You are a helpful, accurate, and concise AI assistant. Follow these guidelines:
- Provide clear, well-structured responses
- Use examples when helpful
- Be precise and avoid unnecessary verbosity
- Ask for clarification if the question is ambiguous
- Cite sources when making factual claims`,
  
  technical: `You are a technical expert AI assistant. Follow these guidelines:
- Provide technically accurate and detailed information
- Use proper terminology and explain complex concepts clearly
- Include code examples with proper formatting when relevant
- Consider security, performance, and best practices
- Reference official documentation when applicable`,
  
  creative: `You are a creative AI assistant. Follow these guidelines:
- Think outside the box and provide innovative solutions
- Use engaging language and storytelling when appropriate
- Consider multiple perspectives and approaches
- Balance creativity with practicality
- Inspire and encourage exploration`,
};

// Providers that require API keys
const PROVIDERS_REQUIRING_API_KEY: AIProvider[] = ['openai', 'anthropic', 'google', 'azure-openai'];

/**
 * Validates the chat configuration
 */
export function validateConfig(config: ChatConfig): { valid: boolean; error?: string } {
  if (!config.provider) {
    return { valid: false, error: 'Provider is required' };
  }

  if (PROVIDERS_REQUIRING_API_KEY.includes(config.provider) && !config.apiKey) {
    return { valid: false, error: 'API key is required for this provider' };
  }

  if (config.provider === 'azure-openai' && !config.endpoint) {
    return { valid: false, error: 'Endpoint is required for Azure OpenAI' };
  }

  if (config.provider === 'ollama' && !config.endpoint) {
    return { valid: false, error: 'Endpoint is required for Ollama' };
  }

  return { valid: true };
}

/**
 * Simple token estimation (rough approximation: ~4 chars per token for English)
 * 
 * This uses a hybrid approach combining word and character counts:
 * - Words are multiplied by 1.3 (empirical average: English words ~1-2 tokens)
 * - Characters are divided by 4 (common approximation: 1 token ≈ 4 characters)
 * - The average of both methods provides a reasonable estimate
 * 
 * Note: This is an approximation. Actual token counts vary by model and tokenizer.
 * For precise counts, use the provider's tokenizer (e.g., tiktoken for OpenAI).
 */
export function estimateTokenCount(text: string): number {
  const words = text.split(/\s+/).length;
  const chars = text.length;
  // Hybrid estimation: average of word-based (words * 1.3) and char-based (chars / 4)
  return Math.ceil((words * 1.3 + chars / 4) / 2);
}

/**
 * Optimize messages by removing redundant whitespace and compressing content
 */
export function optimizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(msg => ({
    ...msg,
    content: msg.content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .trim(),
  }));
}

/**
 * Get system prompt based on context
 */
export function getSystemPrompt(type: 'default' | 'technical' | 'creative' = 'default', custom?: string): string {
  return custom || SYSTEM_PROMPTS[type];
}

/**
 * Add system prompt to messages if not present
 */
export function enhanceMessagesWithSystemPrompt(messages: ChatMessage[], systemPrompt?: string): ChatMessage[] {
  const hasSystemPrompt = messages.some(m => m.role === 'system');
  if (!hasSystemPrompt && systemPrompt) {
    return [{ role: 'system', content: systemPrompt }, ...messages];
  }
  return messages;
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
    // Check if it's a network/CORS error - TypeError typically indicates fetch() network errors
    if (error instanceof TypeError) {
      throw new Error('Failed to fetch - This is likely a CORS issue. Ensure Ollama is running with OLLAMA_ORIGINS environment variable set.');
    }
    throw error;
  }
}

/**
 * Send a chat message to Anthropic Claude API
 */
async function sendToAnthropic(
  messages: ChatMessage[],
  config: ChatConfig
): Promise<ChatResponse> {
  const apiKey = config.apiKey;
  const model = config.model || 'claude-3-sonnet-20240229';
  const endpoint = config.endpoint || 'https://api.anthropic.com/v1/messages';

  // Anthropic requires separating system messages
  const systemMessages = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const requestBody = {
    model,
    messages: conversationMessages,
    max_tokens: config.maxTokens || 4096,
    temperature: config.temperature ?? 0.7,
    system: systemMessages || undefined,
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
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Anthropic API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.content || data.content.length === 0) {
      throw new Error('No response from Anthropic');
    }

    return {
      message: data.content[0].text,
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
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
 * Send a chat message to Google Gemini API
 */
async function sendToGoogle(
  messages: ChatMessage[],
  config: ChatConfig
): Promise<ChatResponse> {
  const apiKey = config.apiKey;
  const model = config.model || 'gemini-pro';
  const endpoint = config.endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Convert messages to Gemini format
  const contents = messages.filter(m => m.role !== 'system').map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Add system instruction if present
  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const requestBody = {
    contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxTokens || 2048,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeout || DEFAULT_TIMEOUT
  );

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
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
        errorData.error?.message || `Google API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error('No response from Google Gemini');
    }

    const messageText = data.candidates[0].content.parts[0].text;

    return {
      message: messageText,
      model: model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
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
 * Send a chat message to Azure OpenAI API
 */
async function sendToAzureOpenAI(
  messages: ChatMessage[],
  config: ChatConfig
): Promise<ChatResponse> {
  const apiKey = config.apiKey;
  const model = config.model || 'gpt-35-turbo';
  const endpoint = config.endpoint;
  const apiVersion = config.azureApiVersion || '2024-02-15-preview';

  if (!endpoint) {
    throw new Error('Azure OpenAI endpoint is required');
  }

  // Azure endpoint format: https://<resource-name>.openai.azure.com/openai/deployments/<deployment-name>/chat/completions?api-version=<version>
  const url = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

  const requestBody = {
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey || '',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Azure OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Azure OpenAI');
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

  // Apply token optimization if enabled
  let processedMessages = messages;
  if (config.optimizeTokens) {
    processedMessages = optimizeMessages(messages);
  }

  // Add system prompt if provided and not present
  if (config.systemPrompt) {
    processedMessages = enhanceMessagesWithSystemPrompt(processedMessages, config.systemPrompt);
  }

  switch (config.provider) {
    case 'openai':
      return sendToOpenAI(processedMessages, config);
    case 'anthropic':
      return sendToAnthropic(processedMessages, config);
    case 'google':
      return sendToGoogle(processedMessages, config);
    case 'azure-openai':
      return sendToAzureOpenAI(processedMessages, config);
    case 'ollama':
      return sendToOllama(processedMessages, config);
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

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: AIProvider): ModelInfo {
  return DEFAULT_MODELS[provider];
}

/**
 * Get all available default models
 */
export function getAllDefaultModels(): ModelInfo[] {
  return Object.values(DEFAULT_MODELS);
}

/**
 * Fetch available models from OpenAI
 */
export async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch OpenAI models');
    }

    const data = await response.json();
    
    return data.data
      .filter((model: { id: string }) => model.id.includes('gpt'))
      .map((model: { id: string }) => ({
        id: model.id,
        name: model.id,
        contextWindow: model.id.includes('gpt-4') ? 8192 : 4096,
        provider: 'openai' as AIProvider,
      }));
  } catch (error) {
    // Return default models if API call fails
    return [DEFAULT_MODELS.openai];
  }
}

/**
 * Fetch available models from Ollama
 */
export async function fetchOllamaModels(endpoint: string): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Ollama models');
    }

    const data = await response.json();
    
    return data.models?.map((model: { name: string }) => ({
      id: model.name,
      name: model.name,
      contextWindow: 4096, // Default, could be different per model
      provider: 'ollama' as AIProvider,
    })) || [DEFAULT_MODELS.ollama];
  } catch (error) {
    // Return default models if API call fails
    return [DEFAULT_MODELS.ollama];
  }
}

/**
 * Fetch available models from Anthropic (returns predefined models)
 */
export async function fetchAnthropicModels(): Promise<ModelInfo[]> {
  // Anthropic doesn't have a models list API, so we return predefined models
  return [
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      contextWindow: 200000,
      provider: 'anthropic',
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      contextWindow: 200000,
      provider: 'anthropic',
      isDefault: true,
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      contextWindow: 200000,
      provider: 'anthropic',
    },
  ];
}

/**
 * Fetch available models from Google Gemini API
 */
export async function fetchGoogleModels(apiKey?: string): Promise<ModelInfo[]> {
  // Default models to return when API key is not provided or API call fails
  const defaultModels: ModelInfo[] = [
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      contextWindow: 32768,
      provider: 'google',
      isDefault: true,
    },
    {
      id: 'gemini-pro-vision',
      name: 'Gemini Pro Vision',
      contextWindow: 16384,
      provider: 'google',
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      contextWindow: 1048576,
      provider: 'google',
    },
  ];

  // If no API key provided, return default models
  if (!apiKey) {
    return defaultModels;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google Gemini models');
    }

    const data: GeminiModelsResponse = await response.json();
    
    // Parse models from API response
    if (!data.models || !Array.isArray(data.models)) {
      return defaultModels;
    }

    // Filter for generateContent-capable models and map to ModelInfo
    const models: ModelInfo[] = data.models
      .filter((model: GeminiModel) => 
        model.supportedGenerationMethods?.includes('generateContent') &&
        model.name?.includes('gemini')
      )
      .map((model: GeminiModel, index: number) => {
        // Extract model ID from name (e.g., "models/gemini-pro" -> "gemini-pro")
        const modelId = model.name.split('/').pop() || model.name;
        
        // Get display name, fallback to ID
        const displayName = model.displayName || modelId;
        
        // Extract context window from inputTokenLimit or use default
        const contextWindow = model.inputTokenLimit || 32768;
        
        return {
          id: modelId,
          name: displayName,
          contextWindow: contextWindow,
          provider: 'google' as AIProvider,
          // Mark the first model as default
          isDefault: index === 0,
        };
      });

    // If we got models from API, return them; otherwise return defaults
    return models.length > 0 ? models : defaultModels;
  } catch (error) {
    // Return default models if API call fails
    return defaultModels;
  }
}

/**
 * Fetch available models based on provider
 */
export async function fetchModels(provider: AIProvider, config: { apiKey?: string; endpoint?: string }): Promise<ModelInfo[]> {
  switch (provider) {
    case 'openai':
      return config.apiKey ? fetchOpenAIModels(config.apiKey) : [DEFAULT_MODELS.openai];
    case 'anthropic':
      return fetchAnthropicModels();
    case 'google':
      return config.apiKey ? fetchGoogleModels(config.apiKey) : fetchGoogleModels();
    case 'azure-openai':
      // Azure OpenAI uses deployment names, not model IDs
      return [DEFAULT_MODELS['azure-openai']];
    case 'ollama':
      return config.endpoint ? fetchOllamaModels(config.endpoint) : [DEFAULT_MODELS.ollama];
    default:
      return [getDefaultModel(provider)];
  }
}
