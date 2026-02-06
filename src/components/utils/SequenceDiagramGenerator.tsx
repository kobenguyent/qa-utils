import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Card, Badge, Alert } from 'react-bootstrap';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import CopyWithToast from '../CopyWithToast';
import {
  generateSequenceDiagram,
  sampleCodeceptJS,
  samplePlaywright,
  samplePytest,
  TestFramework,
} from '../../utils/sequenceDiagramGenerator';
import mermaid from 'mermaid';

SyntaxHighlighter.registerLanguage('javascript', js);

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export const SequenceDiagramGenerator: React.FC = () => {
  const [framework, setFramework] = useState<TestFramework>('playwright');
  const [code, setCode] = useState('');
  const [mermaidSyntax, setMermaidSyntax] = useState('');
  const [svgOutput, setSvgOutput] = useState('');
  const [error, setError] = useState('');
  const diagramRef = useRef<HTMLDivElement>(null);

  const handleGenerate = useCallback(async () => {
    setError('');
    setSvgOutput('');

    if (!code.trim()) {
      setError('Please enter test code to generate a diagram.');
      setMermaidSyntax('');
      return;
    }

    try {
      const diagram = generateSequenceDiagram(code, framework);
      if (!diagram) {
        setError('No test steps could be parsed from the provided code. Please check the format.');
        setMermaidSyntax('');
        return;
      }
      setMermaidSyntax(diagram);
    } catch (e) {
      setError(`Failed to parse test code: ${e instanceof Error ? e.message : String(e)}`);
      setMermaidSyntax('');
    }
  }, [code, framework]);

  // Render Mermaid diagram when syntax changes
  useEffect(() => {
    if (!mermaidSyntax) {
      setSvgOutput('');
      return;
    }

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidSyntax);
        setSvgOutput(svg);
        setError('');
      } catch (e) {
        setError(`Failed to render diagram: ${e instanceof Error ? e.message : String(e)}`);
        setSvgOutput('');
      }
    };

    renderDiagram();
  }, [mermaidSyntax]);

  const loadSample = () => {
    let sample: string;
    if (framework === 'codeceptjs') {
      sample = sampleCodeceptJS;
    } else if (framework === 'pytest') {
      sample = samplePytest;
    } else {
      sample = samplePlaywright;
    }
    setCode(sample);
  };

  const handleClear = () => {
    setCode('');
    setMermaidSyntax('');
    setSvgOutput('');
    setError('');
  };

  const handleDownloadSVG = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sequence-diagram.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (!svgOutput) return;

    const svgBlob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'sequence-diagram.png';
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <Container className="py-4">
      <h2 className="mb-3">
        📊 Sequence Diagram Generator
      </h2>
      <p className="text-muted mb-4">
        Generate sequence diagrams from CodeceptJS, Playwright, or Pytest test code. Paste your test code below
        and visualize the test flow as a Mermaid sequence diagram.
      </p>

      <Row className="mb-3">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Test Framework</span>
              <div>
                <Badge
                  bg={framework === 'playwright' ? 'primary' : 'secondary'}
                  className="me-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFramework('playwright')}
                  role="button"
                  aria-label="Select Playwright framework"
                >
                  🎭 Playwright
                </Badge>
                <Badge
                  bg={framework === 'codeceptjs' ? 'primary' : 'secondary'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFramework('codeceptjs')}
                  role="button"
                  aria-label="Select CodeceptJS framework"
                >
                  🤖 CodeceptJS
                </Badge>
                <Badge
                  bg={framework === 'pytest' ? 'primary' : 'secondary'}
                  className="ms-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFramework('pytest')}
                  role="button"
                  aria-label="Select Pytest framework"
                >
                  🐍 Pytest
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label>Paste your test code:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={15}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`Paste your ${framework === 'playwright' ? 'Playwright' : framework === 'pytest' ? 'Pytest' : 'CodeceptJS'} test code here...`}
                  className="font-monospace"
                  aria-label="Test code input"
                  style={{ fontSize: '0.85rem' }}
                />
              </Form.Group>
              <div className="mt-3 d-flex gap-2 flex-wrap">
                <Button variant="primary" onClick={handleGenerate} aria-label="Generate diagram">
                  📊 Generate Diagram
                </Button>
                <Button variant="outline-secondary" onClick={loadSample} aria-label="Load sample code">
                  📝 Load Sample
                </Button>
                <Button variant="outline-danger" onClick={handleClear} aria-label="Clear all">
                  🗑️ Clear
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          {error && (
            <Alert variant="warning" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {mermaidSyntax && (
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Mermaid Syntax</span>
                <CopyWithToast text={mermaidSyntax} />
              </Card.Header>
              <Card.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
                <SyntaxHighlighter language="javascript" style={docco} wrapLongLines>
                  {mermaidSyntax}
                </SyntaxHighlighter>
              </Card.Body>
            </Card>
          )}

          {svgOutput && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Diagram Preview</span>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-primary" onClick={handleDownloadSVG} aria-label="Download SVG">
                    ⬇️ SVG
                  </Button>
                  <Button size="sm" variant="outline-primary" onClick={handleDownloadPNG} aria-label="Download PNG">
                    ⬇️ PNG
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div
                  ref={diagramRef}
                  className="text-center"
                  style={{ overflow: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              </Card.Body>
            </Card>
          )}

          {!mermaidSyntax && !error && (
            <Card className="text-center p-5">
              <Card.Body>
                <p className="text-muted mb-0">
                  📊 Your sequence diagram will appear here after generating.
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SequenceDiagramGenerator;
