/**
 * qautils-cli — AI Chat Client
 *
 * Sends chat messages to AI providers using Node.js native fetch (Node 18+).
 * Supports: OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI, Ollama.
 */

import type { AIProviderConfig } from './aiConfig.js';
import { DEFAULT_MODELS } from './aiConfig.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  model: string;
}

const DEFAULT_TIMEOUT_MS = 60_000;

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
  const endpoint = config.endpoint || 'https://api.anthropic.com/v1/messages';

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
  const endpoint =
    config.endpoint ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const systemInstruction = messages.find((m) => m.role === 'system')?.content;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

// ── Public API ────────────────────────────────────────────────────────────────

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
