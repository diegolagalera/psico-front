<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import {
  BookOpen,
  Plus,
  Save,
  Trash2,
  Video,
  FileText,
  Upload,
  Calendar,
  Users,
  Unlock,
  Lock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Clock,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PlayCircle,
  Sliders,
  ExternalLink,
  ChevronRight,
  Eye,
  CalendarDays,
  FileCheck,
  Check,
  X,
  Search,
  Settings,
  HelpCircle,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()

// 3 PESTAÑAS PRINCIPALES:
// 'curriculum' -> Contenido Didáctico (Módulos, Clases, Vídeos y Cuadernos)
// 'rules'      -> Configuración y Reglas de Desbloqueo (Drip Content, Datos del curso)
// 'students'   -> Expediente de Alumnos y Desbloqueos (Seguimiento, Override)
const activeTab = ref('curriculum')

const loading = ref(false)
const savingCourse = ref(false)
const s3Ready = ref(false)

const courses = ref([])
const selectedCourseId = ref(null)

// Modal Crear Nuevo Curso
const showNewCourseForm = ref(false)
const newCourseForm = reactive({
  title: '',
  subtitle: '',
  description: '',
  drip_mode: 'weekly_days',
  drip_weekdays: [0],
  drip_interval_days: 7,
})

// Formulario de edición del curso y sus reglas
const courseForm = reactive({
  title: '',
  subtitle: '',
  description: '',
  is_active: true,
  drip_mode: 'weekly_days',
  drip_weekdays: [0],
  drip_interval_days: 7,
})

// Nuevo módulo
const showNewModuleModal = ref(false)
const newModuleForm = reactive({
  title: '',
  subtitle: '',
})

// Formularios dinámicos
const newLessonForms = reactive({})
const newResourceForms = reactive({})
const uploadingState = reactive({})
const expandedLessons = reactive({})

// Seguimiento de alumnos
const studentsList = ref([])
const studentSearch = ref('')
const loadingStudents = ref(false)
const selectedStudentId = ref(null)
const studentRoadmap = ref(null)
const studentUser = ref(null)
const loadingRoadmap = ref(false)
const customEnrolledDate = ref('')

const weekdayOptions = [
  { value: 0, label: 'Lunes', short: 'L' },
  { value: 1, label: 'Martes', short: 'M' },
  { value: 2, label: 'Miércoles', short: 'X' },
  { value: 3, label: 'Jueves', short: 'J' },
  { value: 4, label: 'Viernes', short: 'V' },
  { value: 5, label: 'Sábado', short: 'S' },
  { value: 6, label: 'Domingo', short: 'D' },
]

const selectedCourse = computed(() =>
  courses.value.find((c) => c.id === selectedCourseId.value) || null
)

const filteredStudentsList = computed(() => {
  if (!studentSearch.value.trim()) return studentsList.value
  const q = studentSearch.value.toLowerCase()
  return studentsList.value.filter(
    (s) =>
      s.user.name?.toLowerCase().includes(q) ||
      s.user.email?.toLowerCase().includes(q)
  )
})

function notify(msg, type = 'success') {
  if (type === 'error') toast.error(msg)
  else if (type === 'warning') toast.warning(msg)
  else if (type === 'info') toast.info(msg)
  else toast.success(msg)
}

function formatBytes(bytes) {
  const b = Number(bytes || 0)
  if (b <= 0) return '0 KB'
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateES(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatBookingDate(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return isoStr
  }
}

function switchTab(tabKey) {
  activeTab.value = tabKey
  router.replace({
    query: {
      ...route.query,
      tab: tabKey,
    },
  })
  if (tabKey === 'students') {
    fetchStudentsProgress()
  }
}

function syncCourseFormFromSelected() {
  const c = selectedCourse.value
  if (!c) return
  courseForm.title = c.title || ''
  courseForm.subtitle = c.subtitle || ''
  courseForm.description = c.description || ''
  courseForm.is_active = Boolean(c.is_active)
  courseForm.drip_mode = c.drip_mode || 'weekly_days'
  courseForm.drip_weekdays = Array.isArray(c.drip_weekdays_list)
    ? [...c.drip_weekdays_list]
    : [0]
  courseForm.drip_interval_days = Number(c.drip_interval_days || 7)

  for (const mod of c.modules || []) {
    if (!newLessonForms[mod.id]) {
      newLessonForms[mod.id] = {
        open: false,
        title: '',
        description: '',
      }
    }
    for (const les of mod.lessons || []) {
      if (!newResourceForms[les.id]) {
        newResourceForms[les.id] = {
          open: false,
          title: '',
          resource_type: 'pdf',
          file: null,
        }
      }
    }
  }
}

async function fetchCourses() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/courses')
    courses.value = data.courses || []
    s3Ready.value = Boolean(data.s3_ready)
    if (
      courses.value.length > 0 &&
      !courses.value.some((c) => c.id === selectedCourseId.value)
    ) {
      selectedCourseId.value = courses.value[0].id
    }
    syncCourseFormFromSelected()
    if (activeTab.value === 'students' && selectedCourseId.value) {
      await fetchStudentsProgress()
    }
  } catch (err) {
    notify(err.response?.data?.error || 'Error al cargar los cursos.', 'error')
  } finally {
    loading.value = false
  }
}

function handleSelectCourse(courseId) {
  selectedCourseId.value = Number(courseId)
  syncCourseFormFromSelected()
  if (activeTab.value === 'students') {
    fetchStudentsProgress()
  }
}

function toggleWeekday(listRef, dayVal) {
  const idx = listRef.indexOf(dayVal)
  if (idx >= 0) {
    if (listRef.length > 1) listRef.splice(idx, 1)
  } else {
    listRef.push(dayVal)
    listRef.sort((a, b) => a - b)
  }
}

async function handleCreateCourse() {
  if (!newCourseForm.title.trim()) return
  try {
    const { data } = await api.post('/admin/courses', newCourseForm)
    notify(data.message)
    showNewCourseForm.value = false
    newCourseForm.title = ''
    newCourseForm.subtitle = ''
    newCourseForm.description = ''
    await fetchCourses()
    if (data.course?.id) {
      handleSelectCourse(data.course.id)
    }
  } catch (err) {
    notify(err.response?.data?.error || 'No se pudo crear el curso.', 'error')
  }
}

async function handleSaveCourseSettings() {
  if (!selectedCourseId.value) return
  savingCourse.value = true
  try {
    const { data } = await api.put(
      `/admin/courses/${selectedCourseId.value}`,
      courseForm
    )
    notify(data.message || 'Configuración guardada correctamente.')
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al guardar ajustes.', 'error')
  } finally {
    savingCourse.value = false
  }
}

async function handleDeleteCourse() {
  if (!selectedCourse.value) return
  if (
    !window.confirm(
      `¿Seguro que deseas eliminar definitivamente el curso "${selectedCourse.value.title}"? Esta acción borrará sus módulos, lecciones y relaciones.`
    )
  )
    return
  try {
    await api.delete(`/admin/courses/${selectedCourse.value.id}`)
    notify('Curso eliminado con éxito.')
    selectedCourseId.value = null
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'No se pudo eliminar el curso.', 'error')
  }
}

// --- Módulos ---
async function handleCreateModule() {
  if (!selectedCourseId.value || !newModuleForm.title.trim()) return
  try {
    const { data } = await api.post(
      `/admin/courses/${selectedCourseId.value}/modules`,
      newModuleForm
    )
    notify(data.message)
    newModuleForm.title = ''
    newModuleForm.subtitle = ''
    showNewModuleModal.value = false
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al crear módulo.', 'error')
  }
}

