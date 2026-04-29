import { describe, it, expect } from 'vitest';
import { convertMarkdownToConfluence } from '../lib/tools.js';

describe('convertMarkdownToConfluence (CLI)', () => {
  it('converts ATX headings', () => {
    expect(convertMarkdownToConfluence('# H1')).toBe('h1. H1');
    expect(convertMarkdownToConfluence('## H2')).toBe('h2. H2');
    expect(convertMarkdownToConfluence('### H3')).toBe('h3. H3');
  });

  it('converts bold and italic inline formatting', () => {
    expect(convertMarkdownToConfluence('**bold text**')).toBe('*bold text*');
    expect(convertMarkdownToConfluence('_italic text_')).toBe('_italic text_');
  });

  it('converts strikethrough', () => {
    expect(convertMarkdownToConfluence('~~deleted~~')).toBe('-deleted-');
  });

  it('converts inline code', () => {
    expect(convertMarkdownToConfluence('use `npm install`')).toBe('use {{npm install}}');
  });

  it('converts fenced code blocks', () => {
    const md = '```typescript\nconst x = 1;\n```';
    expect(convertMarkdownToConfluence(md)).toBe('{code:language=typescript}\nconst x = 1;\n{code}');
  });

  it('converts unordered list items', () => {
    expect(convertMarkdownToConfluence('- foo\n- bar')).toBe('* foo\n* bar');
  });

  it('converts ordered list items', () => {
    expect(convertMarkdownToConfluence('1. first\n2. second')).toBe('# first\n# second');
  });

  it('converts links', () => {
    expect(convertMarkdownToConfluence('[QA Utils](https://qa-utils.com)')).toBe('[QA Utils|https://qa-utils.com]');
  });

  it('converts images', () => {
    expect(convertMarkdownToConfluence('![screenshot](screen.png)')).toBe('!screen.png|alt=screenshot!');
  });

  it('converts blockquotes', () => {
    const result = convertMarkdownToConfluence('> important note');
    expect(result).toBe('{quote}\nimportant note\n{quote}');
  });

  it('converts horizontal rules', () => {
    expect(convertMarkdownToConfluence('---')).toBe('----');
  });

  it('converts GFM tables', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const result = convertMarkdownToConfluence(md);
    expect(result).toContain('|| A || B ||');
    expect(result).toContain('| 1 | 2 |');
  });

  it('handles empty input', () => {
    expect(convertMarkdownToConfluence('')).toBe('');
  });

  it('handles multiline documents', () => {
    const md = '# Title\n\nParagraph text with **bold** and _italic_.\n\n- item one\n- item two';
    const result = convertMarkdownToConfluence(md);
    expect(result).toContain('h1. Title');
    expect(result).toContain('*bold*');
    expect(result).toContain('_italic_');
    expect(result).toContain('* item one');
    expect(result).toContain('* item two');
  });
});
