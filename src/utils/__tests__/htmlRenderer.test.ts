import { describe, it, expect } from 'vitest';
import { sanitizeHtml, validateHtml } from '../htmlRenderer';

describe('HTML Renderer Utils', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<div>Hello</div><script>alert("xss")</script>';
      const result = sanitizeHtml(html);
      expect(result).toBe('<div>Hello</div>');
    });

    it('should remove inline event handlers', () => {
      const html = '<button onclick="alert(1)">Click</button>';
      const result = sanitizeHtml(html);
      expect(result).toBe('<button >Click</button>');
    });

    it('should remove onerror attributes', () => {
      const html = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHtml(html);
      expect(result).toBe('<img src="x" >');
    });

    it('should keep safe HTML', () => {
      const html = '<div class="test"><p>Hello World</p></div>';
      const result = sanitizeHtml(html);
      expect(result).toBe(html);
    });
  });

  describe('validateHtml', () => {
    it('should validate empty HTML', () => {
      const result = validateHtml('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HTML code is empty');
    });

    it('should validate correct HTML', () => {
      const result = validateHtml('<div><p>Test</p></div>');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect mismatched tags', () => {
      const result = validateHtml('<div><p>Test</div>');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Mismatched opening and closing tags');
    });

    it('should validate self-closing tags', () => {
      const result = validateHtml('<img src="test.jpg" /><br />');
      expect(result.valid).toBe(true);
    });
  });
});
