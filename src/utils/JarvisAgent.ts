/**
 * Jarvis AI Agent - Main Orchestrator
 * Combines natural language understanding with tool execution
 */

import { ToolRegistry, ToolInvocationResult, ToolResult } from './toolRegistry';
import { parseIntent, ParsedIntent, isHelpRequest, getSuggestions } from './intentParser';
import { registerDefaultTools, getAllTools } from './defaultTools';
import { sendChatMessage, ChatMessage, ChatConfig } from './aiChatClient';

export interface JarvisConfig {
    aiProvider?: 'ollama' | 'openai' | 'anthropic' | 'google';
    aiEndpoint?: string;
    aiModel?: string;
    aiApiKey?: string;
    enableVoice?: boolean;
    systemPrompt?: string;
}

export interface JarvisResponse {
    text: string;
    toolResult?: ToolInvocationResult;
    intent?: ParsedIntent;
    suggestions?: string[];
    navigateTo?: string;
    error?: string;
}

export interface JarvisMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    toolResult?: ToolInvocationResult;
}

/**
 * Jarvis AI Agent Class
 */
export class JarvisAgent {
    private config: JarvisConfig;
    private conversationHistory: JarvisMessage[] = [];
    private initialized = false;

    constructor(config: JarvisConfig = {}) {
        this.config = {
            aiProvider: config.aiProvider || 'ollama',
            aiEndpoint: config.aiEndpoint || 'http://localhost:11434',
            aiModel: config.aiModel || 'mistral',
            enableVoice: config.enableVoice ?? false,
            systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(),
            ...config,
        };
    }

    /**
     * Initialize the agent
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        // Register all tools
        registerDefaultTools();
        this.initialized = true;
    }

    /**
     * Process a user message and generate a response
     */
    async processMessage(userMessage: string): Promise<JarvisResponse> {
        await this.initialize();

        // Add user message to history
        const userMsg: JarvisMessage = {
            id: crypto.randomUUID?.() || Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: Date.now(),
        };
        this.conversationHistory.push(userMsg);

        // Check for help request
        if (isHelpRequest(userMessage)) {
            return this.generateHelpResponse();
        }

        // Parse the intent
        const intent = parseIntent(userMessage);

        // Handle navigation intents
        if (intent.intent === 'navigate' && intent.suggestedTool) {
            const tool = ToolRegistry.get(intent.suggestedTool);
            if (tool?.route) {
                return {
                    text: `Opening ${tool.name}...`,
                    intent,
                    navigateTo: tool.route,
                };
            }
        }

        // Try to find and execute a tool
        if (intent.suggestedTool || intent.confidence > 40) {
            const toolResult = await this.executeFromIntent(intent);

            if (toolResult.success) {
                const response: JarvisResponse = {
                    text: toolResult.message || `Successfully executed ${toolResult.toolName}`,
                    toolResult,
                    intent,
                };

                // Add assistant response to history
                this.conversationHistory.push({
                    id: crypto.randomUUID?.() || Date.now().toString(),
                    role: 'assistant',
                    content: response.text,
                    timestamp: Date.now(),
                    toolResult,
                });

                return response;
            } else if (toolResult.error?.includes('Navigate to')) {
                // Tool doesn't have execute function, navigate to it
                const tool = ToolRegistry.get(toolResult.toolId);
                if (tool?.route) {
                    return {
                        text: `Let me open ${tool.name} for you.`,
                        intent,
                        navigateTo: tool.route,
                    };
                }
            }
        }

        // Fall back to AI conversation
        return this.generateAIResponse(userMessage, intent);
    }

    /**
     * Execute a tool based on parsed intent
     */
    private async executeFromIntent(intent: ParsedIntent): Promise<ToolInvocationResult> {
        // Find the best matching tool
        let toolId = intent.suggestedTool;

        if (!toolId) {
            const tool = ToolRegistry.findBestMatch(intent.rawQuery);
            if (tool) {
                toolId = tool.id;
            }
        }

        if (!toolId) {
            return {
                toolId: 'unknown',
                toolName: 'Unknown',
                success: false,
                error: 'Could not identify which tool to use. Try "help" to see available tools.',
                executionTime: 0,
                timestamp: Date.now(),
            };
        }

        // Build parameters from entities
        const params: Record<string, unknown> = {};

        if (intent.entities.value) {
            params.value = intent.entities.value;
        }
        if (intent.entities.quantity) {
            params.quantity = intent.entities.quantity;
        }
        if (intent.entities.length) {
            params.length = intent.entities.length;
        }
        if (intent.entities.url) {
            params.url = intent.entities.url;
        }
        if (intent.intent === 'encode') {
            params.action = 'encode';
        } else if (intent.intent === 'decode') {
            params.action = 'decode';
        }

        return ToolRegistry.execute(toolId, params);
    }

