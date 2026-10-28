<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import {
  Mail,
  Server,
  KeyRound,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Terminal,
  BookOpen,
  Sparkles,
  Copy,
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const showGuide = ref(true)
const activeStep = ref(1)

const settings = reactive({
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  use_gmail_api: false,
  gmail_token_json: '',
})

const testRecipient = ref('')
const logType = ref('success') // 'success' | 'error' (estado de la última prueba)
const detailedLog = ref('')

const gmailSteps = [
  {
    step: 1,
    title: 'Crear Proyecto y Habilitar Gmail API en Google Cloud Console',
    details: [
      'Entra en console.cloud.google.com e inicia sesión con la cuenta de Gmail de la consulta.',
      'Crea un proyecto nuevo (ej. "VuelveATi-Mailer") y entra en "APIs y Servicios > Biblioteca".',
      'Busca "Gmail API" y pulsa en "Habilitar".',
    ],
  },
  {
    step: 2,
    title: 'Configurar Pantalla de Consentimiento OAuth y Crear credentials.json',
    details: [
      'Ve a "Pantalla de consentimiento de OAuth", selecciona tipo "Externo" y añade tu propio correo en la lista de "Usuarios de prueba" (Test users).',
      'Ve a "Credenciales > + Crear Credenciales > ID de cliente de OAuth".',
      'Elige tipo de aplicación "Aplicación de escritorio" (Desktop App) o "Aplicación web" (añadiendo https://developers.google.com/oauthplayground como URI de redirección autorizada).',
      'Descarga el archivo credentials.json que contiene tu client_id y client_secret.',
    ],
  },
  {
    step: 3,
    title: 'Obtener el refresh_token permanente',
    details: [
      'Opción A (Sin código): Abre developers.google.com/oauthplayground, pulsa el icono de engranaje arriba a la derecha, marca "Use your own OAuth credentials" e introduce tu Client ID y Client Secret.',
      'En el Paso 1 de OAuth Playground, escribe el scope: https://www.googleapis.com/auth/gmail.send y autoriza tu cuenta.',
      'En el Paso 2, pulsa "Exchange authorization code for tokens" y copia el valor de "refresh_token".',
      'Opción B (Con Python local): Ejecuta InstalledAppFlow.from_client_secrets_file("credentials.json", ["https://www.googleapis.com/auth/gmail.send"]).run_local_server(port=0) e imprime creds.to_json().',
    ],
  },
  {
    step: 4,
    title: 'Pegar el JSON consolidado en el campo inferior',
    details: [
      'Activa el interruptor "Usar Gmail API (OAuth 2.0)" en este panel.',
      'Pega el JSON con client_id, client_secret y refresh_token (puedes usar la plantilla de ejemplo inferior) y pulsa "Probar Conexión de Correo".',
    ],
  },
]

const sampleJsonTemplate = JSON.stringify(
  {
    client_id: 'TU_CLIENT_ID.apps.googleusercontent.com',
    client_secret: 'GOCSPX-TU_CLIENT_SECRET',
    refresh_token: '1//04_TU_REFRESH_TOKEN_PERMANENTE',
    token_uri: 'https://oauth2.googleapis.com/token',
  },
  null,
  2
)

function insertTemplate() {
  settings.gmail_token_json = sampleJsonTemplate
  settings.use_gmail_api = true
}

async function fetchSettings() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/email-settings')
    if (data.settings) {
      Object.assign(settings, data.settings)
      if (!testRecipient.value && data.settings.smtp_user) {
        testRecipient.value = data.settings.smtp_user
      }
    }
  } catch (err) {
    toast.error(
      err.response?.data?.error ||
        'No se pudo cargar la configuración de correo desde el servidor.'
    )
  } finally {
    loading.value = false
  }
}

async function handleSaveSettings() {
  saving.value = true
  try {
    const { data } = await api.put('/admin/email-settings', settings)
    toast.success(
      data.message || 'Configuración de correo guardada correctamente.',
      { title: 'Configuración guardada' }
    )
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'Error al guardar la configuración.',
      { title: 'No se pudo guardar' }
    )
  } finally {
    saving.value = false
  }
}

