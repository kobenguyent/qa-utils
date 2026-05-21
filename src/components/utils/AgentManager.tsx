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
  Nav,
  Tab,
  ListGroup,
  ProgressBar,
} from 'react-bootstrap';
import { runAgent, AgentStep, AgentConfig } from '../../utils/agentExecutor';
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  createProfile,
  getRuns,
  createRun,
  getPipelines,
  savePipeline,
  deletePipeline,
  createPipeline,
  getPipelineRuns,
  createPipelineRun,
  AgentProfile,
  AgentRun,
  AgentPipeline,
  PipelineAgentResult,
  PipelineRun,
  AIProvider,
  AgentRole,
  PipelineMode,
  AGENT_ROLE_LABELS,
} from '../../utils/agentStorage';
import {
  runSequentialPipeline,
  runOrchestratedPipeline,
  runAutoOrchestratedPipeline,
  OrchestratorEvent,
  AutoTeamMember,
  AutoOrchestrateEvent,
} from '../../utils/orchestrator';

const PROVIDERS: AIProvider[] = ['ollama', 'openai', 'anthropic', 'google', 'azure-openai', 'cloudflare-ai'];
const ROLES: AgentRole[] = ['orchestrator', 'planner', 'researcher', 'coder', 'reviewer', 'tester', 'synthesizer', 'custom'];
const PIPELINE_MODES: PipelineMode[] = ['sequential', 'orchestrated'];

const STEP_BADGES: Record<AgentStep['type'], { bg: string; label: string }> = {
  thinking:    { bg: 'secondary', label: '💭 Thinking' },
  tool_call:   { bg: 'primary',   label: '🔧 Tool Call' },
  tool_result: { bg: 'success',   label: '✅ Result' },
  answer:      { bg: 'info',      label: '💬 Answer' },
  error:       { bg: 'danger',    label: '❌ Error' },
};

const ROLE_BADGE_COLORS: Record<AgentRole, string> = {
  orchestrator: 'warning',
  planner:      'info',
  researcher:   'primary',
  coder:        'dark',
  reviewer:     'secondary',
  tester:       'success',
  synthesizer:  'danger',
  custom:       'light',
};

const EMPTY_PROFILE_FORM: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  role: 'custom',
  specialty: '',
  provider: 'ollama',
  endpoint: 'http://localhost:11434',
  apiKey: '',
  model: '',
  cloudflareAccountId: '',
  cloudflareGatewayId: '',
  maxIterations: 10,
  temperature: 0.3,
  systemPromptOverride: '',
};

// ── Single-agent runner ────────────────────────────────────────────────────────

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
      cloudflareAccountId: profile.cloudflareAccountId,
      cloudflareGatewayId: profile.cloudflareGatewayId,
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
        <Form.Control as="textarea" rows={2} placeholder="Describe a task for this agent…" value={task}
          onChange={e => setTask(e.target.value)} disabled={running} />
      </Form.Group>
      <Button size="sm" variant="primary" onClick={handleRun} disabled={!task.trim() || running}>
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
          <strong>✅ Done:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{finalAnswer}</span>
        </Alert>
      )}
      {runError && (
        <Alert variant="danger" className="mt-2 small"><strong>Error:</strong> {runError}</Alert>
      )}
    </div>
  );
}

// ── Pipeline event log ─────────────────────────────────────────────────────────

interface PipelineEventEntry {
  id: string;
  type: OrchestratorEvent['type'];
  agentName?: string;
  agentRole?: string;
  step?: AgentStep;
  result?: PipelineAgentResult;
  summary?: string;
}

// ── Pipeline runner ────────────────────────────────────────────────────────────

interface PipelineRunnerProps {
  pipeline: AgentPipeline;
  profiles: AgentProfile[];
  onRunSaved: () => void;
}

