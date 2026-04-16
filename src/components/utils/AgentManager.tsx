import React, { useState, useCallback, useRef } from 'react';
import {
  Container,
  Card,
  Button,
  Badge,
  Alert,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Collapse,
} from 'react-bootstrap';
import { runAgent, AgentStep, AgentConfig } from '../../utils/agentExecutor';
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  createProfile,
  getRuns,
  createRun,
  AgentProfile,
  AgentRun,
  AIProvider,
} from '../../utils/agentStorage';

const PROVIDERS: AIProvider[] = ['ollama', 'openai', 'anthropic', 'google', 'azure-openai'];

const STEP_BADGES: Record<AgentStep['type'], { bg: string; label: string }> = {
  thinking:    { bg: 'secondary', label: '💭 Thinking' },
  tool_call:   { bg: 'primary',   label: '🔧 Tool Call' },
  tool_result: { bg: 'success',   label: '✅ Result' },
  answer:      { bg: 'info',      label: '💬 Answer' },
  error:       { bg: 'danger',    label: '❌ Error' },
};

const EMPTY_FORM: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  provider: 'ollama',
  endpoint: 'http://localhost:11434',
  apiKey: '',
  model: '',
  maxIterations: 10,
  temperature: 0.3,
  systemPromptOverride: '',
};

// ── Sub-component: inline runner ─────────────────────────────────────────────

interface RunnerProps {
  profile: AgentProfile;
  onRunSaved: () => void;
}

