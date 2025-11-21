/**
 * Model Context Protocol (MCP) Client
 * Implements MCP client for connecting to MCP servers and accessing tools/resources
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPServerConfig {
  name: string;
  url: string;
  apiKey?: string;
  transport?: 'http' | 'websocket';
}

export interface MCPServerCapabilities {
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
}

/**
 * MCP Client for connecting to and interacting with MCP servers
 */
export class MCPClient {
  private config: MCPServerConfig;
  private capabilities?: MCPServerCapabilities;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  /**
   * Connect to the MCP server and discover capabilities
   */
  async connect(): Promise<MCPServerCapabilities> {
    const url = `${this.config.url}/mcp/capabilities`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to connect to MCP server: ${response.status} ${response.statusText}`);
      }

      this.capabilities = await response.json();
      return this.capabilities as MCPServerCapabilities;
    } catch (error) {
      throw new Error(`MCP connection failed: ${(error as Error).message}`);
    }
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.capabilities) {
      await this.connect();
    }
    return this.capabilities?.tools || [];
  }

  /**
   * List available resources from the MCP server
   */
  async listResources(): Promise<MCPResource[]> {
    if (!this.capabilities) {
      await this.connect();
    }
    return this.capabilities?.resources || [];
  }

  /**
   * List available prompts from the MCP server
   */
  async listPrompts(): Promise<MCPPrompt[]> {
    if (!this.capabilities) {
      await this.connect();
    }
    return this.capabilities?.prompts || [];
  }

  /**
   * Invoke a tool on the MCP server
   */
  async invokeTool(toolName: string, parameters: Record<string, unknown>): Promise<unknown> {
    const url = `${this.config.url}/mcp/tools/${toolName}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ parameters }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Tool invocation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to invoke tool: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch a resource from the MCP server
   */
  async fetchResource(uri: string): Promise<{ content: string; mimeType?: string }> {
    const url = `${this.config.url}/mcp/resources`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ uri }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Resource fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch resource: ${(error as Error).message}`);
    }
  }

  /**
   * Get a prompt template from the MCP server
   */
  async getPrompt(promptName: string, args?: Record<string, string>): Promise<string> {
    const url = `${this.config.url}/mcp/prompts/${promptName}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ arguments: args }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Prompt retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return data.prompt || data.content || '';
    } catch (error) {
      throw new Error(`Failed to get prompt: ${(error as Error).message}`);
    }
  }
}

/**
 * Create and connect to an MCP server
 */
export async function connectToMCPServer(config: MCPServerConfig): Promise<MCPClient> {
  const client = new MCPClient(config);
  await client.connect();
  return client;
}
