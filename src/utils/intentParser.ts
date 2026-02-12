/**
 * Intent Parser for Kobean AI Assistant
 * Parses natural language commands into structured intents and entities
 */

import { ToolCategory } from './toolRegistry';

export interface ParsedIntent {
    intent: IntentType;
    confidence: number;
    entities: ExtractedEntities;
    rawQuery: string;
    suggestedTool?: string;
    suggestedCategory?: ToolCategory;
}

export type IntentType =
    | 'encode'
    | 'decode'
    | 'generate'
    | 'convert'
    | 'test'
    | 'analyze'
    | 'create'
    | 'help'
    | 'navigate'
    | 'execute'
    | 'unknown';

export interface ExtractedEntities {
    format?: string;           // e.g., 'base64', 'jwt', 'json'
    targetFormat?: string;     // For conversions
    value?: string;            // The actual value to process
    quantity?: number;         // For generators (e.g., "5 UUIDs")
    length?: number;           // For password length, etc.
    url?: string;              // Extracted URLs
    toolName?: string;         // Specific tool mentioned
    options?: Record<string, unknown>;
}

// Intent patterns with example phrases and keywords
const INTENT_PATTERNS: Record<IntentType, { keywords: string[]; patterns: RegExp[] }> = {
    encode: {
        keywords: ['encode', 'encrypt', 'hash', 'convert to'],
        patterns: [
            /encode\s+(.+)\s+(?:to|as|in)\s+(\w+)/i,
            /(?:base64|jwt|hash)\s+encode/i,
            /encrypt\s+(.+)/i,
        ],
    },
    decode: {
        keywords: ['decode', 'decrypt', 'parse', 'read'],
        patterns: [
            /decode\s+(.+)/i,
            /(?:base64|jwt)\s+decode/i,
            /decrypt\s+(.+)/i,
            /parse\s+(?:this\s+)?(\w+)/i,
        ],
    },
    generate: {
        keywords: ['generate', 'create', 'make', 'new', 'random'],
        patterns: [
            /generate\s+(?:a\s+)?(?:new\s+)?(\w+)/i,
            /create\s+(?:a\s+)?(?:new\s+)?(\w+)/i,
            /(?:give|get)\s+(?:me\s+)?(?:a\s+)?(?:new\s+)?(\w+)/i,
            /(\d+)\s+(\w+)s?/i, // "5 UUIDs"
        ],
    },
    convert: {
        keywords: ['convert', 'transform', 'change', 'to'],
        patterns: [
            /convert\s+(.+)\s+(?:to|into)\s+(\w+)/i,
            /transform\s+(.+)\s+(?:to|into)\s+(\w+)/i,
            /(\w+)\s+to\s+(\w+)/i,
        ],
    },
    test: {
        keywords: ['test', 'check', 'verify', 'validate', 'scan', 'try'],
        patterns: [
            /test\s+(.+)/i,
            /check\s+(.+)/i,
            /scan\s+(.+)/i,
            /validate\s+(.+)/i,
        ],
    },
    analyze: {
        keywords: ['analyze', 'inspect', 'debug', 'examine', 'look at'],
        patterns: [
            /analyze\s+(.+)/i,
            /debug\s+(.+)/i,
            /inspect\s+(.+)/i,
        ],
    },
    create: {
        keywords: ['create', 'build', 'make', 'write', 'compose'],
        patterns: [
            /create\s+(?:a\s+)?(.+)/i,
            /build\s+(?:a\s+)?(.+)/i,
            /write\s+(?:a\s+)?(.+)/i,
        ],
    },
    help: {
        keywords: ['help', 'how', 'what', 'can you', 'show me', 'list'],
        patterns: [
            /(?:what\s+)?can\s+you\s+(?:do|help)/i,
            /help\s*(?:me)?(?:\s+with)?\s*(.+)?/i,
            /how\s+(?:do\s+I|to)\s+(.+)/i,
            /show\s+(?:me\s+)?(?:all\s+)?tools/i,
            /list\s+(?:all\s+)?(?:available\s+)?tools/i,
        ],
    },
    navigate: {
        keywords: ['go to', 'open', 'show', 'navigate', 'take me'],
        patterns: [
            /(?:go|navigate)\s+to\s+(.+)/i,
            /open\s+(?:the\s+)?(.+)/i,
            /take\s+me\s+to\s+(.+)/i,
        ],
    },
    execute: {
        keywords: ['run', 'execute', 'perform'],
        patterns: [
            /^run\s+(.+)/i,
            /^execute\s+(.+)/i,
            /^please\s+do\s+(.+)/i,
        ],
    },
    unknown: {
        keywords: [],
        patterns: [],
    },
};