    /**
     * Generate help response listing available tools
     */
    private generateHelpResponse(): JarvisResponse {
        const tools = getAllTools();
        const categories = ToolRegistry.getCategories();

        let helpText = `👋 Hello! I'm Jarvis, your AI assistant. I can help you with:\n\n`;

        for (const { category, count } of categories) {
            const categoryTools = ToolRegistry.getByCategory(category);
            const toolNames = categoryTools.slice(0, 4).map(t => t.name).join(', ');
            const moreCount = count > 4 ? ` (+${count - 4} more)` : '';

            helpText += `**${this.getCategoryLabel(category)}**\n`;
            helpText += `${toolNames}${moreCount}\n\n`;
        }

        helpText += `\n💡 **Tips:**\n`;
        helpText += `• Say "generate a UUID" to create unique identifiers\n`;
        helpText += `• Say "encode hello world to base64" to encode text\n`;
        helpText += `• Say "open kanban" to navigate to a tool\n`;
        helpText += `• Just describe what you need, and I'll help!\n`;

        return {
            text: helpText,
            suggestions: [
                'Generate a UUID',
                'Create a password',
                'Encode to Base64',
                'Open AI Chat',
            ],
        };
    }

    /**
     * Generate AI-powered response when no direct tool match
     */
    private async generateAIResponse(
        userMessage: string,
        intent: ParsedIntent
    ): Promise<JarvisResponse> {
        // Check if AI is configured
        if (this.config.aiProvider === 'ollama' && !this.config.aiEndpoint) {
            return {
                text: this.generateFallbackResponse(intent),
                intent,
                suggestions: getSuggestions(userMessage),
            };
        }

        try {
            // Build messages for AI
            const messages: ChatMessage[] = [
                { role: 'system', content: this.config.systemPrompt! },
                ...this.conversationHistory.slice(-10).map(m => ({
                    role: m.role,
                    content: m.content,
                })),
            ];

            const chatConfig: ChatConfig = {
                provider: this.config.aiProvider || 'ollama',
                endpoint: this.config.aiEndpoint,
                model: this.config.aiModel,
                apiKey: this.config.aiApiKey,
                temperature: 0.7,
                maxTokens: 1000,
            };

            const response = await sendChatMessage(messages, chatConfig);

            return {
                text: response.message,
                intent,
                suggestions: getSuggestions(userMessage),
            };
        } catch (error) {
            return {
                text: this.generateFallbackResponse(intent),
                intent,
                suggestions: getSuggestions(userMessage),
                error: error instanceof Error ? error.message : 'AI unavailable',
            };
        }
    }

    /**
     * Generate fallback response when AI is not available
     */
    private generateFallbackResponse(intent: ParsedIntent): string {
        if (intent.suggestedTool) {
            const tool = ToolRegistry.get(intent.suggestedTool);
            if (tool) {
                return `I found the **${tool.name}** tool that might help. Would you like me to open it?\n\n${tool.description}`;
            }
        }

        if (intent.confidence < 20) {
            return `I'm not sure what you need. Try:\n• "generate uuid" for unique identifiers\n• "encode [text] to base64"\n• "help" to see all available tools`;
        }

        return `I understand you want to ${intent.intent}, but I need more details. Could you be more specific?`;
    }

    /**
     * Get category label for display
     */
    private getCategoryLabel(category: string): string {
        const labels: Record<string, string> = {
            'encoding': '🔐 Encoding & Decoding',
            'generator': '🎲 Generators',
            'converter': '🔄 Converters',
            'api-testing': '🌐 API Testing',
            'ai': '🤖 AI Tools',
            'development': '💻 Development',
            'productivity': '📋 Productivity',
            'security': '🔒 Security',
        };
        return labels[category] || category;
    }

    /**
     * Get default system prompt for Jarvis
     */
    private getDefaultSystemPrompt(): string {
        return `You are Jarvis, an intelligent AI assistant inspired by Iron Man's AI. You are integrated into the QA Utils application, a developer toolkit.

Your capabilities include:
- Generating UUIDs, passwords, OTPs, and dummy data
- Encoding/decoding Base64, JWT tokens, and hashes
- Converting timestamps, colors, and media files
- Testing APIs with REST, WebSocket, and gRPC clients
- Creating QR codes, SQL queries, and workflow files
- Managing tasks with Kanban boards

Guidelines:
- Be concise but helpful
- When users ask for tool functionality, execute the appropriate tool
- Suggest relevant tools based on context
- Be proactive in offering related capabilities
- Use markdown formatting for clarity
- Add relevant emojis to make responses engaging

You are running locally and have access to the user's development environment.`;
    }

    /**
     * Clear conversation history
     */
    clearHistory(): void {
        this.conversationHistory = [];
    }

    /**
     * Get conversation history
     */
    getHistory(): JarvisMessage[] {
        return [...this.conversationHistory];
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<JarvisConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): JarvisConfig {
        return { ...this.config };
    }

    /**
     * Get available tools
     */
    getTools() {
        return getAllTools();
    }

    /**
     * Search tools by query
     */
    searchTools(query: string) {
        return ToolRegistry.search(query);
    }
}

// Export singleton instance
let jarvisInstance: JarvisAgent | null = null;

export function getJarvis(config?: JarvisConfig): JarvisAgent {
    if (!jarvisInstance) {
        jarvisInstance = new JarvisAgent(config);
    } else if (config) {
        jarvisInstance.updateConfig(config);
    }
    return jarvisInstance;
}

export function resetJarvis(): void {
    jarvisInstance = null;
}
