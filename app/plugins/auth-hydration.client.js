import { useAuthStore } from '@/stores/auth'

/**
 * La interfaz muestra el estado de sesión real solo cuando la página ya está
 * hidratada. Se espera a 'app:suspense:resolve' (no a 'app:mounted') porque las
 * páginas que cargan datos (p. ej. /recursos) terminan de hidratarse después del
 * montaje; si se marcara antes, el HTML del servidor quedaría con enlaces viejos.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
    useAuthStore().markHydrated()
  })
})
