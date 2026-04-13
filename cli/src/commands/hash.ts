import type { Command } from 'commander';
import { generateHash, HASH_ALGORITHMS, type HashAlgorithm } from '../lib/tools.js';
import { printError, printTable } from '../utils/output.js';

export function registerHashCommand(program: Command): void {
  program
    .command('hash <text>')
    .description('Generate a cryptographic hash of the given text')
    .option(
      '-a, --algo <algorithm>',
      `hash algorithm (${HASH_ALGORITHMS.join(', ')})`,
      'sha256',
    )
    .option('--all', 'generate hashes for all supported algorithms')
    .action((text: string, options: { algo: string; all: boolean }) => {
      if (options.all) {
        printTable(
          HASH_ALGORITHMS.map((algo) => [algo, generateHash(text, algo)]),
        );
        return;
      }

      const algo = options.algo as HashAlgorithm;
      if (!HASH_ALGORITHMS.includes(algo)) {
        printError(
          `Unknown algorithm "${algo}". Supported: ${HASH_ALGORITHMS.join(', ')}`,
        );
        process.exit(1);
      }

      console.log(generateHash(text, algo));
    });
}
