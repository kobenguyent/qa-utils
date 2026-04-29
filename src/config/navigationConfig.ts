/**
 * Navigation Configuration — single source of truth for every route in the app.
 *
 * Each NavItem drives three things simultaneously:
 *   1. The route's entry in the search index (searchData.ts derives from this).
 *   2. The nav-dropdown entries in the Header (grouped by navGroups).
 *   3. The display metadata shown to the user everywhere.
 *
 * To add a new tool, add ONE entry here — the search index and header nav
 * update automatically.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Dropdown groups that appear in the Header navigation bar. */
export type NavGroup = 'Converters' | 'Generators' | 'API' | 'Tools' | 'Learn' | 'Palace';

export interface NavItem {
  /** Page / tool title shown in search results and page headings. */
  title: string;
  /** Short description shown in search results and command palette. */
  description: string;
  /** Hash-prefixed path, e.g. `#/jwt-debugger`. Used for links and routing. */
  path: string;
  /** Broad category label used to group search results. */
  category: string;
  /** Keywords boosting search-score relevance. */
  keywords: string[];
  /** Icon shown in search results (`icon + ' ' + title`). */
  icon: string;

  /**
   * Nav-dropdown groups this item appears in.
   * An empty array means the item is searchable but not in the nav.
   * Multiple groups cause the item to appear in each of those dropdowns.
   */
  navGroups: NavGroup[];
  /**
   * Short label shown in the nav dropdown.
   * Defaults to `title` when not provided.
   */
  navLabel?: string;
  /**
   * Icon shown in the nav dropdown.
   * Defaults to `icon` when not provided.
   */
  navIcon?: string;
  /**
   * When `true`, a divider is rendered immediately before this item inside
   * its nav dropdown (used in the Learn group to separate sub-sections).
   */
  dividerBefore?: boolean;
}

// ---------------------------------------------------------------------------
// Nav-group metadata (display order + header labels)
// ---------------------------------------------------------------------------

export interface NavGroupMeta {
  /** Full label shown on the dropdown toggle button. */
  title: string;
  /** Unique HTML id for the NavDropdown component. */
  id: string;
  /** Accessible aria-label for the dropdown toggle. */
  ariaLabel: string;
  /** Emoji icon for the group, used separately from the title label. */
  icon: string;
}

/** Ordered list of nav groups — determines left-to-right display in the header. */
export const NAV_GROUP_ORDER: NavGroup[] = [
  'Converters',
  'Generators',
  'API',
  'Tools',
  'Learn',
  'Palace',
];

/** Display metadata for each nav group. */
export const NAV_GROUP_META: Record<NavGroup, NavGroupMeta> = {
  Converters: {
    title: '🔄 Converters',
    id: 'nav-dropdown-converters',
    ariaLabel: 'Converters menu',
    icon: '🔄',
  },
  Generators: {
    title: '🎲 Generators',
    id: 'nav-dropdown-generators',
    ariaLabel: 'Generators menu',
    icon: '🎲',
  },
  API: {
    title: '🌐 API',
    id: 'nav-dropdown-api',
    ariaLabel: 'API Testing menu',
    icon: '🌐',
  },
  Tools: {
    title: '🔧 Tools',
    id: 'nav-dropdown-tools',
    ariaLabel: 'Developer Tools menu',
    icon: '🔧',
  },
  Learn: {
    title: '📚 Learn',
    id: 'nav-dropdown-learn',
    ariaLabel: 'Learning menu',
    icon: '📚',
  },
  Palace: {
    title: '🏛️ Palace',
    id: 'nav-dropdown-palace',
    ariaLabel: 'Memory Palace menu',
    icon: '🏛️',
  },
};

// ---------------------------------------------------------------------------
// Navigation config — add / edit tool entries here
// ---------------------------------------------------------------------------

