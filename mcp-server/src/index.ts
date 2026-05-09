#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';

import {
  generateUuids,
  base64Encode,
  base64Decode,
  generatePassword,
  convertTimestamp,
  generateHash,
  generateLoremIpsum,
  countCharacters,
  validateEmail,
  formatJson,
  decodeJwt,
  generateSql,
  convertColor,
  generateRandomString,
  sanitizeHtml,
  convertMarkdownToConfluence,
} from './tools.js';

import {
  executeGraphQL,
  introspectSchema,
} from '../../src/utils/graphqlClient.js';

const server = new McpServer(
  {
    name: 'qa-utils-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// --- Tool Registrations ---

server.registerTool('generate_uuid', {
  title: 'UUID Generator',
  description: 'Generate one or more random UUIDs (v4)',
  inputSchema: {
    quantity: z.number().min(1).max(100).default(1).describe('Number of UUIDs to generate (1-100)'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ quantity }) => ({
  content: [{ type: 'text', text: JSON.stringify(generateUuids(quantity), null, 2) }],
}));

server.registerTool('base64_encode', {
  title: 'Base64 Encoder',
  description: 'Encode a string to Base64',
  inputSchema: {
    value: z.string().describe('The string to encode'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ value }) => ({
  content: [{ type: 'text', text: base64Encode(value) }],
}));

server.registerTool('base64_decode', {
  title: 'Base64 Decoder',
  description: 'Decode a Base64 string',
  inputSchema: {
    value: z.string().describe('The Base64 string to decode'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ value }) => ({
  content: [{ type: 'text', text: base64Decode(value) }],
}));

server.registerTool('generate_password', {
  title: 'Password Generator',
  description: 'Generate a secure random password with configurable options',
  inputSchema: {
    length: z.number().min(1).max(256).default(16).describe('Password length (1-256)'),
    uppercase: z.boolean().default(true).describe('Include uppercase letters'),
    lowercase: z.boolean().default(true).describe('Include lowercase letters'),
    numbers: z.boolean().default(true).describe('Include numbers'),
    symbols: z.boolean().default(true).describe('Include special symbols'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ length, uppercase, lowercase, numbers, symbols }) => ({
  content: [{ type: 'text', text: generatePassword(length, { uppercase, lowercase, numbers, symbols }) }],
}));

server.registerTool('convert_timestamp', {
  title: 'Timestamp Converter',
  description: 'Convert Unix timestamp to human-readable date or get current timestamp. Accepts Unix timestamp (seconds or milliseconds) or ISO date string.',
  inputSchema: {
    value: z.string().optional().describe('Unix timestamp or ISO date string. Omit for current time.'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ value }) => ({
  content: [{ type: 'text', text: JSON.stringify(convertTimestamp(value), null, 2) }],
}));

server.registerTool('generate_hash', {
  title: 'Hash Generator',
  description: 'Generate a cryptographic hash of the given text',
  inputSchema: {
    value: z.string().describe('The text to hash'),
    algorithm: z.enum(['md5', 'sha1', 'sha256', 'sha384', 'sha512']).default('sha256').describe('Hash algorithm'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ value, algorithm }) => ({
  content: [{ type: 'text', text: generateHash(value, algorithm) }],
}));

server.registerTool('generate_lorem_ipsum', {
  title: 'Lorem Ipsum Generator',
  description: 'Generate lorem ipsum placeholder text',
  inputSchema: {
    paragraphs: z.number().min(1).max(20).default(1).describe('Number of paragraphs (1-20)'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ paragraphs }) => ({
  content: [{ type: 'text', text: generateLoremIpsum(paragraphs) }],
}));

server.registerTool('count_characters', {
  title: 'Character Counter',
  description: 'Count characters, words, sentences, lines, and paragraphs in text',
  inputSchema: {
    value: z.string().describe('The text to analyze'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ value }) => ({
  content: [{ type: 'text', text: JSON.stringify(countCharacters(value), null, 2) }],
}));

server.registerTool('validate_email', {
  title: 'Email Validator',
  description: 'Validate an email address format',
  inputSchema: {
    email: z.string().describe('The email address to validate'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ email }) => ({
  content: [{ type: 'text', text: JSON.stringify(validateEmail(email), null, 2) }],
}));

server.registerTool('format_json', {
  title: 'JSON Formatter',
  description: 'Format and validate a JSON string',
  inputSchema: {
    input: z.string().describe('The JSON string to format'),
    indent: z.number().min(0).max(8).default(2).describe('Indentation level (spaces)'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ input, indent }) => {
  const result = formatJson(input, indent);
  return {
    content: [{ type: 'text', text: result.valid ? result.formatted : JSON.stringify(result, null, 2) }],
    isError: !result.valid,
  };
});

server.registerTool('decode_jwt', {
  title: 'JWT Decoder',
  description: 'Decode a JWT token to inspect its header, payload, and expiration status (does not verify signature)',
  inputSchema: {
    token: z.string().describe('The JWT token to decode'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ token }) => {
  const result = decodeJwt(token);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    isError: !!result.error,
  };
});

server.registerTool('generate_sql', {
  title: 'SQL Generator',
  description: 'Generate SQL commands (SELECT, INSERT, UPDATE, DELETE, CREATE_TABLE)',
  inputSchema: {
    operation: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE_TABLE']).describe('SQL operation type'),
    tableName: z.string().describe('Name of the database table'),
    columns: z.array(z.string()).optional().describe('Column names'),
    values: z.array(z.string()).optional().describe('Values for INSERT/UPDATE'),
    whereClause: z.string().optional().describe('WHERE clause condition'),
    orderBy: z.string().optional().describe('ORDER BY clause'),
    limit: z.number().optional().describe('LIMIT clause'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ operation, tableName, columns, values, whereClause, orderBy, limit }) => ({
  content: [{ type: 'text', text: generateSql({ operation, tableName, columns, values, whereClause, orderBy, limit }) }],
}));

server.registerTool('convert_color', {
  title: 'Color Converter',
  description: 'Convert colors between hex and RGB formats, returning hex, RGB, and HSL values',
  inputSchema: {
    color: z.string().describe('Color value in hex (#FF0000) or RGB (rgb(255, 0, 0)) format'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ color }) => {
  const result = convertColor(color);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    isError: !!result.error,
  };
});

server.registerTool('generate_random_string', {
  title: 'Random String Generator',
  description: 'Generate a random alphanumeric string of specified length',
  inputSchema: {
    length: z.number().min(1).max(1024).default(16).describe('Length of the random string (1-1024)'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ length }) => ({
  content: [{ type: 'text', text: generateRandomString(length) }],
}));

server.registerTool('sanitize_html', {
  title: 'HTML Sanitizer',
  description: 'Remove script tags and event handlers from HTML',
  inputSchema: {
    html: z.string().describe('The HTML string to sanitize'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ html }) => ({
  content: [{ type: 'text', text: sanitizeHtml(html) }],
}));

server.registerTool('convert_markdown_to_confluence', {
  title: 'Markdown to Confluence Wiki Converter',
  description: 'Convert Markdown text to Confluence Wiki markup. Supports headings, bold, italic, strikethrough, inline code, fenced code blocks, tables, ordered and unordered lists, links, images, blockquotes, and horizontal rules.',
  inputSchema: {
    markdown: z.string().describe('The Markdown text to convert to Confluence Wiki markup'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ markdown }) => ({
  content: [{ type: 'text', text: convertMarkdownToConfluence(markdown) }],
}));

server.registerTool('graphql_query', {
  title: 'GraphQL Query Executor',
  description: 'Execute a GraphQL query or mutation against any GraphQL endpoint. Returns the response data, errors, HTTP status, and round-trip duration.',
  inputSchema: {
    endpoint: z.string().url().describe('The GraphQL endpoint URL'),
    query: z.string().describe('The GraphQL query or mutation string'),
    variables: z.record(z.string(), z.unknown()).optional().describe('GraphQL variables as a JSON object'),
    operationName: z.string().optional().describe('The operation name to execute (for documents with multiple operations)'),
    headers: z.record(z.string(), z.string()).optional().describe('Additional HTTP headers (e.g. Authorization)'),
    timeout: z.number().min(1000).max(120000).default(30000).describe('Request timeout in milliseconds (1000–120000)'),
  },
  annotations: { readOnlyHint: false, openWorldHint: true },
}, async ({ endpoint, query, variables, operationName, headers, timeout }) => {
  try {
    const response = await executeGraphQL(
      { endpoint, headers: headers ?? {}, timeout },
      { query, variables, operationName },
    );
    const result = {
      status: response.status,
      statusText: response.statusText,
      duration: `${response.duration}ms`,
      data: response.data,
      errors: response.errors ?? null,
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      isError: !!(response.errors?.length),
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

server.registerTool('graphql_introspect', {
  title: 'GraphQL Schema Introspector',
  description: 'Fetch and explore a GraphQL schema via introspection. Returns the query, mutation, and subscription root types, plus all user-defined types with their fields and descriptions.',
  inputSchema: {
    endpoint: z.string().url().describe('The GraphQL endpoint URL'),
    headers: z.record(z.string(), z.string()).optional().describe('Additional HTTP headers (e.g. Authorization)'),
    timeout: z.number().min(1000).max(120000).default(30000).describe('Request timeout in milliseconds'),
    typeName: z.string().optional().describe('If provided, return details for only this named type'),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
}, async ({ endpoint, headers, timeout, typeName }) => {
  try {
    const schema = await introspectSchema({ endpoint, headers: headers ?? {}, timeout });

    if (typeName) {
      const found = schema.types.find(
        (t) => t.name.toLowerCase() === typeName.toLowerCase(),
      );
      if (!found) {
        return {
          content: [{ type: 'text', text: `Type "${typeName}" not found in schema.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(found, null, 2) }],
      };
    }

    const summary = {
      queryType: schema.queryType,
      mutationType: schema.mutationType,
      subscriptionType: schema.subscriptionType,
      typeCount: schema.types.length,
      types: schema.types.map((t) => ({
        name: t.name,
        kind: t.kind,
        description: t.description ?? null,
        fieldCount: (t.fields?.length ?? t.inputFields?.length ?? 0),
      })),
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

// --- Start Server ---

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('qa-utils MCP server running on stdio');
}

main().catch((error: unknown) => {
  console.error('Server error:', error);
  process.exit(1);
});
