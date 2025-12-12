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
  Collapse,
} from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
  sendChatMessage,
  testConnection,
  ChatMessage,
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

interface ConversationMessage extends ChatMessage {
  id: string;
  timestamp: number;
}

// Constants
const DEFAULT_CONTEXT_LENGTH = 2000;

// Helper function to detect if user wants full content
const detectsFullContentRequest = (message: string): boolean => {
  return /\b(full|complete|entire|whole|all|untruncated|raw)\b.*\b(data|document|file|content|information)\b/i.test(message) ||
         /\b(show|display|read|access|see)\b.*\b(full|complete|entire|whole|all)\b/i.test(message);
};

export const AIChat: React.FC = () => {
  // Configuration state with session storage
  const [provider, setProvider] = useSessionStorage<AIProvider>('aiChat_provider', 'openai');
  const [apiKey, setApiKey] = useSessionStorage<string>('aiChat_apiKey', '');
  const [endpoint, setEndpoint] = useSessionStorage<string>('aiChat_endpoint', 'http://localhost:11434');
  const [azureApiVersion, setAzureApiVersion] = useSessionStorage<string>('aiChat_azureApiVersion', '2024-02-15-preview');
  const [model, setModel] = useSessionStorage<string>('aiChat_model', '');
  const [temperature, setTemperature] = useSessionStorage<number>('aiChat_temperature', 0.7);
  const [optimizeTokens, setOptimizeTokens] = useSessionStorage<boolean>('aiChat_optimizeTokens', true);
  const [systemPromptType, setSystemPromptType] = useSessionStorage<'default' | 'technical' | 'creative'>('aiChat_systemPromptType', 'default');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  
  // Conversation management
  const [conversationManager] = useState(() => new ConversationManager());
  const [currentConversationId, setCurrentConversationId] = useSessionStorage<string | null>('aiChat_currentConversationId', null);
  const [conversations, setConversations] = useState(conversationManager.getConversations());
  
  // Chat state with session storage
  const [messages, setMessages] = useSessionStorage<ConversationMessage[]>('aiChat_messages', []);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [tokenCount, setTokenCount] = useState({ input: 0, total: 0 });
  
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configExpanded, setConfigExpanded] = useSessionStorage<boolean>('aiChat_configExpanded', true);

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
  }, [provider, apiKey, endpoint, model]); // setModel is intentionally excluded as it's a setter

  // Update token count when input changes
  useEffect(() => {
    const inputTokens = estimateTokenCount(inputMessage);
    const conversationTokens = messages.reduce((sum, msg) => sum + estimateTokenCount(msg.content), 0);
    setTokenCount({ input: inputTokens, total: conversationTokens + inputTokens });
  }, [inputMessage, messages]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      // Update existing conversation with new messages
      conversationManager.updateConversation(currentConversationId, {
        messages: messages,
        provider: provider,
        model: model,
      });
      setConversations(conversationManager.getConversations());
    } else if (messages.length > 0 && !currentConversationId) {
      // Auto-create a conversation when user starts chatting without explicitly creating one
      const conversation = conversationManager.createConversation(
        `Chat ${new Date().toLocaleString()}`,
        provider,
        model
      );
      setCurrentConversationId(conversation.id);
      conversationManager.updateConversation(conversation.id, {
        messages: messages,
      });
      setConversations(conversationManager.getConversations());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]); // Only depend on messages to avoid infinite loops

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

  // Handle provider change - resets model to provider's default
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setConnectionStatus('unknown');
    setAvailableModels([]);
    // Reset model to the new provider's default
    const defaultModel = getDefaultModel(newProvider);
    setModel(defaultModel.id);
  };

  // Load available models when provider changes
  const handleLoadModels = async () => {
    setLoading(true);
    try {
      const models = await fetchModels(provider, { apiKey, endpoint });
      setAvailableModels(models);
      // Auto-select the first model from the fetched list
      if (models.length > 0) {
        setModel(models[0].id);
      }
    } catch (err) {
      setError(`Failed to load models: ${(err as Error).message}`);
      const defaultModel = getDefaultModel(provider);
      setAvailableModels([defaultModel]);
      // Auto-select the default model on error
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
      
      // Load tools via tool manager
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

  // Disconnect from MCP server
  const handleDisconnectMCP = () => {
    mcpToolManager.unloadServerTools();
    setMcpClient(null);
    setMcpConnected(false);
    setMcpToolStats(mcpToolManager.getStats());
  };

  // Initialize default tools
  const handleInitializeDefaultTools = () => {
    mcpToolManager.initializeDefaultTools();
    setMcpToolStats(mcpToolManager.getStats());
  };

  // Enable all default tools
  const handleEnableAllDefaultTools = () => {
    mcpToolManager.enableAllDefaultTools();
    setMcpToolStats(mcpToolManager.getStats());
  };

  // Disable all tools
  const handleDisableAllTools = () => {
    mcpToolManager.disableAllTools();
    setMcpToolStats(mcpToolManager.getStats());
  };

  // Toggle tool enabled state
  const handleToggleTool = (toolName: string) => {
    if (mcpToolManager.isToolEnabled(toolName)) {
      mcpToolManager.disableTool(toolName);
    } else {
      mcpToolManager.enableTool(toolName);
    }
    setMcpToolStats(mcpToolManager.getStats());
  };

  // Export tool configuration
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

  // Import tool configuration
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

  // Enhance message with knowledge base context
  const enhanceMessageWithContext = async (message: string): Promise<string> => {
    const relevantDocs = knowledgeBase.search(message, { method: 'keyword', limit: 3 });
    if (relevantDocs.length > 0) {
      // Check if user is asking for full/complete data
      const wantsFullData = detectsFullContentRequest(message);
      
      // If user wants full data or references specific document, load more content
      const maxLength = wantsFullData ? 0 : DEFAULT_CONTEXT_LENGTH; // 0 means unlimited
      const includeFullContent = wantsFullData;
      
      const context = knowledgeBase.buildContext(relevantDocs, maxLength, includeFullContent);
      
      // Add a note to help AI understand the context
      const contextNote = uploadedFiles.length > 0 
        ? `\n[Context: The following information is from uploaded knowledge base documents. Use this information to answer the user's question, but also apply your general knowledge when relevant.]\n\n`
        : '';
      
      return `${contextNote}${context}\n\nUser question: ${message}`;
    }
    return message;
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
      setMessages(conversation.messages as ConversationMessage[]);
      
      // Restore AI provider configuration from conversation
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

  return (
    <Container fluid>
      <Container className="py-4">
        <div className="text-center mb-4">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '600', color: '#212529' }}>🤖 AI Chat</h1>
          <p className="text-muted" style={{ fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' }}>
            Advanced AI chat with multi-provider support (OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI, Ollama),
            token optimization, conversation management, file uploads, MCP integration, and Cache-Augmented Generation (CAG)
          </p>
        </div>

        {/* Configuration Panel */}
        <Card className="mb-4" style={{ border: '1px solid #dee2e6' }}>
          <Card.Header 
            style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6', cursor: 'pointer' }}
            onClick={() => setConfigExpanded(!configExpanded)}
            role="button"
            aria-expanded={configExpanded}
            aria-controls="config-collapse"
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: '600', color: '#495057' }}>
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
            <Card.Body id="config-collapse">
            <Form>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500', fontSize: '1rem', color: '#495057' }}>Provider</Form.Label>
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
                    <Form.Label style={{ fontWeight: '500', fontSize: '1rem', color: '#495057' }}>Model</Form.Label>
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
                    <a 
                      href="https://console.anthropic.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
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
                    <a 
                      href="https://makersuite.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
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
                  id="optimize-tokens"
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
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Advanced Features */}
        <Card className="mb-4">
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
                            <strong style={{ color: conv.id === currentConversationId ? 'inherit' : '#212529' }}>{conv.name}</strong>
                            <br />
                            <small style={{ color: conv.id === currentConversationId ? 'rgba(255,255,255,0.8)' : '#6c757d' }}>
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
                  <Card.Header className="bg-light">
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
                          <Card.Header className="bg-light">
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
                                      id={`tool-${tool.name}`}
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
        <Card className="mb-3" style={{ height: '500px', display: 'flex', flexDirection: 'column', border: '1px solid #dee2e6' }}>
          <Card.Header style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: '600', color: '#495057' }}>💬 Chat</h5>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={handleClearChat}
                disabled={messages.length === 0 || loading}
                style={{ fontSize: '0.9rem' }}
              >
                Clear Chat
              </Button>
            </div>
          </Card.Header>
          <Card.Body style={{ overflowY: 'auto', flex: 1 }}>
            {messages.length === 0 ? (
              <div className="text-center text-muted mt-5">
                <p style={{ fontSize: '1.1rem' }}>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-3 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    {/* Increased from 70% to 75% for better readability on wider screens */}
                    <div style={{ maxWidth: '75%' }}>
                      <Badge 
                        bg={msg.role === 'user' ? 'primary' : 'secondary'}
                        className="mb-1"
                        style={{ fontSize: '0.85rem' }}
                      >
                        {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                        <span className="ms-2 small">{formatTimestamp(msg.timestamp)}</span>
                      </Badge>
                      <Card 
                        bg={msg.role === 'user' ? 'primary' : 'light'}
                        text={msg.role === 'user' ? 'white' : 'dark'}
                        style={{ 
                          border: msg.role === 'user' ? 'none' : '1px solid #dee2e6',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Card.Body className="py-2 px-3">
                          <div style={{ 
                            whiteSpace: 'pre-wrap', 
                            wordBreak: 'break-word',
                            fontSize: '1rem',
                            lineHeight: '1.6'
                          }}>
                            {msg.content}
                          </div>
                          <div className="mt-2">
                            <CopyWithToast text={msg.content} />
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="mb-3 d-flex justify-content-start" role="status" aria-live="polite" aria-label="AI is processing your message">
                    <div style={{ maxWidth: '75%' }}>
                      <Badge bg="secondary" className="mb-1" style={{ fontSize: '0.85rem' }}>
                        🤖 AI
                      </Badge>
                      <Card 
                        bg="light"
                        style={{ 
                          border: '1px solid #dee2e6',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Card.Body className="py-2 px-3">
                          <div className="d-flex align-items-center" style={{ fontSize: '1rem' }}>
                            <Spinner animation="grow" size="sm" variant="secondary" className="me-2" aria-hidden="true" />
                            <Spinner animation="grow" size="sm" variant="secondary" className="me-2" style={{ animationDelay: '0.2s' }} aria-hidden="true" />
                            <Spinner animation="grow" size="sm" variant="secondary" style={{ animationDelay: '0.4s' }} aria-hidden="true" />
                            <span className="ms-2 text-muted">AI is thinking...</span>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </Card.Body>
        </Card>

        {/* Message Input */}
        <Card>
          <Card.Body>
            <Form>
              <InputGroup>
                {/* Reduced from 3 to 2 rows for more compact UI, with vertical resize enabled for user control */}
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading || !isConfigured}
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    minHeight: '60px'
                  }}
                />
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim() || !isConfigured}
                  style={{ 
                    minWidth: '100px',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : '📤 Send'}
                </Button>
              </InputGroup>
              {!isConfigured && (
                <Form.Text className="text-warning" style={{ fontSize: '0.95rem' }}>
                  ⚠️ Please configure your {provider === 'openai' ? 'API key' : 'endpoint'} above to start chatting
                </Form.Text>
              )}
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </Container>
  );
};
