import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import {
  readConfig,
  writeConfig,
  deleteConfig,
  validateAIConfig,
  formatConfigForDisplay,
  toDisplayConfig,
  maskApiKey,
  getConfigDir,
  getConfigFilePath,
  DEFAULT_MODELS,
  DEFAULT_ENDPOINTS,
  type AIProviderConfig,
} from '../lib/aiConfig.js';
import { fetchModels } from '../lib/aiClient.js';

// Use a temporary directory for config during tests
const TEST_HOME = path.join(os.tmpdir(), `qautils-cli-test-${Math.random().toString(36).slice(2)}`);
const REAL_HOME = os.homedir();
const REAL_APPDATA = process.env.APPDATA;

function setupTestHome(): void {
  // Override os.homedir() via environment (Linux/macOS only in tests)
  vi.spyOn(os, 'homedir').mockReturnValue(TEST_HOME);
  // Clean up any previous test config
  const dir = path.join(TEST_HOME, '.config', 'qautils-cli');
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
}

function restoreHome(): void {
  vi.spyOn(os, 'homedir').mockReturnValue(REAL_HOME);
  if (REAL_APPDATA !== undefined) process.env.APPDATA = REAL_APPDATA;
  else delete process.env.APPDATA;
}

describe('getConfigDir', () => {
  beforeEach(setupTestHome);
  afterEach(restoreHome);

  it('returns a path inside the test home on non-Windows', () => {
    if (process.platform === 'win32') return;
    expect(getConfigDir()).toContain('qautils-cli');
    expect(getConfigDir()).toContain('.config');
  });
});

describe('readConfig / writeConfig / deleteConfig', () => {
  beforeEach(setupTestHome);
  afterEach(restoreHome);

  it('returns null when no config file exists', () => {
    expect(readConfig()).toBeNull();
  });

  it('writes and reads back a config', () => {
    const cfg: AIProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test-1234',
      model: 'gpt-4',
      temperature: 0.5,
    };
    writeConfig(cfg);
    const result = readConfig();
    expect(result).not.toBeNull();
    expect(result?.provider).toBe('openai');
    expect(result?.apiKey).toBe('sk-test-1234');
    expect(result?.model).toBe('gpt-4');
    expect(result?.temperature).toBe(0.5);
  });

  it('creates the config directory if it does not exist', () => {
    writeConfig({ provider: 'ollama', endpoint: 'http://localhost:11434' });
    expect(fs.existsSync(getConfigFilePath())).toBe(true);
  });

  it('deletes the config file', () => {
    writeConfig({ provider: 'ollama', endpoint: 'http://localhost:11434' });
    deleteConfig();
    expect(fs.existsSync(getConfigFilePath())).toBe(false);
    expect(readConfig()).toBeNull();
  });

  it('handles missing provider in stored file gracefully', () => {
    const dir = getConfigDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getConfigFilePath(), JSON.stringify({ model: 'gpt-4' }), 'utf-8');
    expect(readConfig()).toBeNull();
  });

  it('handles corrupted config file gracefully', () => {
    const dir = getConfigDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getConfigFilePath(), 'NOT_JSON', 'utf-8');
    expect(readConfig()).toBeNull();
  });
});