async function handleUpdateModule(mod) {
  try {
    const { data } = await api.put(`/admin/modules/${mod.id}`, {
      title: mod.title,
      subtitle: mod.subtitle,
      order_index: mod.order_index,
    })
    notify(data.message)
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al actualizar módulo.', 'error')
  }
}

async function handleDeleteModule(mod) {
  if (!window.confirm(`¿Eliminar el módulo "${mod.title}" y todas sus clases?`)) return
  try {
    const { data } = await api.delete(`/admin/modules/${mod.id}`)
    notify(data.message)
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al eliminar módulo.', 'error')
  }
}

// --- Clases ---
async function handleCreateLesson(moduleId) {
  const form = newLessonForms[moduleId]
  if (!form || !form.title.trim()) return
  try {
    const { data } = await api.post(`/admin/modules/${moduleId}/lessons`, {
      title: form.title,
      description: form.description,
    })
    notify(data.message)
    form.title = ''
    form.description = ''
    form.open = false
    await fetchCourses()
    if (data.lesson?.id) {
      expandedLessons[data.lesson.id] = true
    }
  } catch (err) {
    notify(err.response?.data?.error || 'Error al crear la clase.', 'error')
  }
}

async function handleUpdateLessonMeta(lesson) {
  try {
    const { data } = await api.put(`/admin/lessons/${lesson.id}`, {
      title: lesson.title,
      description: lesson.description,
      order_index: lesson.order_index,
      video_duration_seconds: lesson.video_duration_seconds,
      booking_enabled: Boolean(lesson.booking_enabled),
    })
    notify(data.message)
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al guardar la clase.', 'error')
  }
}

async function handleDeleteLesson(lesson) {
  if (!window.confirm(`¿Eliminar la clase "${lesson.title}"?`)) return
  try {
    const { data } = await api.delete(`/admin/lessons/${lesson.id}`)
    notify(data.message)
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al eliminar la clase.', 'error')
  }
}

// --- Vídeo y Recursos ---
async function handleUploadLessonVideo(lesson, event) {
  const file = event.target.files?.[0]
  if (!file) return

  const uploadKey = `video_${lesson.id}`
  uploadingState[uploadKey] = 1
  try {
    const detectedDuration = await new Promise((resolve) => {
      try {
        const videoEl = document.createElement('video')
        videoEl.preload = 'metadata'
        videoEl.onloadedmetadata = () => {
          window.URL.revokeObjectURL(videoEl.src)
          resolve(Math.round(videoEl.duration || 0))
        }
        videoEl.onerror = () => resolve(0)
        videoEl.src = URL.createObjectURL(file)
      } catch {
        resolve(0)
      }
    })

    const formData = new FormData()
    formData.append('file', file)
    formData.append(
      'folder',
      `courses/course_${selectedCourseId.value}/lessons/lesson_${lesson.id}/video`
    )

    const { data: uploadRes } = await api.post(
      '/admin/storage/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadingState[uploadKey] = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
          }
        },
      }
    )

    const media = uploadRes.media
    await api.put(`/admin/lessons/${lesson.id}`, {
      has_video: true,
      video_storage_provider: media.storage_provider,
      video_object_key: media.object_key,
      video_original_name: media.original_filename,
      video_mime_type: media.mime_type || 'video/mp4',
      video_size_bytes: media.file_size_bytes,
      video_duration_seconds: detectedDuration || lesson.video_duration_seconds || 0,
    })

    notify(`Vídeo "${media.original_filename}" vinculado con éxito.`)
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al subir el vídeo.', 'error')
  } finally {
    delete uploadingState[uploadKey]
    event.target.value = ''
  }
}

async function handleRemoveLessonVideo(lesson) {
  if (!window.confirm(`¿Quitar el vídeo de "${lesson.title}"?`)) return
  try {
    await api.put(`/admin/lessons/${lesson.id}`, {
      has_video: false,
      video_object_key: '',
    })
    notify('Vídeo desvinculado.')
    await fetchCourses()
  } catch (err) {
    notify('No se pudo quitar el vídeo.', 'error')
  }
}

function handleSelectResourceFile(lessonId, event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!newResourceForms[lessonId]) {
    newResourceForms[lessonId] = {
      open: true,
      title: '',
      resource_type: 'pdf',
      file: null,
    }
  }
  newResourceForms[lessonId].file = file
  if (!newResourceForms[lessonId].title) {
    newResourceForms[lessonId].title = file.name
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (['doc', 'docx'].includes(ext)) newResourceForms[lessonId].resource_type = 'word'
  else if (['ppt', 'pptx', 'key'].includes(ext)) newResourceForms[lessonId].resource_type = 'presentation'
  else if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) newResourceForms[lessonId].resource_type = 'audio'
  else newResourceForms[lessonId].resource_type = 'pdf'
}

const adminPreviewModal = ref({
  open: false,
  loading: false,
  resource: null,
  previewUrl: '',
  downloadUrl: '',
})

async function handleAdminPreviewResource(res) {
  if (!res) return
  adminPreviewModal.value = {
    open: true,
    loading: true,
    resource: res,
    previewUrl: '',
    downloadUrl: '',
  }
  try {
    const { data } = await api.post(`/campus/resources/${res.id}/preview`)
    adminPreviewModal.value.previewUrl = data.preview_url || data.download_url || ''
    adminPreviewModal.value.downloadUrl = data.download_url || ''
  } catch (err) {
    notify(err.response?.data?.error || 'No se pudo cargar la vista previa.', 'error')
    adminPreviewModal.value.open = false
  } finally {
    adminPreviewModal.value.loading = false
  }
}

async function handleAddResource(lesson) {
  const form = newResourceForms[lesson.id]
  if (!form || !form.file || !form.title.trim()) {
    notify('Selecciona un archivo y asigna un título.', 'warning')
    return
  }

  const uploadKey = `res_${lesson.id}`
  uploadingState[uploadKey] = 1
  try {
    const formData = new FormData()
    formData.append('file', form.file)
    formData.append(
      'folder',
      `courses/course_${selectedCourseId.value}/lessons/lesson_${lesson.id}/resources`
    )

    const { data: uploadRes } = await api.post('/admin/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadingState[uploadKey] = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
        }
      },
    })

    const media = uploadRes.media
    await api.post(`/admin/lessons/${lesson.id}/resources`, {
      title: form.title.trim(),
      resource_type: form.resource_type,
      storage_provider: media.storage_provider,
      object_key: media.object_key,
      original_filename: media.original_filename,
      mime_type: media.mime_type,
      file_size_bytes: media.file_size_bytes,
    })

    notify(`Cuaderno "${form.title}" añadido.`)
    form.title = ''
    form.file = null
    form.open = false
    await fetchCourses()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al subir el cuaderno.', 'error')
  } finally {
    delete uploadingState[uploadKey]
  }
}

async function handleDeleteResource(res) {
  if (!window.confirm(`¿Eliminar el recurso "${res.title}"?`)) return
  try {
    await api.delete(`/admin/resources/${res.id}`)
    notify('Recurso eliminado.')
    await fetchCourses()
  } catch (err) {
    notify('No se pudo eliminar el recurso.', 'error')
  }
}

