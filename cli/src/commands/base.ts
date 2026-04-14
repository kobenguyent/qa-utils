import type { Command } from 'commander';
import chalk from 'chalk';

import { convertBase } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerBaseCommand(program: Command): void {
  program
    .command('base <value>')
    .description('Convert a number between bases (2–36)')
    .option('--from <base>', 'source base (default: 10)', '10')
    .option('--to <base>', 'target base (default: 16)', '16')
    .option('--all', 'show BIN, OCT, DEC, and HEX simultaneously')
    .action(
      (
        value: string,
        options: { from: string; to: string; all: boolean },
      ) => {
        const fromBase = parseInt(options.from, 10);

        if (options.all) {
          const bases: Array<[string, number]> = [
            ['BIN', 2],
            ['OCT', 8],
            ['DEC', 10],
            ['HEX', 16],
          ];
          for (const [label, base] of bases) {
            const r = convertBase(value, fromBase, base);
            if (r.error) {
              printError(r.error);
              process.exit(1);
            }
            console.log(`  ${chalk.cyan(label.padEnd(4))} ${chalk.bold(r.result)}`);
          }
          return;
        }

        const toBase = parseInt(options.to, 10);
        const r = convertBase(value, fromBase, toBase);
        if (r.error) {
          printError(r.error);
          process.exit(1);
        }
        console.log(r.result);
      },
    );
}
