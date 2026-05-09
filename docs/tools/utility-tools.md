# Utility Tools

Core developer and QA utility tools available in QA Utils, organized by category.

---

## 🔄 Converters & Formatters

### 🔑 JWT Debugger

Decode and inspect JSON Web Tokens with full header, payload, and signature analysis.

- **Multi-line textarea** for pasting long JWT strings
- **Header & payload** decoded and syntax-highlighted separately
- **Expiration status** — instantly see if the token is valid, expired, or not-yet-valid
- **Algorithm display** — shows the signing algorithm (RS256, HS256, etc.)
- **Paste from clipboard** one-click input
- **Copy to clipboard** for decoded segments

**Route:** `/jwtDebugger` &nbsp;|&nbsp; **MCP:** `decode_jwt` &nbsp;|&nbsp; **CLI:** `qautils jwt <token>`

---

### 🛸 Base64 Encode / Decode

Bidirectional Base64 encoding and decoding for text and binary data.

- Encode plain text → Base64
- Decode Base64 → plain text
- Handles URL-safe Base64 variants
- Validates input and shows clear error messages for invalid Base64
- Copy result to clipboard

**Route:** `/base64` &nbsp;|&nbsp; **MCP:** `base64_encode`, `base64_decode` &nbsp;|&nbsp; **CLI:** `qautils base64 encode/decode`

---

### ﹛﹜ JSON Formatter

Advanced JSON processing and validation with an interactive tree explorer.

- **Pretty-print** with configurable indentation (2 or 4 spaces)
- **Collapsible tree view** for exploring deeply nested objects
- **Validation** — shows line/column of syntax errors in real-time
- **Minify** mode for compact output
- Copy formatted or minified output to clipboard

**Route:** `/jsonFormatter` &nbsp;|&nbsp; **MCP:** `format_json` &nbsp;|&nbsp; **CLI:** `qautils json format/validate/minify`

---

### ⏰ Unix Timestamp Converter

Convert between Unix epoch timestamps and human-readable dates in any direction.

- **Bidirectional** — timestamp → date or date → timestamp
- Supports **seconds** and **milliseconds** precision
- Timezone-aware — shows local time, UTC, and ISO 8601
- "Current time" button to populate with right now
- Real-time conversion as you type

**Route:** `/timestamp` &nbsp;|&nbsp; **MCP:** `convert_timestamp` &nbsp;|&nbsp; **CLI:** `qautils timestamp`

---

### 🎨 Color Converter

Convert colors between all major formats with visual preview, palette generation, and WCAG contrast analysis.

- **Formats:** HEX ↔ RGB ↔ HSL ↔ HSV ↔ CMYK ↔ LAB
- **Live color preview** swatch
- **Palette generation** — complementary, analogous, triadic, split-complementary, tetradic
- **WCAG contrast checker** — AA/AAA pass/fail for normal and large text
- **Colorblind simulation** — Deuteranopia, Protanopia, Tritanopia
- Copy any format value to clipboard

**Route:** `/color-converter` &nbsp;|&nbsp; **MCP:** `convert_color` &nbsp;|&nbsp; **CLI:** `qautils color`

---

### 🗄️ SQL Command Generator

Build SQL queries visually without writing raw SQL manually.

- **Operations:** SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER TABLE
- **JOIN builder** — INNER, LEFT, RIGHT, FULL OUTER joins with ON conditions
- **WHERE clause builder** — multiple conditions with AND/OR logic
- **ORDER BY / LIMIT / OFFSET** support
- **Parameterized values** with proper escaping
- Copy generated SQL or download as `.sql` file

**Route:** `/sql-generator` &nbsp;|&nbsp; **MCP:** `generate_sql` &nbsp;|&nbsp; **CLI:** `qautils sql`

---

### 🌐 HTML Renderer

Live preview and sanitize HTML code in a sandboxed environment.

- **Live preview** — rendered output updates as you type
- **Sanitizer mode** — strips `<script>` tags and event handler attributes (`onclick`, `onload`, etc.)
- Split view (editor + preview side-by-side)
- Fullscreen preview mode
- Copy sanitized HTML to clipboard

**Route:** `/html-renderer` &nbsp;|&nbsp; **MCP:** `sanitize_html`

---

### 🔄 Media Converter

Convert between image formats and PDF documents directly in the browser — no upload to any server.

- **Image → PDF** — convert single or multiple images into a single PDF document
- **PNG ↔ JPEG ↔ WebP** format conversion with quality control
- **Background removal** — AI-powered transparent PNG cutout
- Drag-and-drop file upload
- Download converted files immediately

**Route:** `/media-converter`

---

### 📝 Markdown to Confluence Wiki

Convert Markdown text or `.md` files to Confluence Wiki markup, fully offline in the browser.

