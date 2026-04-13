/**
 * qautils-cli — Interactive TUI Mode
 *
 * Launched when `qautils` is run with no arguments (or with -i / --interactive).
 * Provides a beautiful menu-driven interface to all 14 tools.
 */

import chalk from 'chalk';
import { select, input, checkbox, Separator } from '@inquirer/prompts';

import {
  generateUuids,
  base64Encode,
  base64Decode,
  decodeJwt,
  generateHash,
  generatePassword,
  generateRandomString,
  generateLoremIpsum,
  countTextStats,
  validateEmail,
  formatJson,
  convertTimestamp,
  generateSql,
  convertColor,
  sanitizeHtml,
  HASH_ALGORITHMS,
  type HashAlgorithm,
  type SqlOperation,
} from './lib/tools.js';

// ── Layout constants ──────────────────────────────────────────────────────────

const BW = 52; // banner/box inner width

function center(str: string, width: number): string {
  const spaces = Math.max(0, width - str.length);
  return ' '.repeat(Math.floor(spaces / 2)) + str + ' '.repeat(Math.ceil(spaces / 2));
}

// ── Banner ────────────────────────────────────────────────────────────────────

export function printBanner(): void {
  const bar = '━'.repeat(BW);
  const blank = ' '.repeat(BW);
  console.log();
  console.log(chalk.bold.cyan(`  ┏${bar}┓`));
  console.log(chalk.bold.cyan('  ┃') + blank + chalk.bold.cyan('┃'));
  console.log(
    chalk.bold.cyan('  ┃') +
      chalk.bold.white(center('QA UTILS CLI', BW)) +
      chalk.bold.cyan('┃'),
  );
  console.log(
    chalk.bold.cyan('  ┃') +
      chalk.dim(center('v1.0.0  ·  Quality Assurance Toolkit', BW)) +
      chalk.bold.cyan('┃'),
  );
  console.log(
    chalk.bold.cyan('  ┃') +
      chalk.dim(center('14 tools  ·  interactive + direct CLI', BW)) +
      chalk.bold.cyan('┃'),
  );
  console.log(chalk.bold.cyan('  ┃') + blank + chalk.bold.cyan('┃'));
  console.log(chalk.bold.cyan(`  ┗${bar}┛`));
  console.log();
}

// ── Result box ────────────────────────────────────────────────────────────────

function resultBox(title: string, lines: string[]): void {
  console.log();
  console.log(`  ${chalk.bold.green('✔')}  ${chalk.bold.underline(title)}`);
  console.log(`  ${chalk.dim('─'.repeat(50))}`);
  lines.forEach((line) => console.log(`    ${line}`));
  console.log(`  ${chalk.dim('─'.repeat(50))}`);
  console.log();
}

function cliTip(cmd: string): void {
  console.log(chalk.dim(`  Tip ›  qautils ${cmd}\n`));
}

// ── After-action menu ─────────────────────────────────────────────────────────

type NextAction = 'again' | 'menu' | 'exit';

async function askNext(toolLabel: string): Promise<NextAction> {
  return select<NextAction>({
    message: chalk.dim('What next?'),
    choices: [
      { name: `  🔄  Run "${toolLabel}" again`, value: 'again' },
      { name: '  🏠  Return to main menu', value: 'menu' },
      { name: '  👋  Exit', value: 'exit' },
    ],
  });
}

// ── Validation helpers ────────────────────────────────────────────────────────

const positiveInt =
  (label = 'value') =>
  (v: string): string | true => {
    const n = parseInt(v, 10);
    return (!isNaN(n) && n >= 1) || `${label} must be a positive integer`;
  };

// ── Tool runners ──────────────────────────────────────────────────────────────

async function runUuid(): Promise<void> {
  const countStr = await input({
    message: 'How many UUIDs?',
    default: '1',
    validate: positiveInt('count'),
  });
  const count = parseInt(countStr, 10);
  const uuids = generateUuids(count);
  resultBox(
    `Generated ${count} UUID${count > 1 ? 's' : ''}`,
    uuids.map((u, i) => `${chalk.dim(`${String(i + 1).padStart(2)}.`)} ${chalk.bold.yellow(u)}`),
  );
  cliTip(`uuid${count > 1 ? ` -c ${count}` : ''}`);
}

