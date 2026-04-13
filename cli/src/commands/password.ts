import type { Command } from 'commander';
import { generatePassword } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerPasswordCommand(program: Command): void {
  program
    .command('password')
    .description('Generate one or more secure random passwords')
    .option('-l, --length <number>', 'password length (1–256)', '16')
    .option('-c, --count <number>', 'number of passwords to generate', '1')
    .option('--no-uppercase', 'exclude uppercase letters (A–Z)')
    .option('--no-lowercase', 'exclude lowercase letters (a–z)')
    .option('--no-numbers', 'exclude digits (0–9)')
    .option('--no-symbols', 'exclude symbols (!@#$…)')
    .action(
      (options: {
        length: string;
        count: string;
        uppercase: boolean;
        lowercase: boolean;
        numbers: boolean;
        symbols: boolean;
      }) => {
        const length = parseInt(options.length, 10);
        const count = parseInt(options.count, 10);

        if (isNaN(length) || length < 1) {
          printError('--length must be a positive integer');
          process.exit(1);
        }
        if (isNaN(count) || count < 1) {
          printError('--count must be a positive integer');
          process.exit(1);
        }

        for (let i = 0; i < count; i++) {
          console.log(
            generatePassword(length, {
              uppercase: options.uppercase,
              lowercase: options.lowercase,
              numbers: options.numbers,
              symbols: options.symbols,
            }),
          );
        }
      },
    );
}
