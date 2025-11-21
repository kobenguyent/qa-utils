/**
 * MCP Tool Manager
 * Manages enabling, loading, and unloading of MCP tools (both default and custom)
 */

import { MCPToolDefinition, DEFAULT_MCP_TOOLS } from './mcpTools';
import { MCPClient, MCPTool } from './mcpClient';

export interface EnabledTool {
  name: string;
  enabled: boolean;
  source: 'default' | 'custom';
  definition?: MCPToolDefinition;
}

export interface MCPToolManagerConfig {
  storageKey?: string;
  autoSave?: boolean;
}

/**
 * MCP Tool Manager Class
 * Handles enabling/disabling, loading, and unloading of MCP tools
 */
export class MCPToolManager {
  private enabledTools: Map<string, EnabledTool> = new Map();
  private customToolDefinitions: Map<string, MCPToolDefinition> = new Map();
  private storageKey: string;
  private autoSave: boolean;

  constructor(config: MCPToolManagerConfig = {}) {
    this.storageKey = config.storageKey || 'mcp_enabled_tools';
    this.autoSave = config.autoSave !== false;
    this.loadFromStorage();
  }

  /**
   * Initialize default tools (all disabled by default)
   */
  initializeDefaultTools(): void {
    DEFAULT_MCP_TOOLS.forEach(tool => {
      if (!this.enabledTools.has(tool.name)) {
        this.enabledTools.set(tool.name, {
          name: tool.name,
          enabled: false,
          source: 'default',
          definition: tool,
        });
      }
    });
    if (this.autoSave) this.saveToStorage();
  }

