# qautils-cli

> **Command-line interface for [QA Utils](https://github.com/kobenguyent/qa-utils)** — utility tools for daily testing and automation workflows, plus an AI-powered Kobean chat assistant and multi-agent orchestration system.

---

## Requirements

- **Node.js ≥ 18**
- **npm** or **bun**

---

## Installation

### From GitHub Packages

```bash
# Authenticate with GitHub Packages (one-time setup)
npm login --registry=https://npm.pkg.github.com --scope=@kobenguyent

# Install globally
npm install -g @kobenguyent/qautils-cli --registry=https://npm.pkg.github.com

qautils --help
```

Alternatively, add a `.npmrc` file to your project:

```
@kobenguyent:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install -g @kobenguyent/qautils-cli
```

### Local development (inside this repo)
```bash
cd cli
npm install
npm run build
# Run directly
node dist/src/index.js --help

# Or link it globally
npm link
qautils --help
```

### From the project root
```bash
cd /path/to/qa-utils/cli
npm install && npm run build && npm link
```

---

## Usage

```
qautils <command> [options]
```

Run `qautils --help` to see all commands, or `qautils <command> --help` for per-command help.

---

## Commands

### `uuid` — UUID Generator
Generate cryptographically random v4 UUIDs.

```bash
qautils uuid                    # One UUID
qautils uuid -c 5               # Five UUIDs
```

| Option | Default | Description |
|--------|---------|-------------|
| `-c, --count <n>` | `1` | Number of UUIDs |

---

### `base64 encode / decode` — Base64 Codec
Encode UTF-8 text to Base64 or decode Base64 back to text.

```bash
qautils base64 encode "hello world"      # aGVsbG8gd29ybGQ=
qautils base64 decode "aGVsbG8gd29ybGQ=" # hello world
```

---

### `jwt` — JWT Decoder
Decode a JWT token and inspect its header, payload, and expiration status.

> ⚠️ Signature is **NOT verified**. Do not make security decisions based on unverified tokens.

```bash
qautils jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
qautils jwt <token> --json        # Raw JSON output
```

| Option | Description |
|--------|-------------|
| `--json` | Output raw JSON instead of formatted table |

---

### `hash` — Hash Generator
Generate cryptographic hashes of any text.

```bash
qautils hash "hello"                     # sha256 (default)
qautils hash "hello" --algo md5          # MD5
qautils hash "hello" --all               # All algorithms at once
```

**Supported algorithms:** `md5`, `sha1`, `sha256`, `sha384`, `sha512`

| Option | Default | Description |
|--------|---------|-------------|
| `-a, --algo <alg>` | `sha256` | Hash algorithm |
| `--all` | — | Output all algorithms |

---

### `password` — Password Generator
Generate cryptographically random passwords.

```bash
qautils password                         # 16-char mixed password
qautils password -l 24                   # 24 chars
qautils password -l 32 -c 5             # 5 × 32-char passwords
qautils password --no-symbols           # Alphanumeric only
qautils password --no-uppercase --no-numbers  # lowercase + symbols
```

| Option | Default | Description |
|--------|---------|-------------|
| `-l, --length <n>` | `16` | Password length (1–256) |
| `-c, --count <n>` | `1` | Number of passwords |
| `--no-uppercase` | — | Exclude A–Z |
| `--no-lowercase` | — | Exclude a–z |
| `--no-numbers` | — | Exclude 0–9 |
| `--no-symbols` | — | Exclude `!@#$…` |

---

### `timestamp` — Unix Timestamp Converter
Convert between Unix timestamps, ISO 8601, UTC, and local time. Omit the argument to display the current time.

```bash
qautils timestamp                        # Current time in all formats
qautils timestamp 1700000000            # Seconds (Unix epoch)
qautils timestamp 1700000000000         # Milliseconds (auto-detected)
qautils timestamp "2024-01-01T00:00:00Z" # ISO date string
```

---

### `json format / validate / minify` — JSON Toolkit
Format, validate, or minify JSON strings and files.

```bash
qautils json format '{"a":1}'           # Pretty-print
qautils json format data.json           # Read from file
qautils json format data.json -i 4     # 4-space indent
qautils json validate '{"ok":true}'    # Validity check
qautils json minify data.json          # Strip whitespace
```

| Option | Default | Description |
|--------|---------|-------------|
| `-i, --indent <n>` | `2` | Indentation (format only) |

---

### `lorem` — Lorem Ipsum Generator
Generate Lorem Ipsum placeholder text.

```bash
qautils lorem                           # 1 paragraph
qautils lorem -p 3                      # 3 paragraphs
```

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --paragraphs <n>` | `1` | Number of paragraphs (1–20) |

---

### `text` — Text Analyser
Count characters, words, sentences, lines, and paragraphs.

```bash
qautils text "The quick brown fox."
qautils text "$(cat myfile.txt)"        # Pipe a file
```

---

### `email` — Email Validator
Validate an email address syntax.

```bash
qautils email user@example.com         # ✓ Valid
qautils email not-an-email             # ✗ Invalid (exit code 1)
```

---

### `sql` — SQL Generator
Generate SQL statements for common operations.

> ⚠️ Values use basic escaping. Always use parameterized queries in production.

```bash
qautils sql SELECT --table users
qautils sql SELECT --table users --columns id,name --where "age>18" --limit 10
qautils sql INSERT --table users --columns id,name --values 1,Alice
qautils sql UPDATE --table users --columns name --values Bob --where "id=1"
qautils sql DELETE --table users --where "id=1"
qautils sql CREATE_TABLE --table users --columns "id INTEGER PRIMARY KEY,name TEXT,email TEXT"
```

| Option | Description |
|--------|-------------|
| `-t, --table <name>` | **Required.** Target table |
| `-c, --columns <cols>` | Comma-separated column names |
| `-v, --values <vals>` | Comma-separated values |
| `-w, --where <clause>` | WHERE clause |
| `-o, --order-by <col>` | ORDER BY column |
| `-l, --limit <n>` | LIMIT row count |

---

### `color` — Color Converter
Convert a color between HEX, RGB, and HSL.

```bash
qautils color "#FF5733"                 # From HEX
qautils color "rgb(255, 87, 51)"        # From RGB
qautils color "03A"                     # 3-digit shorthand
```

---

### `html sanitize` — HTML Sanitizer
Strip `<script>` tags and inline `on*` event handlers from HTML.

```bash
qautils html sanitize '<p onclick="evil()">Hello</p>'
# Output: <p>Hello</p>
```

---

### `random` — Random String Generator
Generate cryptographically random alphanumeric strings.

```bash
qautils random                          # 16-char string
qautils random -l 32                    # 32 chars
qautils random -l 64 -c 5             # 5 × 64-char strings
```

| Option | Default | Description |
|--------|---------|-------------|
| `-l, --length <n>` | `16` | String length (1–1024) |
| `-c, --count <n>` | `1` | Number of strings |

---

## 🤖 Kobean AI Chat

Kobean is an AI-powered chat assistant built into qautils-cli. It supports multiple providers and provides an interactive REPL-style chat experience right in your terminal.

### Configure AI Provider

Before starting a chat, configure your AI provider:

```bash
# Interactive wizard (recommended)
qautils chat config

# Quick non-interactive setup
qautils chat config --provider openai --api-key sk-xxxxxx
qautils chat config --provider ollama --endpoint http://localhost:11434 --model mistral
qautils chat config --provider anthropic --api-key sk-ant-xxx
qautils chat config --provider google --api-key AIzaXXX
qautils chat config --provider azure-openai --api-key xxx --endpoint https://resource.openai.azure.com --model gpt-35-turbo

# Show current configuration (API key is masked)
qautils chat config --show

# Remove stored configuration
qautils chat config --reset

# List available models for the configured provider
qautils chat models

# List models for a specific provider (without saving config)
qautils chat models --provider ollama --endpoint http://localhost:11434
qautils chat models --provider google --api-key AIzaXXX
```

**Supported providers:**

| Provider | Requires | Default Model |
|----------|----------|---------------|
| `openai` | API key | gpt-3.5-turbo |
| `anthropic` | API key | claude-3-sonnet-20240229 |
| `google` | API key | gemini-1.5-flash |
| `azure-openai` | API key + Endpoint | gpt-35-turbo |
| `ollama` | Endpoint (local) | llama2 |

Configuration is stored at:
- **Linux / macOS**: `~/.config/qautils-cli/config.json`
- **Windows**: `%APPDATA%\qautils-cli\config.json`

> ⚠️ API keys are stored in plain text. Ensure your config file has appropriate permissions:
> ```bash
> chmod 600 ~/.config/qautils-cli/config.json
> ```
> Alternatively, use environment variables if your shell/CI environment supports them.

### Start a Chat Session

```bash
qautils chat
```

**In-session commands:**

| Command | Description |
|---------|-------------|
| `/clear` | Reset conversation history |
| `/model` | Show current AI provider and model |
| `/help`  | Show available commands |
| `/exit`  | Exit the chat session |
| `Ctrl+C` | Exit the chat session |

### Fetch Available Models

Query the available models for the configured provider (or override with flags):

```bash
# Use configured provider
qautils chat models

# Override provider ad-hoc
qautils chat models --provider ollama --endpoint http://localhost:11434
qautils chat models --provider openai --api-key sk-xxx
qautils chat models --provider google --api-key AIzaXXX
```

> **Note:** Anthropic does not expose a public model-list API; `qautils chat models --provider anthropic` returns a curated static list of stable models.

### Interactive TUI

The chat is also available from the interactive TUI (launched by running `qautils` without arguments).
Select **🤖 Kobean AI Chat** from the menu.

---

## 🤖 Agent Orchestrator (CLI)

Run an **autonomous multi-agent pipeline** from the terminal.  A meta-orchestrator automatically assembles a team of specialist AI agents (planner, coder, reviewer, tester, etc.), delegates sub-tasks to them, and synthesises a final answer — all in one command.

### Quick start

```bash
# Auto-assemble a team and run the full pipeline:
qautils orchestrate "Design a test plan for a user login flow"

# Show step-by-step reasoning, delegation plan, and tool calls:
qautils orchestrate "Refactor the auth module to use async/await" --verbose

# Override provider or model for this run:
qautils orchestrate "Write unit tests for the payment service" --provider openai --model gpt-4o

# Cap the number of iterations each agent may take:
qautils orchestrate "Analyse this codebase for security issues" --max-iterations 5
```

### Persistent Session

Start a **persistent orchestration session** so you can run multiple tasks without restarting the CLI:

```bash
qautils orchestrate session
```

You'll enter an interactive prompt where you can type tasks one after another:

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

Options also apply to sessions:

```bash
# Session with verbose output and a custom provider:
qautils orchestrate session --verbose --provider openai --model gpt-4o
```

### How it works

1. **Team planning** — a meta-orchestrator calls the configured AI provider and asks it to select 2–4 specialist agents best suited to the task (roles: `planner`, `researcher`, `coder`, `reviewer`, `tester`, `synthesizer`, `analyst`, `writer`, `debugger`, `designer`, `validator`, `custom`).
2. **Delegation** — the orchestrator produces a `delegate` plan assigning a focused sub-task to each worker.
3. **Parallel execution** — workers run their sub-tasks concurrently.
4. **Synthesis** — the orchestrator combines all worker outputs into a single, cohesive final answer.

### Agent Roles

| Role | Specialty |
|------|-----------|
| `planner` | Breaks down a complex task into an ordered plan |
| `researcher` | Gathers information and produces research notes |
| `coder` | Writes, refactors, or debugs code |
| `reviewer` | Reviews work for quality, correctness, or style |
| `tester` | Writes automated tests (unit, integration, e2e) |
| `synthesizer` | Combines outputs into a cohesive final answer |
| `analyst` | Analyses data, metrics, or requirements |
| `writer` | Writes documentation, reports, or content |
| `debugger` | Debugs issues and performs root cause analysis |
| `designer` | Designs architecture, APIs, or system structure |
| `validator` | Validates outputs and checks quality |
| `custom` | General-purpose agent for anything else |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--max-iterations <n>` | `10` | Maximum tool-calling loops per agent (max: 25) |
| `--provider <p>` | saved config | Override AI provider for this run |
| `--model <m>` | saved config | Override model for this run |
| `--verbose` | — | Print per-agent steps, delegation plan, and tool calls |

> **Prerequisite**: configure an AI provider first with `qautils chat config`.

---

## 🤖 Agent Mode (CLI)

Run autonomous multi-step AI tasks from the terminal. The agent uses the same AI config as the chat command.

### Run a task

```bash
qautils agent run "Generate a UUID and base64-encode it"
```

With verbose step-by-step output:
```bash
qautils agent run "Hash 'hello world' with SHA-256" --verbose
```

Override the provider or model for a single run:
```bash
qautils agent run "Generate 3 UUIDs" --provider openai --model gpt-4o-mini
```

Limit iterations:
```bash
qautils agent run "Complex task" --max-iterations 5
```

### List available tools

```bash
qautils agent list
```

### Options

| Option | Description |
|--------|-------------|
| `--max-iterations <n>` | Maximum tool-calling loops (default: 10, max: 25) |
| `--provider <p>` | Override AI provider for this run |
| `--model <m>` | Override model for this run |
| `--verbose` | Print each step to the terminal |

---

## Piping & Scripting

All commands print results to **stdout** with no trailing newlines from internal logic. Errors go to **stderr** and set exit code `1`.

```bash
# Generate a UUID and base64-encode it
qautils uuid | xargs -I{} qautils base64 encode {}

# Hash 5 passwords
qautils password -c 5 | while read p; do echo "$p → $(qautils hash "$p")"; done

# Validate all emails in a file
while read email; do qautils email "$email"; done < emails.txt

# Prettify a JSON API response
curl -s https://api.example.com/data | qautils json format /dev/stdin
```

---

## Running Tests

```bash
cd cli
npm test                  # Run all tests
npm run test:coverage     # Coverage report
```

---

## Building

```bash
cd cli
npm run build             # Compiles TypeScript → dist/
```

---

## Project Structure

```
cli/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.cjs
└── src/
    ├── index.ts               ← CLI entry point (Commander.js)
    ├── interactive.ts         ← Interactive TUI mode
    ├── lib/
    │   ├── tools.ts           ← Pure business logic (testable)
    │   ├── aiConfig.ts        ← AI provider config file management
    │   ├── aiClient.ts        ← AI chat HTTP client (Node 18+ fetch)
    │   ├── cliAgentExecutor.ts ← Autonomous single-agent executor
    │   └── cliOrchestrator.ts ← Multi-agent orchestration engine
    ├── utils/
    │   └── output.ts          ← Chalk-based formatting helpers
    ├── commands/
    │   ├── uuid.ts
    │   ├── base64.ts
    │   ├── jwt.ts
    │   ├── hash.ts
    │   ├── password.ts
    │   ├── timestamp.ts
    │   ├── json.ts
    │   ├── lorem.ts
    │   ├── text.ts
    │   ├── email.ts
    │   ├── sql.ts
    │   ├── color.ts
    │   ├── html.ts
    │   ├── random.ts
    │   ├── chat.ts            ← Kobean AI chat command
    │   ├── agent.ts           ← Autonomous agent command
    │   └── orchestrate.ts     ← Multi-agent orchestration command
    └── __tests__/
        ├── uuid.test.ts
        ├── base64.test.ts
        ├── jwt.test.ts
        ├── hash.test.ts
        ├── password.test.ts
        ├── timestamp.test.ts
        ├── json.test.ts
        ├── lorem.test.ts
        ├── text.test.ts
        ├── email.test.ts
        ├── sql.test.ts
        ├── color.test.ts
        ├── html.test.ts
        ├── random.test.ts
        ├── chat.test.ts       ← Tests for AI config and client
        ├── agent.test.ts      ← Tests for the agent executor
        └── orchestrate.test.ts ← Tests for the orchestration engine
```

---

## License

MIT — same as the parent [QA Utils](https://github.com/kobenguyent/qa-utils) project.
