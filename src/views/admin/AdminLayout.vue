<script setup>
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Feather,
  Mail,
  Users,
  Eye,
  LogOut,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Cloud,
  Calendar,
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const navSections = [
  {
    name: 'Cursos y Clases',
    subtitle: 'Módulos, vídeos y cronograma',
    to: '/admin/courses',
    icon: BookOpen,
  },
  {
    name: 'Alumnos y Progreso',
    subtitle: 'Expedientes y matrículas',
    to: '/admin/users',
    icon: Users,
  },
  {
    name: 'Configuración',
    subtitle: 'Calendar, R2 y Gmail',
    to: '/admin/settings',
    icon: Settings,
    subItems: [
      { name: 'Google Calendar & Citas', tab: 'calendar', icon: Calendar },
      { name: 'Almacenamiento S3 / R2', tab: 'storage', icon: Cloud },
      { name: 'Correo & Gmail API', tab: 'email', icon: Mail },
    ],
  },
]

function isSettingsActive() {
  return route.path.startsWith('/admin/settings') ||
    route.path.includes('calendar-settings') ||
    route.path.includes('storage-settings') ||
    route.path.includes('email-settings')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35] flex flex-col lg:flex-row antialiased selection:bg-[#D9826C]/20">
    <!-- Sidebar Lateral -->
    <aside
      class="w-full lg:w-76 bg-[#24332B] text-[#FAF8F5] flex flex-col justify-between shrink-0 border-b lg:border-b-0 lg:border-r border-white/8 shadow-lg shadow-black/5"
    >
      <div class="p-6 space-y-7">
        <!-- Logotipo / Marca -->
        <div class="flex items-center justify-between">
          <RouterLink to="/" class="flex items-center gap-3.5 group">
            <div
              class="w-11 h-11 rounded-2xl bg-[#D9826C] text-white flex items-center justify-center shadow-md shadow-[#D9826C]/25 transition-transform group-hover:scale-105"
            >
              <Feather class="w-5 h-5" />
            </div>
            <div>
              <span class="font-editorial text-2xl font-semibold block leading-none tracking-tight">
                Vuelve a Ti
              </span>
              <span
                class="text-[10px] uppercase tracking-[0.22em] text-[#D9826C] font-bold block mt-1.5"
              >
                Panel de Administración
              </span>
            </div>
          </RouterLink>
        </div>

        <!-- Enlaces de Navegación -->
        <nav class="space-y-2">
          <div class="flex items-center justify-between px-3 mb-2">
            <p class="text-[11px] font-bold uppercase tracking-wider text-[#FAF8F5]/40">
              Menú Principal
            </p>
          </div>

          <div v-for="item in navSections" :key="item.to" class="space-y-1">
            <RouterLink
              :to="item.to"
              class="flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-150 relative group"
              :class="
                (item.to === '/admin/settings' ? isSettingsActive() : route.path === item.to)
                  ? 'bg-[#4A6B5D] text-white shadow-sm font-semibold'
                  : 'text-[#FAF8F5]/75 hover:bg-white/6 hover:text-white'
              "
            >
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                :class="
                  (item.to === '/admin/settings' ? isSettingsActive() : route.path === item.to)
                    ? 'bg-white/15 text-[#D9826C]'
                    : 'bg-white/5 text-[#FAF8F5]/60 group-hover:text-white'
                "
              >
                <component :is="item.icon" class="w-4 h-4" />
              </div>

              <div class="flex-1 min-w-0">
                <span class="text-sm block leading-tight truncate">
                  {{ item.name }}
                </span>
                <span
                  class="text-[11px] block mt-0.5 truncate"
                  :class="
                    (item.to === '/admin/settings' ? isSettingsActive() : route.path === item.to)
                      ? 'text-white/80'
                      : 'text-[#FAF8F5]/50'
                  "
                >
                  {{ item.subtitle }}
                </span>
              </div>

              <ChevronRight
                v-if="item.subItems"
                class="w-4 h-4 text-white/40 transition-transform"
                :class="isSettingsActive() ? 'rotate-90 text-white/80' : ''"
              />
            </RouterLink>

            <!-- Submenú de Configuración -->
            <div
              v-if="item.subItems && isSettingsActive()"
              class="ml-5 pl-4 border-l border-white/10 space-y-1 pt-1 pb-1"
            >
              <RouterLink
                v-for="sub in item.subItems"
                :key="sub.tab"
                :to="{ path: '/admin/settings', query: { tab: sub.tab } }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors"
                :class="
                  route.query.tab === sub.tab || (!route.query.tab && sub.tab === 'calendar')
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-[#FAF8F5]/65 hover:text-white hover:bg-white/5'
                "
              >
                <component :is="sub.icon" class="w-3.5 h-3.5 text-[#D9826C]" />
                <span class="truncate">{{ sub.name }}</span>
              </RouterLink>
            </div>
          </div>
        </nav>
      </div>

      <!-- Pie del Sidebar -->
      <div class="p-6 border-t border-white/8 space-y-4">
        <!-- Tarjeta de sesión activa -->
        <div class="p-3.5 rounded-2xl bg-white/4 border border-white/8 backdrop-blur-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold text-[#D9826C]">
              <ShieldCheck class="w-4 h-4" />
              <span>Dra. Carla Viladot</span>
            </div>
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p class="text-[11px] text-[#FAF8F5]/60 truncate mt-1">
            {{ authStore.user?.email || 'admin@vuelveati.com' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <RouterLink
            to="/dashboard"
            class="flex-1 py-2.5 px-3 rounded-xl bg-white/8 hover:bg-white/12 text-xs font-medium text-[#FAF8F5] text-center inline-flex items-center justify-center gap-1.5 transition-colors border border-white/5"
            title="Ver vista real del alumno"
          >
            <Eye class="w-3.5 h-3.5 text-[#D9826C]" />
            <span>Campus Alumno</span>
          </RouterLink>
          <button
            type="button"
            @click="handleLogout"
            class="py-2.5 px-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-500/20"
            title="Cerrar sesión"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Área Principal de Contenido -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar Header -->
      <header class="bg-white/70 backdrop-blur-md border-b border-[#2C3E35]/8 px-6 sm:px-8 lg:px-10 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs text-[#2C3E35]/60">
          <span class="font-medium text-[#2C3E35]/80">Administración</span>
          <span>/</span>
          <span class="font-semibold text-[#4A6B5D] capitalize">
            {{ route.name?.replace('admin-', '').replace('-', ' ') || 'Panel' }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <RouterLink
            to="/dashboard"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#4A6B5D]/10 hover:bg-[#4A6B5D]/15 text-[#4A6B5D] transition-colors"
          >
            <Sparkles class="w-3.5 h-3.5 text-[#D9826C]" />
            <span>Previsualizar Campus</span>
          </RouterLink>

          <RouterLink
            to="/"
            target="_blank"
            class="text-xs font-medium text-[#2C3E35]/60 hover:text-[#2C3E35] inline-flex items-center gap-1 transition-colors"
          >
            <span>Ver Web</span>
            <ExternalLink class="w-3 h-3" />
          </RouterLink>
        </div>
      </header>

      <!-- Main Router Content -->
      <main class="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