function ProfileRunner({ profile, onRunSaved }: RunnerProps) {
  const [task, setTask] = useState('');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  const handleRun = useCallback(async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setSteps([]);
    setFinalAnswer(null);
    setRunError(null);
    setShowSteps(true);

    const config: AgentConfig = {
      provider: profile.provider,
      endpoint: profile.endpoint,
      model: profile.model,
      apiKey: profile.apiKey,
      maxIterations: profile.maxIterations,
      temperature: profile.temperature,
    };

    try {
      const result = await runAgent(task, config, (step) => {
        setSteps(prev => [...prev, step]);
        setTimeout(() => stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });

      if (result.success) {
        setFinalAnswer(result.answer);
        createRun({ profileId: profile.id, task, result: 'success', answer: result.answer, iterationCount: result.iterationCount, timestamp: Date.now() });
      } else {
        setRunError(result.error ?? 'Agent did not complete the task.');
        createRun({ profileId: profile.id, task, result: 'error', answer: result.answer, iterationCount: result.iterationCount, timestamp: Date.now() });
      }
      onRunSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      setRunError(msg);
      createRun({ profileId: profile.id, task, result: 'error', answer: '', iterationCount: 0, timestamp: Date.now() });
      onRunSaved();
    } finally {
      setRunning(false);
    }
  }, [task, running, profile, onRunSaved]);

  return (
    <div className="mt-2">
      <Form.Group className="mb-2">
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="Describe a task for this agent…"
          value={task}
          onChange={e => setTask(e.target.value)}
          disabled={running}
        />
      </Form.Group>
      <Button
        size="sm"
        variant="primary"
        onClick={handleRun}
        disabled={!task.trim() || running}
      >
        {running ? <><Spinner size="sm" animation="border" className="me-1" />Running…</> : '▶ Run'}
      </Button>
      {steps.length > 0 && (
        <Button size="sm" variant="link" className="ms-2" onClick={() => setShowSteps(v => !v)}>
          {showSteps ? 'Hide steps' : `Show ${steps.length} steps`}
        </Button>
      )}
      <Collapse in={showSteps}>
        <div className="mt-2">
          {steps.map(step => {
            const badge = STEP_BADGES[step.type];
            return (
              <div key={step.id} className="mb-1 p-2 border rounded small">
                <Badge bg={badge.bg} className="me-1">{badge.label}</Badge>
                {step.toolName && <Badge bg="dark" className="me-1">{step.toolName}</Badge>}
                <span style={{ whiteSpace: 'pre-wrap' }}>{step.content}</span>
              </div>
            );
          })}
          <div ref={stepsEndRef} />
        </div>
      </Collapse>
      {finalAnswer && (
        <Alert variant="success" className="mt-2 small">
          <strong>✅ Done:</strong>{' '}
          <span style={{ whiteSpace: 'pre-wrap' }}>{finalAnswer}</span>
        </Alert>
      )}
      {runError && (
        <Alert variant="danger" className="mt-2 small">
          <strong>Error:</strong> {runError}
        </Alert>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AgentManager() {
  const [profiles, setProfiles] = useState<AgentProfile[]>(() => getProfiles());
  const [runHistory, setRunHistory] = useState<Record<string, AgentRun[]>>({});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AgentProfile | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Expanded runners
  const [expandedRunner, setExpandedRunner] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<AgentProfile | null>(null);

  const refreshProfiles = useCallback(() => {
    setProfiles(getProfiles());
  }, []);

  const refreshHistory = useCallback((profileId: string) => {
    setRunHistory(prev => ({ ...prev, [profileId]: getRuns(profileId) }));
  }, []);

  // ── Open create/edit modal ──
  const openCreate = () => {
    setEditingProfile(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (profile: AgentProfile) => {
    setEditingProfile(profile);
    setForm({
      name: profile.name,
      description: profile.description,
      provider: profile.provider,
      endpoint: profile.endpoint ?? '',
      apiKey: profile.apiKey ?? '',
      model: profile.model ?? '',
      maxIterations: profile.maxIterations,
      temperature: profile.temperature,
      systemPromptOverride: profile.systemPromptOverride ?? '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingProfile) {
      saveProfile({ ...editingProfile, ...form, updatedAt: Date.now() });
    } else {
      createProfile(form);
    }
    setShowModal(false);
    refreshProfiles();
  };

  const confirmDelete = (profile: AgentProfile) => setDeleteTarget(profile);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProfile(deleteTarget.id);
    setDeleteTarget(null);
    refreshProfiles();
  };

  const handleRunSaved = useCallback((profileId: string) => {
    refreshHistory(profileId);
    refreshProfiles();
  }, [refreshHistory, refreshProfiles]);

  const toggleRunner = (id: string) =>
    setExpandedRunner(prev => (prev === id ? null : id));

  const toggleHistory = (id: string) => {
    if (expandedHistory !== id) refreshHistory(id);
    setExpandedHistory(prev => (prev === id ? null : id));
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 className="mb-1">🤖 Agent Manager</h2>
          <p className="text-muted mb-0">
            Create and manage reusable AI agent profiles. Each profile stores an AI configuration
            that you can reuse across tasks.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ New Profile</Button>
      </div>

      {profiles.length === 0 && (
        <Alert variant="info">
          No agent profiles yet.{' '}
          <Alert.Link onClick={openCreate}>Create your first profile</Alert.Link> to get started.
        </Alert>
      )}

      {profiles.map(profile => (
        <Card key={profile.id} className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-semibold">{profile.name}</span>
              <Badge bg="secondary" className="ms-2">{profile.provider}</Badge>
              {profile.model && <Badge bg="dark" className="ms-1">{profile.model}</Badge>}
            </div>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={() => openEdit(profile)}>
                ✏️ Edit
              </Button>
              <Button size="sm" variant="outline-danger" onClick={() => confirmDelete(profile)}>
                🗑️ Delete
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {profile.description && (
              <p className="text-muted small mb-2">{profile.description}</p>
            )}
            <Row className="small text-muted mb-2">
              <Col xs="auto">Max iterations: <strong>{profile.maxIterations}</strong></Col>
              <Col xs="auto">Temperature: <strong>{profile.temperature}</strong></Col>
              {profile.endpoint && <Col xs="auto">Endpoint: <strong>{profile.endpoint}</strong></Col>}
            </Row>

            {/* Run section */}
            <Button
              size="sm"
              variant="success"
              onClick={() => toggleRunner(profile.id)}
              className="me-2"
            >
              {expandedRunner === profile.id ? '▾ Hide Runner' : '▶ Run Task'}
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => toggleHistory(profile.id)}
            >
              📋 History ({getRuns(profile.id).length})
            </Button>

            <Collapse in={expandedRunner === profile.id}>
              <div>
                <ProfileRunner
                  profile={profile}
                  onRunSaved={() => handleRunSaved(profile.id)}
                />
              </div>
            </Collapse>

            <Collapse in={expandedHistory === profile.id}>
              <div className="mt-2">
                {(runHistory[profile.id] ?? getRuns(profile.id)).length === 0 ? (
                  <p className="text-muted small">No runs yet.</p>
                ) : (
                  <div>
                    {(runHistory[profile.id] ?? getRuns(profile.id)).map(run => (
                      <div key={run.id} className="border rounded p-2 mb-1 small">
                        <div className="d-flex justify-content-between">
                          <span>
                            <Badge bg={run.result === 'success' ? 'success' : 'danger'} className="me-1">
                              {run.result === 'success' ? '✅' : '❌'}
                            </Badge>
                            {run.task}
                          </span>
                          <span className="text-muted">
                            {new Date(run.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {run.answer && (
                          <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                            {run.answer.slice(0, 200)}{run.answer.length > 200 ? '…' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Collapse>
          </Card.Body>
        </Card>
      ))}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingProfile ? 'Edit Profile' : 'New Agent Profile'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. GPT-4 QA Agent"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Provider</Form.Label>
                  <Form.Select
                    value={form.provider}
                    onChange={e => setForm(f => ({ ...f, provider: e.target.value as AIProvider }))}
                  >
                    {PROVIDERS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What does this agent do?"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model</Form.Label>
                  <Form.Control
                    value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    placeholder="e.g. gpt-4o-mini, llama2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Endpoint</Form.Label>
                  <Form.Control
                    value={form.endpoint}
                    onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))}
                    placeholder="http://localhost:11434"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>API Key</Form.Label>
              <Form.Control
                type="password"
                value={form.apiKey}
                onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder="Leave blank for Ollama"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Iterations</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={25}
                    value={form.maxIterations}
                    onChange={e => setForm(f => ({ ...f, maxIterations: Number(e.target.value) }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Temperature</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={form.temperature}
                    onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>System Prompt Override <span className="text-muted small">(optional)</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.systemPromptOverride}
                onChange={e => setForm(f => ({ ...f, systemPromptOverride: e.target.value }))}
                placeholder="Leave blank to use the default agent system prompt"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.name.trim()}>
            {editingProfile ? 'Save Changes' : 'Create Profile'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also
          remove all run history for this profile.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
