<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import {
  Feather,
  Sparkles,
  BookOpen,
  FileText,
  PlayCircle,
  Headphones,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Search,
  Clock,
  Eye,
  Download,
  Mail,
  User,
  ShieldCheck,
  Instagram,
  X,
  ExternalLink,
  Share2,
  Cookie,
  Menu,
} from 'lucide-vue-next'
import { useCookieConsent } from '@/composables/useCookieConsent'

const LEAD_STORAGE_KEY = 'vuelve_a_ti_lead'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const unlocking = ref(false)
const resources = ref([])
const currentResource = ref(null)
const relatedResources = ref([])
const searchQuery = ref('')
const selectedCategory = ref('Todas')
const mobileMenuOpen = ref(false)

// Estado del Lead guardado en caché del navegador (localStorage)
const cachedLead = ref(null)

// Formulario de desbloqueo por Email Marketing
const leadForm = ref({
  name: '',
  email: '',
  consent_marketing: false,
})
const formError = ref('')

// Visor Modal de PDF integrado
const pdfPreviewModal = ref({
  open: false,
  title: '',
  previewUrl: '',
  downloadUrl: '',
})

function loadCachedLead() {
  try {
    const raw = localStorage.getItem(LEAD_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.email) {
        cachedLead.value = parsed
        leadForm.value.email = parsed.email
        leadForm.value.name = parsed.name || ''
        return parsed.email
      }
    }
  } catch {
    // ignore storage errors
  }
  return ''
}

function saveCachedLead(leadData) {
  const payload = {
    email: (leadData.email || '').trim().toLowerCase(),
    name: leadData.name || '',
    saved_at: new Date().toISOString(),
  }
  cachedLead.value = payload
  try {
    localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

function clearCachedLead() {
  cachedLead.value = null
  try {
    localStorage.removeItem(LEAD_STORAGE_KEY)
  } catch {
    // ignore
  }
  loadData()
}

const isDetailMode = computed(() => Boolean(route.params.slug))

const categories = computed(() => {
  const set = new Set(['Todas'])
  for (const r of resources.value) {
    if (r.category) set.add(r.category)
  }
  return Array.from(set)
})

const filteredResources = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return resources.value.filter((r) => {
    const matchesCat =
      selectedCategory.value === 'Todas' || r.category === selectedCategory.value
    if (!matchesCat) return false
    if (!q) return true
    return (
      (r.title || '').toLowerCase().includes(q) ||
      (r.subtitle || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.instagram_keyword || '').toLowerCase().includes(q)
    )
  })
})

async function fetchHubList() {
  loading.value = true
  try {
    const email = loadCachedLead()
    const { data } = await api.get('/resources', {
      params: email ? { lead_email: email } : {},
    })
    resources.value = data.resources || []
    if (data.lead) {
      saveCachedLead(data.lead)
    }
  } catch (err) {
    toast.error('No se pudieron cargar los recursos gratuitos.')
  } finally {
    loading.value = false
  }
}

async function fetchResourceDetail(slug) {
  loading.value = true
  formError.value = ''
  try {
    const email = loadCachedLead()
    const { data } = await api.get(`/resources/${encodeURIComponent(slug)}`, {
      params: email ? { lead_email: email } : {},
    })
    currentResource.value = data.resource
    relatedResources.value = data.related_resources || []
    if (data.lead) {
      saveCachedLead(data.lead)
    }
  } catch (err) {
    toast.error('El recurso solicitado no existe o no está disponible.')
    router.push('/recursos')
  } finally {
    loading.value = false
  }
}

async function loadData() {
  if (route.params.slug) {
    await fetchResourceDetail(route.params.slug)
  } else {
    currentResource.value = null
    await fetchHubList()
  }
}

async function handleUnlockResource() {
  formError.value = ''
  const email = (leadForm.value.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    formError.value = 'Por favor, introduce un correo electrónico válido.'
    return
  }
  if (!leadForm.value.consent_marketing) {
    formError.value =
      'Para acceder al recurso gratuito es necesario aceptar el consentimiento de email marketing.'
    return
  }

  unlocking.value = true
  try {
    const slug = route.params.slug || currentResource.value?.slug
    const { data } = await api.post(`/resources/${encodeURIComponent(slug)}/unlock`, {
      email,
      name: leadForm.value.name,
      consent_marketing: true,
      source_channel: route.query.utm_source || 'instagram_reel',
    })
    saveCachedLead(data.lead || { email, name: leadForm.value.name })
    currentResource.value = data.resource
    toast.success('¡Recurso desbloqueado! Tu acceso ha quedado guardado en este navegador.')
  } catch (err) {
    formError.value =
      err.response?.data?.error || 'No se pudo desbloquear el recurso. Inténtalo de nuevo.'
  } finally {
    unlocking.value = false
  }
}

function openPdfModal(res) {
  if (!res?.pdf_preview_url) return
  pdfPreviewModal.value = {
    open: true,
    title: res.pdf_title || res.title || 'Cuaderno Práctico PDF',
    previewUrl: res.pdf_preview_url,
    downloadUrl: res.pdf_download_url || res.pdf_preview_url,
  }
}

function closePdfModal() {
  pdfPreviewModal.value.open = false
}

function copyShareLink(slug) {
  const url = `${window.location.origin}/recursos/${slug || currentResource.value?.slug || ''}`
  navigator.clipboard.writeText(url)
  toast.success('Enlace del recurso copiado al portapapeles.')
}

// Formateador sencillo y seguro de Markdown / Bloques editoriales a HTML limpio
function renderFormattedArticle(rawText) {
  if (!rawText) return ''
  const escaped = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const blocks = escaped.split(/\n\s*\n/)
  return blocks
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('### ')) {
        return `<h3 class="font-editorial text-2xl font-semibold text-[#24332B] mt-7 mb-2">${formatInline(trimmed.slice(4))}</h3>`
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#24332B] mt-9 mb-3">${formatInline(trimmed.slice(3))}</h2>`
      }
      if (trimmed.startsWith('&gt; ')) {
        return `<blockquote class="my-6 pl-5 py-3 border-l-4 border-[#D9826C] bg-[#FAF8F5] rounded-r-2xl font-editorial italic text-xl text-[#24332B]/90">${formatInline(trimmed.slice(5))}</blockquote>`
      }
      // Lista de viñetas o numerada
      const lines = trimmed.split('\n')
      if (lines.every((l) => /^(\d+\.|-|\*)\s+/.test(l.trim()))) {
        const items = lines
          .map((l) => l.trim().replace(/^(\d+\.|-|\*)\s+/, ''))
          .map(
            (item) =>
              `<li class="flex items-start gap-2.5 text-[#2C3E35]/85 leading-relaxed"><span class="w-1.5 h-1.5 rounded-full bg-[#D9826C] mt-2.5 shrink-0"></span><span>${formatInline(item)}</span></li>`
          )
          .join('')
        return `<ul class="my-5 space-y-2.5 pl-1">${items}</ul>`
      }
      return `<p class="text-base sm:text-[17px] text-[#2C3E35]/85 leading-[1.8] my-4">${formatInline(trimmed.replace(/\n/g, '<br/>'))}</p>`
    })
    .join('')
}

function formatInline(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#24332B]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
}

const { isAllowed, acceptAll, openSettings } = useCookieConsent()
const userTemporarilyAllowedVideo = ref(false)

function isVideoAllowed() {
  return userTemporarilyAllowedVideo.value || isAllowed('marketing')
}

function allowVideoOnce() {
  userTemporarilyAllowedVideo.value = true
}

function getYoutubeEmbedUrl(url) {
  if (!url) return ''
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0` : ''
}

watch(
  () => route.params.slug,
  () => {
    loadData()
  }
)

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  }
)

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35] flex flex-col overflow-x-hidden">
    <!-- =====================================================
         1. HEADER / NAVBAR EDITORIAL RESPONSIVE
         ===================================================== -->
    <header
      class="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#2C3E35]/10"
    >
      <div
        class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-3"
      >
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div
            class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#4A6B5D] text-[#FAF8F5] flex items-center justify-center shadow-xs group-hover:bg-[#24332B] transition-colors shrink-0"
          >
            <Feather class="w-5 h-5" />
          </div>
          <div>
            <span
              class="font-editorial text-xl sm:text-2xl font-semibold tracking-tight text-[#24332B] block leading-none"
            >
              Vuelve a Ti
            </span>
            <span
              class="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#4A6B5D] font-bold block mt-1"
            >
              Recursos Gratuitos
            </span>
          </div>
        </RouterLink>

        <!-- Navegación Escritorio (md+) -->
        <div class="hidden md:flex items-center gap-2.5 sm:gap-3 shrink-0">
          <!-- Indicador de correo recordado en caché del navegador -->
          <div
            v-if="cachedLead?.email"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-600/20 text-emerald-900 text-xs font-medium whitespace-nowrap"
            title="Tu correo ya está verificado en este navegador. Tienes acceso directo a todos los recursos."
          >
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span class="truncate max-w-[180px]">{{ cachedLead.email }}</span>
            <button
              type="button"
              @click="clearCachedLead"
              class="text-[10px] text-emerald-800/60 hover:text-emerald-950 underline ml-1 cursor-pointer"
            >
              Cambiar
            </button>
          </div>

          <RouterLink
            v-if="isDetailMode"
            to="/recursos"
            class="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#2C3E35]/12 text-[#24332B] hover:bg-[#2C3E35]/5 transition-colors"
          >
            <ArrowLeft class="w-3.5 h-3.5 shrink-0" />
            <span>Todos los Recursos</span>
          </RouterLink>

          <RouterLink
            to="/"
            class="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#4A6B5D] hover:bg-[#4A6B5D]/10 transition-colors"
          >
            <span>Web Principal</span>
          </RouterLink>

          <RouterLink
            :to="authStore.isAuthenticated ? (authStore.isAdmin ? '/admin/resources' : '/dashboard') : '/login'"
            class="whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-[#24332B] text-white hover:bg-[#4A6B5D] transition-colors"
          >
            <Lock class="w-3.5 h-3.5 text-[#D9826C] shrink-0" />
            <span>{{ authStore.isAuthenticated ? (authStore.isAdmin ? 'Editar Recursos' : 'Mi Campus') : 'Acceso Alumnos' }}</span>
          </RouterLink>
        </div>

        <!-- Controles Móvil (< md) -->
        <div class="flex md:hidden items-center gap-2 shrink-0">
          <RouterLink
            v-if="isDetailMode"
            to="/recursos"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#2C3E35]/12 text-[#24332B]"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Foro</span>
          </RouterLink>

          <button
            type="button"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="p-2 rounded-xl text-[#2C3E35] hover:bg-[#4A6B5D]/10 transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Menú Desplegable Móvil -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden bg-[#FAF8F5] border-b border-[#2C3E35]/10 px-5 py-4 space-y-3 shadow-lg"
      >
        <!-- Si tiene email en caché -->
        <div
          v-if="cachedLead?.email"
          class="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-600/20 text-emerald-900 text-xs"
        >
          <div class="flex items-center gap-2 min-w-0">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span class="truncate font-medium">{{ cachedLead.email }}</span>
          </div>
          <button
            type="button"
            @click="clearCachedLead"
            class="text-xs text-emerald-800 underline ml-2 shrink-0 cursor-pointer"
          >
            Cambiar
          </button>
        </div>

        <RouterLink
          to="/"
          @click="mobileMenuOpen = false"
          class="block py-2 text-sm font-semibold text-[#2C3E35] hover:text-[#4A6B5D]"
        >
          Ir a la Web Principal
        </RouterLink>

        <RouterLink
          v-if="isDetailMode"
          to="/recursos"
          @click="mobileMenuOpen = false"
          class="block py-2 text-sm font-semibold text-[#2C3E35] hover:text-[#4A6B5D]"
        >
          Ver Todos los Recursos
        </RouterLink>

        <RouterLink
          :to="authStore.isAuthenticated ? (authStore.isAdmin ? '/admin/resources' : '/dashboard') : '/login'"
          @click="mobileMenuOpen = false"
          class="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs font-semibold bg-[#24332B] text-white hover:bg-[#4A6B5D] transition-colors mt-2"
        >
          <Lock class="w-3.5 h-3.5 text-[#D9826C] shrink-0" />
          <span>{{ authStore.isAuthenticated ? (authStore.isAdmin ? 'Panel de Administración' : 'Mi Campus') : 'Acceso Alumnos' }}</span>
        </RouterLink>
      </div>
    </header>

    <!-- =====================================================
         ESTADO CARGANDO
         ===================================================== -->
    <div v-if="loading" class="flex-1 flex items-center justify-center py-24">
      <div class="text-center space-y-3">
        <div
          class="w-10 h-10 rounded-full border-2 border-[#4A6B5D] border-t-transparent animate-spin mx-auto"
        ></div>
        <p class="text-sm text-[#2C3E35]/60 font-medium">
          Abriendo la biblioteca terapéutica...
        </p>
      </div>
    </div>

    <!-- =====================================================
         MODO 1: CATÁLOGO / FORO DE RECURSOS (/recursos)
         ===================================================== -->
    <main
      v-else-if="!isDetailMode"
      class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10"
    >
      <!-- Hero Editorial del Foro de Recursos -->
      <section
        class="relative rounded-3xl bg-linear-to-br from-[#24332B] via-[#2C3E35] to-[#3B5448] text-[#FAF8F5] p-7 sm:p-11 overflow-hidden shadow-xl shadow-[#24332B]/10"
      >
        <div
          class="relative z-10 max-w-3xl space-y-4"
        >
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#D9826C]">
            <Instagram class="w-3.5 h-3.5" />
            <span>Biblioteca Oficial de Recursos de Instagram & Web</span>
          </div>

          <h1 class="font-editorial text-3xl sm:text-5xl font-semibold leading-tight tracking-tight">
            Guías clínicas, cuadernos prácticos y herramientas para volver a ti.
          </h1>

          <p class="text-sm sm:text-base text-[#FAF8F5]/80 leading-relaxed max-w-2xl">
            Aquí encontrarás todos los recursos descargables, ejercicios escritos y protocolos terapéuticos que comparto en mis Reels.
            <strong class="text-white font-semibold">Desbloquea cualquier recurso gratis con tu correo electrónico</strong> y tendrás llave maestra automática para toda la biblioteca desde tu navegador.
          </p>

          <!-- Banner si ya está reconocido en caché -->
          <div
            v-if="cachedLead?.email"
            class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-xs sm:text-sm text-emerald-100"
          >
            <Unlock class="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              ¡Hola de nuevo! Tu correo <strong>{{ cachedLead.email }}</strong> ya está activo en este dispositivo. Puedes abrir y descargar todos los recursos sin volver a rellenar formularios.
            </span>
          </div>
        </div>
      </section>

      <!-- Barra de Búsqueda y Filtros por Categoría -->
      <section class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div class="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            @click="selectedCategory = cat"
            class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
            :class="
              selectedCategory === cat
                ? 'bg-[#24332B] text-white shadow-xs'
                : 'bg-white border border-[#2C3E35]/10 text-[#2C3E35]/75 hover:border-[#4A6B5D]'
            "
          >
            {{ cat }}
          </button>
        </div>

        <div class="relative w-full md:w-80">
          <Search class="w-4 h-4 text-[#2C3E35]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por tema o palabra de Reel (ej: CALMA)..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#2C3E35]/12 text-xs sm:text-sm focus:outline-none focus:border-[#4A6B5D]"
          />
        </div>
      </section>

      <!-- Grid de Recursos -->
      <section v-if="filteredResources.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RouterLink
          v-for="res in filteredResources"
          :key="res.id"
          :to="`/recursos/${res.slug}`"
          class="group bg-white rounded-3xl border border-[#2C3E35]/10 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <!-- Imagen de portada -->
            <div class="relative h-52 bg-[#E9E4DC] overflow-hidden">
              <img
                v-if="res.cover_resolved_url || res.cover_image_url"
                :src="res.cover_resolved_url || res.cover_image_url"
                :alt="res.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-linear-to-br from-[#4A6B5D]/20 to-[#D9826C]/20"
              >
                <BookOpen class="w-10 h-10 text-[#4A6B5D]/50" />
              </div>

              <!-- Badges superiores -->
              <div class="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-white/92 backdrop-blur-xs text-[#24332B] shadow-xs">
                  {{ res.category }}
                </span>
                <span
                  v-if="res.instagram_keyword"
                  class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#24332B]/85 text-[#FAF8F5] backdrop-blur-xs inline-flex items-center gap-1"
                >
                  <Instagram class="w-3 h-3 text-[#D9826C]" />
                  {{ res.instagram_keyword }}
                </span>
              </div>

              <!-- Indicador de formatos incluidos -->
              <div class="absolute bottom-3 left-3.5 flex items-center gap-1.5">
                <span
                  v-if="res.has_pdf"
                  class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#D9826C] text-white inline-flex items-center gap-1 shadow-xs"
                >
                  <FileText class="w-3 h-3" />
                  PDF + Guía
                </span>
                <span
                  v-if="res.has_video"
                  class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#24332B]/90 text-white inline-flex items-center gap-1"
                >
                  <PlayCircle class="w-3 h-3 text-[#D9826C]" />
                  Vídeo
                </span>
                <span
                  v-if="res.has_audio"
                  class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#4A6B5D] text-white inline-flex items-center gap-1"
                >
                  <Headphones class="w-3 h-3" />
                  Audio
                </span>
              </div>
            </div>

            <!-- Contenido de la tarjeta -->
            <div class="p-6 space-y-3">
              <div class="flex items-center gap-3 text-[11px] text-[#2C3E35]/55 font-medium">
                <span class="inline-flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5 text-[#4A6B5D]" />
                  {{ res.read_time_minutes }} min de lectura
                </span>
                <span>•</span>
                <span
                  class="inline-flex items-center gap-1 font-semibold"
                  :class="res.is_unlocked || cachedLead?.email ? 'text-emerald-700' : 'text-[#D9826C]'"
                >
                  <component :is="res.is_unlocked || cachedLead?.email ? Unlock : Lock" class="w-3.5 h-3.5" />
                  {{ res.is_unlocked || cachedLead?.email ? 'Desbloqueado' : 'Acceso gratuito con Email' }}
                </span>
              </div>

              <h2 class="font-editorial text-2xl font-semibold text-[#24332B] group-hover:text-[#4A6B5D] transition-colors leading-snug">
                {{ res.title }}
              </h2>

              <p class="text-xs sm:text-sm text-[#2C3E35]/70 line-clamp-3 leading-relaxed">
                {{ res.subtitle || res.teaser_text }}
              </p>
            </div>
          </div>

          <div class="px-6 pb-5 pt-3 border-t border-[#2C3E35]/6 flex items-center justify-between text-xs font-semibold text-[#4A6B5D]">
            <span>{{ res.is_unlocked || cachedLead?.email ? 'Leer y descargar recurso' : 'Ver adelanto y desbloquear' }}</span>
            <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#D9826C]" />
          </div>
        </RouterLink>
      </section>

      <div
        v-else
        class="bg-white rounded-3xl border border-[#2C3E35]/10 p-12 text-center space-y-3"
      >
        <BookOpen class="w-10 h-10 text-[#4A6B5D]/50 mx-auto" />
        <p class="font-editorial text-2xl text-[#24332B]">
          No hemos encontrado recursos con ese filtro
        </p>
        <p class="text-xs text-[#2C3E35]/60">
          Prueba a mostrar todas las categorías o buscar otra palabra clave.
        </p>
      </div>
    </main>

    <!-- =====================================================
         MODO 2: VISTA INDIVIDUAL DEL RECURSO (/recursos/:slug)
         ===================================================== -->
    <main
      v-else-if="currentResource"
      class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8"
    >
      <!-- Migas de pan y botón compartir -->
      <div class="flex items-center justify-between gap-2">
        <RouterLink
          to="/recursos"
          class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4A6B5D] hover:text-[#24332B] transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Volver al Foro de Recursos</span>
        </RouterLink>

        <button
          type="button"
          @click="copyShareLink(currentResource.slug)"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#2C3E35]/10 text-xs font-semibold text-[#2C3E35]/80 hover:border-[#4A6B5D] cursor-pointer transition-colors"
        >
          <Share2 class="w-3.5 h-3.5 text-[#D9826C]" />
          <span>Copiar enlace</span>
        </button>
      </div>

      <!-- Contenedor Principal del Recurso Editorial -->
      <article class="bg-white rounded-3xl border border-[#2C3E35]/10 shadow-sm overflow-hidden">
        <!-- Portada -->
        <div
          v-if="currentResource.cover_resolved_url || currentResource.cover_image_url"
          class="relative h-64 sm:h-92 w-full bg-[#E9E4DC] overflow-hidden"
        >
          <img
            :src="currentResource.cover_resolved_url || currentResource.cover_image_url"
            :alt="currentResource.title"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-linear-to-t from-[#24332B]/70 via-transparent to-transparent"></div>
          <div class="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-white text-[#24332B] shadow-xs">
                {{ currentResource.category }}
              </span>
              <span
                v-if="currentResource.instagram_keyword"
                class="px-3 py-1 rounded-full text-xs font-bold bg-[#24332B]/90 text-white inline-flex items-center gap-1.5"
              >
                <Instagram class="w-3.5 h-3.5 text-[#D9826C]" />
                <span>Reel: {{ currentResource.instagram_keyword }}</span>
              </span>
            </div>

            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-black/50 text-white backdrop-blur-xs inline-flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-[#D9826C]" />
              {{ currentResource.read_time_minutes }} min lectura
            </span>
          </div>
        </div>

        <div class="p-6 sm:p-10 lg:p-12 space-y-8">
          <!-- Cabecera del Artículo -->
          <div class="space-y-4 border-b border-[#2C3E35]/8 pb-7">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                :class="
                  currentResource.is_unlocked
                    ? 'bg-emerald-500/12 text-emerald-800 border border-emerald-500/25'
                    : 'bg-[#D9826C]/15 text-[#B55943] border border-[#D9826C]/30'
                "
              >
                <component :is="currentResource.is_unlocked ? Unlock : Lock" class="w-3.5 h-3.5" />
                {{
                  currentResource.is_unlocked
                    ? 'Recurso Completo Desbloqueado'
                    : 'Vista Previa · Desbloqueo Gratuito con tu Email'
                }}
              </span>

              <span
                v-if="currentResource.has_pdf"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] border border-[#2C3E35]/10 text-[#24332B]"
              >
                <FileText class="w-3.5 h-3.5 text-[#D9826C]" />
                Incluye PDF Descargable
              </span>
            </div>

            <h1 class="font-editorial text-3xl sm:text-5xl font-semibold text-[#24332B] leading-[1.15]">
              {{ currentResource.title }}
            </h1>

            <p
              v-if="currentResource.subtitle"
              class="text-base sm:text-lg text-[#2C3E35]/75 leading-relaxed"
            >
              {{ currentResource.subtitle }}
            </p>

            <!-- Firma autora + Acceso rápido al PDF si ya está desbloqueado -->
            <div class="pt-2 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center font-editorial font-bold text-lg">
                  CV
                </div>
                <div>
                  <p class="text-xs font-bold text-[#24332B]">Dra. Carla Viladot</p>
                  <p class="text-[11px] text-[#2C3E35]/60">Psicóloga · Programa Vuelve a Ti</p>
                </div>
              </div>

              <!-- Si ya está desbloqueado y tiene PDF, botón rápido arriba -->
              <div v-if="currentResource.is_unlocked && currentResource.pdf_preview_url" class="flex items-center gap-2">
                <button
                  type="button"
                  @click="openPdfModal(currentResource)"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4A6B5D]/10 hover:bg-[#4A6B5D]/20 text-[#24332B] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Eye class="w-3.5 h-3.5 text-[#4A6B5D]" />
                  <span>Ver PDF aquí</span>
                </button>
                <a
                  :href="currentResource.pdf_download_url || currentResource.pdf_preview_url"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Download class="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Puntos clave / Qué trabajarás en este recurso -->
          <div
            v-if="currentResource.key_takeaways && currentResource.key_takeaways.length > 0"
            class="rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 p-5 sm:p-6 space-y-3"
          >
            <p class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D] flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-[#D9826C]" />
              <span>Lo que vas a aprender y trabajar en este recurso</span>
            </p>
            <ul class="space-y-2">
              <li
                v-for="(item, idx) in currentResource.key_takeaways"
                :key="idx"
                class="flex items-start gap-2.5 text-sm text-[#24332B]/90"
              >
                <CheckCircle2 class="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <!-- TEASER EDITORIAL (Siempre visible para enganchar al lector) -->
          <div class="space-y-4">
            <div
              class="prose max-w-none"
              v-html="renderFormattedArticle(currentResource.teaser_text)"
            ></div>
          </div>

          <!-- =====================================================
               SI ESTÁ BLOQUEADO: MURO DE DESBLOQUEO (EMAIL GATE)
               ===================================================== -->
          <div v-if="!currentResource.is_unlocked" class="relative pt-2">
            <!-- Efecto de texto difuminado previo al formulario -->
            <div
              class="select-none pointer-events-none blur-[5px] opacity-45 space-y-3 mb-6"
              aria-hidden="true"
            >
              <h3 class="font-editorial text-2xl font-semibold text-[#24332B]">
                Paso a paso clínico y plantilla descargable de aplicación diaria
              </h3>
              <p class="text-base text-[#2C3E35]/80">
                En la segunda parte de este recurso profundizamos en los ejercicios escritos de regulación emocional, las preguntas de autoevaluación y el protocolo práctico en PDF para que puedas realizarlo a tu ritmo...
              </p>
              <p class="text-base text-[#2C3E35]/80">
                Además, encontrarás las pautas exactas para sostener los momentos de pico de ansiedad sin recaer en conductas impulsivas...
              </p>
            </div>

            <!-- Tarjeta de Desbloqueo por Email Marketing -->
            <div
              class="rounded-3xl bg-linear-to-br from-[#24332B] via-[#2C3E35] to-[#364D42] text-white p-6 sm:p-9 shadow-2xl border border-white/10 space-y-6"
            >
              <div class="space-y-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#D9826C] text-white">
                  <Sparkles class="w-3.5 h-3.5" />
                  Acceso Gratuito Inmediato
                </span>
                <h2 class="font-editorial text-2xl sm:text-3xl font-semibold leading-snug">
                  Introduce tu correo para desbloquear el recurso completo
                  <span v-if="currentResource.has_pdf"> y descargar el PDF</span>
                </h2>
                <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Al introducir tu email se abrirá al instante todo el artículo, los vídeos/audios incluidos y el cuaderno en PDF.
                  <strong class="text-white">Recordaremos tu acceso en este navegador</strong> para que no tengas que volver a poner tu correo en los próximos recursos que visites.
                </p>
              </div>

              <form @submit.prevent="handleUnlockResource" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">
                      Tu nombre (opcional)
                    </label>
                    <div class="relative">
                      <User class="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        v-model="leadForm.name"
                        type="text"
                        placeholder="Ej: Laura"
                        class="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-[#D9826C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-white/80 mb-1.5">
                      Tu correo electrónico *
                    </label>
                    <div class="relative">
                      <Mail class="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        v-model="leadForm.email"
                        type="email"
                        required
                        placeholder="tu@email.com"
                        class="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-[#D9826C]"
                      />
                    </div>
                  </div>
                </div>

                <!-- Casilla obligatoria de consentimiento explícito de Email Marketing -->
                <label
                  class="flex items-start gap-3 p-3.5 rounded-2xl bg-white/6 border border-white/12 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <input
                    v-model="leadForm.consent_marketing"
                    type="checkbox"
                    class="mt-1 w-4 h-4 rounded accent-[#D9826C] shrink-0 cursor-pointer"
                  />
                  <span class="text-xs text-white/85 leading-relaxed">
                    <strong>Consentimiento de Email Marketing:</strong> Soy consciente y acepto que mi correo electrónico se incorpore a la lista de suscripción de la <strong>Dra. Carla Viladot (Vuelve a Ti)</strong> para recibir este recurso gratuito, cartas terapéuticas, novedades sobre sus programas y comunicaciones de marketing. Podré darme de baja en cualquier momento con un solo clic.
                  </span>
                </label>

                <div
                  v-if="formError"
                  class="p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-xs text-rose-100 font-medium"
                >
                  {{ formError }}
                </div>

                <button
                  type="submit"
                  :disabled="unlocking"
                  class="w-full py-3.5 px-6 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] disabled:opacity-60 text-white font-semibold text-sm shadow-lg shadow-[#D9826C]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Unlock class="w-4 h-4" />
                  <span>
                    {{
                      unlocking
                        ? 'Desbloqueando tu recurso...'
                        : 'Aceptar y Ver Recurso Completo Ahora'
                    }}
                  </span>
                </button>
              </form>
            </div>
          </div>

          <!-- =====================================================
               SI ESTÁ DESBLOQUEADO: CONTENIDO COMPLETO + MULTIMEDIA + PDF
               ===================================================== -->
          <div v-else class="space-y-8 pt-2">
            <!-- 1. Vídeo embebido o subido (si existe) -->
            <div
              v-if="currentResource.video_stream_url || currentResource.video_external_url"
              class="rounded-3xl overflow-hidden border border-[#2C3E35]/12 bg-[#1A241F] shadow-md"
            >
              <div class="px-5 py-3 bg-[#24332B] text-white flex items-center justify-between text-xs font-semibold">
                <span class="inline-flex items-center gap-2">
                  <PlayCircle class="w-4 h-4 text-[#D9826C]" />
                  <span>Vídeo explicativo de Carla Viladot</span>
                </span>
              </div>

              <!-- Vídeo subido a S3 / Local -->
              <video
                v-if="currentResource.video_stream_url"
                :src="currentResource.video_stream_url"
                controls
                controlsList="nodownload"
                playsinline
                class="w-full max-h-[480px] bg-black"
              ></video>

              <!-- Vídeo de YouTube -->
              <div
                v-else-if="getYoutubeEmbedUrl(currentResource.video_external_url)"
                class="aspect-video w-full bg-[#1c2721] relative"
              >
                <!-- Iframe si está permitido -->
                <iframe
                  v-if="isVideoAllowed()"
                  :src="getYoutubeEmbedUrl(currentResource.video_external_url)"
                  class="w-full h-full"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>

                <!-- Placeholder de Privacidad (AEPD) si no ha aceptado cookies multimedia -->
                <div
                  v-else
                  class="w-full h-full p-6 sm:p-10 flex flex-col items-center justify-center text-center text-white space-y-4"
                >
                  <div
                    class="w-12 h-12 rounded-2xl bg-[#D9826C]/20 text-[#D9826C] flex items-center justify-center"
                  >
                    <Cookie class="w-6 h-6" />
                  </div>
                  <div class="max-w-md space-y-1.5">
                    <p class="font-editorial text-lg sm:text-xl font-semibold">
                      Vídeo externo de YouTube bloqueado por privacidad
                    </p>
                    <p class="text-xs text-white/70 leading-relaxed">
                      Para ver este contenido multimedia explicativo es necesario cargar el reproductor de YouTube, que puede instalar cookies de terceros.
                    </p>
                  </div>
                  <div class="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      @click="allowVideoOnce"
                      class="px-4 py-2 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Cargar vídeo esta vez
                    </button>
                    <button
                      type="button"
                      @click="openSettings"
                      class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                    >
                      Ajustar preferencias
                    </button>
                  </div>
                </div>
              </div>

              <!-- Otro enlace de vídeo externo -->
              <div v-else class="p-5 bg-[#24332B] text-white flex items-center justify-between">
                <span class="text-xs text-white/80">Vídeo complementario disponible:</span>
                <a
                  :href="currentResource.video_external_url"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D9826C] text-white text-xs font-semibold"
                >
                  <span>Abrir Vídeo</span>
                  <ExternalLink class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <!-- 2. Audio / Meditación Guiada (si existe) -->
            <div
              v-if="currentResource.audio_stream_url"
              class="rounded-2xl bg-[#FAF8F5] border border-[#4A6B5D]/25 p-5 space-y-3"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[#4A6B5D] text-white flex items-center justify-center shrink-0">
                  <Headphones class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D]">
                    Audio Terapéutico Incluido
                  </span>
                  <h3 class="text-sm font-bold text-[#24332B]">
                    {{ currentResource.audio_title || 'Escuchar audio guiado del recurso' }}
                  </h3>
                </div>
              </div>
              <audio
                :src="currentResource.audio_stream_url"
                controls
                controlsList="nodownload"
                class="w-full h-10"
              ></audio>
            </div>

            <!-- 3. Cuerpo Completo del Artículo -->
            <div
              v-if="currentResource.content_body"
              class="prose max-w-none border-t border-[#2C3E35]/8 pt-6"
              v-html="renderFormattedArticle(currentResource.content_body)"
            ></div>

            <!-- 4. Galería de fotos / esquemas visuales del artículo (si existen) -->
            <div
              v-if="currentResource.gallery_images && currentResource.gallery_images.length > 0"
              class="space-y-4 pt-2"
            >
              <h3 class="font-editorial text-2xl font-semibold text-[#24332B]">
                Infografías y Esquemas Visuales
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <figure
                  v-for="(img, gIdx) in currentResource.gallery_images"
                  :key="gIdx"
                  class="rounded-2xl overflow-hidden border border-[#2C3E35]/10 bg-[#FAF8F5]"
                >
                  <img
                    :src="img.resolved_url || img.url"
                    :alt="img.caption || currentResource.title"
                    class="w-full h-64 object-cover"
                  />
                  <figcaption
                    v-if="img.caption"
                    class="p-3 text-xs text-[#2C3E35]/75 text-center font-medium"
                  >
                    {{ img.caption }}
                  </figcaption>
                </figure>
              </div>
            </div>

            <!-- 5. Tarjeta Destacada del Cuaderno PDF Descargable + Lector Online -->
            <div
              v-if="currentResource.has_pdf && currentResource.pdf_preview_url"
              class="rounded-3xl bg-linear-to-r from-[#24332B] to-[#354B40] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-2xl bg-[#D9826C] text-white flex items-center justify-center shrink-0 shadow-md">
                  <FileText class="w-6 h-6" />
                </div>
                <div class="space-y-1">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-[#D9826C]">
                    Material Descargable Desbloqueado
                  </span>
                  <h3 class="font-editorial text-2xl font-semibold">
                    {{ currentResource.pdf_title || 'Cuaderno Práctico de Ejercicios (PDF)' }}
                  </h3>
                  <p class="text-xs text-white/75">
                    Puedes leer el documento directamente aquí en tu navegador o descargarlo en tu móvil/ordenador.
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  @click="openPdfModal(currentResource)"
                  class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/12 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                >
                  <Eye class="w-4 h-4 text-[#D9826C]" />
                  <span>Leer PDF aquí</span>
                </button>
                <a
                  :href="currentResource.pdf_download_url || currentResource.pdf_preview_url"
                  target="_blank"
                  rel="noopener"
                  class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <Download class="w-4 h-4" />
                  <span>Descargar PDF</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>

      <!-- Otros recursos recomendados -->
      <section v-if="relatedResources.length > 0" class="pt-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#24332B]">
            Otros recursos gratuitos de la biblioteca
          </h2>
          <RouterLink
            to="/recursos"
            class="text-xs font-semibold text-[#4A6B5D] hover:underline"
          >
            Ver todos →
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RouterLink
            v-for="rel in relatedResources"
            :key="rel.id"
            :to="`/recursos/${rel.slug}`"
            class="bg-white rounded-2xl border border-[#2C3E35]/10 p-4 hover:shadow-md transition-all flex flex-col justify-between gap-3"
          >
            <div class="space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D]">
                {{ rel.category }}
              </span>
              <h3 class="font-editorial text-lg font-semibold text-[#24332B] leading-snug">
                {{ rel.title }}
              </h3>
            </div>
            <span class="text-xs font-semibold text-[#D9826C] inline-flex items-center gap-1">
              <span>Abrir recurso</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </span>
          </RouterLink>
        </div>
      </section>
    </main>

    <!-- Footer de la biblioteca -->
    <footer class="mt-16 bg-[#24332B] text-[#FAF8F5] py-12 border-t border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-editorial text-lg font-semibold">Vuelve a Ti</span>
            <span class="text-white/40">·</span>
            <span class="text-white/70">Biblioteca de Recursos Terapéuticos</span>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-5 text-white/80">
            <RouterLink to="/" class="hover:text-white">Inicio</RouterLink>
            <RouterLink to="/recursos" class="hover:text-white">Recursos</RouterLink>
            <RouterLink to="/aviso-legal" class="hover:text-white">Aviso Legal</RouterLink>
            <RouterLink to="/privacidad" class="hover:text-white">Privacidad</RouterLink>
            <RouterLink to="/cookies" class="hover:text-white">Cookies</RouterLink>
          </div>
        </div>

        <div class="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50 gap-3">
          <p>© {{ new Date().getFullYear() }} Carla Viladot Fonseca · Todos los derechos reservados.</p>
          <p>Colegio Oficial de Psicología de Cataluña (Col. 29332)</p>
        </div>
      </div>
    </footer>

    <!-- =====================================================
         MODAL VISOR DE PDF INTEGRADO EN NAVEGADOR
         ===================================================== -->
    <Teleport to="body">
      <div
        v-if="pdfPreviewModal.open"
        class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
        @click.self="closePdfModal"
      >
        <div
          class="bg-white rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-[#2C3E35]/15"
        >
          <div class="px-5 py-3.5 bg-[#24332B] text-white flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <FileText class="w-4 h-4 text-[#D9826C] shrink-0" />
              <span class="text-xs sm:text-sm font-semibold truncate">
                {{ pdfPreviewModal.title }}
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <a
                :href="pdfPreviewModal.downloadUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-semibold transition-colors"
              >
                <Download class="w-3.5 h-3.5" />
                <span>Descargar</span>
              </a>
              <button
                type="button"
                @click="closePdfModal"
                class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <iframe
            :src="pdfPreviewModal.previewUrl"
            class="w-full flex-1 bg-[#FAF8F5]"
            title="Visor de PDF"
          ></iframe>
        </div>
      </div>
    </Teleport>
  </div>
</template>
