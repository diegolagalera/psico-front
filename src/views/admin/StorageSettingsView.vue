<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import {
  HardDrive,
  Cloud,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  Terminal,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const showGuide = ref(true)
const activeStep = ref(1)
const s3Ready = ref(false)

const settings = reactive({
  s3_enabled: false,
  s3_provider: 'cloudflare_r2',
  s3_endpoint_url: '',
  s3_region: 'auto',
  s3_bucket_name: '',
  s3_access_key_id: '',
  s3_secret_access_key: '',
  presigned_url_expiration: 1800,
})

const logType = ref('success') // estado de la última prueba
const detailedLog = ref('')

const r2Steps = [
  {
    step: 1,
    title: 'Crear cuenta en Cloudflare y abrir R2 Object Storage',
    details: [
      'Entra en dash.cloudflare.com y regístrate o inicia sesión.',
      'En el menú lateral izquierdo, haz clic en "R2 Object Storage" y activa R2 (incluye 10 GB gratis/mes y 0 € por tráfico de reproducción de vídeo).',
    ],
  },
  {
    step: 2,
    title: 'Crear tu Bucket Privado para los vídeos y recursos',
    details: [
      'Haz clic en el botón "Create bucket".',
      'Ponle un nombre sin espacios, por ejemplo: vuelve-a-ti-cursos',
      'Deja el acceso público DESACTIVADO (por defecto todos los buckets R2 son 100% privados).',
    ],
  },
  {
    step: 3,
    title: 'Copiar el Endpoint S3 API de tu cuenta',
    details: [
      'Dentro de tu bucket en Cloudflare R2, entra en la pestaña "Settings".',
      'En el apartado "S3 API" o "Bucket Details", copia la URL del Endpoint (tiene el formato: https://<ID_DE_TU_CUENTA>.r2.cloudflarestorage.com).',
      'Pégala en el campo "Endpoint S3 URL" de este panel (sin añadir el nombre del bucket al final).',
    ],
  },
  {
    step: 4,
    title: 'Generar las claves Access Key ID y Secret Access Key',
    details: [
      'Vuelve a la página principal de "R2 Object Storage" y pulsa arriba a la derecha en "Manage R2 API Tokens".',
      'Haz clic en "Create API Token".',
      'En "Permissions", selecciona "Object Read & Write" (Lectura y escritura de objetos) y aplica al bucket vuelve-a-ti-cursos.',
      'Al crear el token, Cloudflare te mostrará el "Access Key ID" y el "Secret Access Key". Cópialos en este formulario.',
    ],
  },
  {
    step: 5,
    title: 'Activar el interruptor y pulsar "Probar Conexión S3 / R2"',
    details: [
      'Activa la casilla "Activar almacenamiento en la nube S3 / Cloudflare R2", guarda en MySQL y pulsa "Probar Conexión con el Bucket".',
      '¡Listo! Todos los vídeos y PDFs que subas en "Gestión de Cursos" se almacenarán de forma privada y se servirán con enlaces firmados temporales anti-descarga.',
    ],
  },
]

async function fetchStorageSettings() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/storage-settings')
    if (data.settings) {
      Object.assign(settings, data.settings)
    }
    s3Ready.value = Boolean(data.s3_ready)
  } catch (err) {
    toast.error(
      err.response?.data?.error ||
        'No se pudo cargar la configuración de almacenamiento.'
    )
  } finally {
    loading.value = false
  }
}

async function handleSaveStorage() {
  saving.value = true
  try {
    const { data } = await api.put('/admin/storage-settings', settings)
    s3Ready.value = Boolean(data.s3_ready)
    toast.success(
      data.message || 'Configuración de almacenamiento guardada.',
      { title: 'Configuración guardada' }
    )
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'Error al guardar la configuración S3/R2.',
      { title: 'No se pudo guardar' }
    )
  } finally {
    saving.value = false
  }
}