// --- Alumnos ---
async function fetchStudentsProgress() {
  if (!selectedCourseId.value) return
  loadingStudents.value = true
  try {
    const { data } = await api.get(
      `/admin/courses/${selectedCourseId.value}/students-progress`
    )
    studentsList.value = data.students || []
    if (
      studentsList.value.length > 0 &&
      (!selectedStudentId.value ||
        !studentsList.value.some((s) => s.user.id === selectedStudentId.value))
    ) {
      await selectStudentForRoadmap(studentsList.value[0].user.id)
    } else if (selectedStudentId.value) {
      await selectStudentForRoadmap(selectedStudentId.value)
    }
  } catch (err) {
    notify('Error al cargar progreso de alumnos.', 'error')
  } finally {
    loadingStudents.value = false
  }
}

async function selectStudentForRoadmap(userId) {
  selectedStudentId.value = userId
  loadingRoadmap.value = true
  try {
    const { data } = await api.get(
      `/admin/courses/${selectedCourseId.value}/students/${userId}/roadmap`
    )
    studentUser.value = data.user
    studentRoadmap.value = data.roadmap
    if (data.roadmap?.enrollment?.enrolled_at) {
      customEnrolledDate.value = data.roadmap.enrollment.enrolled_at.slice(0, 10)
    }
  } catch (err) {
    notify('No se pudo cargar el expediente.', 'error')
  } finally {
    loadingRoadmap.value = false
  }
}

async function handleUpdateStudentEnrollment(payload) {
  if (!selectedCourseId.value || !selectedStudentId.value) return
  try {
    const { data } = await api.patch(
      `/admin/courses/${selectedCourseId.value}/students/${selectedStudentId.value}/enrollment`,
      payload
    )
    notify(data.message)
    studentRoadmap.value = data.roadmap
    await fetchStudentsProgress()
  } catch (err) {
    notify(err.response?.data?.error || 'No se pudo actualizar matrícula.', 'error')
  }
}

async function handleManualLessonOverride(lessonId, forceState) {
  if (!selectedCourseId.value || !selectedStudentId.value) return
  try {
    const { data } = await api.post(
      `/admin/courses/${selectedCourseId.value}/students/${selectedStudentId.value}/lessons/${lessonId}/override`,
      { force_state: forceState }
    )
    notify(data.message)
    studentRoadmap.value = data.roadmap
    await fetchStudentsProgress()
  } catch (err) {
    notify(err.response?.data?.error || 'Error al cambiar estado.', 'error')
  }
}

async function handleAdminCancelBooking(bookingId) {
  if (!window.confirm('¿Cancelar esta cita agendada?')) return
  try {
    const { data } = await api.delete(`/admin/bookings/${bookingId}`)
    notify(data.message)
    if (selectedStudentId.value) {
      await selectStudentForRoadmap(selectedStudentId.value)
    }
  } catch (err) {
    notify(err.response?.data?.error || 'No se pudo cancelar la cita.', 'error')
  }
}

onMounted(() => {
  if (route.query.tab && ['curriculum', 'rules', 'students'].includes(route.query.tab)) {
    activeTab.value = route.query.tab
  }
  fetchCourses()
})
</script>

