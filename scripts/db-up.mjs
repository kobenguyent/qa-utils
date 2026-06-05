import { spawn } from 'node:child_process';

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('`db:up` is a compatibility alias. QA Utils no longer starts a database stack here.');
console.log('Starting the Vite dev server for JSON visualizer work instead...');

const child = spawn(npmExecutable, ['run', 'dev', '--', '--host', '127.0.0.1'], {
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(`Failed to start the dev server: ${error.message}`);
  process.exit(1);
});
