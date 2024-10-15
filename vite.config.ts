import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import istanbul from 'vite-plugin-istanbul'
import { execSync } from 'child_process'

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()

// Dynamically configure base based on environment
export default defineConfig(({ mode }) => {
  let base = '/'

  if (process.env.DEPLOY_ENV === 'github') {
    base = '/qa-utils/'
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
    },
    define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  }
})
