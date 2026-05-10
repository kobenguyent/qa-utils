# AI-Powered Tools

Tools that leverage AI capabilities for enhanced QA workflows, intelligent assistance, and autonomous task execution.

---

## 🤖 Kobean AI Chat (Assistant)

Advanced multi-provider AI chat interface with tool execution, knowledge base, and conversation management.

### Supported Providers

| Provider | Auth | Notable Models |
|----------|------|----------------|
| **OpenAI** | API key | GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo |
| **Anthropic Claude** | API key | Claude 3.5 Sonnet, Claude 3 Opus, Haiku (200K context) |
| **Google Gemini** | API key | Gemini 1.5 Flash, 1.5 Pro, 2.0 Flash (up to 2M tokens) |
| **Azure OpenAI** | API key + Endpoint | Enterprise GPT-4 / GPT-35-turbo deployments |
| **Ollama** | Endpoint (local) | Llama 3, Mistral, Phi-3, Gemma 2, CodeLlama, and any pulled model |

### Features

- **Token counting & optimization** — real-time token counter with automatic smart compression when approaching limits
- **System prompts** — built-in templates (Default, Technical, Creative) or write your own
- **Conversation management** — save, load, rename, and export (JSON or Markdown) chat sessions
- **Knowledge Base (CAG)** — upload `.txt`, `.md`, `.json`, `.csv`, `.pdf` files; their content is injected into the context for Cache-Augmented Generation
- **MCP Tool Management** — enable/disable individual built-in tools, or connect custom external MCP servers by URL
- **Streaming responses** — tokens stream in real-time as the model generates them

**Route:** `/kobean`

---

## ✨ Prompt Enhancer

Transform vague or basic prompts into detailed, structured, and more effective AI prompts.

- **Enhancement strategies:** Add context, clarify intent, add constraints, add output format, add examples
- **Before/after comparison** — side-by-side view of original and enhanced prompt
- Multi-provider support — uses your configured AI provider
- Copy enhanced prompt to clipboard
- Iterative refinement — enhance the enhanced prompt further

**Route:** `/prompt-enhancer`

---

## 🧩 JSON Prompt Builder

Build, validate, and export structured AI prompts in JSON format — designed for prompt engineers and LLM API developers.

### Features

- **Visual message editor** — add system, user, and assistant turns in conversation order with drag-to-reorder
- **Template variables** — use `{{variableName}}` placeholders in any message; fill in values before export to preview the rendered output
- **Multi-provider export** — one-click export to the exact JSON format expected by OpenAI, Anthropic, Gemini, or generic APIs
- **Import & edit** — paste any existing JSON prompt to parse and edit it visually
- **Validation** — structural validation with clear error messages (missing roles, empty content, etc.)
- **Copy to clipboard** — copy the generated JSON payload in one click

### Supported Provider Formats

| Provider | Output Format |
|----------|--------------|
| **OpenAI** | `{"model":"…","messages":[…],"temperature":…,"max_tokens":…}` |
| **Anthropic** | `{"system":"…","messages":[…],"max_tokens":…}` |
| **Gemini** | `{"systemInstruction":{"parts":[…]},"contents":[…],"generationConfig":{…}}` |
| **Generic** | Flat messages array with model and generation parameters |

### Template Variables

Use `{{variableName}}` syntax in any message content to create reusable prompt templates. Variables are auto-detected and shown as fill-in fields so you can preview the final prompt before exporting.

**Example:**

```
System: You are an expert {{role}}.
User:   Explain {{topic}} in simple terms for a {{audience}}.
```

Fill `role=QA engineer`, `topic=test automation`, `audience=junior developer` to preview and export the final prompt.

**Route:** `/json-prompt-builder`

---

## 🤖 Agent Mode

Autonomous AI agent that plans and executes multi-step QA tasks using the built-in tool ecosystem in an observe-think-act loop.

### How it Works

1. **Describe** a task in plain English — e.g., *"Generate a UUID and base64-encode it, then hash the result with SHA-256"*
2. **Plan** — the AI selects which tools to call and in what order
3. **Execute** — each tool runs and its output is fed back to the AI
4. **Iterate** — the loop continues (up to 25 iterations) until the task is complete or the agent determines it's done
5. **Answer** — the final result is presented with a step-by-step timeline of every action taken

### Available Tools for the Agent

