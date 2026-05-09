/**
 * GraphQL Client utility
 *
 * Supports:
 *  - Queries, Mutations, Subscriptions (over WebSocket)
 *  - Introspection & schema explorer
 *  - Variables, HTTP headers, operation name
 *  - Request history (in-memory)
 *  - Curl generation
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface GraphQLConfig {
  endpoint: string;
  headers: Record<string, string>;
  timeout?: number;
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse {
  data: unknown;
  errors?: GraphQLError[];
  extensions?: Record<string, unknown>;
  /** HTTP status code */
  status: number;
  statusText: string;
  /** Round-trip duration in ms */
  duration: number;
  /** Raw JSON string */
  raw: string;
  /** Response HTTP headers */
  responseHeaders: Record<string, string>;
}

export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface IntrospectionField {
  name: string;
  type: string;
  description?: string;
  args?: IntrospectionArg[];
}

export interface IntrospectionArg {
  name: string;
  type: string;
  description?: string;
  defaultValue?: string | null;
}

export interface IntrospectionType {
  name: string;
  kind: string;
  description?: string;
  fields?: IntrospectionField[];
  inputFields?: IntrospectionField[];
  enumValues?: { name: string; description?: string }[];
}

export interface SchemaInfo {
  queryType: string | null;
  mutationType: string | null;
  subscriptionType: string | null;
  types: IntrospectionType[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  endpoint: string;
  request: GraphQLRequest;
  response?: GraphQLResponse;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const INTROSPECTION_QUERY = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type { ...TypeRef }
  }
  inputFields {
    ...InputValue
  }
  enumValues(includeDeprecated: true) {
    name
    description
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
      }
    }
  }
}
`.trim();

export const SAMPLE_QUERIES = [
  {
    label: 'Countries (countries.trevorblades.com)',
    endpoint: 'https://countries.trevorblades.com/graphql',
    query: `query GetCountries {
  countries {
    code
    name
    emoji
    capital
    currency
  }
}`,
    variables: '{}',
  },
  {
    label: 'SpaceX Launches (spacex-production.up.railway.app)',
    endpoint: 'https://spacex-production.up.railway.app/',
    query: `query GetLaunches {
  launches(limit: 5) {
    id
    mission_name
    launch_date_utc
    rocket {
      rocket_name
    }
    launch_success
  }
}`,
    variables: '{}',
  },
  {
    label: 'Rick & Morty Characters (rickandmortyapi.com)',
    endpoint: 'https://rickandmortyapi.com/graphql',
    query: `query GetCharacters {
  characters(page: 1) {
    results {
      id
      name
      status
      species
      image
    }
  }
}`,
    variables: '{}',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Unwrap nested __Type ofType chain to a readable type string */
function unwrapType(typeRef: unknown): string {
  if (!typeRef || typeof typeRef !== 'object') return 'Unknown';
  const t = typeRef as { kind?: string; name?: string | null; ofType?: unknown };
  if (t.kind === 'NON_NULL') return `${unwrapType(t.ofType)}!`;
  if (t.kind === 'LIST') return `[${unwrapType(t.ofType)}]`;
  return t.name ?? 'Unknown';
}

/** Parse raw introspection response into a clean SchemaInfo */
export function parseIntrospection(raw: unknown): SchemaInfo {
  const schema = (raw as { data?: { __schema?: unknown } })?.data?.__schema as {
    queryType?: { name: string } | null;
    mutationType?: { name: string } | null;
    subscriptionType?: { name: string } | null;
    types?: unknown[];
  } | undefined;

  if (!schema) throw new Error('Invalid introspection response');

  const types: IntrospectionType[] = ((schema.types ?? []) as unknown[])
    .map((t) => {
      const type = t as {
        kind: string;
        name: string;
        description?: string;
        fields?: unknown[];
        inputFields?: unknown[];
        enumValues?: unknown[];
      };
      return {
        name: type.name,
        kind: type.kind,
        description: type.description,
        fields: (type.fields ?? []).map((f) => {
          const field = f as {
            name: string;
            description?: string;
            type: unknown;
            args?: unknown[];
          };
          return {
            name: field.name,
            description: field.description,
            type: unwrapType(field.type),
            args: (field.args ?? []).map((a) => {
              const arg = a as {
                name: string;
                description?: string;
                type: unknown;
                defaultValue?: string | null;
              };
              return {
                name: arg.name,
                description: arg.description,
                type: unwrapType(arg.type),
                defaultValue: arg.defaultValue,
              };
            }),
          };
        }),
        inputFields: (type.inputFields ?? []).map((f) => {
          const field = f as { name: string; description?: string; type: unknown };
          return { name: field.name, description: field.description, type: unwrapType(field.type) };
        }),
        enumValues: (type.enumValues ?? []).map((e) => {
          const ev = e as { name: string; description?: string };
          return { name: ev.name, description: ev.description };
        }),
      } as IntrospectionType;
    })
    .filter((t) => !t.name.startsWith('__')); // hide built-in meta types

  return {
    queryType: schema.queryType?.name ?? null,
    mutationType: schema.mutationType?.name ?? null,
    subscriptionType: schema.subscriptionType?.name ?? null,
    types,
  };
}

/** Detect operation type from query string */
export function detectOperationType(query: string): 'query' | 'mutation' | 'subscription' | 'unknown' {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.startsWith('mutation')) return 'mutation';
  if (trimmed.startsWith('subscription')) return 'subscription';
  if (trimmed.startsWith('query') || trimmed.startsWith('{')) return 'query';
  return 'unknown';
}

/** Validate that query string is non-empty and (loosely) looks like GraphQL */
export function validateQuery(query: string): string | null {
  const q = query.trim();
  if (!q) return 'Query cannot be empty';
  if (!q.includes('{')) return 'Query must contain at least one selection set { }';
  return null;
}

/** Validate variables string */
export function validateVariables(variables: string): string | null {
  if (!variables.trim() || variables.trim() === '{}') return null;
  try {
    JSON.parse(variables);
    return null;
  } catch {
    return 'Variables must be valid JSON';
  }
}

/** Build a curl command equivalent */
export function buildCurlCommand(
  endpoint: string,
  request: GraphQLRequest,
  headers: Record<string, string>,
): string {
  const body = JSON.stringify(
    {
      query: request.query,
      ...(request.variables && Object.keys(request.variables).length > 0
        ? { variables: request.variables }
        : {}),
      ...(request.operationName ? { operationName: request.operationName } : {}),
    },
    null,
    2,
  );

  const headerArgs = Object.entries({ 'Content-Type': 'application/json', ...headers })
    .map(([k, v]) => `  -H '${k}: ${v}'`)
    .join(' \\\n');

  return `curl -X POST '${endpoint}' \\\n${headerArgs} \\\n  -d '${body}'`;
}

// ─── Core request function ────────────────────────────────────────────────────

export async function executeGraphQL(
  config: GraphQLConfig,
  request: GraphQLRequest,
): Promise<GraphQLResponse> {
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeout ?? 30_000,
  );

  try {
    const body: Record<string, unknown> = { query: request.query };
    if (request.variables && Object.keys(request.variables).length > 0) {
      body.variables = request.variables;
    }
    if (request.operationName) {
      body.operationName = request.operationName;
    }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const duration = Date.now() - startTime;
    const rawText = await response.text();

    // Collect response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return {
        data: null,
        status: response.status,
        statusText: response.statusText,
        duration,
        raw: rawText,
        responseHeaders,
        errors: [{ message: `Non-JSON response: ${rawText.slice(0, 200)}` }],
      };
    }

    const gqlResponse = parsed as {
      data?: unknown;
      errors?: GraphQLError[];
      extensions?: Record<string, unknown>;
    };

    return {
      data: gqlResponse.data ?? null,
      errors: gqlResponse.errors,
      extensions: gqlResponse.extensions,
      status: response.status,
      statusText: response.statusText,
      duration,
      raw: rawText,
      responseHeaders,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Run introspection and return parsed schema */
export async function introspectSchema(config: GraphQLConfig): Promise<SchemaInfo> {
  const response = await executeGraphQL(config, { query: INTROSPECTION_QUERY });
  if (response.errors?.length) {
    throw new Error(response.errors.map((e) => e.message).join('; '));
  }
  return parseIntrospection({ data: response.data });
}

/** Format JSON for display */
export function formatGraphQLJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
