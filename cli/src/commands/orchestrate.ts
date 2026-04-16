/**
 * qautils-cli — Orchestrate Command
 *
 * Usage:
 *   qautils orchestrate <task>             Run an auto-orchestrated multi-agent pipeline
 *   qautils orchestrate <task> --verbose   Show step-by-step agent reasoning
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { readConfig, toDisplayConfig, formatConfigForDisplay, type AIProviderConfig } from '../lib/aiConfig.js';
import {
  runAutoOrchestratedPipeline,
  parseDelegationPlan,
  parseTeamPlan,
  type AutoOrchestrateEvent,
  type AutoTeamMember,
} from '../lib/cliOrchestrator.js';

// Re-export parsers for testing
export { parseDelegationPlan, parseTeamPlan };

const T = {
  border:  (s: string) => chalk.cyan(s),
  title:   (s: string) => chalk.bold.yellow(s),
  dim:     (s: string) => chalk.dim(s),
  success: (s: string) => chalk.bold.green(s),
  error:   (s: string) => chalk.bold.red(s),
  agent:   (s: string) => chalk.bold.cyan(s),
  role:    (s: string) => chalk.magenta(s),
  step:    (s: string) => chalk.bold.blue(s),
};

const STEP_ICONS: Record<string, string> = {
  thinking:    '💭',
  tool_call:   '🔧',
  tool_result: '✅',
  answer:      '💬',
  error:       '❌',
};

function printTeam(team: AutoTeamMember[]): void {
  console.log(T.dim('  Auto-assembled team:'));
  team.forEach(m => {
    console.log(`    ${chalk.cyan('·')}  ${T.agent(m.name.padEnd(16))} ${T.role(`[${m.role}]`.padEnd(14))} ${T.dim(m.specialty)}`);
  });
  console.log();
}

export function registerOrchestrateCommand(program: Command): void {
  program
    .command('orchestrate <task>')
    .description('Run an autonomous multi-agent orchestration pipeline')
    .option('--max-iterations <n>', 'Maximum tool-calling iterations per agent (default: 10)', '10')
    .option('--provider <provider>', 'AI provider (overrides saved config)')
    .option('--model <model>', 'Model (overrides saved config)')
    .option('--verbose', 'Show step-by-step agent reasoning and tool calls')
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
      console.log(T.title('  🤖 QA Utils Orchestrator'));
      console.log(T.dim('  ' + '─'.repeat(54)));
      console.log(T.dim('  Task: ') + chalk.white(task));
      console.log(T.dim('  Config: ') + chalk.cyan(formatConfigForDisplay(toDisplayConfig(config)).trim()));
      console.log();

      const spinner = opts.verbose ? null : ora({ text: T.dim('  Assembling team and running pipeline…'), color: 'cyan' }).start();

      let currentAgent = '';

      const onEvent = (event: AutoOrchestrateEvent) => {
        if (!opts.verbose) {
          // In non-verbose mode just update the spinner text
          if (event.type === 'agent_start' && event.agentName) {
            spinner?.start(T.dim(`  [${event.agentName}] working…`));
          }
          if (event.type === 'agent_done' && event.agentName === 'Meta-Orchestrator' && event.autoTeam) {
            spinner?.stop();
            printTeam(event.autoTeam);
            spinner?.start(T.dim('  Running orchestrated pipeline…'));
          }
          return;
        }

        // Verbose output
        switch (event.type) {
          case 'pipeline_start':
            console.log(T.dim('  ── Pipeline started ──────────────────────────────────'));
            break;

          case 'agent_start':
            currentAgent = event.agentName ?? '';
            console.log();
            console.log(`  ${T.agent(`▶ ${currentAgent}`)} ${event.agentRole ? T.role(`[${event.agentRole}]`) : ''}`);
            break;

          case 'agent_done':
            if (event.agentName === 'Meta-Orchestrator' && event.autoTeam) {
              console.log();
              printTeam(event.autoTeam);
            } else if (event.result) {
              const icon = event.result.success ? '✓' : '✗';
              const colour = event.result.success ? chalk.green : chalk.red;
              console.log(`  ${colour(icon)} ${T.dim(`${event.agentName} completed (${event.result.duration}ms)`)}`);
            }
            break;

          case 'orchestrator_plan':
            if (event.plan) {
              console.log(T.dim('  Delegation plan:'));
              event.plan.plan.forEach(item => {
                console.log(`    ${chalk.cyan('→')} ${T.agent(item.agentName)}: ${T.dim(item.subTask.slice(0, 80))}${item.subTask.length > 80 ? '…' : ''}`);
              });
            }
            break;

          case 'agent_step':
            if (event.step) {
              const icon = STEP_ICONS[event.step.type] ?? '·';
              const agentLabel = event.agentName && event.agentName !== currentAgent
                ? chalk.dim(`[${event.agentName}] `)
                : '';
              console.log(`    ${icon} ${agentLabel}${T.step(`[${event.step.type}]`)} ${event.step.toolName ? chalk.cyan(`(${event.step.toolName}) `) : ''}${event.step.content.slice(0, 120)}`);
            }
            break;

          case 'pipeline_done':
            console.log();
            console.log(T.dim('  ── Pipeline complete ─────────────────────────────────'));
            break;
        }
      };

      try {
        const result = await runAutoOrchestratedPipeline(
          task,
          { ...config, maxIterations },
          onEvent,
        );

        spinner?.stop();

        // ── Summary output ──────────────────────────────────────────────────
        if (result.success) {
          console.log(T.success('\n  ✓  Orchestration complete!\n'));
        } else {
          console.log(T.error('\n  ✗  Orchestration finished with errors.\n'));
        }

        // Print final answer
        console.log(chalk.white('  ' + result.summary.split('\n').join('\n  ')));

        // Stats
        console.log();
        console.log(T.dim('  ── Stats ─────────────────────────────────────────────'));
        console.log(T.dim(`  Total duration : ${(result.totalDuration / 1000).toFixed(1)}s`));
        console.log(T.dim(`  Agents run     : ${result.agentResults.length}`));
        if (result.autoTeam.length > 0) {
          console.log(T.dim(`  Team size      : ${result.autoTeam.length} workers + orchestrator`));
        }
        if (result.error) {
          console.log(T.error(`  Error          : ${result.error}`));
        }
        console.log();
      } catch (err) {
        spinner?.stop();
        const message = err instanceof Error ? err.message : String(err);
        console.error(T.error(`\n  ✗  Error: ${message}\n`));
        process.exit(1);
      }
    });
}
