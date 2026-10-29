<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { toast } from '@/composables/useToast'
import {
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Smartphone,
  Monitor,
  Upload,
  FileText,
  PlayCircle,
  Headphones,
  Image as ImageIcon,
  Users,
  Download,
  Search,
  Instagram,
  CheckCircle2,
  Clock,
  Mail,
  Save,
  RotateCcw,
  X,
  Heading2,
  Quote,
  List,
} from 'lucide-vue-next'

const activeMainTab = ref('editor') // 'editor' | 'leads'
const loading = ref(true)
const saving = ref(false)

// Datos del servidor
const resources = ref([])
const stats = ref({
  total_resources: 0,
  total_leads: 0,
  total_views: 0,
  total_unlocks: 0,
})
const selectedResourceId = ref(null)

// Estado del formulario reactivo y snapshot para detectar cambios (dirty tracking)
const form = ref(createEmptyResourceForm())
const savedSnapshot = ref('')

// Estado de la Live Preview
const previewMode = ref('unlocked') // 'locked' | 'unlocked'
const previewDevice = ref('desktop') // 'desktop' | 'mobile'

// Subidas de archivos en curso
const uploadingCover = ref(false)
const uploadingPdf = ref(false)
const uploadingVideo = ref(false)
const uploadingAudio = ref(false)
const uploadingGallery = ref(false)

// Visor Modal de PDF
const pdfModal = ref({
  open: false,
  title: '',
  url: '',
})

// Modal para Crear Nuevo Recurso
const newResourceModal = ref({
  open: false,
  title: '',
  category: 'Ansiedad & Sueño',
  instagram_keyword: 'RECURSO',
  creating: false,
})

// Datos de Leads / Suscriptores de Email Marketing
const leads = ref([])
const leadsLoading = ref(false)
const leadSearch = ref('')
const leadResourceFilter = ref('all')

function createEmptyResourceForm() {
  return {
    id: null,
    title: '',
    slug: '',
    subtitle: '',
    category: 'Regulación Emocional',
    instagram_keyword: 'RECURSO',
    read_time_minutes: 5,
    is_published: true,
    is_featured: false,
    cover_image_url: '',
    cover_storage_provider: '',
    cover_object_key: '',
    cover_resolved_url: '',
    teaser_text: '',
    content_body: '',
    key_takeaways: [],
    gallery_images: [],
    video_external_url: '',
    video_storage_provider: '',
    video_object_key: '',
    video_original_name: '',
    video_mime_type: 'video/mp4',
    video_stream_url: '',
    audio_title: '',
    audio_storage_provider: '',
    audio_object_key: '',
    audio_original_name: '',
    audio_mime_type: 'audio/mpeg',
    audio_stream_url: '',
    pdf_title: '',
    pdf_storage_provider: '',
    pdf_object_key: '',
    pdf_original_name: '',
    pdf_file_size_bytes: 0,
    pdf_preview_url: '',
    pdf_download_url: '',
  }
}

function serializeFormForDirtyCheck(f) {
  if (!f || !f.id) return ''
  return JSON.stringify({
    title: f.title,
    slug: f.slug,
    subtitle: f.subtitle,
    category: f.category,
    instagram_keyword: f.instagram_keyword,
    read_time_minutes: Number(f.read_time_minutes || 5),
    is_published: Boolean(f.is_published),
    is_featured: Boolean(f.is_featured),
    cover_image_url: f.cover_image_url,
    cover_storage_provider: f.cover_storage_provider,
    cover_object_key: f.cover_object_key,
    teaser_text: f.teaser_text,
    content_body: f.content_body,
    key_takeaways: f.key_takeaways || [],
    gallery_images: (f.gallery_images || []).map((g) => ({
      url: g.url || '',
      caption: g.caption || '',
      storage_provider: g.storage_provider || '',
      object_key: g.object_key || '',
    })),
    video_external_url: f.video_external_url,
    video_storage_provider: f.video_storage_provider,
    video_object_key: f.video_object_key,
    audio_title: f.audio_title,
    audio_storage_provider: f.audio_storage_provider,
    audio_object_key: f.audio_object_key,
    pdf_title: f.pdf_title,
    pdf_storage_provider: f.pdf_storage_provider,
    pdf_object_key: f.pdf_object_key,
  })
}

const isDirty = computed(() => {
  if (!form.value.id || !savedSnapshot.value) return false
  return serializeFormForDirtyCheck(form.value) !== savedSnapshot.value
})

function populateFormFromResource(res) {
  if (!res) {
    form.value = createEmptyResourceForm()
    savedSnapshot.value = ''
    return
  }
  form.value = {
    id: res.id,
    title: res.title || '',
    slug: res.slug || '',
    subtitle: res.subtitle || '',
    category: res.category || 'Regulación Emocional',
    instagram_keyword: res.instagram_keyword || 'RECURSO',
    read_time_minutes: res.read_time_minutes || 5,
    is_published: Boolean(res.is_published),
    is_featured: Boolean(res.is_featured),
    cover_image_url: res.cover_image_url || '',
    cover_storage_provider: res.cover_storage_provider || '',
    cover_object_key: res.cover_object_key || '',
    cover_resolved_url: res.cover_resolved_url || res.cover_image_url || '',
    teaser_text: res.teaser_text || '',
    content_body: res.content_body || '',
    key_takeaways: Array.isArray(res.key_takeaways) ? [...res.key_takeaways] : [],
    gallery_images: Array.isArray(res.gallery_images)
      ? res.gallery_images.map((g) => ({ ...g }))
      : [],
    video_external_url: res.video_external_url || '',
    video_storage_provider: res.video_storage_provider || '',
    video_object_key: res.video_object_key || '',
    video_original_name: res.video_original_name || '',
    video_mime_type: res.video_mime_type || 'video/mp4',
    video_stream_url: res.video_stream_url || '',
    audio_title: res.audio_title || '',
    audio_storage_provider: res.audio_storage_provider || '',
    audio_object_key: res.audio_object_key || '',
    audio_original_name: res.audio_original_name || '',
    audio_mime_type: res.audio_mime_type || 'audio/mpeg',
    audio_stream_url: res.audio_stream_url || '',
    pdf_title: res.pdf_title || '',
    pdf_storage_provider: res.pdf_storage_provider || '',
    pdf_object_key: res.pdf_object_key || '',
    pdf_original_name: res.pdf_original_name || '',
    pdf_file_size_bytes: res.pdf_file_size_bytes || 0,
    pdf_preview_url: res.pdf_preview_url || '',
    pdf_download_url: res.pdf_download_url || '',
  }
  savedSnapshot.value = serializeFormForDirtyCheck(form.value)
}

async function fetchAdminResources({ silent = false } = {}) {
  if (!silent) loading.value = true
  try {
    const { data } = await api.get('/admin/public-resources')
    resources.value = data.resources || []
    if (data.stats) stats.value = data.stats

    if (resources.value.length > 0) {
      const target =
        resources.value.find((r) => r.id === selectedResourceId.value) ||
        resources.value[0]
      selectedResourceId.value = target.id
      populateFormFromResource(target)
    } else {
      selectedResourceId.value = null
      populateFormFromResource(null)
    }
  } catch (err) {
    toast.error('Error al cargar los recursos del foro.')
  } finally {
    if (!silent) loading.value = false
  }
}