function PipelineRunner({ pipeline, profiles, onRunSaved }: PipelineRunnerProps) {
  const [task, setTask] = useState('');
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<PipelineEventEntry[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'idle' | 'running' | 'done' | 'error'>>({});
  const [showEvents, setShowEvents] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const evtId = useRef(0);

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  const addEvent = (evt: Omit<PipelineEventEntry, 'id'>) => {
    const entry: PipelineEventEntry = { ...evt, id: String(evtId.current++) };
    setEvents(prev => [...prev, entry]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleRun = useCallback(async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setEvents([]);
    setSummary(null);
    setRunError(null);
    setAgentStatuses({});
    setShowEvents(true);

    const onEvent = (evt: OrchestratorEvent) => {
      if (evt.type === 'agent_start') {
        setAgentStatuses(prev => ({ ...prev, [evt.agentName ?? '']: 'running' }));
      } else if (evt.type === 'agent_done') {
        setAgentStatuses(prev => ({ ...prev, [evt.agentName ?? '']: evt.result?.success ? 'done' : 'error' }));
        if (evt.result) addEvent({ type: 'agent_done', agentName: evt.agentName, agentRole: evt.agentRole, result: evt.result });
        return;
      } else if (evt.type === 'pipeline_done') {
        setSummary(evt.summary ?? '');
      }
      addEvent({ type: evt.type, agentName: evt.agentName, agentRole: evt.agentRole, step: evt.step, summary: evt.summary });
    };

    try {
      const runner = pipeline.mode === 'orchestrated'
        ? runOrchestratedPipeline
        : runSequentialPipeline;

      const result = await runner(task, pipeline, profiles, onEvent);

      createPipelineRun({
        pipelineId: pipeline.id,
        task,
        result: result.success ? 'success' : 'error',
        summary: result.summary,
        agentResults: result.agentResults,
        totalDuration: result.totalDuration,
        timestamp: Date.now(),
      });
      onRunSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      setRunError(msg);
    } finally {
      setRunning(false);
    }
  }, [task, running, pipeline, profiles, onRunSaved]);

  // Build the visual pipeline flow
  const orderedAgents = pipeline.mode === 'orchestrated'
    ? [
        pipeline.orchestratorId ? profileMap.get(pipeline.orchestratorId) : null,
        ...pipeline.agents.map(a => profileMap.get(a.profileId)),
      ].filter(Boolean)
    : [...pipeline.agents].sort((a, b) => a.order - b.order).map(a => profileMap.get(a.profileId)).filter(Boolean);

  return (
    <div className="mt-2">
      {/* Visual pipeline flow */}
      <div className="d-flex align-items-center flex-wrap gap-1 mb-3 p-2 bg-light rounded">
        {orderedAgents.map((p, i) => {
          if (!p) return null;
          const status = agentStatuses[p.name];
          const isOrchestrator = pipeline.mode === 'orchestrated' && p.id === pipeline.orchestratorId;
          return (
            <React.Fragment key={p.id}>
              <div className="text-center" style={{ minWidth: 80 }}>
                <div
                  className={`rounded p-1 small border ${
                    status === 'running' ? 'border-primary bg-primary text-white' :
                    status === 'done' ? 'border-success bg-success text-white' :
                    status === 'error' ? 'border-danger bg-danger text-white' :
                    'border-secondary bg-white'
                  }`}
                >
                  {status === 'running' && <Spinner size="sm" animation="border" className="me-1" />}
                  {status === 'done' && '✅ '}
                  {status === 'error' && '❌ '}
                  <strong>{isOrchestrator ? '🎯 ' : ''}{p.name}</strong>
                </div>
                <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                  {AGENT_ROLE_LABELS[p.role as AgentRole]}
                </div>
              </div>
              {i < orderedAgents.length - 1 && (
                <span className="text-muted fw-bold">{pipeline.mode === 'orchestrated' ? '⇄' : '→'}</span>
              )}
            </React.Fragment>
          );
        })}
        {orderedAgents.length === 0 && (
          <span className="text-muted small">No agents in this pipeline yet.</span>
        )}
      </div>

      <Form.Group className="mb-2">
        <Form.Control as="textarea" rows={2}
          placeholder="Describe the complex task for this pipeline…"
          value={task} onChange={e => setTask(e.target.value)} disabled={running} />
      </Form.Group>
      <Button size="sm" variant="success" onClick={handleRun} disabled={!task.trim() || running || orderedAgents.length === 0}>
        {running
          ? <><Spinner size="sm" animation="border" className="me-1" />Orchestrating…</>
          : `▶ Run ${pipeline.mode === 'orchestrated' ? 'Orchestrated' : 'Sequential'} Pipeline`}
      </Button>

      {running && (
        <ProgressBar animated now={100} className="mt-2" style={{ height: 4 }} />
      )}

      {events.length > 0 && (
        <Button size="sm" variant="link" className="ms-2" onClick={() => setShowEvents(v => !v)}>
          {showEvents ? 'Hide log' : `Show ${events.length} events`}
        </Button>
      )}

      <Collapse in={showEvents}>
        <div className="mt-2 small" style={{ maxHeight: 300, overflowY: 'auto' }}>
          {events.map(evt => {
            if (evt.type === 'agent_done' && evt.result) {
              return (
                <div key={evt.id} className={`mb-1 p-2 border rounded ${evt.result.success ? 'border-success' : 'border-danger'}`}>
                  <Badge bg={evt.result.success ? 'success' : 'danger'} className="me-1">
                    {evt.result.success ? '✅' : '❌'}
                  </Badge>
                  <strong>{evt.result.agentName}</strong>
                  <span className="text-muted ms-1">({AGENT_ROLE_LABELS[evt.result.role as AgentRole]})</span>
                  {evt.result.output && (
                    <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                      {evt.result.output.slice(0, 200)}{evt.result.output.length > 200 ? '…' : ''}
                    </div>
                  )}
                </div>
              );
            }
            if (evt.type === 'agent_start') {
              return (
                <div key={evt.id} className="mb-1 text-muted">
                  <Spinner size="sm" animation="border" className="me-1" />
                  <strong>{evt.agentName}</strong> is working…
                </div>
              );
            }
            if (evt.type === 'orchestrator_plan') {
              return (
                <div key={evt.id} className="mb-1 p-1 border border-warning rounded">
                  <Badge bg="warning" text="dark" className="me-1">📋 Plan</Badge>
                  Orchestrator created delegation plan
                </div>
              );
            }
            return null;
          })}
          <div ref={endRef} />
        </div>
      </Collapse>

      {summary && (
        <Alert variant="success" className="mt-2 small">
          <strong>✅ Pipeline complete:</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
        </Alert>
      )}
      {runError && (
        <Alert variant="danger" className="mt-2 small"><strong>Error:</strong> {runError}</Alert>
      )}
    </div>
  );
}

// ── Quick Orchestrate ─────────────────────────────────────────────────────────

const QUICK_PROVIDERS: AIProvider[] = ['ollama', 'openai', 'anthropic', 'google', 'azure-openai', 'cloudflare-ai'];

const PROVIDER_DEFAULTS: Record<AIProvider, { endpoint: string; modelPlaceholder: string }> = {
  ollama:       { endpoint: 'http://localhost:11434', modelPlaceholder: 'e.g. llama3' },
  openai:       { endpoint: '',                       modelPlaceholder: 'e.g. gpt-4o-mini' },
  anthropic:    { endpoint: '',                       modelPlaceholder: 'e.g. claude-3-haiku-20240307' },
  google:       { endpoint: '',                       modelPlaceholder: 'e.g. gemini-1.5-flash' },
  'azure-openai': { endpoint: '',                     modelPlaceholder: 'e.g. gpt-4o' },
  'cloudflare-ai': { endpoint: '',                    modelPlaceholder: 'e.g. @cf/meta/llama-3-8b-instruct' },
};

function QuickOrchestrate() {
  const [task, setTask] = useState('');
  const [provider, setProvider] = useState<AIProvider>('ollama');
  const [model, setModel] = useState('');
  const [endpoint, setEndpoint] = useState('http://localhost:11434');
  const [apiKey, setApiKey] = useState('');
  const [cloudflareAccountId, setCloudflareAccountId] = useState('');
  const [cloudflareGatewayId, setCloudflareGatewayId] = useState('');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'planning' | 'running' | 'done' | 'error'>('idle');
  const [autoTeam, setAutoTeam] = useState<AutoTeamMember[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'idle' | 'running' | 'done' | 'error'>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Keep endpoint in sync with provider default when user hasn't overridden it
  const handleProviderChange = (p: AIProvider) => {
    setProvider(p);
    setEndpoint(PROVIDER_DEFAULTS[p].endpoint);
  };

  const handleRun = useCallback(async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setPhase('planning');
    setAutoTeam([]);
    setAgentStatuses({});
    setSummary(null);
    setRunError(null);

    const config: AgentConfig = {
      provider,
      model: model.trim() || undefined,
      endpoint: endpoint.trim() || undefined,
      apiKey: apiKey.trim() || undefined,
      cloudflareAccountId: provider === 'cloudflare-ai' ? cloudflareAccountId.trim() || undefined : undefined,
      cloudflareGatewayId: provider === 'cloudflare-ai' && cloudflareGatewayId.trim() ? cloudflareGatewayId.trim() : undefined,
      maxIterations: 10,
      temperature: 0.3,
    };

    const onEvent = (evt: AutoOrchestrateEvent) => {
      // After meta-orchestrator reveals team
      if (evt.autoTeam && evt.autoTeam.length > 0) {
        setAutoTeam(evt.autoTeam);
        setPhase('running');
      }
      if (evt.type === 'agent_start') {
        setAgentStatuses(prev => ({ ...prev, [evt.agentName ?? '']: 'running' }));
      } else if (evt.type === 'agent_done') {
        setAgentStatuses(prev => ({
          ...prev,
          [evt.agentName ?? '']: evt.result?.success !== false ? 'done' : 'error',
        }));
      } else if (evt.type === 'pipeline_done') {
        setSummary(evt.summary ?? '');
      }
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    try {
      const result = await runAutoOrchestratedPipeline(task, config, onEvent);
      if (result.autoTeam.length > 0) setAutoTeam(result.autoTeam);
      setSummary(result.summary);
      setPhase(result.success ? 'done' : 'error');
      if (!result.success) setRunError(result.error ?? 'Pipeline did not complete.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      setRunError(msg);
      setPhase('error');
    } finally {
      setRunning(false);
    }
  }, [task, running, provider, model, endpoint, apiKey, cloudflareAccountId, cloudflareGatewayId]);

  const canRun = task.trim().length > 0 && !running;

  return (
    <div>
      {/* Hero prompt area */}
      <Card className="mb-4 border-primary">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold fs-6">
              ✨ What do you want to accomplish?
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder={
                'Describe your task in plain language.\n\nExamples:\n' +
                '• Write end-to-end tests for our login page\n' +
                '• Review this code for security vulnerabilities and suggest fixes\n' +
                '• Research best practices for React performance and write a summary'
              }
              value={task}
              onChange={e => setTask(e.target.value)}
              disabled={running}
              style={{ resize: 'vertical' }}
            />
          </Form.Group>

          {/* Minimal provider config */}
          <Row className="g-2 mb-3">
            <Col xs={12} sm={4} md={3}>
              <Form.Select
                size="sm"
                value={provider}
                onChange={e => handleProviderChange(e.target.value as AIProvider)}
                disabled={running}
              >
                {QUICK_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </Form.Select>
            </Col>
            <Col xs={12} sm={8} md={5}>
              <Form.Control
                size="sm"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder={PROVIDER_DEFAULTS[provider].modelPlaceholder}
                disabled={running}
              />
            </Col>
            <Col xs={12} md={4} className="d-flex align-items-center">
              <Button
                variant="link"
                size="sm"
                className="p-0 text-muted"
                onClick={() => setShowAdvancedConfig(v => !v)}
              >
                {showAdvancedConfig ? '▲ Hide advanced config' : '▼ API key / endpoint'}
              </Button>
            </Col>
          </Row>

          <Collapse in={showAdvancedConfig}>
            <div>
              <Row className="g-2 mb-3">
                <Col xs={12} md={6}>
                  <Form.Control
                    size="sm"
                    value={endpoint}
                    onChange={e => setEndpoint(e.target.value)}
                    placeholder="API endpoint (leave blank for cloud providers)"
                    disabled={running}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Form.Control
                    size="sm"
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={provider === 'cloudflare-ai' ? 'Cloudflare API token' : 'API key (leave blank for Ollama)'}
                    disabled={running}
                  />
                </Col>
                {provider === 'cloudflare-ai' && (
                  <Col xs={12}>
                    <Form.Control
                      size="sm"
                      value={cloudflareAccountId}
                      onChange={e => setCloudflareAccountId(e.target.value)}
                      placeholder="Cloudflare Account ID (required for Cloudflare Workers AI)"
                      disabled={running}
                    />
                  </Col>
                )}
                {provider === 'cloudflare-ai' && (
                  <Col xs={12}>
                    <Form.Control
                      size="sm"
                      value={cloudflareGatewayId}
                      onChange={e => setCloudflareGatewayId(e.target.value)}
                      placeholder="AI Gateway ID (optional, fixes CORS/405 errors in browsers)"
                      disabled={running}
                    />
                  </Col>
                )}
              </Row>
            </div>
          </Collapse>

          <Button
            variant="primary"
            onClick={handleRun}
            disabled={!canRun}
          >
            {running
              ? <><Spinner size="sm" animation="border" className="me-2" />
                  {phase === 'planning' ? 'Assembling team…' : 'Orchestrating…'}
                </>
              : '🚀 Auto-Orchestrate'}
          </Button>
        </Card.Body>
      </Card>

      {/* Team assembly visualisation */}
      {(running || autoTeam.length > 0) && (
        <Card className="mb-3">
          <Card.Header className="d-flex align-items-center gap-2">
            {phase === 'planning'
              ? <><Spinner size="sm" animation="border" className="me-1" /> Assembling specialist team…</>
              : <>🤝 Auto-assembled team</>
            }
          </Card.Header>
          <Card.Body>
            {phase === 'planning' && autoTeam.length === 0 && (
              <p className="text-muted small mb-0">
                Analysing your task and selecting the best specialist agents…
              </p>
            )}
            {autoTeam.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {autoTeam.map(member => {
                  const status = agentStatuses[member.name];
                  return (
                    <div
                      key={member.name}
                      className={`border rounded p-2 small flex-shrink-0 ${
                        status === 'running' ? 'border-primary bg-primary bg-opacity-10' :
                        status === 'done'    ? 'border-success bg-success bg-opacity-10' :
                        status === 'error'   ? 'border-danger bg-danger bg-opacity-10' :
                        'border-secondary'
                      }`}
                      style={{ minWidth: 140 }}
                    >
                      <div className="d-flex align-items-center gap-1 mb-1">
                        {status === 'running' && <Spinner size="sm" animation="border" />}
                        {status === 'done'    && <span>✅</span>}
                        {status === 'error'   && <span>❌</span>}
                        <strong>{member.name}</strong>
                      </div>
                      <Badge bg={ROLE_BADGE_COLORS[member.role] as string} className="mb-1">
                        {AGENT_ROLE_LABELS[member.role]}
                      </Badge>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{member.specialty}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Result */}
      {summary && phase === 'done' && (
        <Alert variant="success">
          <Alert.Heading>✅ Done</Alert.Heading>
          <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
        </Alert>
      )}
      {runError && (
        <Alert variant="danger">
          <strong>Error:</strong> {runError}
        </Alert>
      )}
      <div ref={endRef} />
    </div>
  );
}

// ── Agents Tab ────────────────────────────────────────────────────────────────

interface AgentsTabProps {
  profiles: AgentProfile[];
  onRefresh: () => void;
}

function AgentsTab({ profiles, onRefresh }: AgentsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AgentProfile | null>(null);
  const [form, setForm] = useState(EMPTY_PROFILE_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AgentProfile | null>(null);
  const [expandedRunner, setExpandedRunner] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<Record<string, AgentRun[]>>({});

  const refreshHistory = useCallback((profileId: string) => {
    setRunHistory(prev => ({ ...prev, [profileId]: getRuns(profileId) }));
  }, []);

  const openCreate = () => { setEditingProfile(null); setForm(EMPTY_PROFILE_FORM); setShowModal(true); };
  const openEdit = (p: AgentProfile) => {
    setEditingProfile(p);
    setForm({ name: p.name, description: p.description, role: p.role, specialty: p.specialty ?? '',
      provider: p.provider, endpoint: p.endpoint ?? '', apiKey: p.apiKey ?? '', model: p.model ?? '',
      cloudflareAccountId: p.cloudflareAccountId ?? '',
      maxIterations: p.maxIterations, temperature: p.temperature, systemPromptOverride: p.systemPromptOverride ?? '' });
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
    onRefresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProfile(deleteTarget.id);
    setDeleteTarget(null);
    onRefresh();
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="text-muted mb-0 small">
          Agents are individual AI models with a specific role. Use them standalone or assemble them into a Pipeline.
        </p>
        <Button variant="primary" size="sm" onClick={openCreate}>+ New Agent</Button>
      </div>

      {profiles.length === 0 && (
        <Alert variant="info">
          No agents yet.{' '}
          <Alert.Link onClick={openCreate}>Create your first agent</Alert.Link> to get started.
        </Alert>
      )}

      {profiles.map(profile => (
        <Card key={profile.id} className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-semibold">{profile.name}</span>
              <Badge bg={ROLE_BADGE_COLORS[profile.role] as string} className="ms-2">
                {AGENT_ROLE_LABELS[profile.role]}
              </Badge>
              <Badge bg="secondary" className="ms-1">{profile.provider}</Badge>
              {profile.model && <Badge bg="dark" className="ms-1">{profile.model}</Badge>}
            </div>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={() => openEdit(profile)}>✏️ Edit</Button>
              <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(profile)}>🗑️ Delete</Button>
            </div>
          </Card.Header>
          <Card.Body>
            {profile.specialty && <p className="text-muted small mb-2"><em>Specialty: {profile.specialty}</em></p>}
            {profile.description && !profile.specialty && <p className="text-muted small mb-2">{profile.description}</p>}
            <Row className="small text-muted mb-2">
              <Col xs="auto">Max iterations: <strong>{profile.maxIterations}</strong></Col>
              <Col xs="auto">Temperature: <strong>{profile.temperature}</strong></Col>
              {profile.endpoint && <Col xs="auto" className="text-truncate" style={{ maxWidth: 200 }}>Endpoint: <strong>{profile.endpoint}</strong></Col>}
            </Row>
            <Button size="sm" variant="success" onClick={() => setExpandedRunner(prev => prev === profile.id ? null : profile.id)} className="me-2">
              {expandedRunner === profile.id ? '▾ Hide' : '▶ Run Standalone'}
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => {
              if (expandedHistory !== profile.id) refreshHistory(profile.id);
              setExpandedHistory(prev => prev === profile.id ? null : profile.id);
            }}>
              📋 History ({getRuns(profile.id).length})
            </Button>
            <Collapse in={expandedRunner === profile.id}>
              <div>
                <ProfileRunner profile={profile} onRunSaved={() => { refreshHistory(profile.id); onRefresh(); }} />
              </div>
            </Collapse>
            <Collapse in={expandedHistory === profile.id}>
              <div className="mt-2">
                {(runHistory[profile.id] ?? getRuns(profile.id)).length === 0
                  ? <p className="text-muted small">No runs yet.</p>
                  : (runHistory[profile.id] ?? getRuns(profile.id)).map(run => (
                    <div key={run.id} className="border rounded p-2 mb-1 small">
                      <div className="d-flex justify-content-between">
                        <span>
                          <Badge bg={run.result === 'success' ? 'success' : 'danger'} className="me-1">
                            {run.result === 'success' ? '✅' : '❌'}
                          </Badge>
                          {run.task}
                        </span>
                        <span className="text-muted">{new Date(run.timestamp).toLocaleString()}</span>
                      </div>
                      {run.answer && (
                        <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                          {run.answer.slice(0, 200)}{run.answer.length > 200 ? '…' : ''}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Collapse>
          </Card.Body>
        </Card>
      ))}

      {/* Agent create/edit modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingProfile ? 'Edit Agent' : 'New Agent'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Code Reviewer" />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AgentRole }))}>
                    {ROLES.map(r => <option key={r} value={r}>{AGENT_ROLE_LABELS[r]}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Provider</Form.Label>
                  <Form.Select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value as AIProvider }))}>
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Specialty <span className="text-muted small">(shown to orchestrator when delegating)</span></Form.Label>
              <Form.Control value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                placeholder="e.g. Analyses TypeScript code for bugs and performance issues" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What does this agent do?" />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model</Form.Label>
                  <Form.Control value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    placeholder="e.g. gpt-4o-mini, llama2" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Endpoint</Form.Label>
                  <Form.Control value={form.endpoint} onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))}
                    placeholder="http://localhost:11434" />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>API Key</Form.Label>
              <Form.Control type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder="Leave blank for Ollama" />
            </Form.Group>
            {form.provider === 'cloudflare-ai' && (
              <Form.Group className="mb-3">
                <Form.Label>Cloudflare Account ID</Form.Label>
                <Form.Control value={form.cloudflareAccountId ?? ''} onChange={e => setForm(f => ({ ...f, cloudflareAccountId: e.target.value }))}
                  placeholder="Your Cloudflare Account ID (from dash.cloudflare.com)" />
              </Form.Group>
            )}
            {form.provider === 'cloudflare-ai' && (
              <Form.Group className="mb-3">
                <Form.Label>AI Gateway ID <span className="text-muted fw-normal small">(optional, recommended for browser use)</span></Form.Label>
                <Form.Control value={form.cloudflareGatewayId ?? ''} onChange={e => setForm(f => ({ ...f, cloudflareGatewayId: e.target.value }))}
                  placeholder="e.g. my-gateway" />
                <Form.Text className="text-muted">
                  Required to avoid CORS errors (405 on OPTIONS) when calling Cloudflare AI from a browser.
                  Create an AI Gateway at dash.cloudflare.com → AI → AI Gateway.
                </Form.Text>
              </Form.Group>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Iterations</Form.Label>
                  <Form.Control type="number" min={1} max={25} value={form.maxIterations}
                    onChange={e => setForm(f => ({ ...f, maxIterations: Number(e.target.value) }))} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Temperature</Form.Label>
                  <Form.Control type="number" min={0} max={1} step={0.1} value={form.temperature}
                    onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>System Prompt Override <span className="text-muted small">(optional)</span></Form.Label>
              <Form.Control as="textarea" rows={3} value={form.systemPromptOverride}
                onChange={e => setForm(f => ({ ...f, systemPromptOverride: e.target.value }))}
                placeholder="Leave blank to use the default agent system prompt" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.name.trim()}>
            {editingProfile ? 'Save Changes' : 'Create Agent'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)}>
        <Modal.Header closeButton><Modal.Title>Delete Agent</Modal.Title></Modal.Header>
        <Modal.Body>Delete <strong>{deleteTarget?.name}</strong>? This removes all run history too.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

// ── Pipelines Tab ─────────────────────────────────────────────────────────────

interface PipelinesTabProps {
  pipelines: AgentPipeline[];
  profiles: AgentProfile[];
  onRefresh: () => void;
}

const EMPTY_PIPELINE_FORM: Omit<AgentPipeline, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  mode: 'sequential',
  orchestratorId: '',
  agents: [],
};

function PipelinesTab({ pipelines, profiles, onRefresh }: PipelinesTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<AgentPipeline | null>(null);
  const [form, setForm] = useState(EMPTY_PIPELINE_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AgentPipeline | null>(null);
  const [expandedRunner, setExpandedRunner] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [pipelineHistory, setPipelineHistory] = useState<Record<string, PipelineRun[]>>({});

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  const openCreate = () => {
    setEditingPipeline(null);
    setForm(EMPTY_PIPELINE_FORM);
    setShowModal(true);
  };

  const openEdit = (p: AgentPipeline) => {
    setEditingPipeline(p);
    setForm({ name: p.name, description: p.description, mode: p.mode, orchestratorId: p.orchestratorId ?? '', agents: p.agents });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const pipeline = { ...form, orchestratorId: form.orchestratorId || undefined };
    if (editingPipeline) {
      savePipeline({ ...editingPipeline, ...pipeline, updatedAt: Date.now() });
    } else {
      createPipeline(pipeline);
    }
    setShowModal(false);
    onRefresh();
  };

  const toggleAgent = (profileId: string) => {
    setForm(f => {
      const exists = f.agents.some(a => a.profileId === profileId);
      if (exists) {
        const filtered = f.agents.filter(a => a.profileId !== profileId)
          .map((a, i) => ({ ...a, order: i }));
        return { ...f, agents: filtered };
      } else {
        return { ...f, agents: [...f.agents, { profileId, order: f.agents.length }] };
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePipeline(deleteTarget.id);
    setDeleteTarget(null);
    onRefresh();
  };

  const refreshHistory = (id: string) => {
    setPipelineHistory(prev => ({ ...prev, [id]: getPipelineRuns(id) }));
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="text-muted mb-0 small">
          Pipelines coordinate multiple agents on complex tasks. Choose <strong>Sequential</strong> (chain) or
          <strong> Orchestrated</strong> (orchestrator delegates to specialists).
        </p>
        <Button variant="primary" size="sm" onClick={openCreate} disabled={profiles.length === 0}>
          + New Pipeline
        </Button>
      </div>

      {profiles.length === 0 && (
        <Alert variant="warning">
          Create at least one agent in the <strong>Agents</strong> tab before building a pipeline.
        </Alert>
      )}

      {profiles.length > 0 && pipelines.length === 0 && (
        <Alert variant="info">
          No pipelines yet.{' '}
          <Alert.Link onClick={openCreate}>Create your first pipeline</Alert.Link> to start orchestrating agents.
        </Alert>
      )}

      {pipelines.map(pipeline => {
        const workerProfiles = pipeline.agents.map(a => profileMap.get(a.profileId)).filter(Boolean);
        const orchestratorProfile = pipeline.orchestratorId ? profileMap.get(pipeline.orchestratorId) : null;

        return (
          <Card key={pipeline.id} className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-semibold">{pipeline.name}</span>
                <Badge bg={pipeline.mode === 'orchestrated' ? 'warning' : 'info'} text="dark" className="ms-2">
                  {pipeline.mode === 'orchestrated' ? '🎯 Orchestrated' : '🔗 Sequential'}
                </Badge>
                <Badge bg="secondary" className="ms-1">{pipeline.agents.length} agent{pipeline.agents.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" variant="outline-secondary" onClick={() => openEdit(pipeline)}>✏️ Edit</Button>
                <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(pipeline)}>🗑️ Delete</Button>
              </div>
            </Card.Header>
            <Card.Body>
              {pipeline.description && <p className="text-muted small mb-2">{pipeline.description}</p>}

              {/* Pipeline flow diagram */}
              <div className="d-flex align-items-center flex-wrap gap-1 mb-3 p-2 bg-light rounded small">
                {pipeline.mode === 'orchestrated' && orchestratorProfile && (
                  <>
                    <div className="text-center">
                      <Badge bg="warning" text="dark">🎯 {orchestratorProfile.name}</Badge>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>orchestrator</div>
                    </div>
                    {workerProfiles.length > 0 && <span className="text-muted">⇄</span>}
                  </>
                )}
                {pipeline.mode === 'sequential' && workerProfiles.map((p, i) => p && (
                  <React.Fragment key={p.id}>
                    <div className="text-center">
                      <Badge bg={ROLE_BADGE_COLORS[p.role as AgentRole] as string}>{p.name}</Badge>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>{AGENT_ROLE_LABELS[p.role as AgentRole]}</div>
                    </div>
                    {i < workerProfiles.length - 1 && <span className="text-muted fw-bold">→</span>}
                  </React.Fragment>
                ))}
                {pipeline.mode === 'orchestrated' && (
                  <div className="d-flex flex-wrap gap-1">
                    {workerProfiles.map(p => p && (
                      <div key={p.id} className="text-center">
                        <Badge bg={ROLE_BADGE_COLORS[p.role as AgentRole] as string}>{p.name}</Badge>
                        <div className="text-muted" style={{ fontSize: '0.6rem' }}>{AGENT_ROLE_LABELS[p.role as AgentRole]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button size="sm" variant="success" className="me-2"
                onClick={() => setExpandedRunner(prev => prev === pipeline.id ? null : pipeline.id)}>
                {expandedRunner === pipeline.id ? '▾ Hide Runner' : '▶ Run Pipeline'}
              </Button>
              <Button size="sm" variant="outline-secondary"
                onClick={() => { if (expandedHistory !== pipeline.id) refreshHistory(pipeline.id); setExpandedHistory(prev => prev === pipeline.id ? null : pipeline.id); }}>
                📋 History ({getPipelineRuns(pipeline.id).length})
              </Button>

              <Collapse in={expandedRunner === pipeline.id}>
                <div>
                  <PipelineRunner pipeline={pipeline} profiles={profiles} onRunSaved={() => { refreshHistory(pipeline.id); onRefresh(); }} />
                </div>
              </Collapse>

              <Collapse in={expandedHistory === pipeline.id}>
                <div className="mt-2">
                  {(pipelineHistory[pipeline.id] ?? getPipelineRuns(pipeline.id)).length === 0
                    ? <p className="text-muted small">No runs yet.</p>
                    : (pipelineHistory[pipeline.id] ?? getPipelineRuns(pipeline.id)).map(run => (
                      <div key={run.id} className="border rounded p-2 mb-1 small">
                        <div className="d-flex justify-content-between mb-1">
                          <span>
                            <Badge bg={run.result === 'success' ? 'success' : run.result === 'partial' ? 'warning' : 'danger'} className="me-1">
                              {run.result === 'success' ? '✅' : run.result === 'partial' ? '⚠️' : '❌'}
                            </Badge>
                            {run.task}
                          </span>
                          <span className="text-muted">{new Date(run.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-muted">{run.agentResults.length} agents · {(run.totalDuration / 1000).toFixed(1)}s</div>
                        {run.summary && (
                          <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                            {run.summary.slice(0, 300)}{run.summary.length > 300 ? '…' : ''}
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </Collapse>
            </Card.Body>
          </Card>
        );
      })}

      {/* Pipeline create/edit modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingPipeline ? 'Edit Pipeline' : 'New Pipeline'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Full-Stack Code Review Pipeline" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Execution Mode</Form.Label>
                  <Form.Select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value as PipelineMode }))}>
                    {PIPELINE_MODES.map(m => (
                      <option key={m} value={m}>
                        {m === 'sequential' ? '🔗 Sequential (chain)' : '🎯 Orchestrated (hub & spoke)'}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What complex task does this pipeline solve?" />
            </Form.Group>

            {form.mode === 'orchestrated' && (
              <Form.Group className="mb-3">
                <Form.Label>Orchestrator Agent <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.orchestratorId} onChange={e => setForm(f => ({ ...f, orchestratorId: e.target.value }))}>
                  <option value="">— Select orchestrator —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({AGENT_ROLE_LABELS[p.role]})</option>)}
                </Form.Select>
                <Form.Text className="text-muted">
                  The orchestrator breaks down the task and delegates to worker agents.
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-1">
              <Form.Label>
                {form.mode === 'sequential' ? 'Agents (ordered — output flows to next)' : 'Worker Agents'}
              </Form.Label>
              <Form.Text className="text-muted d-block mb-2">
                {form.mode === 'sequential'
                  ? 'Select agents in the order you want them to run.'
                  : 'Select specialist agents the orchestrator can delegate to.'}
              </Form.Text>
              <ListGroup>
                {profiles.map(p => {
                  const selected = form.agents.some(a => a.profileId === p.id);
                  const idx = form.agents.findIndex(a => a.profileId === p.id);
                  return (
                    <ListGroup.Item key={p.id} action active={selected} onClick={() => toggleAgent(p.id)}
                      className="d-flex justify-content-between align-items-center">
                      <div>
                        {selected && form.mode === 'sequential' && (
                          <Badge bg="light" text="dark" className="me-2">{idx + 1}</Badge>
                        )}
                        <strong>{p.name}</strong>
                        <Badge bg={ROLE_BADGE_COLORS[p.role] as string} className="ms-2">{AGENT_ROLE_LABELS[p.role]}</Badge>
                        {p.specialty && <span className="text-muted ms-2 small">{p.specialty}</span>}
                      </div>
                      {selected && <span>✓</span>}
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}
            disabled={!form.name.trim() || form.agents.length === 0 || (form.mode === 'orchestrated' && !form.orchestratorId)}>
            {editingPipeline ? 'Save Changes' : 'Create Pipeline'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)}>
        <Modal.Header closeButton><Modal.Title>Delete Pipeline</Modal.Title></Modal.Header>
        <Modal.Body>Delete pipeline <strong>{deleteTarget?.name}</strong>? This removes all run history too.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

// ── Main AgentManager component ───────────────────────────────────────────────

export function AgentManager() {
  const [profiles, setProfiles] = useState<AgentProfile[]>(() => getProfiles());
  const [pipelines, setPipelines] = useState<AgentPipeline[]>(() => getPipelines());

  const refreshAll = useCallback(() => {
    setProfiles(getProfiles());
    setPipelines(getPipelines());
  }, []);

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">🎭</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Agent Orchestration</h1>
          <p className="tool-header-desc">Coordinate multiple specialized AI agents to tackle complex multi-step tasks. Use Quick Orchestrate to get started instantly, or configure custom agents and pipelines in the Advanced tabs.</p>
        </div>
      </div>

      <Tab.Container defaultActiveKey="quick">
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="quick">
              🚀 Quick Orchestrate
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="agents">
              🤖 Agents <Badge bg="secondary" className="ms-1">{profiles.length}</Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="pipelines">
              🔗 Pipelines <Badge bg="secondary" className="ms-1">{pipelines.length}</Badge>
            </Nav.Link>
          </Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="quick">
            <p className="text-muted small mb-3">
              Enter a task in plain language. The system will automatically assemble the right
              specialist agents, delegate sub-tasks, and synthesise a final answer — no setup
              required.
            </p>
            <QuickOrchestrate />
          </Tab.Pane>
          <Tab.Pane eventKey="agents">
            <AgentsTab profiles={profiles} onRefresh={refreshAll} />
          </Tab.Pane>
          <Tab.Pane eventKey="pipelines">
            <PipelinesTab pipelines={pipelines} profiles={profiles} onRefresh={refreshAll} />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
}

