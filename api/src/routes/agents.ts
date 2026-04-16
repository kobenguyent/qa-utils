import { Router } from 'express';
import { z } from 'zod';
import { runApiAgent, getAvailableTools, type AgentConfig, type AIProvider } from '../lib/agentExecutor';

export const agentsRouter = Router();

const RunSchema = z.object({
  task: z.string().min(1).max(2000),
  provider: z.enum(['ollama', 'openai', 'anthropic', 'google', 'azure-openai']),
  apiKey: z.string().optional(),
  endpoint: z.string().optional(),
  model: z.string().optional(),
  maxIterations: z.number().int().min(1).max(25).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

/**
 * @openapi
 * /api/agents/tools:
 *   get:
 *     tags: [Agents]
 *     summary: List all tools available to the agent
 *     responses:
 *       200:
 *         description: List of available agent tools
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tools:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       description:
 *                         type: string
 *                       params:
 *                         type: string
 *                 count:
 *                   type: integer
 */
agentsRouter.get('/tools', (_req, res) => {
  const tools = getAvailableTools();
  res.json({ tools, count: tools.length });
});

/**
 * @openapi
 * /api/agents/run:
 *   post:
 *     tags: [Agents]
 *     summary: Run an autonomous agent task
 *     description: >
 *       Runs the AI agent observe-think-act loop until the task is complete or
 *       maxIterations is reached. The agent can call built-in tools autonomously.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task, provider]
 *             properties:
 *               task:
 *                 type: string
 *                 description: Natural language task description
 *                 example: Generate a UUID and base64-encode it
 *               provider:
 *                 type: string
 *                 enum: [ollama, openai, anthropic, google, azure-openai]
 *               apiKey:
 *                 type: string
 *                 description: API key (required for cloud providers)
 *               endpoint:
 *                 type: string
 *                 description: Custom endpoint URL
 *               model:
 *                 type: string
 *                 description: Model name (uses provider default if omitted)
 *               maxIterations:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 25
 *                 default: 10
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.3
 *     responses:
 *       200:
 *         description: Agent run result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 answer:
 *                   type: string
 *                 iterationCount:
 *                   type: integer
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [thinking, tool_call, tool_result, answer, error]
 *                       content:
 *                         type: string
 *                       toolName:
 *                         type: string
 *                       timestamp:
 *                         type: integer
 *                 error:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
agentsRouter.post('/run', async (req, res) => {
  const parsed = RunSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { task, provider, apiKey, endpoint, model, maxIterations, temperature } = parsed.data;

  const config: AgentConfig = {
    provider: provider as AIProvider,
    apiKey,
    endpoint,
    model,
    maxIterations: maxIterations ?? 10,
    temperature: temperature ?? 0.3,
  };

  try {
    const result = await runApiAgent(task, config);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
