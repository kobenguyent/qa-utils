/**
 * Tool Registry for Kobean AI Assistant
 * Unified registry that catalogs all available tools and their metadata
 */

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    default?: unknown;
    enum?: string[];
}

export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    category: ToolCategory;
    keywords: string[];
    parameters?: ToolParameter[];
    examples: string[];
    route?: string; // For tools that have a dedicated page
    execute?: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
    success: boolean;
    data?: unknown;
    message?: string;
    error?: string;
    copyable?: string; // Content that can be copied to clipboard
}

export type ToolCategory =
    | 'encoding'
    | 'generator'
    | 'converter'
    | 'api-testing'
    | 'ai'
    | 'development'
    | 'productivity'
    | 'security';

// Tool invocation result with execution metadata
export interface ToolInvocationResult extends ToolResult {
    toolId: string;
    toolName: string;
    executionTime: number;
    timestamp: number;
}

/**
 * Central Tool Registry
 * Manages registration, discovery, and execution of all tools
 */
class ToolRegistryClass {
    private tools: Map<string, ToolDefinition> = new Map();
    private initialized = false;

    /**
     * Register a single tool
     */
    register(tool: ToolDefinition): void {
        this.tools.set(tool.id, tool);
    }

    /**
     * Register multiple tools at once
     */
    registerAll(tools: ToolDefinition[]): void {
        tools.forEach(tool => this.register(tool));
    }

    /**
     * Get a tool by ID
     */
    get(id: string): ToolDefinition | undefined {
        return this.tools.get(id);
    }

    /**
     * Get all registered tools
     */
    getAll(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tools by category
     */
    getByCategory(category: ToolCategory): ToolDefinition[] {
        return this.getAll().filter(tool => tool.category === category);
    }

    /**
     * Search tools by query string
     * Matches against name, description, and keywords
     */
    search(query: string): ToolDefinition[] {
        const lowerQuery = query.toLowerCase();
        return this.getAll().filter(tool => {
            const searchableText = [
                tool.name,
                tool.description,
                ...tool.keywords,
                ...tool.examples,
            ].join(' ').toLowerCase();

            return searchableText.includes(lowerQuery);
        });
    }

    /**
     * Find best matching tool for a query
     * Returns tool with highest relevance score
     */
    findBestMatch(query: string): ToolDefinition | null {
        const lowerQuery = query.toLowerCase();
        const words = lowerQuery.split(/\s+/);

        let bestTool: ToolDefinition | null = null;
        let bestScore = 0;

        for (const tool of this.getAll()) {
            let score = 0;

            // Exact name match (highest priority)
            if (tool.name.toLowerCase() === lowerQuery) {
                score += 100;
            }

            // Name contains query
            if (tool.name.toLowerCase().includes(lowerQuery)) {
                score += 50;
            }

            // Keyword matches
            for (const keyword of tool.keywords) {
                if (lowerQuery.includes(keyword.toLowerCase())) {
                    score += 20;
                }
                for (const word of words) {
                    if (keyword.toLowerCase().includes(word)) {
                        score += 5;
                    }
                }
            }

            // Description matches
            for (const word of words) {
                if (tool.description.toLowerCase().includes(word)) {
                    score += 2;
                }
            }

            // Example matches
            for (const example of tool.examples) {
                if (example.toLowerCase().includes(lowerQuery)) {
                    score += 10;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestTool = tool;
            }
        }

        // Require a minimum score to avoid false positives from incidental word matches
        // Score of 15 requires at least a keyword match (+20) or significant partial matches
        return bestScore >= 15 ? bestTool : null;
    }

    /**
     * Execute a tool with given parameters
     */
    async execute(toolId: string, params: Record<string, unknown> = {}): Promise<ToolInvocationResult> {
        const tool = this.get(toolId);
        const startTime = Date.now();

        if (!tool) {
            return {
                toolId,
                toolName: 'Unknown',
                success: false,
                error: `Tool not found: ${toolId}`,
                executionTime: 0,
                timestamp: startTime,
            };
        }

        if (!tool.execute) {
            return {
                toolId,
                toolName: tool.name,
                success: false,
                error: `Tool ${tool.name} does not have an execute function. Navigate to ${tool.route || '/'}`,
                executionTime: 0,
                timestamp: startTime,
            };
        }

        try {
            const result = await tool.execute(params);
            return {
                ...result,
                toolId,
                toolName: tool.name,
                executionTime: Date.now() - startTime,
                timestamp: startTime,
            };
        } catch (error) {
            return {
                toolId,
                toolName: tool.name,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                executionTime: Date.now() - startTime,
                timestamp: startTime,
            };
        }
    }

    /**
     * Get all categories with their tool counts
     */
    getCategories(): { category: ToolCategory; count: number }[] {
        const categoryCounts = new Map<ToolCategory, number>();

        for (const tool of this.getAll()) {
            const count = categoryCounts.get(tool.category) || 0;
            categoryCounts.set(tool.category, count + 1);
        }

        return Array.from(categoryCounts.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Check if registry has been initialized with tools
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Mark registry as initialized
     */
    markInitialized(): void {
        this.initialized = true;
    }

    /**
     * Get registry statistics
     */
    getStats(): { totalTools: number; categories: number } {
        return {
            totalTools: this.tools.size,
            categories: new Set(this.getAll().map(t => t.category)).size,
        };
    }

    /**
     * Clear all registered tools
     */
    clear(): void {
        this.tools.clear();
        this.initialized = false;
    }
}

// Export singleton instance
export const ToolRegistry = new ToolRegistryClass();

// Export category labels for UI
export const CATEGORY_LABELS: Record<ToolCategory, string> = {
    'encoding': '🔐 Encoding & Decoding',
    'generator': '🎲 Generators',
    'converter': '🔄 Converters',
    'api-testing': '🌐 API Testing',
    'ai': '🤖 AI Tools',
    'development': '💻 Development',
    'productivity': '📋 Productivity',
    'security': '🔒 Security',
};

// Export category icons for UI
export const CATEGORY_ICONS: Record<ToolCategory, string> = {
    'encoding': '🔐',
    'generator': '🎲',
    'converter': '🔄',
    'api-testing': '🌐',
    'ai': '🤖',
    'development': '💻',
    'productivity': '📋',
    'security': '🔒',
};
