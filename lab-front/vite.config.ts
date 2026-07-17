import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@holyseed/laofus-core': path.resolve(__dirname, '../packages/laofus-core/src'),
    },
  },
  server: {
    port: 4000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // 5000은 macOS AirPlay(AirTunes)가 점유 — 구 laofus 대시보드 포트 4800 승계
    port: 4800,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
