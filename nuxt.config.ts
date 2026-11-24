import tailwindcss from '@tailwindcss/vite'

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' }

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },

  modules: ['@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['axios', 'lucide-vue-next', 'pdfjs-dist'],
    },
  },

  devServer: {
    host: '0.0.0.0',
    port: 5173,
  },

  runtimeConfig: {
    // URL de la API para las peticiones que hace el servidor de Nuxt al pintar
    // las páginas (NUXT_API_BASE_SERVER). En producción puede ser la red interna.
    apiBaseServer: 'http://localhost:5001/api',
    public: {
      // URL de la API para el navegador (NUXT_PUBLIC_API_BASE). Vacía = se
      // deduce del dominio (api.carlaviladotpsicologia.com o localhost:5001).
      apiBase: '',
      siteUrl: 'https://www.carlaviladotpsicologia.com',
    },
  },

  /**
   * Cómo se sirve cada parte de la web:
   * - Páginas fijas: HTML generado al compilar (lo más rápido y lo mejor para SEO).
   * - Recursos: se pintan en el servidor en cada visita (con caché de 5 min), así un
   *   recurso nuevo publicado desde el panel aparece al momento con su HTML completo.
   * - Área privada: solo en el navegador y fuera de los buscadores.
   */
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'SAMEORIGIN',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
    '/images/**': { headers: { 'Cache-Control': 'public, max-age=2592000' } },
    // Portada: se pinta en el servidor (con caché) porque muestra los últimos recursos
    '/': { swr: 600 },
    '/programa-vuelve-a-ti': { prerender: true },
    '/sobre-mi': { prerender: true },
    '/contacto': { prerender: true },
    '/terapia-online': { prerender: true },
    '/aviso-legal': { prerender: true },
    '/privacidad': { prerender: true },
    '/cookies': { prerender: true },
    '/recursos': { swr: 300 },
    '/recursos/**': { swr: 300 },

    '/terapia': { redirect: { to: '/terapia-online', statusCode: 301 } },
    '/programa': { redirect: { to: '/programa-vuelve-a-ti', statusCode: 301 } },

    '/login': { ssr: false, headers: NOINDEX },
    '/dashboard': { ssr: false, headers: NOINDEX },
    '/admin': { redirect: '/admin/courses' },
    '/admin/calendar-settings': { redirect: '/admin/settings?tab=calendar' },
    '/admin/storage-settings': { redirect: '/admin/settings?tab=storage' },
    '/admin/email-settings': { redirect: '/admin/settings?tab=email' },
    '/admin/**': { ssr: false, headers: NOINDEX },
  },

  nitro: {
    prerender: {
      // Solo las rutas fijas de routeRules; no seguir enlaces a /recursos/** (dinámicos)
      crawlLinks: false,
      routes: ['/programa-vuelve-a-ti', '/terapia-online', '/sobre-mi', '/contacto', '/aviso-legal', '/privacidad', '/cookies'],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es', class: 'scroll-smooth' },
      bodyAttrs: {
        class:
          'bg-[#FAF8F5] text-[#2C3E35] antialiased selection:bg-[#D9826C]/20 selection:text-[#2C3E35]',
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'author', content: 'Carla Viladot · Psicóloga Sanitaria (Col. 29332)' },
        { property: 'og:locale', content: 'es_ES' },
        { property: 'og:site_name', content: 'Carla Viladot Psicóloga · Programa Vuelve a Ti' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
})
