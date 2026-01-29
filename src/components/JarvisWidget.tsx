import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getJarvis, JarvisMessage } from '../utils/JarvisAgent';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './JarvisWidget.css';

export function JarvisWidget() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<JarvisMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const agentRef = useRef(getJarvis({
        aiProvider: 'ollama',
        aiEndpoint: 'http://localhost:11434',
        aiModel: 'mistral',
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

        const userMessage: JarvisMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await agentRef.current?.processMessage(message);
            if (response) {
                const assistantMessage: JarvisMessage = {
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
        <div className="jarvis-widget">
            {/* Floating Button */}
            <button
                className={`jarvis-fab ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Open Jarvis (AI Assistant)"
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="jarvis-window">
                    {/* Header */}
                    <div className="jarvis-header">
                        <span>🤖 Jarvis</span>
                        <button className="jarvis-clear" onClick={handleClear} title="Clear chat">
                            🗑️
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="jarvis-messages">
                        {messages.length === 0 ? (
                            <div className="jarvis-empty">
                                <p>Hi! I can help with:</p>
                                <ul>
                                    <li>Generate UUID, passwords</li>
                                    <li>Encode/decode Base64</li>
                                    <li>Navigate to any tool</li>
                                </ul>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`jarvis-msg ${msg.role}`}>
                                    {msg.content}
                                    {msg.toolResult?.copyable && (
                                        <CopyToClipboard
                                            text={msg.toolResult.copyable}
                                            onCopy={() => setCopied(msg.id)}
                                        >
                                            <button className="jarvis-copy">
                                                {copied === msg.id ? '✓' : '📋'}
                                            </button>
                                        </CopyToClipboard>
                                    )}
                                </div>
                            ))
                        )}
                        {isProcessing && (
                            <div className="jarvis-msg assistant">
                                <Spinner animation="border" size="sm" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <Form onSubmit={handleSubmit} className="jarvis-input-form">
                        <Form.Control
                            ref={inputRef}
                            type="text"
                            placeholder="Ask Jarvis..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isProcessing}
                            className="jarvis-input"
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isProcessing}
                            className="jarvis-send"
                        >
                            →
                        </Button>
                    </Form>
                </div>
            )}
        </div>
    );
}

export default JarvisWidget;
