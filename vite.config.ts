import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import istanbul from 'vite-plugin-istanbul'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), istanbul({
    include: 'src/*',
    exclude: ['node_modules', 'test/'],
    extension: [ '.js', '.ts', '.vue' ],
    requireEnv: true,
  }),],
  base: '/qa-utils/',
  assetsInclude: ['**/*.png', '**/*.jpeg', '**/*.svg'],
  build: {
    target: 'esnext'
  },
})
