import { Button, Container, Row, Col, Form } from "react-bootstrap";
import { useState, useCallback } from 'react';
import { encode, decode } from 'js-base64';
import CopyWithToast from '../CopyWithToast.tsx';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

export const Base64 = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');
  const ai = useAIAssistant();

  const handleConvert = useCallback(() => {
    setError('');
    try {
      if (mode === 'encode') {
        setOutput(encode(input));
      } else {
        setOutput(decode(input));
      }
    } catch {
      setError('Failed to decode. Make sure the input is valid Base64.');
      setOutput('');
    }
  }, [input, mode]);

  const handleModeSwitch = (newMode: 'encode' | 'decode') => {
    setMode(newMode);
    setOutput('');
    setError('');
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const handleSwap = () => {
    if (output) {
      setInput(output);
      setOutput('');
      setError('');
    }
  };

  const handleAIExplain = async () => {
    const content = output || input;
    try {
      await ai.sendRequest(
        'You are a helpful assistant. Analyze the provided content and explain what it is, what format it might be in, and any relevant details. Be concise.',
        `Explain this content:\n\n${content}`
      );
    } catch {
      // error is displayed by AIAssistButton
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">🛸</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Base64 Encode / Decode</h1>
          <p className="tool-header-desc">
            Convert text or data to and from Base64 encoding instantly.
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <span className="fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>MODE:</span>
        <div className="btn-group tool-mode-toggle" role="group" aria-label="Select mode">
          <button
            type="button"
            className={`btn ${mode === 'encode' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleModeSwitch('encode')}
          >
            ⬆️ Encode
          </button>
          <button
            type="button"
            className={`btn ${mode === 'decode' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleModeSwitch('decode')}
          >
            ⬇️ Decode
          </button>
        </div>
      </div>

      <Row className="g-3">
        {/* Input */}
        <Col xs={12} md={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>📥</span>
              <span>Input</span>
              {input && (
                <span className="tool-badge tool-badge-muted ms-auto">
                  {input.length} chars
                </span>
              )}
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              <Form.Control
                as="textarea"
                rows={8}
                className="tool-textarea"
                placeholder={mode === 'encode' ? 'Enter text to encode…' : 'Paste Base64 string to decode…'}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
              />
              <div className="tool-action-row">
                <Button
                  variant="primary"
                  onClick={handleConvert}
                  disabled={!input.trim()}
                >
                  {mode === 'encode' ? '⬆️ Encode' : '⬇️ Decode'}
                </Button>
                <Button variant="outline-secondary" onClick={handleClear} disabled={!input && !output}>
                  🗑️ Clear
                </Button>
                {output && (
                  <Button variant="outline-secondary" onClick={handleSwap} title="Move output back to input">
                    🔁 Swap
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Col>

        {/* Output */}
        <Col xs={12} md={6}>
          <div className="tool-card h-100">
            <div className="tool-card-header">
              <span>📤</span>
              <span>Output</span>
              {output && !error && (
                <span className="tool-badge tool-badge-success ms-auto">
                  ✓ {output.length} chars
                </span>
              )}
              {error && (
                <span className="tool-badge tool-badge-danger ms-auto">
                  ✗ Error
                </span>
              )}
            </div>
            <div className="tool-card-body d-flex flex-column gap-3">
              <Form.Control
                as="textarea"
                rows={8}
                className="tool-output"
                readOnly
                placeholder="Result will appear here…"
                value={error || output}
                style={error ? { color: 'var(--danger)' } : {}}
              />
              {output && !error && (
                <div className="tool-action-row">
                  <CopyWithToast text={output} />
                  {ai.isConfigured ? (
                    <AIAssistButton
                      label="Explain Content"
                      onClick={handleAIExplain}
                      isLoading={ai.isLoading}
                      disabled={!output.trim()}
                      error={ai.error}
                      result={ai.result}
                      onClear={ai.clear}
                    />
                  ) : (
                    <AIConfigureHint />
                  )}
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
