import { describe, it, expect } from 'vitest';
import { countTextStats } from '../lib/tools.js';

describe('countTextStats', () => {
  it('counts an empty string as all zeros', () => {
    const stats = countTextStats('');
    expect(stats.characters).toBe(0);
    expect(stats.words).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.paragraphs).toBe(0);
  });

  it('counts characters including spaces', () => {
    const stats = countTextStats('hello world');
    expect(stats.characters).toBe(11);
  });

  it('counts characters excluding spaces', () => {
    const stats = countTextStats('hello world');
    expect(stats.charactersNoSpaces).toBe(10);
  });

  it('counts words separated by whitespace', () => {
    expect(countTextStats('one two three').words).toBe(3);
  });

  it('counts words correctly with extra spaces', () => {
    expect(countTextStats('  hello   world  ').words).toBe(2);
  });

  it('counts a single sentence', () => {
    expect(countTextStats('Hello world.').sentences).toBe(1);
  });

  it('counts multiple sentences', () => {
    expect(countTextStats('Hello. World. How are you?').sentences).toBe(3);
  });

  it('counts a single line', () => {
    expect(countTextStats('single line').lines).toBe(1);
  });

  it('counts multiple lines', () => {
    expect(countTextStats('line one\nline two\nline three').lines).toBe(3);
  });

  it('counts paragraphs (blocks separated by blank line)', () => {
    expect(countTextStats('para one\n\npara two\n\npara three').paragraphs).toBe(3);
  });

  it('counts a single paragraph as 1', () => {
    expect(countTextStats('This is one paragraph.').paragraphs).toBe(1);
  });

  it('handles Windows-style line endings (CRLF)', () => {
    const stats = countTextStats('line one\r\nline two');
    expect(stats.lines).toBe(2);
  });
});
