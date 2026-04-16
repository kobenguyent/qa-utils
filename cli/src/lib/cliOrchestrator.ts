/**
 * qautils-cli — CLI Agent Orchestrator
 *
 * Node.js port of src/utils/orchestrator.ts. Uses runCliAgent from
 * cliAgentExecutor instead of the browser runAgent.
 *
 * Supports two coordination strategies:
 *
 * **Sequential** (chain):
 *   Each agent receives the original task + all previous agents' outputs as
 *   context.  Agent 1 → output1 → Agent 2 (context: output1) → … → final
 *
 * **Orchestrated** (hub-and-spoke):
 *   A designated orchestrator agent analyses the task, delegates specific
 *   sub-tasks to worker agents based on their roles/specialties, then
 *   synthesises the results into a final answer.
 *
 * **Auto-Orchestrated** (autonomous):
 *   A meta-orchestrator first assembles an optimal team of ephemeral agents,
 *   then runs the orchestrated pipeline.  No pre-configured agents needed.
 */

import { runCliAgent, type AgentStep } from './cliAgentExecutor.js';
import type { AIProviderConfig } from './aiConfig.js';

// ── Role types ────────────────────────────────────────────────────────────────

export type AgentRole =
  | 'orchestrator'
  | 'planner'
  | 'researcher'
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'synthesizer'
  | 'analyst'
  | 'writer'
  | 'debugger'
  | 'designer'
  | 'validator'
  | 'custom';

// ── Event types ────────────────────────────────────────────────────────────────

export type OrchestratorEventType =
  | 'pipeline_start'
  | 'agent_start'
  | 'agent_step'
  | 'agent_done'
  | 'orchestrator_plan'
  | 'pipeline_done'
  | 'pipeline_error';

export interface PipelineAgentResult {
  agentName: string;
  role: AgentRole;
  input: string;
  output: string;
  success: boolean;
  duration: number;
}

export interface OrchestratorEvent {
  type: OrchestratorEventType;
  agentIndex?: number;
  agentName?: string;
  agentRole?: string;
  step?: AgentStep;
  result?: PipelineAgentResult;
  plan?: DelegationPlan;
  summary?: string;
  error?: string;
}

export type OnOrchestratorEvent = (event: OrchestratorEvent) => void;

export interface PipelineRunResult {
  success: boolean;
  summary: string;
  agentResults: PipelineAgentResult[];
  totalDuration: number;
  error?: string;
}

// ── Delegation plan (for orchestrated mode) ────────────────────────────────────

export interface DelegationItem {
  agentName: string;
  subTask: string;
}

export interface DelegationPlan {
  plan: DelegationItem[];
}

// ── Internal profile types ─────────────────────────────────────────────────────

interface AgentProfile {
  name: string;
  role: AgentRole;
  specialty: string;
  config: AIProviderConfig & { maxIterations?: number; temperature?: number };
}

// ── Auto-team plan ─────────────────────────────────────────────────────────────

export interface AutoTeamMember {
  name: string;
  role: AgentRole;
  specialty: string;
}

export interface AutoTeamPlan {
  agents: AutoTeamMember[];
}

export interface AutoOrchestrateEvent extends OrchestratorEvent {
  autoTeam?: AutoTeamMember[];
}

export type OnAutoOrchestrateEvent = (event: AutoOrchestrateEvent) => void;

export interface AutoPipelineRunResult extends PipelineRunResult {
  autoTeam: AutoTeamMember[];
}

/** Maximum character length for a task description passed to auto-orchestration */
const MAX_AUTO_TASK_LENGTH = 4000;

// ── Plan parsers ───────────────────────────────────────────────────────────────

/**
 * Extract a delegation plan emitted by the orchestrator agent.
 * Expects a ```delegate block containing JSON with a `plan` array.
 */
export function parseDelegationPlan(text: string): DelegationPlan | null {
  const match = text.match(/```delegate\s*\n?([\s\S]*?)```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim()) as { plan?: DelegationItem[] };
      if (parsed && Array.isArray(parsed.plan)) {
        return { plan: parsed.plan };
      }
    } catch {
      // fall through
    }
  }
  return null;
}

/**
 * Extract an auto-team plan emitted by the meta-orchestrator.
 * Expects a ```team block containing JSON with an `agents` array.
 */
