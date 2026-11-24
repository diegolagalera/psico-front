<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Feather, Lock, Calendar, Sparkles, Menu, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

/**
 * Cabecera común de la web pública (portada, terapia…).
 * - ctaTo: a dónde lleva «Reservar Sesión» (en la portada, su formulario de
 *   valoración; en terapia, el formulario de reserva de esa página).
 */
const props = defineProps({
  ctaTo: { type: String, default: '/#contacto' },
  ctaLabel: { type: String, default: 'Reservar Sesión' },
})

const route = useRoute()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const links = [
  { key: 'inicio', label: 'Inicio', to: '/' },
  { key: 'el-programa', label: 'Programa', to: '/#el-programa' },
  { key: 'terapia', label: 'Terapia', to: '/terapia-online' },
  { key: 'sobre-mi', label: 'Sobre mí', to: '/#sobre-mi' },
  { key: 'contacto', label: 'Contacto', to: '/#contacto' },
]

// Secciones de la portada que sigue el menú al hacer scroll, en orden de aparición
const HOME_SECTIONS = ['el-programa', 'sobre-mi', 'contacto']
const HEADER_OFFSET = 120

// Sección visible de la portada ('inicio' arriba del todo)
const currentSection = ref('inicio')

function updateCurrentSection() {
  if (route.path !== '/' || typeof document === 'undefined') return
  let current = 'inicio'
  for (const id of HOME_SECTIONS) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top <= HEADER_OFFSET) current = id
  }
  // Al llegar al final de la página, la última sección cuenta como activa
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  const lastId = HOME_SECTIONS[HOME_SECTIONS.length - 1]
  const lastEl = document.getElementById(lastId)
  if (atBottom && lastEl && lastEl.getBoundingClientRect().top < window.innerHeight) current = lastId
  currentSection.value = current
}

// Cálculo directo y barato (3 secciones); limitado a una vez cada 100 ms
let lastRun = 0
let trailing = null
function onScroll() {
  const now = Date.now()
  clearTimeout(trailing)
  if (now - lastRun >= 100) {
    lastRun = now
    updateCurrentSection()
  }
  // Última pasada al terminar el scroll
  trailing = setTimeout(updateCurrentSection, 120)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  updateCurrentSection()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  clearTimeout(trailing)
})

// Clave del enlace activo: la página propia, o la sección visible en la portada
const activeKey = computed(() => {
  if (route.path.startsWith('/terapia-online')) return 'terapia'
  if (route.path.startsWith('/recursos')) return 'recursos'
  if (route.path === '/') return currentSection.value
  return null
})

function isActive(link) {
  return activeKey.value === link.key
}

const portalTo = computed(() =>
  authStore.isAuthenticated ? (authStore.isAdmin ? '/admin/courses' : '/dashboard') : '/login'
)