describe('validateAIConfig', () => {
  it('returns error when provider is missing', () => {
    expect(validateAIConfig({} as AIProviderConfig)).toBeTruthy();
  });

  it('returns error when openai apiKey is missing', () => {
    expect(validateAIConfig({ provider: 'openai' })).toMatch(/api key/i);
  });

  it('returns error when anthropic apiKey is missing', () => {
    expect(validateAIConfig({ provider: 'anthropic' })).toMatch(/api key/i);
  });

  it('returns error when google apiKey is missing', () => {
    expect(validateAIConfig({ provider: 'google' })).toMatch(/api key/i);
  });

  it('returns error when azure-openai apiKey is missing', () => {
    expect(validateAIConfig({ provider: 'azure-openai' })).toMatch(/api key/i);
  });

  it('returns error when azure-openai endpoint is missing', () => {
    expect(validateAIConfig({ provider: 'azure-openai', apiKey: 'key' })).toMatch(/endpoint/i);
  });

  it('returns error when ollama endpoint is missing', () => {
    expect(validateAIConfig({ provider: 'ollama' })).toMatch(/endpoint/i);
  });

  it('returns null for valid openai config', () => {
    expect(validateAIConfig({ provider: 'openai', apiKey: 'sk-xxx' })).toBeNull();
  });

  it('returns null for valid ollama config', () => {
    expect(validateAIConfig({ provider: 'ollama', endpoint: 'http://localhost:11434' })).toBeNull();
  });

  it('returns null for valid azure-openai config', () => {
    expect(
      validateAIConfig({ provider: 'azure-openai', apiKey: 'key', endpoint: 'https://resource.openai.azure.com' }),
    ).toBeNull();
  });
});

describe('formatConfigForDisplay', () => {
  it('shows [configured] when API key is present via toDisplayConfig', () => {
    const cfg: AIProviderConfig = { provider: 'openai', apiKey: 'sk-1234567890abcdef' };
    const display = formatConfigForDisplay(toDisplayConfig(cfg));
    expect(display).toContain('[configured]');
    expect(display).not.toContain('sk-1234567890abcdef');
    expect(display).not.toContain('sk-1');
  });

  it('includes provider and model', () => {
    const cfg: AIProviderConfig = { provider: 'openai', model: 'gpt-4', apiKey: 'sk-test' };
    const display = formatConfigForDisplay(toDisplayConfig(cfg));
    expect(display).toContain('openai');
    expect(display).toContain('gpt-4');
  });

  it('uses default model when none specified', () => {
    const cfg: AIProviderConfig = { provider: 'anthropic', apiKey: 'key' };
    const display = formatConfigForDisplay(toDisplayConfig(cfg));
    expect(display).toContain(DEFAULT_MODELS['anthropic']);
  });

  it('shows endpoint when present', () => {
    const cfg: AIProviderConfig = { provider: 'ollama', endpoint: 'http://localhost:11434' };
    const display = formatConfigForDisplay(toDisplayConfig(cfg));
    expect(display).toContain('http://localhost:11434');
  });

  it('omits API key line when no key present', () => {
    const display = formatConfigForDisplay({ provider: 'ollama' });
    expect(display).not.toContain('API Key');
  });
});

describe('maskApiKey', () => {
  it('masks short keys fully', () => {
    expect(maskApiKey('abc')).toBe('****');
  });

  it('partially masks medium keys', () => {
    const result = maskApiKey('abcde123');
    expect(result).toContain('****');
    expect(result.length).toBeLessThan('abcde123'.length);
  });

  it('shows first 4 and last 4 chars for long keys', () => {
    const result = maskApiKey('sk-1234567890abcdef');
    expect(result.startsWith('sk-1')).toBe(true);
    expect(result.endsWith('cdef')).toBe(true);
    expect(result).toContain('****');
  });
});

describe('toDisplayConfig', () => {
  it('removes apiKey and adds hasApiKey flag', () => {
    const cfg: AIProviderConfig = { provider: 'openai', apiKey: 'sk-1234567890abcdef' };
    const display = toDisplayConfig(cfg);
    expect('apiKey' in display).toBe(false);
    expect(display.hasApiKey).toBe(true);
  });

  it('preserves non-sensitive fields', () => {
    const cfg: AIProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test',
      model: 'gpt-4',
      temperature: 0.5,
      endpoint: 'https://api.example.com',
    };
    const display = toDisplayConfig(cfg);
    expect(display.model).toBe('gpt-4');
    expect(display.temperature).toBe(0.5);
    expect(display.endpoint).toBe('https://api.example.com');
    expect(display.provider).toBe('openai');
  });

  it('handles config without apiKey', () => {
    const cfg: AIProviderConfig = { provider: 'ollama', endpoint: 'http://localhost:11434' };
    const display = toDisplayConfig(cfg);
    expect(display.hasApiKey).toBeUndefined();
  });
});