export function parseTeamPlan(text: string): AutoTeamPlan | null {
  const match = text.match(/```team\s*\n?([\s\S]*?)```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim()) as { agents?: AutoTeamMember[] };
      if (parsed?.agents && Array.isArray(parsed.agents) && parsed.agents.length > 0) {
        return { agents: parsed.agents };
      }
    } catch {
      // fall through
    }
  }
  return null;
}

// ── Sequential pipeline ───────────────────────────────────────────────────────

/**
 * Run agents in order.  Each agent receives the original task plus a context
 * block containing all previous agents' outputs.
 */
export async function runSequentialPipeline(
  task: string,
  agents: AgentProfile[],
  onEvent?: OnOrchestratorEvent,
): Promise<PipelineRunResult> {
  onEvent?.({ type: 'pipeline_start' });

  const agentResults: PipelineAgentResult[] = [];
  let contextSoFar = '';
  const pipelineStart = Date.now();

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];

    onEvent?.({ type: 'agent_start', agentIndex: i, agentName: agent.name, agentRole: agent.role });

    const agentInput = contextSoFar
      ? `${task}\n\n---\n**Context from previous agents:**\n${contextSoFar}`
      : task;

    const agentStart = Date.now();
    let agentResult: PipelineAgentResult;

    try {
      const result = await runCliAgent(
        agentInput,
        agent.config,
        (step) => onEvent?.({ type: 'agent_step', agentIndex: i, agentName: agent.name, step }),
      );
      const output = result.answer || (result.error ? `Error: ${result.error}` : '');
      agentResult = {
        agentName: agent.name,
        role: agent.role,
        input: agentInput,
        output,
        success: result.success,
        duration: Date.now() - agentStart,
      };
      if (result.answer) {
        contextSoFar += `\n**${agent.name} (${agent.role}):**\n${result.answer}\n`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      agentResult = {
        agentName: agent.name,
        role: agent.role,
        input: agentInput,
        output: `Error: ${msg}`,
        success: false,
        duration: Date.now() - agentStart,
      };
    }

    agentResults.push(agentResult);
    onEvent?.({ type: 'agent_done', agentIndex: i, agentName: agent.name, result: agentResult });
  }

  const lastSuccess = [...agentResults].reverse().find(r => r.success);
  const summary = lastSuccess?.output
    ?? agentResults.map(r => `**${r.agentName}**: ${r.output}`).join('\n\n');
  const anySuccess = agentResults.some(r => r.success);

  onEvent?.({ type: 'pipeline_done', summary });
  return {
    success: anySuccess,
    summary,
    agentResults,
    totalDuration: Date.now() - pipelineStart,
    ...(!anySuccess ? { error: 'All agents failed' } : {}),
  };
}

// ── Orchestrated pipeline ─────────────────────────────────────────────────────

/**
 * A designated orchestrator agent breaks the task into sub-tasks and delegates
 * each to a specific worker agent.  Workers execute in parallel, and the
 * orchestrator synthesises all results into a final answer.
 */
