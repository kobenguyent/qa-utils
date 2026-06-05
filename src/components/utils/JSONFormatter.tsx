import { Container, Row, Col, Form, Button, Modal } from "react-bootstrap";
import { useState, useMemo } from 'react';
import CopyWithToast from '../CopyWithToast.tsx';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';
import { buildJsonRelationshipGraph } from '../../utils/jsonRelationshipGraph';
import { JsonGraphNodeDetails, JsonRelationshipGraphCanvas } from './JsonRelationshipGraphCanvas';

const DEFAULT_JSON = `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}`;

const getJsonType = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const renderPrimitiveValue = (value: unknown) => {
  const type = getJsonType(value);
  const color = type === 'string'
    ? 'var(--success)'
    : type === 'number'
      ? 'var(--primary)'
      : type === 'boolean'
        ? 'var(--warning)'
        : 'var(--muted)';

  return (
    <span style={{ color }}>
      {typeof value === 'string' ? JSON.stringify(value) : String(value)}
    </span>
  );
};

interface JsonTreeNodeProps {
  name: string;
  value: unknown;
  depth?: number;
}

const JsonTreeNode = ({ name, value, depth = 0 }: JsonTreeNodeProps) => {
  const type = getJsonType(value);
  const isBranch = value !== null && typeof value === 'object';
  const entries = isBranch
    ? Array.isArray(value)
      ? value.map((item, index) => [String(index), item] as const)
      : Object.entries(value as Record<string, unknown>)
    : [];

  if (!isBranch) {
    return (
      <div style={{ paddingLeft: `${depth * 14}px`, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.65 }}>
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{name}</span>
        <span style={{ color: 'var(--muted)' }}>: </span>
        {renderPrimitiveValue(value)}
      </div>
    );
  }

  return (
    <details open={depth < 2} style={{ paddingLeft: `${depth * 14}px`, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.65 }}>
      <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 700 }}>
        {name}
        <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
          {' '}({type}, {entries.length})
        </span>
      </summary>
      <div>
        {entries.map(([key, child]) => (
          <JsonTreeNode key={`${depth}-${name}-${key}`} name={key} value={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
};

export const JSONFormatter = () => {
  const [postContent, setPostContent] = useState(DEFAULT_JSON);
  const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const ai = useAIAssistant();

  // Derive parsed value and error without touching state during render
  const { parsed, parseError, parsedOk } = useMemo(() => {
    if (!postContent.trim()) return { parsed: undefined, parseError: null, parsedOk: false };
    try {
      return { parsed: JSON.parse(postContent), parseError: null, parsedOk: true };
    } catch (e: unknown) {
      return {
        parsed: undefined,
        parseError: e instanceof Error ? e.message : 'Unknown error',
        parsedOk: false,
      };
    }
  }, [postContent]);

  const isValid = postContent.trim() ? parsedOk : null;
  const hasValidJson = isValid === true;
  const graphResult = useMemo(() => {
    if (!hasValidJson) return null;
    return buildJsonRelationshipGraph(parsed);
  }, [parsed, hasValidJson]);

  const selectedNode = useMemo(() => {
    if (!graphResult || !selectedNodeId) return null;
    return graphResult.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [graphResult, selectedNodeId]);

  const handlePrettify = () => {
    if (parsedOk) setPostContent(JSON.stringify(parsed, null, 2));
  };

  const handleMinify = () => {
    if (parsedOk) setPostContent(JSON.stringify(parsed));
  };

  const handleClear = () => {
    setPostContent('');
    setSelectedNodeId(null);
  };

  const handleAIFix = async () => {
    try {
      const response = await ai.sendRequest(
        'You are a JSON expert. Fix the provided malformed JSON and return ONLY the corrected, valid JSON. Do not include any explanation or markdown formatting.',
        `Fix this JSON:\n\n${postContent}`
      );
      setPostContent(response);
    } catch {
      // error is displayed by AIAssistButton
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">﹛﹜</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">JSON Formatter</h1>
          <p className="tool-header-desc">
            Format, validate, and explore JSON data with a collapsible tree and key relationship graph.
          </p>
        </div>
      </div>

      <Row className="g-3">
        {/* Input */}
        <Col xs={12} lg={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>📥</span>
              <span>Input</span>
              {postContent.trim() && (
                isValid
                  ? <span className="tool-badge tool-badge-success ms-auto">✓ Valid JSON</span>
                  : <span className="tool-badge tool-badge-danger ms-auto">✗ Invalid JSON</span>
              )}
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              <Form.Control
                as="textarea"
                rows={14}
                className={`tool-textarea${!isValid && postContent.trim() ? ' is-invalid' : ''}`}
                placeholder="Paste your JSON here…"
                value={postContent}
                onChange={(e) => {
                  setPostContent(e.target.value);
                  setSelectedNodeId(null);
                }}
              />
              {parseError && (
                <div style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                  <strong>⚠️ Parse error:</strong> {parseError}
                </div>
              )}
              <div className="tool-action-row">
                <Button variant="primary" size="sm" onClick={handlePrettify} disabled={!postContent.trim() || !isValid}>
                  ✨ Prettify
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handleMinify} disabled={!postContent.trim() || !isValid}>
                  📦 Minify
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handleClear} disabled={!postContent}>
                  🗑️ Clear
                </Button>
                {ai.isConfigured ? (
                  <AIAssistButton
                    label="Fix with AI"
                    onClick={handleAIFix}
                    isLoading={ai.isLoading}
                    disabled={!postContent.trim()}
                    error={ai.error}
                    onClear={ai.clear}
                  />
                ) : (
                  <AIConfigureHint />
                )}
              </div>
            </div>
          </div>
        </Col>

        {/* Output tree */}
        <Col xs={12} lg={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>{viewMode === 'tree' ? '🌲' : '🕸️'}</span>
              <span>{viewMode === 'tree' ? 'Tree View' : 'Key Relationship Graph'}</span>
              <div className="ms-auto d-flex gap-1">
                <Button
                  variant={viewMode === 'tree' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                >
                  Tree View
                </Button>
                <Button
                  variant={viewMode === 'graph' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('graph')}
                >
                  Key Relationship Graph
                </Button>
                {hasValidJson && postContent.trim() && (
                  <CopyWithToast text={JSON.stringify(parsed, null, 2)} />
                )}
              </div>
            </div>
            <div className="tool-card-body">
              {viewMode === 'tree' && hasValidJson && (
                <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
                  <JsonTreeNode name="root" value={parsed} />
                </div>
              )}

              {viewMode === 'tree' && !hasValidJson && (
                <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '200px', fontSize: '0.9rem' }}>
                  {postContent.trim() ? '⚠️ Fix JSON to see the tree view' : '🌲 Tree view will appear here'}
                </div>
              )}

              {viewMode === 'graph' && hasValidJson && graphResult && (
                <div className="d-flex flex-column gap-2">
                  {graphResult.truncated && (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#92400e',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        padding: '0.45rem 0.6rem',
                      }}
                    >
                      <strong>Graph truncated:</strong> {graphResult.truncationReason} Nodes: {graphResult.stats.totalNodes}, edges: {graphResult.stats.totalEdges}.
                    </div>
                  )}

                  <JsonRelationshipGraphCanvas
                    graphResult={graphResult}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                    onOpenLarge={() => setShowGraphModal(true)}
                  />

                  {selectedNode && <JsonGraphNodeDetails node={selectedNode} compact />}
                </div>
              )}

              {viewMode === 'graph' && !hasValidJson && (
                <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '200px', fontSize: '0.9rem' }}>
                  {postContent.trim() ? '⚠️ Fix JSON to see the relationship graph' : '🕸️ Graph view will appear here'}
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Modal
        show={showGraphModal}
        onHide={() => setShowGraphModal(false)}
        size="xl"
        fullscreen="lg-down"
        centered
        dialogClassName="json-graph-modal"
      >
        <Modal.Header closeButton style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <Modal.Title style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 800 }}>
            ⛶ Key Relationship Graph
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--bg-primary)', color: 'var(--text)' }}>
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

          {hasValidJson && graphResult ? (
            <Row className="g-3">
              <Col xs={12} lg={9}>
                <JsonRelationshipGraphCanvas
                  graphResult={graphResult}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  expanded
                />
              </Col>
              <Col xs={12} lg={3}>
                <div className="d-flex flex-column gap-2">
                  <div
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      background: 'var(--card-bg)',
                      padding: '0.75rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: '0.45rem' }}>Canvas Tips</div>
                    <div>Drag anywhere on the canvas to pan.</div>
                    <div>Use wheel or pinch gestures to zoom.</div>
                    <div>Use Fit to bring the full graph back into view.</div>
                  </div>
                  <JsonGraphNodeDetails node={selectedNode} />
                </div>
              </Col>
            </Row>
          ) : (
            <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '320px' }}>
              Add valid JSON to open the relationship graph.
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};
