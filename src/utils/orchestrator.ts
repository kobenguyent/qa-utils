/**
 * Agent Orchestrator — Coordinates multiple specialized AI agents
 *
 * Supports two coordination strategies:
 *
 * **Sequential** (chain):
 *   Each agent receives the original task + all previous agents' outputs as context.
 *   Agent 1 → output1 → Agent 2 (context: output1) → output2 → … → final answer
 *
 * **Orchestrated** (hub-and-spoke):
 *   A designated orchestrator agent analyzes the task, delegates specific sub-tasks
 *   to worker agents based on their roles/specialties, then synthesizes the results
 *   into a final answer.
 */

import { runAgent, AgentConfig, AgentStep } from './agentExecutor';
import {
  AgentProfile,
  AgentPipeline,
  PipelineAgentResult,
  AgentRole,
} from './agentStorage';

// ── Event types ────────────────────────────────────────────────────────────────

export type OrchestratorEventType =
  | 'pipeline_start'
  | 'agent_start'
  | 'agent_step'
  | 'agent_done'
  | 'orchestrator_plan'
  | 'pipeline_done'
  | 'pipeline_error';

export interface OrchestratorEvent {
  type: OrchestratorEventType;
  /** Index of the currently running worker agent (0-indexed) */
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
  profileId: string;
  subTask: string;
}

export interface DelegationPlan {
  plan: DelegationItem[];
}

// ── Helper: build AgentConfig from a profile ──────────────────────────────────

function profileToConfig(profile: AgentProfile): AgentConfig {
  return {
    provider: profile.provider,
    endpoint: profile.endpoint,
    apiKey: profile.apiKey,
    model: profile.model,
    maxIterations: profile.maxIterations,
    temperature: profile.temperature,
    cloudflareAccountId: profile.cloudflareAccountId,
    cloudflareGatewayId: profile.cloudflareGatewayId,
  };
}

// ── Helper: extract delegation plan from AI response ─────────────────────────

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

// ── Auto-team plan (for autonomous orchestration) ─────────────────────────────

/**
 * Describes a single agent that the AI has selected to handle a portion of the
 * task.  All fields are produced by the meta-orchestrator prompt.
 */
export interface AutoTeamMember {
  name: string;
  role: AgentRole;
  specialty: string;
}

export interface AutoTeamPlan {
  agents: AutoTeamMember[];
}

/** Maximum character length for a task description passed to auto-orchestration */
const MAX_AUTO_TASK_LENGTH = 4000;

/** Max characters to use as the ephemeral pipeline description */
const MAX_PIPELINE_DESCRIPTION_LENGTH = 120;

/**
 * Extract an auto-team plan emitted by the meta-orchestrator.
 *
 * The AI is prompted to respond with a `\`\`\`team\`\`\`` block containing JSON:
 * ```team
 * {"agents": [
 *   {"name": "Planner", "role": "planner", "specialty": "…"},
 *   …
 * ]}
 * ```
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

// ── Autonomous orchestration ──────────────────────────────────────────────────

export interface AutoOrchestrateEvent extends OrchestratorEvent {
  /** The auto-assembled team plan, emitted after meta-planning */
  autoTeam?: AutoTeamMember[];
}

export type OnAutoOrchestrateEvent = (event: AutoOrchestrateEvent) => void;

export interface AutoPipelineRunResult extends PipelineRunResult {
  /** The agent team that was automatically assembled for the task */
  autoTeam: AutoTeamMember[];
}

/**
 * Autonomous pipeline execution — no pre-configured agents or pipelines needed.
 *
 * Step 1 — **Team planning**: a meta-orchestrator (using `config`) analyses the
 *   task and picks the right specialist roles (planner, researcher, tester, etc.)
 *   together with a one-sentence specialty for each.
 *
 * Step 2 — **Orchestrated run**: the same pipeline engine delegates sub-tasks to
 *   the ephemeral worker agents and synthesises a final answer, exactly as
 *   `runOrchestratedPipeline` does.
 *
 * All agents share the same `config` (provider / model / API key / endpoint) so
 * the user only needs to configure one AI connection.
 */
