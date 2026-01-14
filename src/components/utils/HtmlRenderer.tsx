import { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { sanitizeHtml } from '../../utils/htmlRenderer';

export const HtmlRenderer = () => {
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleRender = () => {
    setShowPreview(true);
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
