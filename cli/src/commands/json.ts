import { readFileSync } from 'node:fs';
import type { Command } from 'commander';
import chalk from 'chalk';
import { formatJson } from '../lib/tools.js';
import { printError } from '../utils/output.js';

/** If the argument looks like a file path, try to read it; otherwise return as-is. */
function resolveInput(input: string): string {
  if (
    input.endsWith('.json') ||
    input.startsWith('/') ||
    input.startsWith('./') ||
    input.startsWith('../')
  ) {
    try {
      return readFileSync(input, 'utf-8');
    } catch {
      // Fall through — treat it as a raw JSON string
    }
  }
  return input;
}

export function registerJsonCommand(program: Command): void {
  const cmd = program
    .command('json')
    .description('Format and validate JSON strings or files');

  cmd
    .command('format <input>')
    .description('Pretty-print JSON (accepts a JSON string or a file path)')
    .option('-i, --indent <number>', 'indentation spaces', '2')
    .action((input: string, options: { indent: string }) => {
      const raw = resolveInput(input);
      const indent = Math.max(0, parseInt(options.indent, 10) || 2);
      const result = formatJson(raw, indent);
      if (!result.valid) {
        printError(result.error ?? 'Invalid JSON');
        process.exit(1);
      }
      console.log(result.formatted);
    });

  cmd
    .command('validate <input>')
    .description('Validate a JSON string or file')
    .action((input: string) => {
      const raw = resolveInput(input);
      const result = formatJson(raw);
      if (result.valid) {
        console.log(`${chalk.green('✓')}  Valid JSON`);
      } else {
        console.log(`${chalk.red('✗')}  Invalid JSON: ${result.error ?? ''}`);
        process.exit(1);
      }
    });

  cmd
    .command('minify <input>')
    .description('Minify JSON (removes all whitespace)')
    .action((input: string) => {
      const raw = resolveInput(input);
      const result = formatJson(raw, 0);
      if (!result.valid) {
        printError(result.error ?? 'Invalid JSON');
        process.exit(1);
      }
      // JSON.stringify with indent=0 still adds newlines; use no-indent stringify
      try {
        console.log(JSON.stringify(JSON.parse(raw)));
      } catch {
        printError('Invalid JSON');
        process.exit(1);
      }
    });
}
