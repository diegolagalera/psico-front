<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Cookie, ShieldCheck, X, Check, Sliders, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useCookieConsent } from '@/composables/useCookieConsent'

const {
  consent,
  hasDecided,
  isSettingsOpen,
  acceptAll,
  rejectAll,
  saveCustom,
  openSettings,
  closeSettings,
} = useCookieConsent()

const customAnalytics = ref(false)
const customMarketing = ref(false)

function initCustomValues() {
  if (consent.value) {
    customAnalytics.value = Boolean(consent.value.analytics)
    customMarketing.value = Boolean(consent.value.marketing)
  } else {
    customAnalytics.value = false
    customMarketing.value = false
  }
}

function handleOpenSettings() {
  initCustomValues()
  openSettings()
}

function handleSavePreferences() {
  saveCustom({
    analytics: customAnalytics.value,
    marketing: customMarketing.value,
  })
}

function onGlobalOpenRequest() {
  handleOpenSettings()
}

onMounted(() => {
  window.addEventListener('open-cookie-settings', onGlobalOpenRequest)
})

onUnmounted(() => {
  window.removeEventListener('open-cookie-settings', onGlobalOpenRequest)
})
</script>

<template>
  <!-- 1. BANNER FLOTANTE INICIAL (AEPD: Aceptar / Rechazar con igual prominencia) -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-8 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-8 opacity-0"
  >
    <div
      v-if="!hasDecided && !isSettingsOpen"
      class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 pointer-events-auto"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div
        class="bg-white rounded-3xl border border-[#2C3E35]/12 shadow-2xl p-6 sm:p-7 space-y-4 text-[#2C3E35]"
      >
        <div class="flex items-start gap-3.5">
          <div
            class="w-10 h-10 rounded-2xl bg-[#D9826C]/15 text-[#D9826C] flex items-center justify-center shrink-0 mt-0.5"
          >
            <Cookie class="w-5 h-5" />
          </div>
          <div class="space-y-1">
            <h3 id="cookie-banner-title" class="font-editorial text-xl font-semibold leading-tight">
              Tu privacidad y el uso de cookies
            </h3>
            <p id="cookie-banner-desc" class="text-xs sm:text-[13px] text-[#2C3E35]/80 leading-relaxed">
              Utilizamos cookies propias y de terceros para garantizar el correcto funcionamiento del campus virtual, analizar el uso de nuestra web y ofrecerte contenidos multimedia de apoyo clínico (como vídeos explicativos). Puedes aceptar todas, rechazarlas o configurar tus preferencias. Más información en nuestra
              <RouterLink
                to="/cookies"
                class="text-[#D9826C] font-semibold underline hover:text-[#c56e58]"
              >
                Política de Cookies
              </RouterLink>.
            </p>
          </div>
        </div>

        <!-- Botones de Acción (Rechazar y Aceptar con la misma jerarquía según AEPD) -->
        <div class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            @click="handleOpenSettings"
            class="px-4 py-2.5 rounded-2xl border border-[#2C3E35]/15 text-[#2C3E35] hover:bg-[#FAF8F5] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer order-3 sm:order-1"
          >
            <Sliders class="w-3.5 h-3.5 text-[#4A6B5D]" />
            <span>Configurar</span>
          </button>

          <button
            type="button"
            @click="rejectAll"
            class="px-5 py-2.5 rounded-2xl border border-[#2C3E35]/25 text-[#2C3E35] hover:bg-black/5 text-xs font-semibold inline-flex items-center justify-center transition-colors cursor-pointer order-2 sm:order-2"
          >
            <span>Solo necesarias</span>
          </button>

          <button
            type="button"
            @click="acceptAll"
            class="px-6 py-2.5 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold inline-flex items-center justify-center shadow-xs transition-colors cursor-pointer order-1 sm:order-3"
          >
            <span>Aceptar todas</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 2. MODAL DE CONFIGURACIÓN GRANULAR DE COOKIES -->
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isSettingsOpen"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      @click.self="closeSettings"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#2C3E35]/10 shadow-2xl p-6 sm:p-8 space-y-6 text-[#2C3E35] my-6"
      >
        <div class="flex items-start justify-between gap-4 border-b border-[#2C3E35]/10 pb-4">
          <div class="space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D] block">
              Centro de Preferencias
            </span>
            <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
              Configuración de Cookies
            </h3>
          </div>
          <button
            type="button"
            @click="closeSettings"
            class="p-2 rounded-xl text-[#2C3E35]/60 hover:text-[#2C3E35] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs sm:text-sm text-[#2C3E35]/80 leading-relaxed">
          En Carla Viladot Psicología respetamos tu derecho a la privacidad. Puedes elegir qué categorías de cookies permites en este sitio. Las cookies necesarias siempre permanecen activas porque son imprescindibles para que el sitio funcione.
        </p>

        <!-- Bloques de Categorías -->
        <div class="space-y-3.5">
          <!-- 1. Necesarias -->
          <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-1.5">
            <div class="flex items-center justify-between gap-3">
              <span class="font-semibold text-sm text-[#2C3E35] flex items-center gap-2">
                <span>Cookies Técnicas y Estrictamente Necesarias</span>
              </span>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#4A6B5D] bg-[#4A6B5D]/10 px-2.5 py-0.5 rounded-full shrink-0">
                Siempre activas
              </span>
            </div>
            <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
              Imprescindibles para iniciar sesión en tu campus privado, guardar tu progreso y recordar tus preferencias de privacidad. No almacenan información personal identificable para fines comerciales.
            </p>
          </div>

          <!-- 2. Analíticas -->
          <div class="p-4 rounded-2xl bg-white border border-[#2C3E35]/12 space-y-2">
            <div class="flex items-center justify-between gap-3">
              <label class="font-semibold text-sm text-[#2C3E35] cursor-pointer" for="chk-analytics">
                Cookies Analíticas y Estadísticas
              </label>
              <input
                id="chk-analytics"
                type="checkbox"
                v-model="customAnalytics"
                class="w-5 h-5 accent-[#D9826C] rounded cursor-pointer shrink-0"
              />
            </div>
            <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
              Nos ayudan a saber qué contenidos o lecturas resultan más útiles a las personas en proceso de duelo afectivo, midiendo visitas de forma anónima y agregada.
            </p>
          </div>

          <!-- 3. Marketing y Multimedia (YouTube) -->
          <div class="p-4 rounded-2xl bg-white border border-[#2C3E35]/12 space-y-2">
            <div class="flex items-center justify-between gap-3">
              <label class="font-semibold text-sm text-[#2C3E35] cursor-pointer" for="chk-marketing">
                Contenidos Multimedia y Marketing (YouTube / Vídeos)
              </label>
              <input
                id="chk-marketing"
                type="checkbox"
                v-model="customMarketing"
                class="w-5 h-5 accent-[#D9826C] rounded cursor-pointer shrink-0"
              />
            </div>
            <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
              Permiten reproducir vídeos explicativos incrustados desde plataformas externas (como YouTube) directamente en los recursos formativos.
            </p>
          </div>
        </div>

        <!-- Acciones del Modal -->
        <div class="pt-3 border-t border-[#2C3E35]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <RouterLink
            to="/cookies"
            @click="closeSettings"
            class="text-xs text-[#4A6B5D] hover:underline font-semibold text-center sm:text-left"
          >
            Ver Política de Cookies completa →
          </RouterLink>

          <div class="flex items-center justify-end gap-2.5">
            <button
              type="button"
              @click="rejectAll"
              class="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl border border-[#2C3E35]/20 text-[#2C3E35] hover:bg-black/5 text-xs font-semibold cursor-pointer"
            >
              Rechazar todas
            </button>
            <button
              type="button"
              @click="handleSavePreferences"
              class="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-[#4A6B5D] hover:bg-[#3d594d] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Guardar preferencias
            </button>
            <button
              type="button"
              @click="acceptAll"
              class="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
