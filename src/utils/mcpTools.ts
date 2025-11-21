/**
 * Default MCP Tools Configuration
 * Common tools that can be used with MCP servers
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  category: 'filesystem' | 'web' | 'computation' | 'data' | 'utility';
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  examples: Array<{
    description: string;
    input: Record<string, unknown>;
  }>;
}

/**
 * Default MCP Tools Collection
 */
export const DEFAULT_MCP_TOOLS: MCPToolDefinition[] = [
  // Filesystem Tools
  {
    name: 'read_file',
    description: 'Read the contents of a file from the filesystem',
    category: 'filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to read',
        },
        encoding: {
          type: 'string',
          description: 'The encoding to use (default: utf-8)',
          enum: ['utf-8', 'ascii', 'base64'],
        },
      },
      required: ['path'],
    },
    examples: [
      {
        description: 'Read a text file',
        input: { path: '/path/to/file.txt' },
      },
      {
        description: 'Read a file with specific encoding',
        input: { path: '/path/to/file.txt', encoding: 'utf-8' },
      },
    ],
  },
  {
    name: 'list_directory',
    description: 'List files and directories in a given path',
    category: 'filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the directory to list',
        },
        recursive: {
          type: 'string',
          description: 'Whether to list recursively (true/false)',
        },
      },
      required: ['path'],
    },
    examples: [
      {
        description: 'List files in a directory',
        input: { path: '/path/to/directory' },
      },
      {
        description: 'List files recursively',
        input: { path: '/path/to/directory', recursive: 'true' },
      },
    ],
  },
  {
    name: 'write_file',
    description: 'Write content to a file',
    category: 'filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to write',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
        encoding: {
          type: 'string',
          description: 'The encoding to use (default: utf-8)',
          enum: ['utf-8', 'ascii', 'base64'],
        },
      },
      required: ['path', 'content'],
    },
    examples: [
      {
        description: 'Write text to a file',
        input: { path: '/path/to/file.txt', content: 'Hello, World!' },
      },
    ],
  },

  // Web Tools
  {
    name: 'fetch_url',
    description: 'Fetch content from a URL',
    category: 'web',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch',
        },
        method: {
          type: 'string',
          description: 'HTTP method to use',
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
        },
        headers: {
          type: 'string',
          description: 'JSON string of headers to include',
        },
      },
      required: ['url'],
    },
    examples: [
      {
        description: 'Fetch a webpage',
        input: { url: 'https://example.com' },
      },
      {
        description: 'POST data to an API',
        input: {
          url: 'https://api.example.com/data',
          method: 'POST',
          headers: '{"Content-Type": "application/json"}',
        },
      },
    ],
  },
  {
    name: 'web_search',
    description: 'Search the web for information',
    category: 'web',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        limit: {
          type: 'string',
          description: 'Maximum number of results to return',
        },
      },
      required: ['query'],
    },
    examples: [
      {
        description: 'Search for information',
        input: { query: 'latest AI developments' },
      },
      {
        description: 'Limited search results',
        input: { query: 'Python tutorials', limit: '5' },
      },
    ],
  },

  // Computation Tools
  {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    category: 'computation',
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate',
        },
      },
      required: ['expression'],
    },
    examples: [
      {
        description: 'Simple calculation',
        input: { expression: '2 + 2' },
      },
      {
        description: 'Complex expression',
        input: { expression: 'sqrt(16) + pow(2, 3)' },
      },
    ],
  },
  {
    name: 'execute_code',
    description: 'Execute code in a sandboxed environment',
    category: 'computation',
    inputSchema: {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          description: 'Programming language',
          enum: ['python', 'javascript', 'bash'],
        },
        code: {
          type: 'string',
          description: 'The code to execute',
        },
      },
      required: ['language', 'code'],
    },
    examples: [
      {
        description: 'Execute Python code',
        input: { language: 'python', code: 'print("Hello, World!")' },
      },
      {
        description: 'Execute JavaScript',
        input: { language: 'javascript', code: 'console.log(2 + 2)' },
      },
    ],
  },

  // Data Tools
  {
    name: 'parse_json',
    description: 'Parse and validate JSON data',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        json: {
          type: 'string',
          description: 'The JSON string to parse',
        },
      },
      required: ['json'],
    },
    examples: [
      {
        description: 'Parse JSON',
        input: { json: '{"name": "John", "age": 30}' },
      },
    ],
  },
  {
    name: 'query_database',
    description: 'Query a database using SQL',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        connection: {
          type: 'string',
          description: 'Database connection string',
        },
        query: {
          type: 'string',
          description: 'SQL query to execute',
        },
      },
      required: ['connection', 'query'],
    },
    examples: [
      {
        description: 'Query database',
        input: {
          connection: 'sqlite:///data.db',
          query: 'SELECT * FROM users LIMIT 10',
        },
      },
    ],
  },

  // Utility Tools
  {
    name: 'generate_uuid',
    description: 'Generate a UUID',
    category: 'utility',
    inputSchema: {
      type: 'object',
      properties: {
        version: {
          type: 'string',
          description: 'UUID version (4 for random)',
          enum: ['1', '4'],
        },
      },
    },
    examples: [
      {
        description: 'Generate random UUID',
        input: { version: '4' },
      },
    ],
  },
  {
    name: 'get_timestamp',
    description: 'Get current timestamp',
    category: 'utility',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          description: 'Timestamp format',
          enum: ['unix', 'iso8601', 'rfc3339'],
        },
      },
    },
    examples: [
      {
        description: 'Get Unix timestamp',
        input: { format: 'unix' },
      },
      {
        description: 'Get ISO 8601 timestamp',
        input: { format: 'iso8601' },
      },
    ],
  },
];

/**
 * Get tools by category
 */
export function getToolsByCategory(category: MCPToolDefinition['category']): MCPToolDefinition[] {
  return DEFAULT_MCP_TOOLS.filter(tool => tool.category === category);
}

/**
 * Get all tool categories
 */
export function getToolCategories(): MCPToolDefinition['category'][] {
  return ['filesystem', 'web', 'computation', 'data', 'utility'];
}

/**
 * Search tools by name or description
 */
export function searchTools(query: string): MCPToolDefinition[] {
  const lowerQuery = query.toLowerCase();
  return DEFAULT_MCP_TOOLS.filter(
    tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): MCPToolDefinition | undefined {
  return DEFAULT_MCP_TOOLS.find(tool => tool.name === name);
}

/**
 * Format tool documentation
 */
export function formatToolDocumentation(tool: MCPToolDefinition): string {
  let doc = `## ${tool.name}\n\n`;
  doc += `**Category:** ${tool.category}\n\n`;
  doc += `**Description:** ${tool.description}\n\n`;
  doc += `### Input Schema\n\n`;
  doc += `\`\`\`json\n${JSON.stringify(tool.inputSchema, null, 2)}\n\`\`\`\n\n`;
  doc += `### Examples\n\n`;
  
  tool.examples.forEach((example, index) => {
    doc += `**Example ${index + 1}:** ${example.description}\n\n`;
    doc += `\`\`\`json\n${JSON.stringify(example.input, null, 2)}\n\`\`\`\n\n`;
  });

  return doc;
}

/**
 * Get all tools documentation
 */
export function getAllToolsDocumentation(): string {
  let doc = '# MCP Tools Documentation\n\n';
  doc += 'This document describes all available MCP tools.\n\n';
  
  const categories = getToolCategories();
  categories.forEach(category => {
    doc += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Tools\n\n`;
    const tools = getToolsByCategory(category);
    tools.forEach(tool => {
      doc += formatToolDocumentation(tool);
    });
  });

  return doc;
}
