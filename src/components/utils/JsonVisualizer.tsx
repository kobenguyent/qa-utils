import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useRef, useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getEffectiveTheme } from '../../utils/themeManager';
import { buildJsonRelationshipGraph, type JsonGraphBuildResult } from '../../utils/jsonRelationshipGraph';
import { JsonReactFlowVisualizer } from './JsonReactFlowVisualizer';

const SAMPLE_JSON = `{
  "squadName": "Super hero squad",
  "homeTown": "Metro City",
  "formed": 2016,
  "active": true,
  "members": [
    {
      "name": "Molecule Man",
      "age": 29,
      "powers": [
        "Radiation resistance",
        "Turning tiny",
        "Radiation"
      ]
    },
    {
      "name": "Madame Uppercut",
      "age": 39,
      "powers": [
        "Million tonne punch",
        "Damage resistance"
      ]
    }
  ]
}`;

const GRAPH_PANEL_HEIGHT = 'min(60vh, 640px)';

const highlightJson = (code: string): string => {
  if (!code) return '';
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[{}[\],:])/g,
      (match) => {
        if (/^".*":$/.test(match) || /^".*": $/.test(match)) {
          const colon = match.endsWith(':') ? ':' : ': ';
          const key = match.slice(0, match.lastIndexOf(colon));
          return `<span class="jv-key">${key}</span>${colon}`;
        }
        if (/^"/.test(match)) return `<span class="jv-str">${match}</span>`;
        if (/true|false/.test(match)) return `<span class="jv-bool">${match}</span>`;
        if (/null/.test(match)) return `<span class="jv-null">${match}</span>`;
        if (/^-?\d/.test(match)) return `<span class="jv-num">${match}</span>`;
        if (/[{}[\]]/.test(match)) return `<span class="jv-brace">${match}</span>`;
        return `<span class="jv-punct">${match}</span>`;
      },
    );
};

