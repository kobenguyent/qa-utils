# File Comparator — Implementation Plan

> **Status**: ✅ Complete  
> **Route**: `#/file-comparator`  
> **Category**: Tools  
> **Priority**: High  
> **Estimated effort**: ~3–4 days  

---

## 1. Overview

### 1.1 Problem Statement

QA engineers and developers frequently need to compare two versions of a file — configuration diffs, exported reports, translated documents, migrated data. Existing tools (e.g., `diff`, Beyond Compare) are external desktop applications that don't integrate with the QA Utils workflow or support structured file formats natively.

### 1.2 Solution

A browser-based file comparison tool that:

- Accepts **two files** of the same or different formats
- Extracts text content from structured formats (PDF, DOCX, XLSX, CSV)
- Produces a **line-by-line diff** with three classification levels:
  - **Same** — identical lines
  - **Similar** — lines with minor changes (threshold-configurable)
  - **Different** — added or removed lines
- Displays results in **side-by-side** or **unified** view
- Computes an overall **similarity percentage**
- Runs entirely in the browser — no server needed

### 1.3 Supported Formats

| Format | Extension(s) | Parser |
|--------|-------------|--------|
| Plain text | `.txt`, `.log`, `.md`, `.html`, `.xml`, `.yaml`, `.yml` | `FileReader.readAsText()` |
| JSON | `.json` | `FileReader.readAsText()` + `JSON.stringify` (pretty) |
| CSV / TSV | `.csv`, `.tsv` | Custom parser (RFC 4180 compliant) |
| PDF | `.pdf` | `pdfjs-dist` (existing dependency) |
| Word Document | `.docx` | `mammoth` (new dependency) |
| Excel Spreadsheet | `.xlsx`, `.xls` | `xlsx` / SheetJS (new dependency) |

### 1.4 Target Users

- QA engineers validating data migration outputs
- Developers comparing configuration files across environments
- Technical writers reviewing document revisions
- Anyone needing quick structural diff without installing desktop tools

---

## 2. Technical Architecture

### 2.1 System Design

```
┌─────────────────────────────────────────────────────────┐
│                    FileComparator.tsx                     │
│  (UI: upload, options, results display)                  │
├─────────────────────────────────────────────────────────┤
│                    fileComparator.ts                      │
│  (Core logic: extraction, diffing, scoring)              │
├──────────────┬──────────────┬───────────────────────────┤
│ PDF Parser   │ DOCX Parser  │ XLSX Parser │ Text Parser │
│ (pdfjs-dist) │ (mammoth)    │ (xlsx)      │ (native)    │
└──────────────┴──────────────┴─────────────┴─────────────┘
```

### 2.2 Data Flow

```
File A ──► extractText(file) ──► string[] (lines)
                                        │
                                        ▼
                                  computeDiff(linesA, linesB)
                                        │
                                        ▼
File B ──► extractText(file) ──► string[] (lines)
                                        │
                                        ▼
                              ComparisonResult {
                                diffLines, stats, similarity
                              }
                                        │
                                        ▼
                              Render in UI (side-by-side / unified)
```

### 2.3 Core Interfaces

```typescript
// ─── Input ───────────────────────────────────────────────────────────────────

export interface ComparisonOptions {
  /** Ignore leading/trailing whitespace when comparing */
  ignoreWhitespace: boolean;
  /** Case-insensitive comparison */
  ignoreCase: boolean;
  /** Skip empty/blank lines */
  ignoreBlankLines: boolean;
  /** Similarity threshold (0–1) for classifying a line as "modified" vs "added+removed" */
  similarityThreshold: number;
  /** For JSON: sort keys before comparing */
  normalizeJson: boolean;
  /** For CSV/XLSX: which sheet to compare (0-indexed) */
  sheetIndex: number;
}

// ─── Output ──────────────────────────────────────────────────────────────────

export interface ComparisonResult {
  file1: FileMetadata;
  file2: FileMetadata;
  diffLines: DiffLine[];
  stats: ComparisonStats;
  similarity: number; // 0–100
  duration: number;   // ms
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lineCount: number;
  extractedAt: number;
}

export interface DiffLine {
  type: 'same' | 'added' | 'removed' | 'modified';
  lineNumber1?: number;
  lineNumber2?: number;
  content: string;
  oldContent?: string;
  similarity?: number; // 0–100, only for 'modified'
}

export interface ComparisonStats {
  totalLines: number;
  sameLines: number;
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  similarityPercentage: number;
}
```

### 2.4 Algorithm Details

#### Line-Level Diff — Longest Common Subsequence (LCS)

- Standard dynamic programming approach: O(m × n) time and space
- For files > 10,000 lines: use Myers' diff algorithm (linear space optimization)
- Output: sequence of operations (keep / insert / delete)

