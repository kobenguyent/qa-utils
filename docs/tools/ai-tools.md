# AI-Powered Tools

Tools that leverage AI capabilities for enhanced QA workflows.

## 🤖 AI Chat (Kobean Assistant)

Advanced AI chat interface with multi-provider support and tool management.

### Supported Providers

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-3.5, GPT-4, GPT-4 Turbo |
| **Anthropic Claude** | Claude 3 Opus, Sonnet, Haiku (200K context) |
| **Google Gemini** | Gemini 1.5 Flash, 1.5 Pro, 2.0 Flash (up to 2M tokens) |
| **Azure OpenAI** | Enterprise GPT deployments |
| **Ollama** | Llama 2, Mistral, CodeLlama, and other local models |

### Features

- **Token Optimization** — Automatic counting and smart compression
- **System Prompts** — Default, Technical, and Creative modes
- **Conversation Management** — Save, load, export (JSON/Markdown)
- **Knowledge Base (CAG)** — Upload files for Cache-Augmented Generation
- **MCP Tool Management** — Enable/disable tools, connect custom servers

**Route:** `/ai-chat`

::: tip Provider Setup
See the [AI Provider Setup](#ai-provider-setup) section below for configuration instructions.
:::

---

## 🤖 Agent Mode

Autonomous AI agent that plans and executes multi-step tasks using QA tools.

The agent operates in an **observe-think-act loop**:

1. Receives a task description
2. Sends task + tool descriptions to the AI provider
3. AI responds with reasoning and a tool call action block
4. Agent executes the tool and feeds results back
5. Repeats until the task is complete or max iterations reached

**Route:** `/agent`

➡️ [Full Agent Mode documentation](/agent-mode)

---

## ✨ Prompt Enhancer

Improve AI prompts using intelligent rewriting techniques.

- Multiple enhancement strategies
- Before/after comparison
- Copy enhanced prompts

**Route:** `/prompt-enhancer`

---

## 🤖 AI Website Tester

AI-powered website testing and analysis.

- Automated test scenario generation
- Accessibility evaluation
- Performance insights
- AI-driven recommendations

**Route:** `/ai-website-tester`

---

## 🧠 Kobean Assistant (Jarvis)

Alternative AI assistant interface with focused capabilities.

**Route:** `/kobean`, `/jarvis`

---

## AI Provider Setup {#ai-provider-setup}

### OpenAI
1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Generate an API key from [API Keys](https://platform.openai.com/api-keys)
3. Select **OpenAI** provider and enter your key

### Anthropic Claude
1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Generate an API key from account settings
3. Select **Anthropic Claude** provider and enter your key

### Google Gemini
1. Sign up at [Google AI Studio](https://makersuite.google.com/)
2. Generate an API key
3. Select **Google Gemini** provider and enter your key

### Azure OpenAI
1. Create an Azure OpenAI resource in Azure Portal
2. Deploy a model (e.g., gpt-35-turbo)
3. Get your API key and endpoint
4. Select **Azure OpenAI** provider and enter credentials

### Ollama (Local)
1. Install from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama2`
3. Set CORS:
   ```bash
   export OLLAMA_ORIGINS="https://kobenguyent.github.io"
   ollama serve
   ```
4. Select **Ollama (Local)** provider
