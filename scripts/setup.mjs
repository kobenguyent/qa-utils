#!/usr/bin/env node

/**
 * One-Command Setup Script for KobeanQAUtils
 *
 * Bootstraps the entire project across all platforms (macOS, Linux, Windows).
 * Supports full monorepo setup, quick root-only setup, clean reinstalls, and build verifications.
 *
 * Usage:
 *   node scripts/setup.mjs           # Full setup (root + api + cli + mcp-server)
 *   node scripts/setup.mjs --quick   # Root frontend only
 *   node scripts/setup.mjs --all     # Explicit full monorepo setup
 *   node scripts/setup.mjs --clean   # Remove existing node_modules and reinstall
 *   node scripts/setup.mjs --build   # Run build validation after install
 *   node scripts/setup.mjs --help    # Show help and options
 */

import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// ANSI formatting helpers
const isColorSupported = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR);
const style = {
  bold: (t) => (isColorSupported ? `\x1b[1m${t}\x1b[0m` : t),
  dim: (t) => (isColorSupported ? `\x1b[2m${t}\x1b[0m` : t),
  green: (t) => (isColorSupported ? `\x1b[32m${t}\x1b[0m` : t),
  cyan: (t) => (isColorSupported ? `\x1b[36m${t}\x1b[0m` : t),
  yellow: (t) => (isColorSupported ? `\x1b[33m${t}\x1b[0m` : t),
  red: (t) => (isColorSupported ? `\x1b[31m${t}\x1b[0m` : t),
  magenta: (t) => (isColorSupported ? `\x1b[35m${t}\x1b[0m` : t),
};

const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const isClean = args.includes('--clean');
const isQuick = args.includes('--quick');
const shouldBuild = args.includes('--build');

if (showHelp) {
  console.log(`
${style.bold(style.cyan('🚀 KobeanQAUtils — One-Command Setup'))}

${style.bold('USAGE')}
  ${style.green('npm run setup')}              # Full setup: root web app + api + cli + mcp-server
  ${style.green('npm run setup:quick')}        # Quick setup: root web app only
  ${style.green('npm run setup:clean')}        # Clean reinstall: removes node_modules and reinstalls
  ${style.green('npm run setup -- --build')}    # Run setup with full build verification

${style.bold('OPTIONS')}
  ${style.cyan('--all')}        Bootstrap root and all sub-packages (default)
  ${style.cyan('--quick')}      Install root dependencies only
  ${style.cyan('--clean')}      Delete existing node_modules before installing
  ${style.cyan('--build')}      Run build verification after install
  ${style.cyan('--help, -h')}   Show this help message
`);
  process.exit(0);
}

const startTime = Date.now();

function printBanner() {
  console.log(`\n${style.bold(style.cyan('╔═══════════════════════════════════════════════════════╗'))}`);
  console.log(`${style.bold(style.cyan('║'))}   ${style.bold(style.magenta('🚀 KobeanQAUtils'))} — ${style.bold('Repository Setup')}               ${style.bold(style.cyan('║'))}`);
  console.log(`${style.bold(style.cyan('╚═══════════════════════════════════════════════════════╝'))}\n`);
}

function checkNodeVersion() {
  const currentVersion = process.versions.node;
  const major = parseInt(currentVersion.split('.')[0], 10);
  if (major < 18) {
    console.error(
      `${style.red('✖ Error:')} Node.js version >= 18.0.0 is required. Current version is ${style.yellow(
        `v${currentVersion}`
      )}.`
    );
    process.exit(1);
  }
  console.log(`${style.green('✔')} Environment check: Node.js ${style.bold(`v${currentVersion}`)} detected`);
}

function cleanDirectory(targetPath, label) {
  const nmPath = resolve(targetPath, 'node_modules');
  if (existsSync(nmPath)) {
    process.stdout.write(`  ${style.dim('•')} Removing ${label}/node_modules ... `);
    try {
      rmSync(nmPath, { recursive: true, force: true });
      console.log(style.green('done'));
    } catch (err) {
      console.log(style.yellow(`skipped (${err.message})`));
    }
  }
}

function runCommand(command, cwd, stepName) {
  const stepStart = Date.now();
  console.log(`\n${style.bold(style.cyan('==>'))} ${style.bold(stepName)} ${style.dim(`(${cwd === rootDir ? '.' : cwd.replace(rootDir + '/', '')})`)}`);
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env },
    });
    const duration = ((Date.now() - stepStart) / 1000).toFixed(1);
    console.log(`${style.green('✔')} Completed in ${duration}s`);
  } catch (error) {
    console.error(`\n${style.red('✖ Command failed:')} ${command}`);
    process.exit(1);
  }
}

function main() {
  printBanner();
  checkNodeVersion();

  const packages = [
    { name: 'Root Web & Desktop App', path: rootDir, buildCmd: null },
    { name: 'REST API (api)', path: resolve(rootDir, 'api'), buildCmd: 'npm run build' },
    { name: 'CLI Tool (cli)', path: resolve(rootDir, 'cli'), buildCmd: 'npm run build' },
    { name: 'MCP Server (mcp-server)', path: resolve(rootDir, 'mcp-server'), buildCmd: 'npm run build' },
  ];

  const targetPackages = isQuick ? [packages[0]] : packages;

  // Clean if requested
  if (isClean) {
    console.log(`\n${style.bold('🧹 Cleaning existing dependencies...')}`);
    for (const pkg of targetPackages) {
      cleanDirectory(pkg.path, pkg.name);
    }
  }

  // 1. Install root dependencies
  runCommand('npm install', rootDir, 'Installing root dependencies');

  // 2. Install and build sub-packages (if not --quick)
  if (!isQuick) {
    for (let i = 1; i < targetPackages.length; i++) {
      const pkg = targetPackages[i];
      runCommand('npm install', pkg.path, `Installing dependencies for ${pkg.name}`);
      if (pkg.buildCmd) {
        runCommand(pkg.buildCmd, pkg.path, `Building ${pkg.name}`);
      }
    }
  }

  // 3. Optional full build validation
  if (shouldBuild) {
    runCommand('npm run build', rootDir, 'Building Root Frontend App');
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${style.bold(style.green('═══════════════════════════════════════════════════════'))}`);
  console.log(`${style.bold(style.green(' ✨ Setup completed successfully in ' + totalTime + 's!'))}`);
  console.log(`${style.bold(style.green('═══════════════════════════════════════════════════════'))}\n`);

  console.log(`${style.bold('Next Steps:')}`);
  console.log(`  ${style.cyan('npm run dev')}           ${style.dim('→ Start local web development server (http://localhost:5173)')}`);
  console.log(`  ${style.cyan('npm start')}             ${style.dim('→ Alias for npm run dev')}`);
  console.log(`  ${style.cyan('npm test')}              ${style.dim('→ Run full Vitest test suite')}`);
  console.log(`  ${style.cyan('npm run electron:dev')}  ${style.dim('→ Start Electron desktop app in dev mode')}`);
  console.log(`  ${style.cyan('npm run docs:dev')}      ${style.dim('→ Start VitePress documentation server')}`);
  if (!isQuick) {
    console.log(`  ${style.cyan('npm run build:all')}     ${style.dim('→ Build Web, API, CLI, and MCP Server')}`);
  }
  console.log();
}

main();
