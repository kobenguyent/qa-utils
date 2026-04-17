import { useState } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { sanitizeHtml } from '../../utils/htmlRenderer';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

const PLACEHOLDER_HTML = `<h2 style="color:#6366f1">Hello World 👋</h2>
<p>Edit the HTML on the left to see a live preview here.</p>
<ul>
  <li>Supports <strong>any HTML</strong></li>
  <li>Including inline <code>styles</code></li>
</ul>`;

export const HtmlRenderer = () => {
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const ai = useAIAssistant();

  const handleAIGenerate = async () => {
    try {
      const response = await ai.sendRequest(
        'You are an HTML expert. Generate clean, semantic HTML based on the user\'s description. Return ONLY the HTML code without any explanation or markdown formatting.',
        `Generate HTML for: ${htmlCode}`
      );
      setHtmlCode(response);
      setShowPreview(true);
    } catch {
      // error displayed by AIAssistButton
    }
  };

  const hasContent = htmlCode.trim().length > 0;

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">🌐</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">HTML Renderer</h1>
          <p className="tool-header-desc">
            Write or generate HTML and preview it live in a sandboxed frame.
          </p>
        </div>
      </div>

      <Row className="g-3">
        {/* Editor */}
        <Col xs={12} lg={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>✏️</span>
              <span>HTML Editor</span>
              {hasContent && (
                <span className="tool-badge tool-badge-info ms-auto">
                  {htmlCode.length} chars
                </span>
              )}
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              <Form.Control
                as="textarea"
                rows={14}
                className="tool-textarea"
                placeholder={'<h1>Hello World</h1>\n<p>Start typing HTML…</p>'}
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
              />
              <div className="tool-action-row">
                <Button
                  variant="primary"
                  onClick={() => setShowPreview(true)}
                  disabled={!hasContent}
                >
                  ▶️ Render
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setHtmlCode('');
                    setShowPreview(false);
                  }}
                  disabled={!hasContent}
                >
                  🗑️ Clear
                </Button>
                {showPreview && (
                  <Button variant="outline-secondary" onClick={() => setShowPreview(false)}>
                    🙈 Hide Preview
                  </Button>
                )}
                {ai.isConfigured ? (
                  <AIAssistButton
                    label="Generate with AI"
                    onClick={handleAIGenerate}
                    isLoading={ai.isLoading}
                    disabled={!hasContent}
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

        {/* Preview */}
        <Col xs={12} lg={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>👁️</span>
              <span>Live Preview</span>
              {showPreview && hasContent && (
                <span className="tool-badge tool-badge-success ms-auto">✓ Rendered</span>
              )}
            </div>
            <div className="tool-card-body" style={{ minHeight: '340px' }}>
              {showPreview && hasContent ? (
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    minHeight: '300px',
                    overflow: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlCode) }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center text-muted"
                  style={{ minHeight: '300px', fontSize: '0.9rem' }}
                  dangerouslySetInnerHTML={{
                    __html: hasContent
                      ? `<div style="text-align:center;padding:2rem;color:#6c757d">Click <strong>▶️ Render</strong> to see the preview</div>`
                      : `<div style="opacity:0.35;pointer-events:none;padding:1rem">${PLACEHOLDER_HTML}</div>`
                  }}
                />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
