/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
  },
  server: {
    proxy: {
      // '/api'で始まるリクエストをバックエンドサーバー(ポート5000)に転送
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  },
})