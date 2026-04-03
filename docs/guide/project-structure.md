# Project Structure

An overview of the QA Utils repository layout and architecture.

## Repository Layout

```
qa-utils/
├── src/                          # React application source
│   ├── components/               # React components
│   │   ├── utils/                # Tool components (AgentMode, etc.)
│   │   └── __tests__/            # Component tests
│   ├── utils/                    # Utility modules
│   │   ├── sharedTools.ts        # Platform-agnostic tool implementations
│   │   ├── defaultTools.ts       # UI tool registry
│   │   ├── agentExecutor.ts      # Agent Mode executor
│   │   ├── toolRegistry.ts       # Tool registry system
│   │   ├── aiChatClient.ts       # AI provider integrations
│   │   ├── helpers.ts            # General helper functions
│   │   └── __tests__/            # Utility tests
│   ├── main.tsx                  # Application entry & routing
│   └── styles/                   # CSS styles
├── mcp-server/                   # MCP server package
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   └── tools.ts              # Node.js-specific tool wrappers
│   ├── tests/                    # MCP server tests
│   ├── package.json
│   └── tsconfig.json
├── docs/                         # Documentation (VitePress)
├── electron/                     # Electron desktop app
│   ├── main.js                   # Main process
│   └── preload.js                # Preload script
├── public/                       # Static assets
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Test configuration
└── package.json                  # Project dependencies & scripts
```

## Key Architecture Decisions

### Shared Tool Implementations

Platform-agnostic tool logic lives in `src/utils/sharedTools.ts` and is shared between:

- **MCP Server** (`mcp-server/src/tools.ts`) — Wraps shared functions with Node.js crypto/Buffer APIs
- **UI Tools** (`src/utils/defaultTools.ts`) — Wraps shared functions with browser APIs

This avoids code duplication while allowing platform-specific implementations where needed (e.g., cryptographic operations).

```
┌─────────────────────┐     ┌──────────────────────┐
│   MCP Server        │     │   Web UI / Electron   │
│   (Node.js)         │     │   (Browser)           │
│                     │     │                       │
│ mcp-server/tools.ts │     │ src/defaultTools.ts   │
│   ↓ imports         │     │   ↓ imports           │
└──────────┬──────────┘     └──────────┬────────────┘
           │                           │
           └───────────┬───────────────┘
                       │
              ┌────────┴────────┐
              │ sharedTools.ts  │
              │ (platform-      │
              │  agnostic)      │
              └─────────────────┘
```

### Tool Registry

The tool registry (`src/utils/toolRegistry.ts`) provides a centralized system for:

- Registering tools with metadata (name, description, parameters)
- Executing tools by ID with parameter validation
- Listing available tools for the Agent Mode system prompt

### AI Provider Abstraction

The AI chat client (`src/utils/aiChatClient.ts`) provides a unified interface for multiple providers:

- OpenAI / Azure OpenAI
- Anthropic Claude
- Google Gemini
- Ollama (local)

Configuration is stored in session storage and shared between AI Chat and Agent Mode.

## Build System

- **Vite** — Fast development server and production bundler
- **SWC** — Rust-based TypeScript/JSX compilation
- **Vitest** — Vite-native test runner
- **ESLint** — Code quality enforcement
