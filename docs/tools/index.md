# Tools Overview

KobeanQAUtils provides **47+ tools** organized into categories. Each tool is accessible from the web UI, and many are also available through the [MCP Server](/mcp-server) or [CLI](/guide/cli) for scripting and AI agent integration.

## Categories

### 🔄 Converters & Generators
General-purpose developer and QA utilities — format converters, data generators, and developer helpers.

➡️ [Utility Tools](/tools/utility-tools)

### 🧪 API Testing & Testing Resources
API clients, testing workflow tools, learning resources, and certification practice.

➡️ [Testing Tools](/tools/testing-tools)

### 🤖 AI-Powered Tools
AI-enhanced tools for intelligent assistance, autonomous agent execution, and prompt engineering.

➡️ [AI-Powered Tools](/tools/ai-tools)

---

## Complete Quick Reference

### 🔄 Converters & Formatters

| Tool | Route | MCP | CLI | Description |
|------|-------|:---:|:---:|-------------|
| JWT Debugger | `/jwtDebugger` | ✅ `decode_jwt` | ✅ | Decode & inspect JSON Web Tokens |
| Base64 Encode/Decode | `/base64` | ✅ `base64_encode/decode` | ✅ | Bidirectional Base64 encoding |
| JSON Formatter | `/jsonFormatter` | ✅ `format_json` | ✅ | Pretty-print, validate, minify JSON |
| Unix Timestamp | `/timestamp` | ✅ `convert_timestamp` | ✅ | Unix epoch ↔ human-readable date |
| Color Converter | `/color-converter` | ✅ `convert_color` | ✅ | HEX↔RGB↔HSL↔HSV↔CMYK↔LAB + WCAG |
| SQL Generator | `/sql-generator` | ✅ `generate_sql` | ✅ | Visual SQL query builder |
| HTML Renderer | `/html-renderer` | ✅ `sanitize_html` | — | Live HTML preview & sanitizer |
| Media Converter | `/media-converter` | — | — | Image↔PDF, PNG↔JPEG, background removal |
| Markdown → Confluence | `/markdown-to-confluence` | ✅ `convert_markdown_to_confluence` | ✅ | Markdown to Confluence Wiki markup |

### 🎲 Generators

| Tool | Route | MCP | CLI | Description |
|------|-------|:---:|:---:|-------------|
| UUID Generator | `/uuid` | ✅ `generate_uuid` | ✅ | UUID v1 and v4, bulk generation |
| OTP Generator | `/otp` | — | — | TOTP/HOTP + QR code for authenticator apps |
| Password Generator | `/password` | ✅ `generate_password` | ✅ | Cryptographically secure passwords |
| Hash Generator | `/hash` | ✅ `generate_hash` | ✅ | MD5, SHA-1/256/384/512, HMAC |
| HTPasswd Generator | `/htpasswd` | — | — | Apache/Nginx basic auth entries |
| Lorem Ipsum | `/lorem-ipsum` | ✅ `generate_lorem_ipsum` | ✅ | Placeholder text generator |
| JIRA Comment | `/jiraComment` | — | — | Formatted JIRA Wiki Markup comments |
| Character Counter | `/character-counter` | ✅ `count_characters` | ✅ | Words, chars, reading time, keyword density |
| Test File Generator | `/test-file-generator` | — | — | Generate PNG/PDF/WAV/CSV/ZIP test files |
| GitHub PR Script | `/github-pr-generator` | — | — | Bash script for full PR workflow |
| QR Code Generator | `/qr-code` | — | — | URL, Wi-Fi, vCard, SMS, Geo QR codes |
| Dummy Data Generator | `/dummy-data` | — | — | Fake names, emails, addresses (JSON/CSV/SQL) |

### 🌐 API Clients

| Tool | Route | MCP | CLI | Description |
|------|-------|:---:|:---:|-------------|
| REST Client | `/rest-client` | — | — | HTTP requests, curl import, history |
| GraphQL Client | `/graphql-client` | — | ✅ | Queries, mutations, introspection |
| WebSocket Client | `/websocket-client` | — | — | Real-time WS testing, auto-reconnect |
| gRPC Client | `/grpc-client` | — | — | gRPC-Web unary & streaming, .proto parsing |
| Collection Manager | `/collection-manager` | — | — | Postman/Insomnia/Thunder Client import/export |
| Collection Visualizer | `/collection-visualizer` | — | — | Interactive tree view of API collections |