#### Similarity Detection — Levenshtein Ratio

For pairs of lines that are "delete from A" + "insert into B" and are adjacent:

```
ratio = 1 - (levenshteinDistance(lineA, lineB) / max(lineA.length, lineB.length))
```

- If `ratio >= similarityThreshold` (default 0.6) → classify as **modified**
- Otherwise → keep as separate **added** + **removed**

#### Overall Similarity Score

```
similarity = (sameLines + modifiedLines × avgModifiedSimilarity) / totalLines × 100
```

---

## 3. Implementation Phases

### Phase 1: Core Utility Module

**Deliverable**: `src/utils/fileComparator.ts` — fully tested, no UI dependency

#### Steps

1. **Create file** `src/utils/fileComparator.ts`
2. **Implement text extractors**:
   - `extractTextFromPDF(file: File): Promise<string[]>` — reuse pattern from `knowledgeManager.ts`
   - `extractTextFromDOCX(file: File): Promise<string[]>` — via `mammoth`
   - `extractTextFromXLSX(file: File, sheetIndex: number): Promise<string[]>` — via `xlsx`
   - `extractTextFromCSV(file: File): Promise<string[]>` — custom RFC 4180 parser
   - `extractTextFromPlain(file: File): Promise<string[]>` — native FileReader
   - `extractTextFromJSON(file: File, normalize: boolean): Promise<string[]>` — parse + stringify
3. **Implement router** `extractText(file: File, options: ComparisonOptions): Promise<string[]>`
   - Detect format from extension + MIME type
   - Dispatch to correct extractor
4. **Implement LCS diff** `computeLCS(a: string[], b: string[]): DiffLine[]`
5. **Implement similarity scoring** using Levenshtein distance
6. **Implement main entry** `compareFiles(file1: File, file2: File, options: ComparisonOptions): Promise<ComparisonResult>`
7. **Export** all interfaces and the main class/functions

#### Exit Criteria
- All extractors handle valid + empty + malformed input gracefully
- Diff produces correct output for known test vectors
- No browser APIs used outside of `File` / `FileReader` / dynamic imports

---

### Phase 2: Unit Tests

**Deliverable**: `src/utils/__tests__/fileComparator.test.ts`

#### Test Cases

| Category | Test |
|----------|------|
| **Extraction** | Plain text file reads correctly |
| | JSON file is pretty-printed before diffing |
| | CSV with quoted commas parses correctly |
| | Unsupported format throws descriptive error |
| **Diffing** | Two identical files → 100% similarity, all "same" |
| | Completely different files → 0% similarity |
| | Single line added → one "added" entry |
| | Single line removed → one "removed" entry |
| | Modified line detected when above threshold |
| | Modified line NOT detected when below threshold |
| **Options** | `ignoreWhitespace` trims before comparing |
| | `ignoreCase` lowercases before comparing |
| | `ignoreBlankLines` filters empty lines |
| | `normalizeJson` sorts keys |
| **Edge cases** | Empty file vs non-empty file |
| | Very large file (>10K lines) completes in <5s |
| | Binary file rejection with clear error message |

#### Mocking Strategy
- PDF/DOCX/XLSX extractors: mock the library imports, test integration separately
- Text/CSV/JSON: use real `File` constructor with string data

---

### Phase 3: Install Dependencies

**Deliverable**: Updated `package.json` with new packages

```bash
npm install mammoth xlsx
```

| Package | Version | Purpose | Bundle impact |
|---------|---------|---------|---------------|
| `mammoth` | ^1.8.0 | DOCX → plain text/HTML | ~50 KB gzip |
| `xlsx` | ^0.18.5 | XLSX/XLS → JSON/text | ~90 KB gzip |

> Both are lazy-imported (`import()`) to avoid impacting initial bundle size.

---

### Phase 4: UI Component

**Deliverable**: `src/components/utils/FileComparator.tsx`

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ToolPageLayout (icon: 🔍, title: "File Comparator")        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   DROP FILE 1 HERE  │  │   DROP FILE 2 HERE  │          │
│  │   (or click to      │  │   (or click to      │          │
│  │    browse)          │  │    browse)          │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────┐        │
│  │ Options:                                         │        │
│  │ ☑ Ignore whitespace  ☐ Ignore case              │        │
│  │ ☐ Ignore blank lines  Threshold: [0.6]          │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
│  [ Compare Files ]                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RESULTS                                                    │
│  ┌─────────────────────────────────────────────────┐        │
│  │ Similarity: ████████░░ 78%                       │        │
│  │ Same: 156  Added: 12  Removed: 8  Modified: 24  │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
│  View: [Side-by-Side] [Unified]          [Export ▼]         │
│                                                             │
│  ┌────────────────────┬────────────────────┐                │
│  │ File 1             │ File 2             │                │
│  │ 1  same line       │ 1  same line       │                │
│  │ 2  - removed line  │ 2  + added line    │                │
│  │ 3  ~ modified old  │ 3  ~ modified new  │                │
│  │ 4  same line       │ 4  same line       │                │
│  └────────────────────┴────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