// Format detection patterns
const FORMAT_PATTERNS: Record<string, RegExp[]> = {
    base64: [/base\s*64/i, /b64/i],
    jwt: [/jwt/i, /json\s*web\s*token/i],
    json: [/json/i],
    uuid: [/uuid/i, /guid/i],
    password: [/password/i, /pass/i],
    otp: [/otp/i, /one\s*time/i, /totp/i],
    hash: [/hash/i, /md5/i, /sha/i],
    timestamp: [/timestamp/i, /unix\s*time/i, /epoch/i],
    qr: [/qr\s*code/i, /qr/i],
    color: [/color/i, /hex/i, /rgb/i, /hsl/i],
    url: [/url/i, /link/i, /website/i],
};

// Tool name mappings
const TOOL_ALIASES: Record<string, string> = {
    'base64': 'base64',
    'b64': 'base64',
    'jwt': 'jwt-debugger',
    'json': 'json-formatter',
    'uuid': 'uuid-generator',
    'guid': 'uuid-generator',
    'password': 'password-generator',
    'otp': 'otp-generator',
    'totp': 'otp-generator',
    'hash': 'hash-generator',
    'md5': 'hash-generator',
    'sha': 'hash-generator',
    'timestamp': 'unix-timestamp',
    'unix': 'unix-timestamp',
    'epoch': 'unix-timestamp',
    'qr': 'qr-code',
    'qr code': 'qr-code',
    'color': 'color-converter',
    'rest': 'rest-client',
    'api': 'rest-client',
    'websocket': 'websocket-client',
    'ws': 'websocket-client',
    'grpc': 'grpc-client',
    'encrypt': 'encryption-tool',
    'encryption': 'encryption-tool',
    'dummy data': 'dummy-data-generator',
    'fake data': 'dummy-data-generator',
    'mock data': 'dummy-data-generator',
    'kanban': 'kanban-board',
    'board': 'kanban-board',
    'tasks': 'kanban-board',
    'ai': 'kobean-assistant',
    'chat': 'kobean-assistant',
    'prompt': 'prompt-enhancer',
    'collection': 'collection-manager',
    'postman': 'collection-manager',
    'workflow': 'workflow-generator',
    'github': 'github-pr-generator',
    'pr': 'github-pr-generator',
    'sql': 'sql-generator',
    'media': 'media-converter',
    'image': 'media-converter',
    'command': 'command-book',
    'commands': 'command-book',
    'lorem': 'lorem-ipsum',
    'lorem ipsum': 'lorem-ipsum',
    'htpasswd': 'htpasswd-generator',
    'character': 'character-counter',
    'counter': 'character-counter',
    'jira': 'jira-comment',
    'html': 'html-renderer',
    'scanner': 'website-scanner',
    'playwright': 'playwright-to-codeceptjs',
    'codeceptjs': 'codeceptjs',
};

/**
 * Parse a natural language query into a structured intent
 */
export function parseIntent(query: string): ParsedIntent {
    const normalizedQuery = query.trim().toLowerCase();
    const entities = extractEntities(query);

    let bestIntent: IntentType = 'unknown';
    let bestConfidence = 0;

    // Check each intent pattern
    for (const [intent, { keywords, patterns }] of Object.entries(INTENT_PATTERNS)) {
        if (intent === 'unknown') continue;

        let confidence = 0;

        // Check keywords
        for (const keyword of keywords) {
            if (normalizedQuery.includes(keyword)) {
                confidence += 30;
            }
        }

        // Check patterns
        for (const pattern of patterns) {
            if (pattern.test(query)) {
                confidence += 50;
                break;
            }
        }

        if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestIntent = intent as IntentType;
        }
    }

    // Determine suggested tool based on entities
    let suggestedTool: string | undefined;
    if (entities.toolName) {
        suggestedTool = TOOL_ALIASES[entities.toolName.toLowerCase()] || entities.toolName;
    } else if (entities.format) {
        suggestedTool = TOOL_ALIASES[entities.format.toLowerCase()];
    }

    // Determine suggested category
    let suggestedCategory: ToolCategory | undefined;
    if (bestIntent === 'encode' || bestIntent === 'decode') {
        suggestedCategory = 'encoding';
    } else if (bestIntent === 'generate') {
        suggestedCategory = 'generator';
    } else if (bestIntent === 'convert') {
        suggestedCategory = 'converter';
    } else if (bestIntent === 'test') {
        suggestedCategory = 'api-testing';
    }

    return {
        intent: bestIntent,
        confidence: Math.min(bestConfidence, 100),
        entities,
        rawQuery: query,
        suggestedTool,
        suggestedCategory,
    };
}

