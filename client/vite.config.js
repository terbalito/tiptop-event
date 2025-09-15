import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  // ✅ Ajoutez cette configuration pour la production
  build: {
    outDir: 'docs',
    sourcemap: false
  },
  // ✅ Important pour le routing SPA
  base: '/'
})