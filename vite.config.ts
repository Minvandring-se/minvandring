import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Service workerns sparade svar (CacheStorage). Konfigurationen byggs utan webbläsarens typer. */
type Sparade = { match: (adress: string, val: { ignoreSearch: boolean }) => Promise<Response | undefined> }

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
        // Sidladdningar hämtas från nätet först, så att en ny version kommer vid nästa laddning även om den nya
        // service workern inte har installerats klart. Svaren sparas inte. Utan nät, eller när nätet inte svarar inom
        // 3 sekunder, svarar service workern med den förcachade index.html, även för sidor man inte har öppnat förut.
        // Då passar sidan alltid ihop med filerna i samma version.
        navigateFallback: null,
        // Annars svarar förcachningen på / med sin index.html innan regeln nedan får försöka med nätet.
        directoryIndex: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sidor',
              networkTimeoutSeconds: 3,
              plugins: [
                { cacheWillUpdate: async () => null },
                // Funktionen kopieras in i sw.js som text, så den får bara använda det som finns där (caches).
                { handlerDidError: async () => (await (globalThis as unknown as { caches: Sparade }).caches.match('/index.html', { ignoreSearch: true })) ?? Response.error() },
              ],
            },
          },
        ],
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
  build: {
    rolldownOptions: {
      output: {
        // React och Supabase i egna filer. De ändras sällan, så webbläsaren kan behålla dem när appen får en ny version,
        // och huvudfilen håller sig under 500 kB. Sidorna för inloggade hämtas för sig (React.lazy i src/App.tsx).
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/](@supabase|iceberg-js|tslib)[\\/]/ },
          ],
        },
      },
    },
  },
})
