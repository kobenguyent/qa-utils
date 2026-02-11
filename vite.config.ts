import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import istanbul from 'vite-plugin-istanbul'
import { execSync } from 'child_process'
import type { Plugin } from 'vite'

// Timeout for git commands to prevent build from hanging
const GIT_COMMAND_TIMEOUT_MS = 5000

// Get commit hash safely - use environment variable if available, otherwise try git command
// This prevents the build from hanging if git command is slow or unavailable
const commitHash = (() => {
  try {
    return process.env.VITE_COMMIT_HASH || execSync('git rev-parse --short HEAD', { timeout: GIT_COMMAND_TIMEOUT_MS }).toString().trim()
  } catch (error) {
    console.warn('Unable to get git commit hash, using "unknown"')
    return 'unknown'
  }
})()

// Plugin to remove redundant external scripts for Electron builds
function removeExternalScriptsForElectron(): Plugin {
  return {
    name: 'remove-external-scripts-for-electron',
    transformIndexHtml(html) {
      // Only remove redundant scripts when building for Electron
      if (process.env.ELECTRON === 'true') {
        // Remove external React CDN script (React is bundled by Vite, so this is redundant)
        html = html.replace(
          /<script[^>]*src="https:\/\/cdn\.jsdelivr\.net\/npm\/react\/[^"]*"[^>]*><\/script>\s*/g,
          ''
        )
        
        // Remove preconnect to jsdelivr CDN (no longer needed without React CDN)
        html = html.replace(
          /<link[^>]*href="https:\/\/cdn\.jsdelivr\.net"[^>]*>\s*/g,
          ''
        )
        
        // Note: Umami analytics is kept to track Electron app usage
        // Note: OTPLib scripts from unpkg.com are kept as they're required for OTP functionality
      }
      return html
    }
  }
}

// Dynamically configure base based on environment
export default defineConfig(({ mode }) => {
  let base = '/'

  // For GitHub Pages deployment
  if (process.env.DEPLOY_ENV === 'github') {
    base = '/qa-utils/'
  }
  
  // For Electron builds, use relative paths
  if (process.env.ELECTRON === 'true') {
    base = './'
  }

  return {
    plugins: [
      react(),
      removeExternalScriptsForElectron(),
      istanbul({
        include: 'src/*',
        exclude: ['node_modules', 'test/'],
        extension: ['.js', '.ts', '.vue'],
        requireEnv: true,
      }),
    ],
    base,
    assetsInclude: ['**/*.png', '**/*.jpeg', '**/*.svg'],
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            bootstrap: ['react-bootstrap', 'bootstrap'],
            utils: ['axios', 'date-fns', 'humps', 'js-base64', 'uuid'],
          },
        },
      },
      sourcemap: mode === 'development',
      minify: 'esbuild',
      cssMinify: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    define: {
      __COMMIT_HASH__: JSON.stringify(commitHash),
    },
  }
})
