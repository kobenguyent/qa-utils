# Electron Desktop App Implementation Guide

This document provides detailed information about the Electron desktop app implementation for QA Utils.

## Overview

QA Utils has been successfully converted into a cross-platform desktop application using Electron. The desktop app runs on macOS, Windows, and Linux, solving CORS issues that occur when using the web version.

## Architecture

### File Structure

```
qa-utils/
├── electron/
│   ├── main.js          # Main process entry point
│   └── preload.js       # Preload script for secure IPC
├── build/
│   ├── README.md        # Icon creation instructions
│   └── icons/           # Platform-specific icons (user-provided)
├── dist/                # Built web assets
├── release/             # Electron build output (generated)
└── src/                 # React application source
```

### Main Process (electron/main.js)

The main process handles:
- Window creation and management
- Application lifecycle (ready, activate, quit)
- Application menu with keyboard shortcuts
- Security configuration (contextIsolation, webSecurity)
- Development vs production mode handling

### Preload Script (electron/preload.js)

The preload script uses `contextBridge` to:
- Safely expose platform information to renderer
- Maintain security through context isolation
- Enable future IPC communication if needed

### Renderer Process

The renderer process is the React application that runs in the Electron window. It's the same codebase as the web version, with no changes required.

## Build Process

### Development Mode

```bash
npm run electron:dev
```

This command:
1. Starts Vite dev server on port 5173
2. Waits for server to be ready
3. Launches Electron pointing to localhost:5173
4. Enables hot module replacement (HMR)
5. Opens DevTools automatically

### Production Build

```bash
npm run electron:build        # Current platform
npm run electron:build:mac    # macOS only
npm run electron:build:win    # Windows only
npm run electron:build:linux  # Linux only
npm run electron:build:all    # All platforms
```

Build process:
1. Sets `ELECTRON=true` environment variable
2. Runs TypeScript compiler (`tsc`)
3. Runs Vite build with relative paths (base: './')
4. Packages with electron-builder
5. Creates platform-specific distributables in `release/`

## Configuration

### package.json

Key configuration sections:

```json
{
  "main": "electron/main.js",
  "build": {
    "appId": "com.kobenguyent.qa-utils",
    "productName": "QA Utils",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "category": "Development",
      "target": ["AppImage", "deb", "rpm"]
    }
  }
}
```

### vite.config.ts

The Vite configuration supports both web and Electron builds:

```typescript
let base = '/'
if (process.env.DEPLOY_ENV === 'github') {
  base = '/qa-utils/'  // GitHub Pages
}
if (process.env.ELECTRON === 'true') {
  base = './'  // Electron (relative paths)
}
```

#### Analytics and External Resources

When building for Electron (`ELECTRON=true`), the build process automatically:

1. **Keeps Umami Analytics**: The analytics script from `cloud.umami.is` is included to track desktop app usage
2. **Removes External React CDN**: The React UMD build from `cdn.jsdelivr.net` is removed as React is bundled by Vite (redundant)
3. **Keeps OTPLib CDN**: The OTPLib scripts from `unpkg.com` are kept as they are required for the OTP Generator feature

This ensures the Electron app:
- Tracks usage analytics via Umami with platform-specific data
- Doesn't load redundant React CDN dependencies
- Maintains all required functionality
- Has optimal performance

##### Desktop App Analytics Implementation

The Electron app uses an enhanced Umami analytics implementation (`src/utils/umami.ts`) that automatically:

1. **Detects the environment**: Distinguishes between web and Electron contexts
2. **Adds platform metadata**: Tracks OS platform (macOS, Windows, Linux), app version, and environment
3. **Prefixes page views**: Desktop app page views are tracked as `electron:/page` to distinguish from web traffic
4. **Supports custom events**: Additional `trackEvent()` function for tracking desktop-specific user actions

##### Automatic Version Management

Desktop app builds include automatic version bumping to ensure each build has a unique identifier:

1. **Auto-increment**: Running any `electron:build*` script automatically bumps the patch version in `package.json`
2. **Unique versioning**: The app version includes the commit hash: `version+commit` (e.g., `1.0.2+abc123`)
3. **Build tracking**: This allows tracking which specific build users are running in analytics

The version is read dynamically from `package.json` at build time and combined with the git commit hash to create a unique identifier for each desktop build.

Example tracking data:
```javascript
// Web app
{ environment: 'web' }

// Desktop app (macOS, version 1.0.2, commit abc123)
{ 
  environment: 'electron',
  platform: 'darwin',
  app_version: '1.0.2+abc123'
}
```

**Version Bump Script**: The `scripts/bump-electron-version.cjs` script automatically increments the patch version before each Electron build. This ensures:
- Each release has a unique version number
- Easy tracking of which version users are running
- Clear distinction between different builds in analytics

This allows for separate analytics dashboards and insights for web vs desktop users while using the same Umami instance.

## Security Features

The Electron app implements security best practices:

1. **Context Isolation**: Enabled to prevent renderer access to Node.js
2. **Node Integration**: Disabled to prevent Node.js APIs in renderer
3. **Web Security**: Enabled to enforce same-origin policy
4. **Preload Script**: Used for secure IPC communication
5. **CSP Headers**: Maintained from web version

## Platform-Specific Details

### macOS

**Output Files:**
- `QA Utils-1.0.0.dmg` - Installer disk image
- `QA Utils-1.0.0-mac.zip` - Zipped app bundle

**Installation:**
- Double-click DMG
- Drag to Applications folder
- Launch from Applications or Spotlight

**Code Signing:**
- Not configured by default
- Add `identity` in `build.mac` for distribution

### Windows

**Output Files:**
- `QA Utils Setup 1.0.0.exe` - NSIS installer
- `QA Utils 1.0.0.exe` - Portable executable

**Installation:**
- Run installer for system-wide installation
- Or use portable version (no admin required)

**Code Signing:**
- Not configured by default
- Add `certificateFile` and `certificatePassword` for distribution

### Linux

**Output Files:**
- `QA Utils-1.0.0.AppImage` - Universal package
- `qa-utils_1.0.0_amd64.deb` - Debian/Ubuntu
- `qa-utils-1.0.0.x86_64.rpm` - Red Hat/Fedora

**Installation:**
- AppImage: Just make executable and run
- DEB: `sudo dpkg -i qa-utils_*.deb`
- RPM: `sudo rpm -i qa-utils-*.rpm`

## Benefits of Desktop App

### 1. No CORS Restrictions
- Direct API calls without browser limitations
- WebSocket connections to any server
- gRPC-Web calls without proxy

### 2. Native Integration
- OS-level menu bar
- Keyboard shortcuts
- Native notifications (future)
- System tray integration (future)

### 3. Performance
- Faster startup than browser
- Better resource management
- Dedicated process

### 4. Privacy & Security
- Isolated from browser cookies/sessions
- No third-party extensions
- Local data storage

### 5. Offline Capability
- Works without internet (except API calls)
- Persistent local storage
- No dependency on web hosting

## Distribution

### GitHub Releases

To distribute the app:

1. Build for all platforms: `npm run electron:build:all`
2. Upload files from `release/` to GitHub Releases
3. Users download platform-specific files

### GitHub Actions Workflow

The repository includes a GitHub Actions workflow (`.github/workflows/build-electron.yml`) that automatically builds the Electron app for all platforms:

**Features:**
- Builds for macOS, Windows, and Linux in parallel
- Uploads artifacts for easy download
- Triggered on:
  - Push to `main` branch (when electron/src files change)
  - Release tags (e.g., `v1.0.0`)
  - Manual trigger via Actions tab

