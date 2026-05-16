import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectFormat,
  getSupportedExtensions,
  extractTextFromPlain,
  extractTextFromJSON,
  extractTextFromCSV,
  extractTextFromPDF,
  ensurePdfJsRuntimeCompatibility,
  computeLCS,
  levenshteinDistance,
  computeLineSimilarity,
  compareFiles,
  exportAsUnifiedDiff,
  exportAsHTML,
  exportAsJSON,
  DEFAULT_COMPARISON_OPTIONS,
  ComparisonOptions,
} from '../fileComparator';

const pdfMocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
  getPage: vi.fn(),
  getTextContent: vi.fn(),
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: pdfMocks.getDocument,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createFile(content: string, name: string, type = 'text/plain'): File {
  return new File([content], name, { type });
}

const defaultOpts: ComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS };

// ─── Format Detection ────────────────────────────────────────────────────────

describe('detectFormat', () => {
  it('should detect PDF by extension', () => {
    expect(detectFormat(createFile('', 'doc.pdf', 'application/pdf'))).toBe('pdf');
  });

  it('should detect DOCX by extension', () => {
    expect(detectFormat(createFile('', 'doc.docx', ''))).toBe('docx');
  });

  it('should detect XLSX by extension', () => {
    expect(detectFormat(createFile('', 'data.xlsx', ''))).toBe('xlsx');
  });

  it('should detect XLS by extension', () => {
    expect(detectFormat(createFile('', 'data.xls', ''))).toBe('xlsx');
  });

  it('should detect CSV by extension', () => {
    expect(detectFormat(createFile('', 'data.csv', 'text/csv'))).toBe('csv');
  });

  it('should detect TSV by extension', () => {
    expect(detectFormat(createFile('', 'data.tsv', ''))).toBe('csv');
  });

  it('should detect JSON by extension', () => {
    expect(detectFormat(createFile('', 'config.json', 'application/json'))).toBe('json');
  });

  it('should detect plain text formats', () => {
    const plainExts = ['txt', 'log', 'md', 'html', 'xml', 'yaml', 'yml', 'js', 'ts', 'py', 'sql', 'css'];
    for (const ext of plainExts) {
      expect(detectFormat(createFile('', `file.${ext}`, 'text/plain'))).toBe('plain');
    }
  });

  it('should fallback to MIME type when extension unknown', () => {
    expect(detectFormat(createFile('', 'file', 'application/pdf'))).toBe('pdf');
    expect(detectFormat(createFile('', 'file', 'text/csv'))).toBe('csv');
    expect(detectFormat(createFile('', 'file', 'application/json'))).toBe('json');
    expect(detectFormat(createFile('', 'file', 'text/plain'))).toBe('plain');
  });

  it('should throw for unsupported formats', () => {
    expect(() => detectFormat(createFile('', 'file.zip', 'application/zip'))).toThrow('Unsupported file format');
    expect(() => detectFormat(createFile('', 'file.exe', 'application/octet-stream'))).toThrow('Unsupported file format');
  });
});

describe('getSupportedExtensions', () => {
  it('should return an array of supported extensions', () => {
    const exts = getSupportedExtensions();
    expect(exts).toContain('pdf');
    expect(exts).toContain('docx');
    expect(exts).toContain('xlsx');
    expect(exts).toContain('csv');
    expect(exts).toContain('json');
    expect(exts).toContain('txt');
    expect(exts.length).toBeGreaterThan(10);
  });
});

// ─── Text Extraction ─────────────────────────────────────────────────────────

describe('extractTextFromPlain', () => {
  it('should split file into lines', async () => {
    const file = createFile('line 1\nline 2\nline 3', 'test.txt');
    const lines = await extractTextFromPlain(file);
    expect(lines).toEqual(['line 1', 'line 2', 'line 3']);
  });

  it('should handle empty file', async () => {
    const file = createFile('', 'empty.txt');
    const lines = await extractTextFromPlain(file);
    expect(lines).toEqual(['']);
  });

  it('should handle single line', async () => {
    const file = createFile('hello world', 'single.txt');
    const lines = await extractTextFromPlain(file);
    expect(lines).toEqual(['hello world']);
  });
});

