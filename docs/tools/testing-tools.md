# Testing Tools

Tools for API testing, QA workflows, learning resources, and certification practice.

---

## 🌐 API Clients

### 🌐 REST Client

Advanced HTTP API testing and development tool.

- **Methods:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **cURL import** — paste a curl command and it's automatically parsed into the request builder
- **Request builder** — URL, query params, headers, body (raw JSON, form-data, x-www-form-urlencoded)
- **Auth helpers** — Bearer token, Basic auth, API key header
- **Response viewer** — status code, headers, body with syntax highlighting and JSON tree view
- **Request history** — re-run any previous request
- **Export as curl** — copy the current request as a curl command

**Route:** `/rest-client`

---

### ⬡ GraphQL Client

Full-featured GraphQL query and mutation client with schema introspection.

- **Query & Mutation execution** — write queries with variables and execute against any endpoint
- **Schema introspection** — auto-discover all types, queries, mutations, and subscriptions from the server
- **Variables editor** — JSON editor with validation for GraphQL variables
- **Custom headers** — add Authorization and any request headers
- **Built-in example queries** — pre-loaded queries against public APIs (Countries API, Rick & Morty API)
- **Response viewer** — syntax-highlighted JSON with status code and duration
- **GraphQL-level error display** — shows field-level errors with location info
- **Operation name** support for multi-operation documents

**Route:** `/graphql-client`

---

### 🔌 WebSocket Client

Real-time WebSocket connection testing and debugging.

- **Live connection management** — connect, disconnect, reconnect
- **Auto-reconnect** with configurable retry count and delay
- **Custom protocol** header support
- **Message history** with timestamps and direction (sent/received)
- **JSON message formatting** — auto-pretty-print JSON payloads
- **Connection status indicators** — connected, disconnected, reconnecting
- Send raw text or JSON messages

**Route:** `/websocket-client`

---

### ⚡ gRPC Client

Test gRPC services from the browser using gRPC-Web.

- **Unary calls** — request/response with full metadata
- **Server streaming** — receive a stream of responses and display them live
- **Protobuf `.proto` file parsing** — paste your proto definition to get type-safe request building
- **Custom metadata headers** (equivalent to gRPC metadata)
- **Request history** with full request/response pairs
- Response analysis with gRPC status codes and trailers

**Route:** `/grpc-client`

---

### 📦 Collection Manager

Unified API collection management supporting multiple collection formats.

- **Import formats:** Postman (v2.0, v2.1), Insomnia (v4), Thunder Client, `.env` files, CSV, raw JSON
- **Export formats:** Postman v2.1, Insomnia v4, Thunder Client, raw JSON
- **Multi-collection support** — work with multiple collections simultaneously
- **Format auto-detection** — drop a file and the format is identified automatically
- **Persistent storage** via IndexedDB — collections survive page refresh
- **Inline editing** — edit request name, method, URL, headers, body directly in the UI
- **Variable rendering** — `{{variableName}}` placeholders resolved from the active environment
- **Autocomplete** for environment variables in URL and header fields
- **Drag & drop reordering** of requests and folders
- **Bulk operations** — select multiple requests for batch delete or export

**Route:** `/collection-manager`

---

### 🗺️ Collection Visualizer

Visualize any API collection as an interactive tree diagram.

- **Supported formats:** Postman, Insomnia, Thunder Client (same as Collection Manager)
- **Tree view** — folders and requests rendered as an expandable/collapsible tree
- **Method badges** — colour-coded HTTP method labels (GET, POST, PUT, DELETE, etc.)
- **Folder nesting** — unlimited depth
- Click any request to see its full URL and method
- Useful for documenting and reviewing large collections at a glance

**Route:** `/collection-visualizer`

---

## 🧪 Testing Workflow

### File Comparator

Compare two files side-by-side — find same, similar, and different content across PDF, CSV, DOCX, XLSX, and text formats.

