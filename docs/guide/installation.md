# Installation

## Web Application

### Quick Start

```bash
git clone https://github.com/kobenguyent/qa-utils.git
cd qa-utils
npm install
npm run dev
```

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be served by any static file server.

### GitHub Pages Deployment

```bash
npm run build:github
```

This sets the correct base path for GitHub Pages deployment.

## Desktop Application

QA Utils is available as a cross-platform desktop app built with Electron.

### Why Desktop?

- **🔓 No CORS Restrictions** — Make API calls to any server
- **⚡ Native Performance** — Faster startup and better resource management
- **📴 Offline Capable** — Use most features without internet
- **🎯 Focused Environment** — Dedicated window without browser distractions

### Download Pre-built Apps

Pre-built apps are available from [GitHub Actions](https://github.com/kobenguyent/qa-utils/actions/workflows/build-electron.yml):

| Platform | Formats |
|----------|---------|
| **macOS** | `.dmg`, `.zip` |
| **Windows** | `.exe` installer, portable `.exe` |
| **Linux** | `.AppImage`, `.deb`, `.rpm` |

### Build from Source

```bash
# Build for current platform
npm run electron:build

# Build for specific platforms
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux

# Build for all platforms
npm run electron:build:all
```

Built packages are placed in the `release/` directory.

### Development Mode

```bash
npm run electron:dev
```

This starts the Vite dev server and launches Electron pointing to it.

## MCP Server

The MCP server is a separate package inside `mcp-server/`:

```bash
cd mcp-server
npm install
npm run build
```

See [MCP Server](/mcp-server) for full configuration details.

## Package Manager

The project supports both **npm** and **Bun**:

```bash
# Using npm
npm install && npm run dev

# Using Bun
bun install && bun run dev
```