The agent has access to all QA Utils built-in tools:

| Category | Tools available |
|----------|----------------|
| Generators | UUID, Password, Hash, Lorem Ipsum, Dummy Data, OTP |
| Converters | Base64, Timestamp, Color, SQL, JWT decode, HTML sanitize |
| API | REST requests, GraphQL queries |
| Text | Character counter, Regex tester, Email validator |
| Dev | JSON format/validate, URL encode/decode |

### Options

- **Max iterations** — configurable (default: 10, max: 25)
- **Verbose mode** — show every tool call and response in the timeline
- Requires a configured AI provider

**Route:** `/agent`

---

## 🗂️ Agent Manager

Create, store, and manage reusable named AI agent profiles, and review the full history of past runs.

### Features

- **Named profiles** — save agent configurations (provider, model, system prompt, tool restrictions, max iterations) under a memorable name
- **One-click activation** — switch between profiles without re-entering credentials
- **Run history** — every agent execution is logged with task, steps taken, tool calls, and result
- **Re-run** any previous task from history with one click
- **Export** run history as JSON for audit trails or documentation

### Invocation Methods

Profiles created in Agent Manager can be used from:
- **Web UI** — select a profile on the Agent Mode page
- **REST API** — `POST /api/agents/run` with `{ "profileId": "…", "task": "…" }`
- **CLI** — `qautils agent run "<task>" --profile <name>`

**Route:** `/agent-manager`

---

## 🤖 AI Website Tester

AI-powered automated website testing and analysis for any public URL.

- **Functional testing** — AI generates and evaluates test scenarios for key user flows (navigation, forms, CTAs)
- **UI/UX analysis** — layout consistency, visual hierarchy, call-to-action clarity, readability
- **Performance insights** — identifies slow-loading resources, unoptimised images, render-blocking scripts
- **Security checks** — AI-flagged security header gaps, exposed sensitive paths, missing HTTPS redirects
- **Accessibility scan** — missing ARIA labels, colour contrast issues, keyboard navigation gaps
- **Recommendations** — prioritised, actionable improvement suggestions for every finding
- Supports any public URL; requires a configured AI provider

**Route:** `/ai-website-tester`

---

## 🤖 AI Instructions Guide

Best practices and templates for writing system prompts and instruction files for AI coding assistants.

- **Assistants covered:** Claude (CLAUDE.md), ChatGPT, Google Gemini, GitHub Copilot (`.github/copilot-instructions.md`), Cursor (`.cursorrules`), Windsurf
- **Markdown structure** — recommended sections: project overview, architecture patterns, code style, testing requirements, common pitfalls, priority order
- **Copyable templates** for each assistant
- Do's and don'ts for effective system prompt writing
- Side-by-side comparison of instruction file formats across assistants

**Route:** `/ai-instructions`

---

## AI Provider Setup {#ai-provider-setup}

### OpenAI
1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Generate an API key from [API Keys](https://platform.openai.com/api-keys)
3. In QA Utils: open **Kobean** → **Settings** → select **OpenAI** and enter your key

### Anthropic Claude
1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Generate an API key from Account → API Keys
3. In QA Utils: select **Anthropic Claude** and enter your key

### Google Gemini
1. Sign up at [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. In QA Utils: select **Google Gemini** and enter your key

### Azure OpenAI
1. Create an Azure OpenAI resource in the [Azure Portal](https://portal.azure.com/)
2. Deploy a model (e.g., `gpt-4o`, `gpt-35-turbo`)
3. Copy your **API key** and **endpoint URL**
4. In QA Utils: select **Azure OpenAI**, enter the endpoint and key

### Ollama (Local — Free, No API Key)
1. Install from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3` or `ollama pull mistral`
3. Start the server: `ollama serve` (runs on `http://localhost:11434` by default)
4. In QA Utils: select **Ollama**, enter `http://localhost:11434`, and choose your model

::: tip CLI Configuration
All providers can also be configured via CLI:
```bash
qautils chat config --provider openai --api-key sk-xxxxxx
qautils chat config --provider ollama --endpoint http://localhost:11434 --model llama3
```
:::

::: warning API Key Security
API keys are stored in the browser's `localStorage`. Never share your browser profile or export `localStorage` data. In production environments, prefer using Ollama (local) or a backend proxy.
:::