describe('extractTextFromJSON', () => {
  it('should pretty-print and split JSON', async () => {
    const file = createFile('{"a":1,"b":2}', 'data.json');
    const lines = await extractTextFromJSON(file, false);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join('\n')).toContain('"a": 1');
  });

  it('should normalize (sort keys) when enabled', async () => {
    const file = createFile('{"z":1,"a":2}', 'data.json');
    const lines = await extractTextFromJSON(file, true);
    const joined = lines.join('\n');
    const posA = joined.indexOf('"a"');
    const posZ = joined.indexOf('"z"');
    expect(posA).toBeLessThan(posZ);
  });

  it('should handle invalid JSON as plain text', async () => {
    const file = createFile('not valid json {{{', 'bad.json');
    const lines = await extractTextFromJSON(file, false);
    expect(lines).toEqual(['not valid json {{{']);
  });
});

describe('extractTextFromCSV', () => {
  it('should parse simple CSV rows', async () => {
    const file = createFile('name,age\nAlice,30\nBob,25', 'data.csv');
    const lines = await extractTextFromCSV(file);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('age');
  });

  it('should handle quoted fields with commas', async () => {
    const file = createFile('"name","city"\n"Alice","New York, NY"\n"Bob","LA"', 'data.csv');
    const lines = await extractTextFromCSV(file);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('New York, NY');
  });

  it('should handle escaped quotes in CSV', async () => {
    const file = createFile('"say ""hello""","ok"', 'quotes.csv');
    const lines = await extractTextFromCSV(file);
    expect(lines[0]).toContain('say "hello"');
  });

  it('should handle empty CSV', async () => {
    const file = createFile('', 'empty.csv');
    const lines = await extractTextFromCSV(file);
    expect(lines).toHaveLength(0);
  });
});

describe('extractTextFromPDF', () => {
  const promiseWithResolversDescriptor = Object.getOwnPropertyDescriptor(Promise, 'withResolvers');
  const responseBytesDescriptor = Object.getOwnPropertyDescriptor(Response.prototype, 'bytes');

  afterEach(() => {
    if (promiseWithResolversDescriptor) {
      Object.defineProperty(Promise, 'withResolvers', promiseWithResolversDescriptor);
    } else {
      delete (Promise as PromiseConstructor & { withResolvers?: unknown }).withResolvers;
    }

    if (responseBytesDescriptor) {
      Object.defineProperty(Response.prototype, 'bytes', responseBytesDescriptor);
    } else {
      delete (Response.prototype as Response & { bytes?: unknown }).bytes;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    pdfMocks.getTextContent.mockResolvedValue({ items: [{ str: 'hello pdf' }] });
    pdfMocks.getPage.mockResolvedValue({ getTextContent: pdfMocks.getTextContent });
    pdfMocks.getDocument.mockReturnValue({
      promise: Promise.resolve({ numPages: 1, getPage: pdfMocks.getPage }),
    });
  });

  it('should install Promise.withResolvers when missing', async () => {
    delete (Promise as PromiseConstructor & { withResolvers?: unknown }).withResolvers;

    ensurePdfJsRuntimeCompatibility();

    const capability = Promise.withResolvers<string>();
    capability.resolve('ready');
    await expect(capability.promise).resolves.toBe('ready');
  });

  it('should install Response.bytes when missing', async () => {
    delete (Response.prototype as Response & { bytes?: unknown }).bytes;

    ensurePdfJsRuntimeCompatibility();

    const bytes = await new Response('pdf').bytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(bytes)).toEqual([112, 100, 102]);
  });

  it('should not overwrite native compatibility APIs', () => {
    const existingWithResolvers = vi.fn(() => ({
      promise: Promise.resolve('native'),
      resolve: vi.fn(),
      reject: vi.fn(),
    }));
    const existingBytes = vi.fn(async () => new Uint8Array([1, 2, 3]));

    Object.defineProperty(Promise, 'withResolvers', {
      configurable: true,
      writable: true,
      value: existingWithResolvers,
    });
    Object.defineProperty(Response.prototype, 'bytes', {
      configurable: true,
      writable: true,
      value: existingBytes,
    });

    ensurePdfJsRuntimeCompatibility();

    expect(Promise.withResolvers).toBe(existingWithResolvers);
    expect(Response.prototype.bytes).toBe(existingBytes);
  });

  it('should pass Uint8Array data and disable workers for PDF.js getDocument', async () => {
    const file = createFile('%PDF-1.4', 'test.pdf', 'application/pdf');
    const lines = await extractTextFromPDF(file);

    expect(lines).toEqual(['hello pdf']);
    expect(pdfMocks.getDocument).toHaveBeenCalledTimes(1);
    const firstArg = pdfMocks.getDocument.mock.calls[0][0] as { data?: unknown; disableWorker?: unknown };
    expect(firstArg.data).toBeInstanceOf(Uint8Array);
    expect(firstArg.disableWorker).toBe(true);
  });
});

