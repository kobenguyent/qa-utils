import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Container, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Card,
  Badge,
  Spinner,
  InputGroup,
} from 'react-bootstrap';
import { Header } from '../Header';
import { Footer } from '../Footer';
import CopyWithToast from '../CopyWithToast';
import {
  sendChatMessage,
  testConnection,
  ChatMessage,
  ChatConfig,
  AIProvider,
} from '../../utils/aiChatClient';

interface ConversationMessage extends ChatMessage {
  id: string;
  timestamp: number;
}

export const AIChat: React.FC = () => {
  // Configuration state
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('http://localhost:11434');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  
  // Chat state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update configured status when settings change
  useEffect(() => {
    if (provider === 'openai') {
      setIsConfigured(!!apiKey);
      setModel(model || 'gpt-3.5-turbo');
    } else if (provider === 'ollama') {
      setIsConfigured(!!endpoint);
      setModel(model || 'llama2');
    }
  }, [provider, apiKey, endpoint, model]);

  const getConfig = (): ChatConfig => {
    return {
      provider,
      apiKey: provider === 'openai' ? apiKey : undefined,
      endpoint: provider === 'ollama' ? endpoint : undefined,
      model: model || (provider === 'openai' ? 'gpt-3.5-turbo' : 'llama2'),
      temperature,
      timeout: 60000,
    };
  };

  const handleTestConnection = async () => {
    setError('');
    setLoading(true);
    setConnectionStatus('unknown');

    try {
      const config = getConfig();
      const isConnected = await testConnection(config);
      
      if (isConnected) {
        setConnectionStatus('connected');
        setError('');
      } else {
        setConnectionStatus('disconnected');
        setError('Connection test failed');
      }
    } catch (err: any) {
      setConnectionStatus('disconnected');
      setError(err.message || 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      return;
    }

    if (!isConfigured) {
      setError(`Please configure your ${provider === 'openai' ? 'API key' : 'endpoint'} first`);
      return;
    }

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setError('');
    setLoading(true);

    try {
      const config = getConfig();
      const chatHistory: ChatMessage[] = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await sendChatMessage(chatHistory, config);

      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConnectionStatus('connected');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Container fluid>
      <Header />
      <Container className="py-4">
        <div className="text-center mb-4">
          <h1>🤖 AI Chat</h1>
          <p className="text-muted">
            Connect to OpenAI or local LLM services like Ollama for chat functionality
          </p>
        </div>

        {/* Configuration Panel */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              ⚙️ Configuration
              {connectionStatus === 'connected' && (
                <Badge bg="success" className="ms-2">Connected</Badge>
              )}
              {connectionStatus === 'disconnected' && (
                <Badge bg="danger" className="ms-2">Disconnected</Badge>
              )}
            </h5>
          </Card.Header>
          <Card.Body>
            <Form>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Provider</Form.Label>
                    <Form.Select
                      value={provider}
                      onChange={(e) => {
                        setProvider(e.target.value as AIProvider);
                        setConnectionStatus('unknown');
                      }}
                      disabled={loading}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="ollama">Ollama (Local)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Model</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={provider === 'openai' ? 'gpt-3.5-turbo' : 'llama2'}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={loading}
                    />
                    <Form.Text className="text-muted">
                      {provider === 'openai' 
                        ? 'e.g., gpt-3.5-turbo, gpt-4' 
                        : 'e.g., llama2, mistral, codellama'}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {provider === 'openai' && (
                <Form.Group className="mb-3">
                  <Form.Label>API Key</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setConnectionStatus('unknown');
                    }}
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Your OpenAI API key. Get it from{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      OpenAI Dashboard
                    </a>
                  </Form.Text>
                </Form.Group>
              )}

              {provider === 'ollama' && (
                <Form.Group className="mb-3">
                  <Form.Label>Endpoint</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="http://localhost:11434"
                    value={endpoint}
                    onChange={(e) => {
                      setEndpoint(e.target.value);
                      setConnectionStatus('unknown');
                    }}
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Ollama API endpoint. Install from{' '}
                    <a 
                      href="https://ollama.ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      ollama.ai
                    </a>
                  </Form.Text>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Temperature: {temperature.toFixed(1)}</Form.Label>
                <Form.Range
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  Higher values make output more random, lower values more focused
                </Form.Text>
              </Form.Group>

              <Button 
                variant="primary" 
                onClick={handleTestConnection}
                disabled={loading || !isConfigured}
              >
                {loading ? <Spinner animation="border" size="sm" /> : '🔌 Test Connection'}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Chat Messages */}
        <Card className="mb-3" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">💬 Chat</h5>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleClearChat}
                disabled={messages.length === 0 || loading}
              >
                Clear Chat
              </Button>
            </div>
          </Card.Header>
          <Card.Body style={{ overflowY: 'auto', flex: 1 }}>
            {messages.length === 0 ? (
              <div className="text-center text-muted mt-5">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div style={{ maxWidth: '70%' }}>
                    <Badge 
                      bg={msg.role === 'user' ? 'primary' : 'secondary'}
                      className="mb-1"
                    >
                      {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                      <span className="ms-2 small">{formatTimestamp(msg.timestamp)}</span>
                    </Badge>
                    <Card bg={msg.role === 'user' ? 'primary' : 'light'}>
                      <Card.Body className="py-2">
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {msg.content}
                        </div>
                        <div className="mt-2">
                          <CopyWithToast text={msg.content} />
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </Card.Body>
        </Card>

        {/* Message Input */}
        <Card>
          <Card.Body>
            <Form>
              <InputGroup>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading || !isConfigured}
                />
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim() || !isConfigured}
                  style={{ minWidth: '100px' }}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : '📤 Send'}
                </Button>
              </InputGroup>
              {!isConfigured && (
                <Form.Text className="text-warning">
                  ⚠️ Please configure your {provider === 'openai' ? 'API key' : 'endpoint'} above to start chatting
                </Form.Text>
              )}
            </Form>
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </Container>
  );
};
