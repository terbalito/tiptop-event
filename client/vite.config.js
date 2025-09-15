// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // ✅ Doit être 'dist' pour Render
    sourcemap: false
  },
  base: '/',  // ✅ Base URL pour Render
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})