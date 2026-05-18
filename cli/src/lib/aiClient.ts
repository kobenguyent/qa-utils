/**
 * qautils-cli — AI Chat Client
 *
 * Sends chat messages to AI providers using Node.js native fetch (Node 18+).
 * Supports: OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI, Ollama,
 * and Cloudflare Workers AI (free tier).
 */

import type { AIProviderConfig } from './aiConfig.js';
import { DEFAULT_MODELS } from './aiConfig.js';
import {AI_BASE_URL} from "../../../common/data.js";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  model: string;
}

const DEFAULT_TIMEOUT_MS = 60_000;

// Cloudflare Workers AI free-tier constants
const CLOUDFLARE_AI_FREE_MAX_TOKENS = 512;
const CLOUDFLARE_AI_CONTEXT_WINDOW = 6144;

/** Rough token estimator: hybrid word + character count */
function estimateTokens(text: string): number {
  const words = text.split(/\s+/).length;
  const chars = text.length;
  return Math.ceil((words * 1.3 + chars / 4) / 2);
}

/**
 * Trim messages to fit within a token budget.
 * Keeps system messages and the newest conversation turns.
 */
function trimMessagesToFitContext(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
  const systemMessages = messages.filter(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const systemTokens = systemMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  const budget = maxTokens - systemTokens;

  if (budget <= 0) {
    const truncated = systemMessages[systemMessages.length - 1];
    return [{ ...truncated, content: truncated.content.slice(0, maxTokens * 4) }];
  }

  const kept: ChatMessage[] = [];
  let used = 0;
  for (let i = conversationMessages.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(conversationMessages[i].content);
    if (used + tokens > budget && kept.length > 0) break;
    kept.unshift(conversationMessages[i]);
    used += tokens;
  }

  return [...systemMessages, ...kept];
}

// ── Provider implementations ──────────────────────────────────────────────────

async function sendToOpenAI(
  messages: ChatMessage[],
  config: AIProviderConfig,
): Promise<ChatResponse> {
  const model = config.model || DEFAULT_MODELS['openai'];
  const endpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey || ''}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `OpenAI error ${res.status}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
    };
    if (!data.choices?.length) throw new Error('No response from OpenAI');
    return { message: data.choices[0].message.content, model: data.model };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

async function sendToAnthropic(
  messages: ChatMessage[],
  config: AIProviderConfig,
): Promise<ChatResponse> {
  const model = config.model || DEFAULT_MODELS['anthropic'];
  const endpoint = config.endpoint || `${AI_BASE_URL.ANTHROPIC_AI_BASE_URL}/messages`;

  const systemMessages = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: conversationMessages,
        max_tokens: 4096,
        temperature: config.temperature ?? 0.7,
        ...(systemMessages ? { system: systemMessages } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Anthropic error ${res.status}`);
    }

    const data = (await res.json()) as {
      content: Array<{ text: string }>;
      model: string;
    };
    if (!data.content?.length) throw new Error('No response from Anthropic');
    return { message: data.content[0].text, model: data.model };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

