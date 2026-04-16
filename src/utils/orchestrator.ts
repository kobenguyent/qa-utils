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
    const config: AgentConfig = {
      ...profileToConfig(profile),
      ...(profile.systemPromptOverride ? {} : {}), // runAgent handles system prompt internally
    };

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
  const allSuccess = agentResults.every(r => r.success);
  const overallResult = allSuccess ? 'success' : anySuccess ? 'partial' : 'error';

  onEvent?.({ type: 'pipeline_done', summary });
  return {
    success: anySuccess,
    summary,
    agentResults,
    totalDuration: Date.now() - pipelineStart,
    ...(overallResult === 'error' ? { error: 'All agents failed' } : {}),
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    synthResult = {
      profileId: orchestrator.id,
      agentName: `${orchestrator.name} (synthesis)`,
      role: 'synthesizer',
      input: synthesisTask,
      output: workerOutputs,
      success: false,
      duration: Date.now() - synthStart,
    };
    void msg;
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
