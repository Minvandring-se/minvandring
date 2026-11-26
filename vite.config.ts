import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // autoUpdate: den nya versionen syns nästa gång sidan laddas. Appen registrerar service workern själv i src/lib/uppdatering.ts, som söker
      // efter nya versioner men aldrig laddar om mitt i något. Därför injiceras ingen registrering här.
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'MinVandring',
        short_name: 'MinVandring',
        description: 'Planera vandringen tillsammans. Packning, mat och rutt på ett ställe.',
        lang: 'sv',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF8F3',
        theme_color: '#1F3D2E',
        // Ikonerna görs med design/logo/ikoner.cjs. Den maskerade har extra luft så att symbolen klarar runda och andra former.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Den nya service workern tar över direkt i stället för att vänta tills alla flikar är stängda. Utan dem
        // väntar den, eftersom pluginet bara sätter dem när det själv registrerar service workern.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
