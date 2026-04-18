import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modal, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ToolRegistry, ToolDefinition } from '../utils/toolRegistry';
import { registerDefaultTools } from '../utils/defaultTools';
import './CommandPalette.css';


interface CommandPaletteProps {
    show: boolean;
    onHide: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  generator:    { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
  encoding:     { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  converter:    { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
  security:     { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  'api-testing':{ bg: 'rgba(232,121,249,0.15)', color: '#e879f9' },
  ai:           { bg: 'rgba(250,204,21,0.15)',  color: '#facc15' },
  productivity: { bg: 'rgba(244,114,182,0.15)', color: '#f472b6' },
  development:  { bg: 'rgba(56,189,248,0.15)',  color: '#38bdf8' },
};

const CATEGORY_ICONS: Record<string, string> = {
  generator: '🎲', encoding: '🔄', converter: '⚡', security: '🔐',
  'api-testing': '🌐', ai: '🤖', productivity: '📋', development: '💻',
};

export function CommandPalette({ show, onHide }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [result, setResult] = useState<string | null>(null);
    const [toolsReady, setToolsReady] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!ToolRegistry.isInitialized()) {
            registerDefaultTools();
        }
        setToolsReady(true);
    }, []);

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

    useEffect(() => {
        if (show) {
            setQuery('');
            setSelectedIndex(0);
            setResult(null);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [show]);

    useEffect(() => { setSelectedIndex(0); }, [tools]);

    const executeTool = useCallback(async (tool: ToolDefinition) => {
        if (tool.route) {
            onHide();
            navigate(tool.route);
            return;
        }
        if (tool.execute) {
            try {
                const res = await ToolRegistry.execute(tool.id, {});
                if (res.success && res.copyable) {
                    await navigator.clipboard.writeText(res.copyable);
                    setResult(`✓ ${res.message || res.copyable} (copied!)`);
                    setTimeout(() => { setResult(null); onHide(); }, 1500);
                } else if (res.success) {
                    setResult(`✓ ${res.message}`);
                    setTimeout(() => { setResult(null); onHide(); }, 1500);
                } else {
                    setResult(`✗ ${res.error}`);
                }
            } catch (err) {
                setResult(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
    }, [onHide, navigate]);

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
                if (tools[selectedIndex]) executeTool(tools[selectedIndex]);
                break;
            case 'Escape':
                onHide();
                break;
        }
    }, [tools, selectedIndex, onHide, executeTool]);

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            className="command-palette-modal"
            size="lg"
        >
            <div className="command-palette">
                {/* Search bar */}
                <div className="command-search-wrapper">
                    <span className="command-search-icon">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search tools… type anything"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="command-input"
                        autoFocus
                    />
                    {tools.length > 0 && (
                        <span className="command-result-count">{tools.length} result{tools.length !== 1 ? 's' : ''}</span>
                    )}
                </div>

                {result ? (
                    <div className="command-result">{result}</div>
                ) : (
                    <ListGroup className="command-list">
                        {tools.map((tool, index) => {
                            const cat = CATEGORY_COLORS[tool.category] ?? { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
                            const icon = CATEGORY_ICONS[tool.category] ?? '🔧';
                            return (
                                <ListGroup.Item
                                    key={tool.id}
                                    action
                                    active={index === selectedIndex}
                                    onClick={() => executeTool(tool)}
                                    className="command-item"
                                >
                                    <span className="command-icon-bubble" style={{ background: cat.bg, borderColor: `${cat.color}30` }}>
                                        {icon}
                                    </span>
                                    <div className="command-info">
                                        <span className="command-name">{tool.name}</span>
                                        <span className="command-desc">{tool.description}</span>
                                    </div>
                                    <span className="command-category" style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}>
                                        {tool.category.replace('-', ' ')}
                                    </span>
                                    {tool.execute && <Badge bg="success" className="command-badge">⚡</Badge>}
                                </ListGroup.Item>
                            );
                        })}
                        {tools.length === 0 && (
                            <div className="command-empty">
                                <span className="command-empty-icon">🔍</span>
                                No tools found for <strong>&ldquo;{query}&rdquo;</strong>
                            </div>
                        )}
                    </ListGroup>
                )}

                <div className="command-footer">
                    <span><kbd>↑↓</kbd> navigate</span>
                    <span><kbd>↵</kbd> select</span>
                    <span><kbd>Esc</kbd> close</span>
                </div>
            </div>
        </Modal>
    );
}

export default CommandPalette;
