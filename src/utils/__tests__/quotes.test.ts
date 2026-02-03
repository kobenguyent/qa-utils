import { describe, it, expect } from 'vitest';
import { quotes, getRandomQuote } from '../quotes';

describe('Quotes Utility', () => {
  it('should have a non-empty quotes array', () => {
    expect(quotes).toBeDefined();
    expect(quotes.length).toBeGreaterThan(0);
  });

  it('should have valid quote structure', () => {
    quotes.forEach(quote => {
      expect(quote).toHaveProperty('text');
      expect(quote).toHaveProperty('author');
      expect(typeof quote.text).toBe('string');
      expect(typeof quote.author).toBe('string');
      expect(quote.text.length).toBeGreaterThan(0);
      expect(quote.author.length).toBeGreaterThan(0);
    });
  });

  it('should return a random quote', () => {
    const quote = getRandomQuote();
    expect(quote).toBeDefined();
    expect(quote).toHaveProperty('text');
    expect(quote).toHaveProperty('author');
    expect(quotes).toContainEqual(quote);
  });

  it('should return different quotes on multiple calls', () => {
    const results = new Set();
    // Call it many times to ensure randomness
    for (let i = 0; i < 50; i++) {
      const quote = getRandomQuote();
      results.add(quote.text);
    }
    // Should get at least 2 different quotes in 50 tries
    expect(results.size).toBeGreaterThan(1);
  });

  it('should have quotes with proper formatting', () => {
    quotes.forEach(quote => {
      // Check that text doesn't start or end with unnecessary whitespace
      expect(quote.text.trim()).toBe(quote.text);
      expect(quote.author.trim()).toBe(quote.author);
    });
  });
});