- **Headings** (`# H1` → `h1. H1`), bold, italic, strikethrough, inline code
- **Fenced code blocks** with language hint (`{code:language=…}`)
- **Ordered and unordered lists** with arbitrary nesting depth
- **Links and images**, GFM tables, blockquotes, horizontal rules
- Upload one or multiple `.md` files for bulk conversion
- Copy output or download as `.txt`

**Route:** `/markdown-to-confluence` &nbsp;|&nbsp; **MCP:** `convert_markdown_to_confluence` &nbsp;|&nbsp; **CLI:** `qautils md-confluence`

---

## 🎲 Generators

### 🆔 UUID Generator

Generate universally unique identifiers in bulk.

- **UUID v1** — timestamp-based (MAC address + time)
- **UUID v4** — cryptographically random
- **Bulk generation** — 1–100 UUIDs at once
- Uppercase / lowercase toggle
- Copy all or individual UUIDs

**Route:** `/uuid` &nbsp;|&nbsp; **MCP:** `generate_uuid` &nbsp;|&nbsp; **CLI:** `qautils uuid`

---

### 🔐 OTP Generator

Generate one-time passwords compatible with Google Authenticator, Authy, and other TOTP/HOTP apps.

- **TOTP** — 6-digit time-based codes that rotate every 30 seconds
- **HOTP** — deterministic counter-based codes
- Configurable **Base32 secret key**
- **QR code** output for importing into authenticator apps
- Countdown timer showing seconds until next rotation

**Route:** `/otp`

---

### 🔑 Password Generator

Generate cryptographically secure random passwords with fine-grained control.

- Configurable **length** (1–256 characters)
- Toggle **uppercase**, **lowercase**, **digits**, **symbols** independently
- **Exclude ambiguous characters** (0, O, l, 1) option
- **Strength indicator** with entropy-based scoring (bits of entropy)
- Bulk generation
- Copy to clipboard

**Route:** `/password` &nbsp;|&nbsp; **MCP:** `generate_password` &nbsp;|&nbsp; **CLI:** `qautils password`

---

### #️⃣ Hash Generator

Generate cryptographic hash digests for any text input.

- **Algorithms:** MD5, SHA-1, SHA-256, SHA-384, SHA-512
- Real-time hash computation as you type
- **HMAC mode** with configurable secret key
- Uppercase / lowercase hex output toggle
- Copy individual hashes

**Route:** `/hash` &nbsp;|&nbsp; **MCP:** `generate_hash` &nbsp;|&nbsp; **CLI:** `qautils hash`

---

### 🔒 HTPasswd Generator

Generate Apache / Nginx HTTP Basic Authentication password file entries.

- **Algorithms:** bcrypt (recommended), MD5-APR, SHA-1, plain-text
- Add multiple user entries in one session
- Preview the complete `.htpasswd` file content
- Copy or download the file

**Route:** `/htpasswd`

---

### 📝 Lorem Ipsum Generator

Generate classic Latin placeholder text for mockups and designs.

- Configurable output by **paragraphs**, **sentences**, or **words**
- 1–20 paragraphs
- Optionally start with the classic "Lorem ipsum…" opening
- Copy to clipboard

**Route:** `/lorem-ipsum` &nbsp;|&nbsp; **MCP:** `generate_lorem_ipsum` &nbsp;|&nbsp; **CLI:** `qautils lorem`

---

### 📋 JIRA Comment Generator

Format rich JIRA comments in Atlassian Wiki Markup.

- **Templates** for bug reports, test results, review feedback
- JIRA panel types (`{panel}`, `{info}`, `{warning}`, `{error}`)
- Code snippet blocks with language syntax highlighting
- Markdown-to-Wiki-Markup conversion
- Copy formatted output

**Route:** `/jiraComment`

---

### 🔢 Character Counter

Comprehensive real-time text analysis and statistics.

- **Characters** (with and without spaces)
- **Words**, **sentences**, **lines**, **paragraphs**
- **Reading time** estimate (based on 200 wpm average)
- **Keyword density** — top N most-frequent words
- Stats update live as you type

**Route:** `/character-counter` &nbsp;|&nbsp; **MCP:** `count_characters` &nbsp;|&nbsp; **CLI:** `qautils text`

---

### 📁 Test File Generator

Generate synthetic files of specific types and sizes for upload/download and file-handling tests.

- **Supported types:** PNG, JPEG, GIF, WebP, PDF, WAV, MP3, MP4, CSV, JSON, XML, DOCX, XLSX, ZIP
- Configurable **file size** (KB to MB)
- **Batch generation** — generate multiple files in one click
- Download files directly to your machine

**Route:** `/test-file-generator`

---

### 🚀 GitHub PR Script Generator

Generate a complete bash script that automates the full GitHub Pull Request workflow.