async function fetchLeads() {
  leadsLoading.value = true
  try {
    const { data } = await api.get('/admin/marketing-leads')
    leads.value = data.leads || []
    if (data.stats) {
      stats.value.total_leads = data.stats.total_leads
      stats.value.total_unlocks = data.stats.total_unlocks
    }
  } catch (err) {
    toast.error('No se pudieron cargar los suscriptores de email marketing.')
  } finally {
    leadsLoading.value = false
  }
}

function selectResource(res) {
  if (isDirty.value) {
    if (
      !window.confirm(
        'Tienes cambios sin guardar en este recurso. ¿Deseas cambiar de recurso y descartar los cambios?'
      )
    ) {
      return
    }
  }
  selectedResourceId.value = res.id
  populateFormFromResource(res)
}

function discardChanges() {
  const current = resources.value.find((r) => r.id === selectedResourceId.value)
  if (current) {
    populateFormFromResource(current)
    toast.info('Cambios descartados.')
  }
}

async function saveResource() {
  if (!form.value.id) return
  saving.value = true
  try {
    const { data } = await api.put(
      `/admin/public-resources/${form.value.id}`,
      form.value
    )
    const updated = data.resource
    const idx = resources.value.findIndex((r) => r.id === updated.id)
    if (idx !== -1) {
      resources.value[idx] = updated
    }
    populateFormFromResource(updated)
    toast.success('Recurso actualizado correctamente.')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al guardar el recurso.')
  } finally {
    saving.value = false
  }
}

async function togglePublishStatus() {
  if (!form.value.id) return
  const nextState = !form.value.is_published
  form.value.is_published = nextState
  try {
    const { data } = await api.put(`/admin/public-resources/${form.value.id}`, {
      is_published: nextState,
    })
    const updated = data.resource
    const idx = resources.value.findIndex((r) => r.id === updated.id)
    if (idx !== -1) {
      resources.value[idx].is_published = updated.is_published
    }
    savedSnapshot.value = serializeFormForDirtyCheck(form.value)
    toast.success(
      nextState
        ? 'Recurso ACTIVADO: ya es visible en el Foro público.'
        : 'Recurso OCULTO: se ha desactivado de la web sin borrar sus datos.'
    )
  } catch (err) {
    form.value.is_published = !nextState
    toast.error('No se pudo cambiar la visibilidad del recurso.')
  }
}

async function handleCreateNewResource() {
  const title = newResourceModal.value.title.trim()
  if (!title) {
    toast.error('Escribe un título para el nuevo recurso.')
    return
  }
  newResourceModal.value.creating = true
  try {
    const { data } = await api.post('/admin/public-resources', {
      title,
      category: newResourceModal.value.category || 'Regulación Emocional',
      instagram_keyword: (newResourceModal.value.instagram_keyword || 'RECURSO').toUpperCase(),
      subtitle: 'Guía práctica y cuaderno de ejercicios paso a paso.',
      teaser_text:
        'Escribe aquí los primeros párrafos de introducción que verán las personas antes de desbloquear el recurso completo con su correo electrónico...',
      content_body:
        '## 1. Comprender qué ocurre en tu interior\n\nDesarrolla aquí el artículo completo del recurso...\n\n> «Una frase clave o reflexión terapéutica para destacar.»\n\n## 2. Ejercicio práctico paso a paso\n\nExplica cómo aplicar el cuaderno descargable adjunto.',
      key_takeaways: [
        'Primer aprendizaje o herramienta práctica del recurso.',
        'Segundo ejercicio incluido en la guía descargable.',
      ],
      is_published: true,
    })
    const created = data.resource
    resources.value.unshift(created)
    selectedResourceId.value = created.id
    populateFormFromResource(created)
    newResourceModal.value.open = false
    newResourceModal.value.title = ''
    toast.success(`Recurso "${created.title}" creado.`)
  } catch (err) {
    toast.error(err.response?.data?.error || 'No se pudo crear el recurso.')
  } finally {
    newResourceModal.value.creating = false
  }
}

async function handleDeleteResource() {
  if (!form.value.id) return
  if (
    !window.confirm(
      `¿Seguro que deseas eliminar el recurso "${form.value.title}"? Los correos captados se conservarán en tu lista de suscriptores.`
    )
  ) {
    return
  }
  try {
    await api.delete(`/admin/public-resources/${form.value.id}`)
    toast.success('Recurso eliminado.')
    await fetchAdminResources({ silent: true })
  } catch (err) {
    toast.error('No se pudo eliminar el recurso.')
  }
}

// --- Subida de Archivos Multimedia (Portada, PDF, Vídeo, Audio, Fotos Inline) ---
async function uploadFileHelper(file, folder) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)
  const { data } = await api.post('/admin/storage/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.media
}

async function onCoverFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingCover.value = true
  try {
    const media = await uploadFileHelper(file, 'public_resources/covers')
    form.value.cover_storage_provider = media.storage_provider
    form.value.cover_object_key = media.object_key
    form.value.cover_resolved_url = media.preview_url || form.value.cover_image_url
    toast.success('Imagen de portada subida. Recuerda pulsar Guardar en la barra inferior.')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al subir la portada.')
  } finally {
    uploadingCover.value = false
    e.target.value = ''
  }
}

async function onPdfFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingPdf.value = true
  try {
    const media = await uploadFileHelper(file, 'public_resources/pdfs')
    form.value.pdf_storage_provider = media.storage_provider
    form.value.pdf_object_key = media.object_key
    form.value.pdf_original_name = media.original_filename
    form.value.pdf_file_size_bytes = media.file_size_bytes || 0
    if (!form.value.pdf_title) {
      form.value.pdf_title = media.original_filename
    }
    form.value.pdf_preview_url = media.preview_url || ''
    toast.success('PDF subido y listo en la previsualización. Pulsa Guardar abajo.')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al subir el PDF.')
  } finally {
    uploadingPdf.value = false
    e.target.value = ''
  }
}

async function onVideoFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingVideo.value = true
  try {
    const media = await uploadFileHelper(file, 'public_resources/videos')
    form.value.video_storage_provider = media.storage_provider
    form.value.video_object_key = media.object_key
    form.value.video_original_name = media.original_filename
    form.value.video_mime_type = media.mime_type || 'video/mp4'
    form.value.video_stream_url = media.preview_url || ''
    toast.success('Vídeo subido correctamente. Pulsa Guardar en la barra inferior.')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al subir el vídeo.')
  } finally {
    uploadingVideo.value = false
    e.target.value = ''
  }
}

