import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Container, Form, Button, InputGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { KobeanMessage, getKobean } from '../../utils/KobeanAgent';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import '../../styles/kobean.css';

export function KobeanAssistant() {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<KobeanMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const agentRef = useRef(getKobean({
        aiProvider: 'ollama',
        aiEndpoint: 'http://localhost:11434',
        aiModel: 'mistral',
    }));

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