- **Multi-format support** — PDF, DOCX, XLSX, CSV, JSON, TXT, Markdown, HTML, XML, and 30+ code/text formats
- **Line-by-line diff** with LCS algorithm — same, added, removed, and modified classification
- **Similarity scoring** — Levenshtein distance per-line, overall percentage
- **Side-by-side and unified views** — toggle between diff display modes
- **Comparison options** — ignore whitespace, case, blank lines; configurable similarity threshold
- **Export** results as `.diff`, `.html`, or `.json`
- **Drag & drop** file upload with format auto-detection
- **Fullscreen modal** with zoom in/out for detailed inspection
- Fully in-browser — no files leave your machine

**Route:** `/file-comparator` &nbsp;|&nbsp; **CLI:** `qautils compare` &nbsp;|&nbsp; **API:** `POST /api/analysers/compare`

#### CLI Usage

```bash
# Basic comparison
qautils compare file1.txt file2.txt

# Ignore whitespace and case differences
qautils compare a.txt b.txt -w -i

# Show stats summary only (no diff lines)
qautils compare a.txt b.txt -f stats

# JSON output (pipe-friendly)
qautils compare a.txt b.txt -f json

# Custom similarity threshold (80%)
qautils compare a.txt b.txt -t 80

# Ignore blank lines
qautils compare a.txt b.txt -b
```

#### API Usage

```bash
curl -X POST http://localhost:3080/api/analysers/compare \
  -H "Content-Type: application/json" \
  -d '{
    "text1": "line 1\nline 2\nline 3",
    "text2": "line 1\nline 2 modified\nline 4",
    "ignoreWhitespace": false,
    "ignoreCase": false,
    "similarityThreshold": 0.6
  }'
```

Response:

```json
{
  "similarity": 33,
  "stats": {
    "totalLines": 4,
    "sameLines": 1,
    "addedLines": 1,
    "removedLines": 1,
    "modifiedLines": 1,
    "similarityPercentage": 33
  },
  "diffLines": [
    { "type": "same", "lineNumber1": 1, "lineNumber2": 1, "content": "line 1" },
    { "type": "modified", "lineNumber1": 2, "lineNumber2": 2, "content": "line 2 modified", "oldContent": "line 2", "similarity": 80 },
    { "type": "removed", "lineNumber1": 3, "content": "line 3" },
    { "type": "added", "lineNumber2": 3, "content": "line 4" }
  ]
}
```

---

### CI/CD Workflow Generator

Generate production-ready CI/CD pipeline files for multiple platforms. *(Also listed under Developer Tools.)*

- **Platforms:** GitHub Actions, GitLab CI, Azure DevOps, Jenkins, Bitbucket Pipelines
- **Test runners:** Playwright, Cypress, WebDriverIO, Puppeteer, Newman
- **Node.js versions:** 16, 18, 20, 21
- Parallel sharding, NPM publish stages
- Download as `.yml` / `Jenkinsfile`

**Route:** `/workflow-generator`

---

### ✅ Web Testing Checklist

Comprehensive checklist for web application testing covering all quality dimensions.

- **Functional** — core user flows, form validation, error handling
- **UI/UX** — layout, responsiveness, browser compatibility
- **Accessibility** — WCAG 2.1 AA criteria, keyboard navigation, screen readers
- **Performance** — page load times, asset sizes, caching
- **Security** — XSS, CSRF, authentication, HTTPS
- **SEO** — meta tags, structured data, sitemap
- Progress tracking with checkboxes — saved in `localStorage`
- Export checklist progress as JSON or PDF

**Route:** `/web-testing-checklist`

---

### ✅ API Testing Checklist

Structured checklist for REST and GraphQL API testing.

- **HTTP methods** coverage (GET, POST, PUT, PATCH, DELETE)
- **Authentication** — token validity, expiry, scope enforcement
- **Input validation** — boundary values, injection attacks, malformed payloads
- **Error handling** — correct status codes, error message format
- **Performance** — response times, rate limiting, pagination
- **Security** — authorization, CORS, SSL/TLS
- Progress tracking, saved locally

