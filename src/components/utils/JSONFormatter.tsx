import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useState, useMemo } from 'react';
// @ts-ignore
import {JSONViewer} from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';
import CopyWithToast from '../CopyWithToast.tsx';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

const DEFAULT_JSON = `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}`;

export const JSONFormatter = () => {
  const [postContent, setPostContent] = useState(DEFAULT_JSON);
  const ai = useAIAssistant();

  // Derive parsed value and error without touching state during render
  const { parsed, parseError } = useMemo(() => {
    if (!postContent.trim()) return { parsed: null, parseError: null };
    try {
      return { parsed: JSON.parse(postContent), parseError: null };
    } catch (e: unknown) {
      return { parsed: null, parseError: e instanceof Error ? e.message : 'Unknown error' };
    }
  }, [postContent]);

  const isValid = postContent.trim() ? parsed !== null : null;

  const handlePrettify = () => {
    if (parsed) setPostContent(JSON.stringify(parsed, null, 2));
  };

  const handleMinify = () => {
    if (parsed) setPostContent(JSON.stringify(parsed));
  };

  const handleClear = () => {
    setPostContent('');
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
            Format, validate, and explore JSON data with a collapsible tree viewer.
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
                onChange={(e) => setPostContent(e.target.value)}
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
              <span>🌲</span>
              <span>Tree View</span>
              {isValid && postContent.trim() && (
                <div className="ms-auto">
                  <CopyWithToast text={JSON.stringify(parsed, null, 2)} />
                </div>
              )}
            </div>
            <div className="tool-card-body">
              {parsed && isValid ? (
                <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
                  <JSONViewer data={parsed} collapsible styles={jsonStyles} />
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '200px', fontSize: '0.9rem' }}>
                  {postContent.trim() ? '⚠️ Fix JSON to see the tree view' : '🌲 Tree view will appear here'}
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
