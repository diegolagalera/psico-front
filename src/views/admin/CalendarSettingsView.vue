<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import {
  Calendar as CalendarIcon,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Terminal,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Video,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const connectingGoogle = ref(false)
const showGuide = ref(true)
const activeStep = ref(1)
const calendarReady = ref(false)
const hasClientCredentials = ref(false)
const callbackUrl = ref('')
const copiedCallback = ref(false)
const availableCalendars = ref([])
const savedSnapshot = ref('')

const settings = reactive({
  calendar_enabled: false,
  calendar_use_gmail_token: true,
  calendar_token_json: '',
  calendar_id: 'primary',
  calendar_timezone: 'Europe/Madrid',
  session_duration_minutes: 60,
  booking_min_notice_hours: 24,
  booking_cancel_limit_hours: 24,
  working_hours: {
    '0': [['10:00', '14:00'], ['16:00', '20:00']],
    '1': [['10:00', '14:00'], ['16:00', '20:00']],
    '2': [['10:00', '14:00'], ['16:00', '20:00']],
    '3': [['10:00', '14:00'], ['16:00', '20:00']],
    '4': [['10:00', '14:00'], ['16:00', '20:00']],
    '5': [],
    '6': [],
  },
})

const isDirty = computed(
  () => Boolean(savedSnapshot.value && JSON.stringify(settings) !== savedSnapshot.value)
)

const weekdayLabels = [
  { day: '0', label: 'Lunes' },
  { day: '1', label: 'Martes' },
  { day: '2', label: 'Miércoles' },
  { day: '3', label: 'Jueves' },
  { day: '4', label: 'Viernes' },
  { day: '5', label: 'Sábado' },
  { day: '6', label: 'Domingo' },
]

const feedbackMessage = ref('')
const feedbackType = ref('success')
const detailedLog = ref('')

const calendarSteps = [
  {
    step: 1,
    title: 'Habilitar "Google Calendar API" en tu Google Cloud Console',
    details: [
      'Entra en console.cloud.google.com y ve a "APIs y servicios" > "Biblioteca".',
      'Busca "Google Calendar API" y haz clic en "Habilitar".',
    ],
  },
  {
    step: 2,
    title: 'Copiar la URI de redirección y pegar el JSON de Google',
    details: [
      'En Google Cloud Console > "Credenciales", edita tu ID de cliente OAuth 2.0 (o crea uno nuevo de tipo Aplicación Web).',
      'Añade en "URIs de redireccionamiento autorizados" la URL mostrada en el recuadro de abajo.',
      'Descarga el JSON de credenciales de Google Cloud y pégalo en el recuadro.',
    ],
  },
  {
    step: 3,
    title: 'Pulsar "Vincular mi Google Calendar con 1 Clic"',
    details: [
      'Haz clic en el botón "Vincular mi Google Calendar con 1 Clic".',
      'Se abrirá la ventana oficial de Google para que elijas tu cuenta y pulses "Continuar / Permitir".',
      'El sistema guardará automáticamente tus permisos permanentes y conectará Google Meet.',
    ],
  },
]

function addRange(dayKey) {
  if (!settings.working_hours[dayKey]) {
    settings.working_hours[dayKey] = []
  }
  settings.working_hours[dayKey].push(['10:00', '14:00'])
}

function removeRange(dayKey, index) {
  settings.working_hours[dayKey].splice(index, 1)
}

async function fetchCalendarSettings() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/calendar-settings')
    if (data.settings) {
      Object.assign(settings, data.settings)
      if (data.settings.working_hours) {
        settings.working_hours = data.settings.working_hours
      }
    }
    savedSnapshot.value = JSON.stringify(settings)
    calendarReady.value = Boolean(data.calendar_ready)
    hasClientCredentials.value = Boolean(data.has_client_credentials)
    callbackUrl.value = data.callback_url || ''
    if (calendarReady.value) {
      await loadAvailableCalendars()
    }
  } catch (err) {
    feedbackType.value = 'error'
    feedbackMessage.value =
      err.response?.data?.error ||
      'No se pudo cargar la configuración de calendario.'
  } finally {
    loading.value = false
  }
}