#### UI Features

| Feature | Implementation |
|---------|---------------|
| Drag & drop | HTML5 `ondragover`/`ondrop` with visual feedback |
| File type badges | Show detected format + icon after upload |
| Progress indicator | `ProgressBar` during extraction + diffing |
| Syntax highlighting | Color-coded diff lines (green/red/yellow/gray) |
| Line numbers | Gutter with aligned line numbers for both files |
| Scroll sync | Side-by-side panels scroll together |
| Export | Download as `.diff`, `.html` (styled), or `.json` |
| Keyboard shortcuts | `Ctrl+Enter` to compare, `Ctrl+E` to export |

#### Component State

```typescript
interface FileComparatorState {
  file1: File | null;
  file2: File | null;
  options: ComparisonOptions;
  result: ComparisonResult | null;
  loading: boolean;
  error: string | null;
  viewMode: 'side-by-side' | 'unified';
  highlightMode: 'line' | 'word';
}
```

---

### Phase 5: Route & Navigation Registration

**Deliverable**: Tool accessible via URL and navigation menu

#### 5.1 Route (`src/main.tsx`)

```typescript
// Add lazy import (alphabetical order with other file-related tools)
const FileComparator = lazy(() => 
  import('./components/utils/FileComparator.tsx')
    .then(module => ({ default: module.FileComparator }))
);

// Add route entry
{
  path: 'file-comparator',
  element: <RouteWrapper><FileComparator /></RouteWrapper>
}
```

#### 5.2 Navigation (`src/config/navigationConfig.ts`)

```typescript
{
  title: 'File Comparator',
  description: 'Compare two files side-by-side — find same, similar, and different content across PDF, CSV, DOCX, XLSX, and more',
  path: '#/file-comparator',
  category: 'Testing Tools',
  keywords: [
    'file', 'compare', 'comparator', 'diff', 'difference', 'similar',
    'same', 'pdf', 'csv', 'docx', 'xlsx', 'text', 'side-by-side',
    'merge', 'changes', 'version', 'delta',
  ],
  icon: '🔍',
  navGroups: ['Tools'],
  navLabel: 'File Comparator',
}
```

---

### Phase 6: Integration Testing & QA

**Deliverable**: Verified working feature with real-world files

#### Manual Test Matrix

| Scenario | File 1 | File 2 | Expected |
|----------|--------|--------|----------|
| Identical TXT | `a.txt` | `a.txt` (copy) | 100% similarity |
| Small change TXT | `v1.txt` | `v2.txt` (1 line edit) | ~95% similarity, 1 modified |
| PDF comparison | `report_v1.pdf` | `report_v2.pdf` | Structural diff shown |
| CSV data diff | `export_jan.csv` | `export_feb.csv` | Row-level changes |
| DOCX revision | `doc_draft.docx` | `doc_final.docx` | Paragraph-level diff |
| XLSX sheet diff | `data_q1.xlsx` | `data_q2.xlsx` | Cell value changes |
| Cross-format | `data.csv` | `data.xlsx` | Text extraction + compare |
| Large file (>5MB) | Large PDF | Large PDF | Completes without crash |
| Empty file | `empty.txt` | `content.txt` | 0% similarity |
| Unsupported format | `file.zip` | `file.zip` | Clear error message |

#### Performance Targets

| Metric | Target |
|--------|--------|
| Text extraction (< 1MB file) | < 1 second |
| Diff computation (< 1000 lines) | < 500ms |
| Diff computation (< 10,000 lines) | < 3 seconds |
| UI render (< 5000 diff lines) | < 1 second |
| Memory usage | < 200MB for any single comparison |

---

## 4. File Manifest

### New Files

| Path | Purpose |
|------|---------|
| `src/utils/fileComparator.ts` | Core comparison engine |
| `src/utils/__tests__/fileComparator.test.ts` | Unit tests |
| `src/components/utils/FileComparator.tsx` | React UI component |
| `docs/plans/file-comparator.md` | This plan document |

### Modified Files

| Path | Change |
|------|--------|
| `src/main.tsx` | Add lazy import + route entry |
| `src/config/navigationConfig.ts` | Add nav item |
| `package.json` | Add `mammoth`, `xlsx` dependencies |

---

## 5. Dependencies

