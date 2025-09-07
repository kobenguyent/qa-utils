import { describe, it, expect, vi } from 'vitest';
import { 
  formatDate, 
  isValidEmail, 
  generateRandomString, 
  sanitizeHTML, 
  debounce 
} from '../helpers';

describe('helpers', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-25');
      const formatted = formatDate(date);
      expect(formatted).toBe('December 25, 2023');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test..test@example.com')).toBe(false);
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      expect(generateRandomString(10)).toHaveLength(10);
      expect(generateRandomString(5)).toHaveLength(5);
      expect(generateRandomString(0)).toHaveLength(0);
    });

    it('should generate different strings on multiple calls', () => {
      const str1 = generateRandomString(10);
      const str2 = generateRandomString(10);
      expect(str1).not.toBe(str2);
    });

    it('should only contain alphanumeric characters', () => {
      const result = generateRandomString(100);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const maliciousHTML = '<div>Hello</div><script>alert("xss")</script>';
      const sanitized = sanitizeHTML(maliciousHTML);
      expect(sanitized).toBe('<div>Hello</div>');
    });

    it('should remove event handlers', () => {
      const maliciousHTML = '<div onclick="alert()">Click me</div>';
      const sanitized = sanitizeHTML(maliciousHTML);
      expect(sanitized).toBe('<div>Click me</div>');
    });

    it('should preserve safe HTML', () => {
      const safeHTML = '<div class="safe"><p>This is safe content</p></div>';
      const sanitized = sanitizeHTML(safeHTML);
      expect(sanitized).toBe(safeHTML);
    });
  });

  describe('debounce', () => {
    it('should delay function execution', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should reset delay on multiple calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      await new Promise(resolve => setTimeout(resolve, 50));
      debouncedFn();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockFn).not.toHaveBeenCalled();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});