/**
 * qautils-cli — Kobean Chat Command
 *
 * Usage:
 *   qautils chat                   Start an interactive AI chat session
 *   qautils chat config            Configure AI provider (interactive wizard)
 *   qautils chat config --show     Show current AI provider configuration
 *   qautils chat config --reset    Remove the stored configuration
 */

import readline from 'readline';
import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { select, input, password } from '@inquirer/prompts';

import {
  readConfig,
  writeConfig,
  deleteConfig,
  validateAIConfig,
  formatConfigForDisplay,
  DEFAULT_MODELS,
  DEFAULT_ENDPOINTS,
  type AIProvider,
  type AIProviderConfig,
} from '../lib/aiConfig.js';
import { sendChat, KOBEAN_SYSTEM_PROMPT, type ChatMessage } from '../lib/aiClient.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const T = {
  border:   (s: string) => chalk.cyan(s),
  title:    (s: string) => chalk.bold.yellow(s),
  dim:      (s: string) => chalk.dim(s),
  success:  (s: string) => chalk.bold.green(s),
  error:    (s: string) => chalk.bold.red(s),
  you:      (s: string) => chalk.bold.cyan(s),
  kobean:   (s: string) => chalk.bold.magenta(s),
  info:     (s: string) => chalk.dim(s),
};

const BOX_W = 62;

function chatBanner(): void {
  const bar = '─'.repeat(BOX_W);
  const empty = ' '.repeat(BOX_W);
  console.log();
  console.log(T.border(`  ╭${bar}╮`));
  console.log(T.border('  │') + empty + T.border('│'));
  console.log(
    T.border('  │') +
      '  ' + chalk.bold.magenta('🤖 Kobean') +
      chalk.bold.yellow(' AI Chat') +
      ' '.repeat(BOX_W - 18) +
      T.border('│'),
  );
  console.log(T.border('  │') + empty + T.border('│'));
  console.log(
    T.border('  │') +
      T.dim('  Type your message and press Enter. Type ') +
      chalk.cyan('/exit') +
      T.dim(' to quit.  ') +
      T.border('│'),
  );
  console.log(T.border('  │') + empty + T.border('│'));
  console.log(T.border(`  ╰${bar}╯`));
  console.log();
}

function printMessage(role: 'you' | 'kobean', text: string): void {
  const prefix = role === 'you'
    ? T.you('  You     › ')
    : T.kobean('  Kobean  › ');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (i === 0) {
      console.log(`${prefix}${line}`);
    } else {
      console.log(`            ${line}`);
    }
  });
  console.log();
}

// ── Interactive config wizard ─────────────────────────────────────────────────

