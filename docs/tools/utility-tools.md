# Utility Tools

Core developer and QA utility tools available in QA Utils.

## 🌐 JWT Debugger

Decode and analyze JSON Web Tokens with enhanced features.

- **Multi-line textarea** for long JWT tokens
- **Paste from clipboard** for easy input
- **Real-time validation** with expiration status
- **Syntax-highlighted** decoded payload
- **Copy to clipboard** for decoded data

**Route:** `/jwtDebugger` &nbsp;|&nbsp; **MCP:** `decode_jwt`

---

## 🛸 Base64 Encode/Decode

Bidirectional Base64 encoding and decoding.

- Encode text → Base64
- Decode Base64 → text
- Error handling for invalid inputs
- Copy results to clipboard

**Route:** `/base64` &nbsp;|&nbsp; **MCP:** `base64_encode`, `base64_decode`

---

## ﹛ JSON Formatter ﹜

Advanced JSON processing and validation.

- Pretty-print with syntax highlighting
- Collapsible tree view for large objects
- Error detection and validation
- Real-time formatting as you type

**Route:** `/jsonFormatter` &nbsp;|&nbsp; **MCP:** `format_json`

---

## ⏰ Unix Timestamp Converter

Convert between Unix timestamps and human-readable dates.

- Bidirectional conversion (timestamp ↔ date)
- Supports seconds and milliseconds
- Timezone handling with local time display
- Real-time conversion with validation

**Route:** `/timestamp` &nbsp;|&nbsp; **MCP:** `convert_timestamp`

---

## 🔑 UUID Generator

Generate universally unique identifiers.

- UUID v1 (timestamp-based) and v4 (random)
- Bulk generation support
- Copy to clipboard

**Route:** `/uuid` &nbsp;|&nbsp; **MCP:** `generate_uuid`

---

## 🔐 Password Generator

Generate secure random passwords.

- Configurable length (1–256)
- Toggle uppercase, lowercase, numbers, symbols
- Password strength indicator
- Copy to clipboard

**Route:** `/password` &nbsp;|&nbsp; **MCP:** `generate_password`

---

## #️⃣ Hash Generator

Generate cryptographic hashes.

- **Algorithms:** MD5, SHA-1, SHA-256, SHA-384, SHA-512
- Real-time hash computation
- Copy hash to clipboard

**Route:** `/hash` &nbsp;|&nbsp; **MCP:** `generate_hash`

---

## 📝 Lorem Ipsum Generator

Generate placeholder text for testing and design.

- Configurable number of paragraphs (1–20)
- Classic lorem ipsum text
- Copy to clipboard

**Route:** `/lorem-ipsum` &nbsp;|&nbsp; **MCP:** `generate_lorem_ipsum`

---

## 🔢 Character Counter

Analyze text with comprehensive statistics.

- Characters (with and without spaces)
- Words, sentences, lines, paragraphs
- Real-time counting

**Route:** `/character-counter` &nbsp;|&nbsp; **MCP:** `count_characters`

---

## 🗄️ SQL Generator

Generate SQL commands for common operations.

- **Operations:** SELECT, INSERT, UPDATE, DELETE, CREATE TABLE
- JOIN support (INNER, LEFT, RIGHT, FULL)
- WHERE clause builder
- ORDER BY and LIMIT support
- Parameterized value escaping

**Route:** `/sql-generator` &nbsp;|&nbsp; **MCP:** `generate_sql`

---

## 🎨 Color Converter

Convert colors between different formats.

- **Formats:** Hex, RGB, HSL
- Visual color preview
- Real-time conversion

**Route:** `/color-converter` &nbsp;|&nbsp; **MCP:** `convert_color`

---

## 🔐 Encryption/Decryption

Encrypt and decrypt data with multiple algorithms.

- Multiple cipher support
- Key management
- Input/output in various formats

**Route:** `/encryption`

---

## 🔑 OTP Generator

Generate time-based and counter-based one-time passwords.

- TOTP (time-based)
- HOTP (counter-based)
- QR code generation for authenticator apps

**Route:** `/otp`

---

## 📋 JIRA Comment Generator

Format comments for JIRA with markdown support.

- JIRA-compatible markdown formatting
- Template support
- Copy formatted output

**Route:** `/jiraComment`

---

## 📊 QR Code Generator

Generate QR codes from text or URLs.

- Custom sizes
- Download as image
- Real-time preview

**Route:** `/qr-code`

---

## 📦 Dummy Data Generator

Generate test data in various formats.

- JSON, CSV, SQL formats
- Configurable schemas
- Bulk generation

**Route:** `/dummy-data`


---

## 📝 Markdown to Confluence Wiki Converter

Convert Markdown text or `.md` files to Confluence Wiki markup.

- Headings (`# H1` → `h1. H1`)
- Bold, italic, strikethrough, inline code
- Fenced code blocks with language syntax highlighting
- Ordered and unordered lists (with nesting)
- Links and images
- Blockquotes and horizontal rules
- GFM tables
- Upload one or multiple `.md` files

**Route:** `/markdown-to-confluence` &nbsp;|&nbsp; **MCP:** `convert_markdown_to_confluence` &nbsp;|&nbsp; **CLI:** `md-confluence`
