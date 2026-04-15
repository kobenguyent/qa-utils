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

---

## Interactive TUI

Run `qautils` (or `qautils -i`) to launch the interactive menu-driven TUI. All tools — including **Kobean AI Chat** — are available from the menu.

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