### New Runtime Dependencies

| Package | Version | License | Weekly Downloads | Justification |
|---------|---------|---------|-----------------|---------------|
| `mammoth` | ^1.8.0 | BSD-2 | ~500K | Industry standard for DOCX text extraction in JS |
| `xlsx` | ^0.18.5 | Apache-2.0 | ~2M | Most popular XLSX parser for JavaScript |

### Existing Dependencies Reused

| Package | Usage |
|---------|-------|
| `pdfjs-dist` | PDF text extraction (already in `package.json`) |
| `react-bootstrap` | UI components (Cards, Buttons, Badges, etc.) |

### Import Strategy

All heavy parsers are **lazy-loaded** via dynamic `import()` to preserve initial bundle performance:

```typescript
// Only loaded when user actually uploads a DOCX
const mammoth = await import('mammoth');
```

---

## 6. Testing Strategy

### Unit Tests (Vitest)

- **Location**: `src/utils/__tests__/fileComparator.test.ts`
- **Framework**: Vitest (existing project standard)
- **Mocking**: `vi.mock()` for PDF/DOCX/XLSX libraries; real `File` objects for text formats
- **Coverage target**: ≥ 90% line coverage on `fileComparator.ts`

### Component Tests (Optional, Phase 2+)

- **Location**: `src/components/utils/__tests__/FileComparator.test.tsx`
- **Framework**: `@testing-library/react` + Vitest
- **Scope**: Upload interaction, button states, result rendering

### Manual QA Checklist

- [ ] Upload two files via drag & drop
- [ ] Upload two files via file picker
- [ ] Compare identical files → 100%
- [ ] Compare very different files → low %
- [ ] Toggle all options and verify effect
- [ ] Switch between side-by-side and unified views
- [ ] Export diff in all formats
- [ ] Test with files > 5MB
- [ ] Test with unsupported format → graceful error
- [ ] Verify responsive layout on mobile viewport
- [ ] Verify dark mode styling

---

## 7. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | Tool is accessible at `#/file-comparator` | Navigate to URL |
| 2 | Tool appears in navigation under "Tools" dropdown | Visual check |
| 3 | Tool appears in search/command palette | Type "compare" in search |
| 4 | Can upload and compare two TXT files | Manual test |
| 5 | Can upload and compare two PDF files | Manual test |
| 6 | Can upload and compare two CSV files | Manual test |
| 7 | Can upload and compare two DOCX files | Manual test |
| 8 | Can upload and compare two XLSX files | Manual test |
| 9 | Similarity percentage is accurate (±5%) | Compare known files |
| 10 | Side-by-side view shows aligned diff | Visual check |
| 11 | Unified view shows inline diff | Visual check |
| 12 | Options (whitespace, case, blank lines) work | Toggle and verify |
| 13 | Export produces valid output | Download and open |
| 14 | No console errors during normal usage | DevTools check |
| 15 | All unit tests pass | `npm test` |
| 16 | No regression in existing tests | `npm test` |
| 17 | Page loads in < 2s on 3G throttle | Lighthouse |

---

## 8. Rollback Plan

Since this is a **new, isolated feature** with no modifications to existing logic:

1. **Revert route**: Remove the lazy import + route from `src/main.tsx`
2. **Revert nav**: Remove the entry from `src/config/navigationConfig.ts`
3. **Remove files**: Delete `src/utils/fileComparator.ts`, `src/components/utils/FileComparator.tsx`, test file
4. **Remove deps** (if no other feature uses them): `npm uninstall mammoth xlsx`

No existing functionality is affected at any point.

---

## 9. Future Enhancements (Out of Scope)

| Enhancement | Description |
|-------------|-------------|
| Three-way merge | Compare base + two branches |
| Folder comparison | Compare all files in two directories |
| Inline editing | Edit one side and re-compare live |
| AI summary | Use LLM to summarize what changed |
| CLI support | `qautils compare file1.pdf file2.pdf` |
| Syntax-aware diff | Parse code ASTs for smarter structural diff |
| Image diff | Pixel-level comparison for image files |
| Version history | Compare multiple versions of the same file |

---

## 10. References

- [Myers Diff Algorithm Paper](http://www.xmailserver.org/diff2.pdf)
- [pdfjs-dist documentation](https://mozilla.github.io/pdf.js/)
- [mammoth.js GitHub](https://github.com/mwilliamson/mammoth.js)
- [SheetJS documentation](https://docs.sheetjs.com/)
- [RFC 4180 — CSV format](https://tools.ietf.org/html/rfc4180)
- Existing pattern: `src/utils/knowledgeManager.ts` (PDF extraction)
- Existing pattern: `src/components/utils/FileProcessor.tsx` (file upload UI)