**Accessing Build Artifacts:**
1. Go to [Actions tab](https://github.com/kobenguyent/qa-utils/actions/workflows/build-electron.yml)
2. Click on a successful workflow run
3. Download artifacts:
   - `linux-appimage` - AppImage for Linux
   - `linux-deb` - Debian package
   - `linux-rpm` - Red Hat package
   - `windows-installer` - Windows installer
   - `macos-dmg` - macOS disk image
   - `macos-zip` - macOS zip archive

**Workflow Jobs:**
- `build-linux` - Builds AppImage, DEB, and RPM on Ubuntu
- `build-windows` - Builds NSIS installer and portable on Windows
- `build-macos` - Builds DMG and ZIP on macOS
- `build-summary` - Provides build status summary

**Manual Trigger:**
1. Go to Actions tab
2. Select "Build Electron App" workflow
3. Click "Run workflow"
4. Select branch and run

### Auto-Updates (Future Enhancement)

electron-builder supports auto-updates via:
- GitHub Releases (free)
- Custom update server
- AWS S3

Configuration in `package.json`:
```json
{
  "publish": {
    "provider": "github",
    "owner": "kobenguyent",
    "repo": "qa-utils"
  }
}
```

## Known Limitations

1. **Cross-Platform Building:**
   - Best to build macOS apps from macOS
   - Windows apps require Wine on Linux/macOS
   - Linux apps can be built from any platform

2. **Code Signing:**
   - Not configured by default
   - Required for macOS notarization
   - Optional for Windows SmartScreen

3. **App Size:**
   - ~200MB (includes Chromium)
   - Typical for Electron apps
   - Can't be reduced significantly

4. **CI/CD:**
   - GitHub Actions workflow available at `.github/workflows/build-electron.yml`
   - Automatically builds for all platforms (macOS, Windows, Linux)
   - Artifacts uploaded to GitHub Actions for download
   - Triggered on main branch pushes, release tags, or manual dispatch

## Troubleshooting

### Build Issues

**Error: "Cannot find module 'electron'"**
- Solution: `npm install`

**Error: "SUID sandbox not configured"**
- Normal in CI/headless environments
- App works fine when built

**Error: "Icon not found"**
- Add icons to `build/` directory
- See `build/README.md` for instructions

### Runtime Issues

**App won't start (macOS)**
- Run: `xattr -cr /Applications/QA\ Utils.app`
- Or right-click → Open first time

**App won't start (Windows)**
- Click "More info" → "Run anyway"
- Install Visual C++ redistributables

**App won't start (Linux)**
- Make AppImage executable: `chmod +x`
- Install dependencies: `libgtk-3-0 libnotify4 libnss3 libxss1`

## Future Enhancements

Potential improvements:

1. **Auto-Updates**: Implement using electron-updater
2. **Native Notifications**: Alert users of important events
3. **System Tray**: Minimize to tray instead of closing
4. **File System Access**: Enhanced file operations
5. **Custom Protocols**: Handle `qa-utils://` URLs
6. **Menu Bar Extra**: macOS menu bar app
7. **Native Dialogs**: File picker, alerts, etc.

## Testing

### Manual Testing

Since Electron requires a display, manual testing involves:

1. Run development mode: `npm run electron:dev`
2. Test all features work correctly
3. Verify no CORS issues with REST/WebSocket/gRPC clients
4. Test keyboard shortcuts
5. Test menu functionality

### Automated Testing (Future)

Can add Electron testing with:
- Spectron (deprecated)
- Playwright for Electron
- WebdriverIO for Electron

## Maintenance

### Updating Electron

```bash
npm update electron
npm update electron-builder
```

Test thoroughly after updates, especially:
- Window creation
- Security settings
- Build process
- Platform-specific features

### Version Management

Update version in `package.json`:
```json
{
  "version": "1.1.0"
}
```

This version is used in:
- Application title
- About dialog
- Build filenames
- Auto-update checks

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Best Practices](https://www.electronjs.org/docs/latest/tutorial/best-practices)

## Support

For issues or questions:
- Open GitHub issue: https://github.com/kobenguyent/qa-utils/issues
- Check troubleshooting section above
- Review Electron documentation