// ─── Levenshtein & Similarity ────────────────────────────────────────────────

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('abc', 'abc')).toBe(0);
  });

  it('should return length of other string when one is empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('should compute correct distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
  });

  it('should return 1 for single character difference', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
  });
});

describe('computeLineSimilarity', () => {
  it('should return 1.0 for identical strings', () => {
    expect(computeLineSimilarity('hello', 'hello')).toBe(1);
  });

  it('should return 0 for completely different strings of equal length', () => {
    const sim = computeLineSimilarity('aaaa', 'zzzz');
    expect(sim).toBe(0);
  });

  it('should return high similarity for minor changes', () => {
    const sim = computeLineSimilarity('hello world', 'hello World');
    expect(sim).toBeGreaterThan(0.8);
  });

  it('should return 1 for two empty strings', () => {
    expect(computeLineSimilarity('', '')).toBe(1);
  });
});

// ─── LCS Diff Algorithm ─────────────────────────────────────────────────────

describe('computeLCS', () => {
  it('should produce all "same" for identical arrays', () => {
    const lines = ['a', 'b', 'c'];
    const result = computeLCS(lines, [...lines], defaultOpts);
    expect(result.every(d => d.type === 'same')).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('should detect added lines', () => {
    const a = ['line 1', 'line 3'];
    const b = ['line 1', 'line 2', 'line 3'];
    const result = computeLCS(a, b, defaultOpts);
    const added = result.filter(d => d.type === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].content).toBe('line 2');
  });

  it('should detect removed lines', () => {
    const a = ['line 1', 'line 2', 'line 3'];
    const b = ['line 1', 'line 3'];
    const result = computeLCS(a, b, defaultOpts);
    const removed = result.filter(d => d.type === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].content).toBe('line 2');
  });

  it('should detect modified lines when above threshold', () => {
    const a = ['hello world'];
    const b = ['hello World'];
    const result = computeLCS(a, b, { ...defaultOpts, similarityThreshold: 0.5 });
    const modified = result.filter(d => d.type === 'modified');
    expect(modified).toHaveLength(1);
    expect(modified[0].oldContent).toBe('hello world');
    expect(modified[0].content).toBe('hello World');
    expect(modified[0].similarity).toBeGreaterThan(80);
  });

  it('should NOT merge as modified when below threshold', () => {
    const a = ['completely different text'];
    const b = ['xyz abc 123 !@#'];
    const result = computeLCS(a, b, { ...defaultOpts, similarityThreshold: 0.9 });
    const modified = result.filter(d => d.type === 'modified');
    expect(modified).toHaveLength(0);
  });

  it('should handle empty arrays', () => {
    expect(computeLCS([], [], defaultOpts)).toEqual([]);
    const result = computeLCS(['a'], [], defaultOpts);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('removed');
  });

  it('should handle ignoreWhitespace option', () => {
    const a = ['  hello  world  '];
    const b = ['hello world'];
    const result = computeLCS(a, b, { ...defaultOpts, ignoreWhitespace: true });
    expect(result[0].type).toBe('same');
  });

  it('should handle ignoreCase option', () => {
    const a = ['Hello World'];
    const b = ['hello world'];
    const result = computeLCS(a, b, { ...defaultOpts, ignoreCase: true });
    expect(result[0].type).toBe('same');
  });

  it('should correctly number lines', () => {
    const a = ['a', 'b', 'c'];
    const b = ['a', 'x', 'c'];
    const result = computeLCS(a, b, { ...defaultOpts, similarityThreshold: 0.1 });
    const same1 = result.find(d => d.content === 'a');
    expect(same1?.lineNumber1).toBe(1);
    expect(same1?.lineNumber2).toBe(1);
    const same3 = result.find(d => d.content === 'c');
    expect(same3?.lineNumber1).toBe(3);
    expect(same3?.lineNumber2).toBe(3);
  });
});

// ─── compareFiles (integration — text files only) ────────────────────────────

