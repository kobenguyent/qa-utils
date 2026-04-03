# Desktop App

QA Utils is available as a cross-platform desktop application built with [Electron](https://www.electronjs.org/), providing a native experience on macOS, Windows, and Linux.

## Features

- **🔓 No CORS Restrictions** — Make API calls to any server without browser security limitations
- **⚡ Native Performance** — Faster startup and better resource management
- **📴 Offline Capable** — Use most features without an internet connection
- **🎯 Focused Environment** — Dedicated window without browser distractions
- **🔒 Enhanced Security** — Isolated from web browser cookies and session data

## Download

Pre-built desktop applications are automatically generated via GitHub Actions:

1. Go to the [Actions tab](https://github.com/kobenguyent/qa-utils/actions/workflows/build-electron.yml)
2. Click on the latest successful workflow run
3. Download the package for your platform from the **Artifacts** section

### Available Packages

| Platform | Formats |
|----------|---------|
| **macOS** | `.dmg` (installer), `.zip` (portable) |
| **Windows** | `.exe` (NSIS installer), `.exe` (portable) |
| **Linux** | `.AppImage` (universal), `.deb` (Debian/Ubuntu), `.rpm` (Fedora/RHEL) |

## Installation

### macOS
1. Download the `.dmg` file
2. Open the disk image
3. Drag **QA Utils** to the Applications folder
4. Launch from Applications or Spotlight

::: tip First Launch
If macOS blocks the app, right-click and select "Open", or run:
```bash
xattr -cr /Applications/QA\ Utils.app
```
:::

### Windows
1. Download the `.exe` installer
2. Run the installer and follow the prompts
3. Launch from the Start Menu or Desktop shortcut

Or use the **portable version** — download and run directly, no installation needed.

### Linux

**AppImage (all distributions)**
```bash
chmod +x "QA Utils-1.0.0.AppImage"
./"QA Utils-1.0.0.AppImage"
```

**Debian/Ubuntu**
```bash
sudo dpkg -i qa-utils_1.0.0_amd64.deb
```

**Fedora/RHEL**
```bash
sudo rpm -i qa-utils-1.0.0.x86_64.rpm
```

## Build from Source

```bash
# Build for current platform
npm run electron:build

# Platform-specific builds
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + R` | Reload the app |
| `Ctrl/Cmd + Q` | Quit the app |
| `F11` | Toggle fullscreen |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Ctrl/Cmd + 0` | Reset zoom |
| `F12` | Toggle DevTools |

## Architecture

```
qa-utils/
├── electron/
│   ├── main.js          # Main process entry point
│   └── preload.js       # Preload script for secure IPC
├── build/               # App icons and build resources
├── dist/                # Built web assets (generated)
├── release/             # Electron build output (generated)
└── src/                 # React application source
```

The Electron app loads the built React application. In development mode, it connects to the Vite dev server for hot reload support.
