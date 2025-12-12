import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Badge } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';

export const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [strength, setStrength] = useState('');

  const generatePassword = () => {
    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      setPassword('Please select at least one character type');
      setStrength('');
      return;
    }

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setPassword(newPassword);
    calculateStrength(newPassword);
  };

  const calculateStrength = (pwd: string) => {
    let strengthScore = 0;
    if (pwd.length >= 12) strengthScore++;
    if (pwd.length >= 16) strengthScore++;
    if (/[a-z]/.test(pwd)) strengthScore++;
    if (/[A-Z]/.test(pwd)) strengthScore++;
    if (/[0-9]/.test(pwd)) strengthScore++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strengthScore++;

    if (strengthScore <= 2) setStrength('Weak');
    else if (strengthScore <= 4) setStrength('Medium');
    else setStrength('Strong');
  };

  const getStrengthColor = () => {
    if (strength === 'Weak') return 'danger';
    if (strength === 'Medium') return 'warning';
    if (strength === 'Strong') return 'success';
    return 'secondary';
  };

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">🔐 Password Generator</h1>
      <p className="text-muted">Generate secure random passwords</p>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Settings</h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Password Length: {length}</Form.Label>
                <Form.Range
                  min={4}
                  max={64}
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                />
              </Form.Group>

              <Form.Check
                type="checkbox"
                label="Include Uppercase Letters (A-Z)"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="mb-2"
              />

              <Form.Check
                type="checkbox"
                label="Include Lowercase Letters (a-z)"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
                className="mb-2"
              />

              <Form.Check
                type="checkbox"
                label="Include Numbers (0-9)"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="mb-2"
              />

              <Form.Check
                type="checkbox"
                label="Include Symbols (!@#$%^&*)"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="mb-3"
              />

              <Button variant="primary" onClick={generatePassword} className="w-100">
                Generate Password
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Generated Password</h5>
              
              {password && (
                <>
                  <div className="mb-3">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={password}
                      readOnly
                      className="font-monospace"
                      style={{ fontSize: '1.1rem' }}
                    />
                  </div>

                  {strength && (
                    <div className="mb-3">
                      <strong>Strength: </strong>
                      <Badge bg={getStrengthColor()}>{strength}</Badge>
                    </div>
                  )}

                  <CopyWithToast text={password} />
                </>
              )}

              {!password && (
                <p className="text-muted text-center py-4">
                  Click "Generate Password" to create a secure password
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <h5>💡 Password Security Tips</h5>
          <ul>
            <li>Use at least 12-16 characters for strong passwords</li>
            <li>Include a mix of uppercase, lowercase, numbers, and symbols</li>
            <li>Avoid using personal information or common words</li>
            <li>Use a unique password for each account</li>
            <li>Consider using a password manager to store passwords securely</li>
          </ul>
        </Card.Body>
      </Card>
    </Container>
  );
};