describe('compareFiles', () => {
  it('should compare two identical text files', async () => {
    const content = 'line 1\nline 2\nline 3';
    const f1 = createFile(content, 'a.txt');
    const f2 = createFile(content, 'b.txt');
    const result = await compareFiles(f1, f2);

    expect(result.similarity).toBe(100);
    expect(result.stats.sameLines).toBe(3);
    expect(result.stats.addedLines).toBe(0);
    expect(result.stats.removedLines).toBe(0);
    expect(result.stats.modifiedLines).toBe(0);
    expect(result.file1.name).toBe('a.txt');
    expect(result.file2.name).toBe('b.txt');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should compare two completely different text files', async () => {
    const f1 = createFile('alpha\nbeta\ngamma', 'a.txt');
    const f2 = createFile('one\ntwo\nthree', 'b.txt');
    const result = await compareFiles(f1, f2);

    expect(result.similarity).toBeLessThan(50);
    expect(result.stats.sameLines).toBe(0);
  });

  it('should compare files with additions', async () => {
    const f1 = createFile('a\nc', 'a.txt');
    const f2 = createFile('a\nb\nc', 'b.txt');
    const result = await compareFiles(f1, f2);

    expect(result.stats.addedLines).toBe(1);
    expect(result.stats.sameLines).toBe(2);
  });

  it('should compare files with removals', async () => {
    const f1 = createFile('a\nb\nc', 'a.txt');
    const f2 = createFile('a\nc', 'b.txt');
    const result = await compareFiles(f1, f2);

    expect(result.stats.removedLines).toBe(1);
    expect(result.stats.sameLines).toBe(2);
  });

  it('should compare JSON files with normalization', async () => {
    const f1 = createFile('{"z":1,"a":2}', 'a.json', 'application/json');
    const f2 = createFile('{"a":2,"z":1}', 'b.json', 'application/json');
    const result = await compareFiles(f1, f2, { normalizeJson: true });

    expect(result.similarity).toBe(100);
  });

  it('should respect ignoreBlankLines option', async () => {
    const f1 = createFile('a\n\nb', 'a.txt');
    const f2 = createFile('a\nb', 'b.txt');
    const result = await compareFiles(f1, f2, { ignoreBlankLines: true });

    expect(result.similarity).toBe(100);
    expect(result.stats.sameLines).toBe(2);
  });

  it('should handle empty file vs non-empty file', async () => {
    const f1 = createFile('', 'empty.txt');
    const f2 = createFile('some content', 'content.txt');
    const result = await compareFiles(f1, f2, { ignoreBlankLines: true });

    expect(result.similarity).toBe(0);
  });

  it('should throw for unsupported formats', async () => {
    const f1 = createFile('', 'file.zip', 'application/zip');
    const f2 = createFile('', 'file.zip', 'application/zip');
    await expect(compareFiles(f1, f2)).rejects.toThrow('Unsupported file format');
  });

  it('should populate file metadata correctly', async () => {
    const f1 = createFile('hello\nworld', 'test1.txt');
    const f2 = createFile('hello\nearth', 'test2.txt');
    const result = await compareFiles(f1, f2);

    expect(result.file1.name).toBe('test1.txt');
    expect(result.file2.name).toBe('test2.txt');
    expect(result.file1.type).toBe('plain');
    expect(result.file2.type).toBe('plain');
    expect(result.file1.lineCount).toBe(2);
    expect(result.file2.lineCount).toBe(2);
    expect(result.file1.extractedAt).toBeGreaterThan(0);
  });
});

// ─── Export Utilities ────────────────────────────────────────────────────────

describe('exportAsUnifiedDiff', () => {
  it('should produce valid unified diff format', async () => {
    const f1 = createFile('same\nold line\nkeep', 'a.txt');
    const f2 = createFile('same\nnew line\nkeep', 'b.txt');
    const result = await compareFiles(f1, f2);
    const diff = exportAsUnifiedDiff(result);

    expect(diff).toContain('--- a.txt');
    expect(diff).toContain('+++ b.txt');
    expect(diff).toContain('same');
  });
});

describe('exportAsHTML', () => {
  it('should produce valid HTML', async () => {
    const f1 = createFile('hello', 'a.txt');
    const f2 = createFile('world', 'b.txt');
    const result = await compareFiles(f1, f2);
    const html = exportAsHTML(result);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('a.txt');
    expect(html).toContain('b.txt');
    expect(html).toContain('<table>');
  });

  it('should escape HTML entities', async () => {
    const f1 = createFile('<script>alert("xss")</script>', 'a.txt');
    const f2 = createFile('<b>bold</b>', 'b.txt');
    const result = await compareFiles(f1, f2);
    const html = exportAsHTML(result);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('exportAsJSON', () => {
  it('should produce valid JSON string', async () => {
    const f1 = createFile('a\nb', 'a.txt');
    const f2 = createFile('a\nc', 'b.txt');
    const result = await compareFiles(f1, f2);
    const json = exportAsJSON(result);

    const parsed = JSON.parse(json);
    expect(parsed.similarity).toBeDefined();
    expect(parsed.stats).toBeDefined();
    expect(parsed.diffLines).toBeDefined();
    expect(parsed.file1.name).toBe('a.txt');
  });
});
