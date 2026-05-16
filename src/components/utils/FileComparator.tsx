import React, { useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Card, Button, Form, Row, Col, Alert, ProgressBar, Badge, ButtonGroup } from 'react-bootstrap';
import { ToolPageLayout } from './ToolPageLayout';
import {
  compareFiles,
  ComparisonOptions,
  ComparisonResult,
  DiffLine,
  DEFAULT_COMPARISON_OPTIONS,
  getSupportedExtensions,
  exportAsUnifiedDiff,
  exportAsHTML,
  exportAsJSON,
} from '../../utils/fileComparator';

type ViewMode = 'side-by-side' | 'unified';

export const FileComparator: React.FC = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [options, setOptions] = useState<ComparisonOptions>(DEFAULT_COMPARISON_OPTIONS);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [progress, setProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(13);

  const ZOOM_MIN = 9;
  const ZOOM_MAX = 24;
  const ZOOM_STEP = 1;

  const zoomIn  = () => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  const zoomReset = () => setZoom(13);

  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);
  const diffContainerRef = useRef<HTMLDivElement>(null);

  const supportedExts = getSupportedExtensions().map(e => `.${e}`).join(', ');

  const handleFileDrop = useCallback((e: React.DragEvent, setter: (f: File) => void) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setter(files[0]);
      setError(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError('Please select two files to compare.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      setProgress(30);
      const comparisonResult = await compareFiles(file1, file2, options);
      setProgress(100);
      setResult(comparisonResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during comparison.');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleExport = (format: 'diff' | 'html' | 'json') => {
    if (!result) return;

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'diff':
        content = exportAsUnifiedDiff(result);
        mimeType = 'text/plain';
        extension = 'diff';
        break;
      case 'html':
        content = exportAsHTML(result);
        mimeType = 'text/html';
        extension = 'html';
        break;
      case 'json':
        content = exportAsJSON(result);
        mimeType = 'application/json';
        extension = 'json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison_${result.file1.name}_vs_${result.file2.name}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile1(null);
    setFile2(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (file1Ref.current) file1Ref.current.value = '';
    if (file2Ref.current) file2Ref.current.value = '';
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCompare();
    }
    if (e.key === 'Escape' && modalOpen) {
      e.preventDefault();
      setModalOpen(false);
    }
  }, [file1, file2, options, modalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeIcon = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const icons: Record<string, string> = {
      pdf: '📄', docx: '📝', xlsx: '📊', xls: '📊', csv: '📋',
      json: '﹛﹜', txt: '📃', md: '📑', html: '🌐', xml: '📰',
      js: '🟨', ts: '🔷', py: '🐍', java: '☕', sql: '🗄️',
    };
    return icons[ext] || '📁';
  };

  return (
    <ToolPageLayout
      icon="🔍"
      title="File Comparator"
      description="Compare two files side-by-side — find same, similar, and different content across PDF, CSV, DOCX, XLSX, and more"
    >
      <div onKeyDown={handleKeyDown} tabIndex={-1}>
        {/* Upload Section */}
        <Row className="mb-3 g-3">
          <Col md={6}>
            <Card className="glass-card h-100">
              <Card.Body>
                <div
                  className="text-center p-4"
                  style={{
                    border: '2px dashed var(--border-color, #444)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleFileDrop(e, setFile1)}
                  onClick={() => file1Ref.current?.click()}
                >
                  <input
                    ref={file1Ref}
                    type="file"
                    accept={supportedExts}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFile1(e.target.files[0]);
                        setError(null);
                      }
                    }}
                  />
                  {file1 ? (
                    <>
                      <div style={{ fontSize: '2rem' }}>{getTypeIcon(file1.name)}</div>
                      <strong className="mt-2">{file1.name}</strong>
                      <small className="text-muted">{formatFileSize(file1.size)}</small>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2rem', opacity: 0.5 }}>📂</div>
                      <strong className="mt-2">File 1</strong>
                      <small className="text-muted">Drop file here or click to browse</small>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="glass-card h-100">
              <Card.Body>
                <div
                  className="text-center p-4"
                  style={{
                    border: '2px dashed var(--border-color, #444)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleFileDrop(e, setFile2)}
                  onClick={() => file2Ref.current?.click()}
                >
                  <input
                    ref={file2Ref}
                    type="file"
                    accept={supportedExts}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFile2(e.target.files[0]);
                        setError(null);
                      }
                    }}
                  />
                  {file2 ? (
                    <>
                      <div style={{ fontSize: '2rem' }}>{getTypeIcon(file2.name)}</div>
                      <strong className="mt-2">{file2.name}</strong>
                      <small className="text-muted">{formatFileSize(file2.size)}</small>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2rem', opacity: 0.5 }}>📂</div>
                      <strong className="mt-2">File 2</strong>
                      <small className="text-muted">Drop file here or click to browse</small>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Supported formats hint */}
        <div className="text-center mb-3">
          <small className="text-muted">Supported: {supportedExts}</small>
        </div>

        {/* Options */}
        <Card className="glass-card mb-3">
          <Card.Body>
            <h6 className="mb-3">Comparison Options</h6>
            <Row className="g-3">
              <Col sm={6} md={3}>
                <Form.Check
                  type="switch"
                  id="ignoreWhitespace"
                  label="Ignore whitespace"
                  checked={options.ignoreWhitespace}
                  onChange={(e) => setOptions(prev => ({ ...prev, ignoreWhitespace: e.target.checked }))}
                />
              </Col>
              <Col sm={6} md={3}>
                <Form.Check
                  type="switch"
                  id="ignoreCase"
                  label="Ignore case"
                  checked={options.ignoreCase}
                  onChange={(e) => setOptions(prev => ({ ...prev, ignoreCase: e.target.checked }))}
                />
              </Col>
              <Col sm={6} md={3}>
                <Form.Check
                  type="switch"
                  id="ignoreBlankLines"
                  label="Ignore blank lines"
                  checked={options.ignoreBlankLines}
                  onChange={(e) => setOptions(prev => ({ ...prev, ignoreBlankLines: e.target.checked }))}
                />
              </Col>
              <Col sm={6} md={3}>
                <Form.Check
                  type="switch"
                  id="normalizeJson"
                  label="Normalize JSON keys"
                  checked={options.normalizeJson}
                  onChange={(e) => setOptions(prev => ({ ...prev, normalizeJson: e.target.checked }))}
                />
              </Col>
              <Col sm={6} md={4}>
                <Form.Label className="small mb-1">
                  Similarity threshold: {Math.round(options.similarityThreshold * 100)}%
                </Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  value={options.similarityThreshold * 100}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    similarityThreshold: parseInt(e.target.value) / 100,
                  }))}
                />
              </Col>
              <Col sm={6} md={2}>
                <Form.Label className="small mb-1">Sheet index</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  min={0}
                  value={options.sheetIndex}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    sheetIndex: parseInt(e.target.value) || 0,
                  }))}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Action buttons */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <Button
            variant="primary"
            onClick={handleCompare}
            disabled={!file1 || !file2 || loading}
            className="px-4"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Comparing...
              </>
            ) : (
              '🔍 Compare Files'
            )}
          </Button>
          <Button variant="outline-secondary" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <small className="text-muted align-self-center ms-2">
            Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to compare
          </small>
        </div>

        {/* Progress */}
        {loading && (
          <ProgressBar animated now={progress} className="mb-3" style={{ height: '4px' }} />
        )}

        {/* Error */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Stats Summary */}
            <Card className="glass-card mb-3">
              <Card.Body>
                <Row className="align-items-center g-3">
                  <Col md={3} className="text-center">
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: getSimilarityColor(result.similarity) }}>
                      {result.similarity}%
                    </div>
                    <small className="text-muted">Similarity</small>
                    <ProgressBar
                      now={result.similarity}
                      className="mt-2"
                      style={{ height: '6px' }}
                      variant={result.similarity > 80 ? 'success' : result.similarity > 50 ? 'warning' : 'danger'}
                    />
                  </Col>
                  <Col md={9}>
                    <div className="d-flex flex-wrap gap-2">
                      <Badge bg="secondary" className="px-3 py-2" style={{ fontSize: '0.85rem' }}>
                        Total: {result.stats.totalLines}
                      </Badge>
                      <Badge bg="success" className="px-3 py-2" style={{ fontSize: '0.85rem' }}>
                        Same: {result.stats.sameLines}
                      </Badge>
                      <Badge bg="info" className="px-3 py-2" style={{ fontSize: '0.85rem' }}>
                        Added: {result.stats.addedLines}
                      </Badge>
                      <Badge bg="danger" className="px-3 py-2" style={{ fontSize: '0.85rem' }}>
                        Removed: {result.stats.removedLines}
                      </Badge>
                      <Badge bg="warning" text="dark" className="px-3 py-2" style={{ fontSize: '0.85rem' }}>
                        Modified: {result.stats.modifiedLines}
                      </Badge>
                    </div>
                    <div className="mt-2 text-muted small">
                      Compared in {result.duration}ms &middot;
                      {result.file1.name} ({result.file1.lineCount} lines) vs {result.file2.name} ({result.file2.lineCount} lines)
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* View controls + Export */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <ButtonGroup size="sm">
                <Button
                  variant={viewMode === 'side-by-side' ? 'primary' : 'outline-secondary'}
                  onClick={() => setViewMode('side-by-side')}
                >
                  Side-by-Side
                </Button>
                <Button
                  variant={viewMode === 'unified' ? 'primary' : 'outline-secondary'}
                  onClick={() => setViewMode('unified')}
                >
                  Unified
                </Button>
              </ButtonGroup>

              <div className="d-flex align-items-center gap-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setModalOpen(true)}
                  title="Expand to fullscreen with zoom"
                >
                  ⛶ Expand
                </Button>

                <ButtonGroup size="sm">
                  <Button variant="outline-secondary" onClick={() => handleExport('diff')}>
                    Export .diff
                  </Button>
                  <Button variant="outline-secondary" onClick={() => handleExport('html')}>
                    Export .html
                  </Button>
                  <Button variant="outline-secondary" onClick={() => handleExport('json')}>
                    Export .json
                  </Button>
                </ButtonGroup>
              </div>
            </div>

            {/* Diff View */}
            <Card className="glass-card">
              <Card.Body className="p-0">
                <div
                  ref={diffContainerRef}
                  style={{
                    maxHeight: '600px',
                    overflowY: 'auto',
                    fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                    fontSize: '13px',
                    lineHeight: '1.5',
                  }}
                >
                  {viewMode === 'side-by-side' ? (
                    <SideBySideView diffLines={result.diffLines} file1Name={result.file1.name} file2Name={result.file2.name} />
                  ) : (
                    <UnifiedView diffLines={result.diffLines} />
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Fullscreen Modal — portalled to body to escape navbar stacking context */}
            {modalOpen && ReactDOM.createPortal(
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  background: 'rgba(0, 0, 0, 0.7)',
                }}
                onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
              >
                {/* Modal toolbar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(108,112,134,0.3)',
                    background: 'rgba(30, 30, 46, 0.95)',
                    flexShrink: 0,
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ fontWeight: 600, fontSize: '14px', opacity: 0.8 }}>
                      {result.file1.name} vs {result.file2.name}
                    </span>
                    <ButtonGroup size="sm">
                      <Button
                        variant={viewMode === 'side-by-side' ? 'primary' : 'outline-secondary'}
                        onClick={() => setViewMode('side-by-side')}
                      >
                        Side-by-Side
                      </Button>
                      <Button
                        variant={viewMode === 'unified' ? 'primary' : 'outline-secondary'}
                        onClick={() => setViewMode('unified')}
                      >
                        Unified
                      </Button>
                    </ButtonGroup>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <ButtonGroup size="sm">
                      <Button
                        variant="outline-light"
                        onClick={zoomOut}
                        disabled={zoom <= ZOOM_MIN}
                        title="Zoom out"
                        style={{ minWidth: '32px' }}
                      >
                        −
                      </Button>
                      <Button
                        variant="outline-light"
                        onClick={zoomReset}
                        title="Reset zoom"
                        style={{ minWidth: '52px', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {zoom}px
                      </Button>
                      <Button
                        variant="outline-light"
                        onClick={zoomIn}
                        disabled={zoom >= ZOOM_MAX}
                        title="Zoom in"
                        style={{ minWidth: '32px' }}
                      >
                        +
                      </Button>
                    </ButtonGroup>
                    <Button
                      size="sm"
                      variant="outline-light"
                      onClick={() => setModalOpen(false)}
                      title="Close (Esc)"
                      style={{ minWidth: '32px' }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>

                {/* Modal diff content */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                    fontSize: `${zoom}px`,
                    lineHeight: '1.5',
                    background: 'rgba(30, 30, 46, 0.95)',
                  }}
                >
                  {viewMode === 'side-by-side' ? (
                    <SideBySideView diffLines={result.diffLines} file1Name={result.file1.name} file2Name={result.file2.name} />
                  ) : (
                    <UnifiedView diffLines={result.diffLines} />
                  )}
                </div>
              </div>,
              document.body,
            )}
          </>
        )}
      </div>
    </ToolPageLayout>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function getSimilarityColor(pct: number): string {
  if (pct >= 80) return '#a6e3a1';
  if (pct >= 50) return '#f9e2af';
  return '#f38ba8';
}