export async function runAutoOrchestratedPipeline(
  task: string,
  config: AgentConfig,
  onEvent?: OnAutoOrchestrateEvent,
): Promise<AutoPipelineRunResult> {
  const pipelineStart = Date.now();

  // Truncate the task to prevent excessively long prompts
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
    const metaResult = await runAgent(
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

  // ── Step 2: build ephemeral profiles + pipeline ─────────────────────────────

  const now = Date.now();

  // Orchestrator profile (uses the same config — acts as the hub)
  const orchestratorProfile: AgentProfile = {
    id: `auto-orchestrator-${now}`,
    name: 'Orchestrator',
    description: 'Auto-assembled orchestrator',
    role: 'orchestrator',
    specialty: 'Delegates sub-tasks to specialist workers and synthesises the final answer',
    ...config,
    maxIterations: config.maxIterations ?? 10,
    temperature: config.temperature ?? 0.3,
    createdAt: now,
    updatedAt: now,
  };

  const workerProfiles: AgentProfile[] = autoTeam.map((member, i) => ({
    id: `auto-worker-${now}-${i}`,
    name: member.name,
    description: member.specialty,
    role: member.role,
    specialty: member.specialty,
    ...config,
    maxIterations: config.maxIterations ?? 10,
    temperature: config.temperature ?? 0.3,
    createdAt: now,
    updatedAt: now,
  }));

  const ephemeralPipeline: AgentPipeline = {
    id: `auto-pipeline-${now}`,
    name: 'Auto-assembled pipeline',
    description: task.slice(0, MAX_PIPELINE_DESCRIPTION_LENGTH),
    mode: 'orchestrated',
    orchestratorId: orchestratorProfile.id,
    agents: workerProfiles.map((p, i) => ({ profileId: p.id, order: i })),
    createdAt: now,
    updatedAt: now,
  };

  const allProfiles = [orchestratorProfile, ...workerProfiles];

  // ── Step 3: run the standard orchestrated pipeline ──────────────────────────

  const result = await runOrchestratedPipeline(safeTask, ephemeralPipeline, allProfiles, onEvent);

  return { ...result, autoTeam };
}

// ── Sequential pipeline ───────────────────────────────────────────────────────

/**
 * Run agents in order. Each agent receives the original task plus a context block
 * containing all previous agents' outputs, so later agents can build on earlier work.
 */
export async function runSequentialPipeline(
  task: string,
  pipeline: AgentPipeline,
  profiles: AgentProfile[],
  onEvent?: OnOrchestratorEvent,
): Promise<PipelineRunResult> {
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const orderedAgents = [...pipeline.agents].sort((a, b) => a.order - b.order);

  onEvent?.({ type: 'pipeline_start' });

  const agentResults: PipelineAgentResult[] = [];
  let contextSoFar = '';
  const pipelineStart = Date.now();

  for (let i = 0; i < orderedAgents.length; i++) {
    const pa = orderedAgents[i];
    const profile = profileMap.get(pa.profileId);
    if (!profile) continue;

    onEvent?.({ type: 'agent_start', agentIndex: i, agentName: profile.name, agentRole: profile.role });

    // Build this agent's input: original task + accumulated context
    const agentInput = contextSoFar
      ? `${task}\n\n---\n**Context from previous agents:**\n${contextSoFar}`
      : task;

    // If the profile has a systemPromptOverride, use it; otherwise let runAgent use default
    const config: AgentConfig = profileToConfig(profile);

    const agentStart = Date.now();
    let agentResult: PipelineAgentResult;

    try {
      const result = await runAgent(
        agentInput,
        config,
        (step) => onEvent?.({ type: 'agent_step', agentIndex: i, agentName: profile.name, step }),
      );
      agentResult = {
        profileId: profile.id,
        agentName: profile.name,
        role: profile.role,
        input: agentInput,
        output: result.answer,
        success: result.success,
        duration: Date.now() - agentStart,
      };
      // Append this agent's output to the running context
      if (result.answer) {
        contextSoFar += `\n**${profile.name} (${profile.role}):**\n${result.answer}\n`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      agentResult = {
        profileId: profile.id,
        agentName: profile.name,
        role: profile.role,
        input: agentInput,
        output: `Error: ${msg}`,
        success: false,
        duration: Date.now() - agentStart,
      };
    }

    agentResults.push(agentResult);
    onEvent?.({ type: 'agent_done', agentIndex: i, agentName: profile.name, result: agentResult });
  }

  // The last agent's output is the final summary; if it failed, combine all
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
 * each to a specific worker agent. Workers execute their sub-tasks independently,
 * and the orchestrator synthesizes all results into a final answer.
 */
export async function runOrchestratedPipeline(
  task: string,
  pipeline: AgentPipeline,
  profiles: AgentProfile[],
  onEvent?: OnOrchestratorEvent,
): Promise<PipelineRunResult> {
  if (!pipeline.orchestratorId) {
    return {
      success: false,
      summary: 'No orchestrator assigned to this pipeline.',
      agentResults: [],
      totalDuration: 0,
      error: 'No orchestrator assigned',
    };
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const orchestrator = profileMap.get(pipeline.orchestratorId);
  if (!orchestrator) {
    return {
      success: false,
      summary: 'Orchestrator profile not found.',
      agentResults: [],
      totalDuration: 0,
      error: 'Orchestrator profile not found',
    };
  }

  const workerProfiles = pipeline.agents
    .map(a => profileMap.get(a.profileId))
    .filter((p): p is AgentProfile => !!p);

  onEvent?.({ type: 'pipeline_start' });
  const pipelineStart = Date.now();

  // ── Step 1: Ask orchestrator to produce a delegation plan ──────────────────

  const workerDescriptions = workerProfiles.map(p =>
    `- Agent ID: ${p.id}\n  Name: ${p.name}\n  Role: ${p.role}\n  Specialty: ${p.specialty ?? p.description}`
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
  {"profileId": "<agent_id>", "subTask": "<specific task for this agent>"},
  ...
]}
\`\`\`

Be specific — give each worker enough context so they can work independently.`;

  onEvent?.({ type: 'agent_start', agentName: orchestrator.name, agentRole: 'orchestrator' });

  const orchestratorStart = Date.now();
  let planResult: PipelineAgentResult;
  let plan: DelegationPlan | null = null;

  try {
    const orcResult = await runAgent(
      orchestrationTask,
      profileToConfig(orchestrator),
      (step) => onEvent?.({ type: 'agent_step', agentName: orchestrator.name, step }),
    );

    // Try to extract delegation plan from the answer
    plan = parseDelegationPlan(orcResult.answer);

    planResult = {
      profileId: orchestrator.id,
      agentName: orchestrator.name,
      role: 'orchestrator',
      input: orchestrationTask,
      output: orcResult.answer,
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

  // If no plan was produced, fall back to the orchestrator's answer directly
  if (!plan || plan.plan.length === 0) {
    return {
      success: planResult.success,
      summary: planResult.output,
      agentResults: [planResult],
      totalDuration: Date.now() - pipelineStart,
    };
  }

  // ── Step 2: Execute each worker's sub-task in parallel ─────────────────────

  const workerResults: PipelineAgentResult[] = [];

  const workerPromises = plan.plan.map(async (item, i) => {
    const workerProfile = profileMap.get(item.profileId);
    if (!workerProfile) return;

    onEvent?.({ type: 'agent_start', agentIndex: i, agentName: workerProfile.name, agentRole: workerProfile.role });
    const workerStart = Date.now();

    try {
      const result = await runAgent(
        item.subTask,
        profileToConfig(workerProfile),
        (step) => onEvent?.({ type: 'agent_step', agentIndex: i, agentName: workerProfile.name, step }),
      );
      const workerResult: PipelineAgentResult = {
        profileId: workerProfile.id,
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
        profileId: workerProfile.id,
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
  });

  await Promise.all(workerPromises);

  // ── Step 3: Orchestrator synthesizes results ───────────────────────────────

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
    const result = await runAgent(
      synthesisTask,
      { ...profileToConfig(orchestrator), maxIterations: 3 },
      (step) => onEvent?.({ type: 'agent_step', agentName: orchestrator.name, step }),
    );
    synthResult = {
      profileId: orchestrator.id,
      agentName: `${orchestrator.name} (synthesis)`,
      role: 'synthesizer',
      input: synthesisTask,
      output: result.answer,
      success: result.success,
      duration: Date.now() - synthStart,
    };
  } catch {
    synthResult = {
      profileId: orchestrator.id,
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
  const summary = synthResult.output;

  onEvent?.({ type: 'pipeline_done', summary });
  return {
    success: anySuccess,
    summary,
    agentResults: allAgentResults,
    totalDuration: Date.now() - pipelineStart,
  };
}
