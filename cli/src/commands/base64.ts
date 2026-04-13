import type { Command } from 'commander';
import { base64Encode, base64Decode } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerBase64Command(program: Command): void {
  const cmd = program
    .command('base64')
    .description('Encode or decode Base64 strings');

  cmd
    .command('encode <input>')
    .description('Encode text to Base64')
    .action((input: string) => {
      console.log(base64Encode(input));
    });

  cmd
    .command('decode <input>')
    .description('Decode a Base64 string back to text')
    .action((input: string) => {
      try {
        console.log(base64Decode(input));
      } catch (e) {
        printError(e instanceof Error ? e.message : 'Decode failed');
        process.exit(1);
      }
    });
}