async function runConfigWizard(): Promise<void> {
  console.log();
  console.log(T.title('  ◆  Configure Kobean AI Provider'));
  console.log(T.dim('  ─'.repeat(30)));
  console.log();

  const provider = await select<AIProvider>({
    message: 'Select AI provider:',
    choices: [
      { name: 'OpenAI (GPT-3.5 / GPT-4)', value: 'openai' },
      { name: 'Anthropic Claude', value: 'anthropic' },
      { name: 'Google Gemini', value: 'google' },
      { name: 'Azure OpenAI', value: 'azure-openai' },
      { name: 'Ollama (local)', value: 'ollama' },
    ],
  });

  const requiresApiKey: AIProvider[] = ['openai', 'anthropic', 'google', 'azure-openai'];
  let apiKey: string | undefined;
  if (requiresApiKey.includes(provider)) {
    apiKey = await password({ message: `${provider} API key:`, mask: '*' });
    if (!apiKey) {
      console.error(T.error('  ✗  API key is required. Configuration cancelled.'));
      process.exit(1);
    }
  }

  const defaultModel = DEFAULT_MODELS[provider];
  const modelInput = await input({
    message: `Model (leave blank for default: ${defaultModel}):`,
  });
  const model = modelInput.trim() || defaultModel;

  let endpoint: string | undefined;
  if (provider === 'ollama') {
    const ep = await input({
      message: `Ollama endpoint (default: ${DEFAULT_ENDPOINTS['ollama']}):`,
    });
    endpoint = ep.trim() || DEFAULT_ENDPOINTS['ollama'];
  } else if (provider === 'azure-openai') {
    const ep = await input({
      message: 'Azure OpenAI endpoint (e.g. https://<resource>.openai.azure.com):',
    });
    endpoint = ep.trim();
    if (!endpoint) {
      console.error(T.error('  ✗  Endpoint is required for Azure OpenAI. Configuration cancelled.'));
      process.exit(1);
    }
  }

  let azureApiVersion: string | undefined;
  if (provider === 'azure-openai') {
    const ver = await input({ message: 'Azure API version (default: 2024-02-15-preview):' });
    azureApiVersion = ver.trim() || '2024-02-15-preview';
  }

  const tempInput = await input({ message: 'Temperature (0–1, default: 0.7):' });
  const temperature = parseFloat(tempInput) || 0.7;

  const config: AIProviderConfig = {
    provider,
    model,
    temperature,
    ...(apiKey ? { apiKey } : {}),
    ...(endpoint ? { endpoint } : {}),
    ...(azureApiVersion ? { azureApiVersion } : {}),
  };

  const validationError = validateAIConfig(config);
  if (validationError) {
    console.error(T.error(`  ✗  ${validationError}`));
    process.exit(1);
  }

  writeConfig(config);

  console.log();
  console.log(T.success('  ✓  Configuration saved!'));
  console.log();
  console.log(formatConfigForDisplay(config));
  console.log();
  console.log(T.dim(`  Run ${chalk.cyan('qautils chat')} to start a chat session.\n`));
}

// ── Chat session ──────────────────────────────────────────────────────────────

async function runChatSession(config: AIProviderConfig): Promise<void> {
  chatBanner();
  console.log(T.info(`  Connected to: ${chalk.cyan(config.provider)} / ${chalk.cyan(config.model || DEFAULT_MODELS[config.provider])}`));
  console.log(T.info(`  Type ${chalk.cyan('/clear')} to reset history, ${chalk.cyan('/help')} for tips.`));
  console.log();

  const history: ChatMessage[] = [
    { role: 'system', content: KOBEAN_SYSTEM_PROMPT },
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: chalk.cyan('  You › '),
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    const userInput = line.trim();

    if (!userInput) {
      rl.prompt();
      return;
    }

    // ── Built-in commands ──────────────────────────────────────────────
    if (userInput === '/exit' || userInput === '/quit') {
      rl.close();
      return;
    }

    if (userInput === '/clear') {
      history.splice(1); // keep system message
      console.log(T.dim('  ↺  Conversation history cleared.\n'));
      rl.prompt();
      return;
    }

    if (userInput === '/help') {
      console.log();
      console.log(T.title('  Kobean Chat — Commands'));
      console.log(T.dim('  ─────────────────────────────────────────'));
      console.log(`  ${chalk.cyan('/clear')}   Reset conversation history`);
      console.log(`  ${chalk.cyan('/exit')}    Exit the chat session`);
      console.log(`  ${chalk.cyan('/model')}   Show current AI provider and model`);
      console.log();
      rl.prompt();
      return;
    }

    if (userInput === '/model') {
      console.log();
      console.log(formatConfigForDisplay(config));
      console.log();
      rl.prompt();
      return;
    }

    // ── Send to AI ─────────────────────────────────────────────────────
    history.push({ role: 'user', content: userInput });

    const spinner = ora({ text: T.dim('  Kobean is thinking…'), color: 'magenta' }).start();

    try {
      const response = await sendChat(history, config);
      spinner.stop();
      history.push({ role: 'assistant', content: response.message });
      printMessage('kobean', response.message);
    } catch (err) {
      spinner.stop();
      const message = err instanceof Error ? err.message : String(err);
      console.error(T.error(`  ✗  Error: ${message}\n`));
      // Remove the failed user message so history stays consistent
      history.pop();
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(T.dim('\n  Goodbye! 👋\n'));
    process.exit(0);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    rl.close();
  });
}