**Route:** `/api-testing-checklist`

---

### ✅ Mobile Testing Checklist

Comprehensive checklist for iOS and Android mobile application testing.

- **Device compatibility** — screen sizes, OS versions, orientations
- **Platform-specific** — iOS/Android permission dialogs, deep links, push notifications
- **Gestures** — tap, swipe, pinch-zoom, long press
- **Network conditions** — offline mode, low bandwidth, switching networks
- **Performance** — app launch time, memory usage, battery impact
- **Accessibility** — VoiceOver (iOS), TalkBack (Android)

**Route:** `/mobile-testing-checklist`

---

### 🤖 AI Website Tester

AI-powered automated website testing and analysis.

- **Functional testing** — AI generates and evaluates test scenarios for key user flows
- **UI/UX analysis** — layout consistency, visual hierarchy, call-to-action clarity
- **Performance insights** — identifies slow-loading elements and asset optimisation opportunities
- **Security checks** — AI-flagged security header gaps and exposed sensitive content
- **Recommendations** — actionable improvement suggestions for each finding
- Supports any public URL; requires a configured AI provider

**Route:** `/ai-website-tester`

---

### 📁 Test File Generator

Generate synthetic files for upload/download and file-handling tests. *(Also listed under Generators.)*

- **Supported types:** PNG, JPEG, PDF, WAV, MP4, CSV, JSON, XML, DOCX, ZIP
- Configurable file size (KB to MB)
- Batch generation

**Route:** `/test-file-generator`

---

## 📚 Learning & Reference

### 🔥💡 Testing Cheat Sheet

Quick-reference commands and patterns for the most popular test automation frameworks.

- **Frameworks covered:** Playwright, Pytest, CodeceptJS, Cypress, Jest, Vitest, Selenium, Robot Framework, K6 (performance), Newman (API)
- Searchable and filterable by framework
- **Sections:** Installation, selectors, assertions, hooks, mocking, CI integration
- Copy any snippet to clipboard
- Colour-coded by framework

**Route:** `/codeceptjs`

---

### 📖 Command Book

Hands-on reference for essential developer CLI tools.

- **Git** — common workflows, branching, rebasing, stashing, cherry-picking, conflict resolution
- **Docker** — images, containers, volumes, networks, Docker Compose
- **Bash / Shell** — file operations, text processing, piping, environment variables, scripting
- **CodeceptJS** — running tests, helpers, configuration, debugging
- Searchable across all sections
- Copy any command with one click

**Route:** `/command-book`

---

### ⚖️ Test Frameworks Comparison

Side-by-side comparison of test automation frameworks to help you pick the right one.

- **Frameworks:** Playwright, Cypress, Selenium, WebDriverIO, Jest, Vitest, Pytest, Robot Framework, K6, CodeceptJS
- **Comparison axes:** language support, speed, parallelism, mobile support, API testing, component testing, community size, learning curve, CI/CD integration
- Filter by use case (E2E, unit, API, performance, mobile)
- Scoring chart and recommendation engine

**Route:** `/test-frameworks-comparison`

---

### 🔌 API Types Guide

An interactive reference for understanding and comparing API architectural styles.

- **8 API types covered:** REST, GraphQL, gRPC, WebSocket, SOAP, Server-Sent Events (SSE), Webhooks, MQTT
- **Per-type detail cards:** overview, key characteristics, pros & cons, request/response examples, recommended tooling
- **Decision tree** — answer a few questions to get a recommendation
- **Side-by-side comparison table** — protocol, data format, communication model, real-time support, caching, browser support, type safety, learning curve, performance rating
- **Architecture pattern cards** — Microservices, BFF (Backend for Frontend), API Gateway, Event-Driven — with recommended API combinations for each

**Route:** `/api-types-guide`

---

### 🔄 CI/CD Infographic

Visual guide to Continuous Integration and Continuous Deployment pipelines.

