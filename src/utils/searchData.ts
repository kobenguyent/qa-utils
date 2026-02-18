/**
 * Search Data - Contains all searchable pages and tools
 */

export interface SearchItem {
  title: string;
  description: string;
  path: string;
  category: string;
  keywords: string[];
  icon: string;
}

export const searchData: SearchItem[] = [
  // Home
  {
    title: 'Home',
    description: 'QA Utils homepage with all tools',
    path: '#/',
    category: 'Navigation',
    keywords: ['home', 'start', 'main', 'index'],
    icon: '🏠'
  },

  // Hints
  {
    title: 'CodeceptJS Hints',
    description: 'Best practices and tips for CodeceptJS testing',
    path: '#/codeceptjs',
    category: 'Hints',
    keywords: ['codeceptjs', 'hints', 'tips', 'best practices', 'testing'],
    icon: '🔥💡'
  },
  {
    title: 'Web Testing Checklist',
    description: 'Comprehensive checklist for web application testing',
    path: '#/web-testing-checklist',
    category: 'Checklists',
    keywords: ['web', 'testing', 'checklist', 'qa', 'browser', 'ui', 'functional', 'accessibility', 'security', 'performance'],
    icon: '✅'
  },
  {
    title: 'API Testing Checklist',
    description: 'Complete checklist for REST API and GraphQL testing',
    path: '#/api-testing-checklist',
    category: 'Checklists',
    keywords: ['api', 'testing', 'checklist', 'rest', 'graphql', 'http', 'security', 'performance', 'integration'],
    icon: '✅'
  },
  {
    title: 'Mobile Testing Checklist',
    description: 'Comprehensive checklist for iOS and Android mobile testing',
    path: '#/mobile-testing-checklist',
    category: 'Checklists',
    keywords: ['mobile', 'testing', 'checklist', 'ios', 'android', 'app', 'device', 'performance', 'accessibility'],
    icon: '✅'
  },
  {
    title: 'CI/CD Infographic',
    description: 'Visual guide to Continuous Integration and Continuous Deployment',
    path: '#/cicd-infographic',
    category: 'Hints',
    keywords: ['cicd', 'ci', 'cd', 'continuous', 'integration', 'deployment', 'pipeline', 'devops', 'automation'],
    icon: '🔄'
  },
  {
    title: 'AI Agents & MCP Infographic',
    description: 'Visual guide to AI Agents and Model Context Protocol',
    path: '#/ai-agents-infographic',
    category: 'Hints',
    keywords: ['ai', 'agents', 'mcp', 'model', 'context', 'protocol', 'llm', 'tools', 'langchain', 'autonomous'],
    icon: '🤖'
  },
  {
    title: 'Test Frameworks Comparison',
    description: 'Compare test automation frameworks and choose the right one',
    path: '#/test-frameworks-comparison',
    category: 'Hints',
    keywords: ['test', 'framework', 'comparison', 'playwright', 'cypress', 'selenium', 'jest', 'automation', 'e2e', 'unit'],
    icon: '⚖️'
  },

  // Terms
  {
    title: 'Interactive Voice Response (IVR)',
    description: 'Technical guide for IVR systems',
    path: '#/ivr',
    category: 'Terms',
    keywords: ['ivr', 'interactive', 'voice', 'response', 'phone', 'telephony'],
    icon: '📚'
  },
  {
    title: 'Busy Lamp Field (BLF)',
    description: 'Technical specifications for BLF',
    path: '#/blf',
    category: 'Terms',
    keywords: ['blf', 'busy', 'lamp', 'field', 'phone', 'status'],
    icon: '📚'
  },
  {
    title: 'Session Initiation Protocol (SIP)',
    description: 'SIP protocol documentation',
    path: '#/sip',
    category: 'Terms',
    keywords: ['sip', 'session', 'initiation', 'protocol', 'voip', 'telephony'],
    icon: '📚'
  },

  // Converters & Formatters
  {
    title: 'JWT Debugger',
    description: 'Decode and analyze JSON Web Tokens',
    path: '#/jwtDebugger',
    category: 'Converters & Formatters',
    keywords: ['jwt', 'json', 'web', 'token', 'decode', 'debugger', 'auth', 'authentication'],
    icon: '🔑'
  },
  {
    title: 'Base64 Encode/Decode',
    description: 'Convert text to/from Base64 encoding',
    path: '#/base64',
    category: 'Converters & Formatters',
    keywords: ['base64', 'encode', 'decode', 'conversion', 'encoding'],
    icon: '🛸'
  },
  {
    title: 'Unix Timestamp Converter',
    description: 'Convert Unix timestamps to readable dates',
    path: '#/timestamp',
    category: 'Converters & Formatters',
    keywords: ['unix', 'timestamp', 'time', 'date', 'converter', 'epoch'],
    icon: '⏰'
  },
  {
    title: 'JSON Formatter',
    description: 'Format and validate JSON data',
    path: '#/jsonFormatter',
    category: 'Converters & Formatters',
    keywords: ['json', 'format', 'formatter', 'validate', 'pretty', 'beautify'],
    icon: '﹛﹜'
  },
  {
    title: 'Color Converter',
    description: 'Convert between color formats (HEX, RGB, HSL, HSV, CMYK, LAB) with palette generation and accessibility analysis',
    path: '#/color-converter',
    category: 'Converters & Formatters',
    keywords: ['color', 'converter', 'hex', 'rgb', 'hsl', 'hsv', 'cmyk', 'lab', 'palette', 'accessibility', 'contrast', 'wcag', 'colorblind'],
    icon: '🎨'
  },
  {
    title: 'Website Scanner',
    description: 'Comprehensive website analysis for broken links, accessibility, performance, SEO, and security issues',
    path: '#/website-scanner',
    category: 'Testing Tools',
    keywords: ['website', 'scanner', 'audit', 'broken', 'links', 'accessibility', 'performance', 'seo', 'security', 'lighthouse', 'wcag', 'crawl'],
    icon: '🔍'
  },
  {
    title: 'File Processor',
    description: 'Resize, compress, and convert images and documents with smart optimization',
    path: '#/file-processor',
    category: 'Utilities',
    keywords: ['file', 'processor', 'image', 'resize', 'compress', 'convert', 'document', 'pdf', 'optimization', 'batch'],
    icon: '📁'
  },
  {
    title: 'SQL Command Generator',
    description: 'Generate SQL commands with a visual interface',
    path: '#/sql-generator',
    category: 'Converters & Formatters',
    keywords: ['sql', 'query', 'generator', 'database', 'select', 'insert', 'update', 'delete', 'create', 'table'],
    icon: '🗄️'
  },
  {
    title: 'HTML Renderer',
    description: 'Preview and render HTML code in real-time',
    path: '#/html-renderer',
    category: 'Converters & Formatters',
    keywords: ['html', 'render', 'preview', 'viewer', 'markup', 'web', 'display'],
    icon: '🌐'
  },
  {
    title: 'Media Converter',
    description: 'Convert between image formats and PDF documents (Image ↔ PDF, PNG ↔ JPEG), remove backgrounds',
    path: '#/media-converter',
    category: 'Converters & Formatters',
    keywords: ['media', 'converter', 'image', 'pdf', 'png', 'jpeg', 'webp', 'gif', 'convert', 'format', 'photo', 'background', 'remove', 'transparent', 'cutout'],
    icon: '🔄'
  },
  {
    title: 'Image Editor',
    description: 'Edit photos with filters, rotation, brightness, contrast, and more',
    path: '#/image-editor',
    category: 'Converters & Formatters',
    keywords: ['image', 'editor', 'photo', 'edit', 'filter', 'rotate', 'brightness', 'contrast', 'saturation', 'blur', 'grayscale', 'sepia', 'flip', 'transform', 'compress'],
    icon: '🎨'
  },

  // Generators
  {
    title: 'UUID Generator',
    description: 'Generate UUIDs v1 and v4',
    path: '#/uuid',
    category: 'Generators',
    keywords: ['uuid', 'guid', 'generate', 'unique', 'identifier'],
    icon: '🆔'
  },
  {
    title: 'OTP Generator',
    description: 'Generate time-based and counter-based OTP codes',
    path: '#/otp',
    category: 'Generators',
    keywords: ['otp', 'one-time', 'password', 'totp', 'hotp', 'authenticator', '2fa'],
    icon: '🔐'
  },
  {
    title: 'Password Generator',
    description: 'Generate secure random passwords with customizable options',
    path: '#/password',
    category: 'Generators',
    keywords: ['password', 'generate', 'random', 'secure', 'strength', 'credentials'],
    icon: '🔑'
  },
  {
    title: 'Hash Generator',
    description: 'Generate cryptographic hashes (SHA-256, SHA-512, SHA-1)',
    path: '#/hash',
    category: 'Generators',
    keywords: ['hash', 'sha', 'sha256', 'sha512', 'sha1', 'md5', 'crypto', 'checksum'],
    icon: '🔐'
  },
  {
    title: 'HTPasswd Generator',
    description: 'Generate htpasswd entries for HTTP basic authentication',
    path: '#/htpasswd',
    category: 'Generators',
    keywords: ['htpasswd', 'apache', 'nginx', 'http', 'basic', 'auth', 'authentication', 'password'],
    icon: '🔒'
  },
  {
    title: 'GitHub PR Script Generator',
    description: 'Generate bash scripts for creating GitHub pull requests with full git workflow',
    path: '#/github-pr-generator',
    category: 'Generators',
    keywords: ['github', 'pull request', 'pr', 'git', 'bash', 'script', 'workflow', 'automation', 'cli'],
    icon: '🚀'
  },
  {
    title: 'Lorem Ipsum Generator',
    description: 'Generate placeholder text for designs and mockups',
    path: '#/lorem-ipsum',
    category: 'Generators',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy', 'filler', 'generator'],
    icon: '📝'
  },
  {
    title: 'JIRA Comment Generator',
    description: 'Format comments for JIRA with markdown',
    path: '#/jiraComment',
    category: 'Generators',
    keywords: ['jira', 'comment', 'generator', 'markdown', 'format', 'atlassian'],
    icon: '📋'
  },
  {
    title: 'Character Counter',
    description: 'Count characters, words, and lines in text',
    path: '#/character-counter',
    category: 'Generators',
    keywords: ['character', 'counter', 'word', 'count', 'text', 'length'],
    icon: '🔢'
  },
  {
    title: 'Test File Generator',
    description: 'Generate test files like images, documents, and audio files for testing',
    path: '#/test-file-generator',
    category: 'Generators',
    keywords: ['test', 'file', 'generator', 'image', 'document', 'audio', 'png', 'jpg', 'pdf', 'wav', 'download'],
    icon: '📁'
  },
  {
    title: 'QR Code Generator',
    description: 'Generate static and dynamic QR codes for URLs, WiFi, vCards, email, SMS, and more',
    path: '#/qr-code',
    category: 'Generators',
    keywords: ['qr', 'qrcode', 'barcode', 'generator', 'url', 'wifi', 'vcard', 'contact', 'email', 'sms', 'phone', 'static', 'dynamic'],
    icon: '📱'
  },
  {
    title: 'Dummy Data Generator',
    description: 'Generate fake data for testing: names, emails, addresses, phone numbers, and more',
    path: '#/dummy-data',
    category: 'Generators',
    keywords: ['dummy', 'fake', 'data', 'generator', 'mock', 'test', 'name', 'email', 'address', 'phone', 'person', 'company', 'falso', 'faker'],
    icon: '🎭'
  },
  {
    title: 'Kanban Board',
    description: 'Visual task management with drag-and-drop columns for organizing projects',
    path: '#/kanban',
    category: 'Developer Tools',
    keywords: ['kanban', 'board', 'task', 'project', 'management', 'todo', 'agile', 'scrum', 'drag', 'drop', 'cards', 'columns'],
    icon: '📋'
  },
  {
    title: 'Command Book',
    description: 'Hands-on reference for Git, Docker, Bash, and CodeceptJS commands',
    path: '#/command-book',
    category: 'Developer Tools',
    keywords: ['command', 'book', 'git', 'github', 'cli', 'docker', 'bash', 'script', 'codeceptjs', 'reference', 'cheatsheet', 'snippet'],
    icon: '📖'
  },

  // API Testing
  {
    title: 'REST Client',
    description: 'Test REST APIs with HTTP requests',
    path: '#/rest-client',
    category: 'API Testing',
    keywords: ['rest', 'api', 'http', 'client', 'request', 'get', 'post', 'put', 'delete', 'curl'],
    icon: '🌐'
  },
  {
    title: 'WebSocket Client',
    description: 'Test WebSocket connections in real-time',
    path: '#/websocket-client',
    category: 'API Testing',
    keywords: ['websocket', 'ws', 'real-time', 'socket', 'client', 'connection'],
    icon: '🔌'
  },
  {
    title: 'gRPC Client',
    description: 'Test gRPC services with gRPC-Web',
    path: '#/grpc-client',
    category: 'API Testing',
    keywords: ['grpc', 'protobuf', 'rpc', 'client', 'api', 'testing'],
    icon: '⚡'
  },
  {
    title: 'Collection Manager',
    description: 'Parse, edit, and convert API collections between Postman, Insomnia, Thunder Client, and more',
    path: '#/collection-manager',
    category: 'API Testing',
    keywords: ['collection', 'postman', 'insomnia', 'thunder', 'client', 'api', 'convert', 'import', 'export', 'variables', 'environment', 'bulk', 'edit'],
    icon: '📦'
  },
  // AI Tools
  {
    title: 'Kobean Assistant',
    description: 'AI-powered assistant with tool execution and multi-provider support (OpenAI, Anthropic, Google, and more)',
    path: '#/kobean',
    category: 'AI Tools',
    keywords: ['ai', 'chat', 'gpt', 'openai', 'claude', 'gemini', 'llm', 'chatbot', 'assistant', 'kobean'],
    icon: '🤖'
  },
  {
    title: 'Prompt Enhancer',
    description: 'Transform basic prompts into detailed, structured versions for AI models',
    path: '#/prompt-enhancer',
    category: 'AI Tools',
    keywords: ['prompt', 'enhancer', 'ai', 'chatgpt', 'claude', 'gemini', 'llm', 'text', 'json', 'toon', 'format', 'enhance'],
    icon: '✨'
  },

  // Developer Tools
  {
    title: 'Encryption/Decryption',
    description: 'Encrypt and decrypt text with various algorithms',
    path: '#/encryption',
    category: 'Developer Tools',
    keywords: ['encryption', 'decryption', 'encrypt', 'decrypt', 'security', 'cipher', 'aes'],
    icon: '🔒'
  },
  {
    title: 'Playwright to CodeceptJS',
    description: 'Convert Playwright tests to CodeceptJS format',
    path: '#/playwright2codecept',
    category: 'Developer Tools',
    keywords: ['playwright', 'codeceptjs', 'convert', 'migration', 'test', 'automation'],
    icon: '🤖'
  },
  {
    title: 'Sequence Diagram Generator',
    description: 'Generate sequence diagrams from CodeceptJS or Playwright test code',
    path: '#/sequence-diagram',
    category: 'Developer Tools',
    keywords: ['sequence', 'diagram', 'mermaid', 'codeceptjs', 'playwright', 'test', 'flow', 'visualization', 'uml'],
    icon: '📊'
  },
  {
    title: 'Playwright Trace Viewer',
    description: 'Upload and visualize Playwright trace ZIP files — inspect actions, network requests, and screenshots',
    path: '#/playwright-trace-viewer',
    category: 'Developer Tools',
    keywords: ['playwright', 'trace', 'viewer', 'zip', 'test', 'actions', 'network', 'screenshot', 'debug', 'e2e', 'automation'],
    icon: '🎭'
  },
  {
    title: 'CI/CD Workflow Generator',
    description: 'Generate CI/CD workflows for GitHub Actions, GitLab, and more',
    path: '#/workflow-generator',
    category: 'Developer Tools',
    keywords: ['ci', 'cd', 'workflow', 'github', 'actions', 'gitlab', 'jenkins', 'pipeline', 'automation'],
    icon: '🚀'
  },

  // ISTQB
  {
    title: 'CTFL v4 Practice Exams',
    description: 'Practice exams for ISTQB CTFL v4 certification',
    path: '#/ctfl',
    category: 'ISTQB',
    keywords: ['istqb', 'ctfl', 'certification', 'exam', 'practice', 'test', 'foundation', 'level'],
    icon: '📚'
  }
];

/**
 * Search function with fuzzy matching
 */
export const searchItems = (query: string): SearchItem[] => {
  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const tokens = lowerQuery.split(/\s+/);

  return searchData
    .map(item => {
      let score = 0;

      // Exact title match - highest priority
      if (item.title.toLowerCase() === lowerQuery) {
        score += 100;
      }

      // Title starts with query
      if (item.title.toLowerCase().startsWith(lowerQuery)) {
        score += 50;
      }

      // Title contains query
      if (item.title.toLowerCase().includes(lowerQuery)) {
        score += 30;
      }

      // Check each token
      tokens.forEach(token => {
        // Category match
        if (item.category.toLowerCase().includes(token)) {
          score += 10;
        }

        // Keyword match
        if (item.keywords.some(kw => kw.includes(token))) {
          score += 15;
        }

        // Description match
        if (item.description.toLowerCase().includes(token)) {
          score += 5;
        }
      });

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 10); // Return top 10 results
};
