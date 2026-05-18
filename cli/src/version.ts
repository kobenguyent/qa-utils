/**
 * qautils-cli — Version helper
 *
 * Reads the package version from package.json at runtime so that
 * the version string is always in sync with cli/package.json.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Resolve package.json relative to this compiled file's directory.
// Compiled output: dist/cli/src/version.js → package.json is at ../../../package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(
  readFileSync(join(__dirname, '../../../package.json'), 'utf-8'),
) as { version: string };

export { version };
