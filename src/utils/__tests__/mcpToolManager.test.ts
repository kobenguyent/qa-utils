import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MCPToolManager, getMCPToolGuide } from '../mcpToolManager';
import { MCPToolDefinition } from '../mcpTools';

describe('MCPToolManager', () => {
  let manager: MCPToolManager;

  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
    manager = new MCPToolManager({ autoSave: false });
  });

  describe('Initialization', () => {
    it('should initialize with empty tools', () => {
      expect(manager.getAllTools()).toEqual([]);
    });

    it('should initialize default tools', () => {
      manager.initializeDefaultTools();
      const tools = manager.getAllTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.every(t => t.source === 'default')).toBe(true);
      expect(tools.every(t => !t.enabled)).toBe(true);
    });
  });

  describe('Enable/Disable Tools', () => {
    beforeEach(() => {
      manager.initializeDefaultTools();
    });

    it('should enable a specific tool', () => {
      const success = manager.enableTool('read_file');
      expect(success).toBe(true);
      expect(manager.isToolEnabled('read_file')).toBe(true);
    });

    it('should disable a specific tool', () => {
      manager.enableTool('read_file');
      const success = manager.disableTool('read_file');
      expect(success).toBe(true);
      expect(manager.isToolEnabled('read_file')).toBe(false);
    });

    it('should enable all default tools', () => {
      manager.enableAllDefaultTools();
      const tools = manager.getAllTools();
      expect(tools.every(t => t.enabled)).toBe(true);
    });

    it('should disable all tools', () => {
      manager.enableAllDefaultTools();
      manager.disableAllTools();
      const tools = manager.getAllTools();
      expect(tools.every(t => !t.enabled)).toBe(true);
    });

    it('should return false when enabling non-existent tool', () => {
      const success = manager.enableTool('non_existent');
      expect(success).toBe(false);
    });
  });

  describe('Custom Tools', () => {
    it('should add a custom tool', () => {
      const customTool: MCPToolDefinition = {
        name: 'custom_test',
        description: 'Test tool',
        category: 'utility',
        inputSchema: {
          type: 'object',
          properties: {
            test: { type: 'string', description: 'Test input' },
          },
          required: ['test'],
        },
        examples: [],
      };

      const success = manager.addCustomTool(customTool);
      expect(success).toBe(true);
      
      const tool = manager.getAllTools().find(t => t.name === 'custom_test');
      expect(tool).toBeDefined();
      expect(tool?.source).toBe('custom');
      expect(tool?.enabled).toBe(false);
    });

    it('should remove a custom tool', () => {
      const customTool: MCPToolDefinition = {
        name: 'custom_test',
        description: 'Test tool',
        category: 'utility',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        examples: [],
      };

      manager.addCustomTool(customTool);
      const success = manager.removeCustomTool('custom_test');
      expect(success).toBe(true);
      
      const tool = manager.getAllTools().find(t => t.name === 'custom_test');
      expect(tool).toBeUndefined();
    });

    it('should not remove default tools', () => {
      manager.initializeDefaultTools();
      const success = manager.removeCustomTool('read_file');
      expect(success).toBe(false);
    });
  });

  describe('Query Tools', () => {
    beforeEach(() => {
      manager.initializeDefaultTools();
      manager.enableTool('read_file');
      manager.enableTool('web_search');
    });

    it('should get enabled tools only', () => {
      const enabled = manager.getEnabledTools();
      expect(enabled.length).toBe(2);
      expect(enabled.every(t => t.enabled)).toBe(true);
    });

    it('should get all tools', () => {
      const all = manager.getAllTools();
      expect(all.length).toBeGreaterThan(2);
    });

    it('should get tools by category', () => {
      const filesystemTools = manager.getToolsByCategory('filesystem');
      expect(filesystemTools.length).toBeGreaterThan(0);
      expect(filesystemTools.every(t => t.definition?.category === 'filesystem')).toBe(true);
    });

    it('should get enabled tools by category', () => {
      const enabledFilesystem = manager.getEnabledToolsByCategory('filesystem');
      expect(enabledFilesystem.length).toBeGreaterThan(0);
      expect(enabledFilesystem.every(t => t.enabled)).toBe(true);
    });

    it('should check if tool is enabled', () => {
      expect(manager.isToolEnabled('read_file')).toBe(true);
      expect(manager.isToolEnabled('write_file')).toBe(false);
    });

    it('should get tool definition', () => {
      const def = manager.getToolDefinition('read_file');
      expect(def).toBeDefined();
      expect(def?.name).toBe('read_file');
    });
  });

  describe('Statistics', () => {
    it('should return correct stats', () => {
      manager.initializeDefaultTools();
      manager.enableTool('read_file');
      manager.enableTool('web_search');

      const stats = manager.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.enabled).toBe(2);
      expect(stats.disabled).toBe(stats.total - 2);
      expect(stats.defaultTools).toBe(stats.total);
      expect(stats.customTools).toBe(0);
    });

    it('should count custom tools separately', () => {
      manager.initializeDefaultTools();
      
      const customTool: MCPToolDefinition = {
        name: 'custom_test',
        description: 'Test',
        category: 'utility',
        inputSchema: { type: 'object', properties: {} },
        examples: [],
      };
      
      manager.addCustomTool(customTool);
      
      const stats = manager.getStats();
      expect(stats.customTools).toBe(1);
      expect(stats.defaultTools).toBeGreaterThan(0);
    });
  });

  describe('Import/Export', () => {
    beforeEach(() => {
      manager.initializeDefaultTools();
      manager.enableTool('read_file');
    });

    it('should export configuration', () => {
      const config = manager.exportConfig();
      expect(config).toBeDefined();
      expect(() => JSON.parse(config)).not.toThrow();
    });

    it('should import configuration', () => {
      const config = manager.exportConfig();
      
      const newManager = new MCPToolManager({ autoSave: false });
      const success = newManager.importConfig(config);
      
      expect(success).toBe(true);
      expect(newManager.isToolEnabled('read_file')).toBe(true);
    });

    it('should handle invalid import', () => {
      const success = manager.importConfig('invalid json');
      expect(success).toBe(false);
    });
  });

  describe('Clear', () => {
    it('should clear all data', () => {
      manager.initializeDefaultTools();
      manager.enableTool('read_file');
      
      manager.clear();
      
      expect(manager.getAllTools()).toEqual([]);
      expect(manager.getStats().total).toBe(0);
    });
  });

  describe('Server Tools', () => {
    it('should load tools from server', async () => {
      const mockClient = {
        listTools: vi.fn().mockResolvedValue([
          {
            name: 'server_tool',
            description: 'Tool from server',
            inputSchema: { type: 'object', properties: {} },
          },
        ]),
      };

      await manager.loadToolsFromServer(mockClient as any);
      
      const tool = manager.getAllTools().find(t => t.name === 'server_tool');
      expect(tool).toBeDefined();
      expect(tool?.source).toBe('custom');
    });

    it('should unload server tools', async () => {
      const mockClient = {
        listTools: vi.fn().mockResolvedValue([
          {
            name: 'server_tool',
            description: 'Tool from server',
            inputSchema: { type: 'object', properties: {} },
          },
        ]),
      };

      await manager.loadToolsFromServer(mockClient as any);
      manager.unloadServerTools();
      
      const tool = manager.getAllTools().find(t => t.name === 'server_tool');
      expect(tool).toBeUndefined();
    });
  });
});

describe('getMCPToolGuide', () => {
  it('should return comprehensive guide', () => {
    const guide = getMCPToolGuide();
    expect(guide).toBeDefined();
    expect(guide.length).toBeGreaterThan(0);
    expect(guide).toContain('MCP Tool Management Guide');
    expect(guide).toContain('Default Tools');
    expect(guide).toContain('Custom Tools');
    expect(guide).toContain('Getting Started');
    expect(guide).toContain('Best Practices');
  });
});
