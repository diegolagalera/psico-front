<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Lock, Menu, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

/**
 * Cabecera común de la web pública.
 * - ctaTo: a dónde lleva «Reservar sesión» (por defecto, /contacto; en el
 *   programa y en terapia, al formulario de esa misma página).
 */
const props = defineProps({
  ctaTo: { type: String, default: '/contacto' },
  ctaLabel: { type: String, default: 'Reservar sesión' },
})

const route = useRoute()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const links = [
  { label: 'Inicio', to: '/', match: (p) => p === '/' },
  { label: 'Programa Vuelve a Ti', to: '/programa-vuelve-a-ti', match: (p) => p.startsWith('/programa-vuelve-a-ti') },
  { label: 'Terapia', to: '/terapia-online', match: (p) => p.startsWith('/terapia-online') },
  { label: 'Sobre mí', to: '/sobre-mi', match: (p) => p.startsWith('/sobre-mi') },
  { label: 'Recursos', to: '/recursos', match: (p) => p.startsWith('/recursos') },
  { label: 'Contacto', to: '/contacto', match: (p) => p.startsWith('/contacto') },
]

const isActive = (link) => link.match(route.path)

const portalTo = computed(() =>
  authStore.isAuthenticated ? (authStore.isAdmin ? '/admin/courses' : '/dashboard') : '/login'
)
const portalLabel = computed(() => (authStore.isAuthenticated ? 'Mi portal' : 'Acceso alumnos'))

// Un ancla de la propia página (#reservar) va como enlace normal; el resto, por el router
const ctaIsAnchor = computed(() => props.ctaTo.startsWith('#'))

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE4DC]">
    <div class="max-w-[1200px] mx-auto px-5 sm:px-6 h-[76px] flex items-center justify-between gap-4">
      <!-- Marca -->
      <RouterLink to="/" aria-label="Carla Viladot, psicóloga online" class="flex items-center gap-3 shrink-0 text-[#2C3E35]">
        <span class="w-10 h-10 rounded-xl bg-[#4A6B5D] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" /><path d="M5 19l7-7" /></svg>
        </span>
        <span class="flex flex-col leading-[1.1]">
          <span class="font-editorial text-2xl font-semibold">Carla Viladot</span>
          <span class="text-xs font-medium text-[#4A6B5D] tracking-[0.02em]">Psicóloga online</span>
        </span>
      </RouterLink>

      <!-- Navegación escritorio -->
      <nav aria-label="Principal" class="hidden xl:flex items-center gap-[22px] text-sm">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="whitespace-nowrap text-[#2C3E35] transition-colors hover:text-[#4A6B5D]"
          :class="isActive(link) ? 'font-semibold border-b-2 border-[#C0674F] pb-0.5' : ''"
          :aria-current="isActive(link) ? 'page' : undefined"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <!-- Acciones -->
      <div class="hidden xl:flex items-center gap-2 shrink-0">
        <RouterLink
          :to="portalTo"
          class="flex items-center gap-1.5 text-[#4A6B5D] text-[13px] font-semibold px-3 py-2.5 rounded-xl hover:bg-[#4A6B5D]/10 transition-colors"
        >
          <Lock class="w-[15px] h-[15px]" aria-hidden="true" />{{ portalLabel }}
        </RouterLink>
        <a
          v-if="ctaIsAnchor"
          :href="ctaTo"
          class="bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold text-sm px-5 py-3 rounded-2xl transition-colors"
        >{{ ctaLabel }}</a>
        <RouterLink
          v-else
          :to="ctaTo"
          class="bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold text-sm px-5 py-3 rounded-2xl transition-colors"
        >{{ ctaLabel }}</RouterLink>
      </div>

      <!-- Botón menú móvil -->
      <button
        type="button"
        class="xl:hidden p-2.5 rounded-xl text-[#2C3E35] hover:bg-[#4A6B5D]/10"
        :aria-label="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        :aria-expanded="mobileMenuOpen"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <X v-if="mobileMenuOpen" class="w-6 h-6" />
        <Menu v-else class="w-6 h-6" />
      </button>
    </div>

    <!-- Menú móvil -->
    <div v-if="mobileMenuOpen" class="xl:hidden border-t border-[#EAE4DC] bg-[#FAF8F5] px-6 py-5">
      <nav aria-label="Principal móvil" class="flex flex-col">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="py-2.5 text-base"
          :class="isActive(link) ? 'font-semibold text-[#A9553F]' : 'text-[#2C3E35]'"
          :aria-current="isActive(link) ? 'page' : undefined"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <div class="pt-4 mt-3 border-t border-[#EAE4DC] flex flex-col gap-2.5">
        <RouterLink
          :to="portalTo"
          class="flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#4A6B5D]/30 text-sm font-semibold text-[#4A6B5D]"
        >
          <Lock class="w-4 h-4" aria-hidden="true" />{{ portalLabel }}
        </RouterLink>
        <a
          v-if="ctaIsAnchor"
          :href="ctaTo"
          class="text-center py-3 rounded-2xl bg-[#A9553F] text-white text-sm font-semibold"
          @click="mobileMenuOpen = false"
        >{{ ctaLabel }}</a>
        <RouterLink
          v-else
          :to="ctaTo"
          class="text-center py-3 rounded-2xl bg-[#A9553F] text-white text-sm font-semibold"
        >{{ ctaLabel }}</RouterLink>
      </div>
    </div>
  </header>
</template>
