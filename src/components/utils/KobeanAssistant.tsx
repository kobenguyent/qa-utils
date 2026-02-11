import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Container, Form, Button, InputGroup, Spinner, Card, Collapse, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { KobeanMessage, getKobean, resetKobean, getAiChatSessionConfig } from '../../utils/KobeanAgent';
import { AIProvider, getDefaultModel } from '../../utils/aiChatClient';
import { useSessionStorage } from '../../utils/useSessionStorage';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import '../../styles/kobean.css';

export function KobeanAssistant() {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<KobeanMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // AI Configuration state with session storage (shared with AIChat)
    const [provider, setProvider] = useSessionStorage<AIProvider>('aiChat_provider', 'ollama');
    const [apiKey, setApiKey] = useSessionStorage<string>('aiChat_apiKey', '');
    const [endpoint, setEndpoint] = useSessionStorage<string>('aiChat_endpoint', 'http://localhost:11434');
    const [model, setModel] = useSessionStorage<string>('aiChat_model', '');
    const [configExpanded, setConfigExpanded] = useSessionStorage<boolean>('kobean_configExpanded', false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const agentRef = useRef(getKobean({
        aiProvider: 'ollama',
        aiEndpoint: 'http://localhost:11434',
        aiModel: 'mistral',
        ...getAiChatSessionConfig(),
    }));

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

    const handleProviderChange = (newProvider: AIProvider) => {
        setProvider(newProvider);
        const defaultModel = getDefaultModel(newProvider);
        setModel(defaultModel.id);
        if (newProvider === 'ollama') {
            setEndpoint('http://localhost:11434');
        } else if (newProvider !== 'azure-openai') {
            setEndpoint('');
        }
    };

    const isConfigured = (() => {
        if (provider === 'openai' || provider === 'anthropic' || provider === 'google') {
            return !!apiKey;
        } else if (provider === 'azure-openai') {
            return !!apiKey && !!endpoint;
        } else if (provider === 'ollama') {
            return !!endpoint;
        }
        return false;
    })();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

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
        <Container className="kobean-simple py-4" style={{ maxWidth: '700px' }}>
            {/* Simple Header */}
            <div className="text-center mb-4">
                <h2 className="kobean-simple-title">🤖 Kobean</h2>
                <p className="text-muted small">Ask anything or try: "generate uuid", "password", "timestamp"</p>
            </div>

            {/* Configuration Panel */}
            <Card className="mb-3" style={{ border: '1px solid var(--border-color)' }}>
                <Card.Header
                    style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', padding: '0.5rem 1rem' }}
                    onClick={() => setConfigExpanded(!configExpanded)}
                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setConfigExpanded(!configExpanded); } }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={configExpanded}
                    aria-controls="kobean-config-collapse"
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <small style={{ fontWeight: '600', color: 'var(--text)' }}>
                            {configExpanded ? '▼' : '▶'} ⚙️ AI Configuration
                            {isConfigured && (
                                <Badge bg="success" className="ms-2" style={{ fontSize: '0.7rem' }}>Configured</Badge>
                            )}
                        </small>
                        <small className="text-muted">{provider}</small>
                    </div>
                </Card.Header>
                <Collapse in={configExpanded}>
                    <Card.Body id="kobean-config-collapse" style={{ padding: '1rem' }}>
                        <Form>
                            <Row className="mb-2">
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="small mb-1">Provider</Form.Label>
                                        <Form.Select
                                            size="sm"
                                            value={provider}
                                            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                                        >
                                            <option value="ollama">Ollama (Local)</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic Claude</option>
                                            <option value="google">Google Gemini</option>
                                            <option value="azure-openai">Azure OpenAI</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="small mb-1">Model</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="text"
                                            placeholder={getDefaultModel(provider).id}
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {(provider === 'openai' || provider === 'anthropic' || provider === 'google' || provider === 'azure-openai') && (
                                <Form.Group className="mb-2">
                                    <Form.Label className="small mb-1">API Key</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="password"
                                        placeholder={provider === 'openai' ? 'sk-...' : provider === 'anthropic' ? 'sk-ant-...' : provider === 'google' ? 'AIza...' : 'Your API key'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                </Form.Group>
                            )}

                            {(provider === 'ollama' || provider === 'azure-openai') && (
                                <Form.Group className="mb-2">
                                    <Form.Label className="small mb-1">Endpoint</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://your-resource.openai.azure.com'}
                                        value={endpoint}
                                        onChange={(e) => setEndpoint(e.target.value)}
                                    />
                                </Form.Group>
                            )}
                        </Form>
                    </Card.Body>
                </Collapse>
            </Card>

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
