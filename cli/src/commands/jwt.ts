import type { Command } from 'commander';
import chalk from 'chalk';
import { decodeJwt } from '../lib/tools.js';
import { printError, printWarn, printHeading, printDivider, printTable } from '../utils/output.js';

export function registerJwtCommand(program: Command): void {
  program
    .command('jwt <token>')
    .description('Decode a JWT token (signature is NOT verified)')
    .option('--json', 'output raw JSON instead of formatted table')
    .action((token: string, options: { json: boolean }) => {
      const result = decodeJwt(token);

      if (result.error) {
        printError(result.error);
        process.exit(1);
      }

      if (options.json) {
        console.log(JSON.stringify({ header: result.header, payload: result.payload, expired: result.expired }, null, 2));
        return;
      }

      printHeading('Header');
      printDivider();
      if (result.header) {
        printTable(
          Object.entries(result.header).map(([k, v]) => [k, JSON.stringify(v)]),
        );
      }

      printHeading('Payload');
      printDivider();
      if (result.payload) {
        printTable(
          Object.entries(result.payload).map(([k, v]) => [k, JSON.stringify(v)]),
        );
      }

      console.log();
      if (result.expired === null) {
        printWarn('No `exp` claim — cannot determine expiration');
      } else if (result.expired) {
        printWarn(chalk.red('Token is EXPIRED'));
      } else {
        console.log(`${chalk.green('✓')}  Token is valid (not yet expired)`);
      }
      console.log();
    });
}
