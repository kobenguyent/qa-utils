import { describe, it, expect } from 'vitest';
import {
    buildJsonPrompt,
    parseJsonPrompt,
    extractTemplateVariables,
    renderPromptTemplate,
    validatePromptTemplate,
    type JsonPromptTemplate,
} from '../lib/tools.js';

// ── extractTemplateVariables (via CLI tools re-export) ─────────────────────────

describe('CLI tools — extractTemplateVariables', () => {
    it('extracts variable names from content', () => {
        const vars = extractTemplateVariables('Hello {{name}}, you are {{age}} years old.');
        expect(vars).toContain('name');
        expect(vars).toContain('age');
    });

    it('returns empty array for content without variables', () => {
        expect(extractTemplateVariables('no placeholders here')).toEqual([]);
    });
});

// ── renderPromptTemplate (via CLI tools re-export) ─────────────────────────────

describe('CLI tools — renderPromptTemplate', () => {
    it('replaces a variable with its value', () => {
        expect(renderPromptTemplate('Hi {{name}}!', { name: 'World' })).toBe('Hi World!');
    });

    it('leaves unknown variables unchanged', () => {
        expect(renderPromptTemplate('{{foo}}', {})).toBe('{{foo}}');
    });
});

// ── validatePromptTemplate ─────────────────────────────────────────────────────

describe('CLI tools — validatePromptTemplate', () => {
    const good: JsonPromptTemplate = {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 512,
        messages: [{ role: 'user', content: 'Hello' }],
    };

    it('validates a good template', () => {
        expect(validatePromptTemplate(good).valid).toBe(true);
    });

    it('rejects empty messages', () => {
        const result = validatePromptTemplate({ ...good, messages: [] });
        expect(result.valid).toBe(false);
    });

    it('rejects temperature > 2', () => {
        const result = validatePromptTemplate({ ...good, temperature: 3 });
        expect(result.valid).toBe(false);
    });
});

// ── buildJsonPrompt (via CLI tools re-export) ──────────────────────────────────

describe('CLI tools — buildJsonPrompt', () => {
    const template: JsonPromptTemplate = {
        model: 'gpt-4o',
        temperature: 0.5,
        maxTokens: 256,
        messages: [
            { role: 'system', content: 'Be helpful.' },
            { role: 'user',   content: 'Tell me about {{topic}}.' },
        ],
    };

    it('builds OpenAI format with variable substitution', () => {
        const result = buildJsonPrompt(template, { topic: 'testing' }, 'openai');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.messages[1].content).toBe('Tell me about testing.');
        expect(parsed.model).toBe('gpt-4o');
        expect(parsed.max_tokens).toBe(256);
    });

    it('builds Anthropic format (system at top level)', () => {
        const result = buildJsonPrompt(template, { topic: 'QA' }, 'anthropic');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.system).toBe('Be helpful.');
        expect(parsed.messages).toHaveLength(1);
    });

    it('builds Gemini format', () => {
        const result = buildJsonPrompt(template, { topic: 'automation' }, 'gemini');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.systemInstruction.parts[0].text).toBe('Be helpful.');
        expect(parsed.contents[0].role).toBe('user');
    });

    it('builds generic format', () => {
        const result = buildJsonPrompt(template, {}, 'generic');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.messages).toHaveLength(2);
    });

    it('reports used variables', () => {
        const result = buildJsonPrompt(template, { topic: 'CI/CD' }, 'openai');
        expect(result.variablesUsed).toContain('topic');
    });
});

// ── parseJsonPrompt (via CLI tools re-export) ──────────────────────────────────

describe('CLI tools — parseJsonPrompt', () => {
    it('parses a valid OpenAI prompt', () => {
        const json = JSON.stringify({
            model: 'gpt-4',
            temperature: 0.3,
            max_tokens: 128,
            messages: [{ role: 'user', content: 'Hello' }],
        });
        const result = parseJsonPrompt(json);
        expect(result.template).not.toBeNull();
        expect(result.template!.messages[0].role).toBe('user');
    });

    it('returns error for unparseable input', () => {
        const result = parseJsonPrompt('{{ not json }}');
        expect(result.template).toBeNull();
        expect(result.error).toBeDefined();
    });

    it('returns error when no messages are found', () => {
        const result = parseJsonPrompt('{"model":"gpt-4","temperature":0.5}');
        expect(result.template).toBeNull();
    });
});
