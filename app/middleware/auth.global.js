import { useAuthStore } from '@/stores/auth'

/**
 * Guarda de navegación global (equivale al antiguo router.beforeEach):
 * - meta.requiresAuth: exige sesión válida → si no, /login?redirect=...
 * - meta.requiresAdmin: exige rol admin → si no, /dashboard
 * - meta.guestOnly (/login): con sesión, lleva al panel que corresponda
 * La seguridad real está en el backend; esto solo evita pantallas vacías.
 */
export default defineNuxtRouteMiddleware((to) => {
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const requiresAdmin = to.matched.some((r) => r.meta.requiresAdmin)
  const guestOnly = to.matched.some((r) => r.meta.guestOnly)
  if (!requiresAuth && !requiresAdmin && !guestOnly) return

  const authStore = useAuthStore()

  if ((requiresAuth || requiresAdmin) && !authStore.hasValidSession) {
    authStore.logout()
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (requiresAdmin && authStore.sessionRole !== 'admin') {
    return navigateTo('/dashboard')
  }

  if (guestOnly && authStore.hasValidSession) {
    return navigateTo(authStore.sessionRole === 'admin' ? '/admin/courses' : '/dashboard')
  }
})
