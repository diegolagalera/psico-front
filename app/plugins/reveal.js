/**
 * v-reveal: hace aparecer un bloque con un fundido cuando entra en pantalla.
 * v-reveal="'draw'": dibuja con un trazo los <path> de un icono SVG.
 *
 * - En el servidor no hace nada (el HTML sale visible: Google lo lee todo).
 * - Lo que ya está en pantalla al cargar no se anima, para evitar parpadeos.
 * - Con «reducir movimiento» activado no anima nada.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const reduceMotion =
    import.meta.client && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  let observer = null
  function getObserver() {
    if (observer || !import.meta.client || typeof IntersectionObserver === 'undefined') return observer
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target
          const mode = el.__cvRevealMode
          el.classList.remove(mode === 'draw' ? 'cv-draw-pending' : 'cv-reveal-pending')
          el.classList.add(mode === 'draw' ? 'cv-draw-in' : 'cv-reveal-in')
          observer.unobserve(el)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )
    return observer
  }

  nuxtApp.vueApp.directive('reveal', {
    getSSRProps: () => ({}),
    mounted(el, binding) {
      const obs = getObserver()
      if (!obs || reduceMotion) return
      const mode = binding.value === 'draw' ? 'draw' : 'fade'
      if (mode === 'draw') {
        el.querySelectorAll('path').forEach((p) => p.setAttribute('pathLength', '1'))
      }
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.92) return // ya visible: sin animación
      el.__cvRevealMode = mode
      el.classList.add(mode === 'draw' ? 'cv-draw-pending' : 'cv-reveal-pending')
      obs.observe(el)
    },
    unmounted(el) {
      observer?.unobserve(el)
    },
  })
})
