/**
 * Tests for JSON Prompt Builder utility functions in sharedTools.ts
 */
import { describe, it, expect } from 'vitest';
import {
    extractTemplateVariables,
    renderPromptTemplate,
    validatePromptTemplate,
    buildJsonPrompt,
    parseJsonPrompt,
    type JsonPromptTemplate,
} from '../sharedTools';

// ── extractTemplateVariables ──────────────────────────────────────────────────

describe('extractTemplateVariables', () => {
    it('extracts a single variable', () => {
        expect(extractTemplateVariables('Hello {{name}}!')).toEqual(['name']);
    });

    it('extracts multiple unique variables', () => {
        const vars = extractTemplateVariables('{{greeting}} {{name}}, you have {{count}} messages.');
        expect(vars).toContain('greeting');
        expect(vars).toContain('name');
        expect(vars).toContain('count');
        expect(vars).toHaveLength(3);
    });

    it('deduplicates repeated variables', () => {
        const vars = extractTemplateVariables('{{x}} and {{x}} again');
        expect(vars).toEqual(['x']);
    });

    it('returns empty array when no variables present', () => {
        expect(extractTemplateVariables('no vars here')).toEqual([]);
    });

    it('handles underscores in variable names', () => {
        const vars = extractTemplateVariables('{{user_name}} and {{api_key}}');
        expect(vars).toContain('user_name');
        expect(vars).toContain('api_key');
    });

    it('handles alphanumeric variable names', () => {
        const vars = extractTemplateVariables('{{var1}} {{var2}}');
        expect(vars).toContain('var1');
        expect(vars).toContain('var2');
    });

    it('does not match invalid placeholder syntax', () => {
        // Starting with a digit is invalid
        expect(extractTemplateVariables('{{ 123name }}')).toEqual([]);
        expect(extractTemplateVariables('{{}}')).toEqual([]);
    });
});

// ── renderPromptTemplate ──────────────────────────────────────────────────────

describe('renderPromptTemplate', () => {
    it('replaces a single variable', () => {
        expect(renderPromptTemplate('Hello {{name}}!', { name: 'Alice' })).toBe('Hello Alice!');
    });

    it('replaces multiple variables', () => {
        const result = renderPromptTemplate('{{greeting}}, {{name}}!', { greeting: 'Hi', name: 'Bob' });
        expect(result).toBe('Hi, Bob!');
    });

    it('leaves unknown variables unchanged', () => {
        const result = renderPromptTemplate('Hello {{unknown}}', { name: 'Alice' });
        expect(result).toBe('Hello {{unknown}}');
    });

    it('replaces all occurrences of a variable', () => {
        const result = renderPromptTemplate('{{x}} and {{x}}', { x: 'foo' });
        expect(result).toBe('foo and foo');
    });

    it('handles empty string replacement', () => {
        expect(renderPromptTemplate('Hello {{name}}!', { name: '' })).toBe('Hello !');
    });

    it('handles template with no variables', () => {
        expect(renderPromptTemplate('no vars', {})).toBe('no vars');
    });
});

// ── validatePromptTemplate ────────────────────────────────────────────────────

describe('validatePromptTemplate', () => {
    const validTemplate: JsonPromptTemplate = {
        model:       'gpt-4o',
        temperature: 0.7,
        maxTokens:   1024,
        messages: [
            { role: 'system',    content: 'You are helpful.' },
            { role: 'user',      content: 'Hello!' },
        ],
    };

    it('validates a correct template', () => {
        const result = validatePromptTemplate(validTemplate);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('rejects template with empty messages array', () => {
        const t = { ...validTemplate, messages: [] };
        const result = validatePromptTemplate(t);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('empty'))).toBe(true);
    });

    it('rejects invalid role', () => {
        const t = {
            ...validTemplate,
            messages: [{ role: 'invalid' as 'user', content: 'hi' }],
        };
        const result = validatePromptTemplate(t);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('role'))).toBe(true);
    });

    it('rejects temperature out of range', () => {
        const t = { ...validTemplate, temperature: 3 };
        const result = validatePromptTemplate(t);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('temperature'))).toBe(true);
    });

    it('rejects maxTokens below 1', () => {
        const t = { ...validTemplate, maxTokens: 0 };
        const result = validatePromptTemplate(t);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('maxTokens'))).toBe(true);
    });
});

// ── buildJsonPrompt ───────────────────────────────────────────────────────────

