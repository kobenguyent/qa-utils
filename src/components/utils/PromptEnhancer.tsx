import React, { useState, useCallback, useMemo } from 'react';
import { Container, Form, Row, Col, Button, Card, Alert, Badge, InputGroup } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
    enhancePrompt,
    formatPrompt,
    getAvailableRoles,
    getAvailableTones,
    getEnhancementTechniques,
    type OutputFormat,
    type EnhancementTechnique,
    type EnhancementOptions,
    type EnhancedPrompt
} from '../../utils/promptEnhancer';
import { useSessionStorage } from '../../utils/useSessionStorage';

interface PromptState {
    originalPrompt: string;
    selectedTechniques: EnhancementTechnique[];
    role: string;
    context: string;
    outputDescription: string;
    constraints: string[];
    examples: string[];
    tone: string;
    outputFormat: OutputFormat;
}

const defaultState: PromptState = {
    originalPrompt: '',
    selectedTechniques: [],
    role: '',
    context: '',
    outputDescription: '',
    constraints: [],
    examples: [],
    tone: '',
    outputFormat: 'text',
};

export const PromptEnhancer: React.FC = () => {
    const [state, setState] = useSessionStorage<PromptState>('prompt-enhancer-state', defaultState);
    const [copySuccess, setCopySuccess] = useState(false);
    const [newConstraint, setNewConstraint] = useState('');
    const [newExample, setNewExample] = useState('');

    const roles = useMemo(() => getAvailableRoles(), []);
    const tones = useMemo(() => getAvailableTones(), []);
    const techniques = useMemo(() => getEnhancementTechniques(), []);

    // Generate enhanced prompt
    const enhancedPrompt: EnhancedPrompt | null = useMemo(() => {
        if (!state.originalPrompt.trim()) return null;

        const options: EnhancementOptions = {
            techniques: state.selectedTechniques,
            role: state.role,
            context: state.context,
            outputDescription: state.outputDescription,
            constraints: state.constraints,
            examples: state.examples,
            tone: state.tone,
        };

        return enhancePrompt(state.originalPrompt, options);
    }, [state]);

    // Format the enhanced prompt
    const formattedOutput = useMemo(() => {
        if (!enhancedPrompt) return '';
        return formatPrompt(enhancedPrompt, state.outputFormat);
    }, [enhancedPrompt, state.outputFormat]);

    const handleTechniqueToggle = useCallback((technique: EnhancementTechnique) => {
        setState(prev => {
            const techniques = prev.selectedTechniques.includes(technique)
                ? prev.selectedTechniques.filter(t => t !== technique)
                : [...prev.selectedTechniques, technique];
            return { ...prev, selectedTechniques: techniques };
        });
    }, [setState]);

    const handleAddConstraint = useCallback(() => {
        if (newConstraint.trim()) {
            setState(prev => ({
                ...prev,
                constraints: [...prev.constraints, newConstraint.trim()]
            }));
            setNewConstraint('');
        }
    }, [newConstraint, setState]);

    const handleRemoveConstraint = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            constraints: prev.constraints.filter((_, i) => i !== index)
        }));
    }, [setState]);

    const handleAddExample = useCallback(() => {
        if (newExample.trim()) {
            setState(prev => ({
                ...prev,
                examples: [...prev.examples, newExample.trim()]
            }));
            setNewExample('');
        }
    }, [newExample, setState]);

    const handleRemoveExample = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            examples: prev.examples.filter((_, i) => i !== index)
        }));
    }, [setState]);

    const handleCopy = useCallback(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }, []);

    const handleDownload = useCallback(() => {
        if (!formattedOutput) return;

        const extensions: Record<OutputFormat, string> = {
            text: 'txt',
            json: 'json',
            toon: 'xml',
            markdown: 'md',
            yaml: 'yaml',
        };

        const blob = new Blob([formattedOutput], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-prompt.${extensions[state.outputFormat]}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [formattedOutput, state.outputFormat]);

    const handleClear = useCallback(() => {
        setState(defaultState);
    }, [setState]);

    return (
        <Container className="py-4">
            <Row>
                <Col>
                    <h1 className="mb-3">✨ Prompt Enhancer</h1>
                    <p className="text-muted mb-4">
                        Transform your basic prompts into detailed, structured, and effective versions for ChatGPT, Claude, Gemini, and other AI models.
                    </p>
                </Col>
            </Row>

            <Row>
                {/* Input Section */}
                <Col lg={6}>
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">📝 Your Prompt</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Original Prompt</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={5}
                                    placeholder="Enter your basic prompt here... e.g., 'Write a blog post about machine learning'"
                                    value={state.originalPrompt}
                                    onChange={(e) => setState(prev => ({ ...prev, originalPrompt: e.target.value }))}
                                />
                                <Form.Text className="text-muted">
                                    {state.originalPrompt.length} characters
                                </Form.Text>
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    {/* Enhancement Techniques */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">🛠️ Enhancement Techniques</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                {techniques.map(technique => (
                                    <Col md={6} key={technique.id} className="mb-2">
                                        <Form.Check
                                            type="checkbox"
                                            id={`technique-${technique.id}`}
                                            label={
                                                <span>
                                                    <strong>{technique.label}</strong>
                                                    <br />
                                                    <small className="text-muted">{technique.description}</small>
                                                </span>
                                            }
                                            checked={state.selectedTechniques.includes(technique.id)}
                                            onChange={() => handleTechniqueToggle(technique.id)}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Technique Options */}
                    {state.selectedTechniques.length > 0 && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">⚙️ Enhancement Options</h5>
                            </Card.Header>
                            <Card.Body>
                                {/* Role Selection */}
                                {state.selectedTechniques.includes('specifyRole') && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>AI Role</Form.Label>
                                        <Form.Select
                                            value={state.role}
                                            onChange={(e) => setState(prev => ({ ...prev, role: e.target.value }))}
                                        >
                                            <option value="">Select a role...</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.label} - {role.description}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                )}

                                {/* Context Input */}
                                {state.selectedTechniques.includes('addContext') && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Context / Background</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Provide background information, e.g., 'I'm a beginner developer learning React...'"
                                            value={state.context}
                                            onChange={(e) => setState(prev => ({ ...prev, context: e.target.value }))}
                                        />
                                    </Form.Group>
                                )}

                                {/* Output Description */}
                                {state.selectedTechniques.includes('clarifyOutput') && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Expected Output</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="Describe the desired output format, e.g., 'A 500-word article with headers and bullet points'"
                                            value={state.outputDescription}
                                            onChange={(e) => setState(prev => ({ ...prev, outputDescription: e.target.value }))}
                                        />
                                    </Form.Group>
                                )}

                                {/* Constraints */}
                                {state.selectedTechniques.includes('addConstraints') && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Constraints</Form.Label>
                                        <InputGroup className="mb-2">
                                            <Form.Control
                                                placeholder="Add a constraint, e.g., 'Keep response under 200 words'"
                                                value={newConstraint}
                                                onChange={(e) => setNewConstraint(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddConstraint()}
                                            />
                                            <Button variant="outline-primary" onClick={handleAddConstraint}>
                                                Add
                                            </Button>
                                        </InputGroup>
                                        {state.constraints.map((constraint, index) => (
                                            <Badge
                                                key={index}
                                                bg="secondary"
                                                className="me-2 mb-2"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleRemoveConstraint(index)}
                                            >
                                                {constraint} ✕
                                            </Badge>
                                        ))}
                                    </Form.Group>
                                )}

                                {/* Examples */}
                                {state.selectedTechniques.includes('includeExamples') && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Examples (Few-shot)</Form.Label>
                                        <InputGroup className="mb-2">
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                placeholder="Add an example input/output..."
                                                value={newExample}
                                                onChange={(e) => setNewExample(e.target.value)}
                                            />
                                            <Button variant="outline-primary" onClick={handleAddExample}>
                                                Add
                                            </Button>
                                        </InputGroup>
                                        {state.examples.map((example, index) => (
                                            <Alert
                                                key={index}
                                                variant="info"
                                                dismissible
                                                onClose={() => handleRemoveExample(index)}
                                                className="mb-2"
                                            >
                                                <small><strong>Example {index + 1}:</strong> {example}</small>
                                            </Alert>
                                        ))}
                                    </Form.Group>
                                )}

                                {/* Tone Selection */}
                                {state.selectedTechniques.includes('specifyTone') && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tone</Form.Label>
                                        <Form.Select
                                            value={state.tone}
                                            onChange={(e) => setState(prev => ({ ...prev, tone: e.target.value }))}
                                        >
                                            <option value="">Select a tone...</option>
                                            {tones.map(tone => (
                                                <option key={tone.id} value={tone.id}>
                                                    {tone.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                )}
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* Output Section */}
                <Col lg={6}>
                    <Card className="mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">🎯 Enhanced Prompt</h5>
                            <div>
                                {formattedOutput && (
                                    <>
                                        <CopyToClipboard text={formattedOutput} onCopy={handleCopy}>
                                            <Button variant="outline-primary" size="sm" className="me-2">
                                                📋 {copySuccess ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </CopyToClipboard>
                                        <Button variant="primary" size="sm" className="me-2" onClick={handleDownload}>
                                            💾 Download
                                        </Button>
                                        <Button variant="outline-secondary" size="sm" onClick={handleClear}>
                                            🗑️ Clear
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {/* Output Format Selector */}
                            <Form.Group className="mb-3">
                                <Form.Label>Output Format</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    {(['text', 'json', 'toon', 'markdown', 'yaml'] as OutputFormat[]).map(format => (
                                        <Button
                                            key={format}
                                            variant={state.outputFormat === format ? 'primary' : 'outline-secondary'}
                                            size="sm"
                                            onClick={() => setState(prev => ({ ...prev, outputFormat: format }))}
                                        >
                                            {format.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            </Form.Group>

                            {/* Enhanced Prompt Preview */}
                            {formattedOutput ? (
                                <div>
                                    <div className="mb-2">
                                        <Badge bg="success" className="me-2">✓ Enhanced</Badge>
                                        {enhancedPrompt?.appliedTechniques.map(t => (
                                            <Badge key={t} bg="info" className="me-1">{t}</Badge>
                                        ))}
                                    </div>
                                    <pre
                                        className="theme-code-block p-3 rounded"
                                        style={{
                                            fontSize: '0.85rem',
                                            maxHeight: '500px',
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        <code>{formattedOutput}</code>
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <p>Enter a prompt and select enhancement techniques to see the enhanced version</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Tips Section */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">💡 Tips for Better Prompts</h5>
                        </Card.Header>
                        <Card.Body>
                            <ul className="mb-0">
                                <li><strong>Be specific:</strong> The more details you provide, the better the AI response</li>
                                <li><strong>Define the role:</strong> Tell the AI who it should be (expert, teacher, etc.)</li>
                                <li><strong>Set constraints:</strong> Limit response length, format, or style</li>
                                <li><strong>Use examples:</strong> Few-shot prompting significantly improves output quality</li>
                                <li><strong>Specify format:</strong> Use JSON/YAML formats for structured data extraction</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};
