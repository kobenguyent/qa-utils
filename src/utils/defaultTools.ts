/**
 * Default Tools Configuration for Kobean AI Assistant
 * Registers all available QA Utils tools with metadata
 */

import { ToolDefinition, ToolRegistry, ToolResult } from './toolRegistry';

// Helper function to generate UUID using browser's native crypto API
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper function for Base64 encoding
function encodeBase64(str: string): string {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch {
        return btoa(str);
    }
}

// Helper function for Base64 decoding
function decodeBase64(str: string): string {
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch {
        return atob(str);
    }
}

// Helper function for hashing using Web Crypto API
async function hashString(text: string, algorithm: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    let hashBuffer: ArrayBuffer;
    try {
        hashBuffer = await crypto.subtle.digest(algorithm, data);
    } catch {
        // Fallback for unsupported algorithms
        throw new Error(`Algorithm ${algorithm} is not supported`);
    }

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * UUID Generator Tool
 */
const uuidGenerator: ToolDefinition = {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate universally unique identifiers (UUIDs)',
    category: 'generator',
    keywords: ['uuid', 'guid', 'unique id', 'identifier', 'random'],
    examples: [
        'generate a uuid',
        'give me a new uuid',
        'create unique id',
        '5 uuids please',
    ],
    route: '/uuid',
    execute: async (params): Promise<ToolResult> => {
        const count = (params.quantity as number) || 1;
        const uuids = Array.from({ length: count }, () => generateUUID());

        return {
            success: true,
            data: uuids,
            message: count === 1
                ? `Generated UUID: ${uuids[0]}`
                : `Generated ${count} UUIDs`,
            copyable: uuids.join('\n'),
        };
    },
};

/**
 * Base64 Encoder/Decoder Tool
 */
const base64Tool: ToolDefinition = {
    id: 'base64',
    name: 'Base64 Encoder/Decoder',
    description: 'Encode text to Base64 or decode Base64 to text',
    category: 'encoding',
    keywords: ['base64', 'b64', 'encode', 'decode', 'binary'],
    examples: [
        'encode hello world to base64',
        'decode SGVsbG8gV29ybGQ=',
        'base64 encode my text',
    ],
    route: '/base64',
    execute: async (params): Promise<ToolResult> => {
        const value = params.value as string;
        const action = params.action as 'encode' | 'decode' || 'encode';

        if (!value) {
            return {
                success: false,
                error: 'Please provide a value to encode or decode',
            };
        }

        try {
            if (action === 'encode') {
                const encoded = encodeBase64(value);
                return {
                    success: true,
                    data: encoded,
                    message: `Encoded to Base64: ${encoded}`,
                    copyable: encoded,
                };
            } else {
                const decoded = decodeBase64(value);
                return {
                    success: true,
                    data: decoded,
                    message: `Decoded from Base64: ${decoded}`,
                    copyable: decoded,
                };
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to ${action}: ${error instanceof Error ? error.message : 'Invalid input'}`,
            };
        }
    },
};

/**
 * Password Generator Tool
 */
const passwordGenerator: ToolDefinition = {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate secure random passwords with customizable options',
    category: 'generator',
    keywords: ['password', 'secure', 'random', 'credentials', 'secret'],
    examples: [
        'generate a password',
        'create 16 character password',
        'secure password please',
    ],
    route: '/password',
    execute: async (params): Promise<ToolResult> => {
        const length = (params.length as number) || 16;
        const includeUppercase = params.uppercase !== false;
        const includeLowercase = params.lowercase !== false;
        const includeNumbers = params.numbers !== false;
        const includeSymbols = params.symbols !== false;

        let charset = '';
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (!charset) {
            return {
                success: false,
                error: 'At least one character type must be selected',
            };
        }

        // Use crypto.getRandomValues for secure randomness
        const randomBytes = new Uint32Array(length);
        crypto.getRandomValues(randomBytes);

        const password = Array.from(randomBytes)
            .map(x => charset[x % charset.length])
            .join('');

        return {
            success: true,
            data: password,
            message: `Generated ${length}-character password: ${password}`,
            copyable: password,
        };
    },
};

/**
 * Unix Timestamp Converter Tool
 */
const timestampConverter: ToolDefinition = {
    id: 'unix-timestamp',
    name: 'Unix Timestamp Converter',
    description: 'Convert between Unix timestamps and human-readable dates',
    category: 'converter',
    keywords: ['timestamp', 'unix', 'epoch', 'time', 'date', 'convert'],
    examples: [
        'convert timestamp 1706500000',
        'what is the current timestamp',
        'unix time to date',
    ],
    route: '/timestamp',
    execute: async (params): Promise<ToolResult> => {
        const value = params.value as string | number;

        // If no value provided, return current timestamp
        if (!value) {
            const now = Math.floor(Date.now() / 1000);
            const dateStr = new Date().toISOString();
            return {
                success: true,
                data: { timestamp: now, date: dateStr },
                message: `Current timestamp: ${now}\nDate: ${dateStr}`,
                copyable: now.toString(),
            };
        }

        // Try to parse as timestamp
        const numValue = typeof value === 'number' ? value : parseInt(value, 10);

        if (!isNaN(numValue)) {
            // Detect if it's in seconds or milliseconds
            const timestamp = numValue > 1e12 ? numValue : numValue * 1000;
            const date = new Date(timestamp);

            return {
                success: true,
                data: { timestamp: Math.floor(timestamp / 1000), date: date.toISOString() },
                message: `Timestamp: ${Math.floor(timestamp / 1000)}\nDate: ${date.toISOString()}\nLocal: ${date.toLocaleString()}`,
                copyable: date.toISOString(),
            };
        }

        // Try to parse as date string
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            const timestamp = Math.floor(date.getTime() / 1000);
            return {
                success: true,
                data: { timestamp, date: date.toISOString() },
                message: `Timestamp: ${timestamp}\nDate: ${date.toISOString()}`,
                copyable: timestamp.toString(),
            };
        }

        return {
            success: false,
            error: 'Could not parse input as timestamp or date',
        };
    },
};

/**
 * Hash Generator Tool (using Web Crypto API)
 */
const hashGenerator: ToolDefinition = {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate SHA-1, SHA-256, and SHA-512 hashes',
    category: 'security',
    keywords: ['hash', 'sha', 'sha256', 'sha512', 'checksum'],
    examples: [
        'hash my password',
        'generate sha256 hash',
        'sha256 of hello world',
    ],
    route: '/hash',
    execute: async (params): Promise<ToolResult> => {
        const value = params.value as string;
        const algorithm = (params.algorithm as string) || 'sha256';

        if (!value) {
            return {
                success: false,
                error: 'Please provide a value to hash',
            };
        }

        // Map algorithm names to Web Crypto API format
        const algorithmMap: Record<string, string> = {
            'sha1': 'SHA-1',
            'sha-1': 'SHA-1',
            'sha256': 'SHA-256',
            'sha-256': 'SHA-256',
            'sha384': 'SHA-384',
            'sha-384': 'SHA-384',
            'sha512': 'SHA-512',
            'sha-512': 'SHA-512',
        };

        const webCryptoAlgorithm = algorithmMap[algorithm.toLowerCase()];

        if (!webCryptoAlgorithm) {
            return {
                success: false,
                error: `Algorithm "${algorithm}" is not supported. Use: sha1, sha256, sha384, or sha512`,
            };
        }

        try {
            const hash = await hashString(value, webCryptoAlgorithm);

            return {
                success: true,
                data: { hash, algorithm: webCryptoAlgorithm },
                message: `${webCryptoAlgorithm} hash: ${hash}`,
                copyable: hash,
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to generate hash: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    },
};


/**
 * Lorem Ipsum Generator Tool
 */
const loremIpsumGenerator: ToolDefinition = {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder lorem ipsum text',
    category: 'generator',
    keywords: ['lorem', 'ipsum', 'placeholder', 'dummy text', 'filler'],
    examples: [
        'generate lorem ipsum',
        'give me some placeholder text',
        '3 paragraphs of lorem ipsum',
    ],
    route: '/lorem-ipsum',
    execute: async (params): Promise<ToolResult> => {
        const paragraphs = (params.quantity as number) || 1;

        const loremText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

        const result = Array(paragraphs).fill(loremText).join('\n\n');

        return {
            success: true,
            data: result,
            message: `Generated ${paragraphs} paragraph(s) of Lorem Ipsum`,
            copyable: result,
        };
    },
};

/**
 * Character Counter Tool
 */
const characterCounter: ToolDefinition = {
    id: 'character-counter',
    name: 'Character Counter',
    description: 'Count characters, words, sentences, and paragraphs in text',
    category: 'productivity',
    keywords: ['count', 'character', 'word', 'length', 'text'],
    examples: [
        'count characters in my text',
        'how many words',
        'character count',
    ],
    route: '/character-counter',
    execute: async (params): Promise<ToolResult> => {
        const text = (params.value as string) || '';

        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;

        const stats = {
            characters,
            charactersNoSpaces,
            words,
            sentences,
            paragraphs,
        };

        return {
            success: true,
            data: stats,
            message: `Characters: ${characters} (${charactersNoSpaces} without spaces)\nWords: ${words}\nSentences: ${sentences}\nParagraphs: ${paragraphs}`,
        };
    },
};

// Tools that just navigate to their pages (no direct execution)
const navigableTools: ToolDefinition[] = [
    {
        id: 'jwt-debugger',
        name: 'JWT Debugger',
        description: 'Debug and validate JSON Web Tokens',
        category: 'encoding',
        keywords: ['jwt', 'json web token', 'token', 'debug', 'decode'],
        examples: ['debug jwt', 'decode jwt token', 'validate token'],
        route: '/jwtDebugger',
    },
    {
        id: 'json-formatter',
        name: 'JSON Formatter',
        description: 'Format, validate, and beautify JSON data',
        category: 'converter',
        keywords: ['json', 'format', 'beautify', 'validate', 'pretty'],
        examples: ['format json', 'beautify json', 'validate json'],
        route: '/jsonFormatter',
    },
    {
        id: 'otp-generator',
        name: 'OTP Generator',
        description: 'Generate Time-based One-Time Passwords (TOTP)',
        category: 'security',
        keywords: ['otp', 'totp', 'one time password', '2fa', 'authenticator'],
        examples: ['generate otp', 'create totp', '2fa code'],
        route: '/otp',
    },
    {
        id: 'encryption-tool',
        name: 'Encryption Tool',
        description: 'Encrypt and decrypt text using various algorithms',
        category: 'security',
        keywords: ['encrypt', 'decrypt', 'aes', 'cipher', 'secure'],
        examples: ['encrypt my text', 'decrypt message', 'aes encryption'],
        route: '/encryption',
    },
    {
        id: 'qr-code',
        name: 'QR Code Generator',
        description: 'Generate QR codes for URLs, text, and more',
        category: 'generator',
        keywords: ['qr', 'qr code', 'barcode', 'scan'],
        examples: ['create qr code', 'qr for my url', 'generate qr'],
        route: '/qr-code',
    },
    {
        id: 'color-converter',
        name: 'Color Converter',
        description: 'Convert colors between HEX, RGB, HSL, and more',
        category: 'converter',
        keywords: ['color', 'hex', 'rgb', 'hsl', 'convert', 'palette'],
        examples: ['convert color', 'hex to rgb', 'color picker'],
        route: '/color-converter',
    },
    {
        id: 'rest-client',
        name: 'REST Client',
        description: 'Test REST APIs with customizable requests',
        category: 'api-testing',
        keywords: ['rest', 'api', 'http', 'request', 'postman'],
        examples: ['test api', 'rest request', 'http client'],
        route: '/rest-client',
    },
    {
        id: 'websocket-client',
        name: 'WebSocket Client',
        description: 'Connect and interact with WebSocket servers',
        category: 'api-testing',
        keywords: ['websocket', 'ws', 'socket', 'real-time'],
        examples: ['websocket test', 'connect websocket', 'ws client'],
        route: '/websocket-client',
    },
    {
        id: 'grpc-client',
        name: 'gRPC Client',
        description: 'Test gRPC services and make RPC calls',
        category: 'api-testing',
        keywords: ['grpc', 'rpc', 'protobuf', 'service'],
        examples: ['grpc test', 'rpc call', 'grpc client'],
        route: '/grpc-client',
    },
    {
        id: 'ai-chat',
        name: 'Kobean AI Chat',
        description: 'Chat with AI assistants (OpenAI, Claude, Gemini, Ollama)',
        category: 'ai',
        keywords: ['ai', 'chat', 'gpt', 'claude', 'gemini', 'ollama', 'assistant', 'kobean'],
        examples: ['open ai chat', 'chat with ai', 'ask gpt', 'open kobean'],
        route: '/kobean',
    },
    {
        id: 'prompt-enhancer',
        name: 'Prompt Enhancer',
        description: 'Enhance and improve prompts for AI models',
        category: 'ai',
        keywords: ['prompt', 'enhance', 'improve', 'ai', 'chatgpt'],
        examples: ['enhance my prompt', 'improve prompt', 'better prompt'],
        route: '/prompt-enhancer',
    },
    {
        id: 'dummy-data-generator',
        name: 'Dummy Data Generator',
        description: 'Generate fake data for testing (names, emails, addresses, etc.)',
        category: 'generator',
        keywords: ['dummy', 'fake', 'mock', 'data', 'test data', 'seed'],
        examples: ['generate fake data', 'dummy users', 'mock data'],
        route: '/dummy-data',
    },
    {
        id: 'kanban-board',
        name: 'Kanban Board',
        description: 'Manage tasks with a visual Kanban board',
        category: 'productivity',
        keywords: ['kanban', 'board', 'tasks', 'todo', 'project'],
        examples: ['open kanban', 'task board', 'manage tasks'],
        route: '/kanban',
    },
    {
        id: 'command-book',
        name: 'Command Book',
        description: 'Quick reference for CLI commands (Git, Docker, Bash)',
        category: 'development',
        keywords: ['command', 'cli', 'git', 'docker', 'bash', 'reference'],
        examples: ['command reference', 'git commands', 'docker help'],
        route: '/command-book',
    },
    {
        id: 'collection-manager',
        name: 'Collection Manager',
        description: 'Manage API collections like Postman',
        category: 'api-testing',
        keywords: ['collection', 'postman', 'api', 'request', 'environment'],
        examples: ['manage collections', 'import postman', 'api collection'],
        route: '/collection-manager',
    },
    {
        id: 'workflow-generator',
        name: 'Workflow Generator',
        description: 'Generate GitHub Actions workflow files',
        category: 'development',
        keywords: ['workflow', 'github actions', 'ci', 'cd', 'pipeline'],
        examples: ['create workflow', 'github actions', 'ci pipeline'],
        route: '/workflow-generator',
    },
    {
        id: 'github-pr-generator',
        name: 'GitHub PR Generator',
        description: 'Generate scripts for creating GitHub Pull Requests',
        category: 'development',
        keywords: ['github', 'pr', 'pull request', 'script'],
        examples: ['create pr script', 'github pr', 'pull request'],
        route: '/github-pr-generator',
    },
    {
        id: 'sql-generator',
        name: 'SQL Generator',
        description: 'Generate SQL queries from natural language',
        category: 'development',
        keywords: ['sql', 'query', 'database', 'select', 'insert'],
        examples: ['generate sql', 'sql query', 'database query'],
        route: '/sql-generator',
    },
    {
        id: 'media-converter',
        name: 'Media Converter',
        description: 'Convert images and remove backgrounds',
        category: 'converter',
        keywords: ['media', 'image', 'convert', 'resize', 'background'],
        examples: ['convert image', 'resize photo', 'remove background'],
        route: '/media-converter',
    },
    {
        id: 'website-scanner',
        name: 'Website Scanner',
        description: 'Scan websites for SEO, accessibility, and performance',
        category: 'ai',
        keywords: ['scan', 'website', 'seo', 'accessibility', 'performance'],
        examples: ['scan website', 'check seo', 'analyze site'],
        route: '/website-scanner',
    },
    {
        id: 'htpasswd-generator',
        name: 'HTPasswd Generator',
        description: 'Generate htpasswd entries for HTTP authentication',
        category: 'security',
        keywords: ['htpasswd', 'apache', 'nginx', 'auth', 'http auth'],
        examples: ['generate htpasswd', 'http auth', 'apache password'],
        route: '/htpasswd',
    },
    {
        id: 'jira-comment',
        name: 'Jira Comment Formatter',
        description: 'Format text for Jira comments with markdown',
        category: 'productivity',
        keywords: ['jira', 'comment', 'format', 'markdown', 'ticket'],
        examples: ['format for jira', 'jira markdown', 'jira comment'],
        route: '/jiraComment',
    },
    {
        id: 'html-renderer',
        name: 'HTML Renderer',
        description: 'Preview and render HTML code',
        category: 'development',
        keywords: ['html', 'render', 'preview', 'web'],
        examples: ['render html', 'preview html', 'html viewer'],
        route: '/html-renderer',
    },
    {
        id: 'playwright-to-codeceptjs',
        name: 'Playwright to CodeceptJS',
        description: 'Convert Playwright tests to CodeceptJS format',
        category: 'development',
        keywords: ['playwright', 'codeceptjs', 'convert', 'test', 'automation'],
        examples: ['convert playwright', 'playwright to codecept', 'test converter'],
        route: '/playwright2codecept',
    },
    {
        id: 'test-file-generator',
        name: 'Test File Generator',
        description: 'Generate test file templates for various frameworks',
        category: 'development',
        keywords: ['test', 'generate', 'template', 'jest', 'mocha', 'vitest'],
        examples: ['create test file', 'generate tests', 'test template'],
        route: '/test-file-generator',
    },
];

/**
 * Register all default tools
 */
export function registerDefaultTools(): void {
    // Register executable tools
    ToolRegistry.register(uuidGenerator);
    ToolRegistry.register(base64Tool);
    ToolRegistry.register(passwordGenerator);
    ToolRegistry.register(timestampConverter);
    ToolRegistry.register(hashGenerator);
    ToolRegistry.register(loremIpsumGenerator);
    ToolRegistry.register(characterCounter);

    // Register navigable tools
    ToolRegistry.registerAll(navigableTools);

    ToolRegistry.markInitialized();
}

/**
 * Get all registered tools
 */
export function getAllTools(): ToolDefinition[] {
    if (!ToolRegistry.isInitialized()) {
        registerDefaultTools();
    }
    return ToolRegistry.getAll();
}
