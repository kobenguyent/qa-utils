import React, { useState, useEffect, useRef } from 'react';
import { Button, Container, Form, Row, Col, Alert, Badge, Card, InputGroup } from 'react-bootstrap';
import { Header } from '../Header';
import { Footer } from '../Footer';
import CopyWithToast from '../CopyWithToast';
import {
  WebSocketClient,
  WebSocketConfig,
  WebSocketMessage,
  WebSocketResponse,
  isValidWebSocketUrl,
  formatWebSocketMessage,
  createWebSocketClient,
} from '../../utils/websocketClient';

interface ConnectionHistory {
  id: string;
  config: WebSocketConfig;
  timestamp: number;
  status: 'success' | 'failed';
}

export const WebSocketClientComponent: React.FC = () => {
  const [config, setConfig] = useState<WebSocketConfig>({
    url: 'wss://echo.websocket.org',
    protocols: [],
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    timeout: 30000,
  });

  const [messageInput, setMessageInput] = useState('{"type": "ping", "data": "Hello WebSocket!"}');
  const [response, setResponse] = useState<WebSocketResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<ConnectionHistory[]>([]);
  const [client, setClient] = useState<WebSocketClient | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [response?.messages]);

  const handleConnect = async () => {
    try {
      setError('');
      
      if (!isValidWebSocketUrl(config.url)) {
        setError('Please enter a valid WebSocket URL (ws:// or wss://)');
        return;
      }

      // Disconnect existing client if any
      if (client) {
        client.disconnect();
      }

      const newClient = createWebSocketClient(config);
      
      // Set up update callback
      newClient.onUpdateCallback((response: WebSocketResponse) => {
        setResponse(response);
      });

      await newClient.connect();
      setClient(newClient);

      // Add to history
      const historyEntry: ConnectionHistory = {
        id: `conn_${Date.now()}`,
        config: { ...config },
        timestamp: Date.now(),
        status: 'success',
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

    } catch (err: any) {
      const errorMsg = err.message || 'Connection failed';
      setError(errorMsg);
      
      // Add failed connection to history
      const historyEntry: ConnectionHistory = {
        id: `conn_${Date.now()}`,
        config: { ...config },
        timestamp: Date.now(),
        status: 'failed',
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    }
  };

  const handleDisconnect = () => {
    if (client) {
      client.disconnect();
      setClient(null);
    }
  };

  const handleSendMessage = () => {
    if (!client || client.getConnectionState() !== 'open') {
      setError('WebSocket is not connected');
      return;
    }

    if (!messageInput.trim()) {
      setError('Please enter a message to send');
      return;
    }

    try {
      client.sendMessage(messageInput);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const handleClearMessages = () => {
    if (client) {
      client.clearMessages();
    }
    setResponse(null);
  };

  const getConnectionBadge = () => {
    if (!client) return <Badge bg="secondary">Disconnected</Badge>;
    
    switch (client.getConnectionState()) {
      case 'connecting': return <Badge bg="warning">Connecting...</Badge>;
      case 'open': return <Badge bg="success">Connected</Badge>;
      case 'closing': return <Badge bg="warning">Closing...</Badge>;
      case 'closed': return <Badge bg="secondary">Disconnected</Badge>;
      default: return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getMessageBadge = (type: WebSocketMessage['type']) => {
    switch (type) {
      case 'sent': return <Badge bg="primary">SENT</Badge>;
      case 'received': return <Badge bg="success">RECEIVED</Badge>;
      case 'error': return <Badge bg="danger">ERROR</Badge>;
      case 'connection': return <Badge bg="info">CONNECTION</Badge>;
      case 'disconnection': return <Badge bg="warning">DISCONNECTION</Badge>;
      default: return <Badge bg="secondary">{String(type).toUpperCase()}</Badge>;
    }
  };

  const isConnected = client?.getConnectionState() === 'open';
  const isConnecting = client?.getConnectionState() === 'connecting';

  return (
    <Container fluid className="mt-3">
      <Header />
      
      <div className="text-center mb-4">
        <h1>🔌 WebSocket Client</h1>
        <p className="text-muted">Real-time WebSocket testing and debugging tool</p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Connection Configuration */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Connection Configuration {getConnectionBadge()}</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>WebSocket URL *</Form.Label>
                <Form.Control
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="wss://echo.websocket.org"
                  disabled={isConnected || isConnecting}
                />
                <Form.Text className="text-muted">
                  Enter a WebSocket URL starting with ws:// or wss://
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Protocols (comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  value={Array.isArray(config.protocols) ? config.protocols.join(', ') : config.protocols || ''}
                  onChange={(e) => {
                    const protocols = e.target.value.split(',').map(p => p.trim()).filter(p => p);
                    setConfig({ ...config, protocols });
                  }}
                  placeholder="chat, superchat"
                  disabled={isConnected || isConnecting}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Auto Reconnect"
                  checked={config.autoReconnect}
                  onChange={(e) => setConfig({ ...config, autoReconnect: e.target.checked })}
                  disabled={isConnected || isConnecting}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Reconnect Interval (ms)</Form.Label>
                <Form.Control
                  type="number"
                  value={config.reconnectInterval || 3000}
                  onChange={(e) => setConfig({ ...config, reconnectInterval: parseInt(e.target.value) || 3000 })}
                  disabled={isConnected || isConnecting || !config.autoReconnect}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Max Reconnect Attempts</Form.Label>
                <Form.Control
                  type="number"
                  value={config.maxReconnectAttempts || 5}
                  onChange={(e) => setConfig({ ...config, maxReconnectAttempts: parseInt(e.target.value) || 5 })}
                  disabled={isConnected || isConnecting || !config.autoReconnect}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Timeout (ms)</Form.Label>
                <Form.Control
                  type="number"
                  value={config.timeout || 30000}
                  onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) || 30000 })}
                  disabled={isConnected || isConnecting}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2">
            <Button
              variant={isConnected ? "outline-secondary" : "primary"}
              onClick={handleConnect}
              disabled={isConnected || isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
            <Button
              variant="outline-danger"
              onClick={handleDisconnect}
              disabled={!isConnected && !isConnecting}
            >
              Disconnect
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Message Sending */}
      {isConnected && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Send Message</h5>
          </Card.Header>
          <Card.Body>
            <InputGroup className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Enter message to send (JSON recommended)"
              />
              <Button variant="success" onClick={handleSendMessage}>
                Send Message
              </Button>
            </InputGroup>
            <small className="text-muted">
              Tip: Use JSON format for structured messages like {"{"}"type": "ping", "data": "hello"{"}"}</small>
          </Card.Body>
        </Card>
      )}

      {/* Messages */}
      {response && response.messages.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Messages ({response.messages.length})</h5>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" onClick={handleClearMessages}>
                Clear Messages
              </Button>
              <CopyWithToast
                text={response.messages.map(msg => formatWebSocketMessage(msg)).join('\n\n')}
              />
            </div>
          </Card.Header>
          <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {response.messages.map((message) => (
              <div key={message.id} className="mb-3 border-bottom pb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div>
                    {getMessageBadge(message.type)}
                    <span className="ms-2 text-muted small">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.status && (
                      <Badge bg="secondary" className="ms-1">{message.status}</Badge>
                    )}
                  </div>
                  <CopyWithToast
                    text={formatWebSocketMessage(message)}
                  />
                </div>
                <pre className="bg-light p-2 rounded small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  <code>{message.data}</code>
                </pre>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </Card.Body>
        </Card>
      )}

      {/* Connection History */}
      {history.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Connection History</h5>
          </Card.Header>
          <Card.Body>
            {history.map((entry) => (
              <div key={entry.id} className="mb-2 p-2 border rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg={entry.status === 'success' ? 'success' : 'danger'}>
                      {entry.status}
                    </Badge>
                    <span className="ms-2 fw-bold">{entry.config.url}</span>
                    {entry.config.protocols && Array.isArray(entry.config.protocols) && entry.config.protocols.length > 0 && (
                      <span className="ms-2 text-muted">({entry.config.protocols.join(', ')})</span>
                    )}
                  </div>
                  <small className="text-muted">
                    {new Date(entry.timestamp).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      <Footer />
    </Container>
  );
};