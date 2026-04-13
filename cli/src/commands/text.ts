import type { Command } from 'commander';
import { countTextStats } from '../lib/tools.js';
import { printTable } from '../utils/output.js';

export function registerTextCommand(program: Command): void {
  program
    .command('text <input>')
    .description('Analyse text — count characters, words, sentences, lines, and paragraphs')
    .action((input: string) => {
      const stats = countTextStats(input);
      printTable([
        ['Characters', String(stats.characters)],
        ['Chars (no spaces)', String(stats.charactersNoSpaces)],
        ['Words', String(stats.words)],
        ['Sentences', String(stats.sentences)],
        ['Lines', String(stats.lines)],
        ['Paragraphs', String(stats.paragraphs)],
      ]);
    });
}
