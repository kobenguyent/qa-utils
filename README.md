# QA Utils 🚀

[![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/peternguyentr?country.x=DE&locale.x=en_US)
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/peternguyew)

A comprehensive collection of quality assurance tools and utilities designed to enhance your testing workflow. Built with modern React, TypeScript, and optimized for performance with comprehensive test coverage.

🌐 **[Live Demo](https://kobenguyent.github.io/qa-utils/#/)** | 📊 **219 Tests** | 🎯 **Mobile-First Design** | 🤖 **AI-Powered**

<img width="1310" height="780" alt="Screenshot 1" src="https://github.com/user-attachments/assets/667bf71d-84cc-4d30-bb1c-7b95fe37ceab" />

## ✨ Features

### 🛠️ Utility Tools

#### 🌐 JWT Debugger
Decode and analyze JSON Web Tokens with enhanced features:
- **Multi-line textarea** for handling long JWT tokens
- **📋 Paste from Clipboard** button for easy token input
- **🗑️ Clear functionality** to reset input quickly
- **Real-time validation** with expiration status
- **Syntax-highlighted decoded payload** display
- **Copy to clipboard** functionality for decoded data

![JWT Debugger](https://github.com/user-attachments/assets/5346ad83-e80a-414c-a563-cd33e9645c70)

#### 🚀 CI/CD Workflow Generator
Professional workflow generator supporting multiple platforms:
- **5 CI/CD Platforms**: GitHub Actions, GitLab CI, Azure DevOps, Jenkins, Bitbucket Pipelines
- **API & E2E Testing**: Configurable test types with multiple runners
- **Test Runner Support**: Playwright, Puppeteer, WebDriverIO, Cypress
- **Node.js Versions**: 16, 18, 20, 21 support
- **NPM Publishing**: Automated package publishing workflows
- **Real-time Preview**: Live preview with syntax highlighting
- **One-click Download**: Generate and download workflow files instantly
- **Comprehensive Instructions**: Detailed setup guidance for each platform

![CI/CD Workflow Generator](https://github.com/user-attachments/assets/84580edc-ab15-432c-a016-a26ea00f13d8)

#### 🌐 REST Client
Advanced REST API testing and development tool:
- **HTTP Methods**: Support for GET, POST, PUT, DELETE, HEAD requests
- **Curl Import**: Parse and import curl commands automatically
- **Request Builder**: Visual interface for building requests
- **Response Viewer**: Formatted JSON display with syntax highlighting
- **Request History**: Track and reload previous requests
- **Header Management**: Easy header editing and management
- **Copy Functionality**: Copy responses and export as curl commands

![REST Client](https://github.com/user-attachments/assets/rest-client-placeholder)

#### 🔌 WebSocket Client
Real-time WebSocket testing and debugging tool:
- **Real-time Connection**: Live WebSocket connection management
- **Auto-reconnect**: Configurable automatic reconnection with retry limits
- **Protocol Support**: Custom WebSocket protocols and subprotocols
- **Message History**: Complete conversation tracking with timestamps
- **Connection Status**: Visual indicators for connection state
- **Message Formatting**: JSON formatting and syntax highlighting
- **Copy Functionality**: Copy individual messages or entire conversations

#### ⚡ gRPC Client
Test gRPC services with browser-compatible gRPC-Web support:
- **gRPC-Web Protocol**: Browser-compatible gRPC communication
- **Unary Calls**: Standard request-response gRPC calls
- **Streaming Support**: Server streaming call handling
- **Protobuf Integration**: Parse .proto files for service discovery
- **Metadata Management**: Custom headers and gRPC metadata
- **Request History**: Track and reload previous gRPC calls
- **JSON Interface**: User-friendly JSON input for protobuf messages
- **Response Analysis**: Detailed response inspection with status codes

#### 🛸 Base64 Encode/Decode
Simple and efficient Base64 operations:
- **Bidirectional conversion** (encode/decode)
- **Clean interface** with instant results
- **Error handling** for invalid inputs
- **Copy functionality** for results

![Base64 Tool](https://github.com/user-attachments/assets/04c7fedc-0a31-4dd1-9acd-3d2751255ba0)

#### ﹛ JSON Formatter ﹜
Advanced JSON processing capabilities:
- **Pretty-print JSON** with syntax highlighting
- **Collapsible tree view** for large objects
- **Error detection** and validation
- **Copy to clipboard** functionality
- **Real-time formatting** as you type

#### ⏰ Unix Timestamp Converter
Convert between Unix timestamps and human-readable dates:
- **Bidirectional conversion** (timestamp ↔ date)
- **Multiple format support** (seconds/milliseconds)
- **Timezone handling** with local time display
- **Real-time conversion** with validation

#### 🤖 AI Chat (Enhanced)
Advanced AI chat interface with cutting-edge features:
- **Multi-Provider Support**: 
  - **OpenAI** - GPT-3.5, GPT-4, and more
  - **Anthropic Claude** - Claude 3 Opus, Sonnet, and Haiku
  - **Google Gemini** - Gemini Pro and Gemini 1.5 Pro
  - **Azure OpenAI** - Enterprise-grade OpenAI deployments
  - **Ollama** - Local LLMs (Llama 2, Mistral, CodeLlama, etc.)
- **Token Optimization**: 
  - Automatic token counting and display
  - Smart token compression to reduce API costs
  - Real-time token usage monitoring
- **Smart Prompt Engineering**:
  - Three system prompt types: Default, Technical, and Creative
  - Automatic context injection for enhanced responses
  - Optimized for better AI responses
- **Conversation Management**:
  - Multiple chat contexts with easy switching
  - Save and load conversation history
  - Export conversations (JSON/Markdown format)
  - Delete or rename conversations
- **MCP Tool Management**: Comprehensive tool enable/disable/load/unload system
  - 11 pre-configured default tools (file system, web, computation, data, utility)
  - Enable/disable individual tools or entire categories
  - Load custom tools from MCP servers
  - Import/export tool configurations
  - Real-time statistics (total, enabled, default, custom tools)
  - Complete usage guide with code examples
  - Custom MCP server support with auto-discovery
- **Knowledge Base & CAG**:
  - File upload support (.txt, .md, .json, .csv, .pdf)
  - Cache-Augmented Generation (CAG) for fast retrieval
  - Keyword-based search and metadata filtering
  - Large context window support (up to 1M tokens for Gemini 1.5)
- **Model Management**: Fetch and select from available models for each provider
- **Real-time Statistics**: Monitor cache usage, document count, and token usage

#### 🌠 Additional Tools
- **UUID Generator**: Generate UUIDs v1, v4 with copy functionality
- **JIRA Comment Generator**: Format comments for JIRA with markdown support
- **🌠 OTP Generator**: Generate time-based and counter-based OTP codes
- **🔐 Encryption/Decryption**: Multiple encryption algorithms support
- **🤖 Playwright to CodeceptJS Converter**: Convert Playwright tests to CodeceptJS format with dual conversion methods:
  - **Default Mode**: Fast regex-based conversion for common patterns
  - **AI-Powered Mode**: Context-aware conversion using AI providers (OpenAI, Anthropic, Google Gemini, Azure OpenAI, Ollama)
  - **Features**: API key persistence, connection testing, automatic fallback on errors
  - **Smart Conversion**: AI mode provides better handling of complex test scenarios

### 📚 Educational Resources

#### 💡 Hints
- **🔥💡 CodeceptJS Hints**: Best practices and tips for CodeceptJS testing

#### 📚 Technical Terms
- **Interactive Voice Response (IVR)**: Comprehensive guide
- **Busy Lamp Field (BLF)**: Technical specifications
- **Session Initiation Protocol (SIP)**: Protocol documentation

#### 📚 ISTQB Certification
- **CTFL v4 Practice Exams**: Interactive practice tests for certification preparation

## 🏗️ Technical Architecture

### 🎯 Performance Optimizations
- **Code splitting** with React.lazy for reduced bundle size
- **Lazy loading** of route components for faster initial load
- **Bundle optimization** with separate chunks
- **Performance monitoring** with Web Vitals
- **Mobile-first responsive design** with Bootstrap

### 🧪 Comprehensive Testing
- **273 test cases** across 18 test files
- **Component testing** with React Testing Library
- **Utility function testing** with comprehensive coverage
- **AI/ML features testing** with MCP, conversation management, and knowledge base tests
- **Multi-provider AI testing** for OpenAI, Anthropic, Google, Azure, and Ollama
- **Token optimization testing** for cost-effective AI usage
- **WebSocket & gRPC client testing** with mocked services
- **Integration tests** demonstrating real-world usage patterns
- **CI/CD integration** with automated testing on PRs
- **Coverage reporting** with detailed metrics

### 🔒 Security Features
- **XSS protection** with input sanitization
- **Content Security Policy** headers
- **Input validation** across all forms
- **Secure clipboard operations** with fallback support

### 📱 Mobile Experience
- **Mobile-first design** with responsive layouts
- **Touch-friendly interfaces** with proper target sizes
- **Progressive enhancement** for all devices
- **Accessibility compliance** with ARIA attributes

## 🤖 AI Provider Setup

The AI Chat feature supports multiple providers. Here's how to get started with each:

### OpenAI
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Generate an API key from the [API Keys page](https://platform.openai.com/api-keys)
3. Select "OpenAI" provider and enter your API key
4. Available models: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo

### Anthropic Claude
1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Generate an API key from your account settings
3. Select "Anthropic Claude" provider and enter your API key
4. Available models: Claude 3 Opus, Sonnet, Haiku (200K context window)

### Google Gemini
1. Sign up at [Google AI Studio](https://makersuite.google.com/)
2. Generate an API key from the [API Keys page](https://makersuite.google.com/app/apikey)
3. Select "Google Gemini" provider and enter your API key
4. Available models: Gemini Pro, Gemini Pro Vision, Gemini 1.5 Pro (up to 1M tokens)

### Azure OpenAI
1. Create an Azure OpenAI resource in Azure Portal
2. Deploy a model (e.g., gpt-35-turbo)
3. Get your API key and endpoint from the resource
4. Select "Azure OpenAI" provider and enter your credentials

### Ollama (Local)
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama2` (or mistral, codellama, etc.)
3. Set CORS environment variable:
   ```bash
   # macOS/Linux
   export OLLAMA_ORIGINS="https://kobenguyent.github.io"
   ollama serve
   
   # Windows PowerShell
   $env:OLLAMA_ORIGINS="https://kobenguyent.github.io"
   ollama serve
   ```
4. Select "Ollama (Local)" provider and use default endpoint

### 💡 Tips for Best Results
- **Token Optimization**: Enable to reduce costs by removing redundant whitespace
- **System Prompts**: Choose "Technical" for code/technical tasks, "Creative" for brainstorming
- **Conversation Management**: Save important chats for future reference
- **Knowledge Base**: Upload relevant documents to provide context to the AI
- **MCP Tools**: Connect MCP servers to give AI access to external tools and data

## 🔧 MCP Tool Management

The AI Chat includes a comprehensive MCP (Model Context Protocol) tool management system:

### Default Tools (11 Pre-configured)

**Filesystem Tools:**
- `read_file` - Read file contents
- `list_directory` - List directory contents
- `write_file` - Write to files

**Web Tools:**
- `fetch_url` - Fetch content from URLs
- `web_search` - Search the web

**Computation Tools:**
- `calculate` - Perform calculations
- `execute_code` - Execute code in sandbox

**Data Tools:**
- `parse_json` - Parse JSON data
- `query_database` - Query databases

**Utility Tools:**
- `generate_uuid` - Generate UUIDs
- `get_timestamp` - Get timestamps

### Tool Management Features

**Quick Actions:**
- 📥 Load Default Tools - Initialize 11 pre-configured tools
- ✅ Enable All Default - Enable all default tools at once
- ❌ Disable All - Disable all tools
- 💾 Export Config - Save tool configuration as JSON
- 📁 Import Config - Load tool configuration from file

**Per-Tool Control:**
- Enable/disable individual tools via checkboxes
- View tool descriptions and categories
- Track tool source (default vs custom)
- Real-time statistics (total, enabled, disabled)

**Custom MCP Servers:**
- Connect to external MCP servers
- Auto-discover and load server tools
- Disconnect to unload server tools
- Tools loaded from servers marked as "custom"

### Usage Example

```typescript
import { MCPToolManager } from './utils/mcpToolManager';

// Create manager
const manager = new MCPToolManager();

// Load default tools
manager.initializeDefaultTools();

// Enable specific tools
manager.enableTool('read_file');
manager.enableTool('web_search');

// Or enable all at once
manager.enableAllDefaultTools();

// Connect to custom server
const client = new MCPClient({ 
  name: 'my-server', 
  url: 'http://localhost:8080' 
});
await manager.loadToolsFromServer(client);

// Export configuration
const config = manager.exportConfig();
// Save to file...

// Import configuration
manager.importConfig(configJson);

// Get statistics
const stats = manager.getStats();
// { total: 15, enabled: 8, defaultTools: 11, customTools: 4 }
```

For the complete MCP Tool Management Guide, click "📖 View Complete MCP Tools Guide" in the AI Chat interface.

## 🚀 Getting Started

### Prerequisites
- **Bun** (recommended) or **Node.js 16+**
- Modern web browser with ES6+ support

### Installation & Development

#### With Bun (Recommended)

```bash
bun install && bun run dev
```

#### Alternative: With Node.js

```bash
npm install && npm run dev
```

The application will be available at: **http://localhost:5173/**

### Available Scripts

```bash
# Development server
bun run dev          # Start development server with hot reload

# Building
bun run build        # Build for production
bun run build:github # Build for GitHub Pages deployment

# Testing
bun test            # Run all tests
bun run test:ui     # Run tests with UI
bun run test:coverage # Generate coverage report

# Code Quality
bun run lint        # Run ESLint with TypeScript support
bun run preview     # Preview production build
```

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Bootstrap 5
- **Build System**: Vite with SWC for fast builds
- **Testing**: Vitest + React Testing Library (62 tests)
- **Package Manager**: Bun (with npm fallback)
- **Code Quality**: ESLint, TypeScript strict mode
- **CI/CD**: GitHub Actions with automated testing
- **Deployment**: GitHub Pages with automated workflows

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. **Write tests** for new features (maintain 100% coverage goal)
2. **Follow TypeScript strict mode** guidelines
3. **Use semantic commit messages** for clear change tracking
4. **Ensure mobile responsiveness** for all new components
5. **Add proper accessibility** attributes and keyboard navigation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💝 Support

If you find this project helpful, consider:
- ⭐ **Starring the repository**
- 🐛 **Reporting bugs** or requesting features
- 💰 **[Donating via PayPal](https://paypal.me/peternguyentr?country.x=DE&locale.x=en_US)**
- ☕ **[Buying me a coffee](https://www.buymeacoffee.com/peternguyew)**

Built with ❤️ for the testing community by [KobeT](https://github.com/kobenguyent)
