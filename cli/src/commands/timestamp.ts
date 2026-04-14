import type { Command } from 'commander';
import { convertTimestamp } from '../lib/tools.js';
import { printTable } from '../utils/output.js';

export function registerTimestampCommand(program: Command): void {
  program
    .command('timestamp [value]')
    .description(
      'Convert a Unix timestamp (seconds/ms) or ISO date string to all formats.\n' +
        'Omit [value] to use the current time.',
    )
    .action((value?: string) => {
      const result = convertTimestamp(value);
      printTable([
        ['Unix (s)', String(result.timestamp)],
        ['ISO 8601', result.iso],
        ['UTC', result.utc],
        ['Local', result.local],
      ]);
    });
}