describe('buildJsonPrompt', () => {
    const template: JsonPromptTemplate = {
        model:       'gpt-4o',
        temperature: 0.7,
        maxTokens:   1024,
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user',   content: 'Hello, {{name}}!' },
        ],
    };

    it('builds valid OpenAI format JSON', () => {
        const result = buildJsonPrompt(template, { name: 'Alice' }, 'openai');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.model).toBe('gpt-4o');
        expect(parsed.messages[1].content).toBe('Hello, Alice!');
        expect(parsed.temperature).toBe(0.7);
        expect(parsed.max_tokens).toBe(1024);
    });

    it('builds valid Anthropic format (separates system)', () => {
        const result = buildJsonPrompt(template, { name: 'Bob' }, 'anthropic');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.system).toBe('You are a helpful assistant.');
        expect(parsed.messages).toHaveLength(1);
        expect(parsed.messages[0].role).toBe('user');
    });

    it('builds valid Gemini format', () => {
        const result = buildJsonPrompt(template, { name: 'Carol' }, 'gemini');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.systemInstruction.parts[0].text).toBe('You are a helpful assistant.');
        expect(parsed.contents[0].role).toBe('user');
        expect(parsed.contents[0].parts[0].text).toBe('Hello, Carol!');
    });

    it('builds valid generic format', () => {
        const result = buildJsonPrompt(template, { name: 'Dave' }, 'generic');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.messages).toHaveLength(2);
    });

    it('reports variables used', () => {
        const result = buildJsonPrompt(template, { name: 'Eve' }, 'openai');
        expect(result.variablesUsed).toContain('name');
    });

    it('leaves unset variables as-is', () => {
        const result = buildJsonPrompt(template, {}, 'openai');
        expect(result.valid).toBe(true);
        const parsed = JSON.parse(result.json);
        expect(parsed.messages[1].content).toBe('Hello, {{name}}!');
    });

    it('returns invalid result for bad template', () => {
        const bad = { ...template, messages: [] };
        const result = buildJsonPrompt(bad, {}, 'openai');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });
});

// ── parseJsonPrompt ───────────────────────────────────────────────────────────

describe('parseJsonPrompt', () => {
    it('parses OpenAI format', () => {
        const json = JSON.stringify({
            model:       'gpt-4',
            temperature: 0.5,
            max_tokens:  512,
            messages: [
                { role: 'system', content: 'Be helpful.' },
                { role: 'user',   content: 'Hi there.' },
            ],
        });
        const result = parseJsonPrompt(json);
        expect(result.template).not.toBeNull();
        const t = result.template;
        if (!t) return; // narrow type after null check
        expect(t.model).toBe('gpt-4');
        expect(t.temperature).toBe(0.5);
        expect(t.maxTokens).toBe(512);
        expect(t.messages).toHaveLength(2);
    });

    it('parses Anthropic format (system at top level)', () => {
        const json = JSON.stringify({
            model:      'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system:     'You are helpful.',
            messages: [
                { role: 'user',      content: 'Hello.' },
                { role: 'assistant', content: 'Hi!' },
            ],
        });
        const result = parseJsonPrompt(json);
        expect(result.template).not.toBeNull();
        const msgs = result.template?.messages ?? [];
        expect(msgs.find((m) => m.role === 'system')?.content).toBe('You are helpful.');
        expect(msgs.find((m) => m.role === 'user')?.content).toBe('Hello.');
    });

    it('parses Gemini format', () => {
        const json = JSON.stringify({
            systemInstruction: { parts: [{ text: 'Be concise.' }] },
            contents: [
                { role: 'user',  parts: [{ text: 'What is 2+2?' }] },
                { role: 'model', parts: [{ text: '4'             }] },
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
        });
        const result = parseJsonPrompt(json);
        expect(result.template).not.toBeNull();
        const t2 = result.template;
        if (!t2) return;
        const msgs = t2.messages;
        expect(msgs[0].role).toBe('system');
        expect(msgs[0].content).toBe('Be concise.');
        expect(msgs[1].role).toBe('user');
        expect(msgs[2].role).toBe('assistant');
        expect(t2.temperature).toBe(0.3);
        expect(t2.maxTokens).toBe(256);
    });

    it('returns error for invalid JSON', () => {
        const result = parseJsonPrompt('not valid json');
        expect(result.template).toBeNull();
        expect(result.error).toBeDefined();
    });

    it('returns error for JSON without messages', () => {
        const result = parseJsonPrompt('{"model":"gpt-4"}');
        expect(result.template).toBeNull();
        expect(result.error).toBeDefined();
    });

    it('returns error for a JSON array', () => {
        const result = parseJsonPrompt('[1,2,3]');
        expect(result.template).toBeNull();
        expect(result.error).toBeDefined();
    });
});
