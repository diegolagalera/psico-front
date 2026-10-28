import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

/**
 * Decodifica el payload de un JWT (Base64URL) para verificar expiración y claims (`role`, `email`)
 */
export function parseJwtPayload(token) {
  if (!token) return null
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('vuelveati_token') || null)
  const user = ref(
    JSON.parse(localStorage.getItem('vuelveati_user') || 'null')
  )
  const loading = ref(false)
  const error = ref(null)

  const jwtClaims = computed(() => parseJwtPayload(token.value))

  const isTokenValid = computed(() => {
    if (!token.value || !jwtClaims.value) return false
    const nowInSeconds = Math.floor(Date.now() / 1000)
    if (jwtClaims.value.exp && jwtClaims.value.exp < nowInSeconds) {
      return false
    }
    return true
  })

  const isAuthenticated = computed(() => isTokenValid.value)

  const userRole = computed(() => {
    if (!isTokenValid.value) return null
    return jwtClaims.value?.role || user.value?.role || null
  })

  const isAdmin = computed(() => userRole.value === 'admin')

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post('/auth/login', { email, password })
      token.value = data.access_token
      user.value = data.user
      localStorage.setItem('vuelveati_token', data.access_token)
      localStorage.setItem('vuelveati_user', JSON.stringify(data.user))
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
      user.value = data.user
      localStorage.setItem('vuelveati_user', JSON.stringify(data.user))
      return data.user
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('vuelveati_token')
    localStorage.removeItem('vuelveati_user')
  }

  return {
    token,
    user,
    loading,
    error,
    jwtClaims,
    isAuthenticated,
    userRole,
    isAdmin,
    login,
    fetchCurrentUser,
    logout,
  }
})
