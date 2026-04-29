import type { Command } from 'commander';
import { convertMarkdownToConfluence } from '../lib/tools.js';

export function registerMarkdownCommand(program: Command): void {
  const cmd = program
    .command('md-confluence')
    .description('Convert Markdown text to Confluence Wiki markup');

  cmd
    .argument('<input>', 'Markdown text to convert')
    .action((input: string) => {
      console.log(convertMarkdownToConfluence(input));
    });
}
