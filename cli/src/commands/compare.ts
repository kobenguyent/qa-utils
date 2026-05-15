import type { Command } from 'commander';
import { readFileSync } from 'node:fs';
import chalk from 'chalk';
import { compareTexts, type TextComparisonResult, type TextDiffLine } from '../lib/tools.js';
import { printError, printHeading, printRow, printTable, printDivider, printJson } from '../utils/output.js';

const DIFF_SYMBOLS: Record<TextDiffLine['type'], { symbol: string; color: (s: string) => string }> = {
  same:     { symbol: ' ', color: (s) => s },
  added:    { symbol: '+', color: chalk.green },
  removed:  { symbol: '-', color: chalk.red },
  modified: { symbol: '~', color: chalk.yellow },
};

function printDiff(result: TextComparisonResult, file1: string, file2: string, format: string): void {
  if (format === 'json') {
    printJson({ file1, file2, ...result });
    return;
  }

  // Stats header
  printHeading('File Comparison');
  printRow('File 1', file1);
  printRow('File 2', file2);
  printDivider();
  const simColor = result.similarity >= 80 ? chalk.green : result.similarity >= 50 ? chalk.yellow : chalk.red;
  printRow('Similarity', simColor(`${result.similarity}%`));
  printTable([
    ['Same',     chalk.white(String(result.stats.sameLines))],
    ['Added',    chalk.green(String(result.stats.addedLines))],
    ['Removed',  chalk.red(String(result.stats.removedLines))],
    ['Modified', chalk.yellow(String(result.stats.modifiedLines))],
    ['Total',    chalk.white(String(result.stats.totalLines))],
  ]);

  if (format === 'stats') return;

  // Unified diff output
  console.log();
  console.log(chalk.cyan(`--- ${file1}`));
  console.log(chalk.cyan(`+++ ${file2}`));
  console.log();

  for (const line of result.diffLines) {
    const { symbol, color } = DIFF_SYMBOLS[line.type];
    if (line.type === 'modified') {
      console.log(chalk.red(`- ${line.oldContent}`));
      console.log(chalk.green(`+ ${line.content}`));
    } else {
      console.log(color(`${symbol} ${line.content}`));
    }
  }
}

export function registerCompareCommand(program: Command): void {
  program
    .command('compare <file1> <file2>')
    .description('Compare two text files and show a line-by-line diff with similarity scoring')
    .option('-w, --ignore-whitespace', 'ignore whitespace differences', false)
    .option('-i, --ignore-case', 'ignore case differences', false)
    .option('-b, --ignore-blank-lines', 'ignore blank lines', false)
    .option('-t, --threshold <number>', 'similarity threshold (0-100) for "modified" detection', '60')
    .option('-f, --format <format>', 'output format: diff, stats, json', 'diff')
    .action((file1: string, file2: string, options: {
      ignoreWhitespace: boolean;
      ignoreCase: boolean;
      ignoreBlankLines: boolean;
      threshold: string;
      format: string;
    }) => {
      let text1: string;
      let text2: string;

      try {
        text1 = readFileSync(file1, 'utf-8');
      } catch {
        printError(`Cannot read file: ${file1}`);
        process.exit(1);
      }

      try {
        text2 = readFileSync(file2, 'utf-8');
      } catch {
        printError(`Cannot read file: ${file2}`);
        process.exit(1);
      }

      const threshold = parseInt(options.threshold, 10);
      if (isNaN(threshold) || threshold < 0 || threshold > 100) {
        printError('Threshold must be a number between 0 and 100');
        process.exit(1);
      }

      const result = compareTexts(text1, text2, {
        ignoreWhitespace: options.ignoreWhitespace,
        ignoreCase: options.ignoreCase,
        ignoreBlankLines: options.ignoreBlankLines,
        similarityThreshold: threshold / 100,
      });

      printDiff(result, file1, file2, options.format);
    });
}