async function onAudioFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingAudio.value = true
  try {
    const media = await uploadFileHelper(file, 'public_resources/audios')
    form.value.audio_storage_provider = media.storage_provider
    form.value.audio_object_key = media.object_key
    form.value.audio_original_name = media.original_filename
    form.value.audio_mime_type = media.mime_type || 'audio/mpeg'
    if (!form.value.audio_title) {
      form.value.audio_title = media.original_filename
    }
    form.value.audio_stream_url = media.preview_url || ''
    toast.success('Audio subido correctamente. Pulsa Guardar en la barra inferior.')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al subir el audio.')
  } finally {
    uploadingAudio.value = false
    e.target.value = ''
  }
}

async function onGalleryImageSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingGallery.value = true
  try {
    const media = await uploadFileHelper(file, 'public_resources/gallery')
    form.value.gallery_images.push({
      storage_provider: media.storage_provider,
      object_key: media.object_key,
      original_filename: media.original_filename,
      mime_type: media.mime_type,
      url: media.preview_url || '',
      resolved_url: media.preview_url || '',
      caption: '',
    })
    toast.success('Imagen añadida al artículo.')
  } catch (err) {
    toast.error('Error al subir imagen para el artículo.')
  } finally {
    uploadingGallery.value = false
    e.target.value = ''
  }
}

// Helpers de edición rápida de bloques
function insertMarkdownSnippet(type) {
  const current = form.value.content_body || ''
  const prefix = current.endsWith('\n\n') || !current ? '' : '\n\n'
  if (type === 'h2') {
    form.value.content_body = `${current}${prefix}## Nuevo apartado del recurso\n\nEscribe aquí el desarrollo...`
  } else if (type === 'quote') {
    form.value.content_body = `${current}${prefix}> «Escribe aquí una reflexión o frase terapéutica destacada.»`
  } else if (type === 'list') {
    form.value.content_body = `${current}${prefix}- Primer punto clave para recordar.\n- Segundo paso práctico del ejercicio.\n- Tercer elemento de observación.`
  }
}

function addTakeaway() {
  form.value.key_takeaways.push('Nuevo aprendizaje clave de este recurso')
}

function removeTakeaway(idx) {
  form.value.key_takeaways.splice(idx, 1)
}

function removeGalleryImage(idx) {
  form.value.gallery_images.splice(idx, 1)
}

function copyResourcePublicUrl(slug) {
  const targetSlug = slug || form.value.slug
  if (!targetSlug) return
  const fullUrl = `${window.location.origin}/recursos/${targetSlug}`
  navigator.clipboard.writeText(fullUrl)
  toast.success(`Link copiado: ${fullUrl}`)
}

// Formateador de vista previa en tiempo real (idéntico a la vista pública)
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
        return `<h3 class="font-editorial text-xl font-semibold text-[#24332B] mt-5 mb-2">${formatInline(trimmed.slice(4))}</h3>`
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 class="font-editorial text-2xl font-semibold text-[#24332B] mt-6 mb-2.5">${formatInline(trimmed.slice(3))}</h2>`
      }
      if (trimmed.startsWith('&gt; ')) {
        return `<blockquote class="my-4 pl-4 py-2.5 border-l-4 border-[#D9826C] bg-[#FAF8F5] rounded-r-xl font-editorial italic text-lg text-[#24332B]/90">${formatInline(trimmed.slice(5))}</blockquote>`
      }
      const lines = trimmed.split('\n')
      if (lines.every((l) => /^(\d+\.|-|\*)\s+/.test(l.trim()))) {
        const items = lines
          .map((l) => l.trim().replace(/^(\d+\.|-|\*)\s+/, ''))
          .map(
            (item) =>
              `<li class="flex items-start gap-2 text-sm text-[#2C3E35]/85 leading-relaxed"><span class="w-1.5 h-1.5 rounded-full bg-[#D9826C] mt-2 shrink-0"></span><span>${formatInline(item)}</span></li>`
          )
          .join('')
        return `<ul class="my-4 space-y-2 pl-1">${items}</ul>`
      }
      return `<p class="text-sm text-[#2C3E35]/85 leading-[1.75] my-3">${formatInline(trimmed.replace(/\n/g, '<br/>'))}</p>`
    })
    .join('')
}

function formatInline(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#24332B]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
}

function getYoutubeEmbedUrl(url) {
  if (!url) return ''
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : ''
}

// --- Filtrado y Exportación CSV de Leads (Email Marketing) ---
const filteredLeads = computed(() => {
  const q = leadSearch.value.trim().toLowerCase()
  return leads.value.filter((l) => {
    if (
      leadResourceFilter.value !== 'all' &&
      String(l.source_resource_id) !== String(leadResourceFilter.value)
    ) {
      return false
    }
    if (!q) return true
    return (
      (l.email || '').toLowerCase().includes(q) ||
      (l.name || '').toLowerCase().includes(q) ||
      (l.source_resource_title || '').toLowerCase().includes(q)
    )
  })
})

function exportLeadsToCsv() {
  if (filteredLeads.value.length === 0) {
    toast.info('No hay suscriptores para exportar.')
    return
  }
  const headers = [
    'Email',
    'Nombre',
    'Consentimiento_Marketing',
    'Recurso_Origen',
    'Total_Recursos_Desbloqueados',
    'Fecha_Alta',
    'Ultima_Actividad',
  ]
  const rows = filteredLeads.value.map((l) => [
    `"${(l.email || '').replace(/"/g, '""')}"`,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    l.consent_marketing ? 'SI_ACEPTADO' : 'NO',
    `"${(l.source_resource_title || '').replace(/"/g, '""')}"`,
    l.unlock_count || 1,
    `"${l.created_at || ''}"`,
    `"${l.last_seen_at || ''}"`,
  ])
  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `leads_email_marketing_vuelve_a_ti_${new Date().toISOString().slice(0, 10)}.csv`
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  toast.success('Archivo CSV exportado para tu plataforma de Email Marketing.')
}

async function handleDeleteLead(lead) {
  if (!window.confirm(`¿Eliminar a ${lead.email} de la lista de suscriptores?`)) return
  try {
    await api.delete(`/admin/marketing-leads/${lead.id}`)
    leads.value = leads.value.filter((l) => l.id !== lead.id)
    toast.success('Suscriptor eliminado.')
  } catch {
    toast.error('No se pudo eliminar el suscriptor.')
  }
}

onMounted(async () => {
  await fetchAdminResources()
  await fetchLeads()
})
</script>

