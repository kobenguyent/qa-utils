import { useState, useCallback, useRef } from 'react';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast.tsx';
import { convertMarkdownToConfluence } from '../../utils/sharedTools';

export const MarkdownToConfluence = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConvert = useCallback(() => {
    setOutput(convertMarkdownToConfluence(input));
  }, [input]);

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const readers: Promise<string>[] = [];
    Array.from(files).forEach((file) => {
      readers.push(
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string ?? '');
          reader.onerror = reject;
          reader.readAsText(file);
        })
      );
    });
    Promise.all(readers).then((contents) => {
      setInput(contents.join('\n\n---\n\n'));
      setOutput('');
    }).catch(() => {/* ignore read errors */});
    // reset so the same file can be re-uploaded
    e.target.value = '';
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">📝</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Markdown to Confluence Wiki</h1>
          <p className="tool-header-desc">
            Convert Markdown text or files to Confluence Wiki markup. Supports
            headings, bold, italic, code blocks, tables, lists, links, and more.
          </p>
        </div>
      </div>

      {/* File upload */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          variant="outline-secondary"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload Markdown file(s)"
        >
          📂 Upload .md file(s)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          multiple
          style={{ display: 'none' }}
          aria-hidden="true"
          onChange={handleFileUpload}
        />
        {input && (
          <span className="tool-badge tool-badge-muted">
            {input.length} chars
          </span>
        )}
      </div>

      <Row className="g-3">
        {/* Input */}
        <Col xs={12} md={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>📄</span>
              <span>Markdown Input</span>
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              <Form.Control
                as="textarea"
                rows={16}
                className="tool-textarea"
                placeholder={`Paste your Markdown here, e.g.:\n\n# My Heading\n\n**Bold text**, _italic_, and \`inline code\`\n\n- List item 1\n- List item 2`}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setOutput('');
                }}
                aria-label="Markdown input"
              />
              <div className="tool-action-row">
                <Button
                  variant="primary"
                  onClick={handleConvert}
                  disabled={!input.trim()}
                  aria-label="Convert to Confluence Wiki"
                >
                  🔄 Convert
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleClear}
                  disabled={!input && !output}
                  aria-label="Clear input and output"
                >
                  🗑️ Clear
                </Button>
              </div>
            </div>
          </div>
        </Col>

        {/* Output */}
        <Col xs={12} md={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>🏛️</span>
              <span>Confluence Wiki Output</span>
              {output && (
                <span className="tool-badge tool-badge-success ms-auto">
                  ✓ {output.length} chars
                </span>
              )}
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              <Form.Control
                as="textarea"
                rows={16}
                className="tool-output"
                readOnly
                placeholder="Confluence Wiki markup will appear here…"
                value={output}
                aria-label="Confluence Wiki output"
              />
              {output && (
                <div className="tool-action-row">
                  <CopyWithToast text={output} />
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Reference card */}
      <div className="tool-card mt-4">
        <div className="tool-card-header">
          <span>📚</span>
          <span>Conversion Reference</span>
        </div>
        <div className="tool-card-body">
          <Row className="g-3">
            {[
              { md: '# Heading 1', wiki: 'h1. Heading 1' },
              { md: '## Heading 2', wiki: 'h2. Heading 2' },
              { md: '**bold**', wiki: '*bold*' },
              { md: '_italic_', wiki: '_italic_' },
              { md: '~~strike~~', wiki: '-strike-' },
              { md: '`inline code`', wiki: '{{inline code}}' },
              { md: '```js\\ncode\\n```', wiki: '{code:language=js}\\ncode\\n{code}' },
              { md: '- item', wiki: '* item' },
              { md: '1. item', wiki: '# item' },
              { md: '[text](url)', wiki: '[text|url]' },
              { md: '![alt](url)', wiki: '!url|alt=alt!' },
              { md: '> quote', wiki: '{quote}quote{quote}' },
              { md: '---', wiki: '----' },
              { md: 'GFM table', wiki: '|| header || ... ||' },
            ].map(({ md, wiki }) => (
              <Col xs={12} sm={6} md={4} key={md}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                }}>
                  <code style={{ color: 'var(--primary)' }}>{md}</code>
                  <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>→</span>
                  <code style={{ color: 'var(--success, #28a745)' }}>{wiki}</code>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </Container>
  );
};