export const JsonVisualizer = () => {
  const { theme } = useTheme();
  const isDark = getEffectiveTheme(theme) === 'dark';
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [graphResult, setGraphResult] = useState<JsonGraphBuildResult | null>(() =>
    buildJsonRelationshipGraph(JSON.parse(SAMPLE_JSON)),
  );
  const [parseError, setParseError] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlighted = useMemo(() => highlightJson(jsonInput), [jsonInput]);

  const preRef = useRef<HTMLPreElement | null>(null);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    setParseError('');
    setSelectedNodeId(null);
  }, []);

  const handleScroll = useCallback(() => {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const syncGraphFromJson = (nextJsonInput: string, shouldUpdateInput = false) => {
    try {
      const parsed = JSON.parse(nextJsonInput);
      if (shouldUpdateInput) {
        setJsonInput(nextJsonInput);
      }
      setGraphResult(buildJsonRelationshipGraph(parsed));
      setParseError('');
      setSelectedNodeId(null);
    } catch (error) {
      if (shouldUpdateInput) {
        setJsonInput(nextJsonInput);
      }
      setParseError(error instanceof Error ? error.message : 'Failed to parse JSON');
      setGraphResult(null);
      setSelectedNodeId(null);
    }
  };

  const handleParse = () => {
    syncGraphFromJson(jsonInput);
  };

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setParseError('');
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse JSON');
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setGraphResult(null);
    setParseError('');
    setSelectedNodeId(null);
  };

  const handleLoadSample = () => {
    syncGraphFromJson(SAMPLE_JSON, true);
  };

  const handleImportJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const importedJson = loadEvent.target?.result;
      if (typeof importedJson !== 'string') {
        setParseError('Failed to read JSON file');
        setGraphResult(null);
        setSelectedNodeId(null);
        return;
      }

      syncGraphFromJson(importedJson, true);
    };
    reader.onerror = () => {
      setParseError('Failed to read JSON file');
      setGraphResult(null);
      setSelectedNodeId(null);
    };
    reader.readAsText(file);

    event.target.value = '';
  };

  return (
    <Container fluid className="py-4 px-3 px-lg-4">
      <div className="tool-header">
        <div className="tool-header-icon">🕸️</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">JSON Visualizer</h1>
          <p className="tool-header-desc">
            Explore JSON as an interactive graph with node details, hierarchy, pan, zoom, and fit controls.
          </p>
        </div>
      </div>

      <Row className="g-3 align-items-stretch">
        <Col xs={12} xl={3}>
          <div className="tool-card h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="tool-card-header">
              <span>📥</span>
              <span>JSON Input</span>
              {jsonInput.trim() && (
                !parseError
                  ? <span className="tool-badge tool-badge-success ms-auto">✓ Valid</span>
                  : <span className="tool-badge tool-badge-danger ms-auto">✗ Invalid</span>
              )}
            </div>
            <div
              className="tool-card-body d-flex flex-column gap-3"
              style={{ flex: '1 1 auto', minHeight: 0 }}
            >
              <div
                data-testid="json-visualizer-input-editor"
                style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', position: 'relative' }}
              >
                {/* Syntax-highlight layer */}
                <style>{`
                  .jv-editor-pre { pointer-events: none; }
                  .jv-key  { color: ${isDark ? '#f87171' : '#c0392b'}; font-weight: 600; }
                  .jv-str  { color: ${isDark ? '#34d399' : '#27ae60'}; }
                  .jv-num  { color: ${isDark ? '#60a5fa' : '#2563eb'}; }
                  .jv-bool { color: ${isDark ? '#fb923c' : '#d97706'}; font-weight: 600; }
                  .jv-null { color: ${isDark ? '#a78bfa' : '#7c3aed'}; font-weight: 600; }
                  .jv-brace { color: ${isDark ? '#94a3b8' : '#475569'}; }
                  .jv-punct { color: ${isDark ? '#cbd5e1' : '#64748b'}; }
                `}</style>
                <pre
                  ref={preRef}
                  aria-hidden="true"
                  className="jv-editor-pre"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    margin: 0,
                    padding: '0.5rem 0.75rem',
                    fontFamily: 'Monaco, Consolas, \'Courier New\', monospace',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    wordBreak: 'normal',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    background: isDark ? '#0f172a' : '#f8fafc',
                    borderRadius: '8px',
                    border: `1px solid ${parseError && jsonInput.trim() ? 'rgba(220,53,69,0.4)' : isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.3)'}`,
                    boxSizing: 'border-box',
                  }}
                  dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
                />
                <textarea
                  ref={textareaRef}
                  placeholder="Paste JSON to visualize..."
                  value={jsonInput}
                  onChange={handleTextareaChange}
                  onScroll={handleScroll}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: '0.5rem 0.75rem',
                    fontFamily: 'Monaco, Consolas, \'Courier New\', monospace',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    wordBreak: 'normal',
                    color: 'transparent',
                    caretColor: isDark ? '#e2e8f0' : '#1e293b',
                    background: 'transparent',
                    border: `1px solid ${parseError && jsonInput.trim() ? 'rgba(220,53,69,0.4)' : 'transparent'}`,
                    borderRadius: '8px',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    zIndex: 1,
                  }}
                />
              </div>
              {parseError && (
                <div style={{ fontSize: '0.82rem', color: 'var(--danger)', background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', borderRadius: '8px', padding: '0.55rem 0.75rem' }}>
                  <strong>Parse error:</strong> {parseError}
                </div>
              )}
              <div className="tool-action-row">
                <Button variant="primary" size="sm" onClick={handleParse} disabled={!jsonInput.trim()}>
                  Parse JSON
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handlePrettify} disabled={!jsonInput.trim()}>
                  Prettify
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import JSON
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handleLoadSample}>
                  Sample
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handleClear} disabled={!jsonInput}>
                  Clear
                </Button>
              </div>
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                aria-label="Import JSON file"
                onChange={handleImportJson}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </Col>

        <Col xs={12} xl={9}>
          <div className="tool-card">
            <div className="tool-card-header">
              <span>🕸️</span>
              <span>Relationship Graph</span>
              {graphResult && (
                <span className="tool-badge ms-auto">
                  {graphResult.nodes.length} nodes · {graphResult.edges.length} edges
                </span>
              )}
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              {graphResult?.truncated && (
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#92400e',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '8px',
                    padding: '0.45rem 0.6rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <strong>Graph truncated:</strong> {graphResult.truncationReason} Nodes: {graphResult.stats.totalNodes}, edges: {graphResult.stats.totalEdges}.
                </div>
              )}

              {graphResult ? (
                <JsonReactFlowVisualizer
                  graphResult={graphResult}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onDeselectNode={() => setSelectedNodeId(null)}
                  height={GRAPH_PANEL_HEIGHT}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '380px', fontSize: '0.95rem' }}>
                  {jsonInput.trim() ? 'Fix JSON to visualize the graph' : 'Paste JSON to see the relationship graph'}
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
