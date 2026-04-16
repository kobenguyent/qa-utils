import { Router } from 'express';
import { z } from 'zod';
import {
  runApiAgent,
  runSequentialApiPipeline,
  runOrchestratedApiPipeline,
  getAvailableTools,
  type AgentConfig,
  type AIProvider,
  type PipelineConfig,
  type PipelineAgentConfig,
} from '../lib/agentExecutor';

export const agentsRouter = Router();

const ProviderEnum = z.enum(['ollama', 'openai', 'anthropic', 'google', 'azure-openai']);

const RunSchema = z.object({
  task: z.string().min(1).max(2000),
  provider: ProviderEnum,
  apiKey: z.string().optional(),
  endpoint: z.string().optional(),
  model: z.string().optional(),
  maxIterations: z.number().int().min(1).max(25).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

const AgentConfigSchema = z.object({
  profileId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  specialty: z.string().optional(),
  provider: ProviderEnum,
  apiKey: z.string().optional(),
  endpoint: z.string().optional(),
  model: z.string().optional(),
  maxIterations: z.number().int().min(1).max(25).optional(),
  temperature: z.number().min(0).max(1).optional(),
  order: z.number().int().min(0).optional(),
});

const OrchestratorSchema = z.object({
  name: z.string().min(1),
  role: z.string().default('orchestrator'),
  provider: ProviderEnum,
  apiKey: z.string().optional(),
  endpoint: z.string().optional(),
  model: z.string().optional(),
  maxIterations: z.number().int().min(1).max(25).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

const OrchestrateSchema = z.object({
  task: z.string().min(1).max(4000),
  mode: z.enum(['sequential', 'orchestrated']),
  agents: z.array(AgentConfigSchema).min(1),
  orchestrator: OrchestratorSchema.optional(),
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
 *     summary: Run a single autonomous agent task
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
 *               endpoint:
 *                 type: string
 *               model:
 *                 type: string
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
    apiKey, endpoint, model,
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

/**
 * @openapi
 * /api/agents/orchestrate:
 *   post:
 *     tags: [Agents]
 *     summary: Run a multi-agent orchestration pipeline
 *     description: >
 *       Coordinates multiple specialized agents to solve a complex task.
 *       In **sequential** mode, each agent's output becomes the next agent's context (chain).
 *       In **orchestrated** mode, a designated orchestrator agent breaks the task into
 *       sub-tasks, delegates them to worker agents in parallel, then synthesizes the results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task, mode, agents]
 *             properties:
 *               task:
 *                 type: string
 *                 description: The complex task to solve
 *                 example: Analyse this codebase for security issues and write a remediation plan
 *               mode:
 *                 type: string
 *                 enum: [sequential, orchestrated]
 *                 description: sequential = chain; orchestrated = hub-and-spoke with delegation
 *               agents:
 *                 type: array
 *                 description: Worker agents (with their AI configs)
 *                 items:
 *                   type: object
 *                   required: [profileId, name, role, provider]
 *                   properties:
 *                     profileId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     specialty:
 *                       type: string
 *                     provider:
 *                       type: string
 *                       enum: [ollama, openai, anthropic, google, azure-openai]
 *                     model:
 *                       type: string
 *                     order:
 *                       type: integer
 *                       description: Execution order for sequential mode
 *               orchestrator:
 *                 type: object
 *                 description: Required for orchestrated mode
 *                 properties:
 *                   name:
 *                     type: string
 *                   provider:
 *                     type: string
 *                   model:
 *                     type: string
 *     responses:
 *       200:
 *         description: Pipeline run result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 summary:
 *                   type: string
 *                 agentResults:
 *                   type: array
 *                 totalDuration:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
agentsRouter.post('/orchestrate', async (req, res) => {
  const parsed = OrchestrateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { task, mode, agents, orchestrator } = parsed.data;

  if (mode === 'orchestrated' && !orchestrator) {
    res.status(400).json({ error: 'orchestrator is required when mode is "orchestrated"' });
    return;
  }

  const pipelineConfig: PipelineConfig = {
    mode,
    agents: agents as PipelineAgentConfig[],
    ...(orchestrator ? { orchestrator: { ...orchestrator, role: orchestrator.role ?? 'orchestrator', provider: orchestrator.provider as AIProvider } } : {}),
  };

  try {
    const result = mode === 'orchestrated'
      ? await runOrchestratedApiPipeline(task, pipelineConfig)
      : await runSequentialApiPipeline(task, pipelineConfig);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
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
