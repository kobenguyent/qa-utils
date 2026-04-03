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
} from './tools.js';

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