async function sendToGoogle(
  messages: ChatMessage[],
  config: AIProviderConfig,
): Promise<ChatResponse> {
  const apiKey = config.apiKey || '';
  const model = config.model || DEFAULT_MODELS['google'];
  // Use a custom endpoint if provided, otherwise use the default without key in URL
  const endpoint =
    config.endpoint ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const systemInstruction = messages.find((m) => m.role === 'system')?.content;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents,
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        generationConfig: { temperature: config.temperature ?? 0.7, maxOutputTokens: 2048 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Google error ${res.status}`);
    }

    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    if (!data.candidates?.length) throw new Error('No response from Google Gemini');
    return { message: data.candidates[0].content.parts[0].text, model };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

async function sendToAzureOpenAI(
  messages: ChatMessage[],
  config: AIProviderConfig,
): Promise<ChatResponse> {
  const model = config.model || DEFAULT_MODELS['azure-openai'];
  const endpoint = config.endpoint;
  if (!endpoint) throw new Error('Azure OpenAI endpoint is required');

  const apiVersion = config.azureApiVersion || '2024-02-15-preview';
  const url = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey || '',
      },
      body: JSON.stringify({
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Azure OpenAI error ${res.status}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
    };
    if (!data.choices?.length) throw new Error('No response from Azure OpenAI');
    return { message: data.choices[0].message.content, model: data.model };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

async function sendToOllama(
  messages: ChatMessage[],
  config: AIProviderConfig,
): Promise<ChatResponse> {
  const endpoint = config.endpoint || 'http://localhost:11434';
  const model = config.model || DEFAULT_MODELS['ollama'];
  const url = `${endpoint}/api/chat`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: config.temperature ?? 0.7, num_predict: 2048 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? `Ollama error ${res.status}`);
    }

    const data = (await res.json()) as { message: { content: string }; model: string };
    if (!data.message?.content) throw new Error('No response from Ollama');
    return { message: data.message.content, model: data.model };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

async function sendToCloudflareAI(
  messages: ChatMessage[],
  config: AIProviderConfig,
): Promise<ChatResponse> {
  const accountId = config.cloudflareAccountId;
  if (!accountId) throw new Error('Cloudflare Account ID is required');

  const model = config.model || DEFAULT_MODELS['cloudflare-ai'];
  const url = `${AI_BASE_URL.CLOUDFLARE_AI_BASE_URL}/${accountId}/ai/run/${model}`;

  // Trim conversation to fit within the free-tier context window
  const inputBudget = CLOUDFLARE_AI_CONTEXT_WINDOW - CLOUDFLARE_AI_FREE_MAX_TOKENS;
  const trimmedMessages = trimMessagesToFitContext(messages, inputBudget);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey || ''}`,
      },
      body: JSON.stringify({
        messages: trimmedMessages,
        max_tokens: CLOUDFLARE_AI_FREE_MAX_TOKENS,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { errors?: Array<{ message?: string }> };
      throw new Error(err.errors?.[0]?.message ?? `Cloudflare Workers AI error ${res.status}`);
    }

    const data = (await res.json()) as {
      result?: { response?: string };
      success?: boolean;
      errors?: Array<{ message?: string }>;
    };

    if (!data.success || !data.result?.response) {
      throw new Error(data.errors?.[0]?.message ?? 'No response from Cloudflare Workers AI');
    }

    return { message: data.result.response, model };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch available model IDs from the configured AI provider.
 *
 * - OpenAI        GET /v1/models
 * - Anthropic     Returns a static curated list (no public model-list endpoint)
 * - Google Gemini GET /v1beta/models
 * - Azure OpenAI  GET /openai/models?api-version=…
 * - Ollama        GET /api/tags
 */
export async function fetchModels(config: AIProviderConfig): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    switch (config.provider) {
      case 'openai': {
        const base = (config.endpoint || 'https://api.openai.com/v1/chat/completions')
          .replace(/\/chat\/completions$/, '')
          .replace(/\/v1$/, '')
          + '/v1';
        const res = await fetch(`${base}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey || ''}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
        const data = (await res.json()) as { data: Array<{ id: string }> };
        return data.data.map((m) => m.id).sort();
      }

      case 'anthropic': {
        // Anthropic does not expose a public model-list REST endpoint;
        // return the known stable models instead.
        clearTimeout(timer);
        return [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
        ];
      }

      case 'google': {
        const apiKey = config.apiKey || '';
        const base = (config.endpoint || 'https://generativelanguage.googleapis.com/v1beta')
          .replace(/\/models\/[^/]+:generateContent.*/, '')
          .replace(/\/models$/, '');
        const res = await fetch(`${base}/models`, {
          headers: { 'x-goog-api-key': apiKey },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Google error ${res.status}`);
        const data = (await res.json()) as {
          models: Array<{ name: string; supportedGenerationMethods?: string[] }>;
        };
        return (data.models || [])
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''))
          .sort();
      }

      case 'azure-openai': {
        const endpoint = config.endpoint;
        if (!endpoint) throw new Error('Azure OpenAI endpoint is required');
        const apiVersion = config.azureApiVersion || '2024-02-15-preview';
        const res = await fetch(
          `${endpoint}/openai/models?api-version=${apiVersion}`,
          {
            headers: { 'api-key': config.apiKey || '' },
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error(`Azure OpenAI error ${res.status}`);
        const data = (await res.json()) as { data: Array<{ id: string }> };
        return data.data.map((m) => m.id).sort();
      }

      case 'ollama': {
        const base = config.endpoint || 'http://localhost:11434';
        const res = await fetch(`${base}/api/tags`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Ollama error ${res.status}`);
        const data = (await res.json()) as { models: Array<{ name: string }> };
        return (data.models || []).map((m) => m.name).sort();
      }

      case 'cloudflare-ai': {
        // Cloudflare Workers AI does not expose a model-list REST endpoint;
        // return the curated list of free-tier text-generation models.
        clearTimeout(timer);
        return [
          '@cf/meta/llama-3-8b-instruct',
          '@cf/mistral/mistral-7b-instruct-v0.1',
          '@cf/meta/llama-2-7b-chat-int8',
          '@cf/google/gemma-7b-it',
          '@cf/tiiuae/falcon-7b-instruct',
        ];
      }

      default:
        throw new Error(`Unsupported provider: ${(config as AIProviderConfig).provider}`);
    }
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') throw new Error('Request timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send a list of messages to the configured AI provider and return the reply.
 */
export async function sendChat(
  messages: ChatMessage[],
  config: AIProviderConfig,
): Promise<ChatResponse> {
  switch (config.provider) {
    case 'openai':
      return sendToOpenAI(messages, config);
    case 'anthropic':
      return sendToAnthropic(messages, config);
    case 'google':
      return sendToGoogle(messages, config);
    case 'azure-openai':
      return sendToAzureOpenAI(messages, config);
    case 'ollama':
      return sendToOllama(messages, config);
    case 'cloudflare-ai':
      return sendToCloudflareAI(messages, config);
    default:
      throw new Error(`Unsupported provider: ${(config as AIProviderConfig).provider}`);
  }
}

/** Kobean system prompt used in CLI chat sessions */
export const KOBEAN_SYSTEM_PROMPT = `You are Kobean, an intelligent AI assistant for QA engineers and SDETs. \
You are integrated into the QA Utils CLI — a developer toolkit for testing and automation workflows.

Your capabilities include:
- Generating UUIDs, passwords, hashes, and random data
- Encoding/decoding Base64, JWT tokens
- Converting timestamps, colors, and text
- Answering questions about software testing, QA processes, and automation
- Writing and reviewing test code

Guidelines:
- Be concise but helpful
- Suggest relevant QA Utils CLI commands when applicable (e.g. \`qautils uuid\`, \`qautils hash\`)
- Use markdown formatting for clarity
- Keep responses focused and actionable`;
