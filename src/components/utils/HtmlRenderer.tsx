import { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { sanitizeHtml } from '../../utils/htmlRenderer';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

export const HtmlRenderer = () => {
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const ai = useAIAssistant();

  const handleRender = () => {
    setShowPreview(true);
  };

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

  return (
    <Container>
      <div className="text-center mb-4">
        <h1>HTML Renderer</h1>
        <p className="text-muted">Preview HTML code in real-time</p>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">HTML Code</Form.Label>
          <Col sm="10">
            <Form.Control
              as="textarea"
              rows={10}
              placeholder="<h1>Hello World</h1>"
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
            />
            {ai.isConfigured ? (
              <AIAssistButton
                label="Generate HTML from Description"
                onClick={handleAIGenerate}
                isLoading={ai.isLoading}
                disabled={!htmlCode.trim()}
                error={ai.error}
                onClear={ai.clear}
                className="mt-2"
              />
            ) : (
              <AIConfigureHint className="mt-2" />
            )}
          </Col>
        </Form.Group>

        <div className="mb-3">
          <Button onClick={handleRender} className="me-2">Render HTML</Button>
          <Button variant="secondary" onClick={() => {
            setHtmlCode('');
            setShowPreview(false);
          }}>Clear</Button>
        </div>

        {showPreview && htmlCode && (
          <Alert variant="info">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <strong>Preview:</strong>
              <Button size="sm" variant="outline-secondary" onClick={() => setShowPreview(false)}>
                Hide Preview
              </Button>
            </div>
            <div 
              style={{ 
                border: '1px solid #dee2e6', 
                padding: '1rem', 
                backgroundColor: 'white',
                color: 'black',
                minHeight: '100px'
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlCode) }}
            />
          </Alert>
        )}
      </Form>
    </Container>
  );
};
