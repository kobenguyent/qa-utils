import {Container, Button, Alert, ButtonGroup, Card, Badge} from "react-bootstrap";
import { useState, useCallback } from 'react';
// @ts-ignore
import {JSONViewer} from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
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

export const JWTDebugger = () => {
  const [postContent, setPostContent] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  const [error, setError] = useState<string>('');
  const [isValidJWT, setIsValidJWT] = useState<boolean>(true);
  const [secretKey, setSecretKey] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

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

  return(
    <Container>
      <div className="text-center mb-4">
        <h1>JWT Debugger</h1>
        <p className="text-muted">Decode and analyze JSON Web Tokens (JWT)</p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {isValidJWT && payload && (
        <Alert variant={isExpired ? "warning" : "success"} className="mb-3">
          <strong>Token Status:</strong>{' '}
          {isExpired ? (
            <span>⚠️ Expired</span>
          ) : (
            <span>✅ Valid</span>
          )}
          {header?.alg && (
            <span className="ms-3">
              <strong>Algorithm:</strong> <Badge bg="info">{header.alg}</Badge>
            </span>
          )}
        </Alert>
      )}

      <Form>
        <Form.Group as={Row} className="mb-4" controlId="input">
          <Form.Label column lg="2" md="3" sm="12">
            JWT Token:
          </Form.Label>
          <Col lg="10" md="9" sm="12">
            <Form.Control
              as="textarea"
              rows={4}
              id="jwt-input"
              value={postContent}
              onChange={(e) => handleJWTChange(e.target.value)}
              placeholder="Paste your JWT token here..."
              style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                wordBreak: 'break-all',
                resize: 'vertical'
              }}
              className={!isValidJWT && postContent ? 'is-invalid' : ''}
            />
            <div className="mt-2">
              <ButtonGroup size="sm">
                <Button 
                  variant="outline-primary" 
                  onClick={handlePasteFromClipboard}
                  title="Paste JWT from clipboard"
                >
                  📋 Paste from Clipboard
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={handleClearInput}
                  title="Clear input field"
                >
                  🗑️ Clear
                </Button>
              </ButtonGroup>
            </div>
            <Form.Text className="text-muted">
              Paste a JWT token to decode its header, payload, and signature parts.
            </Form.Text>
          </Col>
        </Form.Group>

        {isValidJWT && header && payload && signature && (
          <Row className="mb-4">
            <Col lg="12">
              <h4 className="mb-3">Decoded JWT</h4>
              
              {/* Header Section */}
              <Card className="mb-3 border-primary">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                  <span><strong>📋 Header</strong></span>
                  {header.alg && (
                    <Badge bg="light" text="dark">Algorithm: {header.alg}</Badge>
                  )}
                </Card.Header>
                <Card.Body>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <JSONViewer 
                      data={header} 
                      collapsible 
                      styles={jsonStyles}
                    />
                  </div>
                  <div className="mt-2">
                    <CopyWithToast 
                      text={JSON.stringify(header, null, 2)}
                    />
                  </div>
                </Card.Body>
              </Card>

              {/* Payload Section */}
              <Card className="mb-3 border-success">
                <Card.Header className="bg-success text-white">
                  <strong>📦 Payload</strong>
                </Card.Header>
                <Card.Body>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <JSONViewer 
                      data={payload} 
                      collapsible 
                      styles={jsonStyles}
                    />
                  </div>
                  <div className="mt-2">
                    <CopyWithToast 
                      text={JSON.stringify(payload, null, 2)}
                    />
                  </div>

                  {/* Timestamp Information */}
                  {(payload.iat || payload.exp || payload.nbf) && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6 className="mb-2"><strong>⏰ Timestamps</strong></h6>
                      {payload.iat && (
                        <div className="mb-1">
                          <strong>Issued At (iat):</strong> {formatTimestamp(payload.iat)}
                          <small className="text-muted ms-2">({payload.iat})</small>
                        </div>
                      )}
                      {payload.nbf && (
                        <div className="mb-1">
                          <strong>Not Before (nbf):</strong> {formatTimestamp(payload.nbf)}
                          <small className="text-muted ms-2">({payload.nbf})</small>
                        </div>
                      )}
                      {payload.exp && (
                        <>
                          <div className="mb-1">
                            <strong>Expires At (exp):</strong> {formatTimestamp(payload.exp)}
                            <small className="text-muted ms-2">({payload.exp})</small>
                          </div>
                          <div className={isExpired ? "text-danger" : "text-success"}>
                            <strong>Time until expiry:</strong>{' '}
                            {isExpired ? '❌ Token has expired' : `✅ ${getTimeUntilExpiry(payload.exp)}`}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Additional Claims */}
                  {(payload.iss || payload.sub || payload.aud) && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6 className="mb-2"><strong>🔐 Claims</strong></h6>
                      {payload.iss && (
                        <div className="mb-1">
                          <strong>Issuer (iss):</strong> <code>{payload.iss}</code>
                        </div>
                      )}
                      {payload.sub && (
                        <div className="mb-1">
                          <strong>Subject (sub):</strong> <code>{payload.sub}</code>
                        </div>
                      )}
                      {payload.aud && (
                        <div className="mb-1">
                          <strong>Audience (aud):</strong>{' '}
                          <code>{Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud}</code>
                        </div>
                      )}
                      {payload.jti && (
                        <div className="mb-1">
                          <strong>JWT ID (jti):</strong> <code>{payload.jti}</code>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Signature Section */}
              <Card className="mb-3 border-warning">
                <Card.Header className="bg-warning text-dark">
                  <strong>🔏 Signature</strong>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <code style={{
                      wordBreak: 'break-all',
                      display: 'block',
                      padding: '0.5rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      {signature}
                    </code>
                  </div>
                  <CopyWithToast text={signature} />
                  
                  {/* Signature Verification Section */}
                  <div className="mt-4">
                    <h6 className="mb-3"><strong>🔐 Verify Signature</strong></h6>
                    <Alert variant="info" className="mb-3">
                      <small>
                        Enter your secret key to verify the token signature. Only HMAC algorithms (HS256, HS384, HS512) are supported for browser-based verification.
                      </small>
                    </Alert>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Secret Key:</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter your secret key..."
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.875rem'
                        }}
                      />
                      <Form.Text className="text-muted">
                        Your secret key is used locally in the browser and is never sent to any server.
                      </Form.Text>
                    </Form.Group>

                    <Button
                      variant="primary"
                      onClick={handleVerifySignature}
                      disabled={isVerifying || !secretKey || !postContent}
                      className="mb-3"
                    >
                      {isVerifying ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Verifying...
                        </>
                      ) : (
                        '🔍 Verify Signature'
                      )}
                    </Button>

                    {verificationResult && (
                      <Alert 
                        variant={verificationResult.verified ? 'success' : 'danger'}
                        className="mb-0"
                      >
                        {verificationResult.message}
                      </Alert>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Form>
    </Container>
  )
}
