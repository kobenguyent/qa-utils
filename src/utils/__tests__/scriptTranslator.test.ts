import { describe, it, expect } from 'vitest';
import { postmanToInsomniaScript, insomniaToPostmanScript, postmanToThunderClientScript } from '../scriptTranslator';

describe('scriptTranslator', () => {
  describe('postmanToInsomniaScript', () => {
    it('should convert pm.environment to insomnia.environment', () => {
      const input = 'const token = pm.environment.get("token");\npm.environment.set("newToken", "abc123");';
      const output = postmanToInsomniaScript(input);
      expect(output).toContain('insomnia.environment.get("token")');
      expect(output).toContain('insomnia.environment.set("newToken", "abc123")');
    });

    it('should convert pm.response to insomnia.response', () => {
      const input = 'const status = pm.response.code;\nconst data = pm.response.json();';
      const output = postmanToInsomniaScript(input);
      expect(output).toContain('insomnia.response.status');
      expect(output).toContain('insomnia.response.json()');
    });

    it('should convert pm.test to insomnia.test', () => {
      const input = 'pm.test("Status is 200", () => {\n  pm.expect(pm.response.code).to.eql(200);\n});';
      const output = postmanToInsomniaScript(input);
      expect(output).toContain('insomnia.test(');
      expect(output).toContain('insomnia.expect(');
      expect(output).toContain('insomnia.response.status');
    });

    it('should convert pm.collectionVariables to insomnia.baseEnvironment', () => {
      const input = 'pm.collectionVariables.set("key", "value");';
      const output = postmanToInsomniaScript(input);
      expect(output).toContain('insomnia.baseEnvironment.set("key", "value")');
    });
  });

  describe('insomniaToPostmanScript', () => {
    it('should convert insomnia.environment to pm.environment', () => {
      const input = 'const token = insomnia.environment.get("token");\ninsomnia.environment.set("newToken", "abc123");';
      const output = insomniaToPostmanScript(input);
      expect(output).toContain('pm.environment.get("token")');
      expect(output).toContain('pm.environment.set("newToken", "abc123")');
    });

    it('should convert insomnia.response to pm.response', () => {
      const input = 'const status = insomnia.response.status;\nconst data = insomnia.response.json();';
      const output = insomniaToPostmanScript(input);
      expect(output).toContain('pm.response.code');
      expect(output).toContain('pm.response.json()');
    });

    it('should convert insomnia.baseEnvironment to pm.collectionVariables', () => {
      const input = 'insomnia.baseEnvironment.set("key", "value");';
      const output = insomniaToPostmanScript(input);
      expect(output).toContain('pm.collectionVariables.set("key", "value")');
    });
  });

  describe('postmanToThunderClientScript', () => {
    it('should convert pm.test to tc.test', () => {
      const input = 'pm.test("Status is 200", () => {\n  pm.expect(pm.response.code).to.eql(200);\n});';
      const output = postmanToThunderClientScript(input);
      expect(output).toContain('tc.test(');
      expect(output).toContain('tc.expect(');
      expect(output).toContain('tc.response.status');
    });

    it('should add warning for unsupported features', () => {
      const input = 'pm.sendRequest("https://api.example.com", (err, res) => {});';
      const output = postmanToThunderClientScript(input);
      expect(output).toContain('// Warning: Thunder Client has limited script support');
    });
  });
});
