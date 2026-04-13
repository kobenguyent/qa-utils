import type { Command } from 'commander';
import { generateLoremIpsum } from '../lib/tools.js';

export function registerLoremCommand(program: Command): void {
  program
    .command('lorem')
    .description('Generate Lorem Ipsum placeholder text')
    .option('-p, --paragraphs <number>', 'number of paragraphs (1–20)', '1')
    .action((options: { paragraphs: string }) => {
      const count = Math.max(1, parseInt(options.paragraphs, 10) || 1);
      console.log(generateLoremIpsum(count));
    });
}
