/**
 * Generates a static Swagger UI page in dist/api-docs/ for GitHub Pages hosting.
 *
 * Steps:
 *   1. Exports the OpenAPI spec from the api/ package (api/openapi.json).
 *   2. Copies it to dist/api-docs/openapi.json.
 *   3. Writes a static Swagger UI index.html that loads the spec.
 *
 * Usage:  node scripts/build-swagger-ui.mjs
 */

import { execSync } from 'child_process';
import { mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const apiDir = resolve(rootDir, 'api');
const outDir = resolve(rootDir, 'dist', 'api-docs');

// ── 1. Export the OpenAPI spec ────────────────────────────────────────────────
console.log('📄  Exporting OpenAPI spec from api/ …');
execSync('npm run export:spec', { cwd: apiDir, stdio: 'inherit' });

// ── 2. Copy spec to dist/api-docs/ ────────────────────────────────────────────
mkdirSync(outDir, { recursive: true });
copyFileSync(resolve(apiDir, 'openapi.json'), resolve(outDir, 'openapi.json'));
console.log('📂  Copied openapi.json → dist/api-docs/openapi.json');

// ── 3. Write static Swagger UI page ──────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="QA Utils API Documentation — interactive OpenAPI 3.0 explorer" />
    <title>QA Utils API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; }
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .back-link {
        display: inline-block;
        padding: 8px 16px;
        background: #1a1a2e;
        color: #fff;
        text-decoration: none;
        font-family: sans-serif;
        font-size: 14px;
      }
      .back-link:hover { background: #2d2d5e; }
    </style>
  </head>
  <body>
    <a class="back-link" href="/qa-utils/">← QA Utils App</a>
    <a class="back-link" href="/qa-utils/docs/">📖 Docs</a>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: './openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset,
          ],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: 'StandaloneLayout',
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: false,
        });
      };
    </script>
  </body>
</html>
`;

writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8');
console.log('✅  Static Swagger UI written to dist/api-docs/');
