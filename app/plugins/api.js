import api, { resolveBrowserApiBase } from '@/services/api'

/**
 * Fija la URL de la API según dónde se ejecute:
 * - En el servidor de Nuxt: NUXT_API_BASE_SERVER (por defecto http://localhost:5001/api).
 * - En el navegador: NUXT_PUBLIC_API_BASE o la deducida del dominio.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  if (import.meta.server) {
    api.defaults.baseURL = (config.apiBaseServer || config.public.apiBase || 'http://localhost:5001/api').replace(/\/+$/, '')
  } else {
    api.defaults.baseURL = resolveBrowserApiBase(config.public.apiBase)
  }
})
