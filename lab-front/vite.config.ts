import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      workbox: {
        // /api/* 로의 풀 페이지 이동이 서비스워커의 NavigationRoute에 가로채져
        // 캐시된 index.html로 응답되는 것을 방지 (ad-front와 동일한 이유)
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Lab',
        short_name: 'Lab',
        description: '무한매수법·TQQQ VR·근무일지·필름 재단 개인 다목적 대시보드',
        theme_color: '#0f172b',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@holyseed/laofus-core': path.resolve(__dirname, '../packages/laofus-core/src'),
      '@holyseed/vr-core': path.resolve(__dirname, '../packages/vr-core/src'),
      '@holyseed/shannon-core': path.resolve(__dirname, '../packages/shannon-core/src'),
    },
  },
  server: {
    port: 4000,
    host: true,
    proxy: {
      // laofus/VR 둘 다 실주문 전용 프로세스(8001)로 — holyseed-backend(8000)는 LIVE=false 조회 전용이라
      // 여기로 보내면 대시보드에 스케줄/모드가 잘못 표시됨 (2026-07-24 확인된 문제)
      '/api/laofus': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/lab/vr': {
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
      '/api/lab/vr': {
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
