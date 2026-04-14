import { describe, it, expect } from 'vitest';
import { generateLoremIpsum } from '../lib/tools.js';

describe('generateLoremIpsum', () => {
  it('generates 1 paragraph by default', () => {
    const text = generateLoremIpsum();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
    // 1 paragraph — no double newlines
    expect(text).not.toContain('\n\n');
  });

  it('generates multiple paragraphs separated by double newlines', () => {
    const text = generateLoremIpsum(3);
    const parts = text.split('\n\n');
    expect(parts).toHaveLength(3);
  });

  it('caps at 20 paragraphs', () => {
    const text = generateLoremIpsum(100);
    const parts = text.split('\n\n');
    expect(parts).toHaveLength(20);
  });

  it('enforces a minimum of 1 paragraph', () => {
    const text = generateLoremIpsum(0);
    expect(text.length).toBeGreaterThan(0);
  });

  it('cycles through paragraphs when count exceeds the bank', () => {
    // Bank has 5 paragraphs; requesting 6 should wrap
    const text = generateLoremIpsum(6);
    const parts = text.split('\n\n');
    expect(parts[0]).toBe(parts[5]); // 6th == 1st (index 5 % 5 = 0)
  });

  it('starts with "Lorem ipsum"', () => {
    expect(generateLoremIpsum(1)).toMatch(/^Lorem ipsum/);
  });
});
