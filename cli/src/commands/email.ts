import type { Command } from 'commander';
import chalk from 'chalk';
import { validateEmail } from '../lib/tools.js';

export function registerEmailCommand(program: Command): void {
  program
    .command('email <address>')
    .description('Validate an email address')
    .action((address: string) => {
      const result = validateEmail(address);
      if (result.valid) {
        console.log(`${chalk.green('✓')}  ${chalk.bold(address)} is a valid email address`);
      } else {
        console.log(
          `${chalk.red('✗')}  ${chalk.bold(address)} — ${result.reason ?? 'Invalid email'}`,
        );
        process.exit(1);
      }
    });
}
