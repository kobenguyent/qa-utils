/**
 * Agent Storage — Persistent storage for Agent Orchestration Manager
 *
 * Stores:
 *   - AgentProfile: configuration for an individual AI agent with a role/specialty
 *   - AgentRun: single-agent run history
 *   - AgentPipeline: an orchestration workflow that coordinates multiple agents
 *   - PipelineRun: orchestration run history
 */

const PROFILES_KEY = 'agentManager_profiles';
const RUNS_KEY_PREFIX = 'agentManager_runs_';
const PIPELINES_KEY = 'agentManager_pipelines';
const PIPELINE_RUNS_KEY_PREFIX = 'agentManager_pipelineRuns_';
const MAX_RUNS_PER_PROFILE = 10;
const MAX_RUNS_PER_PIPELINE = 10;

export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'google' | 'azure-openai' | 'cloudflare-ai';

/** The functional role an agent plays in a pipeline */
export type AgentRole =
  | 'orchestrator'
  | 'planner'
  | 'researcher'
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'synthesizer'
  | 'custom';

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  orchestrator: '🎯 Orchestrator',
  planner:      '📋 Planner',
  researcher:   '🔍 Researcher',
  coder:        '💻 Coder',
  reviewer:     '🔎 Reviewer',
  tester:       '🧪 Tester',
  synthesizer:  '🔗 Synthesizer',
  custom:       '🤖 Custom',
};

export const AGENT_ROLE_COLORS: Record<AgentRole, string> = {
  orchestrator: 'warning',
  planner:      'info',
  researcher:   'primary',
  coder:        'dark',
  reviewer:     'secondary',
  tester:       'success',
  synthesizer:  'danger',
  custom:       'light',
};

export interface AgentProfile {
  id: string;
  name: string;
  description: string;
  /** The functional role this agent plays in a pipeline */
  role: AgentRole;
  /** A short sentence describing what this agent specialises in */
  specialty?: string;
  provider: AIProvider;
  endpoint?: string;
  apiKey?: string;
  model?: string;
  cloudflareAccountId?: string; // For Cloudflare Workers AI
  maxIterations: number;
  temperature: number;
  systemPromptOverride?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AgentRun {
  id: string;
  profileId: string;
  task: string;
  result: 'success' | 'error';
  answer: string;
  iterationCount: number;
  timestamp: number;
}

// ── Pipeline (Orchestration) types ────────────────────────────────────────────

/**
 * How agents in a pipeline coordinate their work:
 *  - sequential: each agent's output becomes the next agent's context (chain)
 *  - orchestrated: a designated orchestrator agent delegates sub-tasks to workers
 */
export type PipelineMode = 'sequential' | 'orchestrated';

export interface PipelineAgent {
  profileId: string;
  /** Execution order (0-indexed) for sequential mode */
  order: number;
}

export interface AgentPipeline {
  id: string;
  name: string;
  description: string;
  mode: PipelineMode;
  /** Profile ID of the orchestrator agent (required for 'orchestrated' mode) */
  orchestratorId?: string;
  /** Worker agents in the pipeline */
  agents: PipelineAgent[];
  createdAt: number;
  updatedAt: number;
}

/** Per-agent result within a pipeline run */
export interface PipelineAgentResult {
  profileId: string;
  agentName: string;
  role: AgentRole;
  input: string;
  output: string;
  success: boolean;
  duration: number;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  task: string;
  result: 'success' | 'error' | 'partial';
  summary: string;
  agentResults: PipelineAgentResult[];
  totalDuration: number;
  timestamp: number;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback using secure random bytes (older browsers)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getProfiles(): AgentProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AgentProfile[];
  } catch {
    return [];
  }
}

export function saveProfile(profile: AgentProfile): void {
  const profiles = getProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = { ...profile, updatedAt: Date.now() };
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter(p => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  // clean up runs
  localStorage.removeItem(RUNS_KEY_PREFIX + id);
}

export function createProfile(partial: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>): AgentProfile {
  const now = Date.now();
  const profile: AgentProfile = { ...partial, id: uid(), createdAt: now, updatedAt: now };
  saveProfile(profile);
  return profile;
}

export function getRuns(profileId: string): AgentRun[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY_PREFIX + profileId);
    if (!raw) return [];
    return JSON.parse(raw) as AgentRun[];
  } catch {
    return [];
  }
}

export function saveRun(run: AgentRun): void {
  const runs = getRuns(run.profileId);
  runs.unshift(run);
  const trimmed = runs.slice(0, MAX_RUNS_PER_PROFILE);
  localStorage.setItem(RUNS_KEY_PREFIX + run.profileId, JSON.stringify(trimmed));
}

export function createRun(partial: Omit<AgentRun, 'id'>): AgentRun {
  const run: AgentRun = { ...partial, id: uid() };
  saveRun(run);
  return run;
}

// ── Pipeline CRUD ─────────────────────────────────────────────────────────────

export function getPipelines(): AgentPipeline[] {
  try {
    const raw = localStorage.getItem(PIPELINES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AgentPipeline[];
  } catch {
    return [];
  }
}

export function savePipeline(pipeline: AgentPipeline): void {
  const pipelines = getPipelines();
  const idx = pipelines.findIndex(p => p.id === pipeline.id);
  if (idx >= 0) {
    pipelines[idx] = { ...pipeline, updatedAt: Date.now() };
  } else {
    pipelines.push(pipeline);
  }
  localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines));
}

export function deletePipeline(id: string): void {
  const pipelines = getPipelines().filter(p => p.id !== id);
  localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines));
  localStorage.removeItem(PIPELINE_RUNS_KEY_PREFIX + id);
}

export function createPipeline(partial: Omit<AgentPipeline, 'id' | 'createdAt' | 'updatedAt'>): AgentPipeline {
  const now = Date.now();
  const pipeline: AgentPipeline = { ...partial, id: uid(), createdAt: now, updatedAt: now };
  savePipeline(pipeline);
  return pipeline;
}

export function getPipelineRuns(pipelineId: string): PipelineRun[] {
  try {
    const raw = localStorage.getItem(PIPELINE_RUNS_KEY_PREFIX + pipelineId);
    if (!raw) return [];
    return JSON.parse(raw) as PipelineRun[];
  } catch {
    return [];
  }
}

export function savePipelineRun(run: PipelineRun): void {
  const runs = getPipelineRuns(run.pipelineId);
  runs.unshift(run);
  const trimmed = runs.slice(0, MAX_RUNS_PER_PIPELINE);
  localStorage.setItem(PIPELINE_RUNS_KEY_PREFIX + run.pipelineId, JSON.stringify(trimmed));
}

export function createPipelineRun(partial: Omit<PipelineRun, 'id'>): PipelineRun {
  const run: PipelineRun = { ...partial, id: uid() };
  savePipelineRun(run);
  return run;
}