const DIFF_COLORS: Record<DiffLine['type'], { bg: string; fg: string; symbol: string }> = {
  same:     { bg: 'transparent',          fg: 'inherit',  symbol: ' ' },
  added:    { bg: 'rgba(166,227,161,0.1)', fg: '#a6e3a1', symbol: '+' },
  removed:  { bg: 'rgba(243,139,168,0.1)', fg: '#f38ba8', symbol: '-' },
  modified: { bg: 'rgba(249,226,175,0.1)', fg: '#f9e2af', symbol: '~' },
};

const lineNumStyle: React.CSSProperties = {
  width: '48px',
  minWidth: '48px',
  textAlign: 'right',
  paddingRight: '8px',
  color: '#6c7086',
  userSelect: 'none',
  borderRight: '1px solid rgba(108,112,134,0.2)',
  flexShrink: 0,
};

const contentStyle: React.CSSProperties = {
  padding: '0 8px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  flex: 1,
  minWidth: 0,
};

const SideBySideView: React.FC<{ diffLines: DiffLine[]; file1Name: string; file2Name: string }> = ({
  diffLines,
  file1Name,
  file2Name,
}) => (
  <div>
    {/* Header */}
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(108,112,134,0.3)', position: 'sticky', top: 0, zIndex: 1, background: 'var(--card-bg, #1e1e2e)' }}>
      <div style={{ flex: 1, padding: '8px 12px', fontWeight: 600, fontSize: '12px', opacity: 0.7 }}>{file1Name}</div>
      <div style={{ width: '1px', background: 'rgba(108,112,134,0.3)' }} />
      <div style={{ flex: 1, padding: '8px 12px', fontWeight: 600, fontSize: '12px', opacity: 0.7 }}>{file2Name}</div>
    </div>
    {diffLines.map((line, i) => (
      <div key={i} style={{ display: 'flex', borderBottom: '1px solid rgba(108,112,134,0.08)' }}>
        {/* Left side */}
        <div style={{
          flex: 1,
          display: 'flex',
          background: line.type === 'removed' || line.type === 'modified'
            ? 'rgba(243,139,168,0.08)' : DIFF_COLORS[line.type].bg,
        }}>
          <div style={lineNumStyle}>
            {line.type === 'added' ? '' : line.lineNumber1 ?? ''}
          </div>
          <div style={{ ...contentStyle, color: line.type === 'removed' ? '#f38ba8' : line.type === 'modified' ? '#f9e2af' : 'inherit' }}>
            {line.type === 'added' ? '' : (line.type === 'modified' ? line.oldContent : line.content)}
          </div>
        </div>
        {/* Divider */}
        <div style={{ width: '1px', background: 'rgba(108,112,134,0.2)', flexShrink: 0 }} />
        {/* Right side */}
        <div style={{
          flex: 1,
          display: 'flex',
          background: line.type === 'added' || line.type === 'modified'
            ? 'rgba(166,227,161,0.08)' : DIFF_COLORS[line.type].bg,
        }}>
          <div style={lineNumStyle}>
            {line.type === 'removed' ? '' : line.lineNumber2 ?? ''}
          </div>
          <div style={{ ...contentStyle, color: line.type === 'added' ? '#a6e3a1' : line.type === 'modified' ? '#a6e3a1' : 'inherit' }}>
            {line.type === 'removed' ? '' : line.content}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const UnifiedView: React.FC<{ diffLines: DiffLine[] }> = ({ diffLines }) => (
  <div>
    {diffLines.map((line, i) => {
      const colors = DIFF_COLORS[line.type];
      if (line.type === 'modified') {
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', background: 'rgba(243,139,168,0.08)', borderBottom: '1px solid rgba(108,112,134,0.08)' }}>
              <div style={lineNumStyle}>{line.lineNumber1 ?? ''}</div>
              <div style={{ width: '20px', textAlign: 'center', color: '#f38ba8', flexShrink: 0 }}>-</div>
              <div style={{ ...contentStyle, color: '#f38ba8' }}>{line.oldContent}</div>
            </div>
            <div style={{ display: 'flex', background: 'rgba(166,227,161,0.08)', borderBottom: '1px solid rgba(108,112,134,0.08)' }}>
              <div style={lineNumStyle}>{line.lineNumber2 ?? ''}</div>
              <div style={{ width: '20px', textAlign: 'center', color: '#a6e3a1', flexShrink: 0 }}>+</div>
              <div style={{ ...contentStyle, color: '#a6e3a1' }}>{line.content}</div>
            </div>
          </React.Fragment>
        );
      }
      return (
        <div key={i} style={{ display: 'flex', background: colors.bg, borderBottom: '1px solid rgba(108,112,134,0.08)' }}>
          <div style={lineNumStyle}>
            {line.lineNumber1 ?? line.lineNumber2 ?? ''}
          </div>
          <div style={{ width: '20px', textAlign: 'center', color: colors.fg, flexShrink: 0 }}>
            {colors.symbol}
          </div>
          <div style={{ ...contentStyle, color: colors.fg }}>
            {line.content}
          </div>
        </div>
      );
    })}
  </div>
);

export default FileComparator;