async function runBase64(): Promise<void> {
  const op = await select<'encode' | 'decode'>({
    message: 'Operation:',
    choices: [
      { name: '  📤  Encode  — text  →  Base64', value: 'encode' },
      { name: '  📥  Decode  — Base64  →  text', value: 'decode' },
    ],
  });
  const text = await input({
    message: op === 'encode' ? 'Text to encode:' : 'Base64 string:',
  });
  try {
    const result = op === 'encode' ? base64Encode(text) : base64Decode(text);
    resultBox(`Base64 ${op}d`, [chalk.bold.yellow(result)]);
    cliTip(`base64 ${op} "${text.slice(0, 20)}${text.length > 20 ? '…' : ''}"`);
  } catch (e) {
    console.log(`\n  ${chalk.red('✗')}  ${e instanceof Error ? e.message : 'Error'}\n`);
  }
}

async function runJwt(): Promise<void> {
  const token = await input({ message: 'JWT token:' });
  const result = decodeJwt(token);
  if (result.error) {
    console.log(`\n  ${chalk.red('✗')}  ${chalk.red(result.error)}\n`);
    return;
  }
  console.log();
  console.log(`  ${chalk.bold.cyan('── Header ──────────────────────────────────────')}`);
  Object.entries(result.header ?? {}).forEach(([k, v]) => {
    console.log(`    ${chalk.cyan(k.padEnd(16))} ${chalk.white(JSON.stringify(v))}`);
  });
  console.log();
  console.log(`  ${chalk.bold.cyan('── Payload ─────────────────────────────────────')}`);
  Object.entries(result.payload ?? {}).forEach(([k, v]) => {
    console.log(`    ${chalk.cyan(k.padEnd(16))} ${chalk.white(JSON.stringify(v))}`);
  });
  console.log();
  if (result.expired === null) {
    console.log(`  ${chalk.yellow('⚠')}   No ${chalk.bold('exp')} claim — expiry is unknown`);
  } else if (result.expired) {
    console.log(`  ${chalk.red('✗')}   Token is ${chalk.bold.red('EXPIRED')}`);
  } else {
    console.log(`  ${chalk.green('✔')}   Token is ${chalk.bold.green('valid')} (not yet expired)`);
  }
  console.log();
}

async function runHash(): Promise<void> {
  const text = await input({ message: 'Text to hash:' });
  const algoChoice = await select<HashAlgorithm | 'all'>({
    message: 'Algorithm:',
    choices: [
      ...HASH_ALGORITHMS.map((a) => ({
        name: `  ${a.toUpperCase().padEnd(8)} ${chalk.dim('─ ' + { md5: '128 bit', sha1: '160 bit', sha256: '256 bit', sha384: '384 bit', sha512: '512 bit' }[a])}`,
        value: a as HashAlgorithm | 'all',
      })),
      new Separator(),
      { name: '  🔢  All algorithms', value: 'all' as const },
    ],
  });
  const algos: HashAlgorithm[] = algoChoice === 'all' ? HASH_ALGORITHMS : [algoChoice];
  resultBox(
    'Hash Result',
    algos.map((a) => `${chalk.cyan(a.padEnd(8))} ${chalk.bold.yellow(generateHash(text, a))}`),
  );
  if (algoChoice !== 'all') cliTip(`hash "${text.slice(0, 15)}…" --algo ${algoChoice}`);
  else cliTip(`hash "${text.slice(0, 15)}…" --all`);
}

type CharType = 'uppercase' | 'lowercase' | 'numbers' | 'symbols';

