# Agent Manager

The **Agent Manager** lets you create, save, and reuse named AI agent profiles. Instead of reconfiguring the AI provider every time you run an agent task, you define profiles once and run them anywhere — the **web app**, the **REST API**, or the **CLI**.

## Concepts

| Term | Description |
|------|-------------|
| **Agent Profile** | A saved configuration: name, AI provider, model, API key, max iterations, etc. |
| **Agent Run** | A single task execution against a profile. The last 10 runs per profile are saved. |

## Web App — `/agent-manager`

Navigate to **Agent Manager** in the Tools menu (or go to `/#/agent-manager`).

### Creating a Profile

1. Click **+ New Profile**
2. Fill in the form:
   - **Name** — A descriptive label (e.g. "GPT-4 QA Agent")
   - **Provider** — `ollama`, `openai`, `anthropic`, `google`, or `azure-openai`
   - **Model** — The model name (uses provider default if blank)
   - **Endpoint** — Custom endpoint (required for Ollama and Azure OpenAI)
   - **API Key** — Required for cloud providers
   - **Max Iterations** — Maximum tool-calling loops (1–25, default 10)
   - **Temperature** — AI creativity (0–1, default 0.3)
   - **System Prompt Override** — Optional custom system prompt
3. Click **Create Profile**

### Running a Task

1. Click **▶ Run Task** on any profile card
2. Type a task description in the text box
3. Click **▶ Run** — the agent will plan and execute tools automatically
4. Use **Show steps** to see the reasoning trace

### Run History

Click **📋 History** on any profile to see the last 10 runs with their task, result, and answer.

## REST API

### List available tools

```bash
GET /api/agents/tools
```

```json
{
  "tools": [
    { "id": "generate_uuid", "description": "Generate one or more UUID v4 values.", "params": "quantity (number, optional, default 1)" },
    { "id": "base64_encode", "description": "Encode a string to Base64.", "params": "value (string, required)" }
  ],
  "count": 8
}
```

### Run an agent task

```bash
POST /api/agents/run
Content-Type: application/json

{
  "task": "Generate a UUID and base64-encode it",
  "provider": "openai",
  "apiKey": "sk-...",
  "model": "gpt-4o-mini",
  "maxIterations": 10,
  "temperature": 0.3
}
```

**Response:**
```json
{
  "success": true,
  "answer": "UUID: 550e8400-e29b-41d4-a716-446655440000\nBase64: NTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAw",
  "iterationCount": 2,
  "steps": [
    { "id": "...", "type": "thinking", "content": "First I'll generate a UUID...", "timestamp": 1234567890 },
    { "id": "...", "type": "tool_call", "content": "Calling generate_uuid", "toolName": "generate_uuid", "timestamp": 1234567891 },
    { "id": "...", "type": "tool_result", "content": "550e8400-...", "toolName": "generate_uuid", "timestamp": 1234567892 },
    { "id": "...", "type": "answer", "content": "UUID: ...\nBase64: ...", "timestamp": 1234567895 }
  ]
}
```

#### Using Ollama (local)

```bash
curl -X POST http://localhost:3333/api/agents/run \
  -H 'Content-Type: application/json' \
  -d '{"task": "Hash hello with SHA-256", "provider": "ollama", "endpoint": "http://localhost:11434", "model": "llama2"}'
```

## CLI

### Run an agent task

```bash
qautils agent run "Generate a UUID and base64-encode it"
```

With options:
```bash
qautils agent run "Hash hello with sha256" \
  --provider openai \
  --model gpt-4o-mini \
  --max-iterations 5 \
  --verbose
```

`--verbose` shows the step-by-step reasoning trace in the terminal.

### List available tools

```bash
qautils agent list
```

Output:
```
  Available Agent Tools
  ──────────────────────────────────────────────────
  ·  generate_uuid           Generate UUID v4 values
  ·  base64_encode           Encode a string to Base64
  ·  base64_decode           Decode a Base64 string
  ·  hash_text               Hash text with SHA-256/SHA-512/MD5
  ·  generate_lorem          Generate lorem ipsum text
  ·  current_timestamp       Get the current Unix timestamp and ISO date
  ·  generate_password       Generate a random secure password
  ·  count_characters        Count characters and words in a string

  Total: 8 tools
```

### Configure the AI provider

The CLI agent reuses the same config as `qautils chat`:

```bash
qautils chat config              # Interactive wizard
qautils chat config --show       # Show current config
qautils chat config --provider openai --api-key sk-xxx --model gpt-4o-mini
```

## Available Agent Tools

| Tool ID | Description |
|---------|-------------|
| `generate_uuid` | Generate UUID v4 values |
| `base64_encode` | Encode a string to Base64 |
| `base64_decode` | Decode a Base64 string |
| `hash_text` | Hash text (SHA-256, SHA-512, MD5) |
| `generate_lorem` | Generate lorem ipsum text |
| `current_timestamp` | Get current Unix timestamp and ISO date |
| `generate_password` | Generate a random secure password |
| `count_characters` | Count characters and words in a string |

## Architecture

The agent manager is implemented across three layers:

| Layer | File | Description |
|-------|------|-------------|
| Web storage | `src/utils/agentStorage.ts` | localStorage CRUD for profiles and run history |
| Web UI | `src/components/utils/AgentManager.tsx` | React component at `/agent-manager` |
| Web executor | `src/utils/agentExecutor.ts` | Browser agent loop (shared with Agent Mode) |
| CLI executor | `cli/src/lib/cliAgentExecutor.ts` | Node.js agent loop |
| CLI command | `cli/src/commands/agent.ts` | `qautils agent` command |
| API executor | `api/src/lib/agentExecutor.ts` | Node.js agent loop for Express |
| API route | `api/src/routes/agents.ts` | REST endpoints |
