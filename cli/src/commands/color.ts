import type { Command } from 'commander';
import chalk from 'chalk';
import { convertColor } from '../lib/tools.js';
import { printError, printTable } from '../utils/output.js';

export function registerColorCommand(program: Command): void {
  program
    .command('color <input>')
    .description(
      'Convert a color between HEX, RGB, and HSL representations.\n' +
        '  Accepted formats: #RRGGBB  |  #RGB  |  rgb(r, g, b)',
    )
    .action((input: string) => {
      const result = convertColor(input);
      if (result.error) {
        printError(result.error);
        process.exit(1);
      }

      const { r, g, b } = result.rgb;
      const { h, s, l } = result.hsl;

      // Show a tiny colour swatch (terminal-permitting)
      const swatch = chalk.bgHex(result.hex)('   ');

      printTable([
        ['Swatch', swatch],
        ['HEX', chalk.bold(result.hex)],
        ['RGB', `rgb(${r}, ${g}, ${b})`],
        ['HSL', `hsl(${h}, ${s}%, ${l}%)`],
      ]);
    });
}
