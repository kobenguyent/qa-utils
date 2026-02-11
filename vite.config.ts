import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import istanbul from 'vite-plugin-istanbul'
import { execSync } from 'child_process'

// Get commit hash safely - use environment variable if available, otherwise try git command
// This prevents the build from hanging if git command is slow or unavailable
let commitHash = 'unknown'
try {
  commitHash = process.env.VITE_COMMIT_HASH || execSync('git rev-parse --short HEAD', { timeout: 5000 }).toString().trim()
} catch (error) {
  console.warn('Unable to get git commit hash, using "unknown"')
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