export async function runOrchestratedPipeline(
  task: string,
  orchestrator: AgentProfile,
  workers: AgentProfile[],
  onEvent?: OnOrchestratorEvent,
): Promise<PipelineRunResult> {
  onEvent?.({ type: 'pipeline_start' });
  const pipelineStart = Date.now();

  // ── Step 1: Ask orchestrator to produce a delegation plan ──────────────────

  const workerDescriptions = workers.map(p =>
    `- Agent: ${p.name}\n  Role: ${p.role}\n  Specialty: ${p.specialty}`
  ).join('\n');

  const orchestrationTask = `You are the Orchestrator for a team of specialized AI agents. Your team:

${workerDescriptions}

## Your Task
${task}

## Instructions
Analyze the task, then produce a delegation plan — assign each worker a specific sub-task that plays to their specialty.

Respond with a delegation plan in this exact format:

\`\`\`delegate
{"plan": [
  {"agentName": "<agent name>", "subTask": "<specific task for this agent>"},
  ...
]}
\`\`\`

Be specific — give each worker enough context so they can work independently.`;

  onEvent?.({ type: 'agent_start', agentName: orchestrator.name, agentRole: 'orchestrator' });

  const orchestratorStart = Date.now();
  let planResult: PipelineAgentResult;
  let plan: DelegationPlan | null = null;

  let orcRunError: string | undefined;
  try {
    const orcResult = await runCliAgent(
      orchestrationTask,
      orchestrator.config,
      (step) => onEvent?.({ type: 'agent_step', agentName: orchestrator.name, step }),
    );

    if (!orcResult.success) {
      orcRunError = orcResult.error;
    }

    plan = parseDelegationPlan(orcResult.answer);

    planResult = {
      agentName: orchestrator.name,
      role: 'orchestrator',
      input: orchestrationTask,
      output: orcResult.answer || (orcResult.error ? `Error: ${orcResult.error}` : ''),
      success: !!plan,
      duration: Date.now() - orchestratorStart,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      summary: `Orchestrator failed: ${msg}`,
      agentResults: [],
      totalDuration: Date.now() - pipelineStart,
      error: msg,
    };
  }

  onEvent?.({ type: 'orchestrator_plan', plan: plan ?? undefined, agentName: orchestrator.name });
  onEvent?.({ type: 'agent_done', agentName: orchestrator.name, result: planResult });

  if (!plan || plan.plan.length === 0) {
    return {
      success: planResult.success,
      summary: planResult.output,
      agentResults: [planResult],
      totalDuration: Date.now() - pipelineStart,
      ...(orcRunError ? { error: orcRunError } : {}),
    };
  }

  // ── Step 2: Execute each worker's sub-task in parallel ─────────────────────

  const workerMap = new Map(workers.map(p => [p.name, p]));
  const workerResults: PipelineAgentResult[] = [];

  await Promise.all(plan.plan.map(async (item, i) => {
    const workerProfile = workerMap.get(item.agentName);
    if (!workerProfile) return;

    onEvent?.({ type: 'agent_start', agentIndex: i, agentName: workerProfile.name, agentRole: workerProfile.role });
    const workerStart = Date.now();

    try {
      const result = await runCliAgent(
        item.subTask,
        workerProfile.config,
        (step) => onEvent?.({ type: 'agent_step', agentIndex: i, agentName: workerProfile.name, step }),
      );
      const workerResult: PipelineAgentResult = {
        agentName: workerProfile.name,
        role: workerProfile.role,
        input: item.subTask,
        output: result.answer,
        success: result.success,
        duration: Date.now() - workerStart,
      };
      workerResults.push(workerResult);
      onEvent?.({ type: 'agent_done', agentIndex: i, agentName: workerProfile.name, result: workerResult });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const workerResult: PipelineAgentResult = {
        agentName: workerProfile.name,
        role: workerProfile.role,
        input: item.subTask,
        output: `Error: ${msg}`,
        success: false,
        duration: Date.now() - workerStart,
      };
      workerResults.push(workerResult);
      onEvent?.({ type: 'agent_done', agentIndex: i, agentName: workerProfile.name, result: workerResult });
    }
  }));

  // ── Step 3: Orchestrator synthesises results ───────────────────────────────

  const workerOutputs = workerResults.map(r =>
    `**${r.agentName} (${r.role}):**\n${r.output}`
  ).join('\n\n---\n\n');

  const synthesisTask = `Your team has completed their delegated work. Here are their outputs:

${workerOutputs}

---

Now synthesize all of these results into a final, cohesive answer that fully addresses the original task:

${task}`;

  onEvent?.({ type: 'agent_start', agentName: `${orchestrator.name} (synthesis)`, agentRole: 'synthesizer' });
  const synthStart = Date.now();

  let synthResult: PipelineAgentResult;
  try {
    const result = await runCliAgent(
      synthesisTask,
      { ...orchestrator.config, maxIterations: 3 },
      (step) => onEvent?.({ type: 'agent_step', agentName: orchestrator.name, step }),
    );
    synthResult = {
      agentName: `${orchestrator.name} (synthesis)`,
      role: 'synthesizer',
      input: synthesisTask,
      output: result.answer,
      success: result.success,
      duration: Date.now() - synthStart,
    };
  } catch {
    synthResult = {
      agentName: `${orchestrator.name} (synthesis)`,
      role: 'synthesizer',
      input: synthesisTask,
      output: workerOutputs,
      success: false,
      duration: Date.now() - synthStart,
    };
  }

  onEvent?.({ type: 'agent_done', agentName: orchestrator.name, result: synthResult });

  const allAgentResults = [planResult, ...workerResults, synthResult];
  const anySuccess = allAgentResults.some(r => r.success);

  onEvent?.({ type: 'pipeline_done', summary: synthResult.output });
  return {
    success: anySuccess,
    summary: synthResult.output,
    agentResults: allAgentResults,
    totalDuration: Date.now() - pipelineStart,
  };
}

