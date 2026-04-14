import type { Command } from 'commander';
import { generateUuids } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerUuidCommand(program: Command): void {
  program
    .command('uuid')
    .description('Generate one or more v4 UUIDs')
    .option('-c, --count <number>', 'number of UUIDs to generate', '1')
    .action((options: { count: string }) => {
      const count = parseInt(options.count, 10);
      if (isNaN(count) || count < 1) {
        printError('--count must be a positive integer');
        process.exit(1);
      }
      const uuids = generateUuids(count);
      uuids.forEach((uuid) => console.log(uuid));
    });
}