async function handleTestS3() {
  testing.value = true
  detailedLog.value = ''
  try {
    const { data } = await api.post('/admin/storage-settings/test', settings)
    logType.value = 'success'
    detailedLog.value = data.log || ''
    toast.success(data.message || 'Conexión con el bucket verificada.', {
      title: 'Bucket conectado',
    })
  } catch (err) {
    logType.value = 'error'
    detailedLog.value = err.response?.data?.log || ''
    toast.error(
      err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al conectar con el bucket S3 / Cloudflare R2.',
      { title: 'Fallo en la conexión S3 / R2' }
    )
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  fetchStorageSettings()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Cabecera -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span
          class="text-xs font-bold uppercase tracking-widest text-[#4A6B5D] block"
        >
          Infraestructura de Vídeo & Recursos · Cloudflare R2 / S3
        </span>
        <h2 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35] mt-1">
          Almacenamiento Seguro en la Nube (S3 / R2)
        </h2>
        <p class="text-sm text-[#2C3E35]/70 mt-1">
          Conecta tu bucket privado de <strong>Cloudflare R2</strong> (o AWS S3) para alojar las
          horas de vídeo del curso y los PDFs con enlaces firmados temporales anti-descarga.
        </p>
      </div>

      <div
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0"
        :class="
          s3Ready
            ? 'bg-[#6B8E23]/15 text-[#4A6B5D] border border-[#6B8E23]/30'
            : 'bg-[#D9826C]/15 text-[#D9826C] border border-[#D9826C]/30'
        "
      >
        <Cloud class="w-4 h-4" />
        <span>
          {{
            s3Ready
              ? 'Cloudflare R2 / S3 Activo y Conectado'
              : 'Modo Local Protegido (R2 pendiente de activar)'
          }}
        </span>
      </div>
    </div>

    <!-- Consola Técnica (resultado de la última prueba) -->
    <div
      v-if="detailedLog"
      class="rounded-2xl bg-[#2C3E35] text-[#FAF8F5] p-4 font-mono text-xs overflow-x-auto border-l-4"
      :class="logType === 'success' ? 'border-[#6B8E23]' : 'border-[#D9826C]'"
    >
      <div class="flex items-center justify-between gap-2 mb-2 font-sans font-semibold">
        <div class="flex items-center gap-2 text-[#D9826C]">
          <Terminal class="w-4 h-4" />
          <span>Registro de diagnóstico S3v4 (PUT / Presigned GET / DELETE):</span>
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

    <!-- Grid Principal -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Formulario Izquierdo -->
      <form
        @submit.prevent="handleSaveStorage"
        class="lg:col-span-7 bg-white rounded-2xl border border-[#2C3E35]/10 shadow-xs p-6 sm:p-8 space-y-6"
      >
        <!-- Switch activar S3 -->
        <div
          class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 flex items-center justify-between gap-4"
        >
          <div>
            <p class="text-sm font-bold text-[#2C3E35]">
              Activar Almacenamiento en Bucket Privado S3 / Cloudflare R2
            </p>
            <p class="text-xs text-[#2C3E35]/70 mt-0.5">
              Mientras esté desactivado, puedes seguir subiendo vídeos y PDFs de prueba en el
              servidor local protegido sin bloquearte.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              v-model="settings.s3_enabled"
              class="sr-only peer"
            />
            <div
              class="w-12 h-6 bg-[#2C3E35]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A6B5D]"
            ></div>
          </label>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Proveedor Compatible S3
            </label>
            <select
              v-model="settings.s3_provider"
              class="w-full px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            >
              <option value="cloudflare_r2">Cloudflare R2 (Recomendado · 0€ tráfico)</option>
              <option value="aws_s3">Amazon AWS S3</option>
              <option value="digitalocean">DigitalOcean Spaces</option>
              <option value="other_s3">Otro S3 Compatible (MinIO / Backblaze)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Región del Bucket
            </label>
            <input
              v-model="settings.s3_region"
              type="text"
              placeholder="auto (en Cloudflare R2 usa 'auto')"
              class="w-full px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Endpoint S3 URL *
            </label>
            <input
              v-model="settings.s3_endpoint_url"
              type="text"
              placeholder="https://<TU_ACCOUNT_ID>.r2.cloudflarestorage.com"
              class="w-full px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm font-mono focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Nombre del Bucket *
            </label>
            <input
              v-model="settings.s3_bucket_name"
              type="text"
              placeholder="vuelve-a-ti-cursos"
              class="w-full px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm font-mono focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Access Key ID *
            </label>
            <div class="relative">
              <KeyRound class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3" />
              <input
                v-model="settings.s3_access_key_id"
                type="text"
                placeholder="Tu Access Key ID de R2 / S3"
                class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#4A6B5D]"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Secret Access Key *
            </label>
            <div class="relative">
              <KeyRound class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3" />
              <input
                v-model="settings.s3_secret_access_key"
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#4A6B5D]"
              />
            </div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D]">
              Seguridad Anti-Compartir: Caducidad de Enlaces de Vídeo (Segundos)
            </label>
            <span class="text-xs font-semibold text-[#D9826C]">
              {{ Math.round((settings.presigned_url_expiration || 1800) / 60) }} minutos
            </span>
          </div>
          <input
            v-model.number="settings.presigned_url_expiration"
            type="number"
            min="300"
            max="14400"
            step="300"
            class="w-full px-4 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
          />
          <p class="text-[11px] text-[#2C3E35]/65">
            Cada vez que un alumno abre una clase, el sistema genera una firma única que caduca
            automáticamente tras este tiempo para impedir que el enlace pueda compartirse con terceros.
          </p>
        </div>

        <!-- Botones Guardar y Probar -->
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 py-3.5 px-6 rounded-2xl bg-[#4A6B5D] hover:bg-[#2C3E35] disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Save class="w-4 h-4" />
            <span>
              {{ saving ? 'Guardando...' : 'Guardar Configuración S3 / R2' }}
            </span>
          </button>

          <button
            type="button"
            :disabled="testing"
            @click="handleTestS3"
            class="py-3.5 px-6 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': testing }" />
            <span>
              {{ testing ? 'Verificando Bucket...' : 'Probar Conexión con el Bucket' }}
            </span>
          </button>
        </div>
      </form>

      <!-- Guía Paso a Paso Cloudflare R2 -->
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
                Guía Rápida en 5 Pasos
              </span>
              <h2 class="font-editorial text-2xl font-semibold">
                Cómo configurar Cloudflare R2 Gratis
              </h2>
            </div>
          </div>
          <ChevronUp v-if="showGuide" class="w-5 h-5 text-[#FAF8F5]/70" />
          <ChevronDown v-else class="w-5 h-5 text-[#FAF8F5]/70" />
        </button>

        <div v-if="showGuide" class="p-6 space-y-4">
          <div class="space-y-3">
            <div
              v-for="item in r2Steps"
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
            <ShieldCheck class="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5" />
            <p class="leading-relaxed">
              <strong>Protección Anti-Descarga:</strong> No necesitas configurar políticas CORS
              complejas; nuestro servidor firma las subidas y genera enlaces efímeros con
              marca de agua dinámica del alumno sobre el reproductor.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
