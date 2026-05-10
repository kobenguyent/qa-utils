# CLI — qautils-cli

**qautils-cli** is the command-line interface for QA Utils. It exposes all 47+ utility tools as scriptable commands, plus an AI-powered **Kobean chat assistant** and an autonomous **AI Orchestrator** you can run directly in your terminal.

## Installation

```bash
npm install -g qautils-cli
```

Verify the installation:

```bash
qautils --version
qautils --help
```

## Quick Start

```bash
# Launch the interactive TUI menu
qautils

# Use any tool directly
qautils uuid
qautils hash "hello world" --algo sha256
qautils base64 encode "hello"
qautils timestamp
qautils password -l 24 --no-symbols

# AI chat
qautils chat
```

---

## 🆔 Generators

### `uuid` — UUID Generator

```bash
qautils uuid              # one v4 UUID
qautils uuid -c 10        # 10 UUIDs
```

| Option | Default | Description |
|--------|---------|-------------|
| `-c, --count <n>` | `1` | Number of UUIDs to generate |

---

### `nanoid` — NanoID Generator

```bash
qautils nanoid            # 21-char ID
qautils nanoid -s 32      # 32-char ID
qautils nanoid -s 16 -c 5 # 5 × 16-char IDs
```

| Option | Default | Description |
|--------|---------|-------------|
| `-s, --size <n>` | `21` | Character length per ID (1–128) |
| `-c, --count <n>` | `1` | Number of IDs to generate |

---

### `password` — Password Generator

```bash
qautils password                   # 16-char password
qautils password -l 32             # 32-char password
qautils password -l 20 -c 5        # 5 passwords
qautils password --no-symbols      # alphanumeric only
qautils password --no-uppercase --no-numbers  # lowercase only
```

