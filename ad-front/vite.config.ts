import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      workbox: {
        // /api/* 로의 풀 페이지 이동(OAuth 리다이렉트 등)이 서비스워커의
        // NavigationRoute에 가로채져 캐시된 index.html로 응답되는 것을 방지
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: '자산일기',
        short_name: '자산일기',
        description: '가구 단위 자산 스냅샷·거래·정기지출 관리 서비스',
        theme_color: '#3182f6',
        background_color: '#f2f4f6',
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
    },
  },
  server: {
    port: 3400,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4400,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
