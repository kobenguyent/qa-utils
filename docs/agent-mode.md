# Agent Mode

Agent Mode turns QA Utils into an **autonomous AI agent** capable of planning and executing multi-step tasks using the available QA tools.

## How It Works

The agent operates in an **observe-think-act loop**:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User     │────▶│  AI      │────▶│  Tool    │────▶│  AI      │
│  Task     │     │  Plans   │     │  Executes│     │  Decides │
│  Input    │     │  Action  │     │  Action  │     │  Next    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                  │
                      └──────────── Loop ────────────────┘
```

1. **User describes a task** — e.g., "Generate a UUID and encode it in Base64"
2. **AI plans the approach** — The agent sends the task and tool descriptions to the configured AI provider
3. **AI calls a tool** — The response contains a JSON action block specifying which tool to run
4. **Tool executes** — The agent runs the tool and collects the result
5. **AI observes the result** — The result is fed back to the AI
6. **Loop continues** — Steps 3–5 repeat until the AI provides a final answer or max iterations are reached

## Getting Started

### 1. Configure an AI Provider

Agent Mode reuses the AI provider configuration from **Kobean Assistant**. Navigate to `/kobean` or `/ai-chat` and configure a provider:

- **OpenAI** — GPT-4 recommended for best results
- **Anthropic Claude** — Claude 3 Sonnet or Opus
- **Google Gemini** — Gemini 1.5 Pro
- **Azure OpenAI** — Enterprise GPT deployments
- **Ollama** — Local models (Llama 2, Mistral, etc.)

### 2. Navigate to Agent Mode

Go to `/agent` in the QA Utils app, or find **Agent Mode** in the tool list.

### 3. Describe Your Task

Enter a task description or pick from the preset examples:

- *"Generate a UUID and then base64 encode it"*
- *"Create a 24-char password with only letters and numbers"*
- *"Generate 3 UUIDs and count their total characters"*
- *"Give me the current Unix timestamp and convert it to a readable date"*
- *"Generate lorem ipsum (2 paragraphs) then count the words"*

### 4. Watch the Agent Work

The agent displays a **step-by-step timeline** showing:

| Step Type | Icon | Description |
|-----------|------|-------------|
| 💭 Thinking | Secondary | AI reasoning about the next action |
| 🔧 Tool Call | Primary | Tool being called with parameters |
| ✅ Result | Green | Tool execution result |
| 💬 Answer | Info | Final answer from the AI |
| ❌ Error | Red | Error during execution |

## Features

- **Autonomous Execution** — Describe a task in natural language, the agent handles the rest
- **Multi-Step Tasks** — Chain multiple tools together automatically
- **Step Timeline** — Visual timeline of every reasoning step and tool call
- **Preset Examples** — Quick-start task templates
- **Configurable Iterations** — Set max iterations (1–25) to control complexity
- **Error Recovery** — Graceful handling of tool failures with alternative approaches
- **Shared Config** — Reuses AI provider settings from Kobean Assistant

## Advanced Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Max Iterations** | 10 | Maximum number of tool-calling iterations (1–25) |
| **Temperature** | 0.3 | AI response creativity (lower = more focused) |
| **Provider** | From Kobean | AI provider (shared setting) |
| **Model** | From Kobean | AI model (shared setting) |

## Architecture

### Action Block Format

The agent instructs the AI to respond with JSON action blocks:

````
```action
{"tool": "generate_uuid", "params": {"quantity": 1}}
```
````

The agent parser extracts these blocks, executes the specified tool, and feeds the result back to the AI conversation.

### Key Files

| File | Description |
|------|-------------|
| `src/utils/agentExecutor.ts` | Core executor with action parsing, tool execution loop, error handling |
| `src/components/utils/AgentMode.tsx` | React UI with task input, timeline, and answer display |
| `src/components/utils/AgentMode.css` | Timeline styling |

### System Prompt

The agent system prompt includes:

1. **Tool descriptions** — Auto-generated from the tool registry with parameters and types
2. **Action format** — Instructions on how to call tools via JSON blocks
3. **Rules** — Step-by-step reasoning, one tool per response, no invented results

## Limitations

- **Requires AI Provider** — An AI provider must be configured for the agent to function
- **Token Usage** — Each iteration consumes AI tokens; complex tasks may use significant tokens
- **Tool Scope** — The agent can only use tools registered in the QA Utils tool registry
- **No Persistence** — Agent state is not saved between sessions