async function runPassword(): Promise<void> {
  const lengthStr = await input({
    message: 'Password length:',
    default: '16',
    validate: positiveInt('length'),
  });
  const countStr = await input({
    message: 'How many passwords?',
    default: '1',
    validate: positiveInt('count'),
  });
  const charTypes = await checkbox<CharType>({
    message: 'Include character types:',
    choices: [
      { name: '  Uppercase  A–Z', value: 'uppercase', checked: true },
      { name: '  Lowercase  a–z', value: 'lowercase', checked: true },
      { name: '  Numbers    0–9', value: 'numbers', checked: true },
      { name: '  Symbols    !@#$…', value: 'symbols', checked: true },
    ],
    validate: (items) => items.length > 0 || 'Select at least one character type',
  });
  const count = parseInt(countStr, 10);
  const length = parseInt(lengthStr, 10);
  const passwords = Array.from({ length: count }, () =>
    generatePassword(length, {
      uppercase: charTypes.includes('uppercase'),
      lowercase: charTypes.includes('lowercase'),
      numbers: charTypes.includes('numbers'),
      symbols: charTypes.includes('symbols'),
    }),
  );
  resultBox(
    `Generated ${count} Password${count > 1 ? 's' : ''}`,
    passwords.map((p, i) => `${chalk.dim(`${String(i + 1).padStart(2)}.`)} ${chalk.bold.yellow(p)}`),
  );
  cliTip(`password -l ${length}${count > 1 ? ` -c ${count}` : ''}`);
}

async function runTimestamp(): Promise<void> {
  const value = await input({
    message: 'Timestamp / date string  (blank = now):',
    default: '',
  });
  const result = convertTimestamp(value || undefined);
  resultBox('Timestamp Conversion', [
    `${chalk.cyan('Unix (s)'.padEnd(16))} ${chalk.bold.yellow(String(result.timestamp))}`,
    `${chalk.cyan('ISO 8601'.padEnd(16))} ${chalk.white(result.iso)}`,
    `${chalk.cyan('UTC'.padEnd(16))} ${chalk.white(result.utc)}`,
    `${chalk.cyan('Local'.padEnd(16))} ${chalk.white(result.local)}`,
  ]);
  cliTip(`timestamp ${value || ''}`);
}

async function runJson(): Promise<void> {
  const op = await select<'format' | 'validate' | 'minify'>({
    message: 'Operation:',
    choices: [
      { name: '  🎨  Format   — pretty-print with indentation', value: 'format' },
      { name: '  ✔   Validate — check JSON syntax', value: 'validate' },
      { name: '  📦  Minify   — strip all whitespace', value: 'minify' },
    ],
  });
  const raw = await input({ message: 'JSON string (paste inline):' });

  if (op === 'format') {
    const indentStr = await input({ message: 'Indent spaces:', default: '2' });
    const result = formatJson(raw, parseInt(indentStr, 10) || 2);
    if (!result.valid) {
      console.log(`\n  ${chalk.red('✗')}  ${chalk.red(result.error)}\n`);
      return;
    }
    resultBox('Formatted JSON', result.formatted.split('\n').map((l) => chalk.white(l)));
  } else if (op === 'validate') {
    const result = formatJson(raw);
    console.log();
    if (result.valid) {
      console.log(`  ${chalk.bold.green('✔')}  ${chalk.bold.green('Valid JSON')}`);
    } else {
      console.log(`  ${chalk.bold.red('✗')}  ${chalk.bold.red('Invalid JSON')}  ${chalk.dim(result.error ?? '')}`);
    }
    console.log();
  } else {
    try {
      const minified = JSON.stringify(JSON.parse(raw));
      resultBox('Minified JSON', [chalk.bold.yellow(minified)]);
    } catch {
      console.log(`\n  ${chalk.red('✗')}  Invalid JSON\n`);
    }
  }
  cliTip(`json ${op} '${raw.slice(0, 20)}…'`);
}

