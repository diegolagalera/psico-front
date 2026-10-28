<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import {
  Feather,
  LogOut,
  Lock,
  Unlock,
  Sparkles,
  PlayCircle,
  BookOpen,
  HeartHandshake,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Video,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
  Layers,
  GraduationCap,
  Sparkle,
  CalendarCheck,
  MessageSquare,
  HelpCircle,
  X,
  Eye,
  Headphones,
  Volume2,
  Maximize2,
  Minimize2,
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const coursesRoadmaps = ref([])
const selectedCourseIdx = ref(0)
const activeLesson = ref(null)
const mobileSidebarOpen = ref(false)

// Estado del reproductor de vídeo protegido
const videoPlayerRef = ref(null)
const videoStreamUrl = ref('')
const loadingVideo = ref(false)
const videoError = ref('')
const watermarkInfo = ref({ email: '', name: '' })
let lastSentSecond = -1

// Estado de previsualización de recursos (PDFs, Audios, Imágenes)
const inlineAudioUrls = ref({})
const loadingPreviewId = ref(null)
const previewModal = ref({
  open: false,
  loading: false,
  fullscreen: false,
  resource: null,
  previewUrl: '',
  downloadUrl: '',
  mimeType: '',
  filename: '',
  error: '',
})

// Estado de reservas 1:1 con Carla Viladot
const bookingData = ref(null)
const loadingSlots = ref(false)
const slotsError = ref('')
const selectedDayIdx = ref(0)
const selectedSlot = ref(null)
const bookingSubmitting = ref(false)
const bookingNotes = ref('')
const currentWeekOffset = ref(1)

const currentRoadmap = computed(
  () => coursesRoadmaps.value[selectedCourseIdx.value] || null
)

function formatBytes(bytes) {
  const b = Number(bytes || 0)
  if (b <= 0) return ''
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateLongES(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function resourceTypeLabel(type) {
  const map = {
    pdf: 'Cuaderno de Trabajo & Ejercicios (PDF)',
    presentation: 'Diapositivas de la Sesión',
    word: 'Plantilla de Autorreflexión',
    audio: 'Audio de Meditación / Relajación Guiada',
    other: 'Recurso Terapéutico',
  }
  return map[type] || 'Material Descargable'
}

function isAudioResource(res) {
  if (!res) return false
  const mime = (res.mime_type || '').toLowerCase()
  const name = (res.original_filename || res.title || '').toLowerCase()
  return (
    res.resource_type === 'audio' ||
    mime.startsWith('audio/') ||
    /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(name)
  )
}

function isPdfResource(res) {
  if (!res) return false
  const mime = (res.mime_type || '').toLowerCase()
  const name = (res.original_filename || res.title || '').toLowerCase()
  return (
    res.resource_type === 'pdf' ||
    mime.includes('pdf') ||
    /\.pdf$/i.test(name)
  )
}

function isImageResource(res) {
  if (!res) return false
  const mime = (res.mime_type || '').toLowerCase()
  const name = (res.original_filename || res.title || '').toLowerCase()
  return (
    mime.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(name)
  )
}

async function fetchMyCourses(preserveActiveLessonId = null) {
  loading.value = true
  try {
    const { data } = await api.get('/campus/my-courses')
    coursesRoadmaps.value = data.courses || []

    const rm = currentRoadmap.value
    if (rm && rm.modules) {
      let found = null
      if (preserveActiveLessonId) {
        for (const m of rm.modules) {
          for (const l of m.lessons) {
            if (l.id === preserveActiveLessonId && l.is_unlocked) {
              found = l
              break
            }
          }
        }
      }
      if (!found) {
        for (const m of rm.modules) {
          for (const l of m.lessons) {
            if (l.is_unlocked && !l.progress?.is_completed) {
              found = l
              break
            }
          }
          if (found) break
        }
      }
      if (!found) {
        for (const m of rm.modules) {
          for (const l of m.lessons) {
            if (l.is_unlocked) {
              found = l
              break
            }
          }
          if (found) break
        }
      }
      if (found) {
        await selectLesson(found, preserveActiveLessonId === found.id)
      }
    }
  } catch (err) {
    console.error('Error cargando campus:', err)
  } finally {
    loading.value = false
  }
}

async function selectLesson(lesson, skipStreamReload = false) {
  if (!lesson.is_unlocked) return
  activeLesson.value = lesson
  mobileSidebarOpen.value = false

  if (lesson.booking_enabled) {
    fetchLessonSlots(lesson.id)
  } else {
    bookingData.value = null
  }

  if (skipStreamReload && videoStreamUrl.value) return

  videoStreamUrl.value = ''
  videoError.value = ''
  lastSentSecond = -1

  if (!lesson.has_video) {
    try {
      await api.get(`/campus/lessons/${lesson.id}/video-stream`)
    } catch {
      // ignorar
    }
    return
  }

  loadingVideo.value = true
  try {
    const { data } = await api.get(`/campus/lessons/${lesson.id}/video-stream`)
    if (data.has_video && data.stream_url) {
      videoStreamUrl.value = data.stream_url
      watermarkInfo.value = data.watermark || {
        email: authStore.user?.email || '',
        name: authStore.user?.name || '',
      }
    }
  } catch (err) {
    videoError.value =
      err.response?.data?.error ||
      'No se pudo cargar el vídeo en este momento. Por favor, reintenta.'
  } finally {
    loadingVideo.value = false
  }
}

function handleVideoLoadedMetadata() {
  const videoEl = videoPlayerRef.value
  if (!videoEl || !activeLesson.value) return
  const savedSec = Number(activeLesson.value.progress?.watched_seconds || 0)
  if (savedSec > 2 && savedSec < (videoEl.duration || 999999) - 3) {
    videoEl.currentTime = savedSec
  }
}

async function reportVideoProgress(forceSend = false, markCompleted = false) {
  const videoEl = videoPlayerRef.value
  const lesson = activeLesson.value
  if (!lesson) return

  const currentSec = videoEl ? Number(videoEl.currentTime || 0) : 0
  const durationSec = videoEl ? Number(videoEl.duration || 0) : 0

  if (!forceSend && Math.abs(currentSec - lastSentSecond) < 5) {
    return
  }
  lastSentSecond = currentSec

  try {
    const payload = {
      watched_seconds: currentSec,
      video_duration_seconds: durationSec > 0 ? durationSec : undefined,
    }
    if (markCompleted) {
      payload.is_completed = true
    }
    const { data } = await api.post(
      `/campus/lessons/${lesson.id}/progress`,
      payload
    )
    if (data.progress && activeLesson.value?.id === lesson.id) {
      activeLesson.value.progress = data.progress
      await refreshRoadmapSilently()
    }
  } catch {
    // ignorar
  }
}

async function handleToggleCompleteLesson() {
  if (!activeLesson.value) return
  const newState = !activeLesson.value.progress?.is_completed
  try {
    const { data } = await api.post(
      `/campus/lessons/${activeLesson.value.id}/progress`,
      {
        is_completed: newState,
        watched_seconds: activeLesson.value.progress?.watched_seconds || 0,
      }
    )
    if (data.progress) {
      activeLesson.value.progress = data.progress
      await refreshRoadmapSilently()
    }
    if (newState) {
      toast.success('¡Sesión completada! Tu avance se ha guardado.', {
        title: 'Paso completado',
      })
    } else {
      toast.info('La sesión vuelve a figurar como pendiente.', {
        title: 'Progreso actualizado',
      })
    }
  } catch (err) {
    toast.error(
      err.response?.data?.error ||
        'No se pudo actualizar el estado de la clase.'
    )
  }
}

async function handlePreviewResource(res, options = { inlineAudio: false }) {
  if (!res) return

  // Si es audio y el alumno pulsa "Escuchar aquí", abrimos reproductor inline en la propia tarjeta
  if (options.inlineAudio && isAudioResource(res)) {
    if (inlineAudioUrls.value[res.id]) {
      delete inlineAudioUrls.value[res.id]
      inlineAudioUrls.value = { ...inlineAudioUrls.value }
      return
    }
    loadingPreviewId.value = res.id
    try {
      const { data } = await api.post(`/campus/resources/${res.id}/preview`)
      if (data.preview_url) {
        inlineAudioUrls.value = {
          ...inlineAudioUrls.value,
          [res.id]: data.preview_url,
        }
      }
      res.downloaded = true
      res.download_count = data.download_count || (res.download_count || 0) + 1
      if (data.progress && activeLesson.value) {
        activeLesson.value.progress = data.progress
      }
      await refreshRoadmapSilently()
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'No se pudo cargar el audio.',
        { title: 'Error de reproducción' }
      )
    } finally {
      loadingPreviewId.value = null
    }
    return
  }

  // Abrir en el Modal Visor Integrado (PDF, Audio, Imagen, etc.)
  previewModal.value = {
    open: true,
    loading: true,
    fullscreen: previewModal.value.fullscreen || false,
    resource: res,
    previewUrl: '',
    downloadUrl: '',
    mimeType: res.mime_type || '',
    filename: res.original_filename || res.title || 'recurso',
    error: '',
  }

  try {
    const { data } = await api.post(`/campus/resources/${res.id}/preview`)
    previewModal.value.previewUrl = data.preview_url || data.download_url || ''
    previewModal.value.downloadUrl = data.download_url || ''
    previewModal.value.mimeType = data.mime_type || res.mime_type || ''
    previewModal.value.filename = data.filename || res.title || 'recurso'

    res.downloaded = true
    res.download_count = data.download_count || (res.download_count || 0) + 1
    if (data.progress && activeLesson.value) {
      activeLesson.value.progress = data.progress
    }
    await refreshRoadmapSilently()
  } catch (err) {
    previewModal.value.error =
      err.response?.data?.error ||
      'No se pudo cargar la vista previa de este recurso.'
  } finally {
    previewModal.value.loading = false
  }
}

function closePreviewModal() {
  previewModal.value.open = false
  previewModal.value.fullscreen = false
  previewModal.value.previewUrl = ''
}

async function handleDownloadResource(res) {
  try {
    const { data } = await api.post(`/campus/resources/${res.id}/download`)
    if (data.download_url) {
      const link = document.createElement('a')
      link.href = data.download_url
      link.setAttribute('download', data.filename || res.title || 'cuaderno.pdf')
      link.setAttribute('target', '_blank')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    res.downloaded = true
    res.download_count = (res.download_count || 0) + 1
    if (data.progress && activeLesson.value) {
      activeLesson.value.progress = data.progress
    }
    toast.success(res.title || 'Archivo descargado.', {
      title: 'Descarga iniciada',
      duration: 3000,
    })
    await refreshRoadmapSilently()
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'No se pudo iniciar la descarga.',
      { title: 'Error de descarga' }
    )
  }
}

async function refreshRoadmapSilently() {
  try {
    const { data } = await api.get('/campus/my-courses')
    if (data.courses) {
      coursesRoadmaps.value = data.courses
      const rm = currentRoadmap.value
      if (rm && activeLesson.value) {
        for (const m of rm.modules) {
          for (const l of m.lessons) {
            if (l.id === activeLesson.value.id) {
              activeLesson.value = l
              break
            }
          }
        }
      }
    }
  } catch {
    // ignorar
  }
}

function formatBookingSlotTime(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoStr
  }
}

async function fetchLessonSlots(lessonId, offset = 1) {
  currentWeekOffset.value = offset
  loadingSlots.value = true
  slotsError.value = ''
  selectedSlot.value = null
  selectedDayIdx.value = 0
  bookingNotes.value = ''
  try {
    const { data } = await api.get(
      `/campus/lessons/${lessonId}/available-slots?week_offset=${offset}`
    )
    const days = data.days || data.slots?.days || []
    const range = data.range || data.slots?.range || {}
    const activeBk = data.booking || data.active_booking || null

    bookingData.value = {
      ...data,
      days,
      range,
    }

    if (activeBk && activeLesson.value) {
      activeLesson.value.booking = activeBk
    }
    if (days && days.length > 0) {
      const firstWithSlots = days.findIndex(
        (d) =>
          (d.available_count && d.available_count > 0) ||
          (d.slots && d.slots.some((s) => s.available))
      )
      if (firstWithSlots !== -1) {
        selectedDayIdx.value = firstWithSlots
      }
    }
  } catch (err) {
    slotsError.value =
      err.response?.data?.error ||
      'No se pudo cargar la agenda en este momento.'
  } finally {
    loadingSlots.value = false
  }
}

async function handleConfirmBooking() {
  if (!activeLesson.value || !selectedSlot.value) return
  bookingSubmitting.value = true
  try {
    const startIso = selectedSlot.value.start_iso || selectedSlot.value.start_at
    const endIso = selectedSlot.value.end_iso || selectedSlot.value.end_at
    const { data } = await api.post(
      `/campus/lessons/${activeLesson.value.id}/book-session`,
      {
        start_at: startIso,
        end_at: endIso,
        notes: bookingNotes.value || undefined,
      }
    )
    toast.success(data.message || 'Cita agendada con éxito.', {
      title: '¡Sesión Reservada!',
    })
    activeLesson.value.booking = data.booking || data.active_booking
    selectedSlot.value = null
    await refreshRoadmapSilently()
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'No se pudo reservar el horario.',
      { title: 'Error de reserva' }
    )
  } finally {
    bookingSubmitting.value = false
  }
}

