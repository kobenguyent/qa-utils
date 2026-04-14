import type { Command } from 'commander';
import chalk from 'chalk';

import { urlEncode, urlDecode, parseUrl } from '../lib/tools.js';
import { printError, printTable } from '../utils/output.js';

export function registerUrlCommand(program: Command): void {
  const url = program
    .command('url')
    .description('URL encoding, decoding, and component parsing');

  url
    .command('encode <text>')
    .description('Percent-encode a string (encodeURIComponent)')
    .action((text: string) => {
      console.log(urlEncode(text));
    });

  url
    .command('decode <text>')
    .description('Decode a percent-encoded string')
    .action((text: string) => {
      try {
        console.log(urlDecode(text));
      } catch (e) {
        printError(e instanceof Error ? e.message : 'Decode failed');
        process.exit(1);
      }
    });

  url
    .command('parse <url>')
    .description('Parse a URL into its components')
    .action((rawUrl: string) => {
      const { parsed, error } = parseUrl(rawUrl);
      if (error || !parsed) {
        printError(error ?? 'Invalid URL');
        process.exit(1);
      }
      const rows: Array<[string, string]> = [
        ['Protocol', parsed.protocol],
        ['Host', parsed.host],
        ['Hostname', parsed.hostname],
        ['Port', parsed.port || chalk.dim('(default)')],
        ['Pathname', parsed.pathname],
        ['Search', parsed.search || chalk.dim('(none)')],
        ['Hash', parsed.hash || chalk.dim('(none)')],
      ];
      if (Object.keys(parsed.params).length > 0) {
        Object.entries(parsed.params).forEach(([k, v]) => {
          rows.push([`  ?${k}`, v]);
        });
      }
      printTable(rows);
    });
}
