# MCP Server

The QA Utils MCP Server exposes 15 QA tools to AI agents through the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP). This enables AI assistants like Claude Desktop, Cursor, and other MCP-compatible clients to programmatically use QA utility functions.

## Available Tools

| Tool | Description |
|------|-------------|
| `generate_uuid` | Generate one or more random UUIDs (v4) |
| `base64_encode` | Encode a string to Base64 |
| `base64_decode` | Decode a Base64 string |
| `generate_password` | Generate a secure random password with configurable options |
| `convert_timestamp` | Convert Unix timestamps to human-readable dates and vice versa |
| `generate_hash` | Generate cryptographic hashes (MD5, SHA-1, SHA-256, SHA-384, SHA-512) |
| `generate_lorem_ipsum` | Generate lorem ipsum placeholder text |
| `count_characters` | Count characters, words, sentences, lines, and paragraphs |
| `validate_email` | Validate email address format |
| `format_json` | Format and validate JSON strings |
| `decode_jwt` | Decode JWT tokens (header, payload, expiration) |
| `generate_sql` | Generate SQL commands (SELECT, INSERT, UPDATE, DELETE, CREATE TABLE) |
| `convert_color` | Convert colors between hex, RGB, and HSL formats |
| `generate_random_string` | Generate random alphanumeric strings |
| `sanitize_html` | Remove script tags and event handlers from HTML |

::: warning JWT & HTML Sanitizer
`decode_jwt` does **not** verify signatures — do not use for security decisions. `sanitize_html` removes script tags and event handlers but is not a complete XSS protection solution.
:::

## Setup

### Install & Build

```bash
cd mcp-server
npm install
npm run build
```

### Run Tests

```bash
npm test
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

::: code-group
```json [macOS]
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "qa-utils": {
      "command": "node",
      "args": ["/absolute/path/to/qa-utils/mcp-server/dist/mcp-server/src/index.js"]
    }
  }
}
```

```json [Windows]
// %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "qa-utils": {
      "command": "node",
      "args": ["C:\\path\\to\\qa-utils\\mcp-server\\dist\\mcp-server\\src\\index.js"]
    }
  }
}
```
:::

After adding the configuration, **restart Claude Desktop**. The qa-utils tools will then be available for Claude to use.

### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "qa-utils": {
      "command": "node",
      "args": ["/absolute/path/to/qa-utils/mcp-server/dist/mcp-server/src/index.js"]
    }
  }
}
```

### Other MCP Clients

The server uses **stdio transport**, which is the standard for local MCP servers. Any MCP-compatible client can connect by spawning the process:

```bash
node /path/to/qa-utils/mcp-server/dist/mcp-server/src/index.js
```

## Tool Examples

### Generate UUID

```json
{
  "tool": "generate_uuid",
  "params": { "quantity": 3 }
}
```

**Result:**
```json
["550e8400-e29b-41d4-a716-446655440000", "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "f47ac10b-58cc-4372-a567-0e02b2c3d479"]
```

### Generate Password

```json
{
  "tool": "generate_password",
  "params": {
    "length": 24,
    "uppercase": true,
    "lowercase": true,
    "numbers": true,
    "symbols": false
  }
}
```

### Convert Timestamp

```json
{
  "tool": "convert_timestamp",
  "params": { "value": "1700000000" }
}
```

**Result:**
```json
{
  "unix": 1700000000,
  "unixMs": 1700000000000,
  "iso": "2023-11-14T22:13:20.000Z",
  "utc": "Tue, 14 Nov 2023 22:13:20 GMT",
  "local": "11/14/2023, 11:13:20 PM"
}
```

### Generate SQL

```json
{
  "tool": "generate_sql",
  "params": {
    "operation": "SELECT",
    "tableName": "users",
    "columns": ["id", "name", "email"],
    "whereClause": "active = 1",
    "orderBy": "name",
    "limit": 10
  }
}
```

**Result:**
```sql
SELECT id, name, email FROM users WHERE active = 1 ORDER BY name LIMIT 10;
```

## Architecture

The MCP server shares platform-agnostic tool logic with the main UI via `src/utils/sharedTools.ts`. Node.js-specific wrappers (crypto, Buffer) live in `mcp-server/src/tools.ts`.

```
┌─────────────────────┐
│   MCP Server        │
│   (Node.js/stdio)   │
│                     │
│ tools.ts            │  ← Node.js crypto, Buffer
│   ↓ imports         │
│ sharedTools.ts      │  ← Platform-agnostic logic
└─────────────────────┘
```

See [Shared Tools Architecture](/guide/shared-tools) for more details.

## Development

```bash
cd mcp-server

# Watch mode for TypeScript compilation
npm run dev

# Run tests in watch mode
npm run test:watch
```

## Tech Stack

- **Runtime:** Node.js
- **Protocol:** `@modelcontextprotocol/sdk` with stdio transport
- **Schema Validation:** Zod
- **Testing:** Vitest (48 tests)
