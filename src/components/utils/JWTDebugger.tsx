import { Container, Button, Alert, Row, Col, Badge } from "react-bootstrap";
import { useState, useCallback } from 'react';
// @ts-ignore
import { JSONViewer } from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';
import Form from 'react-bootstrap/Form';
import CopyWithToast from '../CopyWithToast.tsx';
import {
  decodeJWTHeader,
  decodeJWTPayload,
  getJWTSignature,
  isValidJWTStructure,
  isJWTExpired,
  formatTimestamp,
  getTimeUntilExpiry,
  verifyJWTSignature,
} from '../../utils/jwtHelpers.ts';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

export const JWTDebugger = () => {
  const [postContent, setPostContent] = useState('');
  const [error, setError] = useState<string>('');
  const [isValidJWT, setIsValidJWT] = useState<boolean>(true);
  const [secretKey, setSecretKey] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const ai = useAIAssistant();

  const handleJWTChange = useCallback((value: string) => {
    setPostContent(value);
    setError('');
    
    if (!value.trim()) {
      setIsValidJWT(false);
      return;
    }

    const valid = isValidJWTStructure(value);
    setIsValidJWT(valid);
    
    if (!valid) {
      setError('Invalid JWT format. A valid JWT should have three parts separated by dots (header.payload.signature).');
    }
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleJWTChange(text);
    } catch (err) {
      setError('Failed to read from clipboard. Please paste manually.');
    }
  }, [handleJWTChange]);

  const handleClearInput = useCallback(() => {
    handleJWTChange('');
    setSecretKey('');
    setVerificationResult(null);
  }, [handleJWTChange]);

  const handleVerifySignature = useCallback(async () => {
    if (!postContent || !secretKey) {
      setVerificationResult({
        verified: false,
        message: 'Please enter both JWT token and secret key'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyJWTSignature(postContent, secretKey);
      
      if (result.valid) {
        setVerificationResult({
          verified: true,
          message: '✅ Signature verified successfully! The token is authentic.'
        });
      } else {
        setVerificationResult({
          verified: false,
          message: result.error || '❌ Signature verification failed. The token may have been tampered with or the secret key is incorrect.'
        });
      }
    } catch (err) {
      setVerificationResult({
        verified: false,
        message: `❌ Verification error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setIsVerifying(false);
    }
  }, [postContent, secretKey]);

  const header = isValidJWT && postContent ? decodeJWTHeader(postContent) : null;
  const payload = isValidJWT && postContent ? decodeJWTPayload(postContent) : null;
  const signature = isValidJWT && postContent ? getJWTSignature(postContent) : null;
  const isExpired = isJWTExpired(payload);

  // Split token into colored parts for visualizer
  const tokenParts = postContent.trim().split('.');

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">🔑</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">JWT Debugger</h1>
          <p className="tool-header-desc">Decode and analyze JSON Web Tokens — header, payload, signature &amp; expiry claims.</p>
        </div>
        {isValidJWT && payload && (
          <span className={`tool-badge ${isExpired ? 'tool-badge-danger' : 'tool-badge-success'}`} style={{ flexShrink: 0 }}>
            {isExpired ? '⚠️ Expired' : '✅ Valid'}
          </span>
        )}
      </div>

      {/* Input card */}
      <div className="tool-card mb-4">
        <div className="tool-card-header">📥 Token Input</div>
        <div className="tool-card-body">
          <Form.Control
            as="textarea"
            rows={4}
            value={postContent}
            onChange={(e) => handleJWTChange(e.target.value)}
            placeholder="Paste your JWT token here…  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxw..."
            className={`tool-textarea${!isValidJWT && postContent ? ' is-invalid' : ''}`}
            style={{ minHeight: '96px', wordBreak: 'break-all' }}
          />

          {/* Color-coded token visualizer */}
          {postContent.trim() && tokenParts.length >= 2 && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.65rem 0.9rem',
              background: 'var(--code-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              lineHeight: 1.7,
              wordBreak: 'break-all',
            }}>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>{tokenParts[0]}</span>
              <span style={{ color: 'var(--muted)' }}>.</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{tokenParts[1]}</span>
              {tokenParts[2] && (
                <>
                  <span style={{ color: 'var(--muted)' }}>.</span>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>{tokenParts[2]}</span>
                </>
              )}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem', fontSize: '0.68rem' }}>
                <span style={{ color: '#f59e0b' }}>■ Header</span>
                <span style={{ color: '#34d399' }}>■ Payload</span>
                <span style={{ color: '#f87171' }}>■ Signature</span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="mt-2 mb-0 py-2" style={{ fontSize: '0.84rem' }}>
              {error}
            </Alert>
          )}

          <div className="tool-action-row mt-3">
            <Button variant="primary" size="sm" onClick={handlePasteFromClipboard}>
              📋 Paste from Clipboard
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={handleClearInput}>
              🗑️ Clear
            </Button>
            {isValidJWT && header?.alg && (
              <span className="tool-badge tool-badge-info ms-auto">
                {header.alg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Decoded panels */}
      {isValidJWT && header && payload && signature && (
        <>
          <Row className="g-3 mb-3">
            {/* Header panel */}
            <Col md={6}>
              <div className="tool-card h-100">
                <div className="tool-card-header" style={{ color: '#f59e0b', borderBottom: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.06)' }}>
                  📋 Header
                  {header.alg && (
                    <Badge bg="warning" text="dark" className="ms-auto" style={{ fontSize: '0.68rem' }}>
                      {header.alg}
                    </Badge>
                  )}
                </div>
                <div className="tool-card-body">
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    <JSONViewer data={header} collapsible styles={jsonStyles} />
                  </div>
                  <div className="tool-action-row mt-2">
                    <CopyWithToast text={JSON.stringify(header, null, 2)} />
                  </div>
                </div>
              </div>
            </Col>

            {/* Payload panel */}
            <Col md={6}>
              <div className="tool-card h-100">
                <div className="tool-card-header" style={{ color: '#34d399', borderBottom: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.06)' }}>
                  📦 Payload
                </div>
                <div className="tool-card-body">
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    <JSONViewer data={payload} collapsible styles={jsonStyles} />
                  </div>
                  <div className="tool-action-row mt-2">
                    <CopyWithToast text={JSON.stringify(payload, null, 2)} />
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Claims & Timestamps */}
          {(payload.iat || payload.exp || payload.nbf || payload.iss || payload.sub || payload.aud) && (
            <div className="tool-card mb-3">
              <div className="tool-card-header">⏰ Claims &amp; Timestamps</div>
              <div className="tool-card-body">
                <Row className="g-2">
                  {payload.iat && (
                    <Col sm={6} md={4}>
                      <div style={claimCardStyle}>
                        <div style={claimLabelStyle}>Issued At (iat)</div>
                        <div style={claimValueStyle}>{formatTimestamp(payload.iat)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{payload.iat}</div>
                      </div>
                    </Col>
                  )}
                  {payload.nbf && (
                    <Col sm={6} md={4}>
                      <div style={claimCardStyle}>
                        <div style={claimLabelStyle}>Not Before (nbf)</div>
                        <div style={claimValueStyle}>{formatTimestamp(payload.nbf)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{payload.nbf}</div>
                      </div>
                    </Col>
                  )}
                  {payload.exp && (
                    <Col sm={6} md={4}>
                      <div style={{ ...claimCardStyle, borderColor: isExpired ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)' }}>
                        <div style={claimLabelStyle}>Expires At (exp)</div>
                        <div style={{ ...claimValueStyle, color: isExpired ? 'var(--danger)' : 'var(--success)' }}>
                          {isExpired ? '❌ Expired' : `✅ ${getTimeUntilExpiry(payload.exp)}`}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{formatTimestamp(payload.exp)}</div>
                      </div>
                    </Col>
                  )}
                  {payload.iss && (
                    <Col sm={6} md={4}>
                      <div style={claimCardStyle}>
                        <div style={claimLabelStyle}>Issuer (iss)</div>
                        <code style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{payload.iss}</code>
                      </div>
                    </Col>
                  )}
                  {payload.sub && (
                    <Col sm={6} md={4}>
                      <div style={claimCardStyle}>
                        <div style={claimLabelStyle}>Subject (sub)</div>
                        <code style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{payload.sub}</code>
                      </div>
                    </Col>
                  )}
                  {payload.aud && (
                    <Col sm={6} md={4}>
                      <div style={claimCardStyle}>
                        <div style={claimLabelStyle}>Audience (aud)</div>
                        <code style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>
                          {Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud}
                        </code>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            </div>
          )}

          {/* Signature + Verify */}
          <div className="tool-card mb-3">
            <div className="tool-card-header" style={{ color: '#f87171', borderBottom: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.06)' }}>
              🔏 Signature
            </div>
            <div className="tool-card-body">
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--code-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(248,113,113,0.2)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                color: '#f87171',
                marginBottom: '0.75rem',
              }}>
                {signature}
              </div>
              <CopyWithToast text={signature} />

              {/* Verify section */}
              <div className="tool-divider mt-4">Verify Signature</div>
              <Alert variant="info" className="mb-3 py-2" style={{ fontSize: '0.82rem' }}>
                Only HMAC algorithms (HS256, HS384, HS512) are supported. Your secret never leaves the browser.
              </Alert>
              <Row className="g-2 align-items-end">
                <Col md={8}>
                  <Form.Label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)' }}>
                    Secret Key
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter secret key…"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="tool-textarea"
                    style={{ minHeight: 'unset', resize: 'none' }}
                  />
                </Col>
                <Col md={4}>
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={handleVerifySignature}
                    disabled={isVerifying || !secretKey || !postContent}
                  >
                    {isVerifying ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Verifying…
                      </>
                    ) : '🔍 Verify Signature'}
                  </Button>
                </Col>
              </Row>
              {verificationResult && (
                <Alert
                  variant={verificationResult.verified ? 'success' : 'danger'}
                  className="mt-3 mb-0 py-2"
                  style={{ fontSize: '0.85rem' }}
                >
                  {verificationResult.message}
                </Alert>
              )}
            </div>
          </div>

          {/* AI explain */}
          <div className="tool-card mb-3">
            <div className="tool-card-header">🤖 AI Analysis</div>
            <div className="tool-card-body">
              {ai.isConfigured ? (
                <AIAssistButton
                  label="Explain this JWT"
                  onClick={async () => {
                    try {
                      await ai.sendRequest(
                        'You are a security and JWT expert. Analyze the JWT token details and explain what each claim means, any security concerns, and recommendations. Be concise.',
                        `Analyze this JWT:\nHeader: ${JSON.stringify(header, null, 2)}\nPayload: ${JSON.stringify(payload, null, 2)}\nIs expired: ${isExpired}`
                      );
                    } catch {
                      // error displayed by AIAssistButton
                    }
                  }}
                  isLoading={ai.isLoading}
                  disabled={!isValidJWT || !payload}
                  error={ai.error}
                  result={ai.result}
                  onClear={ai.clear}
                />
              ) : (
                <AIConfigureHint />
              )}
            </div>
          </div>
        </>
      )}
    </Container>
  );
};

// Tiny shared styles for claim mini-cards
const claimCardStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  height: '100%',
};
const claimLabelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--muted)',
  marginBottom: '0.2rem',
};
const claimValueStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text)',
};