// ── Command registration ──────────────────────────────────────────────────────

export function registerChatCommand(program: Command): void {
  const chatCmd = program
    .command('chat')
    .description('Start an interactive Kobean AI chat session')
    .option('--provider <provider>', 'AI provider to use (overrides saved config)')
    .option('--model <model>', 'Model to use (overrides saved config)')
    .action(async (options: { provider?: string; model?: string }) => {
      let config = readConfig();

      // Allow runtime overrides for quick one-off sessions
      if (options.provider || options.model) {
        const base = config ?? {
          provider: (options.provider as AIProvider) || 'ollama',
          endpoint: 'http://localhost:11434',
        };
        if (options.provider) base.provider = options.provider as AIProvider;
        if (options.model) base.model = options.model;
        config = base;
      }

      if (!config) {
        console.log();
        console.log(chalk.bold.yellow('  ⚠  AI provider not configured.'));
        console.log(T.dim(`  Run ${chalk.cyan('qautils chat config')} to set up your provider first.\n`));
        process.exit(1);
      }

      const validationError = validateAIConfig(config);
      if (validationError) {
        console.error(chalk.red(`  ✗  Config error: ${validationError}`));
        console.log(T.dim(`  Run ${chalk.cyan('qautils chat config')} to fix the configuration.\n`));
        process.exit(1);
      }

      await runChatSession(config);
    });

  // ── chat config sub-command ──────────────────────────────────────────────
  chatCmd
    .command('config')
    .description('Configure the AI provider for Kobean chat')
    .option('--show', 'Show the current configuration')
    .option('--reset', 'Remove the stored configuration')
    .option('--provider <provider>', 'Set provider non-interactively')
    .option('--api-key <key>', 'Set API key non-interactively')
    .option('--model <model>', 'Set model non-interactively')
    .option('--endpoint <url>', 'Set endpoint non-interactively')
    .option('--temperature <value>', 'Set temperature non-interactively (0–1)')
    .action(async (opts: {
      show?: boolean;
      reset?: boolean;
      provider?: string;
      apiKey?: string;
      model?: string;
      endpoint?: string;
      temperature?: string;
    }) => {
      // ── --show ──────────────────────────────────────────────────────────
      if (opts.show) {
        const config = readConfig();
        if (!config) {
          console.log(chalk.yellow('\n  ⚠  No configuration found.'));
          console.log(T.dim(`  Run ${chalk.cyan('qautils chat config')} to set up your provider.\n`));
        } else {
          console.log();
          console.log(T.title('  Current AI Provider Configuration'));
          console.log(T.dim('  ─'.repeat(30)));
          console.log();
          console.log(formatConfigForDisplay(config));
          console.log();
        }
        return;
      }

      // ── --reset ─────────────────────────────────────────────────────────
      if (opts.reset) {
        deleteConfig();
        console.log(T.success('\n  ✓  Configuration removed.\n'));
        return;
      }

      // ── Non-interactive flag-based configuration ─────────────────────────
      if (opts.provider) {
        const config: AIProviderConfig = {
          provider: opts.provider as AIProvider,
          ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
          ...(opts.model ? { model: opts.model } : {}),
          ...(opts.endpoint ? { endpoint: opts.endpoint } : {}),
          ...(opts.temperature ? { temperature: parseFloat(opts.temperature) } : {}),
        };

        const validationError = validateAIConfig(config);
        if (validationError) {
          console.error(T.error(`  ✗  ${validationError}`));
          process.exit(1);
        }

        writeConfig(config);
        console.log(T.success('\n  ✓  Configuration saved!'));
        console.log();
        console.log(formatConfigForDisplay(config));
        console.log();
        return;
      }

      // ── Interactive wizard ───────────────────────────────────────────────
      await runConfigWizard();
    });
}
