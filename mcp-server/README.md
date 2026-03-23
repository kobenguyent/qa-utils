# qa-utils MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes qa-utils tools to AI agents like Claude. This enables AI assistants to programmatically use QA utility functions through the standardized MCP protocol.

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
| `decode_jwt` | Decode JWT tokens to inspect header, payload, and expiration (**does not verify signatures — do not use for security decisions**) |
| `generate_sql` | Generate SQL commands (SELECT, INSERT, UPDATE, DELETE, CREATE TABLE) |
| `convert_color` | Convert colors between hex, RGB, and HSL formats |
| `generate_random_string` | Generate random alphanumeric strings |
| `sanitize_html` | Remove script tags and event handlers from HTML |

## Setup

### Install Dependencies

```bash
cd mcp-server
npm install
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## Usage with Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "qa-utils": {
      "command": "node",
      "args": ["/absolute/path/to/qa-utils/mcp-server/dist/index.js"]
    }
  }
}
```

After adding the configuration, restart Claude Desktop. The qa-utils tools will then be available for Claude to use.

## Usage with Other MCP Clients

The server uses stdio transport, which is the standard for local MCP servers. Any MCP-compatible client can connect by spawning the process:

```bash
node /path/to/qa-utils/mcp-server/dist/index.js
```

## Development

```bash
# Watch mode for TypeScript compilation
npm run dev

# Run tests in watch mode
npm run test:watch
```