- Branch naming conventions (feature/, fix/, chore/, hotfix/)
- **Commit message** formatting with Conventional Commits support
- **PR title and body** template generation
- Reviewer and label assignment flags
- Draft PR support (`--draft`)
- Copy or download the generated `.sh` script

**Route:** `/github-pr-generator`

---

### 📱 QR Code Generator

Generate static and dynamic QR codes for a wide range of content types.

- **Content types:** URL, Wi-Fi (SSID + password + encryption), vCard, Email, SMS, Phone, Plain text, Geo location, Calendar event (vEvent)
- Configurable **size**, **error correction** level (L/M/Q/H), **foreground / background color**
- Download as PNG or SVG

**Route:** `/qr-code`

---

### 🎭 Dummy Data Generator

Generate realistic fake test data in bulk with a custom schema.

- **Fields:** first/last name, email, phone, address, city, country, company, job title, date of birth, UUID, IP address, URL, credit card (masked), and more
- **Output formats:** JSON, CSV, SQL INSERT statements, Markdown table
- Configurable row count (1–1000)
- Custom schema builder — pick only the fields you need
- Download generated data

**Route:** `/dummy-data`

---

## 🔧 Developer Tools

### 🎨 Image Editor

Client-side photo editor for quick image adjustments and export — no server upload.

- **Adjustments:** Brightness, contrast, saturation, hue, blur, sharpen
- **Filters:** Grayscale, sepia, invert
- **Transforms:** Rotate 90°/180°/270°, flip horizontal/vertical, crop
- **Compression** — reduce file size with configurable JPEG quality
- Undo / redo history
- Download edited image as PNG or JPEG

**Route:** `/image-editor`

---

### 📁 File Processor

Batch resize, compress, and convert images and documents.

- **Batch processing** — handle multiple files in one operation
- **Image resize** — set pixel dimensions or percentage scaling
- **Compression** — JPEG/PNG quality control
- **Format conversion** — PNG ↔ JPEG ↔ WebP
- Progress indicator for large batches
- Download results as a ZIP archive

**Route:** `/file-processor`

---

### 🔒 Encryption / Decryption

Encrypt and decrypt text directly in the browser using modern cipher algorithms.

- **Algorithms:** AES-256-GCM, AES-256-CBC, AES-128-GCM
- **Key derivation** from a password using PBKDF2 (100k iterations, SHA-256)
- IV and salt are embedded in the output (Base64-encoded)
- Decrypt any previously encrypted payload with the same key
- Copy encrypted or decrypted result

**Route:** `/encryption`

---

### 🎭 Test Code Converter (Playwright → CodeceptJS)

Convert Playwright test code to CodeceptJS format using two conversion modes.

- **Regex mode** — fast, deterministic, works fully offline
- **AI-powered mode** — context-aware conversion using your configured AI provider for complex tests with custom helpers or page objects
- Handles `page.click`, `page.fill`, `page.goto`, `expect`, `locator`, `waitFor` patterns
- Automatic fallback to regex mode if AI conversion fails
- Syntax-highlighted input and output editors

**Route:** `/playwright2codecept`

---

### 📊 Sequence Diagram Generator

Generate Mermaid.js sequence diagrams directly from test automation code.

- **Input:** CodeceptJS or Playwright test code
- **Output:** Valid Mermaid `sequenceDiagram` syntax
- Live diagram **preview** rendered inline
- Download as SVG or copy diagram source
- Customise actor labels

**Route:** `/sequence-diagram`

---

### 🚀 CI/CD Workflow Generator

Generate production-ready CI/CD pipeline configuration files for multiple platforms.

- **Platforms:** GitHub Actions, GitLab CI, Azure DevOps, Jenkins (Declarative Pipeline), Bitbucket Pipelines
- **Test runners:** Playwright, Cypress, WebDriverIO, Puppeteer, Newman (Postman CLI)
- **Node.js versions:** 16, 18, 20, 21
- API test stages, E2E stages, parallel sharding support
- NPM publish workflow option
- Real-time preview with syntax highlighting
- Download as `.yml` / `Jenkinsfile`

**Route:** `/workflow-generator`

---

### 📋 Kanban Board

Visual drag-and-drop task management board, persisted locally.

- **Default columns:** Backlog, In Progress, Review, Done — fully customisable
- **Cards** with title, description, priority label, and due date
- **Drag & drop** cards between columns and to reorder within a column
- Add, edit, and delete cards and columns
- Data persisted in `localStorage` — survives page refresh

**Route:** `/kanban`

---

### 🔍 Website Scanner

Comprehensive website audit for quality and compliance checks.

- **Broken links** — crawls pages and reports 4xx/5xx responses
- **Accessibility** — missing `alt` attributes, heading order violations, colour contrast issues
- **SEO** — meta tags, title length, canonical URLs, Open Graph tags
- **Security headers** — HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Export results as JSON or CSV

**Route:** `/website-scanner`
