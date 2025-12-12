import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Tabs, Tab } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';

export const HashGenerator: React.FC = () => {
  const [input, setInput] = useState('');
  const [md5Hash, setMd5Hash] = useState('');
  const [sha1Hash, setSha1Hash] = useState('');
  const [sha256Hash, setSha256Hash] = useState('');
  const [sha512Hash, setSha512Hash] = useState('');

  const generateHashes = async () => {
    if (!input) {
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    try {
      // SHA-1
      const sha1Buffer = await crypto.subtle.digest('SHA-1', data);
      setSha1Hash(bufferToHex(sha1Buffer));

      // SHA-256
      const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
      setSha256Hash(bufferToHex(sha256Buffer));

      // SHA-512
      const sha512Buffer = await crypto.subtle.digest('SHA-512', data);
      setSha512Hash(bufferToHex(sha512Buffer));

      // MD5 is not supported by Web Crypto API, show message
      setMd5Hash('MD5 not supported in modern browsers (use SHA-256 instead)');
    } catch (error) {
      console.error('Error generating hashes:', error);
    }
  };

  const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">🔐 Hash Generator</h1>
      <p className="text-muted">Generate cryptographic hashes for text input</p>

      <Row>
        <Col md={5}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Input</h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Text to Hash</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter text to generate hashes..."
                />
              </Form.Group>

              <Button
                variant="primary"
                onClick={generateHashes}
                className="w-100"
                disabled={!input}
              >
                Generate Hashes
              </Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h5>ℹ️ About Hashing</h5>
              <ul className="small mb-0">
                <li><strong>SHA-256</strong>: Most commonly used, secure for most applications</li>
                <li><strong>SHA-512</strong>: More secure, larger hash size</li>
                <li><strong>SHA-1</strong>: Deprecated for security, but still used in some systems</li>
                <li>Hashes are one-way functions - you cannot reverse them</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Hash Results</h5>
              
              {(sha1Hash || sha256Hash || sha512Hash) ? (
                <Tabs defaultActiveKey="sha256" className="mb-3">
                  <Tab eventKey="sha256" title="SHA-256">
                    <Form.Group className="mb-3">
                      <Form.Label>SHA-256 Hash</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={sha256Hash}
                        readOnly
                        className="font-monospace small"
                      />
                      <div className="mt-2">
                        <CopyWithToast text={sha256Hash} />
                      </div>
                    </Form.Group>
                  </Tab>

                  <Tab eventKey="sha512" title="SHA-512">
                    <Form.Group className="mb-3">
                      <Form.Label>SHA-512 Hash</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={sha512Hash}
                        readOnly
                        className="font-monospace small"
                      />
                      <div className="mt-2">
                        <CopyWithToast text={sha512Hash} />
                      </div>
                    </Form.Group>
                  </Tab>

                  <Tab eventKey="sha1" title="SHA-1">
                    <Form.Group className="mb-3">
                      <Form.Label>SHA-1 Hash (Deprecated)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={sha1Hash}
                        readOnly
                        className="font-monospace small"
                      />
                      <div className="mt-2">
                        <CopyWithToast text={sha1Hash} />
                      </div>
                      <small className="text-warning">
                        ⚠️ SHA-1 is deprecated for security purposes. Use SHA-256 or SHA-512 instead.
                      </small>
                    </Form.Group>
                  </Tab>

                  <Tab eventKey="md5" title="MD5">
                    <Form.Group className="mb-3">
                      <Form.Label>MD5 Hash</Form.Label>
                      <p className="text-muted">
                        {md5Hash}
                      </p>
                      <small className="text-danger">
                        ⚠️ MD5 is not supported by modern browsers due to security vulnerabilities. 
                        Please use SHA-256 or SHA-512 instead.
                      </small>
                    </Form.Group>
                  </Tab>
                </Tabs>
              ) : (
                <p className="text-muted text-center py-5">
                  Enter text and click "Generate Hashes" to see the results
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
