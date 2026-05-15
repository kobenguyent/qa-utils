import { describe, it, expect } from 'vitest';
import { compareTexts } from '../lib/tools.js';

describe('compareTexts', () => {
  it('returns 100% similarity for identical texts', () => {
    const result = compareTexts('line 1\nline 2\nline 3', 'line 1\nline 2\nline 3');
    expect(result.similarity).toBe(100);
    expect(result.stats.sameLines).toBe(3);
    expect(result.stats.addedLines).toBe(0);
    expect(result.stats.removedLines).toBe(0);
    expect(result.stats.modifiedLines).toBe(0);
  });

  it('detects added lines', () => {
    const result = compareTexts('a\nb', 'a\nb\nc');
    expect(result.stats.addedLines).toBe(1);
    const added = result.diffLines.find(d => d.type === 'added');
    expect(added).toBeDefined();
    expect(added?.content).toBe('c');
  });

  it('detects removed lines', () => {
    const result = compareTexts('a\nb\nc', 'a\nb');
    expect(result.stats.removedLines).toBe(1);
    const removed = result.diffLines.find(d => d.type === 'removed');
    expect(removed).toBeDefined();
    expect(removed?.content).toBe('c');
  });

  it('detects modified lines with similarity', () => {
    const result = compareTexts('hello world', 'hello world!');
    const modified = result.diffLines.find(d => d.type === 'modified');
    expect(modified).toBeDefined();
    expect(modified?.similarity).toBeGreaterThan(0);
    expect(modified?.oldContent).toBe('hello world');
    expect(modified?.content).toBe('hello world!');
  });

  it('returns 0% similarity for completely different texts', () => {
    const result = compareTexts('aaa\nbbb\nccc', 'xxx\nyyy\nzzz');
    expect(result.similarity).toBeLessThan(50);
    expect(result.stats.sameLines).toBe(0);
  });

  it('respects ignoreCase option', () => {
    const result = compareTexts('Hello', 'hello', { ignoreCase: true });
    expect(result.stats.sameLines).toBe(1);
    expect(result.similarity).toBe(100);
  });

  it('respects ignoreWhitespace option', () => {
    const result = compareTexts('hello   world', 'hello world', { ignoreWhitespace: true });
    expect(result.stats.sameLines).toBe(1);
    expect(result.similarity).toBe(100);
  });

  it('respects ignoreBlankLines option', () => {
    const result = compareTexts('a\n\nb', 'a\nb', { ignoreBlankLines: true });
    expect(result.stats.sameLines).toBe(2);
    expect(result.similarity).toBe(100);
  });

  it('handles empty inputs', () => {
    const result = compareTexts('', '');
    expect(result.similarity).toBe(100);
    expect(result.stats.totalLines).toBe(1); // one empty line
  });

  it('returns structured stats', () => {
    const result = compareTexts('a\nb', 'a\nc');
    expect(result.stats).toHaveProperty('totalLines');
    expect(result.stats).toHaveProperty('sameLines');
    expect(result.stats).toHaveProperty('addedLines');
    expect(result.stats).toHaveProperty('removedLines');
    expect(result.stats).toHaveProperty('modifiedLines');
    expect(result.stats).toHaveProperty('similarityPercentage');
  });
});
