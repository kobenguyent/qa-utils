# Shared Tools Architecture

QA Utils uses a shared tools module to avoid code duplication between the MCP server and the web UI.

## Overview

Platform-agnostic tool logic lives in `src/utils/sharedTools.ts`. Both the MCP server (Node.js) and the UI (browser) import from this module, adding platform-specific wrappers only where necessary.

## Shared Functions

The following functions are implemented in `sharedTools.ts`:

| Function | Description |
|----------|-------------|
| `generateLoremIpsum(paragraphs)` | Generate placeholder text |
| `countTextStats(value)` | Count characters, words, sentences, lines, paragraphs |
| `validateEmail(email)` | Validate email format |
| `formatJson(input, indent)` | Format and validate JSON |
| `convertTimestamp(value)` | Convert Unix timestamps ↔ dates |
| `generateSql(options)` | Generate SQL commands |
| `convertSimpleColor(input)` | Convert colors between hex, RGB, HSL |
| `sanitizeHtml(html)` | Remove script tags and event handlers |
| `decodeJwt(token)` | Decode JWT header, payload, and expiration |

## Platform-Specific Wrappers

Some operations require platform-specific APIs:

### Node.js (MCP Server)

`mcp-server/src/tools.ts` uses Node.js built-ins:

```typescript
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';

export function generateUuids(quantity: number): string[] {
  return Array.from({ length: quantity }, () => randomUUID());
}

export function base64Encode(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64');
}

export function generateHash(value: string, algorithm: string): string {
  return createHash(algorithm).update(value).digest('hex');
}
```

### Browser (UI)

`src/utils/defaultTools.ts` uses browser APIs:

```typescript
// Uses crypto.randomUUID() from Web Crypto API
// Uses btoa()/atob() for Base64
// Uses SubtleCrypto for hashing
```

## Adding a New Shared Tool

1. **Add the function** to `src/utils/sharedTools.ts`:
   ```typescript
   export function myNewTool(input: string): { result: string } {
     // Platform-agnostic implementation
     return { result: input.toUpperCase() };
   }
   ```

2. **Register in the UI** (`src/utils/defaultTools.ts`):
   ```typescript
   import { myNewTool } from './sharedTools';

   ToolRegistry.register({
     id: 'my-new-tool',
     name: 'My New Tool',
     execute: async (params) => myNewTool(params.input),
   });
   ```

3. **Register in the MCP server** (`mcp-server/src/index.ts`):
   ```typescript
   server.registerTool('my_new_tool', {
     description: 'My new tool',
     inputSchema: { input: z.string() },
   }, async ({ input }) => ({
     content: [{ type: 'text', text: JSON.stringify(myNewTool(input)) }],
   }));
   ```

4. **Add tests** for both the shared function and any platform-specific wrappers.
