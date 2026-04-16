import { describe, it, expect } from 'vitest';
import { parseDelegationPlan } from '../orchestrator';

describe('orchestrator', () => {
  describe('parseDelegationPlan', () => {
    it('parses a valid delegation plan from a code block', () => {
      const text = `Here is my plan:

\`\`\`delegate
{"plan": [
  {"profileId": "abc-123", "subTask": "Research the topic"},
  {"profileId": "def-456", "subTask": "Write the code"}
]}
\`\`\``;
      const result = parseDelegationPlan(text);
      expect(result).not.toBeNull();
      expect(result?.plan).toHaveLength(2);
      expect(result?.plan[0].profileId).toBe('abc-123');
      expect(result?.plan[0].subTask).toBe('Research the topic');
      expect(result?.plan[1].profileId).toBe('def-456');
    });

    it('returns null when no delegate block is present', () => {
      expect(parseDelegationPlan('Just some text with no plan')).toBeNull();
    });

    it('returns null on malformed JSON in delegate block', () => {
      const text = `\`\`\`delegate\n{not valid json}\n\`\`\``;
      expect(parseDelegationPlan(text)).toBeNull();
    });

    it('returns null when JSON has no "plan" array', () => {
      const text = `\`\`\`delegate\n{"something": "else"}\n\`\`\``;
      expect(parseDelegationPlan(text)).toBeNull();
    });

    it('handles an empty plan array', () => {
      const text = `\`\`\`delegate\n{"plan": []}\n\`\`\``;
      const result = parseDelegationPlan(text);
      expect(result).not.toBeNull();
      expect(result?.plan).toHaveLength(0);
    });

    it('parses plan with extra whitespace around the JSON', () => {
      const text = `\`\`\`delegate\n\n  {"plan": [{"profileId": "x", "subTask": "Do thing"}]}  \n\n\`\`\``;
      const result = parseDelegationPlan(text);
      expect(result).not.toBeNull();
      expect(result?.plan[0].profileId).toBe('x');
    });
  });
});
