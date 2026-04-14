import type { Command } from 'commander';
import chalk from 'chalk';

import { testRegex } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerRegexCommand(program: Command): void {
  program
    .command('regex <pattern> <text>')
    .description('Test a regular expression against a string')
    .option('-f, --flags <flags>', 'regex flags (e.g., gi)', 'gi')
    .action(
      (pattern: string, text: string, options: { flags: string }) => {
        const result = testRegex(pattern, options.flags, text);

        if (!result.valid) {
          printError(result.error ?? 'Invalid regular expression');
          process.exit(1);
        }

        if (result.count === 0) {
          console.log(chalk.yellow('  No matches found'));
          return;
        }

        console.log(
          chalk.bold.green(
            `  ${result.count} match${result.count > 1 ? 'es' : ''} found`,
          ),
        );
        console.log();

        result.matches.forEach((m, i) => {
          console.log(
            `  ${chalk.dim(`${String(i + 1).padStart(2)}.`)}  ` +
              chalk.bold.yellow(`"${m.match}"`) +
              chalk.dim(`  @ index ${m.index}`),
          );
          m.groups.forEach((g, gi) => {
            console.log(
              `        ${chalk.cyan(`group ${gi + 1}:`)} ${chalk.white(g ?? chalk.dim('(undefined)'))}`,
            );
          });
        });
        console.log();
      },
    );
}
