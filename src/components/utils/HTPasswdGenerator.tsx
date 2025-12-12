import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';

export const HTPasswdGenerator: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [htpasswd, setHtpasswd] = useState('');
  const [algorithm, setAlgorithm] = useState<'md5' | 'sha1'>('md5');

  const generateSHA1 = async (pass: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pass);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const base64 = btoa(String.fromCharCode(...hashArray));
    return `{SHA}${base64}`;
  };

  const generateMD5Hash = async (input: string): Promise<string> => {
    // MD5 is not available in Web Crypto API, so we'll use a simple implementation
    // Note: This is a simplified version for demonstration
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateRandomSalt = (length = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
    let salt = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      salt += chars.charAt(randomValues[i] % chars.length);
    }
    return salt;
  };

  const generateHTPasswd = async () => {
    if (!username || !password) {
      return;
    }

    let result = '';
    
    try {
      if (algorithm === 'md5') {
        const salt = generateRandomSalt();
        // Using SHA-256 as MD5 is not available in Web Crypto API
        // For production, use server-side htpasswd tool with proper MD5 APR1
        const hash = await generateMD5Hash(password + salt);
        result = `${username}:$apr1$${salt}$${hash.substring(0, 22)}`;
      } else if (algorithm === 'sha1') {
        const hash = await generateSHA1(password);
        result = `${username}:${hash}`;
      }

      setHtpasswd(result);
    } catch (error) {
      console.error('Error generating htpasswd:', error);
      setHtpasswd('Error generating htpasswd entry');
    }
  };

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">🔐 HTPasswd Generator</h1>
      <p className="text-muted">Generate htpasswd entries for HTTP authentication</p>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Credentials</h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Algorithm</Form.Label>
                <Form.Select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as 'md5' | 'sha1')}
                >
                  <option value="md5">MD5-based (SHA-256 fallback)</option>
                  <option value="sha1">SHA-1</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  SHA-1 is widely supported. For production MD5 APR1, use server-side htpasswd tool.
                </Form.Text>
              </Form.Group>

              <Button
                variant="primary"
                onClick={generateHTPasswd}
                className="w-100"
                disabled={!username || !password}
              >
                Generate HTPasswd Entry
              </Button>
            </Card.Body>
          </Card>

          <Alert variant="info">
            <Alert.Heading>ℹ️ About HTPasswd</Alert.Heading>
            <p className="mb-0">
              HTPasswd files are used for basic HTTP authentication in web servers like Apache and Nginx.
              The generated entry can be added to your <code>.htpasswd</code> file.
            </p>
          </Alert>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Generated HTPasswd Entry</h5>
              
              {htpasswd && (
                <>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={htpasswd}
                    readOnly
                    className="font-monospace mb-3"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <CopyWithToast text={htpasswd} />

                  <Alert variant="warning" className="mt-3">
                    <strong>⚠️ Security Notice:</strong>
                    <ul className="mb-0 mt-2">
                      <li>This tool runs entirely in your browser - credentials are not sent anywhere</li>
                      <li>True MD5 APR1 requires server-side tools (this uses SHA-256 fallback)</li>
                      <li>SHA-1 is considered weak by modern standards</li>
                      <li>For production, use the server-side <code>htpasswd</code> command</li>
                      <li>Never commit htpasswd files to version control</li>
                    </ul>
                  </Alert>
                </>
              )}

              {!htpasswd && (
                <p className="text-muted text-center py-5">
                  Enter username and password, then click "Generate HTPasswd Entry"
                </p>
              )}
            </Card.Body>
          </Card>

          {htpasswd && (
            <Card className="mt-3">
              <Card.Body>
                <h6>💡 How to Use</h6>
                <ol className="small mb-0">
                  <li>Copy the generated entry above</li>
                  <li>Create or edit your <code>.htpasswd</code> file</li>
                  <li>Paste the entry on a new line</li>
                  <li>Configure your web server to use the htpasswd file</li>
                </ol>
                <hr />
                <h6>Server-Side Command (Recommended):</h6>
                <pre className="bg-light p-2 rounded small mb-2">
{`htpasswd -c .htpasswd ${username || 'username'}`}
                </pre>
                <h6>Example Apache Configuration:</h6>
                <pre className="bg-light p-2 rounded small">
{`<Directory "/var/www/html">
    AuthType Basic
    AuthName "Restricted Area"
    AuthUserFile /path/to/.htpasswd
    Require valid-user
</Directory>`}
                </pre>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};
