import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Container,
  Form,
  Button,
  InputGroup,
  Spinner,
  Card,
  Collapse,
  Row,
  Col,
  Badge,
  Alert,
  Tabs,
  Tab,
  ListGroup,
  ProgressBar,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { KobeanMessage, getKobean, resetKobean, getAiChatSessionConfig } from '../../utils/KobeanAgent';
import {
  testConnection,
  ChatConfig,
  AIProvider,
  getDefaultModel,
  fetchModels,
  estimateTokenCount,
  getSystemPrompt,
  ModelInfo,
} from '../../utils/aiChatClient';
import { KnowledgeBase, parseFileContent } from '../../utils/knowledgeManager';
import { MCPClient, MCPServerConfig } from '../../utils/mcpClient';
import { ConversationManager, downloadConversation } from '../../utils/conversationManager';
import { DEFAULT_MCP_TOOLS, getToolCategories } from '../../utils/mcpTools';
import { MCPToolManager, getMCPToolGuide } from '../../utils/mcpToolManager';
import { useSessionStorage } from '../../utils/useSessionStorage';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import '../../styles/kobean.css';

export function KobeanAssistant() {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useSessionStorage<KobeanMessage[]>('kobean_messages', []);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // AI Configuration state with session storage (shared with AIChat)
    const [provider, setProvider] = useSessionStorage<AIProvider>('aiChat_provider', 'ollama');
    const [apiKey, setApiKey] = useSessionStorage<string>('aiChat_apiKey', '');
    const [endpoint, setEndpoint] = useSessionStorage<string>('aiChat_endpoint', 'http://localhost:11434');
    const [azureApiVersion, setAzureApiVersion] = useSessionStorage<string>('aiChat_azureApiVersion', '2024-02-15-preview');
    const [model, setModel] = useSessionStorage<string>('aiChat_model', '');
    const [temperature, setTemperature] = useSessionStorage<number>('aiChat_temperature', 0.7);
    const [optimizeTokens, setOptimizeTokens] = useSessionStorage<boolean>('aiChat_optimizeTokens', true);
    const [systemPromptType, setSystemPromptType] = useSessionStorage<'default' | 'technical' | 'creative'>('aiChat_systemPromptType', 'default');
    const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
    const [configExpanded, setConfigExpanded] = useSessionStorage<boolean>('aiChat_configExpanded', false);

    // Connection & loading state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
    const [tokenCount, setTokenCount] = useState({ input: 0, total: 0 });

    // Conversation management
    const [conversationManager] = useState(() => new ConversationManager());
    const [currentConversationId, setCurrentConversationId] = useSessionStorage<string | null>('aiChat_currentConversationId', null);
    const [conversations, setConversations] = useState(conversationManager.getConversations());

    // Knowledge base state with session storage
    const [knowledgeBase] = useState(() => new KnowledgeBase());
    const [uploadedFiles, setUploadedFiles] = useSessionStorage<Array<{ id: string; name: string }>>('aiChat_uploadedFiles', []);
    const [uploadProgress, setUploadProgress] = useState(0);

    // MCP state with session storage
    const [, setMcpClient] = useState<MCPClient | null>(null);
    const [mcpServerUrl, setMcpServerUrl] = useSessionStorage<string>('aiChat_mcpServerUrl', '');
    const [mcpConnected, setMcpConnected] = useState(false);
    const [showMcpGuide, setShowMcpGuide] = useState(false);
    const [mcpToolManager] = useState(() => new MCPToolManager());
    const [mcpToolStats, setMcpToolStats] = useState(mcpToolManager.getStats());

    const [isConfigured, setIsConfigured] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const agentRef = useRef(getKobean({
        aiProvider: 'ollama',
        aiEndpoint: 'http://localhost:11434',
        aiModel: 'mistral',
        ...getAiChatSessionConfig(),
    }));

    // Update configured status when settings change
    useEffect(() => {
        if (provider === 'openai' || provider === 'anthropic' || provider === 'google') {
            setIsConfigured(!!apiKey);
            if (!model) {
                const defaultModel = getDefaultModel(provider);
                setModel(defaultModel.id);
            }
        } else if (provider === 'azure-openai') {
            setIsConfigured(!!apiKey && !!endpoint);
            if (!model) {
                setModel('gpt-35-turbo');
            }
        } else if (provider === 'ollama') {
            setIsConfigured(!!endpoint);
            if (!model) {
                setModel('llama2');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider, apiKey, endpoint, model]);

    // Update Kobean agent when config changes
    useEffect(() => {
        resetKobean();
        agentRef.current = getKobean({
            aiProvider: provider,
            aiEndpoint: endpoint,
            aiModel: model || getDefaultModel(provider).id,
            aiApiKey: apiKey || undefined,
        });
    }, [provider, apiKey, endpoint, model]);

    // Restore knowledge base documents from session storage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const storedDocuments = window.sessionStorage.getItem('aiChat_knowledgeBaseDocuments');
            if (storedDocuments) {
                const documents = JSON.parse(storedDocuments);
                documents.forEach((doc: { content: string; metadata: Record<string, unknown> }) => {
                    knowledgeBase.addDocument(doc.content, doc.metadata);
                });
            }
        } catch (err) {
            console.warn('Error restoring knowledge base documents:', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save knowledge base documents to session storage when files change
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (uploadedFiles.length > 0) {
            try {
                const documents = uploadedFiles.map(file => {
                    const doc = knowledgeBase.getDocument(file.id);
                    return doc ? { content: doc.content, metadata: doc.metadata } : null;
                }).filter(Boolean);
                window.sessionStorage.setItem('aiChat_knowledgeBaseDocuments', JSON.stringify(documents));
            } catch (err) {
                console.warn('Error saving knowledge base documents:', err);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFiles]);

    // Update token count when input changes
    useEffect(() => {
        const inputTokens = estimateTokenCount(input);
        const conversationTokens = messages.reduce((sum, msg) => sum + estimateTokenCount(msg.content), 0);
        setTokenCount({ input: inputTokens, total: conversationTokens + inputTokens });
    }, [input, messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleProviderChange = (newProvider: AIProvider) => {
        setProvider(newProvider);
        setConnectionStatus('unknown');
        setAvailableModels([]);
        const defaultModel = getDefaultModel(newProvider);
        setModel(defaultModel.id);
        if (newProvider === 'ollama') {
            setEndpoint('http://localhost:11434');
        } else if (newProvider !== 'azure-openai') {
            setEndpoint('');
        }
    };

    const getConfig = (): ChatConfig => {
        const defaultModel = getDefaultModel(provider);
        return {
            provider,
            apiKey: (provider === 'openai' || provider === 'anthropic' || provider === 'google' || provider === 'azure-openai') ? apiKey : undefined,
            endpoint: (provider === 'ollama' || provider === 'azure-openai') ? endpoint : undefined,
            azureApiVersion: provider === 'azure-openai' ? azureApiVersion : undefined,
            model: model || defaultModel.id,
            temperature,
            timeout: 60000,
            optimizeTokens,
            systemPrompt: getSystemPrompt(systemPromptType),
        };
    };

    const formatErrorMessage = (err: Error): string => {
        const errorMessage = err.message || 'Connection failed';
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

    const handleLoadModels = async () => {
        setLoading(true);
        try {
            const models = await fetchModels(provider, { apiKey, endpoint });
            setAvailableModels(models);
            if (models.length > 0) {
                setModel(models[0].id);
            }
        } catch (err) {
            setError(`Failed to load models: ${(err as Error).message}`);
            const defaultModel = getDefaultModel(provider);
            setAvailableModels([defaultModel]);
            setModel(defaultModel.id);
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (id: string) => {
        knowledgeBase.removeDocument(id);
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    };

    // MCP handlers
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
            await mcpToolManager.loadToolsFromServer(client);
            setMcpClient(client);
            setMcpConnected(true);
            setMcpToolStats(mcpToolManager.getStats());
            setError('');
        } catch (err) {
            setError(`MCP connection failed: ${(err as Error).message}`);
            setMcpConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectMCP = () => {
        mcpToolManager.unloadServerTools();
        setMcpClient(null);
        setMcpConnected(false);
        setMcpToolStats(mcpToolManager.getStats());
    };

    const handleInitializeDefaultTools = () => {
        mcpToolManager.initializeDefaultTools();
        setMcpToolStats(mcpToolManager.getStats());
    };

    const handleEnableAllDefaultTools = () => {
        mcpToolManager.enableAllDefaultTools();
        setMcpToolStats(mcpToolManager.getStats());
    };

    const handleDisableAllTools = () => {
        mcpToolManager.disableAllTools();
        setMcpToolStats(mcpToolManager.getStats());
    };

    const handleToggleTool = (toolName: string) => {
        if (mcpToolManager.isToolEnabled(toolName)) {
            mcpToolManager.disableTool(toolName);
        } else {
            mcpToolManager.enableTool(toolName);
        }
        setMcpToolStats(mcpToolManager.getStats());
    };

    const handleExportToolConfig = () => {
        const config = mcpToolManager.exportConfig();
        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mcp-tools-config-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportToolConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const success = mcpToolManager.importConfig(content);
            if (success) {
                setMcpToolStats(mcpToolManager.getStats());
                setError('');
            } else {
                setError('Failed to import tool configuration');
            }
        };
        reader.readAsText(file);
    };

    // Conversation management
    const handleNewConversation = () => {
        const conversation = conversationManager.createConversation(
            `Chat ${new Date().toLocaleString()}`,
            provider,
            model
        );
        setCurrentConversationId(conversation.id);
        setMessages([]);
        setConversations(conversationManager.getConversations());
        setError('');
    };

    const handleLoadConversation = (id: string) => {
        const conversation = conversationManager.getConversation(id);
        if (conversation) {
            setCurrentConversationId(id);
            setMessages(conversation.messages as KobeanMessage[]);
            if (conversation.provider && conversation.provider !== provider) {
                setProvider(conversation.provider as AIProvider);
            }
            if (conversation.model && conversation.model !== model) {
                setModel(conversation.model);
            }
            setError('');
        }
    };

    const handleDeleteConversation = (id: string) => {
        if (conversationManager.deleteConversation(id)) {
            setConversations(conversationManager.getConversations());
            if (currentConversationId === id) {
                setCurrentConversationId(null);
                setMessages([]);
            }
        }
    };

    const handleExportConversation = (id: string, format: 'json' | 'markdown') => {
        const conversation = conversationManager.getConversation(id);
        if (conversation) {
            downloadConversation(conversation, format);
        }
    };

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        const message = input.trim();
        if (!message || isProcessing) return;

        setInput('');
        setIsProcessing(true);

        const userMessage: KobeanMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await agentRef.current?.processMessage(message);
            if (response) {
                const assistantMessage: KobeanMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: response.text,
                    timestamp: Date.now(),
                    toolResult: response.toolResult,
                };
                setMessages(prev => [...prev, assistantMessage]);

                if (response.navigateTo) {
                    setTimeout(() => navigate(response.navigateTo!), 1000);
                }
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
                timestamp: Date.now(),
            }]);
        } finally {
            setIsProcessing(false);
        }
    }, [input, isProcessing, navigate]);

    const handleClear = () => {
        setMessages([]);
        agentRef.current?.clearHistory();
    };

    return (
        <Container className="kobean-simple py-4" style={{ maxWidth: '900px' }}>
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="kobean-simple-title">🤖 Kobean Assistant</h2>
                <p className="text-muted small">AI-powered assistant with tool execution and multi-provider support</p>
            </div>

            {/* Configuration Panel */}
            <Card className="mb-3" style={{ border: '1px solid var(--border-color)' }}>
                <Card.Header
                    style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onClick={() => setConfigExpanded(!configExpanded)}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setConfigExpanded(!configExpanded); } }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={configExpanded}
                    aria-controls="kobean-config-collapse"
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text)' }}>
                            {configExpanded ? '▼' : '▶'} ⚙️ Configuration
                            {connectionStatus === 'connected' && (
                                <Badge bg="success" className="ms-2" style={{ fontSize: '0.85rem' }}>Connected</Badge>
                            )}
                            {connectionStatus === 'disconnected' && (
                                <Badge bg="danger" className="ms-2" style={{ fontSize: '0.85rem' }}>Disconnected</Badge>
                            )}
                        </h5>
                        <small className="text-muted">Click to {configExpanded ? 'collapse' : 'expand'}</small>
                    </div>
                </Card.Header>
                <Collapse in={configExpanded}>
                    <Card.Body id="kobean-config-collapse">
                    <Form>
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label style={{ fontWeight: '500', fontSize: '1rem', color: 'var(--text)' }}>Provider</Form.Label>
                            <Form.Select
                              value={provider}
                              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                              disabled={loading}
                              style={{ fontSize: '1rem' }}
                            >
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic Claude</option>
                              <option value="google">Google Gemini</option>
                              <option value="azure-openai">Azure OpenAI</option>
                              <option value="ollama">Ollama (Local)</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label style={{ fontWeight: '500', fontSize: '1rem', color: 'var(--text)' }}>Model</Form.Label>
                            <InputGroup>
                              {availableModels.length > 0 ? (
                                <Form.Select
                                  value={model}
                                  onChange={(e) => setModel(e.target.value)}
                                  disabled={loading}
                                  style={{ fontSize: '1rem' }}
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
                                  style={{ fontSize: '1rem' }}
                                />
                              )}
                              <Button
                                variant="outline-secondary"
                                onClick={handleLoadModels}
                                disabled={loading || !isConfigured}
                                title="Load available models"
                                style={{ fontSize: '1rem' }}
                              >
                                🔄
                              </Button>
                            </InputGroup>
                            <Form.Text className="text-muted" style={{ fontSize: '0.9rem' }}>
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
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                              OpenAI Dashboard
                            </a>
                          </Form.Text>
                        </Form.Group>
                      )}

                      {provider === 'anthropic' && (
                        <Form.Group className="mb-3">
                          <Form.Label>API Key</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="sk-ant-..."
                            value={apiKey}
                            onChange={(e) => {
                              setApiKey(e.target.value);
                              setConnectionStatus('unknown');
                            }}
                            disabled={loading}
                          />
                          <Form.Text className="text-muted">
                            Your Anthropic API key. Get it from{' '}
                            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
                              Anthropic Console
                            </a>
                          </Form.Text>
                        </Form.Group>
                      )}

                      {provider === 'google' && (
                        <Form.Group className="mb-3">
                          <Form.Label>API Key</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="AIza..."
                            value={apiKey}
                            onChange={(e) => {
                              setApiKey(e.target.value);
                              setConnectionStatus('unknown');
                            }}
                            disabled={loading}
                          />
                          <Form.Text className="text-muted">
                            Your Google API key. Get it from{' '}
                            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                              Google AI Studio
                            </a>
                          </Form.Text>
                        </Form.Group>
                      )}

                      {provider === 'azure-openai' && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>API Key</Form.Label>
                            <Form.Control
                              type="password"
                              placeholder="Your Azure OpenAI API key"
                              value={apiKey}
                              onChange={(e) => {
                                setApiKey(e.target.value);
                                setConnectionStatus('unknown');
                              }}
                              disabled={loading}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>Endpoint</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="https://your-resource.openai.azure.com"
                              value={endpoint}
                              onChange={(e) => {
                                setEndpoint(e.target.value);
                                setConnectionStatus('unknown');
                              }}
                              disabled={loading}
                            />
                            <Form.Text className="text-muted">
                              Your Azure OpenAI resource endpoint
                            </Form.Text>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label>API Version</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="2024-02-15-preview"
                              value={azureApiVersion}
                              onChange={(e) => setAzureApiVersion(e.target.value)}
                              disabled={loading}
                            />
                          </Form.Group>
                        </>
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
                                  <pre className="theme-code-block p-2 rounded mb-1">
                                    <code>export OLLAMA_ORIGINS="https://kobenguyent.github.io"</code>
                                  </pre>
                                  <pre className="theme-code-block p-2 rounded mb-1">
                                    <code>ollama serve</code>
                                  </pre>
                                </div>
                                <div className="mb-2">
                                  <strong>Windows (PowerShell):</strong>
                                  <pre className="theme-code-block p-2 rounded mb-1">
                                    <code>$env:OLLAMA_ORIGINS="https://kobenguyent.github.io"</code>
                                  </pre>
                                  <pre className="theme-code-block p-2 rounded mb-1">
                                    <code>ollama serve</code>
                                  </pre>
                                </div>
                                <div className="mb-2">
                                  <strong>Windows (Command Prompt):</strong>
                                  <pre className="theme-code-block p-2 rounded mb-1">
                                    <code>set OLLAMA_ORIGINS=https://kobenguyent.github.io</code>
                                  </pre>
                                  <pre className="theme-code-block p-2 rounded mb-1">
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
                              <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
                                ollama.ai
                              </a>
                            </Form.Text>
                          </Form.Group>
                        </>
                      )}

                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
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
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>System Prompt Type</Form.Label>
                            <Form.Select
                              value={systemPromptType}
                              onChange={(e) => setSystemPromptType(e.target.value as 'default' | 'technical' | 'creative')}
                              disabled={loading}
                            >
                              <option value="default">Default (Balanced)</option>
                              <option value="technical">Technical (Precise)</option>
                              <option value="creative">Creative (Innovative)</option>
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Choose the AI's response style and approach
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="kobean-optimize-tokens"
                          label="Enable token optimization (reduces API costs)"
                          checked={optimizeTokens}
                          onChange={(e) => setOptimizeTokens(e.target.checked)}
                          disabled={loading}
                        />
                        <Form.Text className="text-muted d-block">
                          Automatically removes redundant whitespace and compresses messages
                        </Form.Text>
                      </Form.Group>

                      <div className="d-flex gap-2 align-items-center">
                        <Button
                          variant="primary"
                          onClick={handleTestConnection}
                          disabled={loading || !isConfigured}
                        >
                          {loading ? <Spinner animation="border" size="sm" /> : '🔌 Test Connection'}
                        </Button>
                        {tokenCount.total > 0 && (
                          <Badge bg="info" className="ms-2">
                            📊 Tokens: {tokenCount.input} input / ~{tokenCount.total} total
                          </Badge>
                        )}
                      </div>
                    </Form>
                    </Card.Body>
                </Collapse>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Advanced Features - only shown when AI is configured */}
            {isConfigured && (
                <Card className="mb-3">
                    <Card.Body>
                        <Tabs defaultActiveKey="conversations" className="mb-3">
                            <Tab eventKey="conversations" title="💬 Conversations">
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0">Chat History</h6>
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={handleNewConversation}
                                            disabled={loading}
                                        >
                                            ➕ New Conversation
                                        </Button>
                                    </div>

                                    {conversations.length > 0 ? (
                                        <ListGroup>
                                            {conversations.map(conv => (
                                                <ListGroup.Item
                                                    key={conv.id}
                                                    active={conv.id === currentConversationId}
                                                    className="d-flex justify-content-between align-items-center"
                                                >
                                                    <div
                                                        style={{ cursor: 'pointer', flex: 1 }}
                                                        onClick={() => handleLoadConversation(conv.id)}
                                                    >
                                                        <strong style={{ color: conv.id === currentConversationId ? 'inherit' : 'var(--text)' }}>{conv.name}</strong>
                                                        <br />
                                                        <small style={{ color: conv.id === currentConversationId ? 'var(--text)' : 'var(--muted)', opacity: conv.id === currentConversationId ? 0.85 : 1 }}>
                                                            {conv.messageCount} messages • {new Date(conv.createdAt).toLocaleDateString()}
                                                            {conv.provider && ` • ${conv.provider}`}
                                                        </small>
                                                    </div>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleExportConversation(conv.id, 'json')}
                                                            title="Export as JSON"
                                                        >
                                                            📥 JSON
                                                        </Button>
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            onClick={() => handleExportConversation(conv.id, 'markdown')}
                                                            title="Export as Markdown"
                                                        >
                                                            📝 MD
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteConversation(conv.id)}
                                                            title="Delete conversation"
                                                        >
                                                            🗑️
                                                        </Button>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <Alert variant="info">
                                            No saved conversations yet. Start chatting and your conversations will be saved automatically.
                                        </Alert>
                                    )}
                                </div>
                            </Tab>

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
                                {/* Tool Statistics */}
                                <Alert variant="secondary" className="mb-3">
                                    <Row className="small">
                                        <Col xs={6} sm={3}>
                                            <strong>Total:</strong> {mcpToolStats.total}
                                        </Col>
                                        <Col xs={6} sm={3}>
                                            <strong>Enabled:</strong> {mcpToolStats.enabled}
                                        </Col>
                                        <Col xs={6} sm={3}>
                                            <strong>Default:</strong> {mcpToolStats.defaultTools}
                                        </Col>
                                        <Col xs={6} sm={3}>
                                            <strong>Custom:</strong> {mcpToolStats.customTools}
                                        </Col>
                                    </Row>
                                </Alert>

                                {/* Quick Actions */}
                                <div className="mb-3 d-flex flex-wrap gap-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={handleInitializeDefaultTools}
                                        disabled={loading}
                                    >
                                        📥 Load Default Tools
                                    </Button>
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={handleEnableAllDefaultTools}
                                        disabled={loading || mcpToolStats.defaultTools === 0}
                                    >
                                        ✅ Enable All Default
                                    </Button>
                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        onClick={handleDisableAllTools}
                                        disabled={loading || mcpToolStats.enabled === 0}
                                    >
                                        ❌ Disable All
                                    </Button>
                                    <Button
                                        variant="outline-info"
                                        size="sm"
                                        onClick={handleExportToolConfig}
                                        disabled={mcpToolStats.total === 0}
                                    >
                                        💾 Export Config
                                    </Button>
                                    <label className="btn btn-outline-info btn-sm">
                                        📁 Import Config
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImportToolConfig}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>

                                {/* MCP Server Connection */}
                                <Card className="mb-3">
                                    <Card.Header className="theme-card-header">
                                        <strong>Custom MCP Server</strong>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Label>Server URL</Form.Label>
                                        <InputGroup className="mb-2">
                                            <Form.Control
                                                type="text"
                                                placeholder="http://localhost:8080"
                                                value={mcpServerUrl}
                                                onChange={(e) => setMcpServerUrl(e.target.value)}
                                                disabled={loading || mcpConnected}
                                            />
                                            <Button
                                                variant={mcpConnected ? "success" : "primary"}
                                                onClick={mcpConnected ? handleDisconnectMCP : handleConnectMCP}
                                                disabled={loading || (!mcpConnected && !mcpServerUrl)}
                                            >
                                                {mcpConnected ? '🔌 Disconnect' : '🔌 Connect'}
                                            </Button>
                                        </InputGroup>
                                        <Form.Text className="text-muted">
                                            Connect to load custom tools from an MCP server
                                        </Form.Text>
                                    </Card.Body>
                                </Card>

                                {/* Tool List by Category */}
                                {mcpToolStats.total > 0 && (
                                    <div>
                                        <h6 className="mb-3">Tool Management</h6>
                                        {getToolCategories().map(category => {
                                            const categoryTools = mcpToolManager.getToolsByCategory(category);
                                            if (categoryTools.length === 0) return null;

                                            return (
                                                <Card key={category} className="mb-3">
                                                    <Card.Header className="theme-card-header">
                                                        <strong className="text-capitalize">
                                                            {category} Tools ({categoryTools.filter(t => t.enabled).length}/{categoryTools.length})
                                                        </strong>
                                                    </Card.Header>
                                                    <ListGroup variant="flush">
                                                        {categoryTools.map(tool => (
                                                            <ListGroup.Item key={tool.name}>
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div className="flex-grow-1">
                                                                        <Form.Check
                                                                            type="checkbox"
                                                                            id={`kobean-tool-${tool.name}`}
                                                                            label={
                                                                                <span>
                                                                                    <strong>🔧 {tool.name}</strong>
                                                                                    <Badge bg={tool.source === 'default' ? 'primary' : 'info'} className="ms-2 small">
                                                                                        {tool.source}
                                                                                    </Badge>
                                                                                </span>
                                                                            }
                                                                            checked={tool.enabled}
                                                                            onChange={() => handleToggleTool(tool.name)}
                                                                        />
                                                                        <small className="text-muted d-block ms-4">
                                                                            {tool.definition?.description || 'No description'}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Help & Documentation */}
                                <div className="mt-3">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => setShowMcpGuide(!showMcpGuide)}
                                    >
                                        {showMcpGuide ? '▼ Hide' : '📖 View'} Complete MCP Tools Guide
                                    </Button>

                                    {showMcpGuide && (
                                        <Alert variant="light" className="mt-3 small" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85em' }}>
                                                {getMCPToolGuide()}
                                            </pre>
                                        </Alert>
                                    )}
                                </div>

                                {mcpToolStats.total === 0 && (
                                    <Alert variant="info" className="mt-3">
                                        <Alert.Heading className="h6">Get Started with MCP Tools</Alert.Heading>
                                        <p className="mb-2 small">
                                            MCP (Model Context Protocol) tools extend AI capabilities. Here's how to start:
                                        </p>
                                        <ol className="mb-0 small">
                                            <li>Click "📥 Load Default Tools" to add {DEFAULT_MCP_TOOLS.length} pre-configured tools</li>
                                            <li>Enable the tools you need</li>
                                            <li>Optionally connect to a custom MCP server for additional tools</li>
                                            <li>Export your configuration to save your tool preferences</li>
                                        </ol>
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
            )}

            {/* Messages */}
            <div className="kobean-simple-messages mb-3">
                {messages.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <p>Type a command below</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`kobean-simple-msg ${msg.role}`}>
                            <div className="msg-content">
                                {msg.content}
                                {msg.toolResult?.copyable && (
                                    <CopyToClipboard
                                        text={msg.toolResult.copyable}
                                        onCopy={() => setCopied(msg.id)}
                                    >
                                        <Button variant="link" size="sm" className="copy-btn">
                                            {copied === msg.id ? '✓' : '📋'}
                                        </Button>
                                    </CopyToClipboard>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isProcessing && (
                    <div className="kobean-simple-msg assistant">
                        <Spinner animation="border" size="sm" />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <Form onSubmit={handleSubmit}>
                <InputGroup>
                    <Form.Control
                        ref={inputRef}
                        type="text"
                        placeholder="Ask Kobean..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isProcessing}
                        className="kobean-simple-input"
                    />
                    <Button type="submit" disabled={!input.trim() || isProcessing}>
                        {isProcessing ? <Spinner animation="border" size="sm" /> : '→'}
                    </Button>
                    {messages.length > 0 && (
                        <Button variant="outline-secondary" onClick={handleClear}>
                            ✕
                        </Button>
                    )}
                </InputGroup>
            </Form>
        </Container>
    );
}

export default KobeanAssistant;
