/**
 * Export the OpenAPI spec to api/openapi.json.
 *
 * Run with:  npm run export:spec
 *
 * The generated file can be imported into:
 *   - Postman (File > Import)
 *   - Playwright (use swagger-to-playwright or openapi-typescript-codegen)
 *   - CodeceptJS, REST Assured, Karate, etc.
 */
import fs from 'node:fs';
import path from 'node:path';
import { swaggerSpec } from './app';

const outputPath = path.join(__dirname, '..', 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
console.log(`✅  OpenAPI spec written to: ${outputPath}`);
