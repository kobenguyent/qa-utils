/**
 * qautils-cli — Interactive TUI Mode  (v2)
 * Launched when qautils is run with no arguments (or -i / --interactive).
 */

import chalk from 'chalk';
import { select, input, checkbox, Separator } from '@inquirer/prompts';
import ora from 'ora';
import clipboard from 'clipboardy';
import readline from 'readline';

import { version as CLI_VERSION } from './version.js';
import {
  generateUuids, base64Encode, base64Decode, decodeJwt, generateHash,
  generatePassword, generateRandomString, generateLoremIpsum, countTextStats,
  validateEmail, formatJson, convertTimestamp, generateSql, convertColor,
  sanitizeHtml, urlEncode, urlDecode, parseUrl, testRegex, convertBase,
  convertCase, generateNanoId, HASH_ALGORITHMS, CASE_TYPES,
  convertMarkdownToConfluence,
  buildJsonPrompt, parseJsonPrompt, extractTemplateVariables,
  compareTexts,
  type HashAlgorithm, type SqlOperation, type CaseType,
  type PromptProviderFormat, type JsonPromptTemplate,
} from './lib/tools.js';
import {
  readConfig,
  validateAIConfig,
  formatConfigForDisplay,
  toDisplayConfig,
  DEFAULT_MODELS,
} from './lib/aiConfig.js';
import { sendChat, KOBEAN_SYSTEM_PROMPT, type ChatMessage } from './lib/aiClient.js';
import { runAutoOrchestratedPipeline, type AutoOrchestrateEvent } from './lib/cliOrchestrator.js';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  border:  (s: string) => chalk.cyan(s),
  title:   (s: string) => chalk.bold.yellow(s),
  value:   (s: string) => chalk.bold.white(s),
  label:   (s: string) => chalk.cyan(s),
  dim:     (s: string) => chalk.gray(s),
  success: (s: string) => chalk.bold.green(s),
  error:   (s: string) => chalk.bold.red(s),
  warn:    (s: string) => chalk.bold.yellow(s),
  number:  (s: string) => chalk.bold.yellow(s),
};

// ── Gradient title ─────────────────────────────────────────────────────────────
function gradientTitle(text: string): string {
  const stops = [
    chalk.hex('#00e5ff'), chalk.hex('#00b4ff'), chalk.hex('#2979ff'),
    chalk.hex('#651fff'), chalk.hex('#d500f9'), chalk.hex('#ff1744'),
  ];
  let ci = 0;
  return text.split('').map((ch) => ch === ' ' ? ch : stops[ci++ % stops.length](ch)).join('');
}

// ── Banner ─────────────────────────────────────────────────────────────────────
const BANNER_W = 62;

export function printBanner(toolCount = 20): void {
  const bar = '─'.repeat(BANNER_W);
  const empty = ' '.repeat(BANNER_W);
  const version = `v${CLI_VERSION}`;
  const vPad = BANNER_W - 18 - version.length - 2;
  const titleLine =
    '  ' + chalk.bold.yellow('◆') + '  ' + gradientTitle('QA UTILS CLI') +
    ' '.repeat(Math.max(2, vPad)) + T.dim(version) + '  ';
  const d1 = '  Quality Assurance Toolkit  ·  SDETs & QA Engineers  ';
  const d2 = `  ${toolCount} tools  ·  interactive TUI  ·  scriptable CLI    `;

  console.log();
  console.log(T.border(`  ╭${bar}╮`));
  console.log(T.border('  │') + empty + T.border('│'));
  console.log(T.border('  │') + titleLine + T.border('│'));
  console.log(T.border('  │') + empty + T.border('│'));
  console.log(T.border('  │') + T.dim(d1.padEnd(BANNER_W)) + T.border('│'));
  console.log(T.border('  │') + T.dim(d2.padEnd(BANNER_W)) + T.border('│'));
  console.log(T.border('  │') + empty + T.border('│'));
  console.log(T.border(`  ╰${bar}╯`));
  console.log();
}

// ── Result box ────────────────────────────────────────────────────────────────
const BOX_W = 60;

function resultBox(title: string, lines: string[]): void {
  const dashes = Math.max(1, BOX_W - title.length - 2);
  const top    = T.border('╭─ ') + T.title(title) + T.border(' ' + '─'.repeat(dashes) + '╮');
  const bottom = T.border('╰' + '─'.repeat(BOX_W + 2) + '╯');
  const rule   = T.border('│') + ' '.repeat(BOX_W + 2) + T.border('│');
  console.log();
  console.log(`  ${top}`);
  console.log(`  ${rule}`);
  lines.forEach((line) => console.log(`  ${T.border('│')}   ${line}`));
  console.log(`  ${rule}`);
  console.log(`  ${bottom}`);
  console.log();
}

function cliTip(cmd: string): void {
  console.log(T.dim(`  💡  qautils ${cmd}\n`));
}

// ── Clipboard ─────────────────────────────────────────────────────────────────
async function tryCopy(text: string): Promise<void> {
  try {
    await clipboard.write(text);
    console.log(`  ${T.success('✔')}  ${chalk.dim('Copied to clipboard!')}\n`);
  } catch {
    console.log(`  ${T.warn('⚠')}  ${chalk.dim('Clipboard unavailable in this terminal')}\n`);
  }
}

// ── After-action ──────────────────────────────────────────────────────────────
type NavAction = 'again' | 'menu' | 'exit';
type PostAction = 'copy' | NavAction;

async function askNext(toolLabel: string, copyText: string | null): Promise<NavAction> {
  for (;;) {
    const choices: Array<{ name: string; value: PostAction }> = [];
    if (copyText !== null) {
      const preview = copyText.length > 36 ? copyText.slice(0, 36) + '…' : copyText;
      choices.push({ name: `  📋  Copy to clipboard  ${T.dim(`"${preview}"`)}`, value: 'copy' });
    }
    choices.push(
      { name: `  🔄  Run "${toolLabel}" again`, value: 'again' },
      { name: '  🏠  Return to main menu',      value: 'menu'  },
      { name: '  ✕   Exit',                     value: 'exit'  },
    );
    const action = await select<PostAction>({ message: T.dim('What would you like to do?'), choices });
    if (action === 'copy') { await tryCopy(copyText ?? ''); continue; }
    return action as NavAction;
  }
}

