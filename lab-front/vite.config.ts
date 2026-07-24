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
      // laofus는 실주문 전용 프로세스(8001)로 — holyseed-backend(8000)는 LAOFUS_LIVE=false 조회 전용이라
      // 여기로 보내면 대시보드에 스케줄/모드가 잘못 표시됨 (2026-07-24 확인된 문제)
      '/api/laofus': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // 5000은 macOS AirPlay(AirTunes)가 점유 — 구 laofus 대시보드 포트 4800 승계
    port: 4800,
    allowedHosts: ['lab.holyseed.p-e.kr'],
    proxy: {
      '/api/laofus': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