<template>
  <div class="space-y-6 pb-24">
    <!-- =====================================================
         CABECERA DEL MÓDULO + SELECTOR DE PESTAÑA
         ===================================================== -->
    <div
      class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
    >
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D9826C]">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Lead Magnet & Foro de Recursos (Instagram → Web)</span>
        </div>
        <h1 class="font-editorial text-3xl sm:text-4xl font-semibold text-[#24332B]">
          Biblioteca de Recursos & Captación de Emails
        </h1>
        <p class="text-xs sm:text-sm text-[#2C3E35]/70 max-w-2xl">
          Crea artículos, sube cuadernos PDF, vídeos o audios con vista previa en tiempo real y gestiona los correos captados para tus campañas de Email Marketing.
        </p>
      </div>

      <!-- Selector principal: Editor vs Suscriptores (CRM) -->
      <div class="flex items-center gap-2 bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#2C3E35]/10 self-start lg:self-auto">
        <button
          type="button"
          @click="activeMainTab = 'editor'"
          class="px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer"
          :class="
            activeMainTab === 'editor'
              ? 'bg-[#24332B] text-white shadow-xs'
              : 'text-[#2C3E35]/70 hover:text-[#24332B]'
          "
        >
          <BookOpen class="w-4 h-4 text-[#D9826C]" />
          <span>Editor & Live Preview ({{ resources.length }})</span>
        </button>

        <button
          type="button"
          @click="
            activeMainTab = 'leads';
            fetchLeads();
          "
          class="px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer"
          :class="
            activeMainTab === 'leads'
              ? 'bg-[#24332B] text-white shadow-xs'
              : 'text-[#2C3E35]/70 hover:text-[#24332B]'
          "
        >
          <Users class="w-4 h-4 text-[#D9826C]" />
          <span>Correos Captados ({{ leads.length }})</span>
        </button>
      </div>
    </div>

    <!-- =====================================================
         PESTAÑA 1: EDITOR DE RECURSOS CON PREVIEW EN TIEMPO REAL
         ===================================================== -->
    <div v-if="activeMainTab === 'editor'" class="space-y-6">
      <!-- Barra superior de selección de recurso + botón Nuevo Recurso -->
      <div
        class="bg-white rounded-3xl border border-[#2C3E35]/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs"
      >
        <div class="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            v-for="r in resources"
            :key="r.id"
            type="button"
            @click="selectResource(r)"
            class="px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border"
            :class="
              selectedResourceId === r.id
                ? 'bg-[#4A6B5D] text-white border-[#4A6B5D] shadow-xs'
                : 'bg-[#FAF8F5] text-[#2C3E35]/80 border-[#2C3E35]/10 hover:border-[#4A6B5D]'
            "
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="r.is_published ? 'bg-emerald-400' : 'bg-amber-400'"
            ></span>
            <span class="truncate max-w-[200px]">{{ r.title }}</span>
            <span
              v-if="!r.is_published"
              class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/25 text-amber-900"
            >
              Oculto
            </span>
            <span
              class="px-1.5 py-0.5 rounded-md text-[10px] bg-black/15"
              title="Correos / Desbloqueos conseguidos"
            >
              {{ r.unlocks_count || 0 }} leads
            </span>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <!-- Interruptor directo de 1 clic para Activar / Ocultar el recurso sin eliminarlo -->
          <button
            v-if="form.id"
            type="button"
            @click="togglePublishStatus"
            class="px-3.5 py-2.5 rounded-2xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all border"
            :class="
              form.is_published
                ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-900 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 border-amber-500/35 text-amber-900 hover:bg-amber-500/25'
            "
            :title="
              form.is_published
                ? 'El recurso está público. Pulsa para ocultarlo temporalmente sin borrarlo.'
                : 'El recurso está oculto. Pulsa para activarlo en la web.'
            "
          >
            <component :is="form.is_published ? Eye : EyeOff" class="w-3.5 h-3.5" />
            <span>
              {{ form.is_published ? 'Visible en Web (Ocultar)' : 'Oculto en Web (Activar)' }}
            </span>
          </button>

          <button
            v-if="form.slug"
            type="button"
            @click="copyResourcePublicUrl(form.slug)"
            class="px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#4A6B5D]/10 border border-[#2C3E35]/12 text-xs font-semibold text-[#24332B] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Copia este link para enviarlo por DM de Instagram cuando te comenten la palabra clave"
          >
            <Copy class="w-3.5 h-3.5 text-[#D9826C]" />
            <span>Copiar Link Instagram</span>
          </button>

          <a
            v-if="form.slug"
            :href="`/recursos/${form.slug}`"
            target="_blank"
            rel="noopener"
            class="px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#4A6B5D]/10 border border-[#2C3E35]/12 text-xs font-semibold text-[#24332B] inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5 text-[#4A6B5D]" />
            <span>Abrir en Web</span>
          </a>

          <button
            type="button"
            @click="newResourceModal.open = true"
            class="px-4 py-2.5 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Plus class="w-4 h-4" />
            <span>Nuevo Recurso</span>
          </button>
        </div>
      </div>

      <!-- SPLIT-SCREEN: COLUMNA IZQUIERDA (EDITOR) + COLUMNA DERECHA (LIVE PREVIEW) -->
      <div v-if="form.id" class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <!-- =================================================
             COLUMNA IZQUIERDA (6 COLS): CONSTRUCTOR DEL RECURSO
             ================================================= -->
        <div class="xl:col-span-6 space-y-6">
          <!-- Bloque 1: Datos principales e Instagram Link -->
          <section class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 space-y-4 shadow-xs">
            <div class="flex items-center justify-between border-b border-[#2C3E35]/8 pb-3">
              <h2 class="font-editorial text-2xl font-semibold text-[#24332B]">
                1. Identidad del Recurso & Enlace de Reel
              </h2>
              <button
                type="button"
                @click="handleDeleteResource"
                class="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>

            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1">
                  Título del Recurso *
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm font-medium focus:outline-none focus:border-[#4A6B5D]"
                  placeholder="Ej: Protocolo S.O.S. para Cortar la Rumiación Nocturna"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1">
                  Subtítulo / Resumen atractivo
                </label>
                <textarea
                  v-model="form.subtitle"
                  rows="2"
                  class="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs sm:text-sm focus:outline-none focus:border-[#4A6B5D]"
                  placeholder="Breve explicación de qué logrará el usuario al descargar este recurso..."
                ></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1">
                    Categoría
                  </label>
                  <input
                    v-model="form.category"
                    type="text"
                    class="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs font-medium"
                    placeholder="Ansiedad & Sueño"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1">
                    Palabra Reel Instagram
                  </label>
                  <input
                    v-model="form.instagram_keyword"
                    type="text"
                    class="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs font-bold uppercase text-[#D9826C]"
                    placeholder="CALMA"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1">
                    Minutos de lectura
                  </label>
                  <input
                    v-model.number="form.read_time_minutes"
                    type="number"
                    min="1"
                    max="60"
                    class="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs font-medium"
                  />
                </div>
              </div>

              <!-- URL Slug + Estado publicado -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label class="block text-[11px] font-bold text-[#2C3E35]/70 mb-1">
                    Slug del enlace (/recursos/...)
                  </label>
                  <input
                    v-model="form.slug"
                    type="text"
                    class="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs font-mono text-[#4A6B5D]"
                  />
                </div>

                <div class="flex items-center gap-4 pt-5">
                  <label class="inline-flex items-center gap-2 text-xs font-semibold text-[#24332B] cursor-pointer">
                    <input
                      v-model="form.is_published"
                      type="checkbox"
                      class="w-4 h-4 rounded accent-[#4A6B5D]"
                    />
                    <span>Publicado en Web</span>
                  </label>

                  <label class="inline-flex items-center gap-2 text-xs font-semibold text-[#24332B] cursor-pointer">
                    <input
                      v-model="form.is_featured"
                      type="checkbox"
                      class="w-4 h-4 rounded accent-[#D9826C]"
                    />
                    <span>Destacado</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <!-- Bloque 2: Imagen de Portada y Archivos Multimedia (PDF, Vídeo, Audio) -->
          <section class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 space-y-5 shadow-xs">
            <h2 class="font-editorial text-2xl font-semibold text-[#24332B] border-b border-[#2C3E35]/8 pb-3">
              2. Portada, PDF Descargable, Vídeo y Audio
            </h2>

            <!-- Portada -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-[#24332B]">
                Imagen de Portada del Recurso
              </label>
              <div class="flex flex-col sm:flex-row gap-2.5">
                <input
                  v-model="form.cover_image_url"
                  type="text"
                  placeholder="Pega una URL de imagen o sube una foto desde tu ordenador..."
                  class="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs"
                  @input="
                    form.cover_object_key = '';
                    form.cover_resolved_url = form.cover_image_url;
                  "
                />
                <label
                  class="px-4 py-2.5 rounded-xl bg-[#24332B] hover:bg-[#4A6B5D] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  <ImageIcon class="w-3.5 h-3.5 text-[#D9826C]" />
                  <span>{{ uploadingCover ? 'Subiendo...' : 'Subir Foto' }}</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    :disabled="uploadingCover"
                    @change="onCoverFileSelected"
                  />
                </label>
              </div>
            </div>

            <!-- Cuaderno PDF Descargable -->
            <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#24332B] inline-flex items-center gap-1.5">
                  <FileText class="w-4 h-4 text-[#D9826C]" />
                  Cuaderno o Guía en PDF (Se desbloquea tras poner el email)
                </span>
                <button
                  v-if="form.pdf_preview_url"
                  type="button"
                  @click="
                    pdfModal = {
                      open: true,
                      title: form.pdf_title || 'Vista previa PDF',
                      url: form.pdf_preview_url,
                    }
                  "
                  class="text-xs font-semibold text-[#4A6B5D] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Ver PDF actual</span>
                </button>
              </div>

              <div class="flex flex-col sm:flex-row gap-2.5">
                <input
                  v-model="form.pdf_title"
                  type="text"
                  placeholder="Título del PDF (ej: Cuaderno Práctico de Ejercicios.pdf)"
                  class="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-xs"
                />
                <label
                  class="px-4 py-2 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  <Upload class="w-3.5 h-3.5" />
                  <span>{{ uploadingPdf ? 'Subiendo PDF...' : form.pdf_object_key ? 'Cambiar PDF' : 'Subir PDF' }}</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    class="hidden"
                    :disabled="uploadingPdf"
                    @change="onPdfFileSelected"
                  />
                </label>
              </div>
            </div>

            <!-- Vídeo del Recurso -->
            <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#24332B] inline-flex items-center gap-1.5">
                  <PlayCircle class="w-4 h-4 text-[#4A6B5D]" />
                  Vídeo Explicativo (Opcional · YouTube o Subida Directa MP4)
                </span>
                <button
                  v-if="form.video_object_key || form.video_external_url"
                  type="button"
                  @click="
                    form.video_object_key = '';
                    form.video_external_url = '';
                    form.video_stream_url = '';
                  "
                  class="text-[11px] text-rose-600 hover:underline cursor-pointer"
                >
                  Quitar vídeo
                </button>
              </div>

              <div class="flex flex-col sm:flex-row gap-2.5">
                <input
                  v-model="form.video_external_url"
                  type="text"
                  placeholder="Enlace de YouTube / Vimeo o sube un archivo MP4..."
                  class="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-xs"
                />
                <label
                  class="px-4 py-2 rounded-xl bg-[#24332B] hover:bg-[#4A6B5D] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  <Upload class="w-3.5 h-3.5 text-[#D9826C]" />
                  <span>{{ uploadingVideo ? 'Subiendo MP4...' : 'Subir Vídeo MP4' }}</span>
                  <input
                    type="file"
                    accept="video/*"
                    class="hidden"
                    :disabled="uploadingVideo"
                    @change="onVideoFileSelected"
                  />
                </label>
              </div>
            </div>

            <!-- Audio / Meditación Guiada -->
            <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#24332B] inline-flex items-center gap-1.5">
                  <Headphones class="w-4 h-4 text-[#4A6B5D]" />
                  Audio Guiado / Meditación (Opcional)
                </span>
                <button
                  v-if="form.audio_object_key"
                  type="button"
                  @click="
                    form.audio_object_key = '';
                    form.audio_stream_url = '';
                  "
                  class="text-[11px] text-rose-600 hover:underline cursor-pointer"
                >
                  Quitar audio
                </button>
              </div>

              <div class="flex flex-col sm:flex-row gap-2.5">
                <input
                  v-model="form.audio_title"
                  type="text"
                  placeholder="Título del audio (ej: Audio de regulación vagal de 5 minutos)"
                  class="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-xs"
                />
                <label
                  class="px-4 py-2 rounded-xl bg-[#4A6B5D] hover:bg-[#3a564a] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  <Upload class="w-3.5 h-3.5" />
                  <span>{{ uploadingAudio ? 'Subiendo...' : 'Subir Audio MP3' }}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    class="hidden"
                    :disabled="uploadingAudio"
                    @change="onAudioFileSelected"
                  />
                </label>
              </div>
            </div>
          </section>

          <!-- Bloque 3: Teaser Abierto + Puntos Clave -->
          <section class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 space-y-4 shadow-xs">
            <div class="border-b border-[#2C3E35]/8 pb-3">
              <h2 class="font-editorial text-2xl font-semibold text-[#24332B]">
                3. Adelanto Abierto (Teaser antes de pedir el Email)
              </h2>
              <p class="text-xs text-[#2C3E35]/60">
                Esta introducción es pública para despertar el interés antes de mostrar la tarjeta de suscripción por correo.
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1.5">
                Párrafos de introducción (Teaser)
              </label>
              <textarea
                v-model="form.teaser_text"
                rows="5"
                class="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-[#4A6B5D]"
                placeholder="Escribe aquí los primeros párrafos que enganchan al lector..."
              ></textarea>
            </div>

            <!-- Puntos clave (Takeaways) -->
            <div class="space-y-2.5 pt-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-[#2C3E35]/80">
                  Puntos clave ("Lo que vas a aprender en este recurso")
                </label>
                <button
                  type="button"
                  @click="addTakeaway"
                  class="text-xs font-semibold text-[#4A6B5D] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Añadir punto</span>
                </button>
              </div>

              <div
                v-for="(item, idx) in form.key_takeaways"
                :key="idx"
                class="flex items-center gap-2"
              >
                <input
                  v-model="form.key_takeaways[idx]"
                  type="text"
                  class="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs"
                />
                <button
                  type="button"
                  @click="removeTakeaway(idx)"
                  class="p-2 rounded-xl text-rose-500 hover:bg-rose-50 cursor-pointer"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          <!-- Bloque 4: Artículo Completo Desbloqueable + Galería de Fotos -->
          <section class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 space-y-4 shadow-xs">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#2C3E35]/8 pb-3">
              <div>
                <h2 class="font-editorial text-2xl font-semibold text-[#24332B]">
                  4. Artículo Completo (Visible tras poner el Email)
                </h2>
                <p class="text-xs text-[#2C3E35]/60">
                  Puedes usar subtítulos (##), citas (&gt;) y listas (-), o usar los botones rápidos de abajo.
                </p>
              </div>
            </div>

            <!-- Barra de formato rápido -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                @click="insertMarkdownSnippet('h2')"
                class="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#4A6B5D]/10 border border-[#2C3E35]/12 text-xs font-semibold text-[#24332B] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Heading2 class="w-3.5 h-3.5 text-[#4A6B5D]" />
                <span>+ Subtítulo</span>
              </button>
              <button
                type="button"
                @click="insertMarkdownSnippet('quote')"
                class="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#4A6B5D]/10 border border-[#2C3E35]/12 text-xs font-semibold text-[#24332B] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Quote class="w-3.5 h-3.5 text-[#D9826C]" />
                <span>+ Frase Destacada</span>
              </button>
              <button
                type="button"
                @click="insertMarkdownSnippet('list')"
                class="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#4A6B5D]/10 border border-[#2C3E35]/12 text-xs font-semibold text-[#24332B] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <List class="w-3.5 h-3.5 text-[#4A6B5D]" />
                <span>+ Lista de puntos</span>
              </button>

              <label
                class="px-3 py-1.5 rounded-xl bg-[#4A6B5D]/10 hover:bg-[#4A6B5D]/20 text-xs font-semibold text-[#24332B] inline-flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <ImageIcon class="w-3.5 h-3.5 text-[#D9826C]" />
                <span>{{ uploadingGallery ? 'Subiendo foto...' : '+ Añadir Foto al Artículo' }}</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :disabled="uploadingGallery"
                  @change="onGalleryImageSelected"
                />
              </label>
            </div>

            <textarea
              v-model="form.content_body"
              rows="12"
              class="w-full px-4 py-3.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs sm:text-sm leading-relaxed font-sans focus:outline-none focus:border-[#4A6B5D]"
              placeholder="Escribe aquí todo el desarrollo del recurso..."
            ></textarea>

            <!-- Fotos adicionales del artículo -->
            <div v-if="form.gallery_images.length > 0" class="space-y-3 pt-2">
              <p class="text-xs font-bold text-[#24332B]">
                Fotos e infografías insertadas en el artículo ({{ form.gallery_images.length }})
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="(img, gIdx) in form.gallery_images"
                  :key="gIdx"
                  class="p-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2"
                >
                  <div class="relative h-32 rounded-xl overflow-hidden bg-black/5">
                    <img
                      :src="img.resolved_url || img.url"
                      class="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      @click="removeGalleryImage(gIdx)"
                      class="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 cursor-pointer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    v-model="img.caption"
                    type="text"
                    placeholder="Pie de foto o explicación..."
                    class="w-full px-3 py-1.5 rounded-lg bg-white border border-[#2C3E35]/12 text-xs"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- =================================================
             COLUMNA DERECHA (6 COLS): LIVE PREVIEW EN TIEMPO REAL
             ================================================= -->
        <div class="xl:col-span-6 xl:sticky xl:top-20 space-y-3">
          <!-- Controles de la Live Preview -->
          <div
            class="bg-[#24332B] text-white rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md"
          >
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs font-bold tracking-wide uppercase text-white/90">
                Live Preview en Tiempo Real
              </span>
            </div>

            <!-- Toggle Bloqueado vs Desbloqueado -->
            <div class="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl">
              <button
                type="button"
                @click="previewMode = 'locked'"
                class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                :class="
                  previewMode === 'locked'
                    ? 'bg-[#D9826C] text-white'
                    : 'text-white/70 hover:text-white'
                "
              >
                <Lock class="w-3 h-3" />
                <span>Con Muro Email</span>
              </button>
              <button
                type="button"
                @click="previewMode = 'unlocked'"
                class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                :class="
                  previewMode === 'unlocked'
                    ? 'bg-[#4A6B5D] text-white'
                    : 'text-white/70 hover:text-white'
                "
              >
                <Unlock class="w-3 h-3" />
                <span>Desbloqueado</span>
              </button>
            </div>

            <!-- Toggle Móvil vs Escritorio -->
            <div class="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
              <button
                type="button"
                @click="previewDevice = 'mobile'"
                class="p-1.5 rounded-lg cursor-pointer"
                :class="previewDevice === 'mobile' ? 'bg-white/20 text-white' : 'text-white/60'"
                title="Vista Móvil (Instagram)"
              >
                <Smartphone class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="previewDevice = 'desktop'"
                class="p-1.5 rounded-lg cursor-pointer"
                :class="previewDevice === 'desktop' ? 'bg-white/20 text-white' : 'text-white/60'"
                title="Vista Escritorio"
              >
                <Monitor class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Lienzo de Previsualización -->
          <div
            class="bg-[#E9E4DC]/60 rounded-3xl p-3 sm:p-5 border border-[#2C3E35]/12 max-h-[82vh] overflow-y-auto"
          >
            <div
              class="bg-white rounded-3xl border border-[#2C3E35]/10 shadow-lg overflow-hidden mx-auto transition-all duration-300"
              :class="previewDevice === 'mobile' ? 'max-w-[380px]' : 'w-full'"
            >
              <!-- Portada en Preview -->
              <div
                v-if="form.cover_resolved_url || form.cover_image_url"
                class="relative h-48 bg-[#E9E4DC] overflow-hidden"
              >
                <img
                  :src="form.cover_resolved_url || form.cover_image_url"
                  class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-linear-to-t from-[#24332B]/70 via-transparent to-transparent"></div>
                <div class="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#24332B]">
                    {{ form.category }}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#24332B]/90 text-white inline-flex items-center gap-1">
                    <Instagram class="w-3 h-3 text-[#D9826C]" />
                    {{ form.instagram_keyword }}
                  </span>
                </div>
              </div>

              <div class="p-5 sm:p-7 space-y-5">
                <!-- Título y Subtítulo -->
                <div class="space-y-2.5 border-b border-[#2C3E35]/8 pb-4">
                  <div class="flex items-center gap-2 text-[11px] font-bold">
                    <span
                      class="px-2.5 py-0.5 rounded-full"
                      :class="
                        previewMode === 'unlocked'
                          ? 'bg-emerald-500/15 text-emerald-800'
                          : 'bg-[#D9826C]/15 text-[#B55943]'
                      "
                    >
                      {{
                        previewMode === 'unlocked'
                          ? '🔓 Vista Completa Desbloqueada'
                          : '🔒 Vista Previa (Pide Email)'
                      }}
                    </span>
                    <span class="text-[#2C3E35]/50 inline-flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      {{ form.read_time_minutes }} min
                    </span>
                  </div>

                  <h3 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#24332B] leading-tight">
                    {{ form.title || 'Título del recurso...' }}
                  </h3>
                  <p v-if="form.subtitle" class="text-xs sm:text-sm text-[#2C3E35]/70 leading-relaxed">
                    {{ form.subtitle }}
                  </p>
                </div>

                <!-- Puntos clave -->
                <div
                  v-if="form.key_takeaways && form.key_takeaways.length > 0"
                  class="rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 p-4 space-y-2"
                >
                  <p class="text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D]">
                    Qué descubrirás en este recurso
                  </p>
                  <ul class="space-y-1.5">
                    <li
                      v-for="(tk, tIdx) in form.key_takeaways"
                      :key="tIdx"
                      class="flex items-start gap-2 text-xs text-[#24332B]"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5 text-[#4A6B5D] shrink-0 mt-0.5" />
                      <span>{{ tk }}</span>
                    </li>
                  </ul>
                </div>

                <!-- Teaser -->
                <div v-html="renderFormattedArticle(form.teaser_text)"></div>

                <!-- MODO BLOQUEADO EN PREVIEW -->
                <div v-if="previewMode === 'locked'" class="space-y-4 pt-2">
                  <div class="select-none blur-[4px] opacity-40 text-xs space-y-2">
                    <p>Contenido completo del protocolo terapéutico y ejercicios descargables...</p>
                    <p>Desbloquea la lectura completa introduciendo tu correo electrónico...</p>
                  </div>

                  <div class="rounded-2xl bg-[#24332B] text-white p-5 space-y-3 shadow-lg">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9826C] text-white">
                      ACCESO GRATUITO CON TU EMAIL
                    </span>
                    <h4 class="font-editorial text-xl font-semibold">
                      Introduce tu correo para ver el recurso completo y descargar el PDF
                    </h4>
                    <p class="text-[11px] text-white/75">
                      Guardaremos tu acceso en la caché de tu navegador para que no tengas que volver a ponerlo.
                    </p>
                    <div class="p-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white/60">
                      tu@email.com
                    </div>
                    <div class="flex items-start gap-2 text-[10px] text-white/80">
                      <input type="checkbox" checked disabled class="mt-0.5 accent-[#D9826C]" />
                      <span>Acepto que mi correo se utilice para recibir este recurso y comunicaciones de Email Marketing de Carla Viladot.</span>
                    </div>
                    <div class="w-full py-2.5 rounded-xl bg-[#D9826C] text-white text-center text-xs font-semibold">
                      Aceptar y Ver Recurso Ahora
                    </div>
                  </div>
                </div>

                <!-- MODO DESBLOQUEADO EN PREVIEW -->
                <div v-else class="space-y-5 pt-2 border-t border-[#2C3E35]/10">
                  <!-- Vídeo en Preview -->
                  <div
                    v-if="form.video_stream_url || form.video_external_url"
                    class="rounded-2xl overflow-hidden bg-black border border-[#2C3E35]/12"
                  >
                    <video
                      v-if="form.video_stream_url"
                      :src="form.video_stream_url"
                      controls
                      class="w-full max-h-60"
                    ></video>
                    <iframe
                      v-else-if="getYoutubeEmbedUrl(form.video_external_url)"
                      :src="getYoutubeEmbedUrl(form.video_external_url)"
                      class="w-full aspect-video"
                      frameborder="0"
                      allowfullscreen
                    ></iframe>
                  </div>

                  <!-- Audio en Preview -->
                  <div
                    v-if="form.audio_stream_url || form.audio_object_key"
                    class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#4A6B5D]/25 space-y-2"
                  >
                    <p class="text-xs font-bold text-[#24332B] flex items-center gap-1.5">
                      <Headphones class="w-3.5 h-3.5 text-[#4A6B5D]" />
                      <span>{{ form.audio_title || 'Audio guiado del recurso' }}</span>
                    </p>
                    <audio
                      v-if="form.audio_stream_url"
                      :src="form.audio_stream_url"
                      controls
                      class="w-full h-9"
                    ></audio>
                  </div>

                  <!-- Cuerpo del Artículo -->
                  <div v-html="renderFormattedArticle(form.content_body)"></div>

                  <!-- Galería en Preview -->
                  <div
                    v-if="form.gallery_images && form.gallery_images.length > 0"
                    class="grid grid-cols-1 gap-3"
                  >
                    <figure
                      v-for="(gImg, gIdx) in form.gallery_images"
                      :key="gIdx"
                      class="rounded-2xl overflow-hidden border border-[#2C3E35]/10 bg-[#FAF8F5]"
                    >
                      <img
                        :src="gImg.resolved_url || gImg.url"
                        class="w-full h-44 object-cover"
                      />
                      <figcaption v-if="gImg.caption" class="p-2 text-[11px] text-center text-[#2C3E35]/70">
                        {{ gImg.caption }}
                      </figcaption>
                    </figure>
                  </div>

                  <!-- Tarjeta PDF en Preview -->
                  <div
                    v-if="form.pdf_object_key || form.pdf_title"
                    class="rounded-2xl bg-[#24332B] text-white p-4 flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-9 h-9 rounded-xl bg-[#D9826C] text-white flex items-center justify-center shrink-0">
                        <FileText class="w-4 h-4" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-bold truncate">
                          {{ form.pdf_title || 'Cuaderno Práctico PDF' }}
                        </p>
                        <p class="text-[10px] text-white/70">
                          Lectura en navegador + Descarga directa
                        </p>
                      </div>
                    </div>
                    <button
                      v-if="form.pdf_preview_url"
                      type="button"
                      @click="
                        pdfModal = {
                          open: true,
                          title: form.pdf_title || 'Vista Previa PDF',
                          url: form.pdf_preview_url,
                        }
                      "
                      class="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                    >
                      Ver PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- =====================================================
         PESTAÑA 2: SUSCRIPTORES & EMAIL MARKETING (LEADS CRM)
         ===================================================== -->
    <div v-else class="space-y-6">
      <!-- KPIs de Email Marketing -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D]">
            Correos Únicos Captados
          </span>
          <p class="font-editorial text-4xl font-semibold text-[#24332B] mt-1">
            {{ leads.length }}
          </p>
          <p class="text-xs text-[#2C3E35]/60 mt-1">
            Con consentimiento explícito de Email Marketing
          </p>
        </div>

        <div class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-[#D9826C]">
            Total Recursos Desbloqueados
          </span>
          <p class="font-editorial text-4xl font-semibold text-[#24332B] mt-1">
            {{ stats.total_unlocks || 0 }}
          </p>
          <p class="text-xs text-[#2C3E35]/60 mt-1">
            Descargas y lecturas acumuladas por tus leads
          </p>
        </div>

        <div class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-[#24332B]/60">
            Visitas Totales al Foro
          </span>
          <p class="font-editorial text-4xl font-semibold text-[#24332B] mt-1">
            {{ stats.total_views || 0 }}
          </p>
          <p class="text-xs text-[#2C3E35]/60 mt-1">
            Tráfico recibido desde Instagram y la web
          </p>
        </div>
      </div>

      <!-- Barra de búsqueda, filtro por recurso y Exportación CSV -->
      <div
        class="bg-white rounded-3xl border border-[#2C3E35]/10 p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs"
      >
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div class="relative flex-1 max-w-md">
            <Search class="w-4 h-4 text-[#2C3E35]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="leadSearch"
              type="text"
              placeholder="Buscar por correo electrónico o nombre..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/12 text-xs sm:text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>

          <select
            v-model="leadResourceFilter"
            class="px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/12 text-xs font-semibold text-[#24332B]"
          >
            <option value="all">Todos los recursos de origen</option>
            <option v-for="r in resources" :key="r.id" :value="String(r.id)">
              Captado en: {{ r.title }}
            </option>
          </select>
        </div>

        <button
          type="button"
          @click="exportLeadsToCsv"
          class="px-5 py-2.5 rounded-2xl bg-[#4A6B5D] hover:bg-[#3a564a] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
        >
          <Download class="w-4 h-4" />
          <span>Exportar Lista CSV (Excel / Mailchimp)</span>
        </button>
      </div>

      <!-- Tabla de Suscriptores -->
      <div class="bg-white rounded-3xl border border-[#2C3E35]/10 overflow-hidden shadow-xs">
        <div v-if="filteredLeads.length > 0" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#FAF8F5] border-b border-[#2C3E35]/8 text-[11px] font-bold uppercase tracking-wider text-[#2C3E35]/60">
                <th class="py-3.5 px-5">Suscriptor</th>
                <th class="py-3.5 px-4">Primer Recurso (Origen)</th>
                <th class="py-3.5 px-4">Recursos Accedidos</th>
                <th class="py-3.5 px-4">Consentimiento</th>
                <th class="py-3.5 px-4">Fecha Alta</th>
                <th class="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#2C3E35]/6 text-xs">
              <tr
                v-for="lead in filteredLeads"
                :key="lead.id"
                class="hover:bg-[#FAF8F5]/60 transition-colors"
              >
                <td class="py-4 px-5">
                  <div class="font-bold text-[#24332B] flex items-center gap-1.5">
                    <Mail class="w-3.5 h-3.5 text-[#D9826C]" />
                    <span>{{ lead.email }}</span>
                  </div>
                  <div v-if="lead.name" class="text-[11px] text-[#2C3E35]/60 mt-0.5">
                    {{ lead.name }}
                  </div>
                </td>

                <td class="py-4 px-4">
                  <span class="px-2.5 py-1 rounded-lg bg-[#4A6B5D]/10 text-[#24332B] font-semibold">
                    {{ lead.source_resource_title }}
                  </span>
                </td>

                <td class="py-4 px-4">
                  <div class="flex flex-wrap gap-1 max-w-xs">
                    <span
                      v-for="(acc, aIdx) in lead.accessed_resources"
                      :key="aIdx"
                      class="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#2C3E35]/10 text-[11px] text-[#2C3E35]/80"
                    >
                      {{ acc.title }}
                    </span>
                  </div>
                </td>

                <td class="py-4 px-4">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-800 text-[11px] font-bold">
                    <CheckCircle2 class="w-3 h-3" />
                    Marketing OK
                  </span>
                </td>

                <td class="py-4 px-4 text-[#2C3E35]/65">
                  {{ lead.created_at ? new Date(lead.created_at).toLocaleDateString('es-ES') : '-' }}
                </td>

                <td class="py-4 px-5 text-right">
                  <button
                    type="button"
                    @click="handleDeleteLead(lead)"
                    class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                    title="Eliminar suscriptor"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="p-12 text-center space-y-2">
          <Users class="w-9 h-9 text-[#4A6B5D]/40 mx-auto" />
          <p class="font-editorial text-2xl text-[#24332B]">
            Aún no hay correos registrados con este filtro
          </p>
          <p class="text-xs text-[#2C3E35]/60">
            Cuando compartas el link de tus recursos en Instagram y los visitantes introduzcan su email, aparecerán aquí automáticamente.
          </p>
        </div>
      </div>
    </div>

    <!-- =====================================================
         BARRA FLOTANTE UNIFICADA DE GUARDADO REACTIVO
         ===================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-8 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-8 opacity-0"
      >
        <div
          v-if="isDirty && activeMainTab === 'editor'"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl bg-[#24332B] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/15 flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-[#D9826C] animate-ping shrink-0"></span>
            <span class="text-xs sm:text-sm font-medium truncate">
              Tienes cambios sin guardar en <strong>{{ form.title }}</strong>
            </span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              @click="discardChanges"
              class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/85 inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Descartar</span>
            </button>
            <button
              type="button"
              :disabled="saving"
              @click="saveResource"
              class="px-4 py-2 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-xs font-semibold text-white inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save class="w-3.5 h-3.5" />
              <span>{{ saving ? 'Guardando...' : 'Guardar Cambios' }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =====================================================
         MODAL CREAR NUEVO RECURSO
         ===================================================== -->
    <Teleport to="body">
      <div
        v-if="newResourceModal.open"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="newResourceModal.open = false"
      >
        <div class="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#2C3E35]/10">
          <div class="flex items-center justify-between">
            <h3 class="font-editorial text-2xl font-semibold text-[#24332B]">
              Crear Nuevo Recurso para Instagram / Web
            </h3>
            <button
              type="button"
              @click="newResourceModal.open = false"
              class="p-1.5 rounded-xl hover:bg-black/5 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1">
                Título del Recurso *
              </label>
              <input
                v-model="newResourceModal.title"
                type="text"
                placeholder="Ej: Guía de 5 pasos para gestionar la ansiedad..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1">
                  Categoría
                </label>
                <input
                  v-model="newResourceModal.category"
                  type="text"
                  class="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#2C3E35]/80 mb-1">
                  Palabra Reel (ej: CALMA)
                </label>
                <input
                  v-model="newResourceModal.instagram_keyword"
                  type="text"
                  class="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs uppercase font-bold text-[#D9826C]"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              @click="newResourceModal.open = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-[#2C3E35]/70 hover:bg-black/5 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="newResourceModal.creating"
              @click="handleCreateNewResource"
              class="px-5 py-2 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-semibold cursor-pointer"
            >
              {{ newResourceModal.creating ? 'Creando...' : 'Crear y Abrir Editor' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- =====================================================
         MODAL VISOR DE PDF EN EL EDITOR ADMIN
         ===================================================== -->
    <Teleport to="body">
      <div
        v-if="pdfModal.open"
        class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="pdfModal.open = false"
      >
        <div class="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
          <div class="px-5 py-3.5 bg-[#24332B] text-white flex items-center justify-between">
            <span class="text-xs font-semibold truncate">{{ pdfModal.title }}</span>
            <button
              type="button"
              @click="pdfModal.open = false"
              class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <iframe :src="pdfModal.url" class="w-full flex-1 bg-[#FAF8F5]"></iframe>
        </div>
      </div>
    </Teleport>
  </div>
</template>