async function loadAvailableCalendars() {
  try {
    const { data } = await api.get('/admin/calendar/calendars')
    if (data.calendars && Array.isArray(data.calendars)) {
      availableCalendars.value = data.calendars
    }
  } catch {
    // ignorar si no se pudo listar
  }
}

async function handleSaveSettings() {
  saving.value = true
  feedbackMessage.value = ''
  try {
    const payload = {
      ...settings,
      booking_working_hours: settings.working_hours,
    }
    const { data } = await api.put('/admin/calendar-settings', payload)
    savedSnapshot.value = JSON.stringify(settings)
    feedbackType.value = 'success'
    feedbackMessage.value = data.message
    toast.success(data.message || 'Configuración de Google Calendar guardada.')
    calendarReady.value = Boolean(data.calendar_ready)
    hasClientCredentials.value = Boolean(data.has_client_credentials)
  } catch (err) {
    feedbackType.value = 'error'
    feedbackMessage.value =
      err.response?.data?.error || 'Error al guardar la configuración.'
    toast.error(feedbackMessage.value)
  } finally {
    saving.value = false
  }
}

async function handleConnectGoogleOAuth() {
  connectingGoogle.value = true
  feedbackMessage.value = ''
  try {
    // 1. Guardar primero para que el JSON o configuración actual esté persistida en BD
    const payload = {
      ...settings,
      booking_working_hours: settings.working_hours,
    }
    await api.put('/admin/calendar-settings', payload)

    // 2. Pedir la URL de autorización
    const { data } = await api.get('/admin/calendar/oauth-url')
    if (data.auth_url) {
      toast.info('Redirigiendo a Google para autorizar...', { duration: 3000 })
      // Redirigir a la pantalla de consentimiento de Google
      window.location.href = data.auth_url
    }
  } catch (err) {
    feedbackType.value = 'error'
    feedbackMessage.value =
      err.response?.data?.error ||
      'No se pudo iniciar la autorización con Google. Revisa que hayas pegado el JSON de Google Cloud Console.'
    toast.error(feedbackMessage.value)
    connectingGoogle.value = false
  }
}

function copyCallbackUrl() {
  const url =
    callbackUrl.value ||
    `${window.location.origin}/api/admin/calendar/oauth-callback`
  navigator.clipboard.writeText(url)
  copiedCallback.value = true
  toast.success('URI de redirección copiada al portapapeles.')
  setTimeout(() => {
    copiedCallback.value = false
  }, 2500)
}

async function handleTestCalendar() {
  testing.value = true
  feedbackMessage.value = ''
  detailedLog.value = ''
  try {
    const payload = {
      ...settings,
      booking_working_hours: settings.working_hours,
    }
    const { data } = await api.post('/admin/calendar-settings/test', payload)
    feedbackType.value = 'success'
    feedbackMessage.value = data.message
    detailedLog.value = data.log || ''
    calendarReady.value = true
  } catch (err) {
    feedbackType.value = 'error'
    feedbackMessage.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Error al conectar con Google Calendar.'
    detailedLog.value = err.response?.data?.log || ''
  } finally {
    testing.value = false
  }
}

onMounted(async () => {
  await fetchCalendarSettings()

  if (route.query.google_connected === 'true') {
    feedbackType.value = 'success'
    feedbackMessage.value =
      '¡Google Calendar vinculado y autorizado exitosamente con Google Meet!'
    toast.success('¡Google Calendar vinculado exitosamente!')
    router.replace({ path: route.path, query: {} })
    // Probar automáticamente la conexión para confirmar lectura del calendario
    handleTestCalendar()
  } else if (route.query.google_error) {
    feedbackType.value = 'error'
    feedbackMessage.value = `Error de autorización con Google: ${route.query.google_error}`
    toast.error(`Error al autorizar con Google: ${route.query.google_error}`)
    router.replace({ path: route.path, query: {} })
  }
})
</script>

