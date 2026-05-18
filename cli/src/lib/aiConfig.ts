/**
 * qautils-cli — AI Provider Configuration
 *
 * Reads and writes the AI provider settings to a persistent config file at:
 *   Linux/macOS: ~/.config/qautils-cli/config.json
 *   Windows:     %APPDATA%\qautils-cli\config.json
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import {AI_BASE_URL} from "../../../common/data.js";

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'azure-openai' | 'ollama' | 'cloudflare-ai';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  temperature?: number;
  azureApiVersion?: string;
  cloudflareAccountId?: string; // For Cloudflare Workers AI
}

const CONFIG_DIR_NAME = 'qautils-cli';
const CONFIG_FILE_NAME = 'config.json';

/** Returns the platform-specific config directory path */
export function getConfigDir(): string {
  if (process.platform === 'win32' && process.env.APPDATA) {
    return path.join(process.env.APPDATA, CONFIG_DIR_NAME);
  }
  return path.join(os.homedir(), '.config', CONFIG_DIR_NAME);
}

/** Returns the full path to the config file */
export function getConfigFilePath(): string {
  return path.join(getConfigDir(), CONFIG_FILE_NAME);
}

/** Reads the stored AI provider config; returns null if not configured */
export function readConfig(): AIProviderConfig | null {
  const filePath = getConfigFilePath();
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as AIProviderConfig;
    if (!parsed.provider) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Writes the AI provider config to disk */
export function writeConfig(config: AIProviderConfig): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getConfigFilePath(), JSON.stringify(config, null, 2), 'utf-8');
}

/** Deletes the stored config file */
export function deleteConfig(): void {
  const filePath = getConfigFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/** Default models per provider */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-3.5-turbo',
  anthropic: 'claude-3-sonnet-20240229',
  google: 'gemini-1.5-flash',
  'azure-openai': 'gpt-35-turbo',
  ollama: 'llama2',
  'cloudflare-ai': '@cf/meta/llama-3-8b-instruct',
};

/** Default endpoints per provider (where applicable) */
export const DEFAULT_ENDPOINTS: Partial<Record<AIProvider, string>> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: `${AI_BASE_URL.ANTHROPIC_AI_BASE_URL}/messages`,
  google: 'https://generativelanguage.googleapis.com/v1beta',
  ollama: 'http://localhost:11434',
};

/** Validate a config; returns an error string or null if valid */
export function validateAIConfig(config: AIProviderConfig): string | null {
  if (!config.provider) return 'Provider is required';

  const requiresApiKey: AIProvider[] = ['openai', 'anthropic', 'google', 'azure-openai', 'cloudflare-ai'];
  if (requiresApiKey.includes(config.provider) && !config.apiKey) {
    return `API key is required for ${config.provider}`;
  }

  if (config.provider === 'azure-openai' && !config.endpoint) {
    return 'Endpoint is required for Azure OpenAI';
  }

  if (config.provider === 'ollama' && !config.endpoint) {
    return 'Endpoint is required for Ollama (e.g. http://localhost:11434)';
  }

  if (config.provider === 'cloudflare-ai' && !config.cloudflareAccountId) {
    return 'Account ID is required for Cloudflare Workers AI';
  }

  return null;
}

/**
 * Mask an API key for safe display.
 * Useful when confirming a key entry without revealing the full value.
 * Note: prefer `toDisplayConfig()` + `formatConfigForDisplay()` for logging
 * to ensure no key-derived data reaches logging sinks.
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) return '****';
  if (apiKey.length <= 8) return apiKey.slice(0, 2) + '****';
  return apiKey.slice(0, 4) + '****' + apiKey.slice(-4);
}

/** Format a config for display, showing key presence without any key-derived data */
export function formatConfigForDisplay(
  config: Omit<AIProviderConfig, 'apiKey'> & { hasApiKey?: boolean },
): string {
  const lines: string[] = [
    `  Provider  : ${config.provider}`,
    `  Model     : ${config.model || DEFAULT_MODELS[config.provider]}`,
  ];
  if (config.hasApiKey) {
    lines.push(`  API Key   : [configured]`);
  }
  if (config.endpoint) {
    lines.push(`  Endpoint  : ${config.endpoint}`);
  }
  if (config.temperature !== undefined) {
    lines.push(`  Temperature: ${config.temperature}`);
  }
  if (config.azureApiVersion) {
    lines.push(`  API Version: ${config.azureApiVersion}`);
  }
  if (config.cloudflareAccountId) {
    lines.push(`  CF Account : ${config.cloudflareAccountId}`);
  }
  return lines.join('\n');
}

/** Build a display-safe version of a config (API key replaced with boolean indicator) */
export function toDisplayConfig(
  config: AIProviderConfig,
): Omit<AIProviderConfig, 'apiKey'> & { hasApiKey?: boolean } {
  const { apiKey, ...rest } = config;
  return { ...rest, ...(apiKey ? { hasApiKey: true } : {}) };
}
