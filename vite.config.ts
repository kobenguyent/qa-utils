import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/qa-utils/',
  assetsInclude: ['**/*.png', '**/*.jpeg', '**/*.svg'],
  build: {
    target: 'esnext'
  },
})
