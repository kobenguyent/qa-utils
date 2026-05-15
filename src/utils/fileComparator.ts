// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ComparisonOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreBlankLines: boolean;
  similarityThreshold: number;
  normalizeJson: boolean;
  sheetIndex: number;
}

export const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreBlankLines: false,
  similarityThreshold: 0.6,
  normalizeJson: true,
  sheetIndex: 0,
};

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lineCount: number;
  extractedAt: number;
}

export interface ComparisonResult {
  file1: FileMetadata;
  file2: FileMetadata;
  diffLines: DiffLine[];
  stats: ComparisonStats;
  similarity: number;
  duration: number;
}

export interface DiffLine {
  type: 'same' | 'added' | 'removed' | 'modified';
  lineNumber1?: number;
  lineNumber2?: number;
  content: string;
  oldContent?: string;
  similarity?: number;
}

export interface ComparisonStats {
  totalLines: number;
  sameLines: number;
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  similarityPercentage: number;
}

// ─── Format Detection ────────────────────────────────────────────────────────

type SupportedFormat = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json' | 'plain';

const EXTENSION_MAP: Record<string, SupportedFormat> = {
  pdf: 'pdf',
  docx: 'docx',
  xlsx: 'xlsx',
  xls: 'xlsx',
  csv: 'csv',
  tsv: 'csv',
  json: 'json',
  txt: 'plain',
  log: 'plain',
  md: 'plain',
  html: 'plain',
  htm: 'plain',
  xml: 'plain',
  yaml: 'plain',
  yml: 'plain',
  ini: 'plain',
  cfg: 'plain',
  conf: 'plain',
  env: 'plain',
  sh: 'plain',
  bat: 'plain',
  py: 'plain',
  js: 'plain',
  ts: 'plain',
  jsx: 'plain',
  tsx: 'plain',
  css: 'plain',
  scss: 'plain',
  sql: 'plain',
  java: 'plain',
  rb: 'plain',
  go: 'plain',
  rs: 'plain',
  c: 'plain',
  cpp: 'plain',
  h: 'plain',
  swift: 'plain',
  kt: 'plain',
  php: 'plain',
};

export function detectFormat(file: File): SupportedFormat {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mapped = EXTENSION_MAP[ext];
  if (mapped) return mapped;

  // Fallback to MIME type
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel') return 'xlsx';
  if (file.type === 'text/csv') return 'csv';
  if (file.type === 'application/json') return 'json';
  if (file.type.startsWith('text/')) return 'plain';

  throw new Error(`Unsupported file format: .${ext || 'unknown'} (${file.type || 'no MIME type'}). Supported: PDF, DOCX, XLSX, CSV, JSON, TXT, and other text formats.`);
}

export function getSupportedExtensions(): string[] {
  return Object.keys(EXTENSION_MAP);
}

// ─── Text Extractors ─────────────────────────────────────────────────────────

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

export async function extractTextFromPlain(file: File): Promise<string[]> {
  const text = await readFileAsText(file);
  return text.split('\n');
}

export async function extractTextFromJSON(file: File, normalize: boolean): Promise<string[]> {
  const text = await readFileAsText(file);
  try {
    const parsed = JSON.parse(text);
    const formatted = normalize
      ? JSON.stringify(parsed, Object.keys(parsed).sort(), 2)
      : JSON.stringify(parsed, null, 2);
    return formatted.split('\n');
  } catch {
    // If JSON is invalid, treat as plain text
    return text.split('\n');
  }
}

export async function extractTextFromCSV(file: File): Promise<string[]> {
  const text = await readFileAsText(file);
  return parseCSVToLines(text);
}

/** RFC 4180-compliant CSV parser that normalizes rows into readable lines */
function parseCSVToLines(text: string): string[] {
  const lines: string[] = [];
  const rows = parseCSVRows(text);

  for (const row of rows) {
    lines.push(row.join(' | '));
  }

  return lines;
}

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === '\t') {
        row.push(current.trim());
        current = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        row.push(current.trim());
        if (row.some(cell => cell !== '')) {
          rows.push(row);
        }
        row = [];
        current = '';
        if (char === '\r') i++; // skip \n in \r\n
      } else {
        current += char;
      }
    }
  }

  // Last row
  row.push(current.trim());
  if (row.some(cell => cell !== '')) {
    rows.push(row);
  }

  return rows;
}

export async function extractTextFromPDF(file: File): Promise<string[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;

    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const lines: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = textContent.items
        .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
        .join('');
      const pageLines = pageText.split('\n').filter((l: string) => l.trim() !== '');
      if (pageLines.length > 0) {
        lines.push(...pageLines);
      } else if (pageText.trim()) {
        lines.push(pageText.trim());
      }
    }

    return lines.length > 0 ? lines : ['(Empty PDF — no extractable text)'];
  } catch (err) {
    throw new Error(`Failed to extract text from PDF: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function extractTextFromDOCX(file: File): Promise<string[]> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });
    const lines = result.value.split('\n').filter((l: string) => l !== '');
    return lines.length > 0 ? lines : ['(Empty document — no extractable text)'];
  } catch (err) {
    throw new Error(`Failed to extract text from DOCX: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function extractTextFromXLSX(file: File, sheetIndex: number): Promise<string[]> {
  try {
    const XLSX = await import('xlsx');
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[sheetIndex];
    if (!sheetName) {
      throw new Error(`Sheet index ${sheetIndex} not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
    const lines = rows
      .filter((row: string[]) => row.some((cell: string) => cell !== undefined && cell !== null && String(cell).trim() !== ''))
      .map((row: string[]) => row.map((cell: string) => (cell !== undefined && cell !== null ? String(cell) : '')).join(' | '));

    return lines.length > 0 ? lines : ['(Empty spreadsheet — no data)'];
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Sheet index')) throw err;
    throw new Error(`Failed to extract text from XLSX: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Extraction Router ───────────────────────────────────────────────────────

export async function extractText(file: File, options: ComparisonOptions): Promise<string[]> {
  const format = detectFormat(file);

  let lines: string[];
  switch (format) {
    case 'pdf':
      lines = await extractTextFromPDF(file);
      break;
    case 'docx':
      lines = await extractTextFromDOCX(file);
      break;
    case 'xlsx':
      lines = await extractTextFromXLSX(file, options.sheetIndex);
      break;
    case 'csv':
      lines = await extractTextFromCSV(file);
      break;
    case 'json':
      lines = await extractTextFromJSON(file, options.normalizeJson);
      break;
    case 'plain':
    default:
      lines = await extractTextFromPlain(file);
      break;
  }

  // Apply pre-processing options
  if (options.ignoreBlankLines) {
    lines = lines.filter(line => line.trim() !== '');
  }

  return lines;
}

// ─── Diff Algorithm (LCS-based) ──────────────────────────────────────────────

export function computeLCS(a: string[], b: string[], options: ComparisonOptions): DiffLine[] {
  const normalize = (s: string): string => {
    let result = s;
    if (options.ignoreWhitespace) result = result.replace(/\s+/g, ' ').trim();
    if (options.ignoreCase) result = result.toLowerCase();
    return result;
  };

  const m = a.length;
  const n = b.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalize(a[i - 1]) === normalize(b[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const rawDiff: Array<{ type: 'same' | 'removed' | 'added'; indexA: number; indexB: number }> = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalize(a[i - 1]) === normalize(b[j - 1])) {
      rawDiff.unshift({ type: 'same', indexA: i - 1, indexB: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.unshift({ type: 'added', indexA: -1, indexB: j - 1 });
      j--;
    } else {
      rawDiff.unshift({ type: 'removed', indexA: i - 1, indexB: -1 });
      i--;
    }
  }

  // Post-process: detect "modified" lines (adjacent removed + added with high similarity)
  const diffLines: DiffLine[] = [];
  let idx = 0;

  while (idx < rawDiff.length) {
    const entry = rawDiff[idx];

    if (entry.type === 'removed' && idx + 1 < rawDiff.length && rawDiff[idx + 1].type === 'added') {
      const removedLine = a[entry.indexA];
      const addedLine = b[rawDiff[idx + 1].indexB];
      const sim = computeLineSimilarity(normalize(removedLine), normalize(addedLine));

      if (sim >= options.similarityThreshold) {
        diffLines.push({
          type: 'modified',
          lineNumber1: entry.indexA + 1,
          lineNumber2: rawDiff[idx + 1].indexB + 1,
          content: addedLine,
          oldContent: removedLine,
          similarity: Math.round(sim * 100),
        });
        idx += 2;
        continue;
      }
    }

    if (entry.type === 'same') {
      diffLines.push({
        type: 'same',
        lineNumber1: entry.indexA + 1,
        lineNumber2: entry.indexB + 1,
        content: a[entry.indexA],
      });
    } else if (entry.type === 'removed') {
      diffLines.push({
        type: 'removed',
        lineNumber1: entry.indexA + 1,
        content: a[entry.indexA],
      });
    } else {
      diffLines.push({
        type: 'added',
        lineNumber2: entry.indexB + 1,
        content: b[entry.indexB],
      });
    }

    idx++;
  }

  return diffLines;
}

// ─── Similarity Scoring ──────────────────────────────────────────────────────

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Use two-row optimization for space efficiency
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

export function computeLineSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function computeStats(diffLines: DiffLine[]): ComparisonStats {
  const sameLines = diffLines.filter(d => d.type === 'same').length;
  const addedLines = diffLines.filter(d => d.type === 'added').length;
  const removedLines = diffLines.filter(d => d.type === 'removed').length;
  const modifiedEntries = diffLines.filter(d => d.type === 'modified');
  const modifiedLines = modifiedEntries.length;
  const totalLines = diffLines.length;

  // Similarity: same lines count fully, modified lines count proportionally
  const modifiedSimilaritySum = modifiedEntries.reduce((sum, d) => sum + (d.similarity || 0) / 100, 0);
  const effectiveSame = sameLines + modifiedSimilaritySum;
  const maxLines = Math.max(totalLines, 1);
  const similarityPercentage = Math.round((effectiveSame / maxLines) * 100);

  return {
    totalLines,
    sameLines,
    addedLines,
    removedLines,
    modifiedLines,
    similarityPercentage: Math.min(100, Math.max(0, similarityPercentage)),
  };
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export async function compareFiles(
  file1: File,
  file2: File,
  options: Partial<ComparisonOptions> = {}
): Promise<ComparisonResult> {
  const opts: ComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS, ...options };
  const startTime = performance.now();

  // Extract text from both files in parallel
  const [lines1, lines2] = await Promise.all([
    extractText(file1, opts),
    extractText(file2, opts),
  ]);

  // Compute diff
  const diffLines = computeLCS(lines1, lines2, opts);
  const stats = computeStats(diffLines);
  const duration = Math.round(performance.now() - startTime);

  return {
    file1: {
      name: file1.name,
      size: file1.size,
      type: detectFormat(file1),
      lineCount: lines1.length,
      extractedAt: Date.now(),
    },
    file2: {
      name: file2.name,
      size: file2.size,
      type: detectFormat(file2),
      lineCount: lines2.length,
      extractedAt: Date.now(),
    },
    diffLines,
    stats,
    similarity: stats.similarityPercentage,
    duration,
  };
}

// ─── Export Utilities ─────────────────────────────────────────────────────────

export function exportAsUnifiedDiff(result: ComparisonResult): string {
  const lines: string[] = [
    `--- ${result.file1.name}`,
    `+++ ${result.file2.name}`,
    `@@ Similarity: ${result.similarity}% | Same: ${result.stats.sameLines} | Added: ${result.stats.addedLines} | Removed: ${result.stats.removedLines} | Modified: ${result.stats.modifiedLines} @@`,
    '',
  ];

  for (const diff of result.diffLines) {
    switch (diff.type) {
      case 'same':
        lines.push(`  ${diff.content}`);
        break;
      case 'added':
        lines.push(`+ ${diff.content}`);
        break;
      case 'removed':
        lines.push(`- ${diff.content}`);
        break;
      case 'modified':
        lines.push(`- ${diff.oldContent}`);
        lines.push(`+ ${diff.content}`);
        break;
    }
  }

  return lines.join('\n');
}

export function exportAsHTML(result: ComparisonResult): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const rows = result.diffLines.map(diff => {
    const cls = diff.type;
    switch (diff.type) {
      case 'same':
        return `<tr class="${cls}"><td class="ln">${diff.lineNumber1}</td><td>${escapeHtml(diff.content)}</td><td class="ln">${diff.lineNumber2}</td><td>${escapeHtml(diff.content)}</td></tr>`;
      case 'removed':
        return `<tr class="${cls}"><td class="ln">${diff.lineNumber1}</td><td>${escapeHtml(diff.content)}</td><td class="ln"></td><td></td></tr>`;
      case 'added':
        return `<tr class="${cls}"><td class="ln"></td><td></td><td class="ln">${diff.lineNumber2}</td><td>${escapeHtml(diff.content)}</td></tr>`;
      case 'modified':
        return `<tr class="${cls}"><td class="ln">${diff.lineNumber1}</td><td>${escapeHtml(diff.oldContent || '')}</td><td class="ln">${diff.lineNumber2}</td><td>${escapeHtml(diff.content)}</td></tr>`;
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>File Comparison: ${escapeHtml(result.file1.name)} vs ${escapeHtml(result.file2.name)}</title>
<style>
  body{font-family:monospace;margin:20px;background:#1e1e2e;color:#cdd6f4}
  h2{color:#89b4fa}
  table{width:100%;border-collapse:collapse}
  td{padding:2px 8px;border:1px solid #313244;white-space:pre-wrap;word-break:break-all}
  .ln{width:40px;text-align:right;color:#6c7086;user-select:none}
  .same td{background:#1e1e2e}
  .added td:nth-child(3),.added td:nth-child(4){background:#1e3a2a}
  .removed td:nth-child(1),.removed td:nth-child(2){background:#3a1e1e}
  .modified td:nth-child(1),.modified td:nth-child(2){background:#3a351e}
  .modified td:nth-child(3),.modified td:nth-child(4){background:#1e3a35}
  .stats{display:flex;gap:16px;margin:12px 0;flex-wrap:wrap}
  .stat{padding:6px 12px;border-radius:6px;font-size:14px}
  .stat-same{background:#1e3a2a;color:#a6e3a1}
  .stat-added{background:#1e3a2a;color:#94e2d5}
  .stat-removed{background:#3a1e1e;color:#f38ba8}
  .stat-modified{background:#3a351e;color:#f9e2af}
</style></head><body>
<h2>File Comparison</h2>
<p><strong>${escapeHtml(result.file1.name)}</strong> vs <strong>${escapeHtml(result.file2.name)}</strong></p>
<div class="stats">
  <span class="stat stat-same">Similarity: ${result.similarity}%</span>
  <span class="stat stat-same">Same: ${result.stats.sameLines}</span>
  <span class="stat stat-added">Added: ${result.stats.addedLines}</span>
  <span class="stat stat-removed">Removed: ${result.stats.removedLines}</span>
  <span class="stat stat-modified">Modified: ${result.stats.modifiedLines}</span>
</div>
<table>
<thead><tr><th class="ln">#</th><th>${escapeHtml(result.file1.name)}</th><th class="ln">#</th><th>${escapeHtml(result.file2.name)}</th></tr></thead>
<tbody>${rows}</tbody>
</table></body></html>`;
}

export function exportAsJSON(result: ComparisonResult): string {
  return JSON.stringify(result, null, 2);
}
