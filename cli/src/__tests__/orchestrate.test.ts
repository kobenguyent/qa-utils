import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseDelegationPlan,
  parseTeamPlan,
  runAutoOrchestratedPipeline,
  runSequentialPipeline,
  runOrchestratedPipeline,
} from '../lib/cliOrchestrator.js';

// Mock aiClient
vi.mock('../lib/aiClient.js', () => ({
  sendChat: vi.fn(),
}));

import { sendChat } from '../lib/aiClient.js';
const mockSendChat = vi.mocked(sendChat);

const BASE_CONFIG = {
  provider: 'ollama' as const,
  endpoint: 'http://localhost:11434',
  model: 'llama2',
  maxIterations: 3,
};

// ── parseDelegationPlan ───────────────────────────────────────────────────────

describe('parseDelegationPlan', () => {
  it('parses a valid delegate block', () => {
    const text = '```delegate\n{"plan": [{"agentName": "Planner", "subTask": "Plan it"}]}\n```';
    expect(parseDelegationPlan(text)).toEqual({
      plan: [{ agentName: 'Planner', subTask: 'Plan it' }],
    });
  });

  it('returns null when no delegate block', () => {
    expect(parseDelegationPlan('Here is my answer.')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseDelegationPlan('```delegate\n{bad json}\n```')).toBeNull();
  });

  it('returns null when plan property is missing', () => {
    expect(parseDelegationPlan('```delegate\n{"foo": []}\n```')).toBeNull();
  });

  it('parses a plan with multiple items', () => {
    const text = '```delegate\n{"plan": [{"agentName": "A", "subTask": "t1"}, {"agentName": "B", "subTask": "t2"}]}\n```';
    const result = parseDelegationPlan(text);
    expect(result?.plan).toHaveLength(2);
    expect(result?.plan[1].agentName).toBe('B');
  });
});

// ── parseTeamPlan ─────────────────────────────────────────────────────────────

describe('parseTeamPlan', () => {
  it('parses a valid team block', () => {
    const text = '```team\n{"agents": [{"name": "Planner", "role": "planner", "specialty": "Plans stuff"}]}\n```';
    expect(parseTeamPlan(text)).toEqual({
      agents: [{ name: 'Planner', role: 'planner', specialty: 'Plans stuff' }],
    });
  });

  it('returns null when no team block', () => {
    expect(parseTeamPlan('No team here.')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseTeamPlan('```team\n{bad json}\n```')).toBeNull();
  });

  it('returns null when agents array is empty', () => {
    expect(parseTeamPlan('```team\n{"agents": []}\n```')).toBeNull();
  });

  it('parses multiple agents', () => {
    const text = '```team\n{"agents": [{"name": "A", "role": "planner", "specialty": "s1"}, {"name": "B", "role": "coder", "specialty": "s2"}]}\n```';
    const result = parseTeamPlan(text);
    expect(result?.agents).toHaveLength(2);
    expect(result?.agents[1].role).toBe('coder');
  });
});

// ── runSequentialPipeline ─────────────────────────────────────────────────────

