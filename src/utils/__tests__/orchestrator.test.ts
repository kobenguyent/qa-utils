import { describe, it, expect } from 'vitest';
import { parseDelegationPlan, parseTeamPlan } from '../orchestrator';

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

  describe('parseTeamPlan', () => {
    it('parses a valid team plan from a code block', () => {
      const text = `Here is the team I recommend:

\`\`\`team
{"agents": [
  {"name": "Planner", "role": "planner", "specialty": "Breaks complex tasks into step-by-step plans"},
  {"name": "QA Engineer", "role": "tester", "specialty": "Writes Playwright tests for web pages"}
]}
\`\`\``;
      const result = parseTeamPlan(text);
      expect(result).not.toBeNull();
      expect(result?.agents).toHaveLength(2);
      expect(result?.agents[0].name).toBe('Planner');
      expect(result?.agents[0].role).toBe('planner');
      expect(result?.agents[0].specialty).toBe('Breaks complex tasks into step-by-step plans');
      expect(result?.agents[1].name).toBe('QA Engineer');
      expect(result?.agents[1].role).toBe('tester');
    });

    it('returns null when no team block is present', () => {
      expect(parseTeamPlan('Just some text with no team plan')).toBeNull();
    });

    it('returns null on malformed JSON in team block', () => {
      const text = `\`\`\`team\n{not valid json}\n\`\`\``;
      expect(parseTeamPlan(text)).toBeNull();
    });

    it('returns null when agents array is missing', () => {
      const text = `\`\`\`team\n{"something": "else"}\n\`\`\``;
      expect(parseTeamPlan(text)).toBeNull();
    });

    it('returns null when agents array is empty', () => {
      const text = `\`\`\`team\n{"agents": []}\n\`\`\``;
      expect(parseTeamPlan(text)).toBeNull();
    });

    it('parses plan with extra whitespace around the JSON', () => {
      const text = `\`\`\`team\n\n  {"agents": [{"name": "Researcher", "role": "researcher", "specialty": "Gathers info"}]}  \n\n\`\`\``;
      const result = parseTeamPlan(text);
      expect(result).not.toBeNull();
      expect(result?.agents[0].name).toBe('Researcher');
      expect(result?.agents[0].role).toBe('researcher');
    });

    it('parses a single-agent team', () => {
      const text = `\`\`\`team\n{"agents": [{"name": "Coder", "role": "coder", "specialty": "Writes Python code"}]}\n\`\`\``;
      const result = parseTeamPlan(text);
      expect(result).not.toBeNull();
      expect(result?.agents).toHaveLength(1);
      expect(result?.agents[0].role).toBe('coder');
    });
  });
});
