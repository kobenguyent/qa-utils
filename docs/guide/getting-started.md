# Getting Started

QA Utils is a comprehensive collection of quality assurance tools and utilities designed to enhance your testing workflow. It's available as a web app, desktop app, and MCP server.

## Try It Online

The fastest way to get started is the live demo — no installation required:

🌐 **[Open QA Utils](https://kobenguyent.github.io/qa-utils/#/)**

## Local Development

### Prerequisites

- **Node.js 16+**
- Modern web browser with ES6+ support

### Install & Run

```bash
# Clone the repository
git clone https://github.com/kobenguyent/qa-utils.git
cd qa-utils

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run preview          # Preview production build

# Building
npm run build            # Production build
npm run build:github     # Build for GitHub Pages

# Testing
npm test                 # Run all tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Run ESLint
```

## What's Included

QA Utils provides **30+ tools** across several categories:

| Category | Examples |
|----------|----------|
| **Utility Tools** | JWT Debugger, Base64, JSON Formatter, UUID Generator, Password Generator, Timestamp Converter |
| **Testing Tools** | CI/CD Workflow Generator, Test Checklists, ISTQB Practice Exams, Test Code Converter |
| **API Clients** | REST Client, WebSocket Client, gRPC Client, Collection Manager |
| **AI-Powered** | AI Chat (multi-provider), Agent Mode, Prompt Enhancer, AI Website Tester |
| **Converters** | Color Converter, SQL Generator, HTML Renderer, Hash Generator |
| **Generators** | Lorem Ipsum, Dummy Data, QR Code, Sequence Diagrams |

## Next Steps

- [Installation Guide](/guide/installation) — Detailed setup for all platforms
- [Desktop App](/guide/desktop-app) — Cross-platform Electron app
- [MCP Server](/mcp-server) — Connect AI agents to QA tools
- [Agent Mode](/agent-mode) — Autonomous AI task execution