describe('DEFAULT_MODELS', () => {
  it('has a default model for each provider', () => {
    const providers = ['openai', 'anthropic', 'google', 'azure-openai', 'ollama'] as const;
    providers.forEach((p) => {
      expect(DEFAULT_MODELS[p]).toBeTruthy();
    });
  });
});

describe('DEFAULT_ENDPOINTS', () => {
  it('has a default endpoint for ollama', () => {
    expect(DEFAULT_ENDPOINTS['ollama']).toBeTruthy();
  });

  it('has a default endpoint for openai', () => {
    expect(DEFAULT_ENDPOINTS['openai']).toContain('openai.com');
  });
});

// ── fetchModels tests ─────────────────────────────────────────────────────────

describe('fetchModels', () => {
  it('returns a static list for anthropic without hitting the network', async () => {
    const models = await fetchModels({ provider: 'anthropic', apiKey: 'test-key' });
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    // All entries should be non-empty strings
    models.forEach((m) => expect(typeof m).toBe('string'));
    // Should include at least one well-known Claude model
    expect(models.some((m) => m.includes('claude'))).toBe(true);
  });

  it('throws when provider is unsupported', async () => {
    await expect(
      fetchModels({ provider: 'unknown' as AIProviderConfig['provider'] }),
    ).rejects.toThrow(/unsupported provider/i);
  });

  it('throws when ollama endpoint is unreachable (network error)', async () => {
    // Port 19999 is almost certainly not listening; this exercises the network-error path.
    await expect(
      fetchModels({ provider: 'ollama', endpoint: 'http://127.0.0.1:19999' }),
    ).rejects.toThrow();
  }, 10_000);

  it('throws a descriptive error when openai apiKey is missing (401)', async () => {
    // Real HTTP call – expect a non-2xx response to be caught and rethrown.
    // We cannot guarantee network access in CI, so we mock fetch here.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Incorrect API key' } }),
    }) as unknown as typeof fetch;

    await expect(
      fetchModels({ provider: 'openai', apiKey: 'invalid-key' }),
    ).rejects.toThrow();

    globalThis.fetch = originalFetch;
  });

  it('parses ollama response and returns model names', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [{ name: 'llama2:latest' }, { name: 'mistral:latest' }],
      }),
    }) as unknown as typeof fetch;

    const models = await fetchModels({ provider: 'ollama', endpoint: 'http://localhost:11434' });
    expect(models).toContain('llama2:latest');
    expect(models).toContain('mistral:latest');

    globalThis.fetch = originalFetch;
  });

  it('parses openai response and returns sorted model ids', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4' }, { id: 'gpt-3.5-turbo' }],
      }),
    }) as unknown as typeof fetch;

    const models = await fetchModels({ provider: 'openai', apiKey: 'sk-test' });
    expect(models).toEqual(['gpt-3.5-turbo', 'gpt-4']); // sorted

    globalThis.fetch = originalFetch;
  });

  it('parses google response and filters generateContent models', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: 'models/gemini-1.5-flash', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/text-bison', supportedGenerationMethods: ['generateText'] },
          { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
        ],
      }),
    }) as unknown as typeof fetch;

    const models = await fetchModels({ provider: 'google', apiKey: 'AIza-test' });
    expect(models).toContain('gemini-1.5-flash');
    expect(models).toContain('gemini-1.5-pro');
    expect(models).not.toContain('text-bison'); // filtered out

    globalThis.fetch = originalFetch;
  });

  it('parses azure-openai response and returns sorted model ids', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'gpt-4' }, { id: 'gpt-35-turbo' }],
      }),
    }) as unknown as typeof fetch;

    const models = await fetchModels({
      provider: 'azure-openai',
      apiKey: 'key',
      endpoint: 'https://resource.openai.azure.com',
    });
    expect(models).toContain('gpt-4');
    expect(models).toContain('gpt-35-turbo');

    globalThis.fetch = originalFetch;
  });
});
