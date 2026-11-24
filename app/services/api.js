import axios from 'axios'
import { toast } from '@/composables/useToast'

export const TOKEN_COOKIE = 'vuelveati_token'
export const USER_COOKIE = 'vuelveati_user'

/**
 * URL de la API en el navegador. Orden de prioridad:
 * 1. NUXT_PUBLIC_API_BASE (la fija plugins/api.js al arrancar).
 * 2. En desarrollo (puerto 5173): el backend Flask en el mismo host, puerto 5001.
 * 3. En el dominio de producción: api.carlaviladotpsicologia.com.
 * 4. Si no, la misma web bajo /api.
 */
export function resolveBrowserApiBase(configured) {
  if (configured) return configured.replace(/\/+$/, '')
  if (typeof window === 'undefined') return '/api'
  const { protocol, hostname, port } = window.location
  if (port === '5173') return `${protocol}//${hostname}:5001/api`
  if (hostname.includes('carlaviladotpsicologia.com')) {
    return 'https://api.carlaviladotpsicologia.com/api'
  }
  return '/api'
}

export function readBrowserCookie(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`))
  if (!match) return null
  try {
    return decodeURIComponent(match.split('=').slice(1).join('='))
  } catch {
    return null
  }
}

export function clearBrowserSession() {
  if (typeof document === 'undefined') return
  for (const name of [TOKEN_COOKIE, USER_COOKIE]) {
    document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=/; SameSite=Lax`
  }
  try {
    localStorage.removeItem(TOKEN_COOKIE)
    localStorage.removeItem(USER_COOKIE)
  } catch {
    // ignorar
  }
}

const api = axios.create({
  baseURL: resolveBrowserApiBase(''),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Petición: en el navegador adjunta el JWT. En el servidor nunca se envía token:
// las páginas que se pintan allí son públicas y la instancia se comparte entre visitas.
api.interceptors.request.use(
  (config) => {
    if (import.meta.client) {
      const token = readBrowserCookie(TOKEN_COOKIE)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

let storageWarningShown = false

// Respuesta: aviso de almacenamiento y cierre de sesión ante un 401
api.interceptors.response.use(
  (response) => {
    const warning = response?.data?.storage_warning
    if (import.meta.client && warning && !storageWarningShown) {
      storageWarningShown = true
      toast.warning(warning, { title: 'Archivo guardado sin R2', duration: 12000 })
    }
    return response
  },
  (error) => {
    if (import.meta.client && error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        clearBrowserSession()
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?redirect=${redirect}`
      }
    }
    return Promise.reject(error)
  }
)

export default api
