import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modal, Form, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ToolRegistry, ToolDefinition } from '../utils/toolRegistry';
import { registerDefaultTools } from '../utils/defaultTools';
import './CommandPalette.css';


interface CommandPaletteProps {
    show: boolean;
    onHide: () => void;
}

export function CommandPalette({ show, onHide }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [result, setResult] = useState<string | null>(null);
    const [toolsReady, setToolsReady] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize tools immediately
    useEffect(() => {
        if (!ToolRegistry.isInitialized()) {
            registerDefaultTools();
        }
        setToolsReady(true);
    }, []);

    // Get filtered tools
    const tools = useMemo(() => {
        if (!toolsReady) return [];
        const allTools = ToolRegistry.getAll();
        if (!query.trim()) return allTools.slice(0, 10);

        const q = query.toLowerCase();
        return allTools
            .filter((tool: ToolDefinition) =>
                tool.name.toLowerCase().includes(q) ||
                tool.description.toLowerCase().includes(q) ||
                tool.keywords.some((k: string) => k.includes(q))
            )
            .slice(0, 10);
    }, [query, toolsReady]);


    // Reset on show
    useEffect(() => {
        if (show) {
            setQuery('');
            setSelectedIndex(0);
            setResult(null);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [show]);

    // Reset selected index when tools change
    useEffect(() => {
        setSelectedIndex(0);
    }, [tools]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, tools.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (tools[selectedIndex]) {
                    executeTool(tools[selectedIndex]);
                }
                break;
            case 'Escape':
                onHide();
                break;
        }
    }, [tools, selectedIndex, onHide]);

    // Execute tool
    const executeTool = async (tool: ToolDefinition) => {
        // If tool has a route, navigate to it
        if (tool.route) {
            onHide();
            navigate(tool.route);
            return;
        }

        // If tool has execute function, run it
        if (tool.execute) {
            try {
                const res = await ToolRegistry.execute(tool.id, {});
                if (res.success && res.copyable) {
                    await navigator.clipboard.writeText(res.copyable);
                    setResult(`✓ ${res.message || res.copyable} (copied!)`);
                    setTimeout(() => {
                        setResult(null);
                        onHide();
                    }, 1500);
                } else if (res.success) {
                    setResult(`✓ ${res.message}`);
                    setTimeout(() => {
                        setResult(null);
                        onHide();
                    }, 1500);
                } else {
                    setResult(`✗ ${res.error}`);
                }
            } catch (err) {
                setResult(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
    };

    const getIcon = (category: string) => {
        const icons: Record<string, string> = {
            'generator': '🎲',
            'encoding': '🔄',
            'converter': '⚡',
            'security': '🔐',
            'api-testing': '🌐',
            'ai': '🤖',
            'productivity': '📋',
            'development': '💻',
        };
        return icons[category] || '🔧';
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            className="command-palette-modal"
            size="lg"
        >
            <div className="command-palette">
                <Form.Control
                    ref={inputRef}
                    type="text"
                    placeholder="Search tools... (↑↓ to navigate, Enter to select)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="command-input"
                    autoFocus
                />

                {result ? (
                    <div className="command-result">
                        {result}
                    </div>
                ) : (
                    <ListGroup className="command-list">
                        {tools.map((tool, index) => (
                            <ListGroup.Item
                                key={tool.id}
                                action
                                active={index === selectedIndex}
                                onClick={() => executeTool(tool)}
                                className="command-item"
                            >
                                <span className="command-icon">{getIcon(tool.category)}</span>
                                <div className="command-info">
                                    <span className="command-name">{tool.name}</span>
                                    <span className="command-desc">{tool.description}</span>
                                </div>
                                {tool.execute && <Badge bg="success" className="command-badge">⚡</Badge>}
                            </ListGroup.Item>
                        ))}
                        {tools.length === 0 && (
                            <div className="command-empty">No tools found</div>
                        )}
                    </ListGroup>
                )}

                <div className="command-footer">
                    <span><kbd>↑↓</kbd> navigate</span>
                    <span><kbd>Enter</kbd> select</span>
                    <span><kbd>Esc</kbd> close</span>
                </div>
            </div>
        </Modal>
    );
}

export default CommandPalette;
