import type { Command } from 'commander';

import { generateNanoId } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerNanoidCommand(program: Command): void {
  program
    .command('nanoid')
    .description('Generate cryptographically random NanoID-style identifiers')
    .option('-s, --size <number>', 'character length of each ID (1–128)', '21')
    .option('-c, --count <number>', 'number of IDs to generate', '1')
    .action((options: { size: string; count: string }) => {
      const size = parseInt(options.size, 10);
      const count = parseInt(options.count, 10);

      if (isNaN(size) || size < 1) {
        printError('--size must be a positive integer');
        process.exit(1);
      }
      if (isNaN(count) || count < 1) {
        printError('--count must be a positive integer');
        process.exit(1);
      }

      for (let i = 0; i < count; i++) {
        console.log(generateNanoId(size));
      }
    });
}
