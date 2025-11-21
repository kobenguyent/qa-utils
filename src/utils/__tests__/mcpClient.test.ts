import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient, connectToMCPServer, MCPServerConfig } from '../mcpClient';

describe('mcpClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('MCPClient', () => {
    it('should connect to MCP server and discover capabilities', async () => {
      const mockCapabilities = {
        tools: [
          {
            name: 'calculator',
            description: 'Perform calculations',
            inputSchema: { type: 'object' },
          },
        ],
        resources: [
          {
            uri: 'file://docs/readme.md',
            name: 'README',
            description: 'Project documentation',
          },
        ],
        prompts: [
          {
            name: 'summarize',
            description: 'Summarize text',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCapabilities,
      });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
      };

      const client = new MCPClient(config);
      const capabilities = await client.connect();

      expect(capabilities).toEqual(mockCapabilities);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/mcp/capabilities',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle connection errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
      };

      const client = new MCPClient(config);

      await expect(client.connect()).rejects.toThrow('Failed to connect to MCP server');
    });

    it('should list tools', async () => {
      const mockCapabilities = {
        tools: [{ name: 'tool1', description: 'Tool 1', inputSchema: {} }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCapabilities,
      });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
      };

      const client = new MCPClient(config);
      const tools = await client.listTools();

      expect(tools).toEqual(mockCapabilities.tools);
    });

    it('should list resources', async () => {
      const mockCapabilities = {
        resources: [{ uri: 'file://test.txt', name: 'Test' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCapabilities,
      });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
      };

      const client = new MCPClient(config);
      const resources = await client.listResources();

      expect(resources).toEqual(mockCapabilities.resources);
    });

    it('should invoke a tool', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tools: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: 42 }),
        });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
      };

      const client = new MCPClient(config);
      await client.connect();

      const result = await client.invokeTool('calculator', { operation: 'add', a: 20, b: 22 });

      expect(result).toEqual({ result: 42 });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/mcp/tools/calculator',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ parameters: { operation: 'add', a: 20, b: 22 } }),
        })
      );
    });

    it('should fetch a resource', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ resources: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: 'Resource content', mimeType: 'text/plain' }),
        });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
      };

      const client = new MCPClient(config);
      await client.connect();

      const resource = await client.fetchResource('file://test.txt');

      expect(resource).toEqual({ content: 'Resource content', mimeType: 'text/plain' });
    });

    it('should get a prompt', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ prompts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ prompt: 'Summarize this: {text}' }),
        });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
      };

      const client = new MCPClient(config);
      await client.connect();

      const prompt = await client.getPrompt('summarize', { text: 'Hello world' });

      expect(prompt).toBe('Summarize this: {text}');
    });

    it('should include API key in headers when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tools: [] }),
      });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
        apiKey: 'secret-key',
      };

      const client = new MCPClient(config);
      await client.connect();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/mcp/capabilities',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer secret-key',
          }),
        })
      );
    });
  });

  describe('connectToMCPServer', () => {
    it('should create and connect client', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tools: [] }),
      });

      const config: MCPServerConfig = {
        name: 'test-server',
        url: 'http://localhost:8080',
      };

      const client = await connectToMCPServer(config);

      expect(client).toBeInstanceOf(MCPClient);
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
