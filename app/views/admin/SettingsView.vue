<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, Cloud, Mail, Settings, ShieldCheck, Sparkles } from 'lucide-vue-next'
import CalendarSettingsView from '@/views/admin/CalendarSettingsView.vue'
import StorageSettingsView from '@/views/admin/StorageSettingsView.vue'
import EmailSettingsView from '@/views/admin/EmailSettingsView.vue'

const route = useRoute()
const router = useRouter()

const availableTabs = [
  {
    id: 'calendar',
    name: 'Google Calendar & Citas',
    badge: 'Agenda 1:1',
    description: 'Sincronización con Google Meet y horarios disponibles',
    icon: Calendar,
  },
  {
    id: 'storage',
    name: 'Almacenamiento S3 / R2',
    badge: 'Vídeos Seguros',
    description: 'Cloudflare R2, streaming protegido HLS y recursos',
    icon: Cloud,
  },
  {
    id: 'email',
    name: 'Correo & Gmail API',
    badge: 'Notificaciones',
    description: 'OAuth 2.0 de Google, SMTP y bienvenidas a alumnos',
    icon: Mail,
  },
]

const currentTab = ref('calendar')

function setTab(tabId) {
  currentTab.value = tabId
  router.replace({
    query: {
      ...route.query,
      tab: tabId,
    },
  })
}

// Sincronizar con el parámetro de la URL al cargar o cambiar
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && availableTabs.some((t) => t.id === newTab)) {
      currentTab.value = newTab
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (route.query.tab && availableTabs.some((t) => t.id === route.query.tab)) {
    currentTab.value = route.query.tab
  }
})
</script>

<template>
  <div class="space-y-8 animate-fadeIn">
    <!-- Encabezado de la Sección de Configuración -->
    <div class="relative overflow-hidden bg-gradient-to-br from-white via-[#FAF8F5] to-[#F2ECE4] border border-[#2C3E35]/10 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A6B5D]/10 text-[#4A6B5D] text-xs font-semibold tracking-wide">
            <Settings class="w-3.5 h-3.5" />
            <span>Centro de Control e Integraciones</span>
          </div>
          <h1 class="font-editorial text-3xl sm:text-4xl text-[#2C3E35] font-semibold tracking-tight">
            Configuración del Ecosistema
          </h1>
          <p class="text-sm sm:text-base text-[#2C3E35]/70 max-w-2xl leading-relaxed">
            Centraliza los servicios fundamentales de tu academia terapéutica: sincronización de citas con Google Calendar & Meet, almacenamiento privado de vídeo en Cloudflare R2 y notificaciones por correo.
          </p>
        </div>

        <div class="hidden md:flex flex-col items-end text-right shrink-0">
          <div class="flex items-center gap-2 text-xs font-medium text-[#4A6B5D] bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-[#2C3E35]/10 shadow-xs">
            <ShieldCheck class="w-4 h-4 text-[#4A6B5D]" />
            <span>Infraestructura Segura</span>
          </div>
        </div>
      </div>

      <!-- Barra de Pestañas / Tabs Modernos -->
      <div class="mt-8 pt-6 border-t border-[#2C3E35]/10">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            type="button"
            @click="setTab(tab.id)"
            class="flex items-start gap-3.5 p-4 rounded-2xl text-left transition-all cursor-pointer border"
            :class="
              currentTab === tab.id
                ? 'bg-white border-[#4A6B5D] shadow-sm ring-2 ring-[#4A6B5D]/15'
                : 'bg-white/50 border-[#2C3E35]/10 hover:bg-white hover:border-[#2C3E35]/20 text-[#2C3E35]/70'
            "
          >
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              :class="
                currentTab === tab.id
                  ? 'bg-[#4A6B5D] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#2C3E35]/60 border border-[#2C3E35]/10'
              "
            >
              <component :is="tab.icon" class="w-5 h-5" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <span
                  class="text-sm font-semibold truncate block"
                  :class="currentTab === tab.id ? 'text-[#2C3E35]' : 'text-[#2C3E35]/80'"
                >
                  {{ tab.name }}
                </span>
                <span
                  class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                  :class="
                    currentTab === tab.id
                      ? 'bg-[#D9826C]/15 text-[#D9826C]'
                      : 'bg-[#2C3E35]/5 text-[#2C3E35]/50'
                  "
                >
                  {{ tab.badge }}
                </span>
              </div>
              <p class="text-xs text-[#2C3E35]/60 line-clamp-1">
                {{ tab.description }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Contenido Activo del Tab -->
    <div class="transition-opacity duration-300">
      <div v-show="currentTab === 'calendar'">
        <CalendarSettingsView />
      </div>

      <div v-show="currentTab === 'storage'">
        <StorageSettingsView />
      </div>

      <div v-show="currentTab === 'email'">
        <EmailSettingsView />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease-out;
}
</style>
