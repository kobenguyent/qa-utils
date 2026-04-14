import type { Command } from 'commander';

import { convertCase, CASE_TYPES, type CaseType } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerCaseCommand(program: Command): void {
  program
    .command('case <text>')
    .description(
      `Convert text to a different case style (${CASE_TYPES.join(', ')})`,
    )
    .option(
      '-t, --to <style>',
      `target case style (${CASE_TYPES.join(' | ')})`,
      'title',
    )
    .option('--all', 'show all case styles')
    .action(
      (text: string, options: { to: string; all: boolean }) => {
        if (options.all) {
          CASE_TYPES.forEach((style) => {
            process.stdout.write(
              `  ${''.padEnd(9 - style.length)}${style}  ${convertCase(text, style)}\n`,
            );
          });
          return;
        }

        if (!CASE_TYPES.includes(options.to as CaseType)) {
          printError(
            `Unknown style "${options.to}". Supported: ${CASE_TYPES.join(', ')}`,
          );
          process.exit(1);
        }

        console.log(convertCase(text, options.to as CaseType));
      },
    );
}