async function runLorem(): Promise<void> {
  const countStr = await input({
    message: 'Number of paragraphs (1–20):',
    default: '1',
    validate: (v) => {
      const n = parseInt(v, 10);
      return (!isNaN(n) && n >= 1 && n <= 20) || 'Enter a number between 1 and 20';
    },
  });
  const count = parseInt(countStr, 10);
  const text = generateLoremIpsum(count);
  const paragraphs = text.split('\n\n');
  resultBox(
    `Lorem Ipsum (${count} paragraph${count > 1 ? 's' : ''})`,
    paragraphs.flatMap((p, i) => [
      ...(i > 0 ? [''] : []),
      `${chalk.dim('¶')}  ${chalk.white(p)}`,
    ]),
  );
  cliTip(`lorem -p ${count}`);
}

async function runText(): Promise<void> {
  const text = await input({ message: 'Text to analyse:' });
  const s = countTextStats(text);
  resultBox('Text Analysis', [
    `${chalk.cyan('Characters'.padEnd(22))} ${chalk.bold.yellow(String(s.characters))}`,
    `${chalk.cyan('Chars (no spaces)'.padEnd(22))} ${chalk.bold.yellow(String(s.charactersNoSpaces))}`,
    `${chalk.cyan('Words'.padEnd(22))} ${chalk.bold.yellow(String(s.words))}`,
    `${chalk.cyan('Sentences'.padEnd(22))} ${chalk.bold.yellow(String(s.sentences))}`,
    `${chalk.cyan('Lines'.padEnd(22))} ${chalk.bold.yellow(String(s.lines))}`,
    `${chalk.cyan('Paragraphs'.padEnd(22))} ${chalk.bold.yellow(String(s.paragraphs))}`,
  ]);
  cliTip(`text "${text.slice(0, 20)}…"`);
}

async function runEmail(): Promise<void> {
  const email = await input({ message: 'Email address:' });
  const result = validateEmail(email);
  console.log();
  if (result.valid) {
    console.log(`  ${chalk.bold.green('✔')}  ${chalk.bold(email)}  ${chalk.green('is a valid email address')}`);
  } else {
    console.log(
      `  ${chalk.bold.red('✗')}  ${chalk.bold(email)}  ${chalk.dim('—')}  ${chalk.red(result.reason ?? 'Invalid')}`,
    );
  }
  console.log();
  cliTip(`email ${email}`);
}

async function runSql(): Promise<void> {
  const operation = await select<SqlOperation>({
    message: 'SQL operation:',
    choices: [
      { name: '  SELECT       — query rows', value: 'SELECT' },
      { name: '  INSERT       — add a row', value: 'INSERT' },
      { name: '  UPDATE       — modify rows', value: 'UPDATE' },
      { name: '  DELETE       — remove rows', value: 'DELETE' },
      { name: '  CREATE TABLE — define a table', value: 'CREATE_TABLE' },
    ],
  });
  const tableName = await input({ message: 'Table name:' });

  let columns: string[] | undefined;
  let values: string[] | undefined;
  let whereClause: string | undefined;
  let orderBy: string | undefined;
  let limit: number | undefined;

  if (['SELECT', 'INSERT', 'UPDATE', 'CREATE_TABLE'].includes(operation)) {
    const c = await input({
      message:
        operation === 'CREATE_TABLE'
          ? 'Column definitions (comma-separated, e.g. "id INTEGER PRIMARY KEY,name TEXT"):'
          : 'Columns (comma-separated, blank = all):',
      default: '',
    });
    columns = c ? c.split(',').map((col) => col.trim()) : undefined;
  }
  if (['INSERT', 'UPDATE'].includes(operation)) {
    const v = await input({ message: 'Values (comma-separated):' });
    values = v.split(',').map((val) => val.trim());
  }
  if (['SELECT', 'UPDATE', 'DELETE'].includes(operation)) {
    const w = await input({ message: 'WHERE clause  (blank to skip):', default: '' });
    whereClause = w || undefined;
  }
  if (operation === 'SELECT') {
    const ob = await input({ message: 'ORDER BY column  (blank to skip):', default: '' });
    orderBy = ob || undefined;
    const lim = await input({ message: 'LIMIT  (blank to skip):', default: '' });
    limit = lim ? parseInt(lim, 10) : undefined;
  }

  const sql = generateSql({ operation, tableName, columns, values, whereClause, orderBy, limit });
  resultBox('Generated SQL', [chalk.bold.yellow(sql)]);
  cliTip(`sql ${operation} --table ${tableName}`);
}

