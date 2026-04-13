import type { Command } from 'commander';
import { sanitizeHtml } from '../lib/tools.js';

export function registerHtmlCommand(program: Command): void {
  const cmd = program
    .command('html')
    .description('HTML utilities');

  cmd
    .command('sanitize <input>')
    .description('Remove <script> tags and inline on* event handlers from HTML')
    .action((input: string) => {
      console.log(sanitizeHtml(input));
    });
}
