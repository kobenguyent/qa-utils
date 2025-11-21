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
  Tabs,
  Tab,
  ListGroup,
  ProgressBar,
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
  getDefaultModel,
  fetchOpenAIModels,
  fetchOllamaModels,
  ModelInfo,
} from '../../utils/aiChatClient';
import { KnowledgeBase, parseFileContent } from '../../utils/knowledgeManager';
import { MCPClient, MCPServerConfig } from '../../utils/mcpClient';
import { useSessionStorage } from '../../utils/useSessionStorage';

interface ConversationMessage extends ChatMessage {
  id: string;
  timestamp: number;
}

export const AIChat: React.FC = () => {
  // Configuration state with session storage
  const [provider, setProvider] = useSessionStorage<AIProvider>('aiChat_provider', 'openai');
  const [apiKey, setApiKey] = useSessionStorage<string>('aiChat_apiKey', '');
  const [endpoint, setEndpoint] = useSessionStorage<string>('aiChat_endpoint', 'http://localhost:11434');
  const [model, setModel] = useSessionStorage<string>('aiChat_model', '');
  const [temperature, setTemperature] = useSessionStorage<number>('aiChat_temperature', 0.7);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  
  // Chat state with session storage
  const [messages, setMessages] = useSessionStorage<ConversationMessage[]>('aiChat_messages', []);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  // Knowledge base state with session storage
  const [knowledgeBase] = useState(() => new KnowledgeBase());
  const [uploadedFiles, setUploadedFiles] = useSessionStorage<Array<{ id: string; name: string }>>('aiChat_uploadedFiles', []);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // MCP state with session storage
  const [, setMcpClient] = useState<MCPClient | null>(null);
  const [mcpServerUrl, setMcpServerUrl] = useSessionStorage<string>('aiChat_mcpServerUrl', '');
  const [mcpConnected, setMcpConnected] = useState(false);
  const [mcpTools, setMcpTools] = useSessionStorage<Array<{ name: string; description: string }>>('aiChat_mcpTools', []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Restore knowledge base documents from session storage on mount
  useEffect(() => {
    // Check if window is defined (SSR/Node environment compatibility)
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const storedDocuments = window.sessionStorage.getItem('aiChat_knowledgeBaseDocuments');
      if (storedDocuments) {
        const documents = JSON.parse(storedDocuments);
        documents.forEach((doc: { content: string; metadata: Record<string, unknown> }) => {
          knowledgeBase.addDocument(doc.content, doc.metadata);
        });
      }
    } catch (error) {
      console.warn('Error restoring knowledge base documents:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - knowledgeBase is intentionally stable

  // Save knowledge base documents to session storage when files change
  useEffect(() => {
    // Check if window is defined (SSR/Node environment compatibility)
    if (typeof window === 'undefined') {
      return;
    }
    
    if (uploadedFiles.length > 0) {
      try {
        const documents = uploadedFiles.map(file => {
          const doc = knowledgeBase.getDocument(file.id);
          return doc ? { content: doc.content, metadata: doc.metadata } : null;
        }).filter(Boolean);
        window.sessionStorage.setItem('aiChat_knowledgeBaseDocuments', JSON.stringify(documents));
      } catch (error) {
        console.warn('Error saving knowledge base documents:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles]); // knowledgeBase is intentionally stable and doesn't need to be in deps

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update configured status when settings change
  useEffect(() => {
    if (provider === 'openai') {
      setIsConfigured(!!apiKey);
      if (!model) {
        setModel('gpt-3.5-turbo');
      }
    } else if (provider === 'ollama') {
      setIsConfigured(!!endpoint);
      if (!model) {
        setModel('llama2');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, apiKey, endpoint, model]); // setModel is intentionally excluded as it's a setter

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

  const formatErrorMessage = (err: Error): string => {
    const errorMessage = err.message || 'Connection failed';
    // Check if it's a CORS or network error for Ollama
    if (provider === 'ollama' && (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS'))) {
      return 'Connection failed. This is likely a CORS issue. Please ensure Ollama is running with OLLAMA_ORIGINS environment variable set. See the setup instructions above.';
    }
    return errorMessage;
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
    } catch (err) {
      setConnectionStatus('disconnected');
      setError(formatErrorMessage(err as Error));
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

    const originalMessage = inputMessage.trim();
    
    // Enhance message with knowledge base context if available
    const enhancedMessage = uploadedFiles.length > 0 
      ? await enhanceMessageWithContext(originalMessage)
      : originalMessage;

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: originalMessage, // Show original message in UI
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setError('');
    setLoading(true);

    try {
      const config = getConfig();
      
      // Build chat history with enhanced last message
      const chatHistory: ChatMessage[] = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: enhancedMessage, // Use enhanced message for LLM
        },
      ];

      const response = await sendChatMessage(chatHistory, config);

      const assistantMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConnectionStatus('connected');
    } catch (err) {
      setError(formatErrorMessage(err as Error));
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError('');
    // Clear chat-related session storage
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('aiChat_messages');
    }
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

  // Load available models when provider changes
  const handleLoadModels = async () => {
    setLoading(true);
    try {
      let models: ModelInfo[];
      if (provider === 'openai' && apiKey) {
        models = await fetchOpenAIModels(apiKey);
      } else if (provider === 'ollama' && endpoint) {
        models = await fetchOllamaModels(endpoint);
      } else {
        models = [getDefaultModel(provider)];
      }
      setAvailableModels(models);
    } catch (err) {
      setError(`Failed to load models: ${(err as Error).message}`);
      setAvailableModels([getDefaultModel(provider)]);
    } finally {
      setLoading(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(0);
    const uploadedFilesList: Array<{ id: string; name: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await parseFileContent(file);
        const id = knowledgeBase.addDocument(content, {
          filename: file.name,
          type: file.type,
        });
        uploadedFilesList.push({ id, name: file.name });
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (err) {
        setError(`Failed to upload ${file.name}: ${(err as Error).message}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...uploadedFilesList]);
    setUploadProgress(0);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (id: string) => {
    knowledgeBase.removeDocument(id);
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Connect to MCP server
  const handleConnectMCP = async () => {
    if (!mcpServerUrl) return;

    setLoading(true);
    try {
      const config: MCPServerConfig = {
        name: 'user-mcp-server',
        url: mcpServerUrl,
        apiKey: apiKey || undefined,
      };

      const client = new MCPClient(config);
      await client.connect();
      
      const tools = await client.listTools();
      setMcpClient(client);
      setMcpTools(tools.map(t => ({ name: t.name, description: t.description })));
      setMcpConnected(true);
      setError('');
    } catch (err) {
      setError(`MCP connection failed: ${(err as Error).message}`);
      setMcpConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Enhance message with knowledge base context
  const enhanceMessageWithContext = async (message: string): Promise<string> => {
    const relevantDocs = knowledgeBase.search(message, { method: 'keyword', limit: 3 });
    if (relevantDocs.length > 0) {
      const context = knowledgeBase.buildContext(relevantDocs, 2000);
      return `${context}\n\nUser question: ${message}`;
    }
    return message;
  };

  return (
    <Container fluid>
      <Header />
      <Container className="py-4">
        <div className="text-center mb-4">
          <h1>🤖 AI Chat</h1>
          <p className="text-muted">
            Advanced AI chat with OpenAI/Ollama support, file uploads, MCP integration, and Cache-Augmented Generation (CAG)
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
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Model</Form.Label>
                    <InputGroup>
                      {availableModels.length > 0 ? (
                        <Form.Select
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          disabled={loading}
                        >
                          {availableModels.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </Form.Select>
                      ) : (
                        <Form.Control
                          type="text"
                          placeholder={provider === 'openai' ? 'gpt-3.5-turbo' : 'llama2'}
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          disabled={loading}
                        />
                      )}
                      <Button 
                        variant="outline-secondary"
                        onClick={handleLoadModels}
                        disabled={loading || !isConfigured}
                        title="Load available models"
                      >
                        🔄
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Click 🔄 to load available models
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
                <>
                  <Alert variant="warning" className="mb-3">
                    <Alert.Heading className="h6">⚠️ CORS Configuration Required</Alert.Heading>
                    <p className="mb-2 small">
                      To connect from this web app, you need to configure Ollama to allow CORS requests.
                    </p>
                    <details className="small">
                      <summary style={{ cursor: 'pointer' }} className="mb-2">
                        <strong>Setup Instructions (Click to expand)</strong>
                      </summary>
                      <div className="mt-2">
                        <p className="mb-2"><strong>Set the OLLAMA_ORIGINS environment variable:</strong></p>
                        <div className="mb-2">
                          <strong>macOS/Linux:</strong>
                          <pre className="bg-dark text-light p-2 rounded mb-1">
                            <code>export OLLAMA_ORIGINS="https://kobenguyent.github.io"</code>
                          </pre>
                          <pre className="bg-dark text-light p-2 rounded mb-1">
                            <code>ollama serve</code>
                          </pre>
                        </div>
                        <div className="mb-2">
                          <strong>Windows (PowerShell):</strong>
                          <pre className="bg-dark text-light p-2 rounded mb-1">
                            <code>$env:OLLAMA_ORIGINS="https://kobenguyent.github.io"</code>
                          </pre>
                          <pre className="bg-dark text-light p-2 rounded mb-1">
                            <code>ollama serve</code>
                          </pre>
                        </div>
                        <div className="mb-2">
                          <strong>Windows (Command Prompt):</strong>
                          <pre className="bg-dark text-light p-2 rounded mb-1">
                            <code>set OLLAMA_ORIGINS=https://kobenguyent.github.io</code>
                          </pre>
                          <pre className="bg-dark text-light p-2 rounded mb-1">
                            <code>ollama serve</code>
                          </pre>
                        </div>
                        <p className="small text-muted mb-0">
                          Note: You may also use <code>OLLAMA_ORIGINS="*"</code> to allow all origins (less secure).
                        </p>
                      </div>
                    </details>
                  </Alert>
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
                </>
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

        {/* Advanced Features */}
        <Card className="mb-4">
          <Card.Body>
            <Tabs defaultActiveKey="knowledge" className="mb-3">
              <Tab eventKey="knowledge" title="📚 Knowledge Base">
                <div className="mb-3">
                  <Form.Label>Upload Documents to Extend LLM Knowledge</Form.Label>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.json,.csv,.pdf"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Upload files (.txt, .md, .json, .csv, .pdf) to provide additional context to the AI
                  </Form.Text>
                </div>

                {uploadProgress > 0 && (
                  <ProgressBar now={uploadProgress} label={`${Math.round(uploadProgress)}%`} className="mb-3" />
                )}

                {uploadedFiles.length > 0 && (
                  <div>
                    <h6>Uploaded Files ({uploadedFiles.length}):</h6>
                    <ListGroup>
                      {uploadedFiles.map(file => (
                        <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                          <span>📄 {file.name}</span>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveFile(file.id)}
                          >
                            Remove
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}

                {uploadedFiles.length === 0 && (
                  <Alert variant="info">
                    No files uploaded yet. Upload documents to enable context-aware responses using Cache-Augmented Generation (CAG).
                  </Alert>
                )}
              </Tab>

              <Tab eventKey="mcp" title="🔧 MCP Tools">
                <div className="mb-3">
                  <Form.Label>MCP Server URL</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="http://localhost:8080"
                      value={mcpServerUrl}
                      onChange={(e) => setMcpServerUrl(e.target.value)}
                      disabled={loading || mcpConnected}
                    />
                    <Button
                      variant={mcpConnected ? "success" : "primary"}
                      onClick={handleConnectMCP}
                      disabled={loading || !mcpServerUrl || mcpConnected}
                    >
                      {mcpConnected ? '✓ Connected' : '🔌 Connect'}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Connect to a Model Context Protocol (MCP) server to access tools and resources
                  </Form.Text>
                </div>

                {mcpConnected && mcpTools.length > 0 && (
                  <div>
                    <h6>Available Tools ({mcpTools.length}):</h6>
                    <ListGroup>
                      {mcpTools.map(tool => (
                        <ListGroup.Item key={tool.name}>
                          <strong>🔧 {tool.name}</strong>
                          <br />
                          <small className="text-muted">{tool.description}</small>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}

                {!mcpConnected && (
                  <Alert variant="info">
                    MCP (Model Context Protocol) allows the AI to access external tools and data sources. Connect to an MCP server to enhance capabilities.
                  </Alert>
                )}
              </Tab>

              <Tab eventKey="settings" title="⚙️ Advanced Settings">
                <Alert variant="info">
                  <Alert.Heading className="h6">💡 Advanced Features</Alert.Heading>
                  <ul className="mb-0 small">
                    <li><strong>Cache-Augmented Generation (CAG):</strong> Uploaded documents are cached for fast retrieval</li>
                    <li><strong>Keyword Search:</strong> Documents are indexed and searched using keyword matching</li>
                    <li><strong>Metadata Filtering:</strong> Files can be filtered by type, name, and upload date</li>
                    <li><strong>Large Context Windows:</strong> Supports models with extended context (4K-8K tokens)</li>
                    <li><strong>Prompt Engineering:</strong> Automatic context injection for enhanced responses</li>
                  </ul>
                </Alert>

                <div className="mb-3">
                  <h6>Knowledge Base Statistics</h6>
                  <div className="small">
                    <p className="mb-1">📄 Documents: {knowledgeBase.getStats().documentCount}</p>
                    <p className="mb-1">💾 Cache Size: {knowledgeBase.getStats().cacheStats.size} / {knowledgeBase.getStats().cacheStats.maxSize}</p>
                  </div>
                </div>

                <Button
                  variant="warning"
                  onClick={() => {
                    knowledgeBase.clear();
                    setUploadedFiles([]);
                    // Clear knowledge base from session storage
                    if (typeof window !== 'undefined') {
                      window.sessionStorage.removeItem('aiChat_knowledgeBaseDocuments');
                      window.sessionStorage.removeItem('aiChat_uploadedFiles');
                    }
                  }}
                  disabled={uploadedFiles.length === 0}
                >
                  🗑️ Clear Knowledge Base
                </Button>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>

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