  /**
   * Enable a specific tool
   */
  enableTool(toolName: string): boolean {
    const tool = this.enabledTools.get(toolName);
    if (tool) {
      tool.enabled = true;
      this.enabledTools.set(toolName, tool);
      if (this.autoSave) this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Disable a specific tool
   */
  disableTool(toolName: string): boolean {
    const tool = this.enabledTools.get(toolName);
    if (tool) {
      tool.enabled = false;
      this.enabledTools.set(toolName, tool);
      if (this.autoSave) this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Enable all default tools
   */
  enableAllDefaultTools(): void {
    this.enabledTools.forEach((tool, key) => {
      if (tool.source === 'default') {
        tool.enabled = true;
        this.enabledTools.set(key, tool);
      }
    });
    if (this.autoSave) this.saveToStorage();
  }

  /**
   * Disable all tools
   */
  disableAllTools(): void {
    this.enabledTools.forEach((tool, key) => {
      tool.enabled = false;
      this.enabledTools.set(key, tool);
    });
    if (this.autoSave) this.saveToStorage();
  }

  /**
   * Add a custom tool definition
   */
  addCustomTool(tool: MCPToolDefinition): boolean {
    try {
      this.customToolDefinitions.set(tool.name, tool);
      this.enabledTools.set(tool.name, {
        name: tool.name,
        enabled: false,
        source: 'custom',
        definition: tool,
      });
      if (this.autoSave) this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error adding custom tool:', error);
      return false;
    }
  }

  /**
   * Remove a custom tool
   */
  removeCustomTool(toolName: string): boolean {
    const tool = this.enabledTools.get(toolName);
    if (tool && tool.source === 'custom') {
      this.customToolDefinitions.delete(toolName);
      this.enabledTools.delete(toolName);
      if (this.autoSave) this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Load tools from an MCP server
   */
  async loadToolsFromServer(client: MCPClient): Promise<MCPTool[]> {
    try {
      const tools = await client.listTools();
      
      // Add server tools as custom tools
      tools.forEach(tool => {
        const toolDef: MCPToolDefinition = {
          name: tool.name,
          description: tool.description,
          category: 'utility', // Default category for server tools
          inputSchema: tool.inputSchema as MCPToolDefinition['inputSchema'],
          examples: [],
        };
        
        if (!this.enabledTools.has(tool.name)) {
          this.enabledTools.set(tool.name, {
            name: tool.name,
            enabled: false,
            source: 'custom',
            definition: toolDef,
          });
        }
      });
      
      if (this.autoSave) this.saveToStorage();
      return tools;
    } catch (error) {
      console.error('Error loading tools from server:', error);
      throw error;
    }
  }

  /**
   * Unload all tools from server
   */
  unloadServerTools(): void {
    // Remove all custom tools that came from server
    const toRemove: string[] = [];
    this.enabledTools.forEach((tool, key) => {
      if (tool.source === 'custom') {
        toRemove.push(key);
      }
    });
    
    toRemove.forEach(key => {
      this.enabledTools.delete(key);
      this.customToolDefinitions.delete(key);
    });
    
    if (this.autoSave) this.saveToStorage();
  }

  /**
   * Get all enabled tools
   */
  getEnabledTools(): EnabledTool[] {
    return Array.from(this.enabledTools.values()).filter(tool => tool.enabled);
  }

  /**
   * Get all tools (enabled and disabled)
   */
  getAllTools(): EnabledTool[] {
    return Array.from(this.enabledTools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): EnabledTool[] {
    return Array.from(this.enabledTools.values()).filter(
      tool => tool.definition?.category === category
    );
  }

  /**
   * Get enabled tools by category
   */
  getEnabledToolsByCategory(category: string): EnabledTool[] {
    return this.getToolsByCategory(category).filter(tool => tool.enabled);
  }

  /**
   * Check if a tool is enabled
   */
  isToolEnabled(toolName: string): boolean {
    return this.enabledTools.get(toolName)?.enabled || false;
  }

  /**
   * Get tool definition
   */
  getToolDefinition(toolName: string): MCPToolDefinition | undefined {
    return this.enabledTools.get(toolName)?.definition;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    disabled: number;
    defaultTools: number;
    customTools: number;
  } {
    const all = Array.from(this.enabledTools.values());
    return {
      total: all.length,
      enabled: all.filter(t => t.enabled).length,
      disabled: all.filter(t => !t.enabled).length,
      defaultTools: all.filter(t => t.source === 'default').length,
      customTools: all.filter(t => t.source === 'custom').length,
    };
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    const config = {
      enabledTools: Array.from(this.enabledTools.entries()),
      customTools: Array.from(this.customToolDefinitions.entries()),
    };
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(json: string): boolean {
    try {
      const config = JSON.parse(json);
      
      // Clear existing
      this.enabledTools.clear();
      this.customToolDefinitions.clear();
      
      // Import enabled tools
      if (config.enabledTools) {
        config.enabledTools.forEach(([key, value]: [string, EnabledTool]) => {
          this.enabledTools.set(key, value);
        });
      }
      
      // Import custom tools
      if (config.customTools) {
        config.customTools.forEach(([key, value]: [string, MCPToolDefinition]) => {
          this.customToolDefinitions.set(key, value);
        });
      }
      
      if (this.autoSave) this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  }

  /**
   * Save to storage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        enabledTools: Array.from(this.enabledTools.entries()),
        customTools: Array.from(this.customToolDefinitions.entries()),
      };
      window.sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving to storage:', error);
    }
  }

  /**
   * Load from storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = window.sessionStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        if (data.enabledTools) {
          this.enabledTools = new Map(data.enabledTools);
        }
        
        if (data.customTools) {
          this.customToolDefinitions = new Map(data.customTools);
        }
      }
    } catch (error) {
      console.warn('Error loading from storage:', error);
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.enabledTools.clear();
    this.customToolDefinitions.clear();
    
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(this.storageKey);
    }
  }
}

/**
 * Create a comprehensive guide for using MCP tools
 */
export function getMCPToolGuide(): string {
  return `
# MCP Tool Management Guide

## Overview
Model Context Protocol (MCP) tools extend AI capabilities by providing access to external functions, data sources, and services.

## Default Tools vs Custom Tools

### Default Tools
Default tools are pre-defined, well-documented tools available immediately:
- **Filesystem Tools**: read_file, list_directory, write_file
- **Web Tools**: fetch_url, web_search
- **Computation Tools**: calculate, execute_code
- **Data Tools**: parse_json, query_database
- **Utility Tools**: generate_uuid, get_timestamp

### Custom Tools
Custom tools can be:
1. Loaded from an MCP server
2. Manually defined and added
3. Imported from configuration files

## Getting Started

### 1. Enable Default Tools
\`\`\`typescript
const manager = new MCPToolManager();
manager.initializeDefaultTools();

// Enable specific tools
manager.enableTool('read_file');
manager.enableTool('web_search');

// Or enable all default tools
manager.enableAllDefaultTools();
\`\`\`

### 2. Connect to MCP Server
\`\`\`typescript
// Configure server connection
const serverConfig = {
  name: 'my-mcp-server',
  url: 'http://localhost:8080',
  apiKey: 'optional-api-key'
};

// Create client and connect
const client = new MCPClient(serverConfig);
await client.connect();

// Load tools from server
await manager.loadToolsFromServer(client);
\`\`\`

### 3. Add Custom Tools Manually
\`\`\`typescript
const customTool: MCPToolDefinition = {
  name: 'custom_analyzer',
  description: 'Analyze custom data',
  category: 'data',
  inputSchema: {
    type: 'object',
    properties: {
      data: { type: 'string', description: 'Data to analyze' }
    },
    required: ['data']
  },
  examples: [
    { description: 'Analyze sample', input: { data: 'sample' } }
  ]
};

manager.addCustomTool(customTool);
manager.enableTool('custom_analyzer');
\`\`\`

## Managing Tools

### Enable/Disable Tools
\`\`\`typescript
// Enable specific tool
manager.enableTool('read_file');

// Disable specific tool
manager.disableTool('read_file');

// Enable all default tools
manager.enableAllDefaultTools();

// Disable all tools
manager.disableAllTools();
\`\`\`

### Query Tools
\`\`\`typescript
// Check if tool is enabled
const isEnabled = manager.isToolEnabled('read_file');

// Get enabled tools only
const enabledTools = manager.getEnabledTools();

// Get all tools
const allTools = manager.getAllTools();

// Get tools by category
const webTools = manager.getToolsByCategory('web');

// Get enabled tools by category
const enabledWebTools = manager.getEnabledToolsByCategory('web');
\`\`\`

### Remove Tools
\`\`\`typescript
// Remove custom tool
manager.removeCustomTool('custom_analyzer');

// Unload all server tools
manager.unloadServerTools();
\`\`\`

## Import/Export Configuration

### Export Configuration
\`\`\`typescript
// Export to JSON
const config = manager.exportConfig();

// Save to file
const blob = new Blob([config], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// ... download file
\`\`\`

### Import Configuration
\`\`\`typescript
// Import from JSON string
const success = manager.importConfig(configJson);

// Or load from file
const file = event.target.files[0];
const reader = new FileReader();
reader.onload = (e) => {
  const config = e.target.result as string;
  manager.importConfig(config);
};
reader.readAsText(file);
\`\`\`

## Statistics & Monitoring
\`\`\`typescript
const stats = manager.getStats();
console.log(\`Total tools: \${stats.total}\`);
console.log(\`Enabled: \${stats.enabled}\`);
console.log(\`Default: \${stats.defaultTools}\`);
console.log(\`Custom: \${stats.customTools}\`);
\`\`\`

## Best Practices

1. **Start Small**: Enable only the tools you need
2. **Test Tools**: Verify tool functionality before enabling in production
3. **Security**: Only connect to trusted MCP servers
4. **Performance**: Disable unused tools to reduce overhead
5. **Backup**: Export your configuration regularly
6. **Documentation**: Document custom tools thoroughly

## Troubleshooting

### Tool Not Working
1. Check if tool is enabled: \`manager.isToolEnabled('tool_name')\`
2. Verify tool definition is correct
3. Check MCP server connection status
4. Review tool input schema and requirements

### Connection Issues
1. Verify server URL is correct
2. Check network connectivity
3. Ensure API key is valid (if required)
4. Review CORS settings for web-based servers

### Performance Issues
1. Disable unused tools
2. Limit number of enabled tools
3. Use tool categories to organize
4. Monitor stats regularly

## Advanced Usage

### Creating Tool Presets
\`\`\`typescript
// Create preset configurations
const presets = {
  developer: ['read_file', 'write_file', 'execute_code'],
  researcher: ['web_search', 'fetch_url', 'parse_json'],
  analyst: ['query_database', 'calculate', 'parse_json']
};

// Apply preset
function applyPreset(preset: string) {
  manager.disableAllTools();
  presets[preset].forEach(tool => manager.enableTool(tool));
}
\`\`\`

### Tool Validation
\`\`\`typescript
// Validate tool input before use
function validateToolInput(toolName: string, input: any): boolean {
  const def = manager.getToolDefinition(toolName);
  if (!def) return false;
  
  const required = def.inputSchema.required || [];
  return required.every(field => field in input);
}
\`\`\`
`;
}
