/**
 * Tests for Prompt Enhancer Utility
 */
import { describe, it, expect } from 'vitest';
import {
    enhancePrompt,
    formatPrompt,
    getAvailableRoles,
    getAvailableTones,
    getEnhancementTechniques,
    type EnhancementOptions,
} from '../promptEnhancer';

describe('promptEnhancer', () => {
    describe('enhancePrompt', () => {
        it('should return original prompt as task when no techniques selected', () => {
            const result = enhancePrompt('Write a blog post', { techniques: [] });

            expect(result.original).toBe('Write a blog post');
            expect(result.enhanced).toContain('### Task\nWrite a blog post');
            expect(result.appliedTechniques).toHaveLength(0);
        });

        it('should add role when specifyRole technique is selected', () => {
            const options: EnhancementOptions = {
                techniques: ['specifyRole'],
                role: 'expert',
            };
            const result = enhancePrompt('Explain quantum computing', options);

            expect(result.enhanced).toContain('### Role');
            expect(result.enhanced).toContain('expert');
            expect(result.appliedTechniques).toContain('specifyRole');
        });

        it('should add context when addContext technique is selected', () => {
            const options: EnhancementOptions = {
                techniques: ['addContext'],
                context: 'I am a beginner developer',
            };
            const result = enhancePrompt('Help me with React', options);

            expect(result.enhanced).toContain('### Context');
            expect(result.enhanced).toContain('I am a beginner developer');
            expect(result.appliedTechniques).toContain('addContext');
        });

        it('should add constraints when addConstraints technique is selected', () => {
            const options: EnhancementOptions = {
                techniques: ['addConstraints'],
                constraints: ['Keep it under 200 words', 'Use simple language'],
            };
            const result = enhancePrompt('Explain AI', options);

            expect(result.enhanced).toContain('### Constraints');
            expect(result.enhanced).toContain('- Keep it under 200 words');
            expect(result.enhanced).toContain('- Use simple language');
            expect(result.appliedTechniques).toContain('addConstraints');
        });

        it('should add examples when includeExamples technique is selected', () => {
            const options: EnhancementOptions = {
                techniques: ['includeExamples'],
                examples: ['Input: hello, Output: Hello!'],
            };
            const result = enhancePrompt('Capitalize text', options);

            expect(result.enhanced).toContain('### Examples');
            expect(result.enhanced).toContain('Example 1:');
            expect(result.appliedTechniques).toContain('includeExamples');
        });

        it('should add tone when specifyTone technique is selected', () => {
            const options: EnhancementOptions = {
                techniques: ['specifyTone'],
                tone: 'professional',
            };
            const result = enhancePrompt('Write an email', options);

            expect(result.enhanced).toContain('### Tone');
            expect(result.appliedTechniques).toContain('specifyTone');
        });

        it('should apply multiple techniques', () => {
            const options: EnhancementOptions = {
                techniques: ['specifyRole', 'addContext', 'specifyTone'],
                role: 'teacher',
                context: 'Teaching a programming class',
                tone: 'friendly',
            };
            const result = enhancePrompt('Explain variables', options);

            expect(result.enhanced).toContain('### Role');
            expect(result.enhanced).toContain('### Context');
            expect(result.enhanced).toContain('### Tone');
            expect(result.appliedTechniques).toHaveLength(3);
        });
    });

    describe('formatPrompt', () => {
        const basePrompt = enhancePrompt('Test prompt', {
            techniques: ['addContext'],
            context: 'Test context',
        });

        it('should return text format unchanged', () => {
            const result = formatPrompt(basePrompt, 'text');

            expect(result).toBe(basePrompt.enhanced);
        });

        it('should format as valid JSON', () => {
            const result = formatPrompt(basePrompt, 'json');

            expect(() => JSON.parse(result)).not.toThrow();
            const parsed = JSON.parse(result);
            expect(parsed.prompt).toBeDefined();
            expect(parsed.prompt.original).toBe('Test prompt');
        });

        it('should format as TOON (XML-like)', () => {
            const result = formatPrompt(basePrompt, 'toon');

            expect(result).toContain('<prompt>');
            expect(result).toContain('</prompt>');
            expect(result).toContain('<original>');
            expect(result).toContain('<enhanced>');
        });

        it('should format as Markdown', () => {
            const result = formatPrompt(basePrompt, 'markdown');

            expect(result).toContain('## ');
        });

        it('should format as YAML', () => {
            const result = formatPrompt(basePrompt, 'yaml');

            expect(result).toContain('prompt:');
            expect(result).toContain('original:');
            expect(result).toContain('enhanced:');
        });
    });

    describe('getAvailableRoles', () => {
        it('should return an array of roles', () => {
            const roles = getAvailableRoles();

            expect(Array.isArray(roles)).toBe(true);
            expect(roles.length).toBeGreaterThan(0);
            expect(roles[0]).toHaveProperty('id');
            expect(roles[0]).toHaveProperty('label');
            expect(roles[0]).toHaveProperty('description');
        });
    });

    describe('getAvailableTones', () => {
        it('should return an array of tones', () => {
            const tones = getAvailableTones();

            expect(Array.isArray(tones)).toBe(true);
            expect(tones.length).toBeGreaterThan(0);
            expect(tones[0]).toHaveProperty('id');
            expect(tones[0]).toHaveProperty('label');
        });
    });

    describe('getEnhancementTechniques', () => {
        it('should return an array of techniques', () => {
            const techniques = getEnhancementTechniques();

            expect(Array.isArray(techniques)).toBe(true);
            expect(techniques.length).toBe(6);
            expect(techniques[0]).toHaveProperty('id');
            expect(techniques[0]).toHaveProperty('label');
            expect(techniques[0]).toHaveProperty('description');
        });
    });

    describe('edge cases', () => {
        it('should handle empty prompt', () => {
            const result = enhancePrompt('', { techniques: [] });

            expect(result.original).toBe('');
            expect(result.enhanced).toContain('### Task\n');
        });

        it('should handle special characters in prompt', () => {
            const prompt = 'Test with <special> & "characters"';
            const result = enhancePrompt(prompt, { techniques: [] });

            expect(result.original).toBe(prompt);

            // TOON format should escape special characters
            const toonResult = formatPrompt(result, 'toon');
            expect(toonResult).toContain('&lt;special&gt;');
            expect(toonResult).toContain('&amp;');
        });

        it('should handle multiline prompts', () => {
            const prompt = 'Line 1\nLine 2\nLine 3';
            const result = enhancePrompt(prompt, { techniques: [] });

            expect(result.enhanced).toContain('Line 1\nLine 2\nLine 3');
        });

        it('should not add sections for missing options', () => {
            const options: EnhancementOptions = {
                techniques: ['specifyRole', 'addContext'],
                // role and context are missing
            };
            const result = enhancePrompt('Test', options);

            expect(result.enhanced).not.toContain('### Role');
            expect(result.enhanced).not.toContain('### Context');
            expect(result.appliedTechniques).toHaveLength(0);
        });
    });
});
