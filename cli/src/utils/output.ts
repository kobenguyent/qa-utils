/**
 * qautils-cli — Output Formatting Utilities
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
  console.log(`${chalk.green('✓')}  ${chalk.cyan(label.padEnd(14))} ${chalk.bold(value)}`);
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
  const maxLen = Math.max(...rows.map(([k]) => k.length));
  rows.forEach(([key, val]) => {
    console.log(`   ${chalk.cyan(key.padEnd(maxLen + 2))} ${val}`);
  });
}

// ── Status messages ──────────────────────────────────────────────────────────

/**
 * Print an error and write to stderr:   ✗  Error: message
 */
export function printError(message: string): void {
  console.error(`${chalk.red('✗')}  ${chalk.red.bold('Error:')} ${message}`);
}

/**
 * Print a warning:   ⚠  Warning: message
 */
export function printWarn(message: string): void {
  console.warn(`${chalk.yellow('⚠')}  ${chalk.yellow.bold('Warning:')} ${message}`);
}

/**
 * Print a green checkmark info line:   ✓  message
 */
export function printOk(message: string): void {
  console.log(`${chalk.green('✓')}  ${message}`);
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
  console.log(`\n${chalk.bold.underline(text)}`);
}

/**
 * Print a dim horizontal rule.
 */
export function printDivider(): void {
  console.log(chalk.dim('   ' + '─'.repeat(48)));
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
