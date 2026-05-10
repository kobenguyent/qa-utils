import { Router } from 'express';
import { z } from 'zod';

export const graphqlRouter = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────

const HeadersSchema = z.record(z.string()).optional().default({});

const QuerySchema = z.object({
  endpoint: z.string().url('endpoint must be a valid URL'),
  query: z.string().min(1, 'query is required'),
  variables: z.record(z.unknown()).optional().default({}),
  operationName: z.string().optional(),
  headers: HeadersSchema,
  timeout: z.number().int().min(100).max(60_000).optional().default(30_000),
});

const IntrospectSchema = z.object({
  endpoint: z.string().url('endpoint must be a valid URL'),
  headers: HeadersSchema,
  timeout: z.number().int().min(100).max(60_000).optional().default(30_000),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const INTROSPECTION_QUERY = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind name description
      fields(includeDeprecated: true) {
        name description
        args { name description type { kind name ofType { kind name ofType { kind name ofType { kind name } } } } defaultValue }
        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
      }
      inputFields { name description type { kind name ofType { kind name ofType { kind name ofType { kind name } } } } defaultValue }
      enumValues(includeDeprecated: true) { name description }
    }
  }
}`.trim();

function unwrapType(t: unknown): string {
  if (!t || typeof t !== 'object') return 'Unknown';
  const o = t as { kind?: string; name?: string | null; ofType?: unknown };
  if (o.kind === 'NON_NULL') return `${unwrapType(o.ofType)}!`;
  if (o.kind === 'LIST') return `[${unwrapType(o.ofType)}]`;
  return o.name ?? 'Unknown';
}

async function proxyGraphQL(
  endpoint: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
  timeout: number,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json: unknown;
    try { json = JSON.parse(text); } catch { json = null; }
    return { ok: res.ok, status: res.status, statusText: res.statusText, json, raw: text };
  } finally {
    clearTimeout(timer);
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/graphql/query:
 *   post:
 *     tags: [GraphQL]
 *     summary: Execute a GraphQL query or mutation
 *     description: >
 *       Proxies a GraphQL request to any endpoint. Supports queries, mutations,
 *       variables, operation names, and custom HTTP headers (e.g. Authorization).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint, query]
 *             properties:
 *               endpoint:
 *                 type: string
 *                 format: uri
 *                 example: https://countries.trevorblades.com/graphql
 *               query:
 *                 type: string
 *                 example: "{ countries { code name emoji } }"
 *               variables:
 *                 type: object
 *                 additionalProperties: true
 *                 example: { "id": 1 }
 *               operationName:
 *                 type: string
 *                 description: Operation name for multi-operation documents
 *               headers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example: { "Authorization": "Bearer <token>" }
 *               timeout:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 60000
 *                 default: 30000
 *                 description: Request timeout in milliseconds
 *     responses:
 *       200:
 *         description: GraphQL response (data and/or errors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   description: GraphQL response data
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message: { type: string }
 *                       locations:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             line: { type: integer }
 *                             column: { type: integer }
 *                       path:
 *                         type: array
 *                         items:
 *                           oneOf:
 *                             - type: string
 *                             - type: integer
 *                 extensions:
 *                   type: object
 *                   nullable: true
 *                 status:
 *                   type: integer
 *                   description: HTTP status code from the upstream GraphQL server
 *                 duration:
 *                   type: integer
 *                   description: Round-trip duration in milliseconds
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       502:
 *         description: Upstream GraphQL endpoint unreachable or returned non-JSON
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
graphqlRouter.post('/query', async (req, res) => {
  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { endpoint, query, variables, operationName, headers, timeout } = parsed.data;

  const body: Record<string, unknown> = { query };
  if (variables && Object.keys(variables).length > 0) body.variables = variables;
  if (operationName) body.operationName = operationName;

  const start = Date.now();
  try {
    const upstream = await proxyGraphQL(endpoint, body, headers as Record<string, string>, timeout);
    const duration = Date.now() - start;

    if (!upstream.json) {
      res.status(502).json({ error: `Upstream returned non-JSON response: ${upstream.raw.slice(0, 200)}` });
      return;
    }

    const gql = upstream.json as { data?: unknown; errors?: unknown[]; extensions?: unknown };
    res.json({ data: gql.data ?? null, errors: gql.errors, extensions: gql.extensions, status: upstream.status, duration });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: msg.includes('abort') ? 'Request timed out' : msg });
  }
});

/**
 * @openapi
 * /api/graphql/introspect:
 *   post:
 *     tags: [GraphQL]
 *     summary: Introspect a GraphQL schema
 *     description: >
 *       Sends the standard GraphQL introspection query to the target endpoint
 *       and returns a parsed, human-readable schema summary including all types,
 *       fields, arguments, and enum values.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint]
 *             properties:
 *               endpoint:
 *                 type: string
 *                 format: uri
 *                 example: https://countries.trevorblades.com/graphql
 *               headers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *               timeout:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 60000
 *                 default: 30000
 *     responses:
 *       200:
 *         description: Parsed schema info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queryType:
 *                   type: string
 *                   nullable: true
 *                   example: Query
 *                 mutationType:
 *                   type: string
 *                   nullable: true
 *                 subscriptionType:
 *                   type: string
 *                   nullable: true
 *                 typeCount:
 *                   type: integer
 *                 types:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name: { type: string }
 *                       kind: { type: string }
 *                       description: { type: string, nullable: true }
 *                       fields:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name: { type: string }
 *                             type: { type: string }
 *                             description: { type: string, nullable: true }
 *                             args:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   name: { type: string }
 *                                   type: { type: string }
 *                                   defaultValue: { type: string, nullable: true }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       502:
 *         description: Introspection failed or endpoint unreachable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
graphqlRouter.post('/introspect', async (req, res) => {
  const parsed = IntrospectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { endpoint, headers, timeout } = parsed.data;

  try {
    const upstream = await proxyGraphQL(
      endpoint,
      { query: INTROSPECTION_QUERY },
      headers as Record<string, string>,
      timeout,
    );

    if (!upstream.json) {
      res.status(502).json({ error: `Upstream returned non-JSON response: ${upstream.raw.slice(0, 200)}` });
      return;
    }

    const raw = upstream.json as { data?: { __schema?: unknown }; errors?: { message: string }[] };
    if (raw.errors?.length) {
      res.status(502).json({ error: raw.errors.map((e) => e.message).join('; ') });
      return;
    }

    const schema = raw.data?.__schema as {
      queryType?: { name: string } | null;
      mutationType?: { name: string } | null;
      subscriptionType?: { name: string } | null;
      types?: unknown[];
    } | undefined;

    if (!schema) {
      res.status(502).json({ error: 'Introspection response did not contain __schema' });
      return;
    }

    const types = ((schema.types ?? []) as unknown[])
      .map((t) => {
        const type = t as { kind: string; name: string; description?: string; fields?: unknown[]; inputFields?: unknown[]; enumValues?: unknown[] };
        return {
          name: type.name,
          kind: type.kind,
          description: type.description ?? null,
          fields: (type.fields ?? []).map((f) => {
            const field = f as { name: string; description?: string; type: unknown; args?: unknown[] };
            return {
              name: field.name,
              type: unwrapType(field.type),
              description: field.description ?? null,
              args: (field.args ?? []).map((a) => {
                const arg = a as { name: string; type: unknown; description?: string; defaultValue?: string | null };
                return { name: arg.name, type: unwrapType(arg.type), description: arg.description ?? null, defaultValue: arg.defaultValue ?? null };
              }),
            };
          }),
          inputFields: (type.inputFields ?? []).map((f) => {
            const field = f as { name: string; type: unknown; description?: string };
            return { name: field.name, type: unwrapType(field.type), description: field.description ?? null };
          }),
          enumValues: (type.enumValues ?? []).map((e) => {
            const ev = e as { name: string; description?: string };
            return { name: ev.name, description: ev.description ?? null };
          }),
        };
      })
      .filter((t) => !t.name.startsWith('__'));

    res.json({
      queryType: schema.queryType?.name ?? null,
      mutationType: schema.mutationType?.name ?? null,
      subscriptionType: schema.subscriptionType?.name ?? null,
      typeCount: types.length,
      types,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: msg.includes('abort') ? 'Request timed out' : msg });
  }
});

/**
 * @openapi
 * /api/graphql/curl:
 *   post:
 *     tags: [GraphQL]
 *     summary: Generate a curl command for a GraphQL request
 *     description: >
 *       Returns the equivalent curl command string for the given GraphQL request,
 *       without sending any request to the endpoint. Useful for sharing or debugging.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint, query]
 *             properties:
 *               endpoint:
 *                 type: string
 *                 format: uri
 *                 example: https://countries.trevorblades.com/graphql
 *               query:
 *                 type: string
 *                 example: "{ countries { code name } }"
 *               variables:
 *                 type: object
 *                 additionalProperties: true
 *               operationName:
 *                 type: string
 *               headers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *     responses:
 *       200:
 *         description: Generated curl command
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 curl:
 *                   type: string
 *                   description: The equivalent curl command
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
graphqlRouter.post('/curl', (req, res) => {
  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { endpoint, query, variables, operationName, headers } = parsed.data;

  const body: Record<string, unknown> = { query };
  if (variables && Object.keys(variables).length > 0) body.variables = variables;
  if (operationName) body.operationName = operationName;

  const allHeaders = { 'Content-Type': 'application/json', ...headers };
  const headerArgs = Object.entries(allHeaders)
    .map(([k, v]) => `  -H '${k}: ${v}'`)
    .join(' \\\n');

  const curl = `curl -X POST '${endpoint}' \\\n${headerArgs} \\\n  -d '${JSON.stringify(body, null, 2)}'`;
  res.json({ curl });
});