// Los anclas de la propia página (#reservar) van como enlace normal; el resto, por el router
const ctaIsAnchor = computed(() => props.ctaTo.startsWith('#'))

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
    // Tras navegar (p. ej. a /#contacto), recalcular cuando termine el scroll suave
    nextTick(() => {
      updateCurrentSection()
      setTimeout(updateCurrentSection, 700)
    })
  }
)
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#2C3E35]/10">
    <div class="w-full px-5 sm:px-8 lg:px-12 xl:px-16 h-20 flex items-center justify-between gap-4 xl:gap-8">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-3 group shrink-0 whitespace-nowrap">
        <div
          class="w-11 h-11 rounded-2xl bg-[#4A6B5D] text-[#FAF8F5] flex items-center justify-center shadow-sm group-hover:bg-[#2C3E35] transition-colors shrink-0"
        >
          <Feather class="w-5 h-5" />
        </div>
        <span class="font-editorial text-2xl font-semibold tracking-tight text-[#2C3E35] block leading-none">
          Vuelve a Ti
        </span>
      </RouterLink>

      <!-- Navegación escritorio -->
      <nav aria-label="Principal" class="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium">
        <RouterLink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="whitespace-nowrap transition-colors"
          :class="
            isActive(link)
              ? 'text-[#2C3E35] font-semibold border-b-2 border-[#D9826C] pb-0.5'
              : 'text-[#2C3E35]/80 hover:text-[#4A6B5D]'
          "
          :aria-current="isActive(link) ? 'page' : undefined"
        >
          {{ link.label }}
        </RouterLink>
        <RouterLink
          to="/recursos"
          class="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-colors"
          :class="
            activeKey === 'recursos'
              ? 'bg-[#D9826C] text-white'
              : 'bg-[#D9826C]/12 text-[#D9826C] hover:bg-[#D9826C]/20'
          "
          :aria-current="activeKey === 'recursos' ? 'page' : undefined"
        >
          <Sparkles class="w-3.5 h-3.5 shrink-0" />
          <span>Recursos Gratuitos</span>
        </RouterLink>
      </nav>

      <!-- Acciones derecha -->
      <div class="hidden lg:flex items-center gap-3 shrink-0">
        <RouterLink
          :to="portalTo"
          class="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-[#4A6B5D] hover:bg-[#4A6B5D]/10 transition-colors"
        >
          <Lock class="w-4 h-4 shrink-0" />
          <span>{{ authStore.isAuthenticated ? 'Mi Portal' : 'Acceso Alumnos' }}</span>
        </RouterLink>

        <a
          v-if="ctaIsAnchor"
          :href="ctaTo"
          class="whitespace-nowrap inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-[#D9826C] text-white shadow-sm hover:bg-[#c56e58] transition-all hover:shadow"
        >
          <Calendar class="w-4 h-4 shrink-0" />
          <span>{{ ctaLabel }}</span>
        </a>
        <RouterLink
          v-else
          :to="ctaTo"
          class="whitespace-nowrap inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-[#D9826C] text-white shadow-sm hover:bg-[#c56e58] transition-all hover:shadow"
        >
          <Calendar class="w-4 h-4 shrink-0" />
          <span>{{ ctaLabel }}</span>
        </RouterLink>
      </div>

      <!-- Botón menú móvil -->
      <button
        type="button"
        class="lg:hidden p-2.5 rounded-xl text-[#2C3E35] hover:bg-[#4A6B5D]/10"
        :aria-label="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        :aria-expanded="mobileMenuOpen"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <X v-if="mobileMenuOpen" class="w-6 h-6" />
        <Menu v-else class="w-6 h-6" />
      </button>
    </div>

    <!-- Menú desplegable móvil -->
    <div v-if="mobileMenuOpen" class="lg:hidden bg-[#FAF8F5] border-b border-[#2C3E35]/10 px-6 py-5 space-y-3">
      <RouterLink
        v-for="link in links"
        :key="link.label"
        :to="link.to"
        class="block py-2 text-base font-medium"
        :class="isActive(link) ? 'text-[#D9826C] font-semibold' : 'text-[#2C3E35]'"
        @click="mobileMenuOpen = false"
      >
        {{ link.label }}
      </RouterLink>
      <RouterLink
        to="/recursos"
        class="flex items-center gap-2 py-2 text-base font-semibold text-[#D9826C]"
        @click="mobileMenuOpen = false"
      >
        <Sparkles class="w-4 h-4" />
        <span>Recursos Gratuitos</span>
      </RouterLink>
      <div class="pt-3 border-t border-[#2C3E35]/10 flex flex-col gap-2.5">
        <RouterLink
          :to="portalTo"
          class="w-full py-2.5 px-4 rounded-2xl border border-[#4A6B5D]/30 text-center text-sm font-semibold text-[#4A6B5D]"
          @click="mobileMenuOpen = false"
        >
          {{ authStore.isAuthenticated ? 'Mi Portal' : 'Acceso Alumnos' }}
        </RouterLink>
        <a
          v-if="ctaIsAnchor"
          :href="ctaTo"
          class="w-full py-3 px-4 rounded-2xl bg-[#D9826C] text-white text-center text-sm font-semibold"
          @click="mobileMenuOpen = false"
        >
          {{ ctaLabel }}
        </a>
        <RouterLink
          v-else
          :to="ctaTo"
          class="w-full py-3 px-4 rounded-2xl bg-[#D9826C] text-white text-center text-sm font-semibold"
          @click="mobileMenuOpen = false"
        >
          {{ ctaLabel }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>
