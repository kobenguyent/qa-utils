/**
 * qautils-cli — CLI Agent Executor
 *
 * Node.js port of the browser agent executor. Uses native crypto and the
 * existing aiClient for provider calls. Supports the same observe-think-act
 * loop as the web version.
 */

import { randomUUID, createHash } from 'crypto';
import { sendChat, type ChatMessage } from './aiClient.js';
import type { AIProviderConfig } from './aiConfig.js';

// ── Types ─────────────────────────────────────────────────────────────────────

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

export type OnStepCallback = (step: AgentStep) => void;

// ── Built-in tools ────────────────────────────────────────────────────────────

interface ToolDef {
  description: string;
  params: string;
  execute: (params: Record<string, unknown>) => Promise<string>;
}

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
  'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit.',
];

const CLI_TOOLS: Record<string, ToolDef> = {
  'generate_uuid': {
    description: 'Generate one or more UUID v4 values.',
    params: 'quantity (number, optional, default 1)',
    execute: async (params) => {
      const qty = Math.max(1, Math.min(Number(params.quantity) || 1, 20));
      return Array.from({ length: qty }, () => randomUUID()).join('\n');
    },
  },
  'base64_encode': {
    description: 'Encode a string to Base64.',
    params: 'value (string, required)',
    execute: async (params) => {
      const val = String(params.value ?? '');
      return Buffer.from(val, 'utf-8').toString('base64');
    },
  },
  'base64_decode': {
    description: 'Decode a Base64 string.',
    params: 'value (string, required)',
    execute: async (params) => {
      const val = String(params.value ?? '');
      return Buffer.from(val, 'base64').toString('utf-8');
    },
  },
  'hash_text': {
    description: 'Hash a string using SHA-256 (or another algorithm).',
    params: 'value (string, required), algorithm (string, optional: sha256|sha512|md5, default sha256)',
    execute: async (params) => {
      const val = String(params.value ?? '');
      const algo = String(params.algorithm ?? 'sha256');
      return createHash(algo).update(val).digest('hex');
    },
  },
  'generate_lorem': {
    description: 'Generate lorem ipsum placeholder text.',
    params: 'paragraphs (number, optional, default 1)',
    execute: async (params) => {
      const n = Math.max(1, Math.min(Number(params.paragraphs) || 1, 10));
      return Array.from({ length: n }, (_, i) => LOREM_PARAGRAPHS[i % LOREM_PARAGRAPHS.length]).join('\n\n');
    },
  },
  'current_timestamp': {
    description: 'Get the current Unix timestamp and ISO date string.',
    params: '(none)',
    execute: async () => {
      const now = Date.now();
      return `Unix: ${Math.floor(now / 1000)}\nISO: ${new Date(now).toISOString()}`;
    },
  },
  'generate_password': {
    description: 'Generate a random secure password.',
    params: 'length (number, optional, default 16), includeSymbols (boolean, optional, default true)',
    execute: async (params) => {
      const len = Math.max(8, Math.min(Number(params.length) || 16, 128));
      const useSymbols = params.includeSymbols !== false;
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        + (useSymbols ? '!@#$%^&*()-_=+[]{}' : '');
      return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    },
  },
  'count_characters': {
    description: 'Count characters and words in a string.',
    params: 'value (string, required)',
    execute: async (params) => {
      const val = String(params.value ?? '');
      const words = val.trim() === '' ? 0 : val.trim().split(/\s+/).length;
      return `Characters: ${val.length}\nWords: ${words}`;
    },
  },
};

// ── System prompt builder ──────────────────────────────────────────────────────

function buildToolDescriptions(): string {
  return Object.entries(CLI_TOOLS).map(([id, tool]) =>
    `### ${id}\n${tool.description}\nParameters: ${tool.params}`
  ).join('\n\n');
}

function getSystemPrompt(): string {
  return `You are QA Utils Agent — an autonomous AI agent with access to developer & QA tools.

Your job is to accomplish the user's task by reasoning step-by-step and calling tools when needed.

## Available Tools
${buildToolDescriptions()}

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

// ── Action block parser ────────────────────────────────────────────────────────

interface ParsedAction {
  tool: string;
  params: Record<string, unknown>;
}

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

// ── Agent runner ───────────────────────────────────────────────────────────────

export async function runCliAgent(
  task: string,
  config: AIProviderConfig & { maxIterations?: number; temperature?: number },
  onStep?: OnStepCallback,
): Promise<AgentRunResult> {
  const maxIter = config.maxIterations ?? 10;
  const steps: AgentStep[] = [];

  const messages: ChatMessage[] = [
    { role: 'system', content: getSystemPrompt() },
    { role: 'user', content: task },
  ];

  const uid = () => randomUUID();

  for (let i = 0; i < maxIter; i++) {
    let aiText: string;
    try {
      const resp = await sendChat(messages, { ...config, temperature: config.temperature ?? 0.3 });
      aiText = resp.message;
    } catch (err) {
      const step: AgentStep = {
        id: uid(), type: 'error',
        content: `AI request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      steps.push(step);
      onStep?.(step);
      return { success: false, answer: '', steps, iterationCount: i + 1, error: step.content };
    }

    const action = parseActionBlock(aiText);

    if (!action) {
      const step: AgentStep = { id: uid(), type: 'answer', content: aiText, timestamp: Date.now() };
      steps.push(step);
      onStep?.(step);
      messages.push({ role: 'assistant', content: aiText });
      return { success: true, answer: aiText, steps, iterationCount: i + 1 };
    }

    const thinkText = aiText.replace(/```action[\s\S]*?```/, '').trim();
    if (thinkText) {
      const step: AgentStep = { id: uid(), type: 'thinking', content: thinkText, timestamp: Date.now() };
      steps.push(step);
      onStep?.(step);
    }

    const callStep: AgentStep = {
      id: uid(), type: 'tool_call',
      content: `Calling ${action.tool}`,
      toolName: action.tool,
      toolParams: action.params,
      timestamp: Date.now(),
    };
    steps.push(callStep);
    onStep?.(callStep);

    // Execute tool
    const toolDef = CLI_TOOLS[action.tool];
    let resultContent: string;
    if (!toolDef) {
      resultContent = `Error: Unknown tool "${action.tool}"`;
    } else {
      try {
        resultContent = await toolDef.execute(action.params);
      } catch (err) {
        resultContent = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }

    const resultStep: AgentStep = {
      id: uid(), type: 'tool_result',
      content: resultContent,
      toolName: action.tool,
      timestamp: Date.now(),
    };
    steps.push(resultStep);
    onStep?.(resultStep);

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
  onStep?.(finalStep);

  const lastAnswer = steps.filter(s => s.type === 'answer').pop()?.content ?? '';
  return { success: false, answer: lastAnswer, steps, iterationCount: maxIter, error: 'Max iterations reached' };
}