| Option | Default | Description |
|--------|---------|-------------|
| `-l, --length <n>` | `16` | Password length (1–256) |
| `-c, --count <n>` | `1` | Number of passwords |
| `--no-uppercase` | — | Exclude uppercase letters (A–Z) |
| `--no-lowercase` | — | Exclude lowercase letters (a–z) |
| `--no-numbers` | — | Exclude digits (0–9) |
| `--no-symbols` | — | Exclude symbols (!@#$…) |

---

### `lorem` — Lorem Ipsum Generator

```bash
qautils lorem              # 1 paragraph
qautils lorem -p 5         # 5 paragraphs
```

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --paragraphs <n>` | `1` | Number of paragraphs (1–20) |

---

### `random` — Random String Generator

```bash
qautils random             # 16-char random string
qautils random -l 32       # 32-char string
qautils random -l 64 -c 5  # 5 × 64-char strings
```

| Option | Default | Description |
|--------|---------|-------------|
| `-l, --length <n>` | `16` | String length (1–1024) |
| `-c, --count <n>` | `1` | Number of strings |

---

## 🔒 Security & Crypto

### `hash` — Hash Generator

```bash
qautils hash "hello world"                   # SHA-256 (default)
qautils hash "hello world" --algo sha512     # SHA-512
qautils hash "hello world" --algo md5        # MD5
qautils hash "hello world" --all             # all algorithms at once
```

| Option | Default | Description |
|--------|---------|-------------|
| `-a, --algo <algorithm>` | `sha256` | `md5`, `sha1`, `sha256`, `sha384`, `sha512` |
| `--all` | — | Output all supported algorithms |

---

### `jwt` — JWT Decoder

```bash
qautils jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
qautils jwt <token> --json    # raw JSON output
```

| Option | Default | Description |
|--------|---------|-------------|
| `--json` | — | Output raw JSON instead of formatted table |

::: warning
JWT signature is **NOT** verified. This is a decode-only tool.
:::

---

## 🔄 Converters

### `base64` — Base64 Encode / Decode

```bash
qautils base64 encode "hello world"
qautils base64 decode "aGVsbG8gd29ybGQ="
```

---

### `timestamp` — Unix Timestamp Converter

```bash
qautils timestamp              # current time in all formats
qautils timestamp 1715000000   # convert a Unix timestamp (seconds)
qautils timestamp "2025-01-01" # convert a date string
```

Output: Unix (s), ISO 8601, UTC, Local time — shown in a table.

---

### `color` — Color Converter

```bash
qautils color "#ff5733"
qautils color "rgb(255, 87, 51)"
```

Accepted formats: `#RRGGBB`, `#RGB`, `rgb(r, g, b)`  
Output: HEX, RGB, HSL — with a terminal colour swatch.

---

### `url` — URL Toolkit

```bash
qautils url encode "hello world & more"   # → hello%20world%20%26%20more
qautils url decode "hello%20world"        # → hello world
qautils url parse "https://example.com/path?q=1&page=2#anchor"
```

`url parse` outputs: protocol, host, hostname, port, pathname, search, hash, and each query parameter on its own row.

---

### `base` — Number Base Converter

```bash
qautils base 255                  # decimal 255 → hex FF (default: 10→16)
qautils base 1010 --from 2 --to 10  # binary 1010 → decimal 10
qautils base FF --from 16 --to 2    # hex FF → binary 11111111
qautils base 42 --all             # shows BIN, OCT, DEC, HEX
```

| Option | Default | Description |
|--------|---------|-------------|
| `--from <base>` | `10` | Source base (2–36) |
| `--to <base>` | `16` | Target base (2–36) |
| `--all` | — | Show BIN, OCT, DEC, HEX simultaneously |

---

### `case` — Case Style Converter

```bash
qautils case "hello world"                  # → Title Case (default)
qautils case "hello world" -t camel         # → helloWorld
qautils case "hello world" -t snake         # → hello_world
qautils case "hello world" -t kebab         # → hello-world
qautils case "hello world" -t pascal        # → HelloWorld
qautils case "hello world" -t upper         # → HELLO WORLD
qautils case "hello world" -t lower         # → hello world
qautils case "hello world" -t constant      # → HELLO_WORLD
qautils case "hello world" --all            # shows all styles
```

| Option | Default | Description |
|--------|---------|-------------|
| `-t, --to <style>` | `title` | `camel`, `snake`, `kebab`, `pascal`, `upper`, `lower`, `title`, `constant` |
| `--all` | — | Show all case styles |

---

## 📊 Data & Analysis

### `json` — JSON Toolkit

```bash
# Accepts a raw JSON string or a file path
qautils json format '{"a":1,"b":2}'        # pretty-print (2-space indent)
qautils json format data.json              # from file
qautils json format data.json -i 4        # 4-space indent
qautils json validate data.json            # exits 0 if valid, 1 if not
qautils json minify data.json              # compact single-line output
```

| Subcommand | Option | Description |
|------------|--------|-------------|
| `format` | `-i, --indent <n>` | Indentation spaces (default: 2) |
| `validate` | — | Exits with code 0 (valid) or 1 (invalid) |
| `minify` | — | Removes all whitespace |

---

### `text` — Text Analyser

```bash
qautils text "The quick brown fox jumps over the lazy dog."
```

Output: Characters, Chars (no spaces), Words, Sentences, Lines, Paragraphs.

---

### `email` — Email Validator

```bash
qautils email user@example.com    # exits 0 if valid
qautils email not-an-email        # exits 1 with reason
```

Exit code `0` = valid, `1` = invalid (with reason printed).

---

### `regex` — Regex Tester

```bash
qautils regex "\d+" "abc 123 def 456"        # find all digit sequences
qautils regex "(\w+)@(\w+)" "foo@bar baz@qux" -f g  # capture groups
```

| Option | Default | Description |
|--------|---------|-------------|
| `-f, --flags <flags>` | `gi` | Regex flags (e.g., `gi`, `m`, `s`) |

Output: match count, each match with its index and capture groups.

---

### `sql` — SQL Generator

```bash
qautils sql SELECT --table users --columns id,name,email --where "age>18" --order-by created_at --limit 10
qautils sql INSERT --table users --columns id,name --values 1,Alice
qautils sql UPDATE --table users --columns name --values Bob --where "id=1"
qautils sql DELETE --table users --where "id=1"
qautils sql CREATE_TABLE --table users --columns "id INTEGER PRIMARY KEY,name TEXT NOT NULL"
```

| Option | Description |
|--------|-------------|
| `-t, --table <name>` | Table name (required) |
| `-c, --columns <cols>` | Comma-separated column names |
| `-v, --values <vals>` | Comma-separated values |
| `-w, --where <clause>` | WHERE clause |
| `-o, --order-by <col>` | ORDER BY column |
| `-l, --limit <n>` | LIMIT row count |

---

## 🌐 API & Web

### `html sanitize` — HTML Sanitizer

```bash
qautils html sanitize '<p onclick="evil()">Hello</p><script>alert(1)</script>'
# → <p>Hello</p>
```

Removes `<script>` tags and all `on*` inline event handler attributes.

---

### `md-confluence` — Markdown → Confluence Wiki

```bash
qautils md-confluence "# Hello\n\nSome **bold** text."
qautils md-confluence "$(cat README.md)"
```

Converts Markdown headings, bold, italic, code blocks, tables, lists, links, and images to Confluence Wiki markup.

---

## ⬡ GraphQL Client

Execute GraphQL queries and mutations, and explore schemas via introspection.

### Execute a query

```bash
# Basic query
qautils graphql query https://countries.trevorblades.com/graphql '{ countries { code name emoji } }'

# With variables
qautils graphql query https://rickandmortyapi.com/graphql \
  'query GetCharacter($id: ID!) { character(id: $id) { name status } }' \
  -v '{"id": 1}'

# With auth header
qautils graphql query https://api.example.com/graphql '{ me { name } }' \
  -H "Authorization: Bearer <token>"

# Print equivalent curl command (no request sent)
qautils graphql query https://api.example.com/graphql '{ users { id } }' --curl

# Raw JSON output (pipe into jq)
qautils graphql query https://api.example.com/graphql '{ users { id } }' --raw | jq '.data'
```

### Introspect a schema

```bash
qautils graphql introspect https://countries.trevorblades.com/graphql
qautils graphql introspect https://countries.trevorblades.com/graphql --types
qautils graphql introspect https://countries.trevorblades.com/graphql --type Country
qautils graphql introspect https://api.example.com/graphql --raw | jq '.'
```

### `graphql query` options

| Option | Default | Description |
|--------|---------|-------------|
| `-v, --variables <json>` | `{}` | GraphQL variables as JSON string |
| `-H, --header <key:value>` | — | HTTP header (repeatable) |
| `-o, --operation-name <name>` | — | Operation name for multi-operation documents |
| `-t, --timeout <ms>` | `30000` | Request timeout in ms |
| `--curl` | — | Print equivalent curl command and exit |
| `--raw` | — | Output raw JSON response only |

### `graphql introspect` options

| Option | Default | Description |
|--------|---------|-------------|
| `-H, --header <key:value>` | — | HTTP header (repeatable) |
| `-t, --timeout <ms>` | `30000` | Request timeout in ms |
| `--types` | — | List all types in the schema |
| `--type <name>` | — | Show fields and details for a specific type |
| `--raw` | — | Output raw introspection JSON |

---

## 🤖 Kobean AI Chat

Kobean is an interactive AI chat session powered by your choice of AI provider. It understands QA and testing questions and can suggest relevant `qautils` commands.

### 1. Configure Your AI Provider

```bash
# Interactive wizard
qautils chat config

# Non-interactive
qautils chat config --provider openai     --api-key sk-xxxxxx
qautils chat config --provider anthropic  --api-key sk-ant-xxx
qautils chat config --provider google     --api-key AIzaXXX
qautils chat config --provider azure-openai \
  --api-key <key> --endpoint https://<resource>.openai.azure.com --model gpt-35-turbo
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
API keys are stored in plain text. Protect the file:
```bash
chmod 600 ~/.config/qautils-cli/config.json
```
:::

### 2. Start a Chat Session

```bash
qautils chat
```

**In-session commands:**

| Command | Description |
|---------|-------------|
| `/clear` | Reset conversation history |
| `/model` | Show current AI provider and model |
| `/help` | Show available commands |
| `/exit` | Exit the session |
| `Ctrl+C` | Exit the session |

### Manage Configuration

```bash
qautils chat config --show    # show current config (API key masked)
qautils chat config --reset   # remove stored configuration
```

### Fetch Available Models

```bash
qautils chat models
qautils chat models --provider openai --api-key sk-xxx
qautils chat models --provider ollama --endpoint http://localhost:11434
```

---

## 🤖 Agent Orchestrator (CLI)

Run an autonomous multi-agent pipeline — a meta-orchestrator automatically assembles a team of specialist AI agents, delegates sub-tasks, and synthesises a final answer.

### One-shot run

```bash
qautils orchestrate "Design a test plan for a user login flow"
qautils orchestrate "Write unit tests for an auth module" --verbose
qautils orchestrate "Review this test plan" --provider openai --model gpt-4o
```

### Persistent Session

```bash
qautils orchestrate session
```

**In-session commands:**

| Command | Description |
|---------|-------------|
| `/verbose` | Toggle step-by-step output |
| `/config` | Show current AI provider configuration |
| `/help` | List session commands |
| `/exit` | Exit the session |

### How it works

1. **Team planning** — meta-orchestrator selects 2–4 specialist agents
2. **Delegation** — each worker is assigned a focused sub-task
3. **Parallel execution** — workers run concurrently
4. **Synthesis** — all outputs combined into a final answer

**Agent roles:** `planner` · `researcher` · `coder` · `reviewer` · `tester` · `synthesizer` · `analyst` · `writer` · `debugger` · `designer` · `validator` · `custom`

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--max-iterations <n>` | `10` | Max tool-calling loops per agent (max: 25) |
| `--provider <p>` | saved config | Override AI provider |
| `--model <m>` | saved config | Override model |
| `--verbose` | — | Print per-agent steps and delegation plan |

---

## 🤖 Agent Mode (CLI)

Run the single-agent observe-think-act loop — the agent selects and calls QA tools iteratively until the task is done.

```bash
qautils agent run "Generate a UUID and base64-encode it"
qautils agent run "Hash 'hello world' with SHA-256 then base64-encode the result"
qautils agent run "Validate this email: foo@bar.com" --verbose
```

### List available tools

```bash
qautils agent tools
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--max-iterations <n>` | `10` | Max iterations (max: 25) |
| `--provider <p>` | saved config | Override AI provider |
| `--model <m>` | saved config | Override model |
| `--verbose` | — | Show every tool call and response |

---

## 🧩 JSON Prompt Builder (CLI)

Build, validate, and render structured AI prompts in JSON format.

```bash
# OpenAI format (default)
qautils prompt build \
  --system "You are a helpful QA engineer." \
  --user "{{question}}" \
  --var question="How do I write a test plan?"

# Anthropic format
qautils prompt build \
  --format anthropic \
  --model claude-3-5-sonnet-20241022 \
  --system "Be concise." \
  --user "Summarize {{topic}}" \
  --var topic="test automation"

# Gemini format
qautils prompt build \
  --format gemini \
  --system "You are an expert." \
  --user "Explain {{concept}}"

# Multi-turn conversation
qautils prompt build \
  --system "You are helpful." \
  --user "What is 2+2?" \
  --assistant "4" \
  --user "And 3+3?"

# Parse an existing prompt file
qautils prompt parse my-prompt.json
qautils prompt parse '{"model":"gpt-4","messages":[{"role":"user","content":"Hi"}]}'

# Render template variables
qautils prompt render template.json --var name=Alice --var role="QA engineer"
qautils prompt render template.json --format anthropic --var topic=testing

# Validate structure
qautils prompt validate my-prompt.json
```

### `prompt build` options

| Option | Description |
|--------|-------------|
| `--format <format>` | `openai` (default), `anthropic`, `gemini`, `generic` |
| `--model <model>` | Model name |
| `--temperature <n>` | Temperature 0–2 (default: `0.7`) |
| `--max-tokens <n>` | Max tokens (default: `1024`) |
| `-s, --system <content>` | System message |
| `-u, --user <content>` | User message (repeatable) |
| `-a, --assistant <content>` | Assistant message (repeatable) |
| `--var <key=value>` | Template variable (repeatable) |

---

## 📋 Complete Command Reference

| Category | Command | Description |
|----------|---------|-------------|
| **Generators** | `uuid [-c n]` | Generate v4 UUIDs |
| | `nanoid [-s n] [-c n]` | Crypto-random NanoID identifiers |
| | `password [-l n] [-c n] [--no-*]` | Secure password generator |
| | `lorem [-p n]` | Lorem Ipsum placeholder text |
| | `random [-l n] [-c n]` | Cryptographically random strings |
| **Security & Crypto** | `hash <text> [-a algo] [--all]` | MD5, SHA-1, SHA-256, SHA-384, SHA-512 |
| | `jwt <token> [--json]` | JWT decoder (header, payload, expiry) |
| **Converters** | `base64 encode/decode <input>` | Base64 encoding / decoding |
| | `timestamp [value]` | Unix epoch ↔ ISO 8601, UTC, Local |
| | `color <input>` | HEX ↔ RGB ↔ HSL |
| | `url encode/decode/parse <input>` | URL percent-encoding & parsing |
| | `base <value> [--from] [--to] [--all]` | Number base converter (BIN/OCT/DEC/HEX) |
| | `case <text> [-t style] [--all]` | Case style converter (camelCase, snake_case…) |
| **Data & Analysis** | `json format/validate/minify <input>` | JSON toolkit (string or file path) |
| | `text <input>` | Text stats (chars, words, sentences…) |
| | `email <address>` | Email address validator |
| | `regex <pattern> <text> [-f flags]` | Regex tester with match highlighting |
| | `sql <op> --table --columns --where…` | SQL statement generator |
| **API & Web** | `html sanitize <input>` | Strip scripts & event handlers from HTML |
| | `md-confluence <input>` | Convert Markdown to Confluence Wiki markup |
| | `graphql query <endpoint> <query>` | Execute a GraphQL query or mutation |
| | `graphql introspect <endpoint>` | Fetch schema via introspection |
| **JSON Prompt Builder** | `prompt build` | Build AI prompts (OpenAI/Anthropic/Gemini/generic) |
| | `prompt parse <input>` | Parse and display a JSON prompt |
| | `prompt render <input>` | Render template variables in a prompt |
| | `prompt validate <input>` | Validate a JSON prompt structure |
| **AI** | `chat` | Kobean AI chat session |
| | `chat config` | Configure AI provider |
| | `chat config --show/--reset` | View or clear saved configuration |
| | `chat models` | List available models for the provider |
| | `agent run "<task>"` | Single-agent observe-think-act execution |
| | `agent tools` | List tools available to the agent |
| | `orchestrate "<task>"` | Multi-agent orchestration pipeline |
| | `orchestrate session` | Persistent multi-agent session |

---

## 🖥️ Interactive TUI

Run `qautils` (with no arguments) to launch the interactive menu-driven TUI. All tools — including **Kobean AI Chat** and **AI Orchestrator** — are available from the menu. Use arrow keys to navigate and `Enter` to select.

---

## 🔌 Provider Setup Guides

### OpenAI
1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Generate an API key at [API Keys](https://platform.openai.com/api-keys)
3. Run: `qautils chat config --provider openai --api-key <key>`

### Anthropic Claude
1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Generate an API key from Account → API Keys
3. Run: `qautils chat config --provider anthropic --api-key <key>`

### Google Gemini
1. Sign up at [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Run: `qautils chat config --provider google --api-key <key>`

### Azure OpenAI
1. Create an Azure OpenAI resource in the [Azure Portal](https://portal.azure.com/)
2. Deploy a model (e.g. `gpt-4o`, `gpt-35-turbo`)
3. Run: `qautils chat config --provider azure-openai --api-key <key> --endpoint <url>`

### Ollama (Local — Free, No API Key)
1. Install from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull mistral` or `ollama pull llama3`
3. Start the server: `ollama serve`
4. Run: `qautils chat config --provider ollama --endpoint http://localhost:11434 --model mistral`

## 📦 Piping & Scripting

```bash
# Pipe output between commands
qautils uuid | xargs -I {} qautils hash {}

# Use in scripts
PASSWORD=$(qautils password -l 20 --no-symbols)
HASH=$(qautils hash "$PASSWORD" --algo sha256)
echo "Password: $PASSWORD | SHA-256: $HASH"

# JSON processing
qautils json format response.json | jq '.data.users[] | .email'

# GraphQL results piped to jq
qautils graphql query https://api.example.com/graphql '{ users { id email } }' \
  --raw -H "Authorization: Bearer $TOKEN" | jq '.data.users'
```
