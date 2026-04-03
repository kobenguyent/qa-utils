---
layout: home

hero:
  name: "QA Utils"
  text: "Quality Assurance Tools & Utilities"
  tagline: A comprehensive collection of developer & QA tools — with MCP server integration and autonomous Agent Mode.
  image:
    src: /logo.svg
    alt: QA Utils
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Live Demo
      link: https://kobenguyent.github.io/qa-utils/#/
    - theme: alt
      text: GitHub
      link: https://github.com/kobenguyent/qa-utils

features:
  - icon: 🛠️
    title: 30+ Utility Tools
    details: JWT debugger, Base64, JSON formatter, UUID generator, password generator, timestamp converter, SQL generator, and many more.
  - icon: 🤖
    title: Agent Mode
    details: Autonomous AI agent that plans and executes multi-step tasks using available QA tools in an observe-think-act loop.
  - icon: 🔌
    title: MCP Server
    details: Model Context Protocol server exposing 15 tools to AI agents like Claude Desktop, Cursor, and other MCP-compatible clients.
  - icon: 🧪
    title: Testing Resources
    details: CI/CD workflow generator, test checklists, ISTQB practice exams, test framework comparison, and test code converter.
  - icon: 💬
    title: AI Chat & Assistants
    details: Multi-provider AI chat (OpenAI, Claude, Gemini, Azure, Ollama) with knowledge base, token optimization, and MCP tool management.
  - icon: 💻
    title: Desktop App
    details: Cross-platform Electron app for macOS, Windows, and Linux — no CORS restrictions, offline capable.
  - icon: 🌐
    title: API Clients
    details: REST client, WebSocket client, gRPC client, and Collection Manager for API testing and development.
  - icon: 📊
    title: 760+ Tests
    details: Comprehensive test coverage with Vitest and React Testing Library, including shared tools, agent executor, and MCP server tests.
---

## Quick Start

### Web App

Visit the [live demo](https://kobenguyent.github.io/qa-utils/#/) — no installation needed.

### Local Development

```bash
npm install && npm run dev
```

### MCP Server

```bash
cd mcp-server && npm install && npm run build
```

Then add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "qa-utils": {
      "command": "node",
      "args": ["/path/to/qa-utils/mcp-server/dist/mcp-server/src/index.js"]
    }
  }
}
```

See the [MCP Server guide](/mcp-server) for full setup instructions.