<template>
  <div class="space-y-8">
    <!-- Cabecera -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span class="text-xs font-bold uppercase tracking-widest text-[#4A6B5D] block">
          Agenda & Sesiones 1:1 con la Psicóloga
        </span>
        <h2 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35] mt-1">
          Google Calendar y Horario de Consultas
        </h2>
        <p class="text-sm text-[#2C3E35]/70 mt-1">
          Conecta la agenda de Google de la psicóloga para que los alumnos puedan reservar
          sesiones de 1 hora en las clases que tú decidas, mostrando solo sus huecos libres reales.
        </p>
      </div>

      <div
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0"
        :class="
          calendarReady
            ? 'bg-[#6B8E23]/15 text-[#4A6B5D] border border-[#6B8E23]/30'
            : 'bg-[#D9826C]/15 text-[#D9826C] border border-[#D9826C]/30'
        "
      >
        <CalendarIcon class="w-4 h-4" />
        <span>
          {{
            calendarReady
              ? 'Google Calendar Sincronizado'
              : 'Google Calendar No Vinculado'
          }}
        </span>
      </div>
    </div>

    <!-- Alertas y Consola Técnica -->
    <div
      v-if="feedbackMessage"
      class="rounded-2xl p-5 border space-y-3"
      :class="
        feedbackType === 'success'
          ? 'bg-[#6B8E23]/12 border-[#6B8E23]/30 text-[#2C3E35]'
          : 'bg-[#D9826C]/15 border-[#D9826C] text-[#2C3E35]'
      "
    >
      <div class="flex items-start gap-3">
        <CheckCircle2
          v-if="feedbackType === 'success'"
          class="w-5 h-5 text-[#4A6B5D] shrink-0 mt-0.5"
        />
        <AlertCircle v-else class="w-5 h-5 text-[#D9826C] shrink-0 mt-0.5" />
        <div class="text-sm">
          <p class="font-bold">{{ feedbackMessage }}</p>
        </div>
      </div>

      <div
        v-if="detailedLog"
        class="rounded-xl bg-[#2C3E35] text-[#FAF8F5] p-4 font-mono text-xs overflow-x-auto"
      >
        <div class="flex items-center gap-2 text-[#D9826C] mb-2 font-sans font-semibold">
          <Terminal class="w-4 h-4" />
          <span>Diagnóstico de Google Calendar:</span>
        </div>
        <pre class="whitespace-pre-wrap leading-relaxed">{{ detailedLog }}</pre>
      </div>
    </div>

    <!-- Grid Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Formulario Izquierdo -->
      <form
        @submit.prevent="handleSaveSettings"
        class="lg:col-span-7 bg-white rounded-2xl border border-[#2C3E35]/10 shadow-xs p-6 sm:p-8 space-y-6"
      >
        <!-- Switch activar Calendar -->
        <div
          class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 flex items-center justify-between gap-4"
        >
          <div>
            <p class="text-sm font-bold text-[#2C3E35]">
              Habilitar Agenda de Sesiones 1:1 en el Campus
            </p>
            <p class="text-xs text-[#2C3E35]/70 mt-0.5">
              Al activarlo, podrás marcar qué clases muestran el calendario para que el alumno agende su sesión de la semana siguiente.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              v-model="settings.calendar_enabled"
              class="sr-only peer"
            />
            <div
              class="w-12 h-6 bg-[#2C3E35]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A6B5D]"
            ></div>
          </label>
        </div>

        <!-- Opción de Credenciales OAuth -->
        <div class="space-y-4">
          <label class="block text-xs font-bold uppercase tracking-wider text-[#4A6B5D]">
            Credenciales de Google Calendar & Google Meet
          </label>

          <div class="space-y-2">
            <label class="flex items-center gap-2 text-xs text-[#2C3E35] cursor-pointer">
              <input
                type="radio"
                :value="false"
                v-model="settings.calendar_use_gmail_token"
              />
              <span class="font-semibold">
                Usar credenciales dedicadas para Calendar (Recomendado con 1 Clic)
              </span>
            </label>
            <label class="flex items-center gap-2 text-xs text-[#2C3E35] cursor-pointer">
              <input
                type="radio"
                :value="true"
                v-model="settings.calendar_use_gmail_token"
              />
              <span>Reutilizar el JSON de Gmail API</span>
            </label>
          </div>

          <!-- URI de redirección requerida para Google Cloud Console -->
          <div class="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs space-y-2">
            <div class="flex items-center justify-between text-[#2C3E35]/80">
              <span class="font-bold text-[#2C3E35]">
                URI de redirección para Google Cloud Console:
              </span>
              <button
                type="button"
                @click="copyCallbackUrl"
                class="text-[#4A6B5D] hover:text-[#2C3E35] inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Check v-if="copiedCallback" class="w-3.5 h-3.5 text-[#6B8E23]" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedCallback ? 'Copiada' : 'Copiar URI' }}</span>
              </button>
            </div>
            <code class="block font-mono text-[11px] text-[#2C3E35] select-all bg-white p-2.5 rounded-lg border border-[#2C3E35]/10 break-all">
              {{ callbackUrl || `${window?.location?.origin || 'http://localhost:5001'}/api/admin/calendar/oauth-callback` }}
            </code>
            <p class="text-[10px] text-[#2C3E35]/65 leading-relaxed">
              En tu Google Cloud Console > "Credenciales" > tu ID de cliente OAuth > añade esta URL exacta en <strong>URIs de redireccionamiento autorizados</strong>.
            </p>
          </div>

          <!-- Textarea JSON Google Cloud -->
          <div v-if="!settings.calendar_use_gmail_token" class="space-y-1.5">
            <label class="block text-xs font-semibold text-[#2C3E35]/80">
              Pega aquí el JSON descargado de Google Cloud Console:
            </label>
            <textarea
              v-model="settings.calendar_token_json"
              rows="4"
              placeholder='{"web":{"client_id":"...apps.googleusercontent.com","client_secret":"..."}}'
              class="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 font-mono text-xs focus:outline-none focus:border-[#4A6B5D]"
            ></textarea>
          </div>

          <!-- BOTÓN 1-CLIC DE VINCULACIÓN CON GOOGLE -->
          <div class="pt-1 space-y-3">
            <div
              v-if="calendarReady"
              class="p-4 rounded-2xl bg-[#6B8E23]/12 border border-[#6B8E23]/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="flex items-center gap-2.5 text-[#4A6B5D] font-bold">
                <CheckCircle2 class="w-5 h-5 shrink-0" />
                <div>
                  <p>Google Calendar vinculado y autorizado</p>
                  <p class="text-[11px] font-normal text-[#2C3E35]/70">
                    Tu cuenta ya tiene permisos para consultar disponibilidad y crear videollamadas Meet.
                  </p>
                </div>
              </div>
              <button
                type="button"
                :disabled="connectingGoogle"
                @click="handleConnectGoogleOAuth"
                class="px-3.5 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-[#2C3E35] hover:bg-[#FAF8F5] text-xs font-semibold cursor-pointer transition-colors shrink-0 shadow-2xs"
              >
                Re-vincular cuenta
              </button>
            </div>

            <div v-else class="space-y-2.5">
              <button
                type="button"
                :disabled="connectingGoogle || (!settings.calendar_token_json && !settings.calendar_use_gmail_token)"
                @click="handleConnectGoogleOAuth"
                class="w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer border shadow-xs disabled:opacity-50 disabled:cursor-not-allowed bg-[#2C3E35] hover:bg-[#D9826C] text-white border-transparent"
              >
                <!-- Icono oficial de Google "G" -->
                <svg class="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>
                  {{ connectingGoogle ? 'Redirigiendo a Google...' : 'Vincular mi Google Calendar con 1 Clic' }}
                </span>
                <ExternalLink class="w-4 h-4 opacity-80" />
              </button>

              <p class="text-[11px] text-[#2C3E35]/65 text-center leading-relaxed">
                Al pulsar el botón se abrirá la pantalla oficial de Google para que elijas tu cuenta y permitas el acceso a Calendar. ¡Listo, sin configurar nada más!
              </p>
            </div>
          </div>
        </div>

        <!-- Parámetros del Calendario -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5 flex items-center justify-between">
              <span>Calendario Principal para Reservas</span>
              <span v-if="availableCalendars.length > 0" class="text-[10px] text-[#4A6B5D] font-normal">
                ({{ availableCalendars.length }} detectados)
              </span>
            </label>
            <select
              v-if="availableCalendars.length > 0"
              v-model="settings.calendar_id"
              class="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            >
              <option value="primary">primary (Calendario principal de la cuenta)</option>
              <option
                v-for="cal in availableCalendars"
                :key="cal.id"
                :value="cal.id"
              >
                {{ cal.summary }} {{ cal.primary ? '(Principal)' : '' }}
              </option>
            </select>
            <input
              v-else
              v-model="settings.calendar_id"
              type="text"
              placeholder="primary (o tu-correo@gmail.com)"
              class="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
            <p class="text-[11px] text-[#2C3E35]/65 mt-1.5 leading-relaxed">
              Las nuevas reservas con enlace a Google Meet se crearán en este calendario.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Zona Horaria de la Consulta
            </label>
            <input
              v-model="settings.calendar_timezone"
              type="text"
              placeholder="Europe/Madrid"
              class="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
            <p class="text-[11px] text-[#2C3E35]/65 mt-1.5 leading-relaxed">
              Zona horaria para calcular los turnos de consulta (ej. Europe/Madrid).
            </p>
          </div>
        </div>

        <!-- Banner Multi-calendario -->
        <div class="p-4 rounded-2xl bg-[#EBF3EF] border border-[#4A6B5D]/25 text-xs text-[#2C3E35] flex items-start gap-3">
          <Sparkles class="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-bold text-[#4A6B5D]">
              Sincronización multi-calendario activa
            </p>
            <p class="text-[11px] text-[#2C3E35]/80 leading-relaxed">
              Al comprobar la disponibilidad para los alumnos, el sistema consulta <strong>todos los calendarios de tu cuenta de Google</strong> a la vez (personal, trabajo, consultas, etc.). Si tienes un evento en cualquiera de ellos, ese hueco saldrá como ocupado automáticamente para que no se solape con nada.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Duración sesión
            </label>
            <div class="relative">
              <input
                v-model.number="settings.session_duration_minutes"
                type="number"
                min="15"
                max="180"
                step="15"
                class="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm text-center font-bold"
              />
              <span class="text-[11px] text-[#2C3E35]/60 block text-center mt-1">minutos</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Antelación mínima
            </label>
            <div class="relative">
              <input
                v-model.number="settings.booking_min_notice_hours"
                type="number"
                min="0"
                max="168"
                class="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm text-center font-bold"
              />
              <span class="text-[11px] text-[#2C3E35]/60 block text-center mt-1">horas antes</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Límite cancelación
            </label>
            <div class="relative">
              <input
                v-model.number="settings.booking_cancel_limit_hours"
                type="number"
                min="0"
                max="168"
                class="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm text-center font-bold"
              />
              <span class="text-[11px] text-[#2C3E35]/60 block text-center mt-1">horas antes</span>
            </div>
          </div>
        </div>

        <!-- Horario Laboral Configurable -->
        <div class="space-y-3 pt-3 border-t border-[#2C3E35]/10">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D] block">
                Horario Laboral de la Consulta (Días y Franjas)
              </span>
              <p class="text-xs text-[#2C3E35]/65">
                Solo se ofrecerán huecos dentro de estos tramos que estén LIBRES en Google Calendar.
              </p>
            </div>
          </div>

          <div class="space-y-2.5">
            <div
              v-for="day in weekdayLabels"
              :key="day.day"
              class="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#2C3E35]">
                  {{ day.label }}
                </span>
                <button
                  type="button"
                  @click="addRange(day.day)"
                  class="text-[11px] font-semibold text-[#4A6B5D] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus class="w-3 h-3" />
                  <span>Añadir tramo</span>
                </button>
              </div>

              <div
                v-if="settings.working_hours[day.day]?.length === 0"
                class="text-[11px] text-[#2C3E35]/50 italic"
              >
                Sin disponibilidad (Día libre)
              </div>

              <div
                v-for="(range, idx) in settings.working_hours[day.day]"
                :key="idx"
                class="flex items-center gap-2"
              >
                <input
                  v-model="range[0]"
                  type="time"
                  class="px-2 py-1 rounded bg-white border border-[#2C3E35]/15 text-xs font-mono"
                />
                <span class="text-xs text-[#2C3E35]/60">a</span>
                <input
                  v-model="range[1]"
                  type="time"
                  class="px-2 py-1 rounded bg-white border border-[#2C3E35]/15 text-xs font-mono"
                />
                <button
                  type="button"
                  @click="removeRange(day.day, idx)"
                  class="p-1 text-[#D9826C] hover:bg-[#D9826C]/10 rounded cursor-pointer"
                  title="Eliminar tramo"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Botón Probar Conexión -->
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            :disabled="testing"
            @click="handleTestCalendar"
            class="w-full py-3.5 px-6 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': testing }" />
            <span>{{ testing ? 'Verificando...' : 'Probar Conexión con Calendar' }}</span>
          </button>
        </div>
      </form>

      <!-- Guía Lateral -->
      <div
        class="lg:col-span-5 bg-white rounded-2xl border border-[#2C3E35]/10 shadow-xs overflow-hidden"
      >
        <button
          type="button"
          @click="showGuide = !showGuide"
          class="w-full p-6 bg-[#2C3E35] text-[#FAF8F5] flex items-center justify-between text-left cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-[#D9826C] text-white flex items-center justify-center shrink-0"
            >
              <BookOpen class="w-5 h-5" />
            </div>
            <div>
              <span class="text-[11px] uppercase tracking-widest text-[#D9826C] font-bold block">
                Guía Paso a Paso
              </span>
              <h2 class="font-editorial text-2xl font-semibold">
                Google Calendar + Google Meet
              </h2>
            </div>
          </div>
          <ChevronUp v-if="showGuide" class="w-5 h-5 text-[#FAF8F5]/70" />
          <ChevronDown v-else class="w-5 h-5 text-[#FAF8F5]/70" />
        </button>

        <div v-if="showGuide" class="p-6 space-y-4">
          <div class="space-y-3">
            <div
              v-for="item in calendarSteps"
              :key="item.step"
              class="rounded-2xl border border-[#2C3E35]/10 overflow-hidden"
            >
              <button
                type="button"
                @click="activeStep = activeStep === item.step ? 0 : item.step"
                class="w-full p-4 bg-[#FAF8F5] hover:bg-[#F3EFEA] flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="w-6 h-6 rounded-full bg-[#4A6B5D] text-white text-xs font-bold flex items-center justify-center shrink-0"
                  >
                    {{ item.step }}
                  </span>
                  <span class="text-xs sm:text-sm font-semibold text-[#2C3E35]">
                    {{ item.title }}
                  </span>
                </div>
                <ChevronUp v-if="activeStep === item.step" class="w-4 h-4 text-[#4A6B5D] shrink-0" />
                <ChevronDown v-else class="w-4 h-4 text-[#4A6B5D] shrink-0" />
              </button>

              <div
                v-if="activeStep === item.step"
                class="p-4 bg-white border-t border-[#2C3E35]/10 space-y-2"
              >
                <ul class="space-y-2 text-xs text-[#2C3E35]/85 list-disc pl-4">
                  <li v-for="(line, idx) in item.details" :key="idx" class="leading-relaxed">
                    {{ line }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            class="p-4 rounded-2xl bg-[#6B8E23]/10 border border-[#6B8E23]/25 text-xs text-[#2C3E35] flex items-start gap-2.5"
          >
            <Video class="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5" />
            <p class="leading-relaxed">
              <strong>Google Meet Automático:</strong> Cuando el alumno confirme la reserva,
              se creará automáticamente el evento en tu Google Calendar con un enlace único de
              Google Meet y ambos recibiréis un correo con todos los detalles.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- BARRA FLOTANTE DE GUARDADO (GOOGLE CALENDAR) -->
    <Teleport to="body">
      <div
        v-if="isDirty"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl"
      >
        <div class="bg-[#24332B] text-white rounded-2xl px-5 py-3.5 shadow-2xl border border-white/15 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-[#D9826C] animate-pulse shrink-0"></span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-white truncate">
                Cambios sin guardar en Google Calendar
              </p>
              <p class="text-[11px] text-white/65 truncate">
                Guarda para aplicar los nuevos horarios o ajustes
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              :disabled="saving"
              @click="fetchCalendarSettings"
              class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/18 text-white/85 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Descartar
            </button>
            <button
              type="button"
              :disabled="saving"
              @click="handleSaveSettings"
              class="px-4 py-2 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save class="w-3.5 h-3.5" />
              <span>{{ saving ? 'Guardando...' : 'Guardar Cambios' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
