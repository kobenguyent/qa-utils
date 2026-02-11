import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAiChatSessionConfig, KobeanAgent, getKobean, resetKobean } from '../KobeanAgent';

describe('KobeanAgent', () => {
  describe('getAiChatSessionConfig', () => {
    afterEach(() => {
      sessionStorage.clear();
    });

    it('returns empty config when no session storage values exist', () => {
      const config = getAiChatSessionConfig();
      expect(config).toEqual({});
    });

    it('reads provider from session storage', () => {
      sessionStorage.setItem('aiChat_provider', JSON.stringify('openai'));
      const config = getAiChatSessionConfig();
      expect(config.aiProvider).toBe('openai');
    });

    it('reads all AI chat settings from session storage', () => {
      sessionStorage.setItem('aiChat_provider', JSON.stringify('anthropic'));
      sessionStorage.setItem('aiChat_apiKey', JSON.stringify('sk-test-key'));
      sessionStorage.setItem('aiChat_endpoint', JSON.stringify('https://api.anthropic.com'));
      sessionStorage.setItem('aiChat_model', JSON.stringify('claude-3-opus'));

      const config = getAiChatSessionConfig();
      expect(config.aiProvider).toBe('anthropic');
      expect(config.aiApiKey).toBe('sk-test-key');
      expect(config.aiEndpoint).toBe('https://api.anthropic.com');
      expect(config.aiModel).toBe('claude-3-opus');
    });

    it('handles azure-openai provider', () => {
      sessionStorage.setItem('aiChat_provider', JSON.stringify('azure-openai'));
      sessionStorage.setItem('aiChat_apiKey', JSON.stringify('azure-key'));
      sessionStorage.setItem('aiChat_endpoint', JSON.stringify('https://myinstance.openai.azure.com'));
      sessionStorage.setItem('aiChat_model', JSON.stringify('gpt-35-turbo'));

      const config = getAiChatSessionConfig();
      expect(config.aiProvider).toBe('azure-openai');
      expect(config.aiApiKey).toBe('azure-key');
      expect(config.aiEndpoint).toBe('https://myinstance.openai.azure.com');
      expect(config.aiModel).toBe('gpt-35-turbo');
    });

    it('handles partial configuration', () => {
      sessionStorage.setItem('aiChat_provider', JSON.stringify('ollama'));
      sessionStorage.setItem('aiChat_endpoint', JSON.stringify('http://localhost:11434'));

      const config = getAiChatSessionConfig();
      expect(config.aiProvider).toBe('ollama');
      expect(config.aiEndpoint).toBe('http://localhost:11434');
      expect(config.aiApiKey).toBeUndefined();
      expect(config.aiModel).toBeUndefined();
    });
  });

  describe('getKobean', () => {
    beforeEach(() => {
      resetKobean();
    });

    it('creates a KobeanAgent with default config', () => {
      const agent = getKobean();
      expect(agent).toBeInstanceOf(KobeanAgent);
    });

    it('creates a KobeanAgent with custom config', () => {
      const agent = getKobean({
        aiProvider: 'openai',
        aiApiKey: 'test-key',
        aiModel: 'gpt-4',
      });
      expect(agent).toBeInstanceOf(KobeanAgent);
      const config = agent.getConfig();
      expect(config.aiProvider).toBe('openai');
      expect(config.aiApiKey).toBe('test-key');
      expect(config.aiModel).toBe('gpt-4');
    });

    it('returns singleton instance', () => {
      const agent1 = getKobean();
      const agent2 = getKobean();
      expect(agent1).toBe(agent2);
    });

    it('updates config on subsequent calls', () => {
      const agent1 = getKobean({ aiProvider: 'ollama' });
      const agent2 = getKobean({ aiProvider: 'openai', aiApiKey: 'new-key' });
      expect(agent1).toBe(agent2);
      expect(agent2.getConfig().aiProvider).toBe('openai');
      expect(agent2.getConfig().aiApiKey).toBe('new-key');
    });
  });

  describe('KobeanAgent config with azure-openai', () => {
    beforeEach(() => {
      resetKobean();
    });

    it('supports azure-openai provider', () => {
      const agent = new KobeanAgent({
        aiProvider: 'azure-openai',
        aiEndpoint: 'https://myinstance.openai.azure.com',
        aiApiKey: 'azure-key',
        aiModel: 'gpt-35-turbo',
      });
      const config = agent.getConfig();
      expect(config.aiProvider).toBe('azure-openai');
      expect(config.aiEndpoint).toBe('https://myinstance.openai.azure.com');
    });
  });
});
