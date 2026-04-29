import React, { useState, useCallback, useMemo } from 'react';
import {
    Container, Form, Row, Col, Button, Card, Alert, Badge, InputGroup,
    ButtonGroup,
} from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
    buildJsonPrompt,
    extractTemplateVariables,
    parseJsonPrompt,
    validatePromptTemplate,
    type MessageRole,
    type PromptProviderFormat,
    type PromptMessage,
    type JsonPromptTemplate,
} from '../../utils/sharedTools';

// ── Types ────────────────────────────────────────────────────────────────────

interface MessageEntry extends PromptMessage {
    id: string;
}

interface State {
    messages: MessageEntry[];
    model: string;
    temperature: number;
    maxTokens: number;
    format: PromptProviderFormat;
    variables: Record<string, string>;
    importText: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
    return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_MODELS: Record<PromptProviderFormat, string> = {
    openai:    'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    gemini:    'gemini-1.5-flash',
    generic:   'my-model',
};

const FORMAT_LABELS: Record<PromptProviderFormat, string> = {
    openai:    '🟢 OpenAI',
    anthropic: '🟣 Anthropic',
    gemini:    '🔵 Gemini',
    generic:   '⚙️  Generic',
};

const ROLE_BADGES: Record<MessageRole, string> = {
    system:    'secondary',
    user:      'primary',
    assistant: 'success',
};

const defaultState: State = {
    messages: [
        { id: makeId(), role: 'system',    content: 'You are a helpful assistant.' },
        { id: makeId(), role: 'user',      content: '{{userMessage}}' },
    ],
    model:       'gpt-4o',
    temperature: 0.7,
    maxTokens:   1024,
    format:      'openai',
    variables:   { userMessage: '' },
    importText:  '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const JsonPromptBuilder: React.FC = () => {
    const [state, setState] = useState<State>(defaultState);
    const [copySuccess, setCopySuccess]       = useState(false);
    const [importError, setImportError]       = useState<string | null>(null);
    const [validationErrors, setValidErrors]  = useState<string[]>([]);
    const [activeTab, setActiveTab]           = useState<'builder' | 'import'>('builder');

    // ── Derived values ──────────────────────────────────────────────────────

    const allVariables = useMemo(() => {
        const names = new Set<string>();
        state.messages.forEach((m) =>
            extractTemplateVariables(m.content).forEach((v) => names.add(v)),
        );
        return Array.from(names);
    }, [state.messages]);

    // Keep variable map in sync: add new vars, preserve existing values
    const syncedVariables = useMemo(() => {
        const updated: Record<string, string> = {};
        allVariables.forEach((v) => {
            updated[v] = state.variables[v] ?? '';
        });
        return updated;
    }, [allVariables, state.variables]);

    const template = useMemo((): JsonPromptTemplate => ({
        model:       state.model,
        temperature: state.temperature,
        maxTokens:   state.maxTokens,
        messages:    state.messages.map(({ role, content }) => ({ role, content })),
    }), [state.messages, state.model, state.temperature, state.maxTokens]);

    const buildResult = useMemo(
        () => buildJsonPrompt(template, syncedVariables, state.format),
        [template, syncedVariables, state.format],
    );

    // ── Message handlers ────────────────────────────────────────────────────

    const addMessage = useCallback((role: MessageRole) => {
        setState((prev) => ({
            ...prev,
            messages: [...prev.messages, { id: makeId(), role, content: '' }],
        }));
    }, []);

    const removeMessage = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            messages: prev.messages.filter((m) => m.id !== id),
        }));
    }, []);

    const updateMessage = useCallback((id: string, field: 'role' | 'content', value: string) => {
        setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
                m.id === id ? { ...m, [field]: value } : m,
            ),
        }));
    }, []);

    const moveMessage = useCallback((id: string, direction: -1 | 1) => {
        setState((prev) => {
            const idx = prev.messages.findIndex((m) => m.id === id);
            if (idx < 0) return prev;
            const next = idx + direction;
            if (next < 0 || next >= prev.messages.length) return prev;
            const msgs = [...prev.messages];
            [msgs[idx], msgs[next]] = [msgs[next], msgs[idx]];
            return { ...prev, messages: msgs };
        });
    }, []);

    // ── Variable handlers ───────────────────────────────────────────────────

    const updateVariable = useCallback((name: string, value: string) => {
        setState((prev) => ({
            ...prev,
            variables: { ...prev.variables, [name]: value },
        }));
    }, []);

    // ── Format / model handlers ─────────────────────────────────────────────

    const handleFormatChange = useCallback((fmt: PromptProviderFormat) => {
        setState((prev) => ({
            ...prev,
            format: fmt,
            model:  DEFAULT_MODELS[fmt],
        }));
    }, []);

    // ── Validate ─────────────────────────────────────────────────────────────

    const handleValidate = useCallback(() => {
        const result = validatePromptTemplate(template);
        setValidErrors(result.errors);
    }, [template]);

    // ── Import ───────────────────────────────────────────────────────────────

    const handleImport = useCallback(() => {
        setImportError(null);
        const result = parseJsonPrompt(state.importText.trim());
        if (!result.template) {
            setImportError(result.error ?? 'Failed to parse prompt');
            return;
        }
        const t = result.template;
        setState((prev) => ({
            ...prev,
            messages:    t.messages.map((m) => ({ ...m, id: makeId() })),
            model:       t.model,
            temperature: t.temperature,
            maxTokens:   t.maxTokens,
            format:      'openai',
            importText:  '',
            variables:   {},
        }));
        setActiveTab('builder');
    }, [state.importText]);

    // ── Copy handler ─────────────────────────────────────────────────────────

    const handleCopy = useCallback(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }, []);

    // ── Reset ─────────────────────────────────────────────────────────────────

    const handleReset = useCallback(() => {
        setState(defaultState);
        setValidErrors([]);
        setImportError(null);
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Container fluid className="py-3">
            {/* Header */}
            <div className="tool-header mb-4">
                <span className="tool-header-icon">🧩</span>
                <div>
                    <h1 className="tool-header-title">JSON Prompt Builder</h1>
                    <p className="text-muted mb-0">
                        Build structured AI prompts with variables and export to OpenAI, Anthropic, Gemini, or generic JSON format.
                    </p>
                </div>
            </div>

            {/* Tab switcher */}
            <ButtonGroup className="mb-4" aria-label="Mode">
                <Button
                    variant={activeTab === 'builder' ? 'primary' : 'outline-primary'}
                    onClick={() => setActiveTab('builder')}
                >
                    ✏️ Builder
                </Button>
                <Button
                    variant={activeTab === 'import' ? 'primary' : 'outline-primary'}
                    onClick={() => setActiveTab('import')}
                >
                    📥 Import JSON
                </Button>
            </ButtonGroup>

            {/* ── Import tab ─────────────────────────────────────────────── */}
            {activeTab === 'import' && (
                <Card className="tool-card mb-4">
                    <Card.Header className="tool-card-header">
                        <strong>📥 Import Existing JSON Prompt</strong>
                    </Card.Header>
                    <Card.Body className="tool-card-body">
                        <Form.Group className="mb-3">
                            <Form.Label>Paste a JSON prompt (OpenAI, Anthropic, Gemini, or generic format)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={10}
                                placeholder={'{\n  "model": "gpt-4o",\n  "messages": [\n    {"role":"system","content":"You are helpful."},\n    {"role":"user","content":"{{question}}"}\n  ]\n}'}
                                value={state.importText}
                                onChange={(e) => setState((prev) => ({ ...prev, importText: e.target.value }))}
                                aria-label="JSON prompt to import"
                                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                            />
                        </Form.Group>
                        {importError && <Alert variant="danger">{importError}</Alert>}
                        <Button variant="primary" onClick={handleImport} disabled={!state.importText.trim()}>
                            Import &amp; Edit
                        </Button>
                    </Card.Body>
                </Card>
            )}

            {/* ── Builder tab ─────────────────────────────────────────────── */}
            {activeTab === 'builder' && (
                <Row>
                    {/* Left column — messages + settings */}
                    <Col lg={6} className="mb-4">
                        {/* Provider format */}
                        <Card className="tool-card mb-3">
                            <Card.Header className="tool-card-header">
                                <strong>⚙️ Provider &amp; Parameters</strong>
                            </Card.Header>
                            <Card.Body className="tool-card-body">
                                <Form.Group className="mb-3">
                                    <Form.Label>Provider format</Form.Label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {(Object.keys(FORMAT_LABELS) as PromptProviderFormat[]).map((fmt) => (
                                            <Button
                                                key={fmt}
                                                size="sm"
                                                variant={state.format === fmt ? 'primary' : 'outline-secondary'}
                                                onClick={() => handleFormatChange(fmt)}
                                                aria-pressed={state.format === fmt}
                                            >
                                                {FORMAT_LABELS[fmt]}
                                            </Button>
                                        ))}
                                    </div>
                                </Form.Group>

                                <Row>
                                    <Col sm={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Model</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={state.model}
                                                onChange={(e) => setState((prev) => ({ ...prev, model: e.target.value }))}
                                                aria-label="Model name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col sm={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Temperature</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={0}
                                                max={2}
                                                step={0.1}
                                                value={state.temperature}
                                                onChange={(e) => setState((prev) => ({ ...prev, temperature: parseFloat(e.target.value) || 0 }))}
                                                aria-label="Temperature"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col sm={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Max tokens</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={1}
                                                value={state.maxTokens}
                                                onChange={(e) => setState((prev) => ({ ...prev, maxTokens: parseInt(e.target.value, 10) || 1024 }))}
                                                aria-label="Max tokens"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Messages */}
                        <Card className="tool-card mb-3">
                            <Card.Header className="tool-card-header d-flex justify-content-between align-items-center">
                                <strong>💬 Messages</strong>
                                <Badge bg="secondary">{state.messages.length}</Badge>
                            </Card.Header>
                            <Card.Body className="tool-card-body">
                                {state.messages.length === 0 && (
                                    <p className="text-muted fst-italic">No messages yet. Add one below.</p>
                                )}

                                {state.messages.map((msg, idx) => (
                                    <Card key={msg.id} className="mb-3 border" style={{ borderRadius: '0.5rem' }}>
                                        <Card.Body className="py-2 px-3">
                                            <Row className="align-items-center mb-2">
                                                <Col>
                                                    <Form.Select
                                                        size="sm"
                                                        value={msg.role}
                                                        onChange={(e) => updateMessage(msg.id, 'role', e.target.value)}
                                                        aria-label={`Role of message ${idx + 1}`}
                                                        style={{ width: 'auto', display: 'inline-block' }}
                                                    >
                                                        <option value="system">system</option>
                                                        <option value="user">user</option>
                                                        <option value="assistant">assistant</option>
                                                    </Form.Select>
                                                    {' '}
                                                    <Badge bg={ROLE_BADGES[msg.role]}>{msg.role}</Badge>
                                                </Col>
                                                <Col xs="auto" className="d-flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-secondary"
                                                        onClick={() => moveMessage(msg.id, -1)}
                                                        disabled={idx === 0}
                                                        aria-label="Move message up"
                                                        title="Move up"
                                                    >▲</Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-secondary"
                                                        onClick={() => moveMessage(msg.id, 1)}
                                                        disabled={idx === state.messages.length - 1}
                                                        aria-label="Move message down"
                                                        title="Move down"
                                                    >▼</Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() => removeMessage(msg.id)}
                                                        aria-label="Remove message"
                                                        title="Remove"
                                                    >✕</Button>
                                                </Col>
                                            </Row>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                placeholder="Message content… use {{variableName}} for placeholders"
                                                value={msg.content}
                                                onChange={(e) => updateMessage(msg.id, 'content', e.target.value)}
                                                aria-label={`Content of message ${idx + 1}`}
                                                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                                            />
                                        </Card.Body>
                                    </Card>
                                ))}

                                <div className="d-flex gap-2 mt-2">
                                    <Button size="sm" variant="outline-secondary" onClick={() => addMessage('system')}
                                        aria-label="Add system message">
                                        + system
                                    </Button>
                                    <Button size="sm" variant="outline-primary" onClick={() => addMessage('user')}
                                        aria-label="Add user message">
                                        + user
                                    </Button>
                                    <Button size="sm" variant="outline-success" onClick={() => addMessage('assistant')}
                                        aria-label="Add assistant message">
                                        + assistant
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Variables */}
                        {allVariables.length > 0 && (
                            <Card className="tool-card mb-3">
                                <Card.Header className="tool-card-header">
                                    <strong>🔧 Template Variables</strong>
                                    <span className="text-muted ms-2 small">
                                        Fill in values to preview the rendered output
                                    </span>
                                </Card.Header>
                                <Card.Body className="tool-card-body">
                                    {allVariables.map((varName) => (
                                        <Form.Group key={varName} className="mb-2">
                                            <InputGroup>
                                                <InputGroup.Text style={{ fontFamily: 'monospace' }}>
                                                    {`{{${varName}}}`}
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    placeholder={`Value for ${varName}`}
                                                    value={syncedVariables[varName] ?? ''}
                                                    onChange={(e) => updateVariable(varName, e.target.value)}
                                                    aria-label={`Value for variable ${varName}`}
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                    ))}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Actions */}
                        <div className="d-flex gap-2 flex-wrap">
                            <Button variant="outline-info" onClick={handleValidate} aria-label="Validate prompt structure">
                                🔍 Validate
                            </Button>
                            <Button variant="outline-secondary" onClick={handleReset} aria-label="Reset to defaults">
                                🔄 Reset
                            </Button>
                        </div>

                        {validationErrors.length > 0 && (
                            <Alert variant="danger" className="mt-3">
                                <strong>Validation errors:</strong>
                                <ul className="mb-0 mt-1">
                                    {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </Alert>
                        )}
                        {validationErrors.length === 0 && buildResult.valid && (
                            <Alert variant="success" className="mt-3 py-2">
                                ✅ Prompt structure is valid
                            </Alert>
                        )}
                    </Col>

                    {/* Right column — JSON output */}
                    <Col lg={6} className="mb-4">
                        <Card className="tool-card h-100">
                            <Card.Header className="tool-card-header d-flex justify-content-between align-items-center">
                                <strong>📋 JSON Output</strong>
                                <div className="d-flex align-items-center gap-2">
                                    <Badge bg="light" text="dark" className="border">
                                        {FORMAT_LABELS[state.format]}
                                    </Badge>
                                    {buildResult.valid && (
                                        <CopyToClipboard text={buildResult.json} onCopy={handleCopy}>
                                            <Button
                                                size="sm"
                                                variant={copySuccess ? 'success' : 'outline-primary'}
                                                aria-label="Copy JSON to clipboard"
                                            >
                                                {copySuccess ? '✔ Copied!' : '📋 Copy'}
                                            </Button>
                                        </CopyToClipboard>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body className="tool-card-body p-0">
                                {!buildResult.valid ? (
                                    <Alert variant="danger" className="m-3">
                                        {buildResult.error}
                                    </Alert>
                                ) : (
                                    <pre
                                        style={{
                                            margin: 0,
                                            padding: '1rem',
                                            fontSize: '0.8rem',
                                            overflowX: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            minHeight: '200px',
                                            maxHeight: '600px',
                                            overflowY: 'auto',
                                        }}
                                        aria-label="Generated JSON prompt"
                                    >
                                        {buildResult.json}
                                    </pre>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Variables used info */}
                        {buildResult.variablesUsed.length > 0 && (
                            <Alert variant="info" className="mt-3 py-2">
                                <strong>Template variables detected:</strong>{' '}
                                {buildResult.variablesUsed.map((v) => (
                                    <Badge key={v} bg="light" text="dark" className="me-1 border" style={{ fontFamily: 'monospace' }}>
                                        {`{{${v}}}`}
                                    </Badge>
                                ))}
                                <div className="mt-1 small text-muted">
                                    Unfilled variables are preserved as-is in the output. Fill them in on the left.
                                </div>
                            </Alert>
                        )}
                    </Col>
                </Row>
            )}

            {/* Info card */}
            <Card className="tool-card mt-2">
                <Card.Header className="tool-card-header">
                    <strong>ℹ️ About JSON Prompt Builder</strong>
                </Card.Header>
                <Card.Body className="tool-card-body">
                    <Row>
                        <Col md={6}>
                            <h6>📖 What is a JSON Prompt?</h6>
                            <p className="small text-muted">
                                AI APIs (OpenAI, Anthropic, Gemini) accept structured JSON payloads with
                                a list of <em>messages</em>, each having a <code>role</code> (system, user, assistant)
                                and <code>content</code>. The JSON Prompt Builder lets you visually construct,
                                preview, and export these payloads.
                            </p>
                        </Col>
                        <Col md={6}>
                            <h6>🔧 Template Variables</h6>
                            <p className="small text-muted">
                                Use <code>{'{{variableName}}'}</code> placeholders in any message content.
                                The builder detects them automatically and lets you fill in values
                                before exporting — perfect for reusable prompt templates.
                            </p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};