<template>
  <div class="space-y-8 animate-fadeIn">
    <!-- BARRA SUPERIOR DEL CURSO (Selector de Programa + Botón Nuevo Curso) -->
    <div class="bg-white rounded-3xl border border-[#2C3E35]/10 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-12 h-12 rounded-2xl bg-[#4A6B5D]/12 text-[#4A6B5D] flex items-center justify-center shrink-0">
          <GraduationCap class="w-6 h-6" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#D9826C]">Programa Activo:</span>
            <span v-if="selectedCourse?.is_active" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
              En Producción
            </span>
            <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800">
              Borrador
            </span>
          </div>

          <div v-if="courses.length > 0" class="flex items-center gap-2 mt-0.5">
            <select
              :value="selectedCourseId"
              @change="handleSelectCourse($event.target.value)"
              class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35] bg-transparent border-b border-dashed border-[#2C3E35]/30 focus:outline-none cursor-pointer pr-4"
            >
              <option v-for="c in courses" :key="c.id" :value="c.id">
                {{ c.title }}
              </option>
            </select>
          </div>
          <p v-else class="text-sm text-[#2C3E35]/60 mt-0.5">No hay cursos creados aún.</p>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <button
          type="button"
          @click="showNewCourseForm = true"
          class="px-4 py-2.5 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
        >
          <Plus class="w-4 h-4" />
          <span>Nuevo Programa</span>
        </button>
      </div>
    </div>

    <!-- TABS ESTRUCTURADOS EN 3 SECCIONES CLARAS (La clave de la nueva UX) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Pestaña 1: Contenido Didáctico -->
      <button
        type="button"
        @click="switchTab('curriculum')"
        class="flex items-start gap-3.5 p-4 rounded-2xl text-left transition-all cursor-pointer border"
        :class="
          activeTab === 'curriculum'
            ? 'bg-white border-[#4A6B5D] shadow-sm ring-2 ring-[#4A6B5D]/15'
            : 'bg-white/60 border-[#2C3E35]/10 hover:bg-white text-[#2C3E35]/70'
        "
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          :class="activeTab === 'curriculum' ? 'bg-[#4A6B5D] text-white' : 'bg-[#FAF8F5] text-[#2C3E35]/60 border border-[#2C3E35]/10'"
        >
          <BookOpen class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="text-sm font-bold truncate" :class="activeTab === 'curriculum' ? 'text-[#2C3E35]' : 'text-[#2C3E35]/80'">
              1. Contenido Didáctico
            </span>
          </div>
          <p class="text-xs text-[#2C3E35]/60 mt-0.5 truncate">
            Temario, módulos, vídeos y cuadernos
          </p>
        </div>
      </button>

      <!-- Pestaña 2: Configuración y Reglas -->
      <button
        type="button"
        @click="switchTab('rules')"
        class="flex items-start gap-3.5 p-4 rounded-2xl text-left transition-all cursor-pointer border"
        :class="
          activeTab === 'rules'
            ? 'bg-white border-[#4A6B5D] shadow-sm ring-2 ring-[#4A6B5D]/15'
            : 'bg-white/60 border-[#2C3E35]/10 hover:bg-white text-[#2C3E35]/70'
        "
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          :class="activeTab === 'rules' ? 'bg-[#4A6B5D] text-white' : 'bg-[#FAF8F5] text-[#2C3E35]/60 border border-[#2C3E35]/10'"
        >
          <Sliders class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="text-sm font-bold truncate" :class="activeTab === 'rules' ? 'text-[#2C3E35]' : 'text-[#2C3E35]/80'">
              2. Reglas de Desbloqueo
            </span>
          </div>
          <p class="text-xs text-[#2C3E35]/60 mt-0.5 truncate">
            Drip semanal, plazos y datos del curso
          </p>
        </div>
      </button>

      <!-- Pestaña 3: Expedientes de Alumnos -->
      <button
        type="button"
        @click="switchTab('students')"
        class="flex items-start gap-3.5 p-4 rounded-2xl text-left transition-all cursor-pointer border"
        :class="
          activeTab === 'students'
            ? 'bg-white border-[#4A6B5D] shadow-sm ring-2 ring-[#4A6B5D]/15'
            : 'bg-white/60 border-[#2C3E35]/10 hover:bg-white text-[#2C3E35]/70'
        "
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          :class="activeTab === 'students' ? 'bg-[#4A6B5D] text-white' : 'bg-[#FAF8F5] text-[#2C3E35]/60 border border-[#2C3E35]/10'"
        >
          <Users class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="text-sm font-bold truncate" :class="activeTab === 'students' ? 'text-[#2C3E35]' : 'text-[#2C3E35]/80'">
              3. Alumnos & Desbloqueos
            </span>
          </div>
          <p class="text-xs text-[#2C3E35]/60 mt-0.5 truncate">
            Seguimiento, expedientes y forzado
          </p>
        </div>
      </button>
    </div>

    <!-- Estado de Carga -->
    <div v-if="loading" class="bg-white rounded-3xl border border-[#2C3E35]/10 p-12 text-center space-y-4 shadow-xs">
      <div class="w-10 h-10 border-2 border-[#4A6B5D]/20 border-t-[#4A6B5D] rounded-full animate-spin mx-auto"></div>
      <p class="text-sm font-semibold text-[#2C3E35]">Cargando programa didáctico...</p>
    </div>

    <!-- Estado Vacío (Sin cursos creados todavía) -->
    <div v-else-if="!courses.length || !selectedCourse" class="bg-white rounded-3xl border border-[#2C3E35]/10 p-10 sm:p-14 text-center space-y-5 shadow-xs">
      <div class="w-16 h-16 rounded-3xl bg-[#D9826C]/10 text-[#D9826C] flex items-center justify-center mx-auto">
        <GraduationCap class="w-8 h-8" />
      </div>
      <div class="space-y-1.5 max-w-md mx-auto">
        <h3 class="font-editorial text-3xl font-semibold text-[#2C3E35]">
          Crea tu Primer Programa Terapéutico
        </h3>
        <p class="text-sm text-[#2C3E35]/65 leading-relaxed">
          Aún no hay cursos creados en la plataforma. Pulsa el botón inferior para comenzar a estructurar el método de Carla Viladot.
        </p>
      </div>
      <button
        type="button"
        @click="showNewCourseForm = true"
        class="px-6 py-3 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>Crear Nuevo Curso Ahora</span>
      </button>
    </div>

    <!-- Contenido de las 3 Áreas cuando el curso existe -->
    <div v-else class="space-y-6">
      <!-- =================================================================== -->
      <!-- ÁREA 1: CONTENIDO DIDÁCTICO (Pura Pedagogía, Libre de Confusiones) -->
      <!-- =================================================================== -->
      <div v-show="activeTab === 'curriculum'" class="space-y-6 animate-fadeIn">
      <!-- Cabecera de Temario Didáctico -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-white to-[#FAF8F5] p-6 rounded-3xl border border-[#2C3E35]/10">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D] block">Constructor del Programa</span>
          <h2 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35] mt-0.5">
            Módulos y Sesiones Didácticas
          </h2>
          <p class="text-xs sm:text-sm text-[#2C3E35]/65 mt-1 max-w-xl">
            Gestiona la secuencia pedagógica de Carla: sube los vídeos protegidos, asigna cuadernos terapéuticos y habilita citas 1:1.
          </p>
        </div>

        <button
          type="button"
          @click="showNewModuleModal = true"
          class="px-5 py-2.5 rounded-2xl bg-[#4A6B5D] hover:bg-[#3d594d] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>Añadir Módulo</span>
        </button>
      </div>

      <!-- Lista de Módulos Didácticos -->
      <div v-if="selectedCourse.modules?.length" class="space-y-6">
        <div
          v-for="(mod, modIdx) in selectedCourse.modules"
          :key="mod.id"
          class="bg-white rounded-3xl border border-[#2C3E35]/12 shadow-xs overflow-hidden"
        >
          <!-- Encabezado del Módulo -->
          <div class="p-5 sm:p-6 bg-[#24332B] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full bg-[#D9826C] text-white text-[10px] font-bold uppercase tracking-wider">
                  Módulo {{ modIdx + 1 }}
                </span>
                <span class="text-xs text-white/60">
                  {{ mod.lessons?.length || 0 }} clase{{ mod.lessons?.length === 1 ? '' : 's' }}
                </span>
              </div>
              <input
                v-model="mod.title"
                type="text"
                class="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 text-base font-editorial font-semibold text-white focus:outline-none focus:border-[#D9826C]"
              />
              <input
                v-model="mod.subtitle"
                type="text"
                placeholder="Objetivo pedagógico o terapéutico de este módulo..."
                class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#D9826C]"
              />
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="handleUpdateModule(mod)"
                class="px-3.5 py-2 rounded-xl bg-[#4A6B5D] hover:bg-[#3d594d] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save class="w-3.5 h-3.5" />
                <span>Guardar Módulo</span>
              </button>
              <button
                type="button"
                @click="handleDeleteModule(mod)"
                class="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                title="Eliminar Módulo"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Clases del Módulo -->
          <div class="p-5 sm:p-6 space-y-4 divide-y divide-[#2C3E35]/8">
            <div
              v-for="(lesson, lesIdx) in mod.lessons"
              :key="lesson.id"
              class="pt-4 first:pt-0 space-y-4"
            >
              <!-- Fila Resumen de la Clase -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-3.5 min-w-0">
                  <span class="w-8 h-8 rounded-xl bg-[#4A6B5D]/10 text-[#4A6B5D] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {{ modIdx + 1 }}.{{ lesIdx + 1 }}
                  </span>

                  <div class="min-w-0">
                    <h4 class="font-semibold text-base text-[#2C3E35] truncate">
                      {{ lesson.title }}
                    </h4>

                    <div class="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        :class="
                          lesson.has_video
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-black/5 text-[#2C3E35]/60'
                        "
                      >
                        <Video class="w-3 h-3 text-emerald-600" />
                        {{ lesson.has_video ? `Vídeo (${formatBytes(lesson.video_size_bytes)})` : 'Solo Cuaderno/Lectura' }}
                      </span>

                      <span
                        v-if="lesson.resources?.length"
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D9826C]/10 text-[#D9826C] text-[11px] font-semibold"
                      >
                        <FileText class="w-3 h-3" />
                        {{ lesson.resources.length }} cuaderno{{ lesson.resources.length === 1 ? '' : 's' }}
                      </span>

                      <span
                        v-if="lesson.booking_enabled"
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4A6B5D]/10 text-[#4A6B5D] text-[11px] font-semibold"
                      >
                        <Calendar class="w-3 h-3" />
                        Cita 1:1 Agendable
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    @click="expandedLessons[lesson.id] = !expandedLessons[lesson.id]"
                    class="px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border"
                    :class="
                      expandedLessons[lesson.id]
                        ? 'bg-[#2C3E35] text-white border-[#2C3E35]'
                        : 'bg-[#FAF8F5] text-[#2C3E35] border-[#2C3E35]/15 hover:bg-[#F2ECE4]'
                    "
                  >
                    <span>{{ expandedLessons[lesson.id] ? 'Cerrar Edición' : 'Editar Clase' }}</span>
                    <ChevronUp v-if="expandedLessons[lesson.id]" class="w-3.5 h-3.5" />
                    <ChevronDown v-else class="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    @click="handleDeleteLesson(lesson)"
                    class="p-2 rounded-xl text-[#D9826C] hover:bg-[#D9826C]/10 cursor-pointer"
                    title="Eliminar clase"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Panel Desplegable de Edición Didáctica -->
              <div
                v-if="expandedLessons[lesson.id]"
                class="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-6"
              >
                <!-- Bloque A: Título y Notas de la Clase -->
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div class="sm:col-span-9">
                    <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1">
                      Título de la Sesión
                    </label>
                    <input
                      v-model="lesson.title"
                      type="text"
                      class="w-full px-3.5 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-sm"
                    />
                  </div>
                  <div class="sm:col-span-3">
                    <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1">
                      Orden
                    </label>
                    <input
                      v-model.number="lesson.order_index"
                      type="number"
                      min="1"
                      class="w-full px-3.5 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-sm text-center"
                    />
                  </div>
                  <div class="sm:col-span-12">
                    <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1">
                      Guía Didáctica y Reflexiones para el Alumno
                    </label>
                    <textarea
                      v-model="lesson.description"
                      rows="3"
                      placeholder="Instrucciones previas, preguntas de autorreflexión y notas de Carla..."
                      class="w-full p-3.5 rounded-xl bg-white border border-[#2C3E35]/15 text-xs"
                    ></textarea>
                  </div>
                </div>

                <!-- Bloque B: Interruptor Cita 1:1 -->
                <div class="p-4 rounded-2xl bg-white border border-[#2C3E35]/10 flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#4A6B5D]/10 text-[#4A6B5D] flex items-center justify-center shrink-0">
                      <Calendar class="w-4 h-4" />
                    </div>
                    <div>
                      <p class="text-xs font-bold text-[#2C3E35]">Sesión 1:1 con la Psicóloga</p>
                      <p class="text-[11px] text-[#2C3E35]/65">Permite al alumno reservar 1 hora de consulta por Google Meet en esta clase.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    v-model="lesson.booking_enabled"
                    class="w-5 h-5 accent-[#4A6B5D] rounded cursor-pointer"
                  />
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    @click="handleUpdateLessonMeta(lesson)"
                    class="px-4 py-2 rounded-xl bg-[#4A6B5D] hover:bg-[#3d594d] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save class="w-3.5 h-3.5" />
                    <span>Guardar Datos de la Clase</span>
                  </button>
                </div>

                <!-- Bloque C: Dos Columnas de Contenido Multimedia -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#2C3E35]/10">
                  <!-- Columna Vídeo -->
                  <div class="bg-white p-5 rounded-2xl border border-[#2C3E35]/10 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D] flex items-center gap-1.5">
                        <Video class="w-4 h-4" />
                        Vídeo Protegido
                      </span>
                      <span v-if="lesson.has_video" class="text-[11px] font-bold text-emerald-600">
                        ✓ Vídeo Vinculado
                      </span>
                    </div>

                    <div v-if="lesson.has_video" class="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/10 text-xs space-y-1">
                      <p class="font-semibold text-[#2C3E35] truncate">{{ lesson.video_original_name || lesson.video_object_key }}</p>
                      <p class="text-[#2C3E35]/60">
                        {{ formatBytes(lesson.video_size_bytes) }} ·
                        <strong>{{ lesson.video_storage_provider === 's3' ? 'Cloudflare R2 / S3' : 'Servidor Protegido' }}</strong>
                      </p>
                    </div>
                    <p v-else class="text-xs text-[#2C3E35]/60">
                      Sin vídeo asignado actualmente.
                    </p>

                    <!-- Barra de subida -->
                    <div v-if="uploadingState[`video_${lesson.id}`]" class="space-y-1">
                      <div class="flex justify-between text-xs font-semibold text-[#4A6B5D]">
                        <span>Subiendo vídeo al almacenamiento seguro...</span>
                        <span>{{ uploadingState[`video_${lesson.id}`] }}%</span>
                      </div>
                      <div class="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                        <div class="h-full bg-[#4A6B5D] transition-all" :style="{ width: `${uploadingState[`video_${lesson.id}`]}%` }"></div>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 pt-1">
                      <label class="px-3.5 py-2 rounded-xl bg-[#4A6B5D] hover:bg-[#3d594d] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                        <Upload class="w-3.5 h-3.5" />
                        <span>{{ lesson.has_video ? 'Reemplazar Vídeo' : 'Subir Vídeo (MP4)' }}</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          class="hidden"
                          @change="handleUploadLessonVideo(lesson, $event)"
                        />
                      </label>
                      <button
                        v-if="lesson.has_video"
                        type="button"
                        @click="handleRemoveLessonVideo(lesson)"
                        class="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                      >
                        Quitar Vídeo
                      </button>
                    </div>
                  </div>

                  <!-- Columna Cuadernos & Recursos -->
                  <div class="bg-white p-5 rounded-2xl border border-[#2C3E35]/10 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold uppercase tracking-wider text-[#D9826C] flex items-center gap-1.5">
                        <FileText class="w-4 h-4" />
                        Cuadernos de Trabajo ({{ lesson.resources?.length || 0 }})
                      </span>
                    </div>

                    <div v-if="lesson.resources?.length" class="space-y-2">
                      <div
                        v-for="res in lesson.resources"
                        :key="res.id"
                        class="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/10 flex items-center justify-between gap-2 text-xs"
                      >
                        <div class="min-w-0">
                          <p class="font-semibold text-[#2C3E35] truncate">{{ res.title }}</p>
                          <p class="text-[10px] text-[#2C3E35]/60 uppercase">{{ res.resource_type }} · {{ formatBytes(res.file_size_bytes) }}</p>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            @click="handleAdminPreviewResource(res)"
                            class="px-2 py-1 rounded-lg bg-white border border-[#2C3E35]/12 text-[#4A6B5D] hover:bg-[#4A6B5D] hover:text-white inline-flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Previsualizar recurso"
                          >
                            <Eye class="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            @click="handleDeleteResource(res)"
                            class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Eliminar recurso"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-xs text-[#2C3E35]/60">
                      No hay cuadernos o guías adjuntos.
                    </p>

                    <!-- Añadir cuaderno -->
                    <div v-if="newResourceForms[lesson.id]" class="pt-3 border-t border-[#2C3E35]/10 space-y-2.5">
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          v-model="newResourceForms[lesson.id].title"
                          type="text"
                          placeholder="Título del cuaderno (ej. Cuaderno 1)"
                          class="sm:col-span-2 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs"
                        />
                        <select
                          v-model="newResourceForms[lesson.id].resource_type"
                          class="px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs"
                        >
                          <option value="pdf">PDF Ejercicios</option>
                          <option value="presentation">Presentación</option>
                          <option value="word">Documento</option>
                          <option value="audio">Audio Meditación</option>
                        </select>
                      </div>

                      <div class="flex items-center justify-between gap-2">
                        <label class="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/20 text-xs font-medium cursor-pointer hover:bg-black/5 truncate max-w-[200px]">
                          <span>{{ newResourceForms[lesson.id].file ? newResourceForms[lesson.id].file.name : 'Seleccionar PDF/Audio...' }}</span>
                          <input type="file" class="hidden" @change="handleSelectResourceFile(lesson.id, $event)" />
                        </label>
                        <button
                          type="button"
                          :disabled="uploadingState[`res_${lesson.id}`]"
                          @click="handleAddResource(lesson)"
                          class="px-3.5 py-1.5 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus class="w-3.5 h-3.5" />
                          <span>{{ uploadingState[`res_${lesson.id}`] ? 'Subiendo...' : 'Subir' }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botón Añadir Clase -->
            <div class="pt-4">
              <div v-if="!newLessonForms[mod.id]?.open">
                <button
                  type="button"
                  @click="newLessonForms[mod.id] = { open: true, title: '', description: '' }"
                  class="px-4 py-2.5 rounded-2xl bg-[#4A6B5D]/10 hover:bg-[#4A6B5D]/18 text-[#4A6B5D] text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus class="w-4 h-4" />
                  <span>Añadir Clase a {{ mod.title }}</span>
                </button>
              </div>

              <div v-else class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#4A6B5D]/30 space-y-3">
                <p class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D]">
                  Nueva Clase para {{ mod.title }}
                </p>
                <input
                  v-model="newLessonForms[mod.id].title"
                  type="text"
                  placeholder="Título de la clase..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#2C3E35]/15 text-sm"
                />
                <textarea
                  v-model="newLessonForms[mod.id].description"
                  rows="2"
                  placeholder="Notas u objetivos de la lección..."
                  class="w-full p-3 rounded-xl bg-white border border-[#2C3E35]/15 text-xs"
                ></textarea>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="handleCreateLesson(mod.id)"
                    class="px-4 py-2 rounded-xl bg-[#4A6B5D] text-white text-xs font-semibold cursor-pointer"
                  >
                    Crear Clase
                  </button>
                  <button
                    type="button"
                    @click="newLessonForms[mod.id].open = false"
                    class="px-3 py-2 rounded-xl text-xs text-[#2C3E35]/70 hover:bg-black/5 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-3xl border border-dashed border-[#2C3E35]/20 p-12 text-center space-y-4">
        <BookOpen class="w-12 h-12 mx-auto text-[#4A6B5D]/40" />
        <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">Este curso aún no tiene módulos</h3>
        <p class="text-xs text-[#2C3E35]/65 max-w-sm mx-auto">
          Comienza creando el primer módulo para organizar las clases del programa.
        </p>
        <button
          type="button"
          @click="showNewModuleModal = true"
          class="px-5 py-2.5 rounded-2xl bg-[#4A6B5D] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Crear Primer Módulo</span>
        </button>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ÁREA 2: CONFIGURACIÓN Y REGLAS DE DESBLOQUEO (Totalmente Separada) -->
    <!-- =================================================================== -->
    <div v-show="activeTab === 'rules'" class="space-y-6 animate-fadeIn">
      <!-- Tarjeta 1: Información General del Programa -->
      <form
        @submit.prevent="handleSaveCourseSettings"
        class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 sm:p-8 space-y-6 shadow-xs"
      >
        <div class="flex items-center justify-between pb-4 border-b border-[#2C3E35]/10">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D]">Ficha del Curso</span>
            <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35] mt-0.5">
              Datos Generales del Programa
            </h3>
          </div>
          <button
            type="submit"
            :disabled="savingCourse"
            class="px-5 py-2.5 rounded-2xl bg-[#4A6B5D] hover:bg-[#3d594d] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save class="w-4 h-4" />
            <span>{{ savingCourse ? 'Guardando...' : 'Guardar Cambios' }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Nombre Oficial del Curso
            </label>
            <input
              v-model="courseForm.title"
              type="text"
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Subtítulo Terapéutico
            </label>
            <input
              v-model="courseForm.subtitle"
              type="text"
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Descripción del Programa
            </label>
            <textarea
              v-model="courseForm.description"
              rows="3"
              class="w-full p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs focus:outline-none focus:border-[#4A6B5D]"
            ></textarea>
          </div>
        </div>

        <!-- Estado de publicación -->
        <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-[#2C3E35]">Estado de Publicación</p>
            <p class="text-[11px] text-[#2C3E35]/65">Si está inactivo, los alumnos no podrán visualizarlo en su campus.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="courseForm.is_active" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A6B5D]"></div>
          </label>
        </div>
      </form>

      <!-- Tarjeta 2: Reglas de Desbloqueo (Drip Content) -->
      <form
        @submit.prevent="handleSaveCourseSettings"
        class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 sm:p-8 space-y-6 shadow-xs"
      >
        <div class="flex items-center justify-between pb-4 border-b border-[#2C3E35]/10">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[#D9826C]">Ritmo Terapéutico</span>
            <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35] mt-0.5">
              Reglas de Desbloqueo Progresivo (Drip)
            </h3>
            <p class="text-xs text-[#2C3E35]/65 mt-0.5">
              Define en qué orden y con qué cadencia temporal los alumnos acceden a cada lección.
            </p>
          </div>
          <button
            type="submit"
            :disabled="savingCourse"
            class="px-5 py-2.5 rounded-2xl bg-[#4A6B5D] hover:bg-[#3d594d] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save class="w-4 h-4" />
            <span>Guardar Reglas</span>
          </button>
        </div>

        <!-- 3 Modos Explicados con Tarjetas Limpias -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Modo 1 -->
          <label
            class="p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative"
            :class="
              courseForm.drip_mode === 'weekly_days'
                ? 'bg-[#4A6B5D]/8 border-[#4A6B5D] ring-2 ring-[#4A6B5D]/15'
                : 'bg-[#FAF8F5] border-[#2C3E35]/10 hover:border-[#2C3E35]/20'
            "
          >
            <div class="flex items-center gap-2.5">
              <input type="radio" value="weekly_days" v-model="courseForm.drip_mode" class="accent-[#4A6B5D]" />
              <span class="text-sm font-bold text-[#2C3E35]">Días Semanales Fijos</span>
            </div>
            <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
              La <strong>Clase 1</strong> se activa el día del pago. Las siguientes se abren cada semana en el día fijado (ej. cada lunes).
            </p>
          </label>

          <!-- Modo 2 -->
          <label
            class="p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative"
            :class="
              courseForm.drip_mode === 'interval_days'
                ? 'bg-[#4A6B5D]/8 border-[#4A6B5D] ring-2 ring-[#4A6B5D]/15'
                : 'bg-[#FAF8F5] border-[#2C3E35]/10 hover:border-[#2C3E35]/20'
            "
          >
            <div class="flex items-center gap-2.5">
              <input type="radio" value="interval_days" v-model="courseForm.drip_mode" class="accent-[#4A6B5D]" />
              <span class="text-sm font-bold text-[#2C3E35]">Intervalo Fijo de Días</span>
            </div>
            <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
              Se desbloquea una lección cada X días exactos (ej. cada 7 días) a partir de la matrícula.
            </p>
          </label>

          <!-- Modo 3 -->
          <label
            class="p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative"
            :class="
              courseForm.drip_mode === 'all_unlocked'
                ? 'bg-[#4A6B5D]/8 border-[#4A6B5D] ring-2 ring-[#4A6B5D]/15'
                : 'bg-[#FAF8F5] border-[#2C3E35]/10 hover:border-[#2C3E35]/20'
            "
          >
            <div class="flex items-center gap-2.5">
              <input type="radio" value="all_unlocked" v-model="courseForm.drip_mode" class="accent-[#4A6B5D]" />
              <span class="text-sm font-bold text-[#2C3E35]">Todo Desbloqueado</span>
            </div>
            <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
              Todas las lecciones y módulos están abiertos de inmediato para consumo libre.
            </p>
          </label>
        </div>

        <!-- Selector de Días Semanales -->
        <div v-if="courseForm.drip_mode === 'weekly_days'" class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#2C3E35]">Días seleccionados para apertura:</span>
            <span class="text-[11px] text-[#4A6B5D] font-bold">
              {{ courseForm.drip_weekdays.map(d => weekdayOptions.find(w => w.value === d)?.label).join(', ') || 'Ninguno' }}
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in weekdayOptions"
              :key="opt.value"
              type="button"
              @click="toggleWeekday(courseForm.drip_weekdays, opt.value)"
              class="w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center border"
              :class="
                courseForm.drip_weekdays.includes(opt.value)
                  ? 'bg-[#4A6B5D] text-white border-[#4A6B5D] shadow-xs'
                  : 'bg-white text-[#2C3E35]/70 border-[#2C3E35]/15 hover:border-[#4A6B5D]'
              "
            >
              {{ opt.short }}
            </button>
          </div>
        </div>

        <!-- Intervalo en días -->
        <div v-if="courseForm.drip_mode === 'interval_days'" class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 flex items-center gap-3 text-xs">
          <span class="font-semibold text-[#2C3E35]">Frecuencia:</span>
          <input
            v-model.number="courseForm.drip_interval_days"
            type="number"
            min="1"
            max="90"
            class="w-20 px-3 py-1.5 rounded-xl bg-white border border-[#2C3E35]/20 text-center font-bold"
          />
          <span class="text-[#2C3E35]/70">días entre cada lección.</span>
        </div>
      </form>

      <!-- Tarjeta 3: Acciones Críticas -->
      <div class="bg-rose-50/60 rounded-3xl border border-rose-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="text-sm font-bold text-rose-900">Eliminar Programa</h4>
          <p class="text-xs text-rose-700/80 mt-0.5">Esta acción borrará el curso y su contenido asociado.</p>
        </div>
        <button
          type="button"
          @click="handleDeleteCourse"
          class="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          Eliminar Curso
        </button>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ÁREA 3: ALUMNOS Y DESBLOQUEOS (Expedientes y Seguimiento Personal) -->
    <!-- =================================================================== -->
    <div v-show="activeTab === 'students'" class="space-y-6 animate-fadeIn">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Columna Izquierda: Buscador y Lista de Alumnos -->
        <div class="lg:col-span-4 bg-white rounded-3xl border border-[#2C3E35]/10 shadow-xs p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#2C3E35]/10">
            <div>
              <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">Alumnos</h3>
              <p class="text-xs text-[#2C3E35]/65">Inscritos en este programa</p>
            </div>
            <button
              type="button"
              @click="fetchStudentsProgress"
              class="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#4A6B5D]/15 text-[#4A6B5D] cursor-pointer"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loadingStudents }" />
            </button>
          </div>

          <!-- Buscador de alumnos -->
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2C3E35]/40" />
            <input
              v-model="studentSearch"
              type="text"
              placeholder="Buscar por nombre o correo..."
              class="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/12 text-xs focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>

          <!-- Lista de Alumnos Filtrada -->
          <div class="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            <button
              v-for="item in filteredStudentsList"
              :key="item.user.id"
              type="button"
              @click="selectStudentForRoadmap(item.user.id)"
              class="w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-2"
              :class="
                selectedStudentId === item.user.id
                  ? 'bg-[#24332B] text-white border-[#24332B] shadow-sm'
                  : 'bg-[#FAF8F5] text-[#2C3E35] border-[#2C3E35]/10 hover:bg-[#F2ECE4]'
              "
            >
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-semibold text-sm truncate">{{ item.user.name }}</p>
                  <p class="text-xs truncate opacity-70">{{ item.user.email }}</p>
                </div>
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                  :class="
                    selectedStudentId === item.user.id
                      ? 'bg-[#D9826C] text-white'
                      : 'bg-[#4A6B5D]/15 text-[#4A6B5D]'
                  "
                >
                  {{ item.summary.overall_progress_percent }}%
                </span>
              </div>

              <div class="w-full h-1.5 rounded-full bg-black/10 overflow-hidden">
                <div class="h-full bg-emerald-500 transition-all" :style="{ width: `${item.summary.overall_progress_percent}%` }"></div>
              </div>

              <div class="flex items-center justify-between text-[11px] opacity-75">
                <span>🔓 {{ item.summary.unlocked_lessons_count }}/{{ item.summary.total_lessons }} hab.</span>
                <span>✓ {{ item.summary.completed_lessons_count }} compl.</span>
              </div>
            </button>

            <p v-if="!loadingStudents && filteredStudentsList.length === 0" class="text-xs text-center text-[#2C3E35]/60 py-6">
              No se encontraron alumnos.
            </p>
          </div>
        </div>

        <!-- Columna Derecha: Expediente del Alumno Seleccionado -->
        <div v-if="studentRoadmap && studentUser" class="lg:col-span-8 space-y-6">
          <div class="bg-white rounded-3xl border border-[#2C3E35]/10 shadow-xs p-6 sm:p-8 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C3E35]/10">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-[#D9826C]">Expediente Individual</span>
                <h3 class="font-editorial text-3xl font-semibold text-[#2C3E35] mt-0.5">
                  {{ studentUser.name }}
                </h3>
                <p class="text-xs text-[#2C3E35]/60">{{ studentUser.email }}</p>
              </div>

              <button
                type="button"
                @click="handleUpdateStudentEnrollment({ unlock_all_override: !studentRoadmap.enrollment?.unlock_all_override })"
                class="px-4 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                :class="
                  studentRoadmap.enrollment?.unlock_all_override
                    ? 'bg-[#D9826C] text-white'
                    : 'bg-[#4A6B5D] text-white hover:bg-[#3d594d]'
                "
              >
                <Unlock class="w-4 h-4" />
                <span>{{ studentRoadmap.enrollment?.unlock_all_override ? 'Acceso Manual Activo' : 'Desbloquear Todo el Curso' }}</span>
              </button>
            </div>

            <!-- Resumen de Métricas -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10">
                <span class="text-[10px] font-bold uppercase text-[#2C3E35]/50 block">Avance</span>
                <span class="font-editorial text-2xl font-bold text-[#4A6B5D]">{{ studentRoadmap.summary.overall_progress_percent }}%</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10">
                <span class="text-[10px] font-bold uppercase text-[#2C3E35]/50 block">Habilitadas</span>
                <span class="font-editorial text-2xl font-bold text-[#2C3E35]">{{ studentRoadmap.summary.unlocked_lessons_count }} / {{ studentRoadmap.summary.total_lessons }}</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10">
                <span class="text-[10px] font-bold uppercase text-[#2C3E35]/50 block">Descargas</span>
                <span class="font-editorial text-2xl font-bold text-[#D9826C]">{{ studentRoadmap.summary.downloaded_resources_count }}</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10">
                <span class="text-[10px] font-bold uppercase text-[#2C3E35]/50 block">Fecha Matrícula</span>
                <div class="flex items-center gap-1 mt-1">
                  <input v-model="customEnrolledDate" type="date" class="w-full text-xs bg-white rounded-lg px-2 py-1 border border-[#2C3E35]/15" />
                  <button
                    type="button"
                    @click="handleUpdateStudentEnrollment({ enrolled_at: customEnrolledDate })"
                    class="px-2 py-1 rounded-lg bg-[#2C3E35] text-white text-[10px] font-bold cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Módulos y Clases con Desbloqueo Manual -->
          <div
            v-for="mod in studentRoadmap.modules"
            :key="mod.id"
            class="bg-white rounded-3xl border border-[#2C3E35]/10 shadow-xs overflow-hidden"
          >
            <div class="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#2C3E35]/10 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 class="font-editorial text-xl font-semibold text-[#2C3E35]">{{ mod.title }}</h4>
                <p class="text-xs text-[#2C3E35]/60">{{ mod.completed_lessons_count }}/{{ mod.total_lessons }} completadas · {{ mod.module_progress_percent }}%</p>
              </div>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold"
                :class="mod.is_unlocked ? 'bg-emerald-50 text-emerald-800' : 'bg-[#D9826C]/10 text-[#D9826C]'"
              >
                {{ mod.is_unlocked ? 'Módulo Activo' : `Se activa el ${formatDateES(mod.first_scheduled_unlock_at)}` }}
              </span>
            </div>

            <div class="divide-y divide-[#2C3E35]/8">
              <div v-for="les in mod.lessons" :key="les.id" class="p-4 sm:p-5 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-semibold text-sm text-[#2C3E35]">{{ les.title }}</span>
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        :class="les.is_unlocked ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'"
                      >
                        {{ les.is_unlocked ? 'Desbloqueada' : `Programada: ${formatDateES(les.scheduled_unlock_at)}` }}
                      </span>
                    </div>
                    <p class="text-xs text-[#2C3E35]/65">
                      Vídeo visto: <strong>{{ les.progress.video_progress_percent }}%</strong> · Total: <strong>{{ les.progress.lesson_progress_percent }}%</strong>
                    </p>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button
                      v-if="!les.is_unlocked || les.manual_override_state !== 'unlocked'"
                      type="button"
                      @click="handleManualLessonOverride(les.id, 'unlocked')"
                      class="px-3 py-1.5 rounded-xl bg-[#4A6B5D] text-white text-xs font-semibold hover:bg-[#3d594d] cursor-pointer"
                    >
                      Habilitar Ya
                    </button>
                    <button
                      v-if="les.is_unlocked && les.manual_override_state !== 'locked'"
                      type="button"
                      @click="handleManualLessonOverride(les.id, 'locked')"
                      class="px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-[#D9826C] border border-[#D9826C]/30 text-xs font-semibold cursor-pointer"
                    >
                      Bloquear
                    </button>
                    <button
                      v-if="les.manual_override_state"
                      type="button"
                      @click="handleManualLessonOverride(les.id, 'auto')"
                      class="px-2 py-1.5 rounded-xl text-xs text-[#2C3E35]/60 hover:text-[#2C3E35] cursor-pointer"
                      title="Volver a cronograma automático"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <!-- Cita de Google Meet si existe -->
                <div v-if="les.booking" class="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-2 text-emerald-900">
                    <Calendar class="w-4 h-4 text-emerald-700" />
                    <span><strong>Sesión Agendada:</strong> {{ formatBookingDate(les.booking.start_at) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <a
                      v-if="les.booking.meet_link"
                      :href="les.booking.meet_link"
                      target="_blank"
                      class="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-semibold inline-flex items-center gap-1.5"
                    >
                      <Video class="w-3.5 h-3.5" />
                      <span>Google Meet</span>
                    </a>
                    <button
                      type="button"
                      @click="handleAdminCancelBooking(les.booking.id)"
                      class="text-rose-600 hover:underline text-xs cursor-pointer ml-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- MODAL CREAR NUEVO CURSO -->
    <div
      v-if="showNewCourseForm"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3E35]/50 backdrop-blur-sm"
      @click.self="showNewCourseForm = false"
    >
      <form
        @submit.prevent="handleCreateCourse"
        class="bg-white rounded-3xl border border-[#2C3E35]/15 p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative"
      >
        <div class="flex items-center justify-between pb-4 border-b border-[#2C3E35]/10">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-[#D9826C]">Nuevo Programa</span>
            <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] mt-0.5">
              Crear Nuevo Curso
            </h2>
          </div>
          <button
            type="button"
            @click="showNewCourseForm = false"
            class="p-2 rounded-xl text-[#2C3E35]/50 hover:text-[#2C3E35] hover:bg-black/5 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Título del Curso *
            </label>
            <input
              v-model="newCourseForm.title"
              type="text"
              required
              placeholder="Ej. Reconstrucción Emocional & Amor Propio"
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
              Subtítulo Terapéutico
            </label>
            <input
              v-model="newCourseForm.subtitle"
              type="text"
              placeholder="Un viaje guiado para sanar..."
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#2C3E35]/10">
          <button
            type="button"
            @click="showNewCourseForm = false"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#2C3E35]/70 hover:bg-black/5 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold cursor-pointer"
          >
            Crear Curso Ahora
          </button>
        </div>
      </form>
    </div>

    <!-- MODAL CREAR NUEVO MÓDULO -->
    <div
      v-if="showNewModuleModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3E35]/50 backdrop-blur-sm"
      @click.self="showNewModuleModal = false"
    >
      <form
        @submit.prevent="handleCreateModule"
        class="bg-white rounded-3xl border border-[#2C3E35]/15 p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative"
      >
        <div class="flex items-center justify-between pb-3 border-b border-[#2C3E35]/10">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-[#4A6B5D]">Estructura Didáctica</span>
            <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">Añadir Nuevo Módulo</h3>
          </div>
          <button
            type="button"
            @click="showNewModuleModal = false"
            class="p-2 rounded-xl text-[#2C3E35]/50 hover:text-[#2C3E35] cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1">Título del Módulo *</label>
            <input
              v-model="newModuleForm.title"
              type="text"
              required
              placeholder="Ej. Módulo 3 · Gestión del Apego y Límites"
              class="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1">Subtítulo / Objetivo Terapéutico</label>
            <input
              v-model="newModuleForm.subtitle"
              type="text"
              placeholder="Aprender a soltar y regular la ansiedad..."
              class="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[#2C3E35]/10">
          <button
            type="button"
            @click="showNewModuleModal = false"
            class="px-4 py-2 rounded-xl text-xs text-[#2C3E35]/70 hover:bg-black/5 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 rounded-xl bg-[#4A6B5D] text-white text-xs font-bold hover:bg-[#3d594d] cursor-pointer"
          >
            Crear Módulo
          </button>
        </div>
      </form>
    </div>

    <!-- MODAL PREVISUALIZAR RECURSO EN ADMIN -->
    <div
      v-if="adminPreviewModal.open"
      class="fixed inset-0 z-50 bg-[#2C3E35]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      @click.self="adminPreviewModal.open = false"
    >
      <div class="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-[#2C3E35]/15">
        <div class="px-5 py-3.5 border-b border-[#2C3E35]/10 bg-[#FAF8F5] flex items-center justify-between gap-3">
          <div class="min-w-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#4A6B5D] block">
              Vista Previa del Recurso · {{ adminPreviewModal.resource?.resource_type }}
            </span>
            <h3 class="font-editorial text-xl font-semibold text-[#2C3E35] truncate">
              {{ adminPreviewModal.resource?.title }}
            </h3>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a
              v-if="adminPreviewModal.previewUrl"
              :href="adminPreviewModal.previewUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-1.5 rounded-xl bg-white border border-[#2C3E35]/15 text-xs font-semibold text-[#2C3E35] inline-flex items-center gap-1.5 hover:bg-black/5"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>Abrir pestaña</span>
            </a>
            <button
              type="button"
              @click="adminPreviewModal.open = false"
              class="p-2 rounded-xl bg-white border border-[#2C3E35]/15 text-[#2C3E35]/70 hover:text-[#2C3E35] cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex-1 bg-[#24332B]/5 flex flex-col overflow-hidden">
          <div
            v-if="adminPreviewModal.loading"
            class="flex-1 flex items-center justify-center text-xs text-[#2C3E35]/60"
          >
            Cargando vista previa...
          </div>
          <div
            v-else-if="adminPreviewModal.resource?.resource_type === 'audio' && adminPreviewModal.previewUrl"
            class="flex-1 flex flex-col items-center justify-center p-8 bg-[#24332B] text-white space-y-5"
          >
            <p class="font-editorial text-2xl">{{ adminPreviewModal.resource?.title }}</p>
            <audio :src="adminPreviewModal.previewUrl" controls autoplay class="w-full max-w-md"></audio>
          </div>
          <iframe
            v-else-if="adminPreviewModal.previewUrl"
            :src="adminPreviewModal.previewUrl"
            class="w-full flex-1 border-0 bg-white"
            :title="adminPreviewModal.resource?.title"
          ></iframe>
        </div>
      </div>
    </div>
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