async function handleCancelStudentBooking(bookingId) {
  if (
    !window.confirm(
      '¿Deseas cancelar esta sesión con Carla? El hueco quedará libre y podrás reprogramarla.'
    )
  ) {
    return
  }
  try {
    const { data } = await api.delete(`/campus/bookings/${bookingId}`)
    toast.info(data.message || 'Sesión cancelada.', {
      title: 'Cita cancelada',
    })
    if (activeLesson.value) {
      activeLesson.value.booking = null
      await fetchLessonSlots(activeLesson.value.id)
    }
    await refreshRoadmapSilently()
  } catch (err) {
    toast.error(err.response?.data?.error || 'No se pudo cancelar la cita.')
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchMyCourses()
})
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35] antialiased selection:bg-[#D9826C]/20 flex flex-col">
    <!-- BARRA SUPERIOR DE NAVEGACIÓN DEL ALUMNO -->
    <header class="bg-white/85 backdrop-blur-md border-b border-[#2C3E35]/8 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <RouterLink to="/dashboard" class="flex items-center gap-3.5 group">
          <div class="w-10 h-10 rounded-2xl bg-[#D9826C] text-white flex items-center justify-center shadow-sm shadow-[#D9826C]/20 transition-transform group-hover:scale-105">
            <Feather class="w-5 h-5" />
          </div>
          <div>
            <span class="font-editorial text-2xl font-semibold block leading-none text-[#2C3E35]">
              Vuelve a Ti
            </span>
            <span class="text-[10px] uppercase tracking-[0.2em] text-[#4A6B5D] font-bold block mt-1">
              Campus de Alumnos
            </span>
          </div>
        </RouterLink>

        <div class="flex items-center gap-3">
          <RouterLink
            v-if="authStore.isAdmin"
            to="/admin/courses"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4A6B5D]/10 hover:bg-[#4A6B5D]/15 text-[#4A6B5D] text-xs font-semibold transition-colors"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Panel Admin</span>
          </RouterLink>

          <RouterLink
            to="/"
            target="_blank"
            class="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-[#2C3E35]/65 hover:text-[#2C3E35] transition-colors"
          >
            <span>Web</span>
            <ExternalLink class="w-3 h-3" />
          </RouterLink>

          <div class="h-5 w-px bg-[#2C3E35]/10 hidden sm:block"></div>

          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-[#4A6B5D]/15 text-[#4A6B5D] font-bold text-xs flex items-center justify-center">
              {{ (authStore.user?.name || authStore.user?.email || 'A').charAt(0).toUpperCase() }}
            </div>
            <button
              type="button"
              @click="handleLogout"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/5 hover:bg-rose-50 text-xs font-semibold text-[#2C3E35]/80 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- ESTADO DE CARGA GLOBAL -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
      <div class="w-12 h-12 border-3 border-[#4A6B5D]/20 border-t-[#4A6B5D] rounded-full animate-spin"></div>
      <p class="text-sm font-semibold text-[#2C3E35]">Preparando tu espacio terapéutico...</p>
    </div>

    <!-- ESTADO VACÍO (Si el alumno no tiene cursos asignados aún) -->
    <div
      v-else-if="!coursesRoadmaps.length"
      class="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-5"
    >
      <div class="w-16 h-16 rounded-3xl bg-[#D9826C]/10 text-[#D9826C] flex items-center justify-center">
        <GraduationCap class="w-8 h-8" />
      </div>
      <div class="space-y-2">
        <h2 class="font-editorial text-3xl font-semibold text-[#2C3E35]">Bienvenida/o a tu espacio</h2>
        <p class="text-xs sm:text-sm text-[#2C3E35]/65 leading-relaxed">
          Tu matrícula se está procesando. Carla o el equipo activarán tu acceso al programa en breve.
        </p>
      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL: PANEL IZQUIERDO DEL CURSO + TODO EL ESPACIO PARA LAS CLASES -->
    <main v-else class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fadeIn">
      <!-- BARRA MÓVIL (Visible solo en pantallas < lg) -->
      <div class="lg:hidden mb-6">
        <div class="bg-white rounded-2xl border border-[#2C3E35]/12 shadow-xs p-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-[#4A6B5D]/10 text-[#4A6B5D] flex items-center justify-center shrink-0">
              <Layers class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-[#2C3E35] truncate">{{ currentRoadmap.course.title }}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4A6B5D]/10 text-[#4A6B5D] shrink-0">
                  {{ currentRoadmap.summary.overall_progress_percent }}%
                </span>
              </div>
              <p class="text-[11px] text-[#2C3E35]/65 truncate mt-0.5">
                {{ activeLesson ? `Clase activa: ${activeLesson.title}` : 'Selecciona una clase' }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="mobileSidebarOpen = true"
            class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2C3E35] hover:bg-[#4A6B5D] text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <BookOpen class="w-4 h-4 text-[#D9826C]" />
            <span>Ver Temario</span>
          </button>
        </div>
      </div>

      <!-- MODAL / DIÁLOGO DEL TEMARIO EN MÓVIL (Teleport to body) -->
      <Teleport to="body">
        <div
          v-if="mobileSidebarOpen"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 lg:hidden"
        >
          <!-- Fondo Oscurecido con Desenfoque -->
          <div
            class="fixed inset-0 bg-[#2C3E35]/60 backdrop-blur-xs transition-opacity"
            @click="mobileSidebarOpen = false"
          ></div>

          <!-- Contenedor del Modal / Sheet -->
          <div
            class="relative w-full sm:max-w-xl max-h-[88vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#2C3E35]/12 flex flex-col overflow-hidden z-10 animate-fadeIn"
          >
            <!-- Cabecera del Diálogo -->
            <div class="p-4 sm:p-5 border-b border-[#2C3E35]/10 flex items-center justify-between gap-3 bg-[#FAF8F5]">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-2xl bg-[#4A6B5D]/10 text-[#4A6B5D] flex items-center justify-center shrink-0">
                  <BookOpen class="w-5 h-5 text-[#D9826C]" />
                </div>
                <div class="min-w-0">
                  <div class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D]">
                    <Sparkles class="w-3 h-3 text-[#D9826C]" />
                    <span>Temario del Programa</span>
                  </div>
                  <h3 class="font-editorial text-lg sm:text-xl font-semibold text-[#2C3E35] truncate">
                    {{ currentRoadmap.course.title }}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                @click="mobileSidebarOpen = false"
                class="w-9 h-9 rounded-xl bg-white border border-[#2C3E35]/12 text-[#2C3E35]/70 hover:text-[#2C3E35] hover:bg-[#2C3E35]/5 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                aria-label="Cerrar temario"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Contenido Scrolleable del Temario -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              <!-- Selector si hay múltiples programas -->
              <div v-if="coursesRoadmaps.length > 1" class="p-3 bg-[#FAF8F5] rounded-2xl border border-[#2C3E35]/10 space-y-1.5">
                <label class="block text-[10px] font-bold uppercase text-[#2C3E35]/60">Cambiar de Programa:</label>
                <select
                  :value="selectedCourseIdx"
                  @change="selectedCourseIdx = Number($event.target.value); fetchMyCourses()"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-xs font-semibold text-[#2C3E35]"
                >
                  <option v-for="(rm, idx) in coursesRoadmaps" :key="rm.course.id" :value="idx">
                    {{ rm.course.title }}
                  </option>
                </select>
              </div>

              <!-- Tarjeta de Progreso -->
              <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wider text-[#2C3E35]/60">Tu Avance Global</span>
                  <span class="font-editorial text-2xl font-bold text-[#4A6B5D]">
                    {{ currentRoadmap.summary.overall_progress_percent }}%
                  </span>
                </div>

                <div class="w-full h-2 rounded-full bg-black/8 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-[#4A6B5D] to-emerald-500 transition-all duration-700 ease-out"
                    :style="{ width: `${currentRoadmap.summary.overall_progress_percent}%` }"
                  ></div>
                </div>

                <div class="flex items-center justify-between text-xs text-[#2C3E35]/75 pt-0.5">
                  <span>{{ currentRoadmap.summary.completed_lessons_count }} de {{ currentRoadmap.summary.total_lessons }} completadas</span>
                  <span class="text-[#D9826C] font-semibold">{{ currentRoadmap.summary.unlocked_lessons_count }} disponibles</span>
                </div>
              </div>

              <!-- Aviso de próxima sesión -->
              <div
                v-if="currentRoadmap.summary.next_lesson_to_unlock"
                class="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-amber-50/40 border border-[#D9826C]/25 text-xs text-[#2C3E35] space-y-1"
              >
                <div class="flex items-center gap-1.5 text-[#D9826C] font-bold">
                  <Calendar class="w-3.5 h-3.5" />
                  <span>Próxima clase en abrirse:</span>
                </div>
                <p class="font-semibold text-[#2C3E35] truncate">
                  {{ currentRoadmap.summary.next_lesson_to_unlock.lesson_title }}
                </p>
                <p class="text-[11px] text-[#2C3E35]/65 capitalize">
                  {{ formatDateLongES(currentRoadmap.summary.next_lesson_to_unlock.scheduled_unlock_at) }}
                </p>
              </div>

              <!-- Módulos y Clases -->
              <div class="space-y-3">
                <div
                  v-for="(mod, mIdx) in currentRoadmap.modules"
                  :key="mod.id"
                  class="bg-white rounded-2xl border border-[#2C3E35]/10 shadow-xs overflow-hidden"
                >
                  <div
                    class="p-3.5 border-b border-[#2C3E35]/8 flex items-center justify-between gap-2"
                    :class="mod.is_unlocked ? 'bg-[#FAF8F5]' : 'bg-[#FAF8F5]/60 opacity-75'"
                  >
                    <div class="min-w-0">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D] block">
                        Módulo {{ mIdx + 1 }}
                      </span>
                      <h4 class="font-semibold text-xs text-[#2C3E35] truncate">
                        {{ mod.title }}
                      </h4>
                    </div>
                    <span v-if="mod.is_unlocked" class="text-[11px] font-bold text-[#4A6B5D] shrink-0">
                      {{ mod.module_progress_percent }}%
                    </span>
                    <Lock v-else class="w-3.5 h-3.5 text-[#D9826C] shrink-0" />
                  </div>

                  <div class="divide-y divide-[#2C3E35]/6">
                    <button
                      v-for="les in mod.lessons"
                      :key="les.id"
                      type="button"
                      :disabled="!les.is_unlocked"
                      @click="selectLesson(les)"
                      class="w-full p-3 text-left transition-all flex items-start justify-between gap-2.5"
                      :class="[
                        !les.is_unlocked
                          ? 'opacity-55 cursor-not-allowed bg-[#FAF8F5]/30'
                          : activeLesson?.id === les.id
                          ? 'bg-[#4A6B5D]/10 border-l-4 border-[#4A6B5D] cursor-pointer'
                          : 'hover:bg-[#FAF8F5] cursor-pointer',
                      ]"
                    >
                      <div class="flex items-start gap-2.5 min-w-0">
                        <div class="mt-0.5 shrink-0">
                          <CheckCircle2 v-if="les.progress?.is_completed" class="w-4 h-4 text-emerald-600" />
                          <PlayCircle v-else-if="les.is_unlocked" class="w-4 h-4 text-[#4A6B5D]" />
                          <Lock v-else class="w-3.5 h-3.5 text-[#D9826C]" />
                        </div>

                        <div class="min-w-0">
                          <p class="text-xs font-semibold text-[#2C3E35] leading-tight truncate">
                            {{ les.title }}
                          </p>
                          <div class="flex items-center gap-1.5 mt-1 text-[10px] text-[#2C3E35]/60">
                            <span v-if="les.has_video">Vídeo</span>
                            <span v-if="les.resources_count > 0">· {{ les.resources_count }} cuadernos</span>
                            <span v-if="les.booking_enabled" class="text-[#D9826C] font-bold">· Cita 1:1</span>
                          </div>
                        </div>
                      </div>

                      <div v-if="!les.is_unlocked" class="text-[9px] text-[#D9826C] font-semibold text-right shrink-0">
                        {{ formatDateLongES(les.scheduled_unlock_at) }}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pie del Modal Móvil -->
            <div class="p-3.5 border-t border-[#2C3E35]/10 bg-[#FAF8F5]/60 flex items-center justify-between text-xs">
              <span class="text-[#2C3E35]/65">
                {{ currentRoadmap.course.drip_summary }}
              </span>
              <button
                type="button"
                @click="mobileSidebarOpen = false"
                class="px-4 py-2 rounded-xl bg-[#2C3E35] text-white font-semibold hover:bg-[#4A6B5D] transition-colors cursor-pointer"
              >
                Cerrar Temario
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- ================================================================= -->
        <!-- PANEL IZQUIERDO (4 cols): Toda la información del curso y temario -->
        <!-- Solo visible en desktop (en móvil se usa el Modal "Ver Temario")   -->
        <!-- ================================================================= -->
        <aside
          class="hidden lg:block lg:col-span-4 xl:col-span-4 space-y-6 lg:sticky lg:top-24"
        >
          <!-- Tarjeta del Curso y Progreso -->
          <div class="bg-white rounded-3xl border border-[#2C3E35]/10 shadow-xs p-6 space-y-5">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A6B5D]/10 text-[#4A6B5D] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles class="w-3.5 h-3.5 text-[#D9826C]" />
                <span>Tu Programa Activo</span>
              </div>
              <h1 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35] leading-snug">
                {{ currentRoadmap.course.title }}
              </h1>
              <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
                {{ currentRoadmap.course.subtitle || 'Un viaje guiado para sanar, reconstruir tu autoestima y reencontrarte.' }}
              </p>
            </div>

            <!-- Selector de cursos si hay varios -->
            <div v-if="coursesRoadmaps.length > 1" class="pt-2 border-t border-[#2C3E35]/10">
              <label class="block text-[11px] font-bold uppercase text-[#2C3E35]/50 mb-1.5">Cambiar de Programa:</label>
              <select
                :value="selectedCourseIdx"
                @change="selectedCourseIdx = Number($event.target.value); fetchMyCourses()"
                class="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs font-semibold text-[#2C3E35]"
              >
                <option v-for="(rm, idx) in coursesRoadmaps" :key="rm.course.id" :value="idx">
                  {{ rm.course.title }}
                </option>
              </select>
            </div>

            <!-- Barra de Avance del Alumno -->
            <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-[#2C3E35]/60">Tu Avance</span>
                <span class="font-editorial text-2xl font-bold text-[#4A6B5D]">
                  {{ currentRoadmap.summary.overall_progress_percent }}%
                </span>
              </div>

              <div class="w-full h-2 rounded-full bg-black/8 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-[#4A6B5D] to-emerald-500 transition-all duration-700 ease-out"
                  :style="{ width: `${currentRoadmap.summary.overall_progress_percent}%` }"
                ></div>
              </div>

              <div class="flex items-center justify-between text-xs text-[#2C3E35]/75 pt-0.5">
                <span>{{ currentRoadmap.summary.completed_lessons_count }} de {{ currentRoadmap.summary.total_lessons }} completadas</span>
                <span class="text-[#D9826C] font-semibold">{{ currentRoadmap.summary.unlocked_lessons_count }} disponibles</span>
              </div>
            </div>

            <!-- Aviso de próxima sesión por desbloquearse -->
            <div
              v-if="currentRoadmap.summary.next_lesson_to_unlock"
              class="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-amber-50/40 border border-[#D9826C]/25 text-xs text-[#2C3E35] space-y-1"
            >
              <div class="flex items-center gap-1.5 text-[#D9826C] font-bold">
                <Calendar class="w-3.5 h-3.5" />
                <span>Próxima clase en abrirse:</span>
              </div>
              <p class="font-semibold text-[#2C3E35] truncate">
                {{ currentRoadmap.summary.next_lesson_to_unlock.lesson_title }}
              </p>
              <p class="text-[11px] text-[#2C3E35]/65 capitalize">
                {{ formatDateLongES(currentRoadmap.summary.next_lesson_to_unlock.scheduled_unlock_at) }}
              </p>
            </div>
          </div>

          <!-- Itinerario de Módulos y Clases (Navegación del Temario) -->
          <div class="space-y-4">
            <div class="flex items-center justify-between px-1">
              <h3 class="font-editorial text-xl font-semibold text-[#2C3E35]">Itinerario del Curso</h3>
              <span class="text-xs text-[#4A6B5D] font-semibold">
                {{ currentRoadmap.course.drip_summary }}
              </span>
            </div>

            <div class="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
              <div
                v-for="(mod, mIdx) in currentRoadmap.modules"
                :key="mod.id"
                class="bg-white rounded-2xl border border-[#2C3E35]/10 shadow-xs overflow-hidden"
              >
                <!-- Cabecera del Módulo -->
                <div
                  class="p-3.5 border-b border-[#2C3E35]/8 flex items-center justify-between gap-2"
                  :class="mod.is_unlocked ? 'bg-[#FAF8F5]' : 'bg-[#FAF8F5]/60 opacity-75'"
                >
                  <div class="min-w-0">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D] block">
                      Módulo {{ mIdx + 1 }}
                    </span>
                    <h4 class="font-semibold text-xs text-[#2C3E35] truncate">
                      {{ mod.title }}
                    </h4>
                  </div>
                  <span v-if="mod.is_unlocked" class="text-[11px] font-bold text-[#4A6B5D] shrink-0">
                    {{ mod.module_progress_percent }}%
                  </span>
                  <Lock v-else class="w-3.5 h-3.5 text-[#D9826C] shrink-0" />
                </div>

                <!-- Clases del Módulo -->
                <div class="divide-y divide-[#2C3E35]/6">
                  <button
                    v-for="les in mod.lessons"
                    :key="les.id"
                    type="button"
                    :disabled="!les.is_unlocked"
                    @click="selectLesson(les)"
                    class="w-full p-3 text-left transition-all flex items-start justify-between gap-2.5"
                    :class="[
                      !les.is_unlocked
                        ? 'opacity-55 cursor-not-allowed bg-[#FAF8F5]/30'
                        : activeLesson?.id === les.id
                        ? 'bg-[#4A6B5D]/10 border-l-4 border-[#4A6B5D] cursor-pointer'
                        : 'hover:bg-[#FAF8F5] cursor-pointer',
                    ]"
                  >
                    <div class="flex items-start gap-2.5 min-w-0">
                      <div class="mt-0.5 shrink-0">
                        <CheckCircle2 v-if="les.progress?.is_completed" class="w-4 h-4 text-emerald-600" />
                        <PlayCircle v-else-if="les.is_unlocked" class="w-4 h-4 text-[#4A6B5D]" />
                        <Lock v-else class="w-3.5 h-3.5 text-[#D9826C]" />
                      </div>

                      <div class="min-w-0">
                        <p class="text-xs font-semibold text-[#2C3E35] leading-tight truncate">
                          {{ les.title }}
                        </p>
                        <div class="flex items-center gap-1.5 mt-1 text-[10px] text-[#2C3E35]/60">
                          <span v-if="les.has_video">Vídeo</span>
                          <span v-if="les.resources_count > 0">· {{ les.resources_count }} cuadernos</span>
                          <span v-if="les.booking_enabled" class="text-[#D9826C] font-bold">· Cita 1:1</span>
                        </div>
                      </div>
                    </div>

                    <div v-if="!les.is_unlocked" class="text-[9px] text-[#D9826C] font-semibold text-right shrink-0">
                      {{ formatDateLongES(les.scheduled_unlock_at) }}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- ================================================================= -->
        <!-- ÁREA PRINCIPAL (8 cols): La clase ocupa todo el espacio           -->
        <!-- Todo a simple vista: Cita 1:1 prioritaria, Cuaderno y Materiales  -->
        <!-- ================================================================= -->
        <section class="lg:col-span-8 xl:col-span-8 space-y-8 min-w-0">
          <div v-if="activeLesson" class="bg-white rounded-3xl border border-[#2C3E35]/10 shadow-xs overflow-hidden">
            <!-- Cabecera de la Clase -->
            <div class="p-6 sm:p-8 border-b border-[#2C3E35]/10 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <span class="px-3.5 py-1 rounded-full bg-[#4A6B5D]/10 text-[#4A6B5D] text-xs font-bold uppercase tracking-wider">
                  {{ activeLesson.module_title }}
                </span>

                <!-- Botón de Completar Sesión -->
                <button
                  type="button"
                  @click="handleToggleCompleteLesson"
                  class="px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                  :class="
                    activeLesson.progress?.is_completed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-[#2C3E35] hover:bg-[#4A6B5D] text-white'
                  "
                >
                  <CheckCircle2 class="w-4 h-4" />
                  <span>
                    {{ activeLesson.progress?.is_completed ? 'Completada ✓' : 'Marcar como Completada' }}
                  </span>
                </button>
              </div>

              <h2 class="font-editorial text-3xl sm:text-4xl font-semibold text-[#2C3E35] leading-tight">
                {{ activeLesson.title }}
              </h2>
            </div>

            <!-- Vídeo de la Clase (si tiene vídeo) -->
            <div v-if="activeLesson.has_video" class="bg-[#18221D] relative select-none">
              <div
                v-if="loadingVideo"
                class="aspect-video flex flex-col items-center justify-center text-white/80 p-6 text-sm"
              >
                <div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3"></div>
                <p>Cargando sesión con streaming protegido...</p>
              </div>

              <div
                v-else-if="videoError"
                class="aspect-video flex flex-col items-center justify-center text-[#D9826C] p-6 text-sm text-center"
              >
                <AlertCircle class="w-8 h-8 mb-2" />
                <p>{{ videoError }}</p>
              </div>

              <div
                v-else-if="videoStreamUrl"
                class="relative aspect-video bg-black overflow-hidden"
                @contextmenu.prevent
              >
                <video
                  ref="videoPlayerRef"
                  :src="videoStreamUrl"
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  playsinline
                  class="w-full h-full object-contain"
                  @contextmenu.prevent
                  @loadedmetadata="handleVideoLoadedMetadata"
                  @timeupdate="reportVideoProgress(false, false)"
                  @pause="reportVideoProgress(true, false)"
                  @ended="reportVideoProgress(true, true)"
                ></video>

                <!-- Marca de agua fija y discreta en esquina superior -->
                <div
                  class="pointer-events-none absolute top-3.5 left-4 z-20 px-2.5 py-1 rounded-md bg-black/30 text-white/45 text-[11px] font-mono tracking-wide select-none"
                >
                  {{ watermarkInfo.email || authStore.user?.email }} · Vuelve a Ti
                </div>
              </div>

              <!-- Barra de información de vídeo -->
              <div class="px-6 py-3 bg-[#24332B] text-white flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 text-white/70">
                  <ShieldCheck class="w-4 h-4 text-[#D9826C]" />
                  <span>Vídeo privado de tu proceso</span>
                </div>
                <span class="font-semibold text-[#D9826C]">
                  Visualizado: {{ activeLesson.progress?.video_progress_percent || 0 }}%
                </span>
              </div>
            </div>

            <!-- ============================================================= -->
            <!-- CONTENIDO DE LA CLASE A SIMPLE VISTA (SIN PESTAÑAS)           -->
            <!-- ============================================================= -->
            <div class="p-6 sm:p-8 space-y-8">
              <!-- ⭐ 1. SESIÓN 1:1 CON CARLA VILADOT (MÁXIMA PRIORIDAD Y PREFERENCIA) -->
              <div
                v-if="activeLesson.booking_enabled"
                class="rounded-3xl border-2 border-[#D9826C]/40 bg-gradient-to-br from-[#FAF8F5] via-white to-[#F2ECE4] p-6 sm:p-7 shadow-sm space-y-5"
              >
                <!-- Insignia y Encabezado de la Cita -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C3E35]/10">
                  <div class="flex items-start sm:items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-[#D9826C] text-white flex items-center justify-center shadow-md shadow-[#D9826C]/25 shrink-0">
                      <CalendarCheck class="w-6 h-6" />
                    </div>
                    <div>
                      <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9826C]/15 text-[#D9826C] text-[10px] font-bold uppercase tracking-wider mb-1">
                        <Sparkle class="w-3 h-3" />
                        <span>Sesión 1:1 Incluida en esta Clase</span>
                      </div>
                      <h3 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35]">
                        Tu Consulta Terapéutica con Carla Viladot
                      </h3>
                      <p class="text-xs text-[#2C3E35]/70 mt-0.5">
                        Esta clase incluye 1 hora de terapia individual por Google Meet para profundizar en tu proceso.
                      </p>
                    </div>
                  </div>

                  <span
                    v-if="activeLesson.booking"
                    class="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                  >
                    <Check class="w-4 h-4 text-emerald-700" />
                    <span>Cita Confirmada</span>
                  </span>
                </div>

                <!-- Caso A: Si ya está agendada -->
                <div
                  v-if="activeLesson.booking"
                  class="p-5 sm:p-6 rounded-2xl bg-white border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div class="space-y-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Fecha y Hora de tu Cita:
                    </span>
                    <p class="text-lg sm:text-xl font-semibold text-[#2C3E35] capitalize">
                      {{ formatBookingSlotTime(activeLesson.booking.start_at) }}
                    </p>
                    <p class="text-xs text-[#2C3E35]/65">
                      Recibirás un correo con el recordatorio y el evento de Google Calendar.
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-2.5 shrink-0">
                    <a
                      v-if="activeLesson.booking.meet_link"
                      :href="activeLesson.booking.meet_link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Video class="w-4 h-4" />
                      <span>Entrar a Google Meet</span>
                      <ExternalLink class="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <button
                      type="button"
                      @click="handleCancelStudentBooking(activeLesson.booking.id)"
                      class="px-3.5 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Reprogramar Cita
                    </button>
                  </div>
                </div>

                <!-- Caso B: Si está disponible para agendar (Selector Directo en Pantalla) -->
                <div v-else class="space-y-5">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p class="text-xs font-semibold text-[#2C3E35]">
                      Selecciona a continuación el día y la franja horaria que mejor te convenga:
                    </p>

                    <!-- Navegación por Semanas -->
                    <div v-if="bookingData?.range" class="flex items-center gap-1 bg-white border border-[#2C3E35]/15 rounded-full px-2 py-1 shadow-xs self-start sm:self-auto">
                      <button
                        type="button"
                        :disabled="!bookingData.range.has_prev || loadingSlots"
                        @click="fetchLessonSlots(activeLesson.id, currentWeekOffset - 1)"
                        class="p-1 rounded-full text-[#2C3E35] hover:bg-black/5 disabled:opacity-25 cursor-pointer"
                        title="Semana anterior"
                      >
                        <ChevronLeft class="w-4 h-4" />
                      </button>
                      <span class="text-xs font-semibold px-2 text-[#4A6B5D]">
                        {{ bookingData.range.days_summary }}
                      </span>
                      <button
                        type="button"
                        :disabled="!bookingData.range.has_next || loadingSlots"
                        @click="fetchLessonSlots(activeLesson.id, currentWeekOffset + 1)"
                        class="p-1 rounded-full text-[#2C3E35] hover:bg-black/5 disabled:opacity-25 cursor-pointer"
                        title="Semana siguiente"
                      >
                        <ChevronRight class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Carrusel de Días Disponibles -->
                  <div v-if="bookingData?.days?.length" class="space-y-4">
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <button
                        v-for="(day, dIdx) in bookingData.days"
                        :key="day.date"
                        type="button"
                        @click="selectedDayIdx = dIdx; selectedSlot = null"
                        class="p-3.5 rounded-2xl border text-center transition-all cursor-pointer"
                        :class="
                          selectedDayIdx === dIdx
                            ? 'bg-[#4A6B5D] text-white border-[#4A6B5D] shadow-xs ring-2 ring-[#4A6B5D]/20'
                            : 'bg-white text-[#2C3E35] border-[#2C3E35]/10 hover:border-[#4A6B5D]/40'
                        "
                      >
                        <span class="text-[11px] uppercase tracking-wider block font-bold opacity-80">
                          {{ day.weekday_name || day.formatted_date.split(',')[0] }}
                        </span>
                        <span class="text-xs block mt-0.5 font-semibold">
                          {{ day.formatted_date.split(',')[1] || day.formatted_date }}
                        </span>
                        <span class="text-[10px] block mt-1 opacity-70">
                          {{ day.available_count || 0 }} huecos
                        </span>
                      </button>
                    </div>

                    <!-- Horas del día seleccionado -->
                    <div v-if="bookingData.days[selectedDayIdx]?.slots?.length" class="p-5 rounded-2xl bg-white border border-[#2C3E35]/10 space-y-4 shadow-xs">
                      <span class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D] block">
                        Horarios Disponibles para el {{ bookingData.days[selectedDayIdx]?.formatted_date }}:
                      </span>
                      <div class="flex flex-wrap gap-2.5">
                        <button
                          v-for="slot in bookingData.days[selectedDayIdx].slots"
                          :key="slot.start_at || slot.start_iso"
                          type="button"
                          :disabled="!slot.available"
                          @click="selectedSlot = slot"
                          class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border"
                          :class="[
                            !slot.available
                              ? 'opacity-30 cursor-not-allowed bg-black/5 text-[#2C3E35]/40 border-transparent'
                              : selectedSlot === slot
                              ? 'bg-[#2C3E35] text-white border-[#2C3E35] shadow-sm'
                              : 'bg-[#FAF8F5] text-[#2C3E35] border-[#2C3E35]/15 hover:border-[#4A6B5D]'
                          ]"
                        >
                          {{ slot.label }}
                        </button>
                      </div>

                      <!-- Confirmación y Notas para Carla -->
                      <div v-if="selectedSlot" class="pt-4 border-t border-[#2C3E35]/10 space-y-3.5 animate-fadeIn">
                        <label class="block text-xs font-semibold text-[#2C3E35]">
                          ¿Quieres compartir algo con Carla antes de la cita? (Opcional)
                        </label>
                        <textarea
                          v-model="bookingNotes"
                          rows="2"
                          placeholder="Cuéntale a Carla qué sientes prioritario abordar en esta sesión..."
                          class="w-full p-3.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs focus:outline-none focus:border-[#4A6B5D]"
                        ></textarea>

                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                          <span class="text-xs text-[#2C3E35]">
                            Hora seleccionada: <strong class="text-[#4A6B5D]">{{ selectedSlot.label }}</strong>
                          </span>
                          <button
                            type="button"
                            :disabled="bookingSubmitting"
                            @click="handleConfirmBooking"
                            class="px-6 py-2.5 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <Calendar class="w-4 h-4" />
                            <span>{{ bookingSubmitting ? 'Confirmando...' : 'Confirmar Cita 1:1 con Carla' }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="!loadingSlots" class="p-6 text-center text-xs text-[#2C3E35]/65 bg-white rounded-2xl border border-[#2C3E35]/10">
                    No hay citas libres para esta semana. Consulta la semana siguiente con el selector superior.
                  </div>
                </div>
              </div>

              <!-- 📖 2. CUADERNO Y GUÍA DE LA SESIÓN (A SIMPLE VISTA) -->
              <div v-if="activeLesson.description" class="space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A6B5D]">
                  <FileText class="w-4 h-4" />
                  <span>Cuaderno & Guía Terapéutica</span>
                </div>
                <div class="text-sm sm:text-base text-[#2C3E35]/85 leading-relaxed whitespace-pre-line bg-[#FAF8F5] p-6 rounded-3xl border border-[#2C3E35]/10 shadow-xs">
                  {{ activeLesson.description }}
                </div>
              </div>

              <!-- 📥 3. MATERIALES, AUDIOS Y CUADERNOS (CON PREVIEW INTEGRADO Y DESCARGA) -->
              <div v-if="activeLesson.resources?.length" class="space-y-3.5 pt-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D9826C]">
                    <BookOpen class="w-4 h-4" />
                    <span>Materiales, Audios y Cuadernos ({{ activeLesson.resources.length }})</span>
                  </div>
                  <span class="text-xs text-[#2C3E35]/60">Visualiza o escucha directamente aquí, o descárgalo</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    v-for="res in activeLesson.resources"
                    :key="res.id"
                    class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 flex flex-col justify-between gap-3.5 hover:border-[#4A6B5D]/40 transition-all shadow-xs"
                    :class="inlineAudioUrls[res.id] ? 'sm:col-span-2 border-[#4A6B5D]/40 bg-white' : ''"
                  >
                    <div class="flex items-start justify-between gap-3 min-w-0">
                      <div class="flex items-start gap-3 min-w-0">
                        <div
                          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          :class="
                            isAudioResource(res)
                              ? 'bg-[#4A6B5D]/15 text-[#4A6B5D]'
                              : 'bg-[#D9826C]/15 text-[#D9826C]'
                          "
                        >
                          <Headphones v-if="isAudioResource(res)" class="w-5 h-5" />
                          <FileText v-else class="w-5 h-5" />
                        </div>
                        <div class="min-w-0">
                          <div class="flex items-center gap-2">
                            <p class="font-semibold text-sm text-[#2C3E35] truncate">{{ res.title }}</p>
                            <span
                              v-if="res.downloaded"
                              class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0"
                            >
                              Visto ✓
                            </span>
                          </div>
                          <p class="text-xs text-[#2C3E35]/60 mt-0.5">
                            {{ resourceTypeLabel(res.resource_type) }}
                            <span v-if="res.file_size_bytes">· {{ formatBytes(res.file_size_bytes) }}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Reproductor de Audio Inline (si es un recurso de audio y está activo) -->
                    <div
                      v-if="isAudioResource(res) && inlineAudioUrls[res.id]"
                      class="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#4A6B5D]/20 space-y-2 animate-fadeIn"
                    >
                      <div class="flex items-center justify-between text-[11px] font-semibold text-[#4A6B5D]">
                        <span class="inline-flex items-center gap-1.5">
                          <Volume2 class="w-3.5 h-3.5 text-[#D9826C]" />
                          Reproduciendo audio en el navegador
                        </span>
                        <button
                          type="button"
                          @click="handlePreviewResource(res, { inlineAudio: false })"
                          class="text-[#2C3E35]/60 hover:text-[#2C3E35] underline cursor-pointer"
                        >
                          Abrir en visor grande
                        </button>
                      </div>
                      <audio
                        :src="inlineAudioUrls[res.id]"
                        controls
                        autoplay
                        controlsList="nodownload"
                        class="w-full h-10"
                      ></audio>
                    </div>

                    <!-- Botones de Acción: Previsualizar / Escuchar + Descargar -->
                    <div class="flex items-center gap-2 pt-0.5">
                      <!-- Botón Principal: Escuchar Audio o Ver en Pantalla -->
                      <button
                        v-if="isAudioResource(res)"
                        type="button"
                        :disabled="loadingPreviewId === res.id"
                        @click="handlePreviewResource(res, { inlineAudio: true })"
                        class="flex-1 py-2 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        :class="
                          inlineAudioUrls[res.id]
                            ? 'bg-[#4A6B5D]/15 text-[#4A6B5D] border border-[#4A6B5D]/30'
                            : 'bg-[#4A6B5D] hover:bg-[#3d594d] text-white'
                        "
                      >
                        <Headphones class="w-3.5 h-3.5" />
                        <span>
                          {{
                            loadingPreviewId === res.id
                              ? 'Cargando...'
                              : inlineAudioUrls[res.id]
                              ? 'Ocultar reproductor'
                              : 'Escuchar Audio'
                          }}
                        </span>
                      </button>

                      <button
                        v-else
                        type="button"
                        @click="handlePreviewResource(res, { inlineAudio: false })"
                        class="flex-1 py-2 px-3 rounded-xl bg-[#2C3E35] hover:bg-[#4A6B5D] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye class="w-3.5 h-3.5 text-[#D9826C]" />
                        <span>{{ isPdfResource(res) ? 'Leer PDF aquí' : 'Ver en pantalla' }}</span>
                      </button>

                      <!-- Botón Secundario: Descargar -->
                      <button
                        type="button"
                        @click="handleDownloadResource(res)"
                        class="py-2 px-3 rounded-xl bg-white hover:bg-[#2C3E35] hover:text-white border border-[#2C3E35]/15 text-xs font-bold text-[#2C3E35] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        title="Descargar archivo a tu dispositivo"
                      >
                        <Download class="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- ================================================================= -->
    <!-- MODAL VISOR DE RECURSOS INTEGRADO (PDFs, AUDIOS, IMÁGENES)        -->
    <!-- ================================================================= -->
    <Teleport to="body">
      <div
        v-if="previewModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center"
        :class="previewModal.fullscreen ? 'p-0' : 'p-2 sm:p-5'"
      >
        <!-- Fondo Oscurecido -->
        <div
          class="fixed inset-0 bg-[#2C3E35]/75 backdrop-blur-xs transition-opacity"
          @click="closePreviewModal"
        ></div>

        <!-- Contenedor del Visor -->
        <div
          class="relative bg-white border border-[#2C3E35]/15 shadow-2xl flex flex-col overflow-hidden z-10 animate-fadeIn transition-all"
          :class="
            previewModal.fullscreen
              ? 'w-screen h-screen rounded-none'
              : 'w-full max-w-5xl h-[90vh] sm:h-[88vh] rounded-3xl'
          "
        >
          <!-- Cabecera del Visor -->
          <div class="px-4 sm:px-6 py-3.5 border-b border-[#2C3E35]/10 bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                :class="
                  isAudioResource(previewModal.resource)
                    ? 'bg-[#4A6B5D]/15 text-[#4A6B5D]'
                    : 'bg-[#D9826C]/15 text-[#D9826C]'
                "
              >
                <Headphones v-if="isAudioResource(previewModal.resource)" class="w-5 h-5" />
                <FileText v-else class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D]">
                    {{ resourceTypeLabel(previewModal.resource?.resource_type) }}
                  </span>
                </div>
                <h3 class="font-editorial text-lg sm:text-xl font-semibold text-[#2C3E35] truncate">
                  {{ previewModal.resource?.title }}
                </h3>
              </div>
            </div>

            <!-- Controles de la cabecera del visor -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- Selector rápido si hay varios recursos en la clase -->
              <div
                v-if="activeLesson?.resources?.length > 1"
                class="hidden md:flex items-center gap-1 mr-2 bg-white px-2 py-1 rounded-xl border border-[#2C3E35]/10"
              >
                <button
                  v-for="(rItem, rIdx) in activeLesson.resources"
                  :key="rItem.id"
                  type="button"
                  @click="handlePreviewResource(rItem, { inlineAudio: false })"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer max-w-[140px] truncate"
                  :class="
                    previewModal.resource?.id === rItem.id
                      ? 'bg-[#2C3E35] text-white'
                      : 'text-[#2C3E35]/65 hover:bg-[#FAF8F5]'
                  "
                >
                  {{ rIdx + 1 }}. {{ rItem.title }}
                </button>
              </div>

              <!-- Abrir en pestaña nueva -->
              <a
                v-if="previewModal.previewUrl"
                :href="previewModal.previewUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 rounded-xl bg-white hover:bg-[#2C3E35]/5 border border-[#2C3E35]/12 text-xs font-semibold text-[#2C3E35] inline-flex items-center gap-1.5 transition-colors"
                title="Abrir en una pestaña nueva del navegador"
              >
                <ExternalLink class="w-3.5 h-3.5 text-[#4A6B5D]" />
                <span class="hidden sm:inline">Pestaña nueva</span>
              </a>

              <!-- Botón Descargar -->
              <button
                v-if="previewModal.resource"
                type="button"
                @click="handleDownloadResource(previewModal.resource)"
                class="px-3.5 py-2 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Download class="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>

              <!-- Botón Pantalla Completa -->
              <button
                type="button"
                @click="previewModal.fullscreen = !previewModal.fullscreen"
                class="w-9 h-9 rounded-xl bg-white border border-[#2C3E35]/12 text-[#2C3E35]/70 hover:text-[#2C3E35] hover:bg-[#2C3E35]/5 hidden sm:flex items-center justify-center transition-colors cursor-pointer"
                :title="previewModal.fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
              >
                <Minimize2 v-if="previewModal.fullscreen" class="w-4 h-4" />
                <Maximize2 v-else class="w-4 h-4" />
              </button>

              <!-- Botón Cerrar -->
              <button
                type="button"
                @click="closePreviewModal"
                class="w-9 h-9 rounded-xl bg-white border border-[#2C3E35]/12 text-[#2C3E35]/70 hover:text-[#2C3E35] hover:bg-[#2C3E35]/5 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar visor"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Cuerpo del Visor -->
          <div class="flex-1 bg-[#24332B]/5 relative overflow-hidden flex flex-col">
            <!-- Estado de carga -->
            <div
              v-if="previewModal.loading"
              class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3"
            >
              <div class="w-10 h-10 rounded-full border-3 border-[#4A6B5D]/20 border-t-[#D9826C] animate-spin"></div>
              <p class="text-xs font-medium text-[#2C3E35]/70">
                Abriendo recurso en el visor...
              </p>
            </div>

            <!-- Estado de error -->
            <div
              v-else-if="previewModal.error"
              class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto"
            >
              <AlertCircle class="w-10 h-10 text-[#D9826C]" />
              <p class="text-sm text-[#2C3E35]/80">{{ previewModal.error }}</p>
              <button
                type="button"
                @click="handleDownloadResource(previewModal.resource)"
                class="px-5 py-2.5 rounded-2xl bg-[#2C3E35] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Download class="w-4 h-4" />
                <span>Descargar archivo directamente</span>
              </button>
            </div>

            <!-- 1. VISOR DE AUDIO INTEGRADO -->
            <div
              v-else-if="isAudioResource(previewModal.resource) && previewModal.previewUrl"
              class="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-[#24332B] via-[#2C3E35] to-[#1d2922] text-white text-center"
            >
              <div class="max-w-md w-full bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-8 space-y-6 shadow-xl">
                <div class="w-20 h-20 rounded-3xl bg-[#D9826C]/20 border border-[#D9826C]/40 text-[#D9826C] flex items-center justify-center mx-auto shadow-lg">
                  <Headphones class="w-10 h-10" />
                </div>
                <div class="space-y-2">
                  <span class="text-[11px] font-bold uppercase tracking-widest text-[#D9826C]">
                    Audio Guiado · Vuelve a Ti
                  </span>
                  <h4 class="font-editorial text-2xl sm:text-3xl font-semibold text-white">
                    {{ previewModal.resource?.title }}
                  </h4>
                  <p class="text-xs text-white/65">
                    Ponte cómoda/o, respira profundo y dale al play para escuchar la sesión.
                  </p>
                </div>
                <audio
                  :src="previewModal.previewUrl"
                  controls
                  autoplay
                  controlsList="nodownload"
                  class="w-full"
                ></audio>
              </div>
            </div>

            <!-- 2. VISOR DE IMÁGENES -->
            <div
              v-else-if="isImageResource(previewModal.resource) && previewModal.previewUrl"
              class="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#1E2923] overflow-auto"
            >
              <img
                :src="previewModal.previewUrl"
                :alt="previewModal.resource?.title"
                class="max-w-full max-h-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <!-- 3. VISOR DE PDF EN EL NAVEGADOR -->
            <iframe
              v-else-if="isPdfResource(previewModal.resource) && previewModal.previewUrl"
              :src="previewModal.previewUrl"
              class="w-full flex-1 border-0 bg-white"
              :title="previewModal.resource?.title || 'Visor PDF'"
            ></iframe>

            <!-- 4. OTROS DOCUMENTOS (WORD, POWERPOINT, ETC.) -->
            <div
              v-else-if="previewModal.previewUrl"
              class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto"
            >
              <div class="w-16 h-16 rounded-3xl bg-[#D9826C]/15 text-[#D9826C] flex items-center justify-center">
                <FileText class="w-8 h-8" />
              </div>
              <h4 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
                {{ previewModal.resource?.title }}
              </h4>
              <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
                Este tipo de documento ({{ resourceTypeLabel(previewModal.resource?.resource_type) }}) está optimizado para editarse o abrirse directamente en tu dispositivo.
              </p>
              <button
                type="button"
                @click="handleDownloadResource(previewModal.resource)"
                class="px-5 py-2.5 rounded-2xl bg-[#2C3E35] hover:bg-[#4A6B5D] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download class="w-4 h-4 text-[#D9826C]" />
                <span>Descargar archivo ahora</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease-out;
}
</style>