async function runColor(): Promise<void> {
  const colorInput = await input({
    message: 'Color (#RRGGBB  |  #RGB  |  rgb(r, g, b)):',
  });
  const result = convertColor(colorInput);
  if (result.error) {
    console.log(`\n  ${chalk.red('✗')}  ${chalk.red(result.error)}\n`);
    return;
  }
  const { r, g, b } = result.rgb;
  const { h, s, l } = result.hsl;
  const swatch = chalk.bgHex(result.hex)('        ');
  resultBox('Color Conversion', [
    `${chalk.cyan('Swatch'.padEnd(10))} ${swatch}`,
    `${chalk.cyan('HEX'.padEnd(10))} ${chalk.bold.yellow(result.hex)}`,
    `${chalk.cyan('RGB'.padEnd(10))} ${chalk.white(`rgb(${r}, ${g}, ${b})`)}`,
    `${chalk.cyan('HSL'.padEnd(10))} ${chalk.white(`hsl(${h}, ${s}%, ${l}%)`)}`,
  ]);
  cliTip(`color "${colorInput}"`);
}

async function runHtml(): Promise<void> {
  const htmlInput = await input({ message: 'HTML to sanitize:' });
  const sanitized = sanitizeHtml(htmlInput);
  resultBox('Sanitized HTML', [chalk.bold.yellow(sanitized)]);
  cliTip(`html sanitize "${htmlInput.slice(0, 20)}…"`);
}

async function runRandom(): Promise<void> {
  const lengthStr = await input({
    message: 'String length:',
    default: '16',
    validate: positiveInt('length'),
  });
  const countStr = await input({
    message: 'How many strings?',
    default: '1',
    validate: positiveInt('count'),
  });
  const count = parseInt(countStr, 10);
  const length = parseInt(lengthStr, 10);
  const strings = Array.from({ length: count }, () => generateRandomString(length));
  resultBox(
    `${count} Random String${count > 1 ? 's' : ''}`,
    strings.map((s, i) => `${chalk.dim(`${String(i + 1).padStart(2)}.`)} ${chalk.bold.yellow(s)}`),
  );
  cliTip(`random -l ${length}${count > 1 ? ` -c ${count}` : ''}`);
}

// ── Tool registry ─────────────────────────────────────────────────────────────

type ToolKey =
  | 'uuid'
  | 'base64'
  | 'jwt'
  | 'hash'
  | 'password'
  | 'timestamp'
  | 'json'
  | 'lorem'
  | 'text'
  | 'email'
  | 'sql'
  | 'color'
  | 'html'
  | 'random';

const TOOLS: Record<ToolKey, { label: string; run: () => Promise<void> }> = {
  uuid:      { label: 'UUID Generator',        run: runUuid },
  base64:    { label: 'Base64 Encode/Decode',   run: runBase64 },
  jwt:       { label: 'JWT Decoder',            run: runJwt },
  hash:      { label: 'Hash Generator',         run: runHash },
  password:  { label: 'Password Generator',     run: runPassword },
  timestamp: { label: 'Timestamp Converter',    run: runTimestamp },
  json:      { label: 'JSON Toolkit',           run: runJson },
  lorem:     { label: 'Lorem Ipsum',            run: runLorem },
  text:      { label: 'Text Analyser',          run: runText },
  email:     { label: 'Email Validator',        run: runEmail },
  sql:       { label: 'SQL Generator',          run: runSql },
  color:     { label: 'Color Converter',        run: runColor },
  html:      { label: 'HTML Sanitizer',         run: runHtml },
  random:    { label: 'Random String',          run: runRandom },
};

// ── Main menu ─────────────────────────────────────────────────────────────────

function menuDivider(): void {
  console.log(chalk.dim(`  ${'─'.repeat(50)}`));
}

