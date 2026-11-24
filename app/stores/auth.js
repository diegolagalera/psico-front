import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { TOKEN_COOKIE, USER_COOKIE, clearBrowserSession } from '@/services/api'

/**
 * Decodifica el payload de un JWT (Base64URL) para leer expiración y claims (`role`, `email`).
 * Solo para la interfaz: la seguridad real la aplica siempre el backend.
 */
export function parseJwtPayload(token) {
  if (!token) return null
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const binary = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary')
    const jsonPayload = decodeURIComponent(
      binary
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

const SESSION_HOURS = 12

export const useAuthStore = defineStore('auth', () => {
  const cookieOptions = {
    path: '/',
    sameSite: 'lax',
    secure: import.meta.client ? window.location.protocol === 'https:' : false,
    maxAge: SESSION_HOURS * 3600,
  }
  // La sesión vive en cookies (no en localStorage) para que servidor y navegador
  // la lean igual. El JWT se sigue enviando como cabecera Authorization.
  const tokenCookie = useCookie(TOKEN_COOKIE, cookieOptions)
  const userCookie = useCookie(USER_COOKIE, cookieOptions)

  // Migración: sesiones antiguas guardadas en localStorage por la versión Vite
  if (import.meta.client && !tokenCookie.value) {
    try {
      const legacyToken = localStorage.getItem(TOKEN_COOKIE)
      if (legacyToken) {
        tokenCookie.value = legacyToken
        userCookie.value = JSON.parse(localStorage.getItem(USER_COOKIE) || 'null')
        localStorage.removeItem(TOKEN_COOKIE)
        localStorage.removeItem(USER_COOKIE)
      }
    } catch {
      // ignorar
    }
  }

  const token = computed(() => tokenCookie.value || null)
  const user = computed(() => userCookie.value || null)
  const loading = ref(false)
  const error = ref(null)

  // Hasta que la app se monta en el navegador, se pinta como "sin sesión" para que
  // el HTML del servidor y el primer render del navegador coincidan (hidratación).
  const hydrated = ref(false)

  const jwtClaims = computed(() => parseJwtPayload(token.value))

  const isTokenValid = computed(() => {
    if (!token.value || !jwtClaims.value) return false
    const nowInSeconds = Math.floor(Date.now() / 1000)
    if (jwtClaims.value.exp && jwtClaims.value.exp < nowInSeconds) {
      return false
    }
    return true
  })

  // Para las guardas de navegación (no dependen de la hidratación)
  const hasValidSession = computed(() => isTokenValid.value)
  const sessionRole = computed(() =>
    isTokenValid.value ? jwtClaims.value?.role || user.value?.role || null : null
  )

  // Para la interfaz
  const isAuthenticated = computed(() => hydrated.value && isTokenValid.value)
  const userRole = computed(() => (hydrated.value ? sessionRole.value : null))
  const isAdmin = computed(() => userRole.value === 'admin')

  function markHydrated() {
    hydrated.value = true
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post('/auth/login', { email, password })
      tokenCookie.value = data.access_token
      userCookie.value = data.user
      hydrated.value = true
      return data.user
    } catch (err) {
      error.value =
        err.response?.data?.error ||
        'No se pudo iniciar sesión. Verifica la conexión con el servidor.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return null
    try {
      const { data } = await api.get('/auth/me')
      userCookie.value = data.user
      return data.user
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    tokenCookie.value = null
    userCookie.value = null
    clearBrowserSession()
  }

  return {
    token,
    user,
    loading,
    error,
    jwtClaims,
    hasValidSession,
    sessionRole,
    isAuthenticated,
    userRole,
    isAdmin,
    markHydrated,
    login,
    fetchCurrentUser,
    logout,
  }
})