// ── Validators ────────────────────────────────────────────────────────────────
const positiveInt = (label = 'value') => (v: string): string | true => {
  const n = parseInt(v, 10);
  return (!isNaN(n) && n >= 1) || `${label} must be a positive integer`;
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function spin(text: string) {
  return ora({ text: T.dim(` ${text}`), color: 'cyan', spinner: 'dots2' });
}

// ── Tool runners ──────────────────────────────────────────────────────────────

async function runUuid(): Promise<string | null> {
  const countStr = await input({ message: 'How many UUIDs?', default: '1', validate: positiveInt('count') });
  const count = parseInt(countStr, 10);
  const sp = spin('Generating…').start();
  const uuids = generateUuids(count);
  sp.stop();
  resultBox(`Generated ${count} UUID${count > 1 ? 's' : ''}`,
    uuids.map((u, i) => `${T.dim(`${String(i + 1).padStart(2)}.`)} ${T.number(u)}`));
  cliTip(`uuid${count > 1 ? ` -c ${count}` : ''}`);
  return uuids.join('\n');
}

async function runBase64(): Promise<string | null> {
  const op = await select<'encode' | 'decode'>({
    message: 'Operation:',
    choices: [
      { name: '  📤  Encode  — text → Base64',  value: 'encode' },
      { name: '  📥  Decode  — Base64 → text',  value: 'decode' },
    ],
  });
  const text = await input({ message: op === 'encode' ? 'Text to encode:' : 'Base64 string:' });
  try {
    const sp = spin('Processing…').start();
    const result = op === 'encode' ? base64Encode(text) : base64Decode(text);
    sp.stop();
    resultBox(`Base64 ${op}d`, [T.number(result)]);
    cliTip(`base64 ${op} "${text.slice(0, 20)}"`);
    return result;
  } catch (e) {
    console.log(`\n  ${T.error('✗')}  ${e instanceof Error ? e.message : 'Error'}\n`);
    return null;
  }
}

async function runJwt(): Promise<string | null> {
  const token = await input({ message: 'JWT token:' });
  const sp = spin('Decoding…').start();
  const result = decodeJwt(token);
  sp.stop();
  if (result.error) { console.log(`\n  ${T.error('✗')}  ${chalk.red(result.error)}\n`); return null; }
  const section = (label: string) =>
    `  ${T.border('┌─')} ${T.title(label)} ${T.border('─'.repeat(Math.max(1, 42 - label.length)))}`;
  console.log();
  console.log(section('Header'));
  Object.entries(result.header ?? {}).forEach(([k, v]) =>
    console.log(`  ${T.border('│')}  ${T.label(k.padEnd(16))} ${chalk.white(JSON.stringify(v))}`));
  console.log();
  console.log(section('Payload'));
  Object.entries(result.payload ?? {}).forEach(([k, v]) =>
    console.log(`  ${T.border('│')}  ${T.label(k.padEnd(16))} ${chalk.white(JSON.stringify(v))}`));
  console.log();
  if (result.expired === null) console.log(`  ${T.warn('⚠')}  No ${chalk.bold('exp')} claim — expiry unknown`);
  else if (result.expired) console.log(`  ${T.error('✗')}  Token is ${chalk.bold.red('EXPIRED')}`);
  else console.log(`  ${T.success('✔')}  Token is ${chalk.bold.green('valid')} (not expired)`);
  console.log();
  return null;
}

async function runHash(): Promise<string | null> {
  const text = await input({ message: 'Text to hash:' });
  const algoChoice = await select<HashAlgorithm | 'all'>({
    message: 'Algorithm:',
    choices: [
      ...HASH_ALGORITHMS.map((a) => ({
        name: `  ${a.toUpperCase().padEnd(8)} ${T.dim('─ ' + { md5: '128-bit', sha1: '160-bit', sha256: '256-bit', sha384: '384-bit', sha512: '512-bit' }[a])}`,
        value: a as HashAlgorithm | 'all',
      })),
      new Separator(),
      { name: '  🔢  All algorithms', value: 'all' as const },
    ],
  });
  const algos: HashAlgorithm[] = algoChoice === 'all' ? HASH_ALGORITHMS : [algoChoice];
  const sp = spin('Hashing…').start();
  const results = algos.map((a) => ({ algo: a, hash: generateHash(text, a) }));
  sp.stop();
  resultBox('Hash Result', results.map(({ algo, hash }) => `${T.label(algo.padEnd(8))} ${T.number(hash)}`));
  cliTip(algoChoice !== 'all' ? `hash "${text.slice(0, 15)}…" --algo ${algoChoice}` : `hash "${text.slice(0, 15)}…" --all`);
  return results.map(({ hash }) => hash).join('\n');
}

type CharType = 'uppercase' | 'lowercase' | 'numbers' | 'symbols';

async function runPassword(): Promise<string | null> {
  const lengthStr = await input({ message: 'Password length:', default: '16', validate: positiveInt('length') });
  const countStr  = await input({ message: 'How many passwords?', default: '1', validate: positiveInt('count') });
  const charTypes = await checkbox<CharType>({
    message: 'Include character types:',
    choices: [
      { name: '  Uppercase  A–Z', value: 'uppercase', checked: true },
      { name: '  Lowercase  a–z', value: 'lowercase', checked: true },
      { name: '  Numbers    0–9', value: 'numbers',   checked: true },
      { name: '  Symbols    !@#$…', value: 'symbols', checked: true },
    ],
    validate: (items) => items.length > 0 || 'Select at least one character type',
  });
  const count = parseInt(countStr, 10); const length = parseInt(lengthStr, 10);
  const sp = spin('Generating…').start();
  const passwords = Array.from({ length: count }, () =>
    generatePassword(length, {
      uppercase: charTypes.includes('uppercase'), lowercase: charTypes.includes('lowercase'),
      numbers: charTypes.includes('numbers'),     symbols:   charTypes.includes('symbols'),
    }));
  sp.stop();
  resultBox(`Generated ${count} Password${count > 1 ? 's' : ''}`,
    passwords.map((p, i) => `${T.dim(`${String(i + 1).padStart(2)}.`)} ${T.number(p)}`));
  cliTip(`password -l ${length}${count > 1 ? ` -c ${count}` : ''}`);
  return passwords.join('\n');
}

async function runTimestamp(): Promise<string | null> {
  const value = await input({ message: 'Timestamp / date string  (blank = now):', default: '' });
  const result = convertTimestamp(value || undefined);
  resultBox('Timestamp Conversion', [
    `${T.label('Unix (s)'.padEnd(16))} ${T.number(String(result.timestamp))}`,
    `${T.label('ISO 8601'.padEnd(16))} ${chalk.white(result.iso)}`,
    `${T.label('UTC'.padEnd(16))}      ${chalk.white(result.utc)}`,
    `${T.label('Local'.padEnd(16))}    ${chalk.white(result.local)}`,
  ]);
  cliTip(`timestamp ${value || ''}`);
  return result.iso;
}

async function runJson(): Promise<string | null> {
  const op = await select<'format' | 'validate' | 'minify'>({
    message: 'Operation:',
    choices: [
      { name: '  🎨  Format   — pretty-print with indentation', value: 'format'   },
      { name: '  ✔   Validate — check JSON syntax',             value: 'validate' },
      { name: '  📦  Minify   — strip all whitespace',          value: 'minify'   },
    ],
  });
  const raw = await input({ message: 'JSON string (paste inline):' });
  if (op === 'format') {
    const indentStr = await input({ message: 'Indent spaces:', default: '2' });
    const result = formatJson(raw, parseInt(indentStr, 10) || 2);
    if (!result.valid) { console.log(`\n  ${T.error('✗')}  ${chalk.red(result.error)}\n`); return null; }
    resultBox('Formatted JSON', result.formatted.split('\n').map((l) => chalk.white(l)));
    cliTip(`json format '${raw.slice(0, 20)}…'`);
    return result.formatted;
  }
  if (op === 'validate') {
    const result = formatJson(raw);
    console.log();
    if (result.valid) console.log(`  ${T.success('✔')}  ${chalk.bold.green('Valid JSON')}`);
    else console.log(`  ${T.error('✗')}  ${chalk.bold.red('Invalid JSON')}  ${T.dim(result.error ?? '')}`);
    console.log(); return null;
  }
  try {
    const minified = JSON.stringify(JSON.parse(raw));
    resultBox('Minified JSON', [T.number(minified)]);
    cliTip(`json minify '${raw.slice(0, 20)}…'`);
    return minified;
  } catch { console.log(`\n  ${T.error('✗')}  Invalid JSON\n`); return null; }
}

async function runLorem(): Promise<string | null> {
  const countStr = await input({
    message: 'Number of paragraphs (1–20):', default: '1',
    validate: (v) => { const n = parseInt(v, 10); return (!isNaN(n) && n >= 1 && n <= 20) || 'Enter 1–20'; },
  });
  const count = parseInt(countStr, 10);
  const text = generateLoremIpsum(count);
  resultBox(`Lorem Ipsum (${count} paragraph${count > 1 ? 's' : ''})`,
    text.split('\n\n').flatMap((p, i) => [...(i > 0 ? [''] : []), `${T.dim('¶')}  ${chalk.white(p)}`]));
  cliTip(`lorem -p ${count}`);
  return text;
}

async function runText(): Promise<string | null> {
  const text = await input({ message: 'Text to analyse:' });
  const s = countTextStats(text);
  resultBox('Text Analysis', [
    `${T.label('Characters'.padEnd(22))}       ${T.number(String(s.characters))}`,
    `${T.label('Chars (no spaces)'.padEnd(22))} ${T.number(String(s.charactersNoSpaces))}`,
    `${T.label('Words'.padEnd(22))}             ${T.number(String(s.words))}`,
    `${T.label('Sentences'.padEnd(22))}         ${T.number(String(s.sentences))}`,
    `${T.label('Lines'.padEnd(22))}             ${T.number(String(s.lines))}`,
    `${T.label('Paragraphs'.padEnd(22))}        ${T.number(String(s.paragraphs))}`,
  ]);
  cliTip(`text "${text.slice(0, 20)}…"`); return null;
}

async function runEmail(): Promise<string | null> {
  const email = await input({ message: 'Email address:' });
  const result = validateEmail(email);
  console.log();
  if (result.valid) console.log(`  ${T.success('✔')}  ${chalk.bold(email)}  ${chalk.green('is a valid email address')}`);
  else console.log(`  ${T.error('✗')}  ${chalk.bold(email)}  ${T.dim('—')}  ${chalk.red(result.reason ?? 'Invalid')}`);
  console.log(); cliTip(`email ${email}`); return null;
}

async function runSql(): Promise<string | null> {
  const operation = await select<SqlOperation>({
    message: 'SQL operation:',
    choices: [
      { name: '  SELECT       — query rows',   value: 'SELECT'       },
      { name: '  INSERT       — add a row',    value: 'INSERT'       },
      { name: '  UPDATE       — modify rows',  value: 'UPDATE'       },
      { name: '  DELETE       — remove rows',  value: 'DELETE'       },
      { name: '  CREATE TABLE — define table', value: 'CREATE_TABLE' },
    ],
  });
  const tableName = await input({ message: 'Table name:' });
  let columns: string[] | undefined, values: string[] | undefined,
      whereClause: string | undefined, orderBy: string | undefined, limit: number | undefined;
  if (['SELECT','INSERT','UPDATE','CREATE_TABLE'].includes(operation)) {
    const c = await input({ message: operation === 'CREATE_TABLE' ? 'Column defs (e.g. id INTEGER PRIMARY KEY,name TEXT):' : 'Columns (blank = all):', default: '' });
    columns = c ? c.split(',').map((col) => col.trim()) : undefined;
  }
  if (['INSERT','UPDATE'].includes(operation)) {
    const v = await input({ message: 'Values (comma-separated):' });
    values = v.split(',').map((val) => val.trim());
  }
  if (['SELECT','UPDATE','DELETE'].includes(operation)) {
    const w = await input({ message: 'WHERE clause (blank to skip):', default: '' });
    whereClause = w || undefined;
  }
  if (operation === 'SELECT') {
    const ob = await input({ message: 'ORDER BY (blank to skip):', default: '' }); orderBy = ob || undefined;
    const lim = await input({ message: 'LIMIT (blank to skip):', default: '' }); limit = lim ? parseInt(lim, 10) : undefined;
  }
  const sql = generateSql({ operation, tableName, columns, values, whereClause, orderBy, limit });
  resultBox('Generated SQL', [T.number(sql)]);
  cliTip(`sql ${operation} --table ${tableName}`); return sql;
}

async function runColor(): Promise<string | null> {
  const colorInput = await input({ message: 'Color (#RRGGBB | #RGB | rgb(r, g, b)):' });
  const result = convertColor(colorInput);
  if (result.error) { console.log(`\n  ${T.error('✗')}  ${chalk.red(result.error)}\n`); return null; }
  const { r, g, b } = result.rgb; const { h, s, l } = result.hsl;
  resultBox('Color Conversion', [
    `${T.label('Swatch'.padEnd(10))} ${chalk.bgHex(result.hex)('          ')}`,
    `${T.label('HEX'.padEnd(10))} ${T.number(result.hex)}`,
    `${T.label('RGB'.padEnd(10))} ${chalk.white(`rgb(${r}, ${g}, ${b})`)}`,
    `${T.label('HSL'.padEnd(10))} ${chalk.white(`hsl(${h}, ${s}%, ${l}%)`)}`,
  ]);
  cliTip(`color "${colorInput}"`); return result.hex;
}

async function runHtml(): Promise<string | null> {
  const htmlInput = await input({ message: 'HTML to sanitize:' });
  const sp = spin('Sanitizing…').start();
  const sanitized = sanitizeHtml(htmlInput);
  sp.stop();
  resultBox('Sanitized HTML', [T.number(sanitized)]);
  cliTip(`html sanitize "${htmlInput.slice(0, 20)}…"`); return sanitized;
}

async function runRandom(): Promise<string | null> {
  const lengthStr = await input({ message: 'String length:', default: '16', validate: positiveInt('length') });
  const countStr  = await input({ message: 'How many strings?', default: '1', validate: positiveInt('count') });
  const count = parseInt(countStr, 10); const length = parseInt(lengthStr, 10);
  const sp = spin('Generating…').start();
  const strings = Array.from({ length: count }, () => generateRandomString(length));
  sp.stop();
  resultBox(`${count} Random String${count > 1 ? 's' : ''}`,
    strings.map((s, i) => `${T.dim(`${String(i + 1).padStart(2)}.`)} ${T.number(s)}`));
  cliTip(`random -l ${length}${count > 1 ? ` -c ${count}` : ''}`); return strings.join('\n');
}

// ── New tool runners ──────────────────────────────────────────────────────────

async function runUrl(): Promise<string | null> {
  const op = await select<'encode' | 'decode' | 'parse'>({
    message: 'Operation:',
    choices: [
      { name: '  🔗  Encode  — percent-encode a string',        value: 'encode' },
      { name: '  🔓  Decode  — decode a percent-encoded string', value: 'decode' },
      { name: '  🔍  Parse   — break a URL into components',    value: 'parse'  },
    ],
  });
  if (op === 'encode') {
    const text = await input({ message: 'Text to encode:' });
    const encoded = urlEncode(text);
    resultBox('URL Encoded', [T.number(encoded)]);
    cliTip(`url encode "${text.slice(0, 20)}"`); return encoded;
  }
  if (op === 'decode') {
    const text = await input({ message: 'Percent-encoded string:' });
    try {
      const decoded = urlDecode(text);
      resultBox('URL Decoded', [T.number(decoded)]);
      cliTip(`url decode "${text.slice(0, 20)}"`); return decoded;
    } catch (e) { console.log(`\n  ${T.error('✗')}  ${e instanceof Error ? e.message : 'Error'}\n`); return null; }
  }
  const rawUrl = await input({ message: 'URL to parse:' });
  const sp = spin('Parsing…').start();
  const { parsed, error } = parseUrl(rawUrl);
  sp.stop();
  if (error || !parsed) { console.log(`\n  ${T.error('✗')}  ${chalk.red(error ?? 'Invalid URL')}\n`); return null; }
  const rows = [
    `${T.label('Protocol'.padEnd(12))} ${chalk.white(parsed.protocol)}`,
    `${T.label('Host'.padEnd(12))} ${chalk.white(parsed.host)}`,
    `${T.label('Pathname'.padEnd(12))} ${chalk.white(parsed.pathname)}`,
    `${T.label('Search'.padEnd(12))} ${chalk.white(parsed.search || T.dim('(none)'))}`,
    `${T.label('Hash'.padEnd(12))} ${chalk.white(parsed.hash || T.dim('(none)'))}`,
    ...(Object.keys(parsed.params).length > 0
      ? ['', T.dim('  Query Parameters:'),
         ...Object.entries(parsed.params).map(([k, v]) => `  ${T.label(k.padEnd(14))} ${chalk.white(v)}`)]
      : []),
  ];
  resultBox('URL Components', rows);
  cliTip(`url parse "${rawUrl.slice(0, 30)}"`); return rawUrl;
}

async function runRegex(): Promise<string | null> {
  const pattern = await input({ message: 'Regex pattern:' });
  const flags   = await input({ message: 'Flags (e.g., gi):', default: 'gi' });
  const text    = await input({ message: 'Test string:' });
  const sp = spin('Testing…').start();
  const result = testRegex(pattern, flags, text);
  sp.stop();
  if (!result.valid) { console.log(`\n  ${T.error('✗')}  ${chalk.red(result.error ?? 'Invalid regex')}\n`); return null; }
  if (result.count === 0) { console.log(`\n  ${T.warn('◈')}  ${chalk.yellow('No matches found')}\n`); return null; }
  resultBox(`Regex — ${result.count} match${result.count > 1 ? 'es' : ''}`,
    result.matches.flatMap((m, i) => [
      `${T.dim(`${String(i + 1).padStart(2)}.`)} ${T.number(`"${m.match}"`)} ${T.dim(`@ index ${m.index}`)}`,
      ...m.groups.filter((g) => g !== undefined).map(
        (g, gi) => `     ${T.label(`group ${gi + 1}:`)} ${chalk.white(g ?? '')}`),
    ]));
  cliTip(`regex "${pattern}" "${text.slice(0, 20)}" --flags ${flags}`);
  return result.matches.map((m) => m.match).join('\n');
}

async function runBase(): Promise<string | null> {
  const value    = await input({ message: 'Number value:' });
  const fromStr  = await input({ message: 'Source base (2–36):', default: '10' });
  const fromBase = parseInt(fromStr, 10);
  const showAll  = await select<'all' | 'custom'>({
    message: 'Output:',
    choices: [
      { name: '  🔢  BIN / OCT / DEC / HEX  (all four)', value: 'all'    },
      { name: '  ✏️   Custom target base',                value: 'custom' },
    ],
  });
  const sp = spin('Converting…').start();
  if (showAll === 'all') {
    const targets: Array<[string, number]> = [['BIN', 2], ['OCT', 8], ['DEC', 10], ['HEX', 16]];
    const rows = targets.map(([label, base]) => {
      const r = convertBase(value, fromBase, base);
      return r.error ? `${T.label(label.padEnd(4))} ${T.error(r.error)}` : `${T.label(label.padEnd(4))} ${T.number(r.result)}`;
    });
    sp.stop();
    resultBox(`Base Conversion  (from base ${fromBase})`, rows);
    cliTip(`base ${value} --from ${fromBase} --all`);
    // eslint-disable-next-line no-control-regex
    return rows.map((row) => row.replace(/\x1b\[[0-9;]*m/g, '')).join('\n');
  }
  const toStr = await input({ message: 'Target base (2–36):', default: '16' });
  const toBase = parseInt(toStr, 10);
  const r = convertBase(value, fromBase, toBase);
  sp.stop();
  if (r.error) { console.log(`\n  ${T.error('✗')}  ${chalk.red(r.error)}\n`); return null; }
  resultBox(`Base ${fromBase} → Base ${toBase}`, [
    `${T.label('Input'.padEnd(10))} ${chalk.white(value)}`,
    `${T.label('Decimal'.padEnd(10))} ${T.number(String(r.decimal))}`,
    `${T.label('Result'.padEnd(10))} ${T.number(r.result)}`,
  ]);
  cliTip(`base ${value} --from ${fromBase} --to ${toBase}`); return r.result;
}

async function runCase(): Promise<string | null> {
  const text = await input({ message: 'Text to convert:' });
  const to = await select<CaseType>({
    message: 'Target case style:',
    choices: CASE_TYPES.map((style) => ({
      name: `  ${style.padEnd(10)} ${T.dim('→')}  ${convertCase(text || 'hello world', style)}`,
      value: style,
    })),
  });
  const result = convertCase(text, to);
  resultBox(`Case → ${to}`, [T.number(result)]);
  cliTip(`case "${text.slice(0, 20)}" --to ${to}`); return result;
}

async function runNanoId(): Promise<string | null> {
  const sizeStr  = await input({ message: 'ID size (characters):', default: '21', validate: positiveInt('size') });
  const countStr = await input({ message: 'How many IDs?', default: '1', validate: positiveInt('count') });
  const size = parseInt(sizeStr, 10); const count = parseInt(countStr, 10);
  const sp = spin('Generating…').start();
  const ids = Array.from({ length: count }, () => generateNanoId(size));
  sp.stop();
  resultBox(`Generated ${count} NanoID${count > 1 ? 's' : ''}`,
    ids.map((id, i) => `${T.dim(`${String(i + 1).padStart(2)}.`)} ${T.number(id)}`));
  cliTip(`nanoid${size !== 21 ? ` -s ${size}` : ''}${count > 1 ? ` -c ${count}` : ''}`); return ids.join('\n');
}

// ── Kobean Chat ───────────────────────────────────────────────────────────────
async function runChat(): Promise<null> {
  const config = readConfig();

  if (!config) {
    console.log();
    console.log(chalk.bold.yellow('  ⚠  AI provider not configured.'));
    console.log(T.dim('  Run: ') + chalk.cyan('qautils chat config') + T.dim(' to set up your provider.'));
    console.log();
    return null;
  }

  const validationError = validateAIConfig(config);
  if (validationError) {
    console.error(chalk.red(`  ✗  Config error: ${validationError}`));
    console.log(T.dim('  Run: ') + chalk.cyan('qautils chat config') + T.dim(' to fix the configuration.'));
    console.log();
    return null;
  }

  console.log();
  console.log(T.dim(`  Connected to: ${chalk.cyan(config.provider)} / ${chalk.cyan(config.model || DEFAULT_MODELS[config.provider])}`));
  console.log(T.dim(`  Type ${chalk.cyan('/clear')} to reset, ${chalk.cyan('/exit')} or ${chalk.cyan('Ctrl+C')} to return to menu.`));
  console.log();

  const history: ChatMessage[] = [
    { role: 'system', content: KOBEAN_SYSTEM_PROMPT },
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: chalk.cyan('  You › '),
  });

  rl.prompt();

  await new Promise<void>((resolve) => {
    rl.on('line', async (line: string) => {
      const userInput = line.trim();

      if (!userInput) {
        rl.prompt();
        return;
      }

      if (userInput === '/exit' || userInput === '/quit') {
        rl.close();
        return;
      }

      if (userInput === '/clear') {
        history.splice(1);
        console.log(T.dim('  ↺  History cleared.\n'));
        rl.prompt();
        return;
      }

      if (userInput === '/model') {
        console.log();
        console.log(formatConfigForDisplay(toDisplayConfig(config)));
        console.log();
        rl.prompt();
        return;
      }

      history.push({ role: 'user', content: userInput });

      const sp = spin('Kobean is thinking…').start();
      try {
        const response = await sendChat(history, config);
        sp.stop();
        history.push({ role: 'assistant', content: response.message });
        console.log();
        const lines = response.message.split('\n');
        lines.forEach((l, i) => {
          if (i === 0) console.log(chalk.bold.magenta('  Kobean  › ') + l);
          else console.log('            ' + l);
        });
        console.log();
      } catch (err) {
        sp.stop();
        const msg = err instanceof Error ? err.message : String(err);
        console.error(T.error(`  ✗  Error: ${msg}\n`));
        history.pop();
      }

      rl.prompt();
    });

    rl.on('close', () => {
      console.log(T.dim('\n  Returning to menu…\n'));
      resolve();
    });

    process.once('SIGINT', () => {
      rl.close();
    });
  });

  return null;
}

// ── Kobean AI Orchestrator ─────────────────────────────────────────────────────
async function runOrchestrate(): Promise<null> {
  const config = readConfig();

  if (!config) {
    console.log();
    console.log(chalk.bold.yellow('  ⚠  AI provider not configured.'));
    console.log(T.dim('  Run: ') + chalk.cyan('qautils chat config') + T.dim(' to set up your provider.'));
    console.log();
    return null;
  }

  const validationError = validateAIConfig(config);
  if (validationError) {
    console.error(chalk.red(`  ✗  Config error: ${validationError}`));
    console.log(T.dim('  Run: ') + chalk.cyan('qautils chat config') + T.dim(' to fix the configuration.'));
    console.log();
    return null;
  }

  const task = await input({ message: 'Task description:' });
  if (!task.trim()) {
    console.log(T.dim('\n  No task provided.\n'));
    return null;
  }

  console.log();
  console.log(T.dim(`  Connected to: ${chalk.cyan(config.provider)} / ${chalk.cyan(config.model || DEFAULT_MODELS[config.provider])}`));
  console.log();

  const spinner = spin('Assembling team and running pipeline…').start();

  const onEvent = (event: AutoOrchestrateEvent) => {
    if (event.type === 'agent_start' && event.agentName) {
      spinner.text = T.dim(` [${event.agentName}] working…`);
    }
    if (event.type === 'agent_done' && event.agentName === 'Meta-Orchestrator' && event.autoTeam) {
      spinner.stop();
      console.log(T.dim('  Auto-assembled team:'));
      event.autoTeam.forEach(m => {
        console.log(`    ${chalk.cyan('·')}  ${chalk.bold.cyan(m.name.padEnd(16))} ${chalk.magenta(`[${m.role}]`.padEnd(14))} ${T.dim(m.specialty)}`);
      });
      console.log();
      spinner.start(T.dim('  Running orchestrated pipeline…'));
    }
  };

  try {
    const result = await runAutoOrchestratedPipeline(task.trim(), { ...config, maxIterations: 10 }, onEvent);
    spinner.stop();

    if (result.success) {
      console.log(T.success('  ✓  Orchestration complete!\n'));
    } else {
      console.log(T.error('  ✗  Orchestration finished with errors.\n'));
    }

    console.log(chalk.white('  ' + result.summary.split('\n').join('\n  ')));
    console.log();
    console.log(T.dim(`  Duration: ${(result.totalDuration / 1000).toFixed(1)}s  ·  Agents: ${result.agentResults.length}`));
    console.log();
  } catch (err) {
    spinner.stop();
    const msg = err instanceof Error ? err.message : String(err);
    console.error(T.error(`  ✗  Error: ${msg}\n`));
  }

  return null;
}

// ── JSON Prompt Builder ───────────────────────────────────────────────────────
async function runJsonPromptBuilder(): Promise<string | null> {
  const FORMATS: Array<{ name: string; value: PromptProviderFormat }> = [
    { name: '  🟢  OpenAI    — ChatCompletion format',  value: 'openai'    },
    { name: '  🟣  Anthropic — Messages API format',    value: 'anthropic' },
    { name: '  🔵  Gemini    — GenerateContent format', value: 'gemini'    },
    { name: '  ⚙️   Generic   — plain JSON format',      value: 'generic'   },
  ];

  const format = await select<PromptProviderFormat>({ message: 'Provider format:', choices: FORMATS });

  const defaultModels: Record<PromptProviderFormat, string> = {
    openai:    'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    gemini:    'gemini-1.5-flash',
    generic:   'my-model',
  };

  const model = await input({ message: 'Model name:', default: defaultModels[format] });
  const tempStr = await input({ message: 'Temperature (0–2):', default: '0.7' });
  const tokStr  = await input({ message: 'Max tokens:', default: '1024' });

  const temperature = parseFloat(tempStr) || 0.7;
  const maxTokens   = parseInt(tokStr, 10)   || 1024;

  const messages: JsonPromptTemplate['messages'] = [];

  const sysContent = await input({ message: 'System message (blank to skip):', default: '' });
  if (sysContent.trim()) messages.push({ role: 'system', content: sysContent.trim() });

  let addMore = true;
  while (addMore) {
    const role = await select<'user' | 'assistant' | 'done'>({
      message: 'Add a message (role):',
      choices: [
        { name: '  👤  user',       value: 'user'      },
        { name: '  🤖  assistant',  value: 'assistant' },
        { name: '  ✅  Done',       value: 'done'      },
      ],
    });
    if (role === 'done') { addMore = false; break; }
    const content = await input({ message: `${role} message content (use {{var}} for variables):` });
    messages.push({ role, content });
  }

  if (messages.length === 0) {
    console.log(T.dim('\n  No messages added.\n'));
    return null;
  }

  const template: JsonPromptTemplate = { model, temperature, maxTokens, messages };

  // Collect variable values
  const allVars = new Set<string>();
  messages.forEach((m) => extractTemplateVariables(m.content).forEach((v) => allVars.add(v)));
  const variables: Record<string, string> = {};
  if (allVars.size > 0) {
    console.log(T.dim(`\n  Detected ${allVars.size} template variable(s). Enter values (blank to leave as-is):`));
    for (const varName of allVars) {
      const val = await input({ message: `  {{${varName}}}:`, default: '' });
      variables[varName] = val;
    }
  }

  const sp = spin('Building JSON prompt…').start();
  const result = buildJsonPrompt(template, variables, format);
  sp.stop();

  if (!result.valid) {
    console.log(`\n  ${T.error('✗')}  ${chalk.red(result.error)}\n`);
    return null;
  }

  console.log();
  console.log(T.border('╭─ JSON Prompt ─────────────────────────────────────────────────────╮'));
  result.json.split('\n').forEach((line) =>
    console.log(`${T.border('│')}  ${chalk.white(line)}`)
  );
  console.log(T.border('╰───────────────────────────────────────────────────────────────────╯'));
  console.log();
  cliTip(`prompt build --format ${format} --system "…" --user "…"`);
  return result.json;
}

// ── Markdown → Confluence Wiki ─────────────────────────────────────────────────
async function runMarkdownToConfluence(): Promise<string | null> {
  const markdown = await input({ message: 'Paste Markdown text (enter on blank line to finish):' });
  if (!markdown.trim()) {
    console.log(T.dim('\n  No input provided.\n'));
    return null;
  }
  const sp = spin('Converting…').start();
  const result = convertMarkdownToConfluence(markdown);
  sp.stop();
  console.log();
  console.log(T.border('╭─ Confluence Wiki ─────────────────────────────────────────────────╮'));
  result.split('\n').forEach((line) =>
    console.log(`${T.border('│')}  ${chalk.white(line)}`)
  );
  console.log(T.border('╰───────────────────────────────────────────────────────────────────╯'));
  console.log();
  cliTip(`md-confluence "# Heading\\n\\n**bold**"`);
  return result;
}

// ── File Comparator ───────────────────────────────────────────────────────────
async function runCompare(): Promise<string | null> {
  const text1 = await input({ message: 'Paste text 1 (first file content):' });
  if (!text1.trim()) { console.log(T.dim('\n  No input provided.\n')); return null; }
  const text2 = await input({ message: 'Paste text 2 (second file content):' });
  if (!text2.trim()) { console.log(T.dim('\n  No input provided.\n')); return null; }

  const ignoreWs = await select<boolean>({
    message: 'Ignore whitespace?',
    choices: [{ name: 'No', value: false }, { name: 'Yes', value: true }],
  });
  const ignoreCase = await select<boolean>({
    message: 'Ignore case?',
    choices: [{ name: 'No', value: false }, { name: 'Yes', value: true }],
  });

  const sp = spin('Comparing…').start();
  const result = compareTexts(text1, text2, {
    ignoreWhitespace: ignoreWs,
    ignoreCase,
    similarityThreshold: 0.6,
  });
  sp.stop();

  const simColor = result.similarity >= 80 ? T.success : result.similarity >= 50 ? T.warn : T.error;
  resultBox('File Comparison', [
    `${T.label('Similarity'.padEnd(14))} ${simColor(`${result.similarity}%`)}`,
    `${T.label('Same'.padEnd(14))} ${T.value(String(result.stats.sameLines))}`,
    `${T.label('Added'.padEnd(14))} ${chalk.green(String(result.stats.addedLines))}`,
    `${T.label('Removed'.padEnd(14))} ${chalk.red(String(result.stats.removedLines))}`,
    `${T.label('Modified'.padEnd(14))} ${chalk.yellow(String(result.stats.modifiedLines))}`,
    `${T.label('Total'.padEnd(14))} ${T.value(String(result.stats.totalLines))}`,
  ]);

  // Show first 30 diff lines
  const preview = result.diffLines.slice(0, 30);
  for (const line of preview) {
    if (line.type === 'same')    console.log(chalk.gray(`    ${line.content}`));
    if (line.type === 'added')   console.log(chalk.green(`  + ${line.content}`));
    if (line.type === 'removed') console.log(chalk.red(`  - ${line.content}`));
    if (line.type === 'modified') {
      console.log(chalk.red(`  - ${line.oldContent}`));
      console.log(chalk.green(`  + ${line.content}`));
    }
  }
  if (result.diffLines.length > 30) {
    console.log(T.dim(`\n  … and ${result.diffLines.length - 30} more lines`));
  }
  console.log();
  cliTip('compare file1.txt file2.txt');
  return JSON.stringify(result.stats);
}

// ── Tool registry ─────────────────────────────────────────────────────────────
type ToolKey =
  | 'uuid' | 'base64' | 'jwt' | 'hash' | 'password' | 'timestamp'
  | 'json' | 'lorem' | 'text' | 'email' | 'sql' | 'color' | 'html'
  | 'random' | 'url' | 'regex' | 'base' | 'case' | 'nanoid' | 'chat'
  | 'orchestrate' | 'mdconfluence' | 'jsonprompt' | 'compare';

const TOOLS: Record<ToolKey, { label: string; run: () => Promise<string | null> }> = {
  uuid:         { label: 'UUID Generator',            run: runUuid                },
  nanoid:       { label: 'NanoID Generator',           run: runNanoId              },
  base64:       { label: 'Base64 Encode/Decode',       run: runBase64              },
  random:       { label: 'Random String',              run: runRandom              },
  password:     { label: 'Password Generator',         run: runPassword            },
  lorem:        { label: 'Lorem Ipsum',                run: runLorem               },
  jwt:          { label: 'JWT Decoder',                run: runJwt                 },
  hash:         { label: 'Hash Generator',             run: runHash                },
  text:         { label: 'Text Analyser',              run: runText                },
  email:        { label: 'Email Validator',            run: runEmail               },
  regex:        { label: 'Regex Tester',               run: runRegex               },
  timestamp:    { label: 'Timestamp Converter',        run: runTimestamp           },
  color:        { label: 'Color Converter',            run: runColor               },
  url:          { label: 'URL Toolkit',                run: runUrl                 },
  base:         { label: 'Base Converter',             run: runBase                },
  case:         { label: 'Case Converter',             run: runCase                },
  json:         { label: 'JSON Toolkit',               run: runJson                },
  sql:          { label: 'SQL Generator',              run: runSql                 },
  html:         { label: 'HTML Sanitizer',             run: runHtml                },
  mdconfluence: { label: 'Markdown → Confluence Wiki', run: runMarkdownToConfluence },
  jsonprompt:   { label: 'JSON Prompt Builder',         run: runJsonPromptBuilder   },
  chat:         { label: 'Kobean AI Chat',             run: runChat                },
  orchestrate:  { label: 'AI Orchestrator',            run: runOrchestrate         },
  compare:      { label: 'File Comparator',             run: runCompare             },
};

export const TOOL_COUNT = Object.keys(TOOLS).length;

// ── Session history ───────────────────────────────────────────────────────────
const sessionHistory: ToolKey[] = [];
function recordHistory(key: ToolKey): void {
  const idx = sessionHistory.indexOf(key);
  if (idx !== -1) sessionHistory.splice(idx, 1);
  sessionHistory.unshift(key);
  if (sessionHistory.length > 5) sessionHistory.pop();
}

// ── Main menu ─────────────────────────────────────────────────────────────────
async function showMainMenu(): Promise<ToolKey | 'exit'> {
  console.log(T.dim(`  ${'─'.repeat(62)}`));
  type MenuItem = { name: string; value: ToolKey | 'exit'; description?: string };
  const item = (icon: string, name: string, value: ToolKey | 'exit', desc: string): MenuItem =>
    ({ name: `  ${icon}  ${name}`, value, description: desc });
  const choices: Array<MenuItem | Separator> = [];
  if (sessionHistory.length > 0) {
    choices.push(new Separator(T.dim('  ── Recent ─────────────────────────────────────── ')));
    sessionHistory.slice(0, 3).forEach((key) =>
      choices.push({ name: `  ↩   ${TOOLS[key].label}  ${T.dim('(recent)')}`, value: key }));
  }
  choices.push(new Separator(T.dim('  ── Generators ─────────────────────────────────── ')));
  choices.push(item('🔑', 'UUID Generator',       'uuid',     'Generate v4 UUIDs'));
  choices.push(item('🆔', 'NanoID Generator',     'nanoid',   'Crypto-random NanoID-style identifiers'));
  choices.push(item('🔐', 'Base64 Encode/Decode', 'base64',   'Encode text → Base64 or decode Base64 → text'));
  choices.push(item('🎲', 'Random String',        'random',   'Cryptographically random alphanumeric strings'));
  choices.push(item('🔒', 'Password Generator',   'password', 'Secure passwords with custom character classes'));
  choices.push(item('📝', 'Lorem Ipsum',          'lorem',    'Placeholder paragraph text'));
  choices.push(new Separator(T.dim('  ── Analysers ───────────────────────────────────── ')));
  choices.push(item('#',  'Hash Generator',       'hash',     'MD5 · SHA-1 · SHA-256 · SHA-384 · SHA-512'));
  choices.push(item('🔏', 'JWT Decoder',          'jwt',      'Inspect JWT header, payload, and expiry'));
  choices.push(item('📊', 'Text Analyser',        'text',     'Chars · words · sentences · lines · paragraphs'));
  choices.push(item('📧', 'Email Validator',      'email',    'Validate email address syntax'));
  choices.push(item('🧪', 'Regex Tester',         'regex',    'Test a regex pattern and highlight all matches'));
  choices.push(new Separator(T.dim('  ── Converters ──────────────────────────────────── ')));
  choices.push(item('⏰', 'Timestamp Converter',  'timestamp', 'Unix epoch ↔ ISO 8601, UTC, local time'));
  choices.push(item('🎨', 'Color Converter',      'color',     'HEX ↔ RGB ↔ HSL with swatch preview'));
  choices.push(item('🔗', 'URL Toolkit',          'url',       'Encode, decode, or parse a URL'));
  choices.push(item('🔢', 'Base Converter',       'base',      'Binary · Octal · Decimal · Hex · custom base'));
  choices.push(item('🔡', 'Case Converter',       'case',      'camelCase · snake_case · PascalCase · and more'));
  choices.push(new Separator(T.dim('  ── Data Toolkit ────────────────────────────────── ')));
  choices.push(item('📋', 'JSON Toolkit',              'json',         'Format · validate · minify JSON'));
  choices.push(item('🗄️', 'SQL Generator',             'sql',          'SELECT · INSERT · UPDATE · DELETE · CREATE TABLE'));
  choices.push(item('🌐', 'HTML Sanitizer',            'html',         'Strip <script> tags and inline event handlers'));
  choices.push(item('📝', 'MD → Confluence Wiki',      'mdconfluence', 'Convert Markdown to Confluence Wiki markup'));
  choices.push(item('🧩', 'JSON Prompt Builder',       'jsonprompt',   'Build structured AI prompts (OpenAI, Anthropic, Gemini, generic)'));
  choices.push(new Separator(T.dim('  ── Analysers ───────────────────────────────────── ')));
  choices.push(item('🔍', 'File Comparator',            'compare',      'Compare two texts — same, similar, different lines'));
  choices.push(new Separator(T.dim('  ── AI ─────────────────────────────────────────── ')));
  choices.push(item('🤖', 'Kobean AI Chat',       'chat',        'Interactive AI chat (OpenAI, Anthropic, Gemini, Ollama…)'));
  choices.push(item('🧩', 'AI Orchestrator',      'orchestrate', 'Multi-agent pipeline — describe a task and let the AI team handle it'));
  choices.push(new Separator(T.dim('  ' + '─'.repeat(52))));
  choices.push({ name: '  ✕   Exit', value: 'exit' });
  return select<ToolKey | 'exit'>({ message: chalk.bold('  Select a tool'), pageSize: 26, choices });
}

// ── Interactive entry point ───────────────────────────────────────────────────
export async function runInteractive(): Promise<void> {
  const loader = spin('Initializing QA Utils CLI…').start();
  await new Promise((r) => setTimeout(r, 280));
  loader.stop();
  printBanner(TOOL_COUNT);
  let currentTool: ToolKey | null = null;
  for (;;) {
    try {
      if (currentTool === null) {
        const choice = await showMainMenu();
        if (choice === 'exit') break;
        currentTool = choice;
      }
      recordHistory(currentTool);
      const tool = TOOLS[currentTool];
      const copyText = await tool.run();
      const next = await askNext(tool.label, copyText);
      if (next === 'exit') break;
      if (next === 'menu') { currentTool = null; console.log(); }
    } catch (err) {
      if (err instanceof Error &&
        (err.name === 'ExitPromptError' ||
         err.message.includes('User force closed') ||
         err.message.includes('force closed the prompt'))) break;
      throw err;
    }
  }
  console.log(T.dim('\n  Goodbye! 👋\n'));
}
