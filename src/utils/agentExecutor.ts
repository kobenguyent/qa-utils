/**
 * Agent Executor — Autonomous AI Agent for QA Utils
 *
 * This module turns qa-utils into an AI agent that can autonomously plan and
 * execute multi-step tasks using available tools. Given a task description,
 * the agent:
 *   1. Sends the task + available tool descriptions to the AI provider
 *   2. Parses the AI response for tool calls (JSON action blocks)
 *   3. Executes tools and feeds results back to the AI
 *   4. Repeats until the task is complete or max iterations reached
 */

import { ToolRegistry, ToolInvocationResult } from './toolRegistry';
import { sendChatMessage, ChatMessage, ChatConfig } from './aiChatClient';
import { registerDefaultTools } from './defaultTools';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'answer' | 'error';
  content: string;
  toolName?: string;
  toolParams?: Record<string, unknown>;
  toolResult?: ToolInvocationResult;
  timestamp: number;
}

export interface AgentConfig {
  provider: 'ollama' | 'openai' | 'anthropic' | 'google' | 'azure-openai';
  endpoint?: string;
  model?: string;
  apiKey?: string;
  maxIterations?: number;
  temperature?: number;
}

export interface AgentRunResult {
  success: boolean;
  answer: string;
  steps: AgentStep[];
  iterationCount: number;
  error?: string;
}

// Callback fired after each step so the UI can render incrementally
export type OnStepCallback = (step: AgentStep) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Build a concise description of executable tools for the system prompt. */
export function buildToolDescriptions(): string {
  if (!ToolRegistry.isInitialized()) {
    registerDefaultTools();
  }

  const tools = ToolRegistry.getAll().filter(t => !!t.execute);
  return tools.map(t => {
    const params = t.parameters
      ? t.parameters.map(p => `  - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`).join('\n')
      : '  (no parameters)';
    return `### ${t.id}\n${t.description}\nParameters:\n${params}`;
  }).join('\n\n');
}

function getAgentSystemPrompt(toolDescriptions: string): string {
  return `You are QA Utils Agent — an autonomous AI agent with access to developer & QA tools.

Your job is to accomplish the user's task by reasoning step-by-step and calling tools when needed.

## Available Tools
${toolDescriptions}

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
6. You may call multiple tools across iterations but only ONE tool per response.
7. Keep responses concise and focused on the task.`;
}

// ---------------------------------------------------------------------------
// Action block parser
// ---------------------------------------------------------------------------

interface ParsedAction {
  tool: string;
  params: Record<string, unknown>;
}

/**
 * Extract an action block from the AI response.
 * Looks for ```action ... ``` fenced blocks containing JSON.
 */
export function parseActionBlock(text: string): ParsedAction | null {
  // Match fenced code block with "action" language tag
  const fencedMatch = text.match(/```action\s*\n?([\s\S]*?)```/);
  if (fencedMatch) {
    try {
      const parsed = JSON.parse(fencedMatch[1].trim());
      if (parsed && typeof parsed.tool === 'string') {
        return { tool: parsed.tool, params: parsed.params ?? {} };
      }
    } catch {
      // fall through
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Agent Executor
// ---------------------------------------------------------------------------

export async function runAgent(
  task: string,
  config: AgentConfig,
  onStep?: OnStepCallback,
): Promise<AgentRunResult> {
  const maxIter = config.maxIterations ?? 10;
  const steps: AgentStep[] = [];

  // Ensure tools are registered
  if (!ToolRegistry.isInitialized()) {
    registerDefaultTools();
  }

  const toolDescriptions = buildToolDescriptions();
  const systemPrompt = getAgentSystemPrompt(toolDescriptions);

  // Conversation messages for the AI
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: task },
  ];

  const chatConfig: ChatConfig = {
    provider: config.provider,
    endpoint: config.endpoint,
    model: config.model,
    apiKey: config.apiKey,
    temperature: config.temperature ?? 0.3,
    maxTokens: 2048,
  };

  for (let i = 0; i < maxIter; i++) {
    // --- Ask the AI ---
    let aiText: string;
    try {
      const response = await sendChatMessage(messages, chatConfig);
      aiText = response.message;
    } catch (err) {
      const errorStep: AgentStep = {
        id: uid(),
        type: 'error',
        content: `AI request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      steps.push(errorStep);
      onStep?.(errorStep);
      return { success: false, answer: '', steps, iterationCount: i + 1, error: errorStep.content };
    }

    // --- Check for an action block ---
    const action = parseActionBlock(aiText);

    if (!action) {
      // No tool call — treat as final answer
      const answerStep: AgentStep = {
        id: uid(),
        type: 'answer',
        content: aiText,
        timestamp: Date.now(),
      };
      steps.push(answerStep);
      onStep?.(answerStep);
      messages.push({ role: 'assistant', content: aiText });
      return { success: true, answer: aiText, steps, iterationCount: i + 1 };
    }

    // --- There's a tool call ---
    // Record the thinking portion (text before the action block)
    const thinkingText = aiText.replace(/```action[\s\S]*?```/, '').trim();
    if (thinkingText) {
      const thinkStep: AgentStep = {
        id: uid(),
        type: 'thinking',
        content: thinkingText,
        timestamp: Date.now(),
      };
      steps.push(thinkStep);
      onStep?.(thinkStep);
    }

    const callStep: AgentStep = {
      id: uid(),
      type: 'tool_call',
      content: `Calling **${action.tool}**`,
      toolName: action.tool,
      toolParams: action.params,
      timestamp: Date.now(),
    };
    steps.push(callStep);
    onStep?.(callStep);

    // Execute the tool
    const result = await ToolRegistry.execute(action.tool, action.params);

    const resultStep: AgentStep = {
      id: uid(),
      type: 'tool_result',
      content: result.success
        ? (result.message || JSON.stringify(result.data, null, 2))
        : `Error: ${result.error}`,
      toolName: action.tool,
      toolResult: result,
      timestamp: Date.now(),
    };
    steps.push(resultStep);
    onStep?.(resultStep);

    // Feed back to AI
    messages.push({ role: 'assistant', content: aiText });
    messages.push({
      role: 'user',
      content: `Tool "${action.tool}" returned:\n${resultStep.content}\n\nContinue with the task. If done, provide your final answer.`,
    });
  }

  // Ran out of iterations
  const finalStep: AgentStep = {
    id: uid(),
    type: 'error',
    content: 'Reached maximum iterations without completing the task.',
    timestamp: Date.now(),
  };
  steps.push(finalStep);
  onStep?.(finalStep);

  const lastAnswer = steps.filter(s => s.type === 'answer').pop()?.content ?? '';
  return {
    success: false,
    answer: lastAnswer,
    steps,
    iterationCount: maxIter,
    error: 'Max iterations reached',
  };
}
