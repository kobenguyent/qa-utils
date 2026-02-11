import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getKobean, getAiChatSessionConfig, KobeanMessage } from '../utils/KobeanAgent';
import { useSessionStorage } from '../utils/useSessionStorage';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './KobeanWidget.css';

export function KobeanWidget() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useSessionStorage<KobeanMessage[]>('kobean_messages', []);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const agentRef = useRef(getKobean({
        aiProvider: 'ollama',
        aiEndpoint: 'http://localhost:11434',
        aiModel: 'mistral',
        ...getAiChatSessionConfig(),
    }));

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

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
                    setTimeout(() => {
                        navigate(response.navigateTo!);
                        setIsOpen(false);
                    }, 1000);
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
        <div className="kobean-widget">
            {/* Floating Button */}
            <button
                className={`kobean-fab ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Open Kobean (AI Assistant)"
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="kobean-window">
                    {/* Header */}
                    <div className="kobean-header">
                        <span>🤖 Kobean</span>
                        <button className="kobean-clear" onClick={handleClear} title="Clear chat">
                            🗑️
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="kobean-messages">
                        {messages.length === 0 ? (
                            <div className="kobean-empty">
                                <p>Hi! I can help with:</p>
                                <ul>
                                    <li>Generate UUID, passwords</li>
                                    <li>Encode/decode Base64</li>
                                    <li>Navigate to any tool</li>
                                </ul>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`kobean-msg ${msg.role}`}>
                                    {msg.content}
                                    {msg.toolResult?.copyable && (
                                        <CopyToClipboard
                                            text={msg.toolResult.copyable}
                                            onCopy={() => setCopied(msg.id)}
                                        >
                                            <button className="kobean-copy">
                                                {copied === msg.id ? '✓' : '📋'}
                                            </button>
                                        </CopyToClipboard>
                                    )}
                                </div>
                            ))
                        )}
                        {isProcessing && (
                            <div className="kobean-msg assistant">
                                <Spinner animation="border" size="sm" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <Form onSubmit={handleSubmit} className="kobean-input-form">
                        <Form.Control
                            ref={inputRef}
                            type="text"
                            placeholder="Ask Kobean..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isProcessing}
                            className="kobean-input"
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isProcessing}
                            className="kobean-send"
                        >
                            →
                        </Button>
                    </Form>
                </div>
            )}
        </div>
    );
}

export default KobeanWidget;
