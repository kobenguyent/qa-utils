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

// Use a temporary directory for config during tests
const TEST_HOME = path.join(os.tmpdir(), `qautils-cli-test-${Date.now()}`);
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
  it('masks the API key via toDisplayConfig', () => {
    const cfg: AIProviderConfig = { provider: 'openai', apiKey: 'sk-1234567890abcdef' };
    const display = formatConfigForDisplay(toDisplayConfig(cfg));
    expect(display).toContain('sk-1');
    expect(display).toContain('cdef');
    expect(display).not.toContain('sk-1234567890abcdef');
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

  it('accepts maskedApiKey directly without raw apiKey', () => {
    const display = formatConfigForDisplay({ provider: 'openai', maskedApiKey: 'sk-1****cdef' });
    expect(display).toContain('sk-1****cdef');
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
  it('removes apiKey and adds maskedApiKey', () => {
    const cfg: AIProviderConfig = { provider: 'openai', apiKey: 'sk-1234567890abcdef' };
    const display = toDisplayConfig(cfg);
    expect('apiKey' in display).toBe(false);
    expect(display.maskedApiKey).toBeDefined();
    expect(display.maskedApiKey).not.toBe('sk-1234567890abcdef');
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
    expect(display.maskedApiKey).toBeUndefined();
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
