import React, { useState, useRef, useCallback } from 'react';
import {
  Container,
  Card,
  Form,
  Button,
  Spinner,
  Badge,
  Alert,
  Collapse,
  Row,
  Col,
} from 'react-bootstrap';
import { runAgent, AgentStep, AgentConfig } from '../../utils/agentExecutor';
import { AIProvider } from '../../utils/aiChatClient';
import { useSessionStorage } from '../../utils/useSessionStorage';
import './AgentMode.css';

/** Example tasks users can pick from */
const PRESET_TASKS = [
  'Generate a UUID and then base64 encode it',
  'Create a 24-char password with only letters and numbers',
  'Generate 3 UUIDs and count their total characters',
  'Give me the current unix timestamp and convert it to a readable date',
  'Generate lorem ipsum (2 paragraphs) then count the words',
];

// Step badge config
const STEP_BADGES: Record<AgentStep['type'], { bg: string; label: string }> = {
  thinking: { bg: 'secondary', label: '💭 Thinking' },
  tool_call: { bg: 'primary', label: '🔧 Tool Call' },
  tool_result: { bg: 'success', label: '✅ Result' },
  answer: { bg: 'info', label: '💬 Answer' },
  error: { bg: 'danger', label: '❌ Error' },
};

export function AgentMode() {
  // Task input
  const [task, setTask] = useState('');

  // Agent running state
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI config — reuses the same session storage keys as KobeanAssistant
  const [provider] = useSessionStorage<AIProvider>('aiChat_provider', 'ollama');
  const [apiKey] = useSessionStorage<string>('aiChat_apiKey', '');
  const [endpoint] = useSessionStorage<string>('aiChat_endpoint', 'http://localhost:11434');
  const [model] = useSessionStorage<string>('aiChat_model', '');

  // Advanced settings
  const [maxIterations, setMaxIterations] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const stepsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // -------------------------------------------------------------------------
  // Run the agent
  // -------------------------------------------------------------------------
  const handleRun = useCallback(async () => {
    if (!task.trim() || running) return;

    setRunning(true);
    setSteps([]);
    setFinalAnswer(null);
    setError(null);

    const config: AgentConfig = {
      provider,
      endpoint,
      model,
      apiKey,
      maxIterations,
      temperature: 0.3,
    };

    try {
      const result = await runAgent(task, config, (step) => {
        setSteps(prev => [...prev, step]);
        setTimeout(scrollToBottom, 50);
      });

      if (result.success) {
        setFinalAnswer(result.answer);
      } else {
        setError(result.error ?? 'Agent did not complete the task.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setRunning(false);
    }
  }, [task, running, provider, endpoint, model, apiKey, maxIterations, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun],
  );

  const isConfigured =
    (provider === 'ollama' && endpoint) ||
    (provider !== 'ollama' && apiKey);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Container className="py-4 agent-page">
      <h2 className="mb-1">🤖 Agent Mode</h2>
      <p className="text-muted mb-4">
        Describe a task and the agent will autonomously plan & execute tools to accomplish it.
      </p>

      {/* AI config warning */}
      {!isConfigured && (
        <Alert variant="warning" className="mb-3">
          ⚠️ No AI provider configured.{' '}
          <Alert.Link href="#/kobean">Configure in Kobean Assistant</Alert.Link>{' '}
          to enable the agent.
        </Alert>
      )}

      {/* Task input */}
      <Card className="mb-3">
        <Card.Body>
          <Form.Group className="mb-2">
            <Form.Label className="fw-semibold">Task description</Form.Label>
            <Form.Control
              as="textarea"
              className="agent-task-input"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Generate a UUID and encode it in base64"
              disabled={running}
            />
            <Form.Text className="text-muted">
              Press Ctrl+Enter to run
            </Form.Text>
          </Form.Group>

          {/* Preset chips */}
          <div className="preset-chips mb-3">
            {PRESET_TASKS.map((t, i) => (
              <Badge
                key={i}
                bg="light"
                text="dark"
                className="preset-chip border"
                onClick={() => !running && setTask(t)}
              >
                {t}
              </Badge>
            ))}
          </div>

          {/* Advanced settings */}
          <div className="mb-2">
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▾' : '▸'} Advanced settings
            </Button>
          </div>
          <Collapse in={showAdvanced}>
            <div>
              <Row className="mb-2">
                <Col xs={6} md={4}>
                  <Form.Group>
                    <Form.Label className="small">Max iterations</Form.Label>
                    <Form.Control
                      type="number"
                      size="sm"
                      min={1}
                      max={25}
                      value={maxIterations}
                      onChange={(e) => setMaxIterations(Number(e.target.value))}
                      disabled={running}
                    />
                  </Form.Group>
                </Col>
                <Col xs={6} md={4}>
                  <Form.Group>
                    <Form.Label className="small">Provider</Form.Label>
                    <Form.Control
                      size="sm"
                      value={provider}
                      disabled
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group>
                    <Form.Label className="small">Model</Form.Label>
                    <Form.Control
                      size="sm"
                      value={model || '(default)'}
                      disabled
                      readOnly
                    />
                  </Form.Group>
                </Col>
              </Row>
              <p className="text-muted small mb-0">
                AI provider settings are shared with Kobean Assistant.{' '}
                <a href="#/kobean">Change provider & model →</a>
              </p>
            </div>
          </Collapse>

          <div className="d-flex gap-2 mt-3">
            <Button
              variant="primary"
              onClick={handleRun}
              disabled={!task.trim() || running || !isConfigured}
            >
              {running ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Running…
                </>
              ) : (
                '▶ Run Agent'
              )}
            </Button>
            {steps.length > 0 && !running && (
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSteps([]);
                  setFinalAnswer(null);
                  setError(null);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Steps timeline */}
      {steps.length > 0 && (
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span className="fw-semibold">Agent Steps</span>
            <Badge bg="secondary">{steps.length}</Badge>
          </Card.Header>
          <Card.Body>
            <div className="agent-steps">
              {steps.map((step) => {
                const badge = STEP_BADGES[step.type];
                return (
                  <div key={step.id} className={`agent-step step-${step.type}`}>
                    <div className="step-label">
                      <Badge bg={badge.bg} className="me-1">
                        {badge.label}
                      </Badge>
                      {step.toolName && (
                        <Badge bg="dark" className="ms-1">
                          {step.toolName}
                        </Badge>
                      )}
                    </div>
                    <div className="step-content">
                      {step.type === 'tool_call' && step.toolParams ? (
                        <>
                          {step.content}
                          <pre>{JSON.stringify(step.toolParams, null, 2)}</pre>
                        </>
                      ) : step.type === 'tool_result' ? (
                        <pre>{step.content}</pre>
                      ) : (
                        <span style={{ whiteSpace: 'pre-wrap' }}>
                          {step.content}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={stepsEndRef} />
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Final answer */}
      {finalAnswer && (
        <Alert variant="success">
          <Alert.Heading>✅ Task Complete</Alert.Heading>
          <p style={{ whiteSpace: 'pre-wrap' }}>{finalAnswer}</p>
        </Alert>
      )}

      {/* Error */}
      {error && !running && (
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
    </Container>
  );
}