async function showMainMenu(): Promise<ToolKey | 'exit'> {
  menuDivider();
  return select<ToolKey | 'exit'>({
    message: chalk.bold('Select a tool'),
    pageSize: 22,
    choices: [
      new Separator(chalk.dim('  ── Generators ──────────────────────────────── ')),
      {
        name: '  🔑  UUID Generator',
        value: 'uuid' as ToolKey | 'exit',
        description: 'Generate one or more v4 UUIDs',
      },
      {
        name: '  🔐  Base64 Encode / Decode',
        value: 'base64' as ToolKey | 'exit',
        description: 'Encode text to Base64 or decode Base64 back to text',
      },
      {
        name: '  🎲  Random String',
        value: 'random' as ToolKey | 'exit',
        description: 'Cryptographically random alphanumeric strings',
      },
      {
        name: '  🔒  Password Generator',
        value: 'password' as ToolKey | 'exit',
        description: 'Secure passwords with custom character classes',
      },
      {
        name: '  📝  Lorem Ipsum',
        value: 'lorem' as ToolKey | 'exit',
        description: 'Generate Lorem Ipsum placeholder paragraphs',
      },
      new Separator(chalk.dim('  ── Analysers ───────────────────────────────── ')),
      {
        name: '  #   Hash Generator',
        value: 'hash' as ToolKey | 'exit',
        description: 'MD5, SHA-1, SHA-256, SHA-384, SHA-512',
      },
      {
        name: '  🔏  JWT Decoder',
        value: 'jwt' as ToolKey | 'exit',
        description: 'Inspect header, payload, and expiry (no signature verify)',
      },
      {
        name: '  📊  Text Analyser',
        value: 'text' as ToolKey | 'exit',
        description: 'Count chars, words, sentences, lines, paragraphs',
      },
      {
        name: '  📧  Email Validator',
        value: 'email' as ToolKey | 'exit',
        description: 'Validate email address syntax',
      },
      new Separator(chalk.dim('  ── Converters ──────────────────────────────── ')),
      {
        name: '  ⏰  Timestamp Converter',
        value: 'timestamp' as ToolKey | 'exit',
        description: 'Unix epoch seconds/ms ↔ ISO 8601, UTC, local',
      },
      {
        name: '  🎨  Color Converter',
        value: 'color' as ToolKey | 'exit',
        description: 'HEX ↔ RGB ↔ HSL with a colour swatch preview',
      },
      new Separator(chalk.dim('  ── Data Toolkit ────────────────────────────── ')),
      {
        name: '  📋  JSON Toolkit',
        value: 'json' as ToolKey | 'exit',
        description: 'Format (pretty-print), validate, or minify JSON',
      },
      {
        name: '  🗄️  SQL Generator',
        value: 'sql' as ToolKey | 'exit',
        description: 'SELECT, INSERT, UPDATE, DELETE, CREATE TABLE',
      },
      {
        name: '  🌐  HTML Sanitizer',
        value: 'html' as ToolKey | 'exit',
        description: 'Strip <script> tags and inline on* event handlers',
      },
      new Separator(chalk.dim('  ' + '─'.repeat(50))),
      { name: '  👋  Exit', value: 'exit' as ToolKey | 'exit' },
    ],
  });
}

// ── Interactive entry point ───────────────────────────────────────────────────

export async function runInteractive(): Promise<void> {
  printBanner();

  let currentTool: ToolKey | null = null;

  for (;;) {
    try {
      if (currentTool === null) {
        const choice = await showMainMenu();
        if (choice === 'exit') break;
        currentTool = choice;
      }

      const tool = TOOLS[currentTool];
      await tool.run();

      const next = await askNext(tool.label);
      if (next === 'exit') break;
      if (next === 'menu') {
        currentTool = null;
        console.log(); // breathing room before menu redraws
      }
      // 'again' leaves currentTool unchanged → same tool reruns
    } catch (err) {
      // Graceful exit on Ctrl+C
      if (
        err instanceof Error &&
        (err.name === 'ExitPromptError' || err.message.includes('User force closed'))
      ) {
        break;
      }
      throw err;
    }
  }

  console.log(chalk.dim('\n  Goodbye! 👋\n'));
}
