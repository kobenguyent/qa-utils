# CLI — qautils-cli

**qautils-cli** is the command-line interface for QA Utils. It exposes all utility tools as scriptable commands **plus** an AI-powered **Kobean chat assistant** you can run directly in your terminal.

## Installation

```bash
npm install -g qautils-cli
```

## Quick Start

```bash
# Interactive TUI (default when no args given)
qautils

# Direct command
qautils uuid
qautils hash "hello" --algo sha256

# AI chat
qautils chat
```

---

## 🤖 Kobean AI Chat

Kobean is an interactive AI chat session powered by your choice of AI provider. It understands QA and testing questions and can suggest relevant `qautils` commands.

### 1. Configure Your AI Provider

Run the interactive wizard:

```bash
qautils chat config
```

Or configure non-interactively:

```bash
# OpenAI
qautils chat config --provider openai --api-key sk-xxxxxx

# Anthropic Claude
qautils chat config --provider anthropic --api-key sk-ant-xxx

# Google Gemini
qautils chat config --provider google --api-key AIzaXXX

# Azure OpenAI
qautils chat config \
  --provider azure-openai \
  --api-key <key> \
  --endpoint https://<resource>.openai.azure.com \
  --model gpt-35-turbo

# Ollama (local — no API key needed)
qautils chat config --provider ollama --endpoint http://localhost:11434 --model mistral
```

**Supported providers:**

| Provider | Auth | Default Model |
|----------|------|---------------|
| `openai` | API key | gpt-3.5-turbo |
| `anthropic` | API key | claude-3-sonnet-20240229 |
| `google` | API key | gemini-1.5-flash |
| `azure-openai` | API key + Endpoint | gpt-35-turbo |
| `ollama` | Endpoint (local) | llama2 |

Config is stored at:
- **Linux / macOS**: `~/.config/qautils-cli/config.json`
- **Windows**: `%APPDATA%\qautils-cli\config.json`

::: warning Security
API keys are stored in **plain text**. Protect the config file with appropriate permissions:
```bash
chmod 600 ~/.config/qautils-cli/config.json
```
As an alternative, some users prefer to pass credentials via environment variables and configure them non-interactively in CI pipelines.
:::

### 2. Start a Chat Session

```bash
qautils chat
```

You'll enter an interactive REPL:

```
  ╭──────────────────────────────────────────────────────────────╮
  │                                                              │
  │  🤖 Kobean AI Chat                                          │
  │                                                              │
  │  Type your message and press Enter. Type /exit to quit.     │
  │                                                              │
  ╰──────────────────────────────────────────────────────────────╯

  Connected to: ollama / mistral
  You › _
```

**In-session commands:**

| Command | Description |
|---------|-------------|
| `/clear` | Reset conversation history |
| `/model` | Show current AI provider and model |
| `/help`  | Show available commands |
| `/exit`  | Exit the chat session |
| `Ctrl+C` | Exit the chat session |

### Managing Configuration

```bash
# Show current config (API key is masked)
qautils chat config --show

# Remove stored configuration
qautils chat config --reset
```

### Fetch Available Models

```bash
# Use the configured provider
qautils chat models

# Override ad-hoc (no saved config needed)
qautils chat models --provider ollama --endpoint http://localhost:11434
qautils chat models --provider openai --api-key sk-xxx
qautils chat models --provider google --api-key AIzaXXX
```

::: tip Anthropic
Anthropic has no public model-list API. `qautils chat models --provider anthropic` returns a curated static list of stable Claude models.
:::

---

## 🤖 Agent Orchestrator (CLI)

Run an **autonomous multi-agent pipeline** from the terminal. A meta-orchestrator automatically assembles a team of specialist AI agents, delegates sub-tasks to them, and synthesises a final answer.

### One-shot run

```bash
qautils orchestrate "Design a test plan for a user login flow"
qautils orchestrate "Refactor the auth module" --verbose
qautils orchestrate "Write unit tests" --provider openai --model gpt-4o
```

### Persistent Session

Start a **session** so you can run multiple tasks back-to-back without restarting:

```bash
qautils orchestrate session
```

```
  Task › Design a test plan for the login flow
  ...orchestration runs...

  Task › Now write unit tests for it
  ...orchestration runs...

  Task › /exit
```

**In-session commands:**

| Command | Description |
|---------|-------------|
| `/verbose` | Toggle step-by-step output on/off |
| `/config`  | Show current AI provider configuration |
| `/help`    | List available session commands |
| `/exit`    | Exit the session |
| `Ctrl+C`   | Exit the session |

### How it works

1. **Team planning** — a meta-orchestrator selects 2–4 specialist agents suited to the task.
2. **Delegation** — the orchestrator assigns each worker a focused sub-task.
3. **Parallel execution** — workers run concurrently.
4. **Synthesis** — all outputs are combined into a final answer.

### Agent Roles

`planner` · `researcher` · `coder` · `reviewer` · `tester` · `synthesizer` · `analyst` · `writer` · `debugger` · `designer` · `validator` · `custom`

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--max-iterations <n>` | `10` | Max tool-calling loops per agent (max: 25) |
| `--provider <p>` | saved config | Override AI provider |
| `--model <m>` | saved config | Override model |
| `--verbose` | — | Print per-agent steps and delegation plan |

> Prerequisite: configure an AI provider with `qautils chat config`.

---

## All CLI Commands

Run `qautils --help` to see all commands, or `qautils <command> --help` for details.

| Category | Command | Description |
|----------|---------|-------------|
| **Generators** | `uuid` | Generate v4 UUIDs |
| | `nanoid` | Crypto-random NanoID identifiers |
| | `base64 encode/decode` | Base64 encode/decode |
| | `random` | Cryptographically random strings |
| | `password` | Secure password generator |
| | `lorem` | Lorem Ipsum placeholder text |
| **Analysers** | `hash` | MD5, SHA-1, SHA-256, SHA-384, SHA-512 |
| | `jwt` | JWT decoder |
| | `text` | Text stats (chars, words, sentences…) |
| | `email` | Email address validator |
| | `regex` | Regex tester with match highlighting |
| **Converters** | `timestamp` | Unix epoch ↔ ISO 8601, UTC, local |
| | `color` | HEX ↔ RGB ↔ HSL |
| | `url encode/decode/parse` | URL toolkit |
| | `base` | Number base converter (BIN/OCT/DEC/HEX) |
| | `case` | Case style converter (camelCase, snake_case…) |
| **Data Toolkit** | `json format/validate/minify` | JSON toolkit |
| | `sql` | SQL statement generator |
| | `html sanitize` | HTML sanitizer |
| **AI** | `chat` | Kobean AI chat session |
| | `chat config` | Configure AI provider |
| | `chat models` | List available models for the provider |
| | `orchestrate <task>` | Run a one-shot multi-agent orchestration pipeline |
| | `orchestrate session` | Start a persistent orchestration session |

---

## Interactive TUI

Run `qautils` (or `qautils -i`) to launch the interactive menu-driven TUI. All tools — including **Kobean AI Chat** and **AI Orchestrator** — are available from the menu.

---

## Provider Setup Guides

### OpenAI
1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Generate an API key from [API Keys](https://platform.openai.com/api-keys)
3. Run: `qautils chat config --provider openai --api-key <key>`

### Anthropic Claude
1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Generate an API key from account settings
3. Run: `qautils chat config --provider anthropic --api-key <key>`

### Google Gemini
1. Sign up at [Google AI Studio](https://makersuite.google.com/)
2. Generate an API key
3. Run: `qautils chat config --provider google --api-key <key>`

### Azure OpenAI
1. Create an Azure OpenAI resource in Azure Portal
2. Deploy a model (e.g. `gpt-35-turbo`)
3. Run: `qautils chat config --provider azure-openai --api-key <key> --endpoint <url>`

### Ollama (Local — Free, No API Key)
1. Install from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull mistral`
3. Run: `qautils chat config --provider ollama --endpoint http://localhost:11434 --model mistral`
4. Start chat: `qautils chat`