async function handleTestConnection() {
  testing.value = true
  detailedLog.value = ''
  try {
    const payload = {
      ...settings,
      test_recipient: testRecipient.value || settings.smtp_user,
    }
    const { data } = await api.post('/admin/email-settings/test', payload)
    logType.value = 'success'
    detailedLog.value = data.log || ''
    toast.success(data.message || 'Correo de prueba enviado.', {
      title: 'Conexión de correo correcta',
    })
  } catch (err) {
    logType.value = 'error'
    detailedLog.value =
      err.response?.data?.log ||
      '[ERROR] No se pudo conectar con el servidor backend.'
    toast.error(
      err.response?.data?.message ||
        err.response?.data?.error ||
        'Fallo en la prueba de conexión de correo.',
      { title: 'Fallo en la prueba de correo' }
    )
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Cabecera de Sección -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span
          class="text-xs font-bold uppercase tracking-widest text-[#4A6B5D] block"
        >
          Servicio de Correo & Notificaciones
        </span>
        <h2 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35] mt-1">
          Configuración de Correo Electrónico
        </h2>
        <p class="text-sm text-[#2C3E35]/70 mt-1">
          Define el canal de salida para las altas de alumnos y notificaciones del
          formulario de contacto (SMTP tradicional o Gmail OAuth2 API).
        </p>
      </div>
    </div>

    <!-- Consola de Log Técnico (resultado de la última prueba) -->
    <div
      v-if="detailedLog"
      class="rounded-2xl bg-[#2C3E35] text-[#FAF8F5] p-4 font-mono text-xs overflow-x-auto border-l-4"
      :class="logType === 'success' ? 'border-[#6B8E23]' : 'border-[#D9826C]'"
    >
      <div class="flex items-center justify-between gap-2 mb-2 font-sans font-semibold">
        <div class="flex items-center gap-2 text-[#D9826C]">
          <Terminal class="w-4 h-4" />
          <span>Registro detallado de diagnóstico (SMTP / Gmail API):</span>
        </div>
        <button
          type="button"
          @click="detailedLog = ''"
          class="text-[11px] text-[#FAF8F5]/60 hover:text-white cursor-pointer"
        >
          Ocultar
        </button>
      </div>
      <pre class="whitespace-pre-wrap leading-relaxed">{{ detailedLog }}</pre>
    </div>

    <!-- Formulario Principal de Configuración -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <form
        @submit.prevent="handleSaveSettings"
        class="lg:col-span-7 bg-white rounded-2xl border border-[#2C3E35]/10 shadow-xs p-6 sm:p-8 space-y-6"
      >
        <!-- Selector de Modo (SMTP vs Gmail API) -->
        <div
          class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 flex items-center justify-between gap-4"
        >
          <div>
            <p class="text-sm font-bold text-[#2C3E35]">
              Usar Integración Oficial Gmail API (OAuth 2.0)
            </p>
            <p class="text-xs text-[#2C3E35]/70 mt-0.5">
              Si está activo, se enviará mediante token OAuth2 JSON en lugar de contraseña SMTP.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="settings.use_gmail_api"
              class="sr-only peer"
            />
            <div
              class="w-12 h-6 bg-[#2C3E35]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A6B5D]"
            ></div>
          </label>
        </div>

        <!-- Bloque 1: Parámetros SMTP Básicos -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A6B5D]">
            <Server class="w-4 h-4" />
            <span>Parámetros del Servidor SMTP</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
                Host SMTP
              </label>
              <input
                v-model="settings.smtp_host"
                type="text"
                placeholder="smtp.gmail.com"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
                Puerto SMTP
              </label>
              <input
                v-model.number="settings.smtp_port"
                type="number"
                placeholder="587"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
                Usuario / Correo Remitente
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3" />
                <input
                  v-model="settings.smtp_user"
                  type="email"
                  placeholder="consulta@vuelveati.com"
                  class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
                Contraseña SMTP / App Password
              </label>
              <div class="relative">
                <KeyRound
                  class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3"
                />
                <input
                  v-model="settings.smtp_password"
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx"
                  class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Bloque 2: Token JSON de Gmail API -->
        <div class="space-y-2 pt-2 border-t border-[#2C3E35]/10">
          <div class="flex items-center justify-between">
            <label
              class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D]"
            >
              Credenciales Gmail Token JSON (credentials.json + refresh_token)
            </label>
            <button
              type="button"
              @click="insertTemplate"
              class="inline-flex items-center gap-1 text-xs font-semibold text-[#D9826C] hover:underline cursor-pointer"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>Insertar plantilla JSON</span>
            </button>
          </div>
          <textarea
            v-model="settings.gmail_token_json"
            rows="6"
            placeholder='{"client_id": "...", "client_secret": "...", "refresh_token": "..."}'
            class="w-full p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 font-mono text-xs focus:outline-none focus:border-[#4A6B5D]"
          ></textarea>
        </div>

        <!-- Botón Guardar -->
        <div class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 py-3.5 px-6 rounded-2xl bg-[#4A6B5D] hover:bg-[#2C3E35] disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Save class="w-4 h-4" />
            <span>
              {{
                saving
                  ? 'Guardando en Base de Datos...'
                  : 'Guardar Configuración en MySQL'
              }}
            </span>
          </button>
        </div>

        <!-- Sección Probar Conexión de Correo -->
        <div
          class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#D9826C]/30 space-y-3"
        >
          <p class="text-xs font-bold uppercase tracking-wider text-[#D9826C]">
            Verificación en Tiempo Real
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="testRecipient"
              type="email"
              placeholder="Correo destinatario para la prueba..."
              class="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#D9826C]"
            />
            <button
              type="button"
              :disabled="testing"
              @click="handleTestConnection"
              class="py-2.5 px-5 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] disabled:opacity-60 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer"
            >
              <Send class="w-4 h-4" />
              <span>
                {{
                  testing
                    ? 'Probando conexión...'
                    : 'Probar Conexión de Correo'
                }}
              </span>
            </button>
          </div>
        </div>
      </form>

      <!-- Guía Interactiva Integradora de Gmail Token API -->
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
                Guía Interactiva Paso a Paso
              </span>
              <h2 class="font-editorial text-2xl font-semibold">
                Cómo obtener credentials.json y refresh_token
              </h2>
            </div>
          </div>
          <ChevronUp v-if="showGuide" class="w-5 h-5 text-[#FAF8F5]/70" />
          <ChevronDown v-else class="w-5 h-5 text-[#FAF8F5]/70" />
        </button>

        <div v-if="showGuide" class="p-6 space-y-4">
          <p class="text-xs text-[#2C3E35]/75 leading-relaxed">
            Haz clic en cada fase para desplegar las instrucciones exactas de
            <strong>Google Cloud Console</strong>:
          </p>

          <div class="space-y-3">
            <div
              v-for="item in gmailSteps"
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
                <ChevronUp
                  v-if="activeStep === item.step"
                  class="w-4 h-4 text-[#4A6B5D] shrink-0"
                />
                <ChevronDown
                  v-else
                  class="w-4 h-4 text-[#4A6B5D] shrink-0"
                />
              </button>

              <div
                v-if="activeStep === item.step"
                class="p-4 bg-white border-t border-[#2C3E35]/10 space-y-2"
              >
                <ul class="space-y-2 text-xs text-[#2C3E35]/85 list-disc pl-4">
                  <li
                    v-for="(line, idx) in item.details"
                    :key="idx"
                    class="leading-relaxed"
                  >
                    {{ line }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            class="p-4 rounded-2xl bg-[#6B8E23]/10 border border-[#6B8E23]/25 text-xs text-[#2C3E35] flex items-start gap-2.5"
          >
            <Sparkles class="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5" />
            <p class="leading-relaxed">
              <strong>Consejo rápido:</strong> Si prefieres usar SMTP estándar con
              Gmail, genera una <em>"Contraseña de Aplicación"</em> de 16 letras en
              la seguridad de tu cuenta de Google y desactiva el interruptor OAuth2.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