export const navigationConfig: NavItem[] = [
  // ── Home (search only — displayed as a direct link in the header) ─────────
  {
    title: 'Home',
    description: 'QA Utils homepage with all tools',
    path: '#/',
    category: 'Navigation',
    keywords: ['home', 'start', 'main', 'index'],
    icon: '🏠',
    navGroups: [],
  },

  // ── Converters & Formatters ───────────────────────────────────────────────
  {
    title: 'JWT Debugger',
    description: 'Decode and analyze JSON Web Tokens',
    path: '#/jwtDebugger',
    category: 'Converters & Formatters',
    keywords: ['jwt', 'json', 'web', 'token', 'decode', 'debugger', 'auth', 'authentication'],
    icon: '🔑',
    navGroups: ['Converters'],
  },
  {
    title: 'Base64 Encode/Decode',
    description: 'Convert text to/from Base64 encoding',
    path: '#/base64',
    category: 'Converters & Formatters',
    keywords: ['base64', 'encode', 'decode', 'conversion', 'encoding'],
    icon: '🛸',
    navGroups: ['Converters'],
    navLabel: 'Base64',
  },
  {
    title: 'Unix Timestamp Converter',
    description: 'Convert Unix timestamps to readable dates',
    path: '#/timestamp',
    category: 'Converters & Formatters',
    keywords: ['unix', 'timestamp', 'time', 'date', 'converter', 'epoch'],
    icon: '⏰',
    navGroups: ['Converters'],
    navLabel: 'Timestamp',
  },
  {
    title: 'JSON Formatter',
    description: 'Format and validate JSON data',
    path: '#/jsonFormatter',
    category: 'Converters & Formatters',
    keywords: ['json', 'format', 'formatter', 'validate', 'pretty', 'beautify'],
    icon: '﹛﹜',
    navGroups: ['Converters'],
    navLabel: 'JSON',
  },
  {
    title: 'Color Converter',
    description:
      'Convert between color formats (HEX, RGB, HSL, HSV, CMYK, LAB) with palette generation and accessibility analysis',
    path: '#/color-converter',
    category: 'Converters & Formatters',
    keywords: [
      'color', 'converter', 'hex', 'rgb', 'hsl', 'hsv', 'cmyk', 'lab',
      'palette', 'accessibility', 'contrast', 'wcag', 'colorblind',
    ],
    icon: '🎨',
    navGroups: ['Converters'],
  },
  {
    title: 'SQL Command Generator',
    description: 'Generate SQL commands with a visual interface',
    path: '#/sql-generator',
    category: 'Converters & Formatters',
    keywords: ['sql', 'query', 'generator', 'database', 'select', 'insert', 'update', 'delete', 'create', 'table'],
    icon: '🗄️',
    navGroups: ['Converters'],
    navLabel: 'SQL Generator',
  },
  {
    title: 'HTML Renderer',
    description: 'Preview and render HTML code in real-time',
    path: '#/html-renderer',
    category: 'Converters & Formatters',
    keywords: ['html', 'render', 'preview', 'viewer', 'markup', 'web', 'display'],
    icon: '🌐',
    navGroups: ['Converters'],
  },
  {
    title: 'Media Converter',
    description:
      'Convert between image formats and PDF documents (Image ↔ PDF, PNG ↔ JPEG), remove backgrounds',
    path: '#/media-converter',
    category: 'Converters & Formatters',
    keywords: [
      'media', 'converter', 'image', 'pdf', 'png', 'jpeg', 'webp', 'gif',
      'convert', 'format', 'photo', 'background', 'remove', 'transparent', 'cutout',
    ],
    icon: '🔄',
    navGroups: ['Converters'],
  },
  {
    title: 'Markdown to Confluence Wiki',
    description: 'Convert Markdown text or files to Confluence Wiki markup',
    path: '#/markdown-to-confluence',
    category: 'Converters & Formatters',
    keywords: [
      'markdown', 'confluence', 'wiki', 'atlassian', 'converter', 'markup',
      'md', 'convert', 'jira', 'document', 'headings', 'table',
    ],
    icon: '📝',
    navGroups: ['Converters'],
    navLabel: 'MD → Confluence',
  },

  // ── Generators ────────────────────────────────────────────────────────────
  {
    title: 'UUID Generator',
    description: 'Generate UUIDs v1 and v4',
    path: '#/uuid',
    category: 'Generators',
    keywords: ['uuid', 'guid', 'generate', 'unique', 'identifier'],
    icon: '🆔',
    navGroups: ['Generators'],
    navLabel: 'UUID',
  },
  {
    title: 'OTP Generator',
    description: 'Generate time-based and counter-based OTP codes',
    path: '#/otp',
    category: 'Generators',
    keywords: ['otp', 'one-time', 'password', 'totp', 'hotp', 'authenticator', '2fa'],
    icon: '🔐',
    navGroups: ['Generators'],
    navLabel: 'OTP',
  },
  {
    title: 'Password Generator',
    description: 'Generate secure random passwords with customizable options',
    path: '#/password',
    category: 'Generators',
    keywords: ['password', 'generate', 'random', 'secure', 'strength', 'credentials'],
    icon: '🔑',
    navGroups: ['Generators'],
    navLabel: 'Password',
  },
  {
    title: 'Hash Generator',
    description: 'Generate cryptographic hashes (SHA-256, SHA-512, SHA-1)',
    path: '#/hash',
    category: 'Generators',
    keywords: ['hash', 'sha', 'sha256', 'sha512', 'sha1', 'md5', 'crypto', 'checksum'],
    icon: '🔐',
    navGroups: ['Generators'],
    navLabel: 'Hash',
  },
  {
    title: 'HTPasswd Generator',
    description: 'Generate htpasswd entries for HTTP basic authentication',
    path: '#/htpasswd',
    category: 'Generators',
    keywords: ['htpasswd', 'apache', 'nginx', 'http', 'basic', 'auth', 'authentication', 'password'],
    icon: '🔒',
    navGroups: ['Generators'],
    navLabel: 'HTPasswd',
  },
  {
    title: 'Lorem Ipsum Generator',
    description: 'Generate placeholder text for designs and mockups',
    path: '#/lorem-ipsum',
    category: 'Generators',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy', 'filler', 'generator'],
    icon: '📝',
    navGroups: ['Generators'],
    navLabel: 'Lorem Ipsum',
  },
  {
    title: 'JIRA Comment Generator',
    description: 'Format comments for JIRA with markdown',
    path: '#/jiraComment',
    category: 'Generators',
    keywords: ['jira', 'comment', 'generator', 'markdown', 'format', 'atlassian'],
    icon: '📋',
    navGroups: ['Generators'],
    navLabel: 'JIRA',
  },
  {
    title: 'Character Counter',
    description: 'Count characters, words, and lines in text',
    path: '#/character-counter',
    category: 'Generators',
    keywords: ['character', 'counter', 'word', 'count', 'text', 'length'],
    icon: '🔢',
    navGroups: ['Generators'],
    navLabel: 'Counter',
  },
  {
    title: 'Test File Generator',
    description: 'Generate test files like images, documents, and audio files for testing',
    path: '#/test-file-generator',
    category: 'Generators',
    keywords: ['test', 'file', 'generator', 'image', 'document', 'audio', 'png', 'jpg', 'pdf', 'wav', 'download'],
    icon: '📁',
    navGroups: ['Generators'],
    navLabel: 'Test Files',
  },
  {
    title: 'GitHub PR Script Generator',
    description: 'Generate bash scripts for creating GitHub pull requests with full git workflow',
    path: '#/github-pr-generator',
    category: 'Generators',
    keywords: ['github', 'pull request', 'pr', 'git', 'bash', 'script', 'workflow', 'automation', 'cli'],
    icon: '🚀',
    navGroups: ['Generators'],
    navLabel: 'GitHub PR Script',
  },
  {
    title: 'QR Code Generator',
    description:
      'Generate static and dynamic QR codes for URLs, WiFi, vCards, email, SMS, and more',
    path: '#/qr-code',
    category: 'Generators',
    keywords: [
      'qr', 'qrcode', 'barcode', 'generator', 'url', 'wifi', 'vcard',
      'contact', 'email', 'sms', 'phone', 'static', 'dynamic',
    ],
    icon: '📱',
    navGroups: ['Generators'],
  },
  {
    title: 'Dummy Data Generator',
    description:
      'Generate fake data for testing: names, emails, addresses, phone numbers, and more',
    path: '#/dummy-data',
    category: 'Generators',
    keywords: [
      'dummy', 'fake', 'data', 'generator', 'mock', 'test', 'name',
      'email', 'address', 'phone', 'person', 'company', 'falso', 'faker',
    ],
    icon: '🎭',
    navGroups: ['Generators'],
    navLabel: 'Dummy Data',
  },

  // ── API Testing ───────────────────────────────────────────────────────────
  {
    title: 'REST Client',
    description: 'Test REST APIs with HTTP requests',
    path: '#/rest-client',
    category: 'API Testing',
    keywords: ['rest', 'api', 'http', 'client', 'request', 'get', 'post', 'put', 'delete', 'curl'],
    icon: '🌐',
    navGroups: ['API'],
    navLabel: 'REST',
  },
  {
    title: 'WebSocket Client',
    description: 'Test WebSocket connections in real-time',
    path: '#/websocket-client',
    category: 'API Testing',
    keywords: ['websocket', 'ws', 'real-time', 'socket', 'client', 'connection'],
    icon: '🔌',
    navGroups: ['API'],
    navLabel: 'WebSocket',
  },
  {
    title: 'gRPC Client',
    description: 'Test gRPC services with gRPC-Web',
    path: '#/grpc-client',
    category: 'API Testing',
    keywords: ['grpc', 'protobuf', 'rpc', 'client', 'api', 'testing'],
    icon: '⚡',
    navGroups: ['API'],
    navLabel: 'gRPC',
  },
  {
    title: 'Collection Manager',
    description:
      'Parse, edit, and convert API collections between Postman, Insomnia, Thunder Client, and more',
    path: '#/collection-manager',
    category: 'API Testing',
    keywords: [
      'collection', 'postman', 'insomnia', 'thunder', 'client', 'api',
      'convert', 'import', 'export', 'variables', 'environment', 'bulk', 'edit',
    ],
    icon: '📦',
    navGroups: ['API'],
  },
  {
    title: 'Collection Visualizer',
    description:
      'Visualize REST API collections as an interactive tree — see all requests, folders, and HTTP methods at a glance',
    path: '#/collection-visualizer',
    category: 'API Testing',
    keywords: [
      'collection', 'visualizer', 'postman', 'insomnia', 'thunder', 'api',
      'tree', 'requests', 'folders', 'http', 'methods', 'view', 'explore',
    ],
    icon: '🗺️',
    navGroups: ['API'],
  },

  // ── Developer Tools ───────────────────────────────────────────────────────
  {
    title: 'Image Editor',
    description: 'Edit photos with filters, rotation, brightness, contrast, and more',
    path: '#/image-editor',
    category: 'Converters & Formatters',
    keywords: [
      'image', 'editor', 'photo', 'edit', 'filter', 'rotate', 'brightness',
      'contrast', 'saturation', 'blur', 'grayscale', 'sepia', 'flip', 'transform', 'compress',
    ],
    icon: '🎨',
    navGroups: ['Tools'],
  },
  {
    title: 'Kobean Assistant',
    description:
      'AI-powered assistant with tool execution and multi-provider support (OpenAI, Anthropic, Google, and more)',
    path: '#/kobean',
    category: 'AI Tools',
    keywords: ['ai', 'chat', 'gpt', 'openai', 'claude', 'gemini', 'llm', 'chatbot', 'assistant', 'kobean'],
    icon: '🤖',
    navGroups: ['Tools'],
  },
  {
    title: 'Agent Mode',
    description: 'Run autonomous AI agent tasks with multi-step tool execution',
    path: '#/agent',
    category: 'AI',
    keywords: ['agent', 'ai', 'autonomous', 'task', 'tools', 'loop', 'executor', 'kobean'],
    icon: '🤖',
    navGroups: ['Tools'],
  },
  {
    title: 'Agent Manager',
    description: 'Create and manage reusable AI agent profiles with run history',
    path: '#/agent-manager',
    category: 'AI',
    keywords: ['agent', 'manager', 'profile', 'ai', 'autonomous', 'history', 'create', 'reusable'],
    icon: '🗂️',
    navGroups: ['Tools'],
  },
  {
    title: 'Prompt Enhancer',
    description: 'Transform basic prompts into detailed, structured versions for AI models',
    path: '#/prompt-enhancer',
    category: 'AI Tools',
    keywords: ['prompt', 'enhancer', 'ai', 'chatgpt', 'claude', 'gemini', 'llm', 'text', 'json', 'toon', 'format', 'enhance'],
    icon: '✨',
    navGroups: ['Tools'],
  },
  {
    title: 'JSON Prompt Builder',
    description: 'Build structured AI prompts in JSON format with variables, multi-turn messages, and provider-specific export (OpenAI, Anthropic, Gemini)',
    path: '#/json-prompt-builder',
    category: 'AI Tools',
    keywords: [
      'json', 'prompt', 'builder', 'ai', 'openai', 'anthropic', 'gemini', 'llm',
      'chat', 'messages', 'system', 'user', 'assistant', 'template', 'variables',
      'prompt engineering', 'structured prompt',
    ],
    icon: '🧩',
    navGroups: ['Tools'],
    navLabel: 'JSON Prompt Builder',
  },
  {
    title: 'Website Scanner',
    description:
      'Comprehensive website analysis for broken links, accessibility, performance, SEO, and security issues',
    path: '#/website-scanner',
    category: 'Testing Tools',
    keywords: [
      'website', 'scanner', 'audit', 'broken', 'links', 'accessibility',
      'performance', 'seo', 'security', 'lighthouse', 'wcag', 'crawl',
    ],
    icon: '🔍',
    navGroups: ['Tools'],
  },
  {
    title: 'AI Website Tester',
    description: 'Automated AI-powered website testing with functional, UI/UX, performance, and security checks',
    path: '#/ai-website-tester',
    category: 'Testing Tools',
    keywords: [
      'ai', 'website', 'tester', 'automated', 'testing', 'functional',
      'ui', 'ux', 'performance', 'security', 'analysis',
    ],
    icon: '🤖',
    navGroups: ['Tools'],
  },
  {
    title: 'File Processor',
    description: 'Resize, compress, and convert images and documents with smart optimization',
    path: '#/file-processor',
    category: 'Utilities',
    keywords: ['file', 'processor', 'image', 'resize', 'compress', 'convert', 'document', 'pdf', 'optimization', 'batch'],
    icon: '📁',
    navGroups: ['Tools'],
  },
  {
    title: 'Encryption/Decryption',
    description: 'Encrypt and decrypt text with various algorithms',
    path: '#/encryption',
    category: 'Developer Tools',
    keywords: ['encryption', 'decryption', 'encrypt', 'decrypt', 'security', 'cipher', 'aes'],
    icon: '🔒',
    navGroups: ['Tools'],
    navLabel: 'Encryption',
  },
  {
    title: 'Playwright to CodeceptJS',
    description: 'Convert Playwright tests to CodeceptJS format',
    path: '#/playwright2codecept',
    category: 'Developer Tools',
    keywords: ['playwright', 'codeceptjs', 'convert', 'migration', 'test', 'automation'],
    icon: '🎭',
    navGroups: ['Tools'],
    navLabel: 'Test Converter',
  },
  {
    title: 'Sequence Diagram Generator',
    description: 'Generate sequence diagrams from CodeceptJS or Playwright test code',
    path: '#/sequence-diagram',
    category: 'Developer Tools',
    keywords: ['sequence', 'diagram', 'mermaid', 'codeceptjs', 'playwright', 'test', 'flow', 'visualization', 'uml'],
    icon: '📊',
    navGroups: ['Tools'],
    navLabel: 'Sequence Diagram',
  },
  {
    title: 'CI/CD Workflow Generator',
    description: 'Generate CI/CD workflows for GitHub Actions, GitLab, and more',
    path: '#/workflow-generator',
    category: 'Developer Tools',
    keywords: ['ci', 'cd', 'workflow', 'github', 'actions', 'gitlab', 'jenkins', 'pipeline', 'automation'],
    icon: '🚀',
    navGroups: ['Tools'],
    navLabel: 'CI/CD',
  },
  {
    title: 'Kanban Board',
    description: 'Visual task management with drag-and-drop columns for organizing projects',
    path: '#/kanban',
    category: 'Developer Tools',
    keywords: ['kanban', 'board', 'task', 'project', 'management', 'todo', 'agile', 'scrum', 'drag', 'drop', 'cards', 'columns'],
    icon: '📋',
    navGroups: ['Tools'],
  },

  // ── Learn ─────────────────────────────────────────────────────────────────
  {
    title: 'AI Instructions Guide',
    description: 'Markdown structure & best practices for Claude, ChatGPT, Gemini, Copilot, Cursor & Windsurf',
    path: '#/ai-instructions',
    category: 'Hints',
    keywords: ['ai', 'instructions', 'claude', 'chatgpt', 'gemini', 'copilot', 'cursor', 'windsurf', 'prompt', 'markdown', 'system prompt', 'rules', 'best practices', 'llm', 'context'],
    icon: '🤖',
    navGroups: ['Learn'],
    navLabel: 'AI Instructions',
  },
  {
    title: 'Command Book',
    description: 'Hands-on reference for Git, Docker, Bash, and CodeceptJS commands',
    path: '#/command-book',
    category: 'Developer Tools',
    keywords: ['command', 'book', 'git', 'github', 'cli', 'docker', 'bash', 'script', 'codeceptjs', 'reference', 'cheatsheet', 'snippet'],
    icon: '📖',
    navGroups: ['Learn'],
  },
  {
    title: 'Testing Cheat Sheet',
    description: 'Quick-reference commands for Playwright, Pytest, CodeceptJS, Cypress, Jest, Vitest & more',
    path: '#/codeceptjs',
    category: 'Hints',
    keywords: ['codeceptjs', 'playwright', 'pytest', 'cypress', 'jest', 'vitest', 'selenium', 'robot', 'k6', 'newman', 'postman', 'testing', 'cheat sheet', 'commands', 'hints'],
    icon: '🔥💡',
    navGroups: ['Learn'],
    navIcon: '🔥',
    navLabel: 'Testing Hints',
  },
  {
    title: 'CI/CD Infographic',
    description: 'Visual guide to Continuous Integration and Continuous Deployment',
    path: '#/cicd-infographic',
    category: 'Hints',
    keywords: ['cicd', 'ci', 'cd', 'continuous', 'integration', 'deployment', 'pipeline', 'devops', 'automation'],
    icon: '🔄',
    navGroups: ['Learn'],
    navLabel: 'CI/CD Infographic',
  },
  {
    title: 'AI Agents & MCP Infographic',
    description: 'Visual guide to AI Agents and Model Context Protocol',
    path: '#/ai-agents-infographic',
    category: 'Hints',
    keywords: ['ai', 'agents', 'mcp', 'model', 'context', 'protocol', 'llm', 'tools', 'langchain', 'autonomous'],
    icon: '🤖',
    navGroups: ['Learn'],
    navLabel: 'AI Agents & MCP',
  },
  {
    title: 'Local LLM on Mac (16 GB RAM)',
    description: 'Tips to run local LLMs efficiently on Apple Silicon Mac with 16 GB RAM — model selection, quantization, Ollama config, swap tuning',
    path: '#/local-llm-mac-tips',
    category: 'Hints',
    keywords: ['local', 'llm', 'mac', 'apple silicon', 'ollama', 'gemma', 'llama', 'quantization', 'gguf', 'inference', 'ram', '16gb', 'mac mini', 'local ai'],
    icon: '🍎',
    navGroups: ['Learn'],
    navLabel: 'Local LLM on Mac',
  },
  {
    title: 'Test Frameworks Comparison',
    description: 'Compare test automation frameworks and choose the right one',
    path: '#/test-frameworks-comparison',
    category: 'Hints',
    keywords: ['test', 'framework', 'comparison', 'playwright', 'cypress', 'selenium', 'jest', 'automation', 'e2e', 'unit'],
    icon: '⚖️',
    navGroups: ['Learn'],
    navLabel: 'Test Frameworks',
  },
  // -- divider in Learn --
  {
    title: 'Web Testing Checklist',
    description: 'Comprehensive checklist for web application testing',
    path: '#/web-testing-checklist',
    category: 'Checklists',
    keywords: ['web', 'testing', 'checklist', 'qa', 'browser', 'ui', 'functional', 'accessibility', 'security', 'performance'],
    icon: '✅',
    navGroups: ['Learn'],
    navLabel: 'Web Testing',
    dividerBefore: true,
  },
  {
    title: 'API Testing Checklist',
    description: 'Complete checklist for REST API and GraphQL testing',
    path: '#/api-testing-checklist',
    category: 'Checklists',
    keywords: ['api', 'testing', 'checklist', 'rest', 'graphql', 'http', 'security', 'performance', 'integration'],
    icon: '✅',
    navGroups: ['Learn'],
    navLabel: 'API Testing',
  },
  {
    title: 'Mobile Testing Checklist',
    description: 'Comprehensive checklist for iOS and Android mobile testing',
    path: '#/mobile-testing-checklist',
    category: 'Checklists',
    keywords: ['mobile', 'testing', 'checklist', 'ios', 'android', 'app', 'device', 'performance', 'accessibility'],
    icon: '✅',
    navGroups: ['Learn'],
    navLabel: 'Mobile Testing',
  },
  // -- divider in Learn --
  {
    title: 'Interactive Voice Response (IVR)',
    description: 'Technical guide for IVR systems',
    path: '#/ivr',
    category: 'Terms',
    keywords: ['ivr', 'interactive', 'voice', 'response', 'phone', 'telephony'],
    icon: '📚',
    navGroups: ['Learn'],
    navIcon: '📞',
    navLabel: 'IVR',
    dividerBefore: true,
  },
  {
    title: 'Busy Lamp Field (BLF)',
    description: 'Technical specifications for BLF',
    path: '#/blf',
    category: 'Terms',
    keywords: ['blf', 'busy', 'lamp', 'field', 'phone', 'status'],
    icon: '📚',
    navGroups: ['Learn'],
    navIcon: '💡',
    navLabel: 'BLF',
  },
  {
    title: 'Session Initiation Protocol (SIP)',
    description: 'SIP protocol documentation',
    path: '#/sip',
    category: 'Terms',
    keywords: ['sip', 'session', 'initiation', 'protocol', 'voip', 'telephony'],
    icon: '📚',
    navGroups: ['Learn'],
    navIcon: '📡',
    navLabel: 'SIP',
  },
  // -- divider in Learn --
  {
    title: 'CTFL v4 Practice Exams',
    description: 'Practice exams for ISTQB CTFL v4 certification',
    path: '#/ctfl',
    category: 'ISTQB',
    keywords: ['istqb', 'ctfl', 'certification', 'exam', 'practice', 'test', 'foundation', 'level'],
    icon: '📚',
    navGroups: ['Learn'],
    navIcon: '🎓',
    navLabel: 'ISTQB CTFL',
    dividerBefore: true,
  },

  // ── Palace (+ shared with Learn) ──────────────────────────────────────────
  {
    title: 'QA Palace',
    description: 'Spatial tool map — browse all QA Utils tools organised into themed palace rooms.',
    path: '#/palace',
    category: 'Navigation',
    keywords: ['palace', 'map', 'tools', 'rooms', 'spatial', 'memory', 'discover'],
    icon: '🏛️',
    navGroups: ['Palace'],
    navLabel: 'QA Palace',
    navIcon: '🗺️',
  },
  {
    title: 'My Palace',
    description: 'Your personal pinboard of favourite tools, organised into custom palace rooms.',
    path: '#/my-palace',
    category: 'Navigation',
    keywords: ['palace', 'pinned', 'saved', 'favourites', 'workflow', 'personal'],
    icon: '🏠',
    navGroups: ['Palace'],
  },
  {
    title: 'Flashcards',
    description: 'Spaced repetition flashcards for QA concepts using the SM-2 algorithm.',
    path: '#/flashcards',
    category: 'ISTQB',
    keywords: ['flashcard', 'spaced repetition', 'sm2', 'review', 'qa terms', 'memory'],
    icon: '🃏',
    navGroups: ['Learn', 'Palace'],
  },
  {
    title: 'Coverage Palace',
    description:
      'Visual heatmap of your test coverage across unit, integration, E2E, security, and more.',
    path: '#/coverage-palace',
    category: 'Testing Tools',
    keywords: ['coverage', 'palace', 'heatmap', 'unit', 'integration', 'e2e', 'security', 'spatial'],
    icon: '🗺️',
    navGroups: ['Palace'],
    navLabel: 'Coverage Palace',
  },
];
