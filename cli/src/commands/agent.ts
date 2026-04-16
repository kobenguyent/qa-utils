/**
 * qautils-cli — Agent Command
 *
 * Usage:
 *   qautils agent run <task>          Run an autonomous agent task
 *   qautils agent list                List available agent tools
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { readConfig, toDisplayConfig, formatConfigForDisplay, type AIProviderConfig } from '../lib/aiConfig.js';
import { runCliAgent, parseActionBlock } from '../lib/cliAgentExecutor.js';

const T = {
  border: (s: string) => chalk.cyan(s),
  title:  (s: string) => chalk.bold.yellow(s),
  dim:    (s: string) => chalk.dim(s),
  success:(s: string) => chalk.bold.green(s),
  error:  (s: string) => chalk.bold.red(s),
  step:   (s: string) => chalk.bold.cyan(s),
};

// Re-export for testing
export { parseActionBlock };

const AGENT_TOOLS = [
  { id: 'generate_uuid',      description: 'Generate UUID v4 values' },
  { id: 'base64_encode',      description: 'Encode a string to Base64' },
  { id: 'base64_decode',      description: 'Decode a Base64 string' },
  { id: 'hash_text',          description: 'Hash text with SHA-256/SHA-512/MD5' },
  { id: 'generate_lorem',     description: 'Generate lorem ipsum text' },
  { id: 'current_timestamp',  description: 'Get the current Unix timestamp and ISO date' },
  { id: 'generate_password',  description: 'Generate a random secure password' },
  { id: 'count_characters',   description: 'Count characters and words in a string' },
];

export function registerAgentCommand(program: Command): void {
  const agentCmd = program
    .command('agent')
    .description('Autonomous AI agent — run multi-step QA tasks using built-in tools');

  // ── agent run ──────────────────────────────────────────────────────────────
  agentCmd
    .command('run <task>')
    .description('Run an autonomous agent task')
    .option('--max-iterations <n>', 'Maximum tool-calling iterations (default: 10)', '10')
    .option('--provider <provider>', 'AI provider (overrides saved config)')
    .option('--model <model>', 'Model (overrides saved config)')
    .option('--verbose', 'Show step-by-step agent reasoning')
    .action(async (task: string, opts: {
      maxIterations: string;
      provider?: string;
      model?: string;
      verbose?: boolean;
    }) => {
      let config = readConfig();

      if (opts.provider) {
        config = {
          ...(config ?? {}),
          provider: opts.provider as AIProviderConfig['provider'],
          ...(opts.model ? { model: opts.model } : {}),
        };
      }

      if (!config) {
        console.log();
        console.log(chalk.bold.yellow('  ⚠  AI provider not configured.'));
        console.log(T.dim(`  Run ${chalk.cyan('qautils chat config')} to set up your provider first.\n`));
        process.exit(1);
      }

      const maxIterations = Math.max(1, Math.min(parseInt(opts.maxIterations, 10) || 10, 25));

      console.log();
      console.log(T.title('  🤖 QA Utils Agent'));
      console.log(T.dim('  ' + '─'.repeat(50)));
      console.log(T.dim(`  Task: `) + chalk.white(task));
      console.log(T.dim(`  Config: `) + chalk.cyan(formatConfigForDisplay(toDisplayConfig(config)).trim()));
      console.log();

      const spinner = opts.verbose ? null : ora({ text: T.dim('  Agent is working…'), color: 'cyan' }).start();

      try {
        const result = await runCliAgent(
          task,
          { ...config, maxIterations },
          opts.verbose ? (step) => {
            const icons: Record<string, string> = {
              thinking:    '💭',
              tool_call:   '🔧',
              tool_result: '✅',
              answer:      '💬',
              error:       '❌',
            };
            const icon = icons[step.type] ?? '·';
            console.log(`  ${icon} ${T.step(`[${step.type}]`)} ${step.toolName ? chalk.cyan(`(${step.toolName}) `) : ''}${step.content}`);
          } : undefined,
        );

        spinner?.stop();

        if (result.success) {
          console.log(T.success('\n  ✓  Task complete!\n'));
          console.log(chalk.white('  ' + result.answer.split('\n').join('\n  ')));
        } else {
          console.log(T.error('\n  ✗  Agent could not complete the task.'));
          if (result.error) console.log(T.dim(`  Reason: ${result.error}`));
          if (result.answer) console.log(chalk.dim('\n  Partial answer:\n  ' + result.answer));
        }
        console.log();
        console.log(T.dim(`  Iterations used: ${result.iterationCount}/${maxIterations}`));
        console.log();
      } catch (err) {
        spinner?.stop();
        const message = err instanceof Error ? err.message : String(err);
        console.error(T.error(`\n  ✗  Error: ${message}\n`));
        process.exit(1);
      }
    });

  // ── agent list ─────────────────────────────────────────────────────────────
  agentCmd
    .command('list')
    .description('List all tools available to the agent')
    .action(() => {
      console.log();
      console.log(T.title('  Available Agent Tools'));
      console.log(T.dim('  ' + '─'.repeat(50)));
      AGENT_TOOLS.forEach(tool => {
        console.log(`  ${chalk.cyan('·')}  ${chalk.bold(tool.id.padEnd(22))} ${T.dim(tool.description)}`);
      });
      console.log();
      console.log(T.dim(`  Total: ${AGENT_TOOLS.length} tools`));
      console.log();
    });
}
