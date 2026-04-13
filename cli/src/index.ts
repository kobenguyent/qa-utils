#!/usr/bin/env node

/**
 * qautils-cli — QA Utils Command-Line Interface
 *
 * No arguments  →  interactive TUI mode
 * With arguments →  direct CLI mode
 *
 * Usage:  qautils                     (interactive)
 *         qautils -i                  (interactive, explicit)
 *         qautils <command> [options] (direct)
 *         qautils --help
 */

import { Command } from 'commander';
import chalk from 'chalk';

import { runInteractive, printBanner } from './interactive.js';

import { registerUuidCommand } from './commands/uuid.js';
import { registerBase64Command } from './commands/base64.js';
import { registerJwtCommand } from './commands/jwt.js';
import { registerHashCommand } from './commands/hash.js';
import { registerPasswordCommand } from './commands/password.js';
import { registerTimestampCommand } from './commands/timestamp.js';
import { registerJsonCommand } from './commands/json.js';
import { registerLoremCommand } from './commands/lorem.js';
import { registerTextCommand } from './commands/text.js';
import { registerEmailCommand } from './commands/email.js';
import { registerSqlCommand } from './commands/sql.js';
import { registerColorCommand } from './commands/color.js';
import { registerHtmlCommand } from './commands/html.js';
import { registerRandomCommand } from './commands/random.js';

// ── Program ──────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('qautils')
  .description(
    chalk.bold('QA Utils CLI') +
      chalk.dim(' — utility tools for testing and automation workflows') +
      '\n' +
      chalk.dim('  https://github.com/kobenguyent/qa-utils'),
  )
  .version('1.0.0', '-v, --version', 'print the current version')
  .option('-i, --interactive', 'launch the interactive TUI (default when no args given)')
  .helpOption('-h, --help', 'display help for command')
  .addHelpText(
    'after',
    `
${chalk.bold('Interactive mode')} (no arguments):
  ${chalk.cyan('qautils')}                              Launch interactive menu
  ${chalk.cyan('qautils -i')}                           Launch interactive menu (explicit)

${chalk.bold('Direct mode')} (one-shot commands):
  ${chalk.cyan('qautils uuid')}                         Generate a UUID
  ${chalk.cyan('qautils uuid -c 5')}                    Generate 5 UUIDs
  ${chalk.cyan('qautils base64 encode "hello"')}        Encode to Base64
  ${chalk.cyan('qautils base64 decode "aGVsbG8="')}     Decode from Base64
  ${chalk.cyan('qautils jwt <token>')}                  Decode a JWT token
  ${chalk.cyan('qautils hash "text" --all')}            Hash with all algorithms
  ${chalk.cyan('qautils password -l 24')}               24-char password
  ${chalk.cyan('qautils timestamp 1700000000')}         Convert Unix timestamp
  ${chalk.cyan('qautils json format data.json')}        Pretty-print JSON file
  ${chalk.cyan('qautils lorem -p 3')}                   3 paragraphs of lorem ipsum
  ${chalk.cyan('qautils text "Hello world."')}          Count words / chars
  ${chalk.cyan('qautils email test@example.com')}       Validate email
  ${chalk.cyan('qautils sql SELECT --table users')}     Generate SELECT SQL
  ${chalk.cyan('qautils color "#FF5733"')}              Convert colour
  ${chalk.cyan('qautils html sanitize "<p>…</p>"')}    Sanitize HTML
  ${chalk.cyan('qautils random -l 32')}                 32-char random string
`,
  );

// ── Register commands ─────────────────────────────────────────────────────────

registerUuidCommand(program);
registerBase64Command(program);
registerJwtCommand(program);
registerHashCommand(program);
registerPasswordCommand(program);
registerTimestampCommand(program);
registerJsonCommand(program);
registerLoremCommand(program);
registerTextCommand(program);
registerEmailCommand(program);
registerSqlCommand(program);
registerColorCommand(program);
registerHtmlCommand(program);
registerRandomCommand(program);

// ── Show help when called with no arguments ───────────────────────────────────

const isInteractive =
  process.argv.length <= 2 ||
  process.argv.includes('-i') ||
  process.argv.includes('--interactive');

if (isInteractive) {
  // Strip the -i flag so Commander doesn't choke on it if passed alongside nothing
  runInteractive().catch((err: unknown) => {
    if (err instanceof Error) {
      console.error(chalk.red(`\n  Error: ${err.message}\n`));
    }
    process.exit(1);
  });
} else {
  // Direct CLI mode: parse and dispatch
  printBanner();
  program.parse(process.argv);
}
