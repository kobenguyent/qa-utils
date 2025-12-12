import { Button, Container, Alert } from "react-bootstrap";
import CopyWithToast from '../CopyWithToast.tsx';
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

// TypeScript interfaces for our encryption component
interface EncryptionResult {
  data: string;
  iv: string;
  salt: string;
}

interface DecryptionInput {
  data: string;
  iv: string;
  salt: string;
}

export const EncryptionTool = () => {
  const [content, setContent] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to derive a key from passphrase using PBKDF2
  const deriveKey = async (passphrase: string, salt: Uint8Array): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  // Function to encrypt content using AES-256-GCM
  const encryptContent = async () => {
    if (!content.trim()) {
      setError('Please enter content to encrypt');
      return;
    }
    if (!passphrase.trim()) {
      setError('Please enter a passphrase');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      
      // Generate random salt and IV
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Derive key from passphrase
      const key = await deriveKey(passphrase, salt);
      
      // Encrypt the data
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      // Create result object with encrypted data, IV, and salt
      const encryptionResult: EncryptionResult = {
        data: Array.from(new Uint8Array(encryptedData)).map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
      };

      setResult(JSON.stringify(encryptionResult, null, 2));
    } catch (err) {
      setError(`Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to decrypt content using AES-256-GCM
  const decryptContent = async () => {
    if (!content.trim()) {
      setError('Please enter encrypted content to decrypt');
      return;
    }
    if (!passphrase.trim()) {
      setError('Please enter a passphrase');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Parse the encrypted data JSON
      let decryptionInput: DecryptionInput;
      try {
        decryptionInput = JSON.parse(content);
      } catch {
        setError('Invalid encrypted data format. Please ensure it\'s valid JSON.');
        return;
      }

      // Validate required fields
      if (!decryptionInput.data || !decryptionInput.iv || !decryptionInput.salt) {
        setError('Encrypted data must contain data, iv, and salt fields');
        return;
      }

      // Convert hex strings back to Uint8Arrays
      const encryptedData = new Uint8Array(
        decryptionInput.data.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const iv = new Uint8Array(
        decryptionInput.iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const salt = new Uint8Array(
        decryptionInput.salt.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );

      // Derive key from passphrase using the same salt
      const key = await deriveKey(passphrase, salt);

      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
      );

      // Convert decrypted data back to string
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decryptedData);
      
      setResult(decryptedText);
    } catch (err) {
      setError(`Decryption failed: ${err instanceof Error ? err.message : 'Invalid passphrase or corrupted data'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setContent('');
    setPassphrase('');
    setResult('');
    setError('');
  };

  return (
    <Container>      <div className="text-center">
        <h1>🔐 Encryption/Decryption Tool</h1>
        <p className="text-muted">Secure AES-256-GCM encryption and decryption</p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Content:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Enter text to encrypt or encrypted JSON to decrypt"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Passphrase:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="password"
              placeholder="Enter your encryption passphrase"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
            />
            <Form.Text className="text-muted">
              Use a strong passphrase. This will be used to derive the encryption key.
            </Form.Text>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Result:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              as="textarea"
              rows={6}
              readOnly
              value={result}
              placeholder="Encryption/decryption result will appear here"
            />
            {result && (
              <div className="mt-2">
                <CopyWithToast text={result} />
              </div>
            )}
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Col sm={{ span: 10, offset: 2 }}>
            <Button 
              variant="outline-secondary" 
              onClick={clearAll}
              disabled={isLoading}
              className="me-2"
            >
              Clear All
            </Button>
            <Button 
              variant="primary" 
              onClick={encryptContent}
              disabled={isLoading}
              className="me-2"
            >
              {isLoading ? 'Encrypting...' : '🔒 Encrypt'}
            </Button>
            <Button 
              variant="success" 
              onClick={decryptContent}
              disabled={isLoading}
            >
              {isLoading ? 'Decrypting...' : '🔓 Decrypt'}
            </Button>
          </Col>
        </Form.Group>
      </Form>

      <div className="mt-4">
        <h5>📝 Usage Instructions:</h5>
        <ul className="text-muted">
          <li><strong>To Encrypt:</strong> Enter your text and passphrase, then click "Encrypt". Copy the JSON result.</li>
          <li><strong>To Decrypt:</strong> Paste the encrypted JSON, enter the same passphrase, then click "Decrypt".</li>
          <li><strong>Security:</strong> Uses AES-256-GCM with PBKDF2 key derivation (100,000 iterations).</li>
          <li><strong>Note:</strong> Keep your passphrase safe. Without it, encrypted data cannot be recovered.</li>
        </ul>
      </div>    </Container>
  );
};