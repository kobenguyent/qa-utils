/**
 * API Agent Executor — Node.js agent for the REST API
 *
 * Implements the same observe-think-act loop as the browser agent executor,
 * but using Node.js crypto and fetch (Node 18+) for AI provider calls.
 */

import { randomUUID, createHash } from 'crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'google' | 'azure-openai' | 'cloudflare-ai';

export interface AgentConfig {
  provider: AIProvider;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  maxIterations?: number;
  temperature?: number;
  cloudflareAccountId?: string; // For Cloudflare Workers AI
}

export interface AgentStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'answer' | 'error';
  content: string;
  toolName?: string;
  toolParams?: Record<string, unknown>;
  timestamp: number;
}

export interface AgentRunResult {
  success: boolean;
  answer: string;
  steps: AgentStep[];
  iterationCount: number;
  error?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ParsedAction {
  tool: string;
  params: Record<string, unknown>;
}

// ── Built-in tools ────────────────────────────────────────────────────────────

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
  'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit.',
];

type ToolExecutor = (params: Record<string, unknown>) => Promise<string>;

const AGENT_TOOLS: Record<string, { description: string; params: string; execute: ToolExecutor }> = {
  generate_uuid: {
    description: 'Generate one or more UUID v4 values.',
    params: 'quantity (number, optional, default 1)',
    execute: async (p) => {
      const qty = Math.max(1, Math.min(Number(p.quantity) || 1, 20));
      return Array.from({ length: qty }, () => randomUUID()).join('\n');
    },
  },
  base64_encode: {
    description: 'Encode a string to Base64.',
    params: 'value (string, required)',
    execute: async (p) => Buffer.from(String(p.value ?? ''), 'utf-8').toString('base64'),
  },
  base64_decode: {
    description: 'Decode a Base64 string.',
    params: 'value (string, required)',
    execute: async (p) => Buffer.from(String(p.value ?? ''), 'base64').toString('utf-8'),
  },
  hash_text: {
    description: 'Hash a string using SHA-256 (or another algorithm).',
    params: 'value (string, required), algorithm (string, optional: sha256|sha512|md5, default sha256)',
    execute: async (p) => {
      const val = String(p.value ?? '');
      const algo = String(p.algorithm ?? 'sha256');
      return createHash(algo).update(val).digest('hex');
    },
  },
  generate_lorem: {
    description: 'Generate lorem ipsum placeholder text.',
    params: 'paragraphs (number, optional, default 1)',
    execute: async (p) => {
      const n = Math.max(1, Math.min(Number(p.paragraphs) || 1, 10));
      return Array.from({ length: n }, (_, i) => LOREM_PARAGRAPHS[i % LOREM_PARAGRAPHS.length]).join('\n\n');
    },
  },
  current_timestamp: {
    description: 'Get the current Unix timestamp and ISO date string.',
    params: '(none)',
    execute: async () => {
      const now = Date.now();
      return `Unix: ${Math.floor(now / 1000)}\nISO: ${new Date(now).toISOString()}`;
    },
  },
  generate_password: {
    description: 'Generate a random secure password.',
    params: 'length (number, optional, default 16), includeSymbols (boolean, optional, default true)',
    execute: async (p) => {
      const len = Math.max(8, Math.min(Number(p.length) || 16, 128));
      const syms = p.includeSymbols !== false;
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        + (syms ? '!@#$%^&*()-_=+[]{}' : '');
      return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    },
  },
  count_characters: {
    description: 'Count characters and words in a string.',
    params: 'value (string, required)',
    execute: async (p) => {
      const val = String(p.value ?? '');
      const words = val.trim() === '' ? 0 : val.trim().split(/\s+/).length;
      return `Characters: ${val.length}\nWords: ${words}`;
    },
  },
};

export function getAvailableTools() {
  return Object.entries(AGENT_TOOLS).map(([id, t]) => ({
    id,
    description: t.description,
    params: t.params,
  }));
}

// ── Action block parser ────────────────────────────────────────────────────────

export function parseActionBlock(text: string): ParsedAction | null {
  const match = text.match(/```action\s*\n?([\s\S]*?)```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim()) as { tool?: unknown; params?: unknown };
      if (parsed && typeof parsed.tool === 'string') {
        return { tool: parsed.tool, params: (parsed.params as Record<string, unknown>) ?? {} };
      }
    } catch {
      // fall through
    }
  }
  return null;
}

// ── AI provider calls (Node 18+ native fetch) ─────────────────────────────────

const TIMEOUT_MS = 60_000;

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-3.5-turbo',
  anthropic: 'claude-3-sonnet-20240229',
  google: 'gemini-1.5-flash',
  'azure-openai': 'gpt-35-turbo',
  ollama: 'llama2',
  'cloudflare-ai': '@cf/meta/llama-3-8b-instruct',
};

/** Rough token estimator for Cloudflare free-tier budget enforcement */
function estimateCfTokens(text: string): number {
  const words = text.split(/\s+/).length;
  const chars = text.length;
  return Math.ceil((words * 1.3 + chars / 4) / 2);
}

/** Trim messages to fit Cloudflare Workers AI free-tier context window (~5632 input tokens) */
function trimForCloudflare(messages: ChatMessage[]): ChatMessage[] {
  const budget = 5632; // 6144 context - 512 max_tokens
  const system = messages.filter(m => m.role === 'system');
  const conv = messages.filter(m => m.role !== 'system');
  const sysTok = system.reduce((s, m) => s + estimateCfTokens(m.content), 0);
  const remaining = budget - sysTok;
  const kept: ChatMessage[] = [];
  let used = 0;
  for (let i = conv.length - 1; i >= 0; i--) {
    const t = estimateCfTokens(conv[i].content);
    if (used + t > remaining && kept.length > 0) break;
    kept.unshift(conv[i]);
    used += t;
  }
  return [...system, ...kept];
}

