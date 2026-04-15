#!/usr/bin/env node

/**
 * qautils-cli — QA Utils Command-Line Interface  (v1.1)
 *
 * No arguments  →  interactive TUI mode
 * With arguments →  direct CLI mode
 *
 * Usage:  qautils                      (interactive TUI)
 *         qautils -i                   (interactive, explicit)
 *         qautils <command> [options]  (one-shot direct mode)
 *         qautils --help
 */

import { Command } from 'commander';
import chalk from 'chalk';

import { runInteractive, printBanner } from './interactive.js';

import { registerUuidCommand }      from './commands/uuid.js';
import { registerBase64Command }    from './commands/base64.js';
import { registerJwtCommand }       from './commands/jwt.js';
import { registerHashCommand }      from './commands/hash.js';
import { registerPasswordCommand }  from './commands/password.js';
import { registerTimestampCommand } from './commands/timestamp.js';
import { registerJsonCommand }      from './commands/json.js';
import { registerLoremCommand }     from './commands/lorem.js';
import { registerTextCommand }      from './commands/text.js';
import { registerEmailCommand }     from './commands/email.js';
import { registerSqlCommand }       from './commands/sql.js';
import { registerColorCommand }     from './commands/color.js';
import { registerHtmlCommand }      from './commands/html.js';
import { registerRandomCommand }    from './commands/random.js';
// ── New commands (v2) ─────────────────────────────────────────────────────────
import { registerUrlCommand }       from './commands/url.js';
import { registerRegexCommand }     from './commands/regex.js';
import { registerBaseCommand }      from './commands/base.js';
import { registerCaseCommand }      from './commands/case.js';
import { registerNanoidCommand }    from './commands/nanoid.js';
// ── AI (v3) ──────────────────────────────────────────────────────────────────
import { registerChatCommand }      from './commands/chat.js';

// ── Program ──────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('qautils')
  .description(
    chalk.bold('QA Utils CLI') +
      chalk.dim(' — 20 utility tools for testing and automation workflows') +
      '\n' +
      chalk.dim('  https://github.com/kobenguyent/qa-utils'),
  )
  .version('1.1.0', '-v, --version', 'print the current version')
  .option('-i, --interactive', 'launch the interactive TUI (default when no args given)')
  .helpOption('-h, --help', 'display help for command')
  .addHelpText(
    'after',
    `
${chalk.bold('Interactive mode')} (no arguments):
  ${chalk.cyan('qautils')}                                Launch interactive TUI
  ${chalk.cyan('qautils -i')}                             Launch interactive TUI (explicit)

${chalk.bold('Generators')}:
  ${chalk.cyan('qautils uuid')}                           Generate a v4 UUID
  ${chalk.cyan('qautils uuid -c 5')}                      Generate 5 UUIDs
  ${chalk.cyan('qautils nanoid')}                         Generate a NanoID (21 chars)
  ${chalk.cyan('qautils nanoid -s 32 -c 3')}             3 NanoIDs of size 32
  ${chalk.cyan('qautils base64 encode "hello"')}          Encode to Base64
  ${chalk.cyan('qautils base64 decode "aGVsbG8="')}       Decode from Base64
  ${chalk.cyan('qautils password -l 24')}                 24-char secure password
  ${chalk.cyan('qautils random -l 32')}                   32-char random string
  ${chalk.cyan('qautils lorem -p 3')}                     3 paragraphs of Lorem Ipsum

${chalk.bold('Analysers')}:
  ${chalk.cyan('qautils hash "text" --all')}              Hash with all algorithms
  ${chalk.cyan('qautils hash "text" --algo sha256')}      SHA-256 hash
  ${chalk.cyan('qautils jwt <token>')}                    Decode a JWT token
  ${chalk.cyan('qautils text "Hello world."')}            Count words / chars
  ${chalk.cyan('qautils email test@example.com')}         Validate email address
  ${chalk.cyan('qautils regex "\\d+" "abc 123" -f gi')}   Test regex against text

${chalk.bold('Converters')}:
  ${chalk.cyan('qautils timestamp 1700000000')}           Convert Unix timestamp
  ${chalk.cyan('qautils color "#FF5733"')}                Convert colour (HEX/RGB/HSL)
  ${chalk.cyan('qautils url encode "hello world"')}       Percent-encode a string
  ${chalk.cyan('qautils url decode "hello%20world"')}     Decode a percent-encoded string
  ${chalk.cyan('qautils url parse "https://example.com"')} Parse URL components
  ${chalk.cyan('qautils base 255 --all')}                 Show BIN/OCT/DEC/HEX
  ${chalk.cyan('qautils base FF --from 16 --to 2')}       HEX → Binary
  ${chalk.cyan('qautils case "helloWorld" --to snake')}   Convert case style
  ${chalk.cyan('qautils case "hello world" --all')}       Show all case styles

${chalk.bold('Data Toolkit')}:
  ${chalk.cyan('qautils json format data.json')}          Pretty-print JSON file
  ${chalk.cyan('qautils sql SELECT --table users')}       Generate SELECT SQL
  ${chalk.cyan('qautils html sanitize "<p>…</p>"')}      Sanitize HTML

${chalk.bold('AI Chat (Kobean)')}:
  ${chalk.cyan('qautils chat')}                           Start interactive AI chat session
  ${chalk.cyan('qautils chat config')}                    Configure AI provider (wizard)
  ${chalk.cyan('qautils chat config --show')}             Show current AI config
  ${chalk.cyan('qautils chat config --reset')}            Remove stored AI config
  ${chalk.cyan('qautils chat config --provider openai --api-key sk-xxx')}  Quick config
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
// v2 commands
registerUrlCommand(program);
registerRegexCommand(program);
registerBaseCommand(program);
registerCaseCommand(program);
registerNanoidCommand(program);
// v3 commands
registerChatCommand(program);

// ── Launch mode ───────────────────────────────────────────────────────────────

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