- Illustrated pipeline stages (source → build → test → deploy)
- Common tools at each stage
- Best practices callouts
- Downloadable as image

**Route:** `/cicd-infographic`

---

### 🤖 AI Agents & MCP Infographic

Visual guide to AI Agents and the Model Context Protocol.

- What is an AI Agent and how does the observe-think-act loop work
- MCP architecture — clients, servers, tools, resources
- Tool calling flow diagrams
- Examples of MCP-compatible tools

**Route:** `/ai-agents-infographic`

---

### 🍎 Local LLM on Mac (16 GB RAM)

Practical tips for running large language models locally on Apple Silicon Macs with 16 GB RAM.

- **Model selection** — which models fit comfortably in 16 GB (Llama 3, Gemma 2, Mistral, Phi-3)
- **Quantization** — GGUF Q4/Q5/Q8 trade-offs explained
- **Ollama configuration** — `OLLAMA_NUM_PARALLEL`, keep-alive, context length tuning
- **macOS swap tuning** — how to reduce swap pressure for large models
- **Benchmark table** — tokens/sec for popular models on M1/M2/M3 16 GB

**Route:** `/local-llm-mac-tips`

---

### 🤖 AI Instructions Guide

Best practices for writing system prompts and instruction files for AI coding assistants.

- **Assistants covered:** Claude, ChatGPT, Google Gemini, GitHub Copilot, Cursor, Windsurf
- **Markdown structure** — `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursorrules`
- **Sections to include:** project overview, architecture patterns, code style rules, testing requirements, common pitfalls
- Copyable templates for each assistant
- Do's and don'ts for system prompt writing

**Route:** `/ai-instructions`

---

## 🎓 ISTQB & Certification

### 🎓 CTFL v4 Practice Exams

Interactive practice tests for the ISTQB Certified Tester Foundation Level v4 certification.

- **CTFL v4** exam questions aligned to the official syllabus
- Timed practice mode with configurable duration
- Per-question explanations for correct and incorrect answers
- **Score tracking** and per-chapter breakdown
- Randomised question order on each attempt

**Route:** `/ctfl`

---

### 🃏 Flashcards

Spaced-repetition flashcards for QA and testing concepts using the SM-2 algorithm.

- **Pre-loaded decks:** ISTQB terms, Agile testing, test types, defect lifecycle, test levels
- **SM-2 algorithm** — cards you struggle with appear more frequently
- **Custom cards** — add your own front/back pairs
- Progress dashboard — cards due today vs. learned
- Keyboard-friendly (Space to flip, Arrow keys to rate)

**Route:** `/flashcards`

---

## 📡 Telephony Reference Terms

Quick-reference technical glossary for telephony and VoIP concepts.

### 📞 IVR — Interactive Voice Response

Technical guide covering IVR system architecture, call flows, DTMF handling, and testing strategies.

**Route:** `/ivr`

---

### 💡 BLF — Busy Lamp Field

Technical specifications for BLF — how presence status is signalled over SIP and how to test BLF subscriptions.

**Route:** `/blf`

---

### 📡 SIP — Session Initiation Protocol

SIP protocol documentation covering REGISTER, INVITE, BYE flows, SDP negotiation, and common SIP response codes.

**Route:** `/sip`

---

## 🏛️ Palace Tools

Visual and spatial tools for navigating and tracking QA coverage.

### 🗺️ QA Palace

A spatial map of all QA Utils tools, organized into themed "rooms" — browse and discover tools visually.

**Route:** `/palace`

---

### 🏠 My Palace

Your personal pinboard — pin favourite tools to custom palace rooms for quick access.

**Route:** `/my-palace`

---

### 🗺️ Coverage Palace

Visual heatmap of your test coverage across dimensions: unit, integration, E2E, security, performance, accessibility, and more.

- Mark each area as covered, partial, or missing
- Colour-coded heatmap visualization
- Identify coverage gaps at a glance

**Route:** `/coverage-palace`