async function callAI(messages: ChatMessage[], config: AgentConfig): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    switch (config.provider) {
      case 'openai': {
        const model = config.model || DEFAULT_MODELS.openai;
        const endpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey || ''}` },
          body: JSON.stringify({ model, messages, temperature: config.temperature ?? 0.3, max_tokens: 2048 }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(err.error?.message ?? `OpenAI error ${res.status}`);
        }
        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        return data.choices[0].message.content;
      }

      case 'anthropic': {
        const model = config.model || DEFAULT_MODELS.anthropic;
        const systemMsg = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
        const convMsgs = messages.filter(m => m.role !== 'system');
        const res = await fetch(config.endpoint || 'https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey || '', 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model, messages: convMsgs, max_tokens: 4096, temperature: config.temperature ?? 0.3, ...(systemMsg ? { system: systemMsg } : {}) }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(err.error?.message ?? `Anthropic error ${res.status}`);
        }
        const data = await res.json() as { content: Array<{ text: string }> };
        return data.content[0].text;
      }

      case 'google': {
        const model = config.model || DEFAULT_MODELS.google;
        const endpoint = config.endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const contents = messages.filter(m => m.role !== 'system')
          .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
        const sysInstr = messages.find(m => m.role === 'system')?.content;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey || '' },
          body: JSON.stringify({ contents, ...(sysInstr ? { systemInstruction: { parts: [{ text: sysInstr }] } } : {}), generationConfig: { temperature: config.temperature ?? 0.3, maxOutputTokens: 2048 } }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(err.error?.message ?? `Google error ${res.status}`);
        }
        const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
        return data.candidates[0].content.parts[0].text;
      }

      case 'azure-openai': {
        const model = config.model || DEFAULT_MODELS['azure-openai'];
        if (!config.endpoint) throw new Error('Endpoint required for Azure OpenAI');
        const url = `${config.endpoint}/openai/deployments/${model}/chat/completions?api-version=2024-02-15-preview`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': config.apiKey || '' },
          body: JSON.stringify({ messages, temperature: config.temperature ?? 0.3, max_tokens: 2048 }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(err.error?.message ?? `Azure OpenAI error ${res.status}`);
        }
        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        return data.choices[0].message.content;
      }

      case 'ollama': {
        const model = config.model || DEFAULT_MODELS.ollama;
        const endpoint = config.endpoint || 'http://localhost:11434';
        const res = await fetch(`${endpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages, stream: false, options: { temperature: config.temperature ?? 0.3 } }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? `Ollama error ${res.status}`);
        }
        const data = await res.json() as { message: { content: string } };
        return data.message.content;
      }

      case 'cloudflare-ai': {
        const accountId = config.cloudflareAccountId;
        if (!accountId) throw new Error('Cloudflare Account ID is required');
        const model = config.model || DEFAULT_MODELS['cloudflare-ai'];
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
        // Trim messages to fit the free-tier context window (6144 input tokens)
        const trimmedMessages = trimForCloudflare(messages);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey || ''}` },
          body: JSON.stringify({ messages: trimmedMessages, max_tokens: 512 }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { errors?: Array<{ message?: string }> };
          throw new Error(err.errors?.[0]?.message ?? `Cloudflare Workers AI error ${res.status}`);
        }
        const data = await res.json() as { result?: { response?: string }; success?: boolean; errors?: Array<{ message?: string }> };
        if (!data.success || !data.result?.response) {
          throw new Error(data.errors?.[0]?.message ?? 'No response from Cloudflare Workers AI');
        }
        return data.result.response;
      }

      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const toolList = Object.entries(AGENT_TOOLS).map(([id, t]) =>
    `### ${id}\n${t.description}\nParameters: ${t.params}`
  ).join('\n\n');

  return `You are QA Utils Agent — an autonomous AI agent with access to developer & QA tools.

Your job is to accomplish the user's task by reasoning step-by-step and calling tools when needed.

## Available Tools
${toolList}

## How to call a tool
When you need to use a tool, respond with a JSON action block on its own line:

\`\`\`action
{"tool": "<tool_id>", "params": { ... }}
\`\`\`

## Rules
1. Think step-by-step. Explain your reasoning briefly before each action.
2. After receiving a tool result, decide if you need another tool or can answer.
3. When the task is complete, give your **final answer** in plain text (no action block).
4. If a tool fails, try an alternative approach or explain what went wrong.
5. Do NOT invent tool results — only use the results returned to you.
6. You may call multiple tools across iterations but only ONE tool per response.`;
}

// ── Main agent runner ─────────────────────────────────────────────────────────