### 🔧 Developer Tools

| Tool | Route | MCP | CLI | Description |
|------|-------|:---:|:---:|-------------|
| Image Editor | `/image-editor` | — | — | Filters, transforms, compression |
| File Processor | `/file-processor` | — | — | Batch resize, compress, convert images |
| Encryption/Decryption | `/encryption` | — | — | AES-256-GCM/CBC in-browser encryption |
| Test Code Converter | `/playwright2codecept` | — | — | Playwright → CodeceptJS (regex or AI) |
| Sequence Diagram | `/sequence-diagram` | — | — | Mermaid diagrams from test code |
| CI/CD Workflow Gen | `/workflow-generator` | — | — | GitHub Actions, GitLab CI, Jenkins, etc. |
| Kanban Board | `/kanban` | — | — | Drag-and-drop task management |
| Website Scanner | `/website-scanner` | — | — | Broken links, SEO, accessibility, security |

### 🤖 AI Tools

| Tool | Route | MCP | CLI | Description |
|------|-------|:---:|:---:|-------------|
| Kobean AI Chat | `/kobean` | — | ✅ | Multi-provider AI chat with knowledge base |
| Prompt Enhancer | `/prompt-enhancer` | — | — | Transform basic prompts into detailed ones |
| JSON Prompt Builder | `/json-prompt-builder` | — | ✅ | Build/export AI prompts for OpenAI/Anthropic/Gemini |
| Agent Mode | `/agent` | — | ✅ | Autonomous observe-think-act AI agent |
| Agent Manager | `/agent-manager` | — | — | Named agent profiles & run history |
| AI Website Tester | `/ai-website-tester` | — | — | AI-powered functional/UI/security testing |

### 📚 Learning & Reference

| Tool | Route | MCP | CLI | Description |
|------|-------|:---:|:---:|-------------|
| Testing Cheat Sheet | `/codeceptjs` | — | — | Playwright, Pytest, Cypress, Jest, Vitest & more |
| Command Book | `/command-book` | — | — | Git, Docker, Bash, CodeceptJS reference |
| AI Instructions Guide | `/ai-instructions` | — | — | System prompt best practices for AI assistants |
| Test Frameworks Compare | `/test-frameworks-comparison` | — | — | Side-by-side framework comparison |
| API Types Guide | `/api-types-guide` | — | — | REST/GraphQL/gRPC/WS/SOAP/SSE/Webhook/MQTT |
| CI/CD Infographic | `/cicd-infographic` | — | — | Visual CI/CD pipeline guide |
| AI Agents & MCP Infographic | `/ai-agents-infographic` | — | — | AI agent & MCP architecture visual guide |
| Local LLM on Mac | `/local-llm-mac-tips` | — | — | Run LLMs on Apple Silicon 16 GB |
| Web Testing Checklist | `/web-testing-checklist` | — | — | Functional, accessibility, security, SEO |
| API Testing Checklist | `/api-testing-checklist` | — | — | REST & GraphQL testing checklist |
| Mobile Testing Checklist | `/mobile-testing-checklist` | — | — | iOS & Android testing checklist |
| CTFL v4 Practice Exams | `/ctfl` | — | — | ISTQB Foundation Level practice tests |
| Flashcards | `/flashcards` | — | — | Spaced-repetition QA flashcards (SM-2) |
| IVR Reference | `/ivr` | — | — | Interactive Voice Response technical guide |
| BLF Reference | `/blf` | — | — | Busy Lamp Field technical specs |
| SIP Reference | `/sip` | — | — | Session Initiation Protocol guide |

### 🏛️ Palace

| Tool | Route | Description |
|------|-------|-------------|
| QA Palace | `/palace` | Spatial map of all tools in themed rooms |
| My Palace | `/my-palace` | Personal pinboard of favourite tools |
| Coverage Palace | `/coverage-palace` | Visual heatmap of test coverage dimensions |

---

::: tip MCP & CLI columns
- **MCP** — available via the [MCP Server](/mcp-server) for AI agent integration (Claude Desktop, Cursor, etc.)
- **CLI** — available via `kobeanqautils-cli` for terminal scripting and automation. See the [CLI Guide](/guide/cli).
:::

