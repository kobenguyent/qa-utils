import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Button, Modal, Form, Badge, Row, Col, ButtonGroup, Dropdown } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

// Types
interface KanbanCard {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    tags: string[];
    createdAt: string;
}

interface KanbanColumn {
    id: string;
    title: string;
    cards: KanbanCard[];
}

interface KanbanBoard {
    columns: KanbanColumn[];
    lastUpdated: string;
}

const STORAGE_KEY = 'qa-utils-kanban-board';

const defaultBoard: KanbanBoard = {
    columns: [
        { id: uuidv4(), title: '📋 Todo', cards: [] },
        { id: uuidv4(), title: '🔄 In Progress', cards: [] },
        { id: uuidv4(), title: '✅ Done', cards: [] },
    ],
    lastUpdated: new Date().toISOString(),
};

const priorityColors: Record<string, { bg: string; text: string }> = {
    low: { bg: '#10b981', text: 'white' },
    medium: { bg: '#f59e0b', text: 'white' },
    high: { bg: '#ef4444', text: 'white' },
};

const priorityLabels: Record<string, string> = {
    low: '🟢 Low',
    medium: '🟡 Medium',
    high: '🔴 High',
};

export const KanbanBoard: React.FC = () => {
    const [board, setBoard] = useState<KanbanBoard>(defaultBoard);
    const [showCardModal, setShowCardModal] = useState(false);
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [currentColumnId, setCurrentColumnId] = useState<string | null>(null);
    const [draggedCard, setDraggedCard] = useState<{ card: KanbanCard; sourceColumnId: string } | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Card form state
    const [cardTitle, setCardTitle] = useState('');
    const [cardDescription, setCardDescription] = useState('');
    const [cardPriority, setCardPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [cardDueDate, setCardDueDate] = useState('');
    const [cardTags, setCardTags] = useState('');

    // Column form state
    const [columnTitle, setColumnTitle] = useState('');

    // Load board from localStorage
    useEffect(() => {
        const savedBoard = localStorage.getItem(STORAGE_KEY);
        if (savedBoard) {
            try {
                const parsed = JSON.parse(savedBoard);
                setBoard(parsed);
            } catch (e) {
                console.error('Failed to parse saved board:', e);
            }
        }
    }, []);

    // Save board to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    }, [board]);

    const updateBoard = useCallback((updater: (prev: KanbanBoard) => KanbanBoard) => {
        setBoard(prev => ({
            ...updater(prev),
            lastUpdated: new Date().toISOString(),
        }));
    }, []);

    // Card operations
    const openAddCardModal = (columnId: string) => {
        setCurrentColumnId(columnId);
        setEditingCard(null);
        setCardTitle('');
        setCardDescription('');
        setCardPriority('medium');
        setCardDueDate('');
        setCardTags('');
        setShowCardModal(true);
    };

    const openEditCardModal = (card: KanbanCard, columnId: string) => {
        setCurrentColumnId(columnId);
        setEditingCard(card);
        setCardTitle(card.title);
        setCardDescription(card.description);
        setCardPriority(card.priority);
        setCardDueDate(card.dueDate);
        setCardTags(card.tags.join(', '));
        setShowCardModal(true);
    };

    const handleSaveCard = () => {
        if (!cardTitle.trim() || !currentColumnId) return;

        const card: KanbanCard = {
            id: editingCard?.id || uuidv4(),
            title: cardTitle.trim(),
            description: cardDescription.trim(),
            priority: cardPriority,
            dueDate: cardDueDate,
            tags: cardTags.split(',').map(t => t.trim()).filter(t => t),
            createdAt: editingCard?.createdAt || new Date().toISOString(),
        };

        updateBoard(prev => ({
            ...prev,
            columns: prev.columns.map(col => {
                if (col.id !== currentColumnId) return col;
                if (editingCard) {
                    return { ...col, cards: col.cards.map(c => c.id === card.id ? card : c) };
                }
                return { ...col, cards: [...col.cards, card] };
            }),
        }));

        setShowCardModal(false);
    };

    const handleDeleteCard = (cardId: string, columnId: string) => {
        updateBoard(prev => ({
            ...prev,
            columns: prev.columns.map(col => {
                if (col.id !== columnId) return col;
                return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
            }),
        }));
    };

    // Column operations
    const openAddColumnModal = () => {
        setEditingColumnId(null);
        setColumnTitle('');
        setShowColumnModal(true);
    };

    const openEditColumnModal = (column: KanbanColumn) => {
        setEditingColumnId(column.id);
        setColumnTitle(column.title);
        setShowColumnModal(true);
    };

    const handleSaveColumn = () => {
        if (!columnTitle.trim()) return;

        if (editingColumnId) {
            updateBoard(prev => ({
                ...prev,
                columns: prev.columns.map(col =>
                    col.id === editingColumnId ? { ...col, title: columnTitle.trim() } : col
                ),
            }));
        } else {
            const newColumn: KanbanColumn = {
                id: uuidv4(),
                title: columnTitle.trim(),
                cards: [],
            };
            updateBoard(prev => ({
                ...prev,
                columns: [...prev.columns, newColumn],
            }));
        }

        setShowColumnModal(false);
    };

    const handleDeleteColumn = (columnId: string) => {
        if (!confirm('Are you sure you want to delete this column and all its cards?')) return;
        updateBoard(prev => ({
            ...prev,
            columns: prev.columns.filter(col => col.id !== columnId),
        }));
    };

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, card: KanbanCard, sourceColumnId: string) => {
        setDraggedCard({ card, sourceColumnId });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
        // Add visual feedback
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => {
            target.style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggedCard(null);
        setDragOverColumnId(null);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumnId(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumnId(null);
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        setDragOverColumnId(null);

        if (!draggedCard || draggedCard.sourceColumnId === targetColumnId) {
            setDraggedCard(null);
            return;
        }

        updateBoard(prev => {
            const newColumns = prev.columns.map(col => {
                if (col.id === draggedCard.sourceColumnId) {
                    return { ...col, cards: col.cards.filter(c => c.id !== draggedCard.card.id) };
                }
                if (col.id === targetColumnId) {
                    return { ...col, cards: [...col.cards, draggedCard.card] };
                }
                return col;
            });
            return { ...prev, columns: newColumns };
        });

        setDraggedCard(null);
    };

    // Export/Import
    const handleExport = () => {
        const dataStr = JSON.stringify(board, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanban-board-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                if (imported.columns && Array.isArray(imported.columns)) {
                    setBoard(imported);
                } else {
                    alert('Invalid board format');
                }
            } catch (err) {
                alert('Failed to parse JSON file');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleClearAll = () => {
        if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return;
        setBoard(defaultBoard);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const today = new Date();
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `⚠️ Overdue`;
        if (diffDays === 0) return '📅 Today';
        if (diffDays === 1) return '📅 Tomorrow';
        return `📅 ${date.toLocaleDateString()}`;
    };

    return (
        <Container fluid className="py-4 px-4">
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="h3 mb-2">📋 Kanban Board</h1>
                    <p className="text-muted mb-0">Organize your tasks with drag-and-drop simplicity</p>
                </div>
                <ButtonGroup>
                    <Button variant="outline-primary" size="sm" onClick={openAddColumnModal}>
                        ➕ Add Column
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={handleExport}>
                        ⬇️ Export
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                        ⬆️ Import
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".json"
                        style={{ display: 'none' }}
                    />
                    <Dropdown as={ButtonGroup}>
                        <Dropdown.Toggle variant="outline-secondary" size="sm" id="more-options">
                            ⚙️
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={handleClearAll} className="text-danger">
                                🗑️ Clear All
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </ButtonGroup>
            </div>

            {/* Kanban Columns */}
            <div
                className="d-flex gap-3 pb-3"
                style={{
                    overflowX: 'auto',
                }}
            >
                {board.columns.map(column => (
                    <div
                        key={column.id}
                        className="kanban-column d-flex flex-column"
                        style={{
                            flex: '1 1 0',
                            minWidth: '280px',
                            maxWidth: '400px',
                            backgroundColor: dragOverColumnId === column.id ? 'var(--dropdown-hover)' : 'var(--card-bg)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            transition: 'background-color 0.2s ease',
                        }}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div
                            className="d-flex justify-content-between align-items-center p-3"
                            style={{ borderBottom: '1px solid var(--border-color)' }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="mb-0 fw-bold" style={{ fontSize: '1rem' }}>{column.title}</h5>
                                <Badge bg="secondary" pill>{column.cards.length}</Badge>
                            </div>
                            <ButtonGroup size="sm">
                                <Button variant="link" className="p-1" onClick={() => openEditColumnModal(column)} title="Edit column">
                                    ✏️
                                </Button>
                                <Button variant="link" className="p-1 text-danger" onClick={() => handleDeleteColumn(column.id)} title="Delete column">
                                    🗑️
                                </Button>
                            </ButtonGroup>
                        </div>

                        {/* Cards */}
                        <div className="p-2 flex-grow-1" style={{ minHeight: '200px', maxHeight: '500px', overflowY: 'auto' }}>
                            {column.cards.length === 0 ? (
                                <div
                                    className="text-muted text-center py-4"
                                    style={{
                                        border: '2px dashed var(--border-color)',
                                        borderRadius: '8px',
                                        margin: '8px 0'
                                    }}
                                >
                                    <small>Drop cards here or click Add Card</small>
                                </div>
                            ) : (
                                column.cards.map(card => (
                                    <Card
                                        key={card.id}
                                        className="mb-2 kanban-card"
                                        style={{
                                            cursor: 'grab',
                                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                            border: '1px solid var(--border-color)',
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, card, column.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => openEditCardModal(card, column.id)}
                                    >
                                        <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <Card.Title className="h6 mb-0" style={{ fontSize: '0.95rem' }}>
                                                    {card.title}
                                                </Card.Title>
                                                <Badge
                                                    style={{
                                                        backgroundColor: priorityColors[card.priority].bg,
                                                        color: priorityColors[card.priority].text,
                                                        fontSize: '0.7rem',
                                                    }}
                                                >
                                                    {card.priority.charAt(0).toUpperCase()}
                                                </Badge>
                                            </div>
                                            {card.description && (
                                                <Card.Text className="text-muted small mb-2" style={{ fontSize: '0.85rem' }}>
                                                    {card.description.length > 80
                                                        ? card.description.substring(0, 80) + '...'
                                                        : card.description}
                                                </Card.Text>
                                            )}
                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                {card.tags.slice(0, 3).map((tag, idx) => (
                                                    <Badge key={idx} bg="info" style={{ fontSize: '0.7rem' }}>
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {card.tags.length > 3 && (
                                                    <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
                                                        +{card.tags.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                            {card.dueDate && (
                                                <small className={`${new Date(card.dueDate) < new Date() ? 'text-danger' : 'text-muted'}`}>
                                                    {formatDate(card.dueDate)}
                                                </small>
                                            )}
                                        </Card.Body>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Add Card Button - Fixed at bottom */}
                        <div className="p-2 pt-0">
                            <Button
                                variant="outline-secondary"
                                className="w-100"
                                style={{ borderStyle: 'dashed' }}
                                onClick={() => openAddCardModal(column.id)}
                            >
                                ➕ Add Card
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Card Modal */}
            <Modal show={showCardModal} onHide={() => setShowCardModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingCard ? '✏️ Edit Card' : '➕ New Card'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Title *</Form.Label>
                            <Form.Control
                                type="text"
                                value={cardTitle}
                                onChange={(e) => setCardTitle(e.target.value)}
                                placeholder="Enter card title"
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={cardDescription}
                                onChange={(e) => setCardDescription(e.target.value)}
                                placeholder="Enter card description"
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Priority</Form.Label>
                                    <Form.Select
                                        value={cardPriority}
                                        onChange={(e) => setCardPriority(e.target.value as 'low' | 'medium' | 'high')}
                                    >
                                        <option value="low">{priorityLabels.low}</option>
                                        <option value="medium">{priorityLabels.medium}</option>
                                        <option value="high">{priorityLabels.high}</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Due Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={cardDueDate}
                                        onChange={(e) => setCardDueDate(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Tags</Form.Label>
                            <Form.Control
                                type="text"
                                value={cardTags}
                                onChange={(e) => setCardTags(e.target.value)}
                                placeholder="Enter tags separated by commas"
                            />
                            <Form.Text className="text-muted">
                                Example: bug, frontend, urgent
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    {editingCard && (
                        <Button
                            variant="outline-danger"
                            onClick={() => {
                                handleDeleteCard(editingCard.id, currentColumnId!);
                                setShowCardModal(false);
                            }}
                        >
                            🗑️ Delete
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setShowCardModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveCard} disabled={!cardTitle.trim()}>
                        {editingCard ? '💾 Save Changes' : '➕ Add Card'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Column Modal */}
            <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingColumnId ? '✏️ Edit Column' : '➕ New Column'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Column Title *</Form.Label>
                        <Form.Control
                            type="text"
                            value={columnTitle}
                            onChange={(e) => setColumnTitle(e.target.value)}
                            placeholder="e.g., 📋 Backlog or 🔍 Review"
                            autoFocus
                        />
                        <Form.Text className="text-muted">
                            Tip: Add an emoji at the start for visual distinction
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowColumnModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveColumn} disabled={!columnTitle.trim()}>
                        {editingColumnId ? '💾 Save Changes' : '➕ Add Column'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Info Card */}
            <Card className="mt-4">
                <Card.Body>
                    <h5>ℹ️ About Kanban Board</h5>
                    <p className="mb-2">
                        A visual project management tool to organize your tasks and workflow. Drag and drop cards between columns to track progress.
                    </p>
                    <p className="mb-0">
                        <strong>Features:</strong> Customizable columns, card priorities, due dates, tags, localStorage persistence, export/import as JSON.
                    </p>
                </Card.Body>
            </Card>

            {/* Inline styles for card hover effects */}
            <style>{`
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--shadow-color);
        }
        .kanban-card:active {
          cursor: grabbing;
        }
      `}</style>
        </Container>
    );
};

export default KanbanBoard;