/**
 * Extract entities from a query
 */
export function extractEntities(query: string): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // Extract format
    for (const [format, patterns] of Object.entries(FORMAT_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(query)) {
                entities.format = format;
                break;
            }
        }
        if (entities.format) break;
    }

    // Extract URL
    const urlMatch = query.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
        entities.url = urlMatch[1];
    }

    // Extract quantity
    const quantityMatch = query.match(/(\d+)\s+(?:new\s+)?(\w+)s?/i);
    if (quantityMatch) {
        entities.quantity = parseInt(quantityMatch[1], 10);
        if (!entities.format) {
            entities.format = quantityMatch[2];
        }
    }

    // Extract length (for passwords, etc.)
    const lengthMatch = query.match(/(\d+)\s*(?:character|char|digit|length)/i);
    if (lengthMatch) {
        entities.length = parseInt(lengthMatch[1], 10);
    }

    // Extract tool name from aliases
    for (const alias of Object.keys(TOOL_ALIASES)) {
        if (query.toLowerCase().includes(alias)) {
            entities.toolName = alias;
            break;
        }
    }

    // Extract quoted values
    const quotedMatch = query.match(/["']([^"']+)["']/);
    if (quotedMatch) {
        entities.value = quotedMatch[1];
    }

    // Extract value after "encode", "decode", etc.
    const valuePatterns = [
        /(?:encode|decode|encrypt|decrypt|hash|convert)\s+["']?([^"'\s]+)["']?/i,
    ];
    for (const pattern of valuePatterns) {
        const match = query.match(pattern);
        if (match && !entities.value) {
            entities.value = match[1];
        }
    }

    return entities;
}

/**
 * Get tool ID from alias
 */
export function resolveToolAlias(alias: string): string | undefined {
    return TOOL_ALIASES[alias.toLowerCase()];
}

/**
 * Check if a query is a help request
 */
export function isHelpRequest(query: string): boolean {
    const helpPatterns = [
        /^help$/i,
        /what can you do/i,
        /show.+tools/i,
        /list.+tools/i,
        /^hi$/i,
        /^hello$/i,
        /^hey$/i,
    ];

    return helpPatterns.some(pattern => pattern.test(query.trim()));
}

/**
 * Check if query mentions a specific tool
 */
export function mentionsTool(query: string): string | undefined {
    const normalizedQuery = query.toLowerCase();

    for (const [alias, toolId] of Object.entries(TOOL_ALIASES)) {
        if (normalizedQuery.includes(alias)) {
            return toolId;
        }
    }

    return undefined;
}

/**
 * Generate suggestions based on partial input
 */
export function getSuggestions(partialQuery: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = partialQuery.toLowerCase();

    // Suggest based on common actions
    const actions = [
        'generate a UUID',
        'generate a password',
        'encode to Base64',
        'decode JWT token',
        'convert timestamp',
        'test API endpoint',
        'create QR code',
        'format JSON',
        'scan website',
    ];

    for (const action of actions) {
        if (action.toLowerCase().includes(lowerQuery)) {
            suggestions.push(action);
        }
    }

    // Suggest tool names
    for (const alias of Object.keys(TOOL_ALIASES)) {
        if (alias.includes(lowerQuery) && !suggestions.includes(`open ${alias}`)) {
            suggestions.push(`open ${alias}`);
        }
    }

    return suggestions.slice(0, 5);
}
