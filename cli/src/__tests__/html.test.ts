import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../lib/tools.js';

describe('sanitizeHtml', () => {
  it('removes a <script> tag with content', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeHtml(input)).toBe('<p>Hello</p>');
  });

  it('removes multiple <script> tags', () => {
    const input = '<script>a()</script><p>ok</p><script>b()</script>';
    expect(sanitizeHtml(input)).toBe('<p>ok</p>');
  });

  it('removes inline on* handlers (double-quoted)', () => {
    const input = '<button onclick="evil()">Click</button>';
    expect(sanitizeHtml(input)).toBe('<button>Click</button>');
  });

  it('removes inline on* handlers (single-quoted)', () => {
    const input = "<button onclick='evil()'>Click</button>";
    expect(sanitizeHtml(input)).toBe('<button>Click</button>');
  });

  it('removes onerror handler', () => {
    const input = '<img src="x" onerror="alert(1)">';
    expect(sanitizeHtml(input)).toBe('<img src="x">');
  });

  it('preserves safe HTML unchanged', () => {
    const input = '<h1>Title</h1><p class="intro">Hello <strong>world</strong>.</p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('handles empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('handles plain text without HTML', () => {
    const input = 'Just some plain text.';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('is idempotent (safe to run twice)', () => {
    const input = '<p onclick="foo()">hi</p>';
    const once = sanitizeHtml(input);
    const twice = sanitizeHtml(once);
    expect(once).toBe(twice);
  });

  it('removes the inner <script> in a concatenated-tag string', () => {
    // The sanitizer removes the literal <script>…</script> pair it can match.
    // Obfuscated double-injection (e.g. <scr<script>ipt>) is NOT fully handled
    // by this basic implementation — documented limitation. The inner tag IS removed.
    const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
    const result = sanitizeHtml(input);
    // The inner <script>alert(1)</script> pair is stripped
    expect(result).not.toContain('alert');
  });
});
