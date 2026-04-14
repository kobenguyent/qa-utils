/**
 * qautils-cli — Output Formatting Utilities (v2)
 *
 * Consistent, chalk-based helpers for all CLI commands.
 * Every exported function writes directly to stdout/stderr.
 */

import chalk from 'chalk';

// ── Key / value row ──────────────────────────────────────────────────────────

/**
 * Print a labelled success row:   ✓  label  value
 */
export function printSuccess(label: string, value: string): void {
  console.log(`${chalk.bold.green('✓')}  ${chalk.cyan(label.padEnd(14))} ${chalk.bold.yellow(value)}`);
}

/**
 * Print a plain labelled row (no icon):     label  value
 */
export function printRow(label: string, value: string): void {
  console.log(`   ${chalk.cyan(label.padEnd(14))} ${value}`);
}

/**
 * Print an aligned table of [key, value] pairs.
 */
export function printTable(rows: Array<[string, string]>): void {
  const maxLen = Math.max(0, ...rows.map(([k]) => k.length));
  rows.forEach(([key, val]) => {
    console.log(`   ${chalk.cyan(key.padEnd(maxLen + 2))} ${val}`);
  });
}

// ── Status messages ──────────────────────────────────────────────────────────

/**
 * Print an error to stderr:   ✗  Error: message
 */
export function printError(message: string): void {
  console.error(`${chalk.bold.red('✗')}  ${chalk.red.bold('Error:')} ${chalk.red(message)}`);
}

/**
 * Print a warning:   ⚠  Warning: message
 */
export function printWarn(message: string): void {
  console.warn(`${chalk.bold.yellow('⚠')}  ${chalk.yellow.bold('Warning:')} ${message}`);
}

/**
 * Print a green checkmark info line:   ✓  message
 */
export function printOk(message: string): void {
  console.log(`${chalk.bold.green('✓')}  ${message}`);
}

/**
 * Print a dim informational message.
 */
export function printInfo(message: string): void {
  console.log(chalk.dim(`   ${message}`));
}

// ── Section headings ─────────────────────────────────────────────────────────

/**
 * Print a bold section heading with a trailing blank line.
 */
export function printHeading(text: string): void {
  console.log(`\n${chalk.bold.cyan('┌─')} ${chalk.bold.yellow(text)}`);
}

/**
 * Print a dim horizontal rule.
 */
export function printDivider(): void {
  console.log(chalk.dim('   ' + '─'.repeat(52)));
}

// ── Framed box ────────────────────────────────────────────────────────────────

/**
 * Print a titled box with rounded corners and cyan borders.
 *
 * @param title   Short label displayed in the top-left border.
 * @param lines   Lines of content to render inside the box.
 */
export function printBox(title: string, lines: string[]): void {
  const BOX_W = 60;
  const dashes = Math.max(1, BOX_W - title.length - 2);
  const top    = chalk.cyan('╭─ ') + chalk.bold.yellow(title) + chalk.cyan(' ' + '─'.repeat(dashes) + '╮');
  const bottom = chalk.cyan('╰' + '─'.repeat(BOX_W + 2) + '╯');
  const rule   = chalk.cyan('│') + ' '.repeat(BOX_W + 2) + chalk.cyan('│');

  console.log();
  console.log(`  ${top}`);
  console.log(`  ${rule}`);
  lines.forEach((line) => console.log(`  ${chalk.cyan('│')}   ${line}`));
  console.log(`  ${rule}`);
  console.log(`  ${bottom}`);
  console.log();
}

// ── JSON output ──────────────────────────────────────────────────────────────

/**
 * Print syntax-coloured JSON to stdout.
 */
export function printJson(obj: unknown): void {
  const str = JSON.stringify(obj, null, 2);
  const coloured = str
    .replace(/"([^"]+)":/g, (_m, key: string) => `${chalk.cyan(`"${key}"`)}: `)
    .replace(/: "([^"]*)"/g, (_m, val: string) => `: ${chalk.green(`"${val}"`)}`)
    .replace(/: (-?\d+\.?\d*)/g, (_m, num: string) => `: ${chalk.yellow(num)}`)
    .replace(/: (true|false)/g, (_m, bool: string) => `: ${chalk.magenta(bool)}`)
    .replace(/: null/g, `: ${chalk.dim('null')}`);
  console.log(coloured);
}
