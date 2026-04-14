import type { Command } from 'commander';
import { generateRandomString } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerRandomCommand(program: Command): void {
  program
    .command('random')
    .description('Generate cryptographically random alphanumeric strings')
    .option('-l, --length <number>', 'string length (1–1024)', '16')
    .option('-c, --count <number>', 'number of strings to generate', '1')
    .action((options: { length: string; count: string }) => {
      const length = parseInt(options.length, 10);
      const count = parseInt(options.count, 10);

      if (isNaN(length) || length < 1) {
        printError('--length must be a positive integer');
        process.exit(1);
      }
      if (isNaN(count) || count < 1) {
        printError('--count must be a positive integer');
        process.exit(1);
      }

      for (let i = 0; i < count; i++) {
        console.log(generateRandomString(length));
      }
    });
}