describe('runSequentialPipeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runs agents in sequence and returns last success', async () => {
    mockSendChat
      .mockResolvedValueOnce({ message: 'First agent answer.', model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Second agent answer.', model: 'llama2' });

    const agents = [
      { name: 'A1', role: 'planner' as const, specialty: 's1', config: BASE_CONFIG },
      { name: 'A2', role: 'coder' as const, specialty: 's2', config: BASE_CONFIG },
    ];

    const result = await runSequentialPipeline('Do something', agents);
    expect(result.success).toBe(true);
    expect(result.agentResults).toHaveLength(2);
    expect(result.summary).toBe('Second agent answer.');
  });

  it('passes previous output as context to later agents', async () => {
    mockSendChat
      .mockResolvedValueOnce({ message: 'Step one output.', model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Step two output.', model: 'llama2' });

    const agents = [
      { name: 'A1', role: 'planner' as const, specialty: 's1', config: BASE_CONFIG },
      { name: 'A2', role: 'coder' as const, specialty: 's2', config: BASE_CONFIG },
    ];

    await runSequentialPipeline('task', agents);

    // The second sendChat call should include the first agent's output in context
    const secondCallMessages = mockSendChat.mock.calls[1][0];
    const userMessage = secondCallMessages.find((m: { role: string; content: string }) => m.role === 'user');
    expect(userMessage?.content).toContain('Step one output.');
  });

  it('emits events', async () => {
    mockSendChat.mockResolvedValue({ message: 'Done.', model: 'llama2' });
    const events: string[] = [];
    const agents = [{ name: 'A', role: 'planner' as const, specialty: 's', config: BASE_CONFIG }];
    await runSequentialPipeline('task', agents, (e) => events.push(e.type));
    expect(events).toContain('pipeline_start');
    expect(events).toContain('agent_start');
    expect(events).toContain('agent_done');
    expect(events).toContain('pipeline_done');
  });

  it('handles agent failure gracefully', async () => {
    mockSendChat.mockRejectedValueOnce(new Error('Network error'));
    const agents = [{ name: 'A', role: 'planner' as const, specialty: 's', config: BASE_CONFIG }];
    const result = await runSequentialPipeline('task', agents);
    expect(result.success).toBe(false);
    expect(result.agentResults[0].output).toContain('Network error');
  });
});

// ── runOrchestratedPipeline ───────────────────────────────────────────────────

describe('runOrchestratedPipeline', () => {
  beforeEach(() => vi.clearAllMocks());

  const orchestrator = { name: 'Orch', role: 'orchestrator' as const, specialty: 'orchestrates', config: BASE_CONFIG };
  const workers = [
    { name: 'Worker1', role: 'planner' as const, specialty: 'plans', config: BASE_CONFIG },
    { name: 'Worker2', role: 'coder' as const, specialty: 'codes', config: BASE_CONFIG },
  ];

  it('produces delegation plan and runs workers + synthesis', async () => {
    const delegatePlan = '```delegate\n{"plan": [{"agentName": "Worker1", "subTask": "Plan it"}, {"agentName": "Worker2", "subTask": "Code it"}]}\n```';

    mockSendChat
      .mockResolvedValueOnce({ message: delegatePlan, model: 'llama2' })         // orchestrator plan
      .mockResolvedValueOnce({ message: 'Plan output.', model: 'llama2' })        // Worker1
      .mockResolvedValueOnce({ message: 'Code output.', model: 'llama2' })        // Worker2
      .mockResolvedValueOnce({ message: 'Synthesized answer.', model: 'llama2' }); // synthesis

    const result = await runOrchestratedPipeline('Do a big task', orchestrator, workers);
    expect(result.success).toBe(true);
    expect(result.summary).toBe('Synthesized answer.');
    // planResult + 2 workers + synthesis = 4 results
    expect(result.agentResults).toHaveLength(4);
  });

  it('falls back to orchestrator answer when no plan produced', async () => {
    mockSendChat.mockResolvedValueOnce({ message: 'Here is my answer without a plan.', model: 'llama2' });

    const result = await runOrchestratedPipeline('task', orchestrator, workers);
    expect(result.agentResults).toHaveLength(1);
    expect(result.summary).toBe('Here is my answer without a plan.');
  });

  it('emits orchestrator_plan event', async () => {
    const delegatePlan = '```delegate\n{"plan": [{"agentName": "Worker1", "subTask": "Do it"}]}\n```';
    mockSendChat
      .mockResolvedValueOnce({ message: delegatePlan, model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Worker done.', model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Synthesis done.', model: 'llama2' });

    const events: string[] = [];
    await runOrchestratedPipeline('task', orchestrator, [workers[0]], (e) => events.push(e.type));
    expect(events).toContain('orchestrator_plan');
  });

  it('returns error when orchestrator call fails', async () => {
    mockSendChat.mockRejectedValueOnce(new Error('Orchestrator crash'));
    const result = await runOrchestratedPipeline('task', orchestrator, workers);
    expect(result.success).toBe(false);
    // runCliAgent catches the error; error is propagated via orcRunError
    expect(result.error).toContain('Orchestrator crash');
  });
});

// ── runAutoOrchestratedPipeline ───────────────────────────────────────────────

describe('runAutoOrchestratedPipeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('assembles a team from meta-orchestrator response and runs pipeline', async () => {
    const teamBlock = '```team\n{"agents": [{"name": "Planner", "role": "planner", "specialty": "Plans the work"}, {"name": "Coder", "role": "coder", "specialty": "Writes code"}]}\n```';
    const delegatePlan = '```delegate\n{"plan": [{"agentName": "Planner", "subTask": "Plan it"}, {"agentName": "Coder", "subTask": "Code it"}]}\n```';

    mockSendChat
      .mockResolvedValueOnce({ message: teamBlock, model: 'llama2' })             // meta-orchestrator
      .mockResolvedValueOnce({ message: delegatePlan, model: 'llama2' })          // orchestrator plan
      .mockResolvedValueOnce({ message: 'Planner output.', model: 'llama2' })     // Planner worker
      .mockResolvedValueOnce({ message: 'Coder output.', model: 'llama2' })       // Coder worker
      .mockResolvedValueOnce({ message: 'Final synthesized answer.', model: 'llama2' }); // synthesis

    const result = await runAutoOrchestratedPipeline('Build a feature', BASE_CONFIG);
    expect(result.success).toBe(true);
    expect(result.autoTeam).toHaveLength(2);
    expect(result.autoTeam[0].name).toBe('Planner');
    expect(result.summary).toBe('Final synthesized answer.');
  });

  it('uses fallback team when meta-orchestrator returns no valid plan', async () => {
    // Meta-orchestrator gives no team block
    const delegatePlan = '```delegate\n{"plan": [{"agentName": "Planner", "subTask": "Plan it"}, {"agentName": "Executor", "subTask": "Execute it"}]}\n```';

    mockSendChat
      .mockResolvedValueOnce({ message: 'I cannot decide on a team.', model: 'llama2' })
      .mockResolvedValueOnce({ message: delegatePlan, model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Planner done.', model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Executor done.', model: 'llama2' })
      .mockResolvedValueOnce({ message: 'Synthesized.', model: 'llama2' });

    const result = await runAutoOrchestratedPipeline('task', BASE_CONFIG);
    // Fallback team has Planner + Executor
    expect(result.autoTeam).toHaveLength(2);
    expect(result.autoTeam[0].name).toBe('Planner');
  });

  it('returns error when meta-orchestrator throws', async () => {
    mockSendChat.mockRejectedValueOnce(new Error('Meta failure'));
    const result = await runAutoOrchestratedPipeline('task', BASE_CONFIG);
    // runCliAgent catches the error internally; the fallback 2-agent team is used
    expect(result.success).toBe(false);
    expect(result.autoTeam).toHaveLength(2); // fallback team
  });

  it('emits pipeline_start and agent_start events', async () => {
    const teamBlock = '```team\n{"agents": [{"name": "Planner", "role": "planner", "specialty": "s"}]}\n```';
    const delegatePlan = '```delegate\n{"plan": [{"agentName": "Planner", "subTask": "do it"}]}\n```';

    mockSendChat
      .mockResolvedValueOnce({ message: teamBlock, model: 'llama2' })
      .mockResolvedValueOnce({ message: delegatePlan, model: 'llama2' })
      .mockResolvedValueOnce({ message: 'done', model: 'llama2' })
      .mockResolvedValueOnce({ message: 'done', model: 'llama2' });

    const events: string[] = [];
    await runAutoOrchestratedPipeline('task', BASE_CONFIG, (e) => events.push(e.type));
    expect(events).toContain('pipeline_start');
    expect(events).toContain('agent_start');
    expect(events).toContain('pipeline_done');
  });
});
