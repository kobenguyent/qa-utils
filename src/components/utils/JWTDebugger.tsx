import {Container, Button, Alert, ButtonGroup} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { decodeToken } from "react-jwt";
import { useState, useCallback } from 'react';
// @ts-ignore
import {JSONViewer} from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CopyWithToast from '../CopyWithToast.tsx';

interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

export const JWTDebugger = () => {
  const [postContent, setPostContent] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  const [error, setError] = useState<string>('');
  const [isValidJWT, setIsValidJWT] = useState<boolean>(true);

  const handleJWTChange = useCallback((value: string) => {
    setPostContent(value);
    setError('');
    
    if (!value.trim()) {
      setIsValidJWT(false);
      return;
    }

    try {
      const decoded = decodeToken(value);
      setIsValidJWT(!!decoded);
      if (!decoded) {
        setError('Invalid JWT format. Please check your token.');
      }
    } catch (err) {
      setIsValidJWT(false);
      setError('Invalid JWT format. Please check your token.');
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
  }, [handleJWTChange]);

  const decodedData = postContent ? decodeToken<JWTPayload>(postContent) : null;
  const isExpired = decodedData?.exp ? decodedData.exp * 1000 < Date.now() : false;

  return(
    <Container>
      <Header></Header>
      <div className="text-center mb-4">
        <h1>JWT Debugger</h1>
        <p className="text-muted">Decode and analyze JSON Web Tokens (JWT)</p>
      </div>

      {isValidJWT && decodedData && (
        <div className="mb-3">
          <strong>Token Status:</strong>{' '}
          {isExpired ? (
            <span className="text-danger">⚠️ Expired</span>
          ) : (
            <span className="text-success">✅ Valid</span>
          )}
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Form>
        <Form.Group as={Row} className="mb-3" controlId="input">
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
              Paste a JWT token to decode its header, payload, and verify its structure.
            </Form.Text>
          </Col>
        </Form.Group>

        {isValidJWT && decodedData && (
          <>
            <Form.Group as={Row} className="mb-3" controlId="result">
              <Form.Label column lg="2" md="3" sm="12">
                Decoded Data:
              </Form.Label>
              <Col lg="10" md="9" sm="12">
                <div 
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.375rem',
                    padding: '0.5rem'
                  }}
                >
                  <JSONViewer 
                    data={decodedData} 
                    collapsible 
                    styles={jsonStyles}
                  />
                </div>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId="copy-to-clipboard">
              <Col lg="10" md="9" sm="12" className="offset-lg-2 offset-md-3">
                <CopyWithToast 
                  text={JSON.stringify(decodedData, null, 2) || ''}
                />
              </Col>
            </Form.Group>

            {decodedData.exp && (
              <Form.Group as={Row} className="mb-3">
                <Form.Label column lg="2" md="3" sm="12">
                  Expiration:
                </Form.Label>
                <Col lg="10" md="9" sm="12">
                  <div className="p-2 bg-light rounded">
                    <div><strong>Expires:</strong> {new Date(decodedData.exp * 1000).toLocaleString()}</div>
                    <div><strong>Time until expiry:</strong> {
                      isExpired 
                        ? <span className="text-danger">Token has expired</span>
                        : <span className="text-success">
                            {Math.floor((decodedData.exp * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days, {' '}
                            {Math.floor(((decodedData.exp * 1000 - Date.now()) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))} hours
                          </span>
                    }</div>
                  </div>
                </Col>
              </Form.Group>
            )}
          </>
        )}
      </Form>
      <Footer></Footer>
    </Container>
  )
}