export async function runApiAgent(
  task: string,
  config: AgentConfig,
): Promise<AgentRunResult> {
  const maxIter = config.maxIterations ?? 10;
  const steps: AgentStep[] = [];
  const uid = () => randomUUID();

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: task },
  ];

  for (let i = 0; i < maxIter; i++) {
    let aiText: string;
    try {
      aiText = await callAI(messages, config);
    } catch (err) {
      const step: AgentStep = {
        id: uid(), type: 'error',
        content: `AI request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      steps.push(step);
      return { success: false, answer: '', steps, iterationCount: i + 1, error: step.content };
    }

    const action = parseActionBlock(aiText);

    if (!action) {
      const step: AgentStep = { id: uid(), type: 'answer', content: aiText, timestamp: Date.now() };
      steps.push(step);
      messages.push({ role: 'assistant', content: aiText });
      return { success: true, answer: aiText, steps, iterationCount: i + 1 };
    }

    const thinkText = aiText.replace(/```action[\s\S]*?```/, '').trim();
    if (thinkText) {
      steps.push({ id: uid(), type: 'thinking', content: thinkText, timestamp: Date.now() });
    }

    steps.push({
      id: uid(), type: 'tool_call',
      content: `Calling ${action.tool}`,
      toolName: action.tool,
      toolParams: action.params,
      timestamp: Date.now(),
    });

    const tool = AGENT_TOOLS[action.tool];
    let resultContent: string;
    if (!tool) {
      resultContent = `Error: Unknown tool "${action.tool}"`;
    } else {
      try {
        resultContent = await tool.execute(action.params);
      } catch (err) {
        resultContent = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }

    steps.push({ id: uid(), type: 'tool_result', content: resultContent, toolName: action.tool, timestamp: Date.now() });

    messages.push({ role: 'assistant', content: aiText });
    messages.push({
      role: 'user',
      content: `Tool "${action.tool}" returned:\n${resultContent}\n\nContinue with the task. If done, provide your final answer.`,
    });
  }

  const finalStep: AgentStep = {
    id: uid(), type: 'error',
    content: 'Reached maximum iterations without completing the task.',
    timestamp: Date.now(),
  };
  steps.push(finalStep);
  const lastAnswer = steps.filter(s => s.type === 'answer').pop()?.content ?? '';
  return { success: false, answer: lastAnswer, steps, iterationCount: maxIter, error: 'Max iterations reached' };
}

// ── Pipeline orchestration ────────────────────────────────────────────────────

export interface PipelineAgentConfig extends AgentConfig {
  profileId: string;
  name: string;
  role: string;
  specialty?: string;
  order?: number;
}

export interface PipelineConfig {
  mode: 'sequential' | 'orchestrated';
  orchestrator?: AgentConfig & { name: string; role: string };
  agents: PipelineAgentConfig[];
}

export interface PipelineAgentResult {
  profileId: string;
  agentName: string;
  role: string;
  input: string;
  output: string;
  success: boolean;
  duration: number;
}

export interface PipelineRunResult {
  success: boolean;
  summary: string;
  agentResults: PipelineAgentResult[];
  totalDuration: number;
  error?: string;
}

/** Parse a delegation plan block from an orchestrator response */
function parseDelegationPlan(text: string): Array<{ profileId: string; subTask: string }> | null {
  const match = text.match(/```delegate\s*\n?([\s\S]*?)```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim()) as { plan?: Array<{ profileId: string; subTask: string }> };
      if (parsed && Array.isArray(parsed.plan)) return parsed.plan;
    } catch {
      // fall through
    }
  }
  return null;
}

/** Sequential pipeline: each agent receives context from all previous agents */
export async function runSequentialApiPipeline(
  task: string,
  pipelineConfig: PipelineConfig,
): Promise<PipelineRunResult> {
  const ordered = [...pipelineConfig.agents].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const agentResults: PipelineAgentResult[] = [];
  let contextSoFar = '';
  const pipelineStart = Date.now();

  for (const agentCfg of ordered) {
    const input = contextSoFar
      ? `${task}\n\n---\n**Context from previous agents:**\n${contextSoFar}`
      : task;

    const start = Date.now();
    try {
      const result = await runApiAgent(input, agentCfg);
      const ar: PipelineAgentResult = {
        profileId: agentCfg.profileId, agentName: agentCfg.name, role: agentCfg.role,
        input, output: result.answer, success: result.success, duration: Date.now() - start,
      };
      agentResults.push(ar);
      if (result.answer) contextSoFar += `\n**${agentCfg.name} (${agentCfg.role}):**\n${result.answer}\n`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      agentResults.push({ profileId: agentCfg.profileId, agentName: agentCfg.name, role: agentCfg.role,
        input, output: `Error: ${msg}`, success: false, duration: Date.now() - start });
    }
  }

  const lastSuccess = [...agentResults].reverse().find(r => r.success);
  const summary = lastSuccess?.output ?? agentResults.map(r => `**${r.agentName}**: ${r.output}`).join('\n\n');
  return {
    success: agentResults.some(r => r.success),
    summary,
    agentResults,
    totalDuration: Date.now() - pipelineStart,
  };
}

/** Orchestrated pipeline: orchestrator delegates sub-tasks, workers execute, orchestrator synthesizes */
export async function runOrchestratedApiPipeline(
  task: string,
  pipelineConfig: PipelineConfig,
): Promise<PipelineRunResult> {
  const { orchestrator, agents } = pipelineConfig;
  if (!orchestrator) {
    return { success: false, summary: 'No orchestrator configured', agentResults: [], totalDuration: 0, error: 'No orchestrator' };
  }

  const pipelineStart = Date.now();
  const agentMap = new Map(agents.map(a => [a.profileId, a]));

  // Step 1: orchestrator produces delegation plan
  const workerDescriptions = agents.map(a =>
    `- profileId: ${a.profileId}\n  Name: ${a.name}\n  Role: ${a.role}\n  Specialty: ${a.specialty ?? a.role}`
  ).join('\n');

  const planningTask = `You are the Orchestrator. Your team:\n${workerDescriptions}\n\nTask: ${task}\n\nCreate a delegation plan:\n\`\`\`delegate\n{"plan": [{"profileId": "<id>", "subTask": "<task>"}]}\n\`\`\``;
  const planStart = Date.now();
  let planResult: PipelineAgentResult;
  let delegations: Array<{ profileId: string; subTask: string }> | null = null;

  try {
    const orcResult = await runApiAgent(planningTask, orchestrator);
    delegations = parseDelegationPlan(orcResult.answer);
    planResult = { profileId: 'orchestrator', agentName: orchestrator.name, role: 'orchestrator',
      input: planningTask, output: orcResult.answer, success: !!delegations, duration: Date.now() - planStart };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, summary: `Orchestrator failed: ${msg}`, agentResults: [], totalDuration: Date.now() - pipelineStart, error: msg };
  }

  if (!delegations || delegations.length === 0) {
    return { success: planResult.success, summary: planResult.output, agentResults: [planResult], totalDuration: Date.now() - pipelineStart };
  }

  // Step 2: execute worker sub-tasks in parallel
  const workerResults: PipelineAgentResult[] = await Promise.all(
    delegations.map(async (d) => {
      const agentCfg = agentMap.get(d.profileId);
      if (!agentCfg) return { profileId: d.profileId, agentName: 'Unknown', role: 'custom', input: d.subTask, output: 'Agent not found', success: false, duration: 0 };
      const start = Date.now();
      try {
        const result = await runApiAgent(d.subTask, agentCfg);
        return { profileId: agentCfg.profileId, agentName: agentCfg.name, role: agentCfg.role,
          input: d.subTask, output: result.answer, success: result.success, duration: Date.now() - start };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { profileId: agentCfg.profileId, agentName: agentCfg.name, role: agentCfg.role,
          input: d.subTask, output: `Error: ${msg}`, success: false, duration: Date.now() - start };
      }
    })
  );

  // Step 3: orchestrator synthesizes
  const workerOutputs = workerResults.map(r => `**${r.agentName} (${r.role}):**\n${r.output}`).join('\n\n---\n\n');
  const synthesisTask = `Your team completed their work:\n\n${workerOutputs}\n\n---\nSynthesize into a final answer for: ${task}`;
  const synthStart = Date.now();
  let synthResult: PipelineAgentResult;

  try {
    const result = await runApiAgent(synthesisTask, { ...orchestrator, maxIterations: 3 });
    synthResult = { profileId: 'orchestrator', agentName: `${orchestrator.name} (synthesis)`, role: 'synthesizer',
      input: synthesisTask, output: result.answer, success: result.success, duration: Date.now() - synthStart };
  } catch {
    synthResult = { profileId: 'orchestrator', agentName: `${orchestrator.name} (synthesis)`, role: 'synthesizer',
      input: synthesisTask, output: workerOutputs, success: false, duration: Date.now() - synthStart };
  }

  const allResults = [planResult, ...workerResults, synthResult];
  return {
    success: allResults.some(r => r.success),
    summary: synthResult.output,
    agentResults: allResults,
    totalDuration: Date.now() - pipelineStart,
  };
}