// ── Auto-orchestrated pipeline ────────────────────────────────────────────────

/**
 * Autonomous pipeline execution — no pre-configured agents needed.
 *
 * Step 1 — **Team planning**: a meta-orchestrator analyses the task and picks
 *   specialist roles (planner, researcher, tester, etc.) with one-sentence
 *   specialties.
 *
 * Step 2 — **Orchestrated run**: the pipeline engine delegates sub-tasks to
 *   ephemeral worker agents and synthesises a final answer.
 *
 * All agents share the same `config` (provider / model / API key / endpoint)
 * so the user only needs to configure one AI connection.
 */
export async function runAutoOrchestratedPipeline(
  task: string,
  config: AIProviderConfig & { maxIterations?: number; temperature?: number },
  onEvent?: OnAutoOrchestrateEvent,
): Promise<AutoPipelineRunResult> {
  const pipelineStart = Date.now();
  const safeTask = task.slice(0, MAX_AUTO_TASK_LENGTH);

  // ── Step 1: meta-orchestrator assembles the team ────────────────────────────

  const teamPlanningTask = `You are a meta-orchestrator.  Your job is to read a task description and decide which specialist AI agents should work on it together.

## Task
${safeTask}

## Available Roles
- planner      — breaks down a complex task into an ordered plan of action
- researcher   — gathers information, analyses requirements, and produces research notes
- coder        — writes, refactors, or debugs code
- reviewer     — reviews work for quality, correctness, security, or style
- tester       — writes automated tests (unit, integration, end-to-end)
- synthesizer  — combines work from multiple agents into a cohesive final output
- analyst      — analyses data, metrics, or requirements and produces insights
- writer       — writes documentation, reports, or other written content
- debugger     — debugs issues, performs root cause analysis, and proposes fixes
- designer     — designs architecture, API contracts, or system structure
- validator    — validates outputs, checks quality, and verifies correctness
- custom       — a general-purpose agent for any work that doesn't fit the above

## Instructions
Choose 2–4 agents from the roles above that best cover the task.  Assign each a short, specific specialty description (one sentence).

Respond with ONLY the following JSON block — no other text:

\`\`\`team
{"agents": [
  {"name": "<display name>", "role": "<role>", "specialty": "<one-sentence specialty>"},
  ...
]}
\`\`\``;

  onEvent?.({ type: 'pipeline_start' });
  onEvent?.({ type: 'agent_start', agentName: 'Meta-Orchestrator', agentRole: 'orchestrator' });

  let autoTeam: AutoTeamMember[] = [];

  try {
    const metaResult = await runCliAgent(
      teamPlanningTask,
      { ...config, maxIterations: 3 },
      (step) => onEvent?.({ type: 'agent_step', agentName: 'Meta-Orchestrator', step }),
    );

    const parsed = parseTeamPlan(metaResult.answer);
    if (parsed && parsed.agents.length > 0) {
      autoTeam = parsed.agents;
    } else {
      // Fallback: generic 2-agent team
      autoTeam = [
        { name: 'Planner', role: 'planner', specialty: 'Breaks the task into a clear, step-by-step plan' },
        { name: 'Executor', role: 'custom', specialty: 'Carries out the plan and produces the final deliverable' },
      ];
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      summary: `Meta-orchestrator failed to assemble a team: ${msg}`,
      agentResults: [],
      totalDuration: Date.now() - pipelineStart,
      autoTeam: [],
      error: msg,
    };
  }

  onEvent?.({ type: 'agent_done', agentName: 'Meta-Orchestrator', autoTeam });

  // ── Step 2: build ephemeral profiles + run orchestrated pipeline ────────────

  const orchestratorProfile: AgentProfile = {
    name: 'Orchestrator',
    role: 'orchestrator',
    specialty: 'Delegates sub-tasks to specialist workers and synthesises the final answer',
    config: { ...config, maxIterations: config.maxIterations ?? 10 },
  };

  const workerProfiles: AgentProfile[] = autoTeam.map((member) => ({
    name: member.name,
    role: member.role,
    specialty: member.specialty,
    config: { ...config, maxIterations: config.maxIterations ?? 10 },
  }));

  const result = await runOrchestratedPipeline(safeTask, orchestratorProfile, workerProfiles, onEvent);

  return { ...result, autoTeam };
}
