/**
 * qautils-cli — Version helper
 *
 * Reads the package version from package.json at runtime so that
 * the version string is always in sync with cli/package.json.
 */

import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
const { version } = _require('../../package.json') as { version: string };

export { version };
