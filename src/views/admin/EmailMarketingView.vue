<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'
import { toast } from '@/composables/useToast'
import {
  Mail,
  Send,
  Clock,
  Users,
  FileCode,
  Eye,
  CheckCircle2,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  Calendar,
  Smartphone,
  Monitor,
  FileText,
  Search,
  Check,
  Play,
  Ban,
  ShieldCheck,
  BarChart3,
  UserPlus,
  X,
  ArrowRight,
  Zap,
  Inbox,
  Code2,
  FolderHeart,
  MailOpen,
  MailCheck,
  AlertTriangle,
} from 'lucide-vue-next'

const activeTab = ref('campaigns') // 'campaigns' | 'automation' | 'templates' | 'groups'
const loading = ref(false)
const processingQueue = ref(false)

const stats = ref({
  total_sent: 0,
  total_opened: 0,
  global_open_rate: 0,
  campaigns_sent: 0,
  campaigns_opened: 0,
  automation_sent: 0,
  automation_opened: 0,
  pending_automation_queue: 0,
  scheduled_campaigns: 0,
  active_leads_count: 0,
  total_leads_count: 0,
  active_students_count: 0,
})

const templates = ref([])
const groups = ref([])
const campaigns = ref([])
const automationSteps = ref([])
const automationQueue = ref([])
const allContacts = ref([])

// Pestañas principales con descripciones e iconos claros
const navTabs = computed(() => [
  {
    id: 'campaigns',
    title: 'Campañas y Programación',
    subtitle: 'Envía ahora o programa para un día y hora',
    badge: `${campaigns.value.length}`,
    icon: Send,
    accent: 'from-[#4A6B5D] to-[#2C3E35]',
  },
  {
    id: 'automation',
    title: 'Embudo Nuevos Leads (24/48/72h)',
    subtitle: 'Secuencia automática al descargar recursos',
    badge: `${automationSteps.value.filter((s) => s.is_active).length}/3 activos`,
    icon: Zap,
    accent: 'from-[#D9826C] to-[#b8634d]',
  },
  {
    id: 'templates',
    title: 'Plantillas HTML & Test',
    subtitle: 'Sube tus .html, haz preview y envía pruebas',
    badge: `${templates.value.length}`,
    icon: FileCode,
    accent: 'from-[#3B6E8C] to-[#274B60]',
  },
  {
    id: 'groups',
    title: 'Grupos de Correos',
    subtitle: 'Segmenta tus contactos y alumnos',
    badge: `${groups.value.length}`,
    icon: Users,
    accent: 'from-[#7A5C8F] to-[#523B63]',
  },
])

// ============================================================================
// PREVIEW MODAL & TEST EMAIL SENDER
// ============================================================================
const previewModal = reactive({
  open: false,
  title: '',
  subject: '',
  preheader: '',
  rawHtml: '',
  renderedHtml: '',
  plainText: '',
  device: 'desktop', // 'desktop' | 'mobile' | 'plain'
  sampleName: 'María',
  sampleEmail: 'maria@ejemplo.com',
  testRecipientEmail: '',
  sendingTest: false,
})

async function openPreviewModal({ title, subject, preheader = '', htmlContent }) {
  previewModal.title = title || 'Vista Previa de Correo'
  previewModal.subject = subject || 'Sin asunto'
  previewModal.preheader = preheader || ''
  previewModal.rawHtml = htmlContent || ''
  previewModal.device = 'desktop'
  previewModal.open = true
  await refreshPreviewRender()
}

async function refreshPreviewRender() {
  if (!previewModal.rawHtml) {
    previewModal.renderedHtml = ''
    previewModal.plainText = ''
    return
  }
  try {
    const { data } = await api.post('/admin/marketing/preview', {
      html_content: previewModal.rawHtml,
      sample_name: previewModal.sampleName,
      sample_email: previewModal.sampleEmail,
    })
    previewModal.renderedHtml = data.rendered_html || previewModal.rawHtml
    previewModal.plainText = data.plain_text || ''
    if (!previewModal.subject && data.extracted_subject) {
      previewModal.subject = data.extracted_subject
    }
  } catch {
    previewModal.renderedHtml = previewModal.rawHtml
  }
}

async function handleSendTestEmail() {
  if (!previewModal.testRecipientEmail || !previewModal.testRecipientEmail.includes('@')) {
    toast.error('Introduce un correo válido donde quieras recibir la prueba.')
    return
  }
  previewModal.sendingTest = true
  try {
    const { data } = await api.post('/admin/marketing/send-test', {
      to_email: previewModal.testRecipientEmail,
      subject: previewModal.subject,
      preheader: previewModal.preheader,
      html_content: previewModal.rawHtml,
      sample_name: previewModal.sampleName,
    })
    toast.success(data.message || 'Correo de prueba enviado.', {
      title: 'Test enviado',
      detail: data.details || '',
    })
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'No se pudo enviar el correo de prueba.'
    )
  } finally {
    previewModal.sendingTest = false
  }
}

// ============================================================================
// CARGA DE DATOS
// ============================================================================
async function fetchOverview() {
  loading.value = true
  try {
    const [overviewRes, contactsRes] = await Promise.all([
      api.get('/admin/marketing/overview'),
      api.get('/admin/marketing/contacts'),
    ])
    stats.value = overviewRes.data.stats || stats.value
    templates.value = overviewRes.data.templates || []
    groups.value = overviewRes.data.groups || []
    campaigns.value = overviewRes.data.campaigns || []
    automationSteps.value = overviewRes.data.automation_steps || []
    automationQueue.value = overviewRes.data.automation_queue || []
    allContacts.value = contactsRes.data.contacts || []

    if (!campaignForm.template_id && templates.value.length > 0) {
      selectTemplateForCampaign(templates.value[0].id)
    }
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'Error al cargar el módulo de Email Marketing.'
    )
  } finally {
    loading.value = false
  }
}

async function handleProcessQueueNow() {
  processingQueue.value = true
  try {
    const { data } = await api.post('/admin/marketing/process-queue')
    const s = data.summary || {}
    const total = (s.automation_sent || 0) + (s.campaigns_sent || 0)
    toast.success(
      total > 0
        ? `Se procesaron y enviaron ${total} correo(s) pendientes.`
        : 'Cola al día: no hay envíos pendientes vencidos en este momento.'
    )
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al procesar la cola.')
  } finally {
    processingQueue.value = false
  }
}

// ============================================================================
// PESTAÑA 1: CAMPAÑAS & PROGRAMACIÓN
// ============================================================================
const creatingCampaign = ref(false)
const campaignSearchContact = ref('')
const campaignForm = reactive({
  name: '',
  subject: '',
  preheader: '',
  template_id: null,
  html_content: '',
  uploaded_filename: '',
  target_type: 'leads', // 'leads' | 'all' | 'students' | 'groups' | 'custom'
  target_group_ids: [],
  target_emails: [],
  manual_emails_text: '',
  delivery_mode: 'now', // 'now' | 'scheduled'
  scheduled_date: '',
  scheduled_time: '10:00',
})

function selectTemplateForCampaign(tplId) {
  const tpl = templates.value.find((t) => t.id === Number(tplId))
  if (!tpl) return
  campaignForm.template_id = tpl.id
  campaignForm.subject = tpl.subject || ''
  campaignForm.preheader = tpl.preheader || ''
  campaignForm.html_content = tpl.html_content || ''
  campaignForm.uploaded_filename = tpl.original_filename || tpl.name
  campaignForm.name = tpl.name
}

function useTemplateInNewCampaign(tpl) {
  selectTemplateForCampaign(tpl.id)
  activeTab.value = 'campaigns'
  toast.success(`Plantilla "${tpl.name}" cargada en el creador de campañas.`)
}

function handleCampaignHtmlFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const htmlStr = String(e.target?.result || '')
    campaignForm.html_content = htmlStr
    campaignForm.uploaded_filename = file.name
    campaignForm.template_id = null
    const m = htmlStr.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (m && m[1]) {
      const cleanTitle = m[1].replace(/\s+/g, ' ').trim()
      if (cleanTitle) {
        campaignForm.subject = cleanTitle
        campaignForm.name = cleanTitle
      }
    }
    toast.success(`Archivo "${file.name}" listo para enviar.`)
  }
  reader.readAsText(file, 'UTF-8')
}

const filteredCampaignContacts = computed(() => {
  const q = campaignSearchContact.value.trim().toLowerCase()
  const list = allContacts.value.filter((c) => c.consent_marketing !== false)
  if (!q) return list
  return list.filter(
    (c) =>
      c.email.toLowerCase().includes(q) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.source_label && c.source_label.toLowerCase().includes(q))
  )
})

function toggleCustomCampaignEmail(emailStr) {
  const idx = campaignForm.target_emails.indexOf(emailStr)
  if (idx >= 0) {
    campaignForm.target_emails.splice(idx, 1)
  } else {
    campaignForm.target_emails.push(emailStr)
  }
}

function toggleCampaignGroupId(groupId) {
  const idx = campaignForm.target_group_ids.indexOf(groupId)
  if (idx >= 0) {
    campaignForm.target_group_ids.splice(idx, 1)
  } else {
    campaignForm.target_group_ids.push(groupId)
  }
}

const estimatedCampaignRecipientsCount = computed(() => {
  if (campaignForm.target_type === 'leads') {
    return stats.value.active_leads_count
  }
  if (campaignForm.target_type === 'students') {
    return stats.value.active_students_count
  }
  if (campaignForm.target_type === 'all') {
    return allContacts.value.filter((c) => c.consent_marketing !== false).length
  }
  if (campaignForm.target_type === 'groups') {
    const emailsSet = new Set()
    for (const g of groups.value) {
      if (campaignForm.target_group_ids.includes(g.id)) {
        for (const m of g.members || []) {
          emailsSet.add(m.email.toLowerCase())
        }
      }
    }
    return emailsSet.size
  }
  if (campaignForm.target_type === 'custom') {
    const set = new Set(campaignForm.target_emails.map((e) => e.toLowerCase()))
    if (campaignForm.manual_emails_text.trim()) {
      const parts = campaignForm.manual_emails_text
        .split(/[\n,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.includes('@'))
      parts.forEach((p) => set.add(p))
    }
    return set.size
  }
  return 0
})

async function handleCreateCampaign() {
  if (!campaignForm.subject.trim()) {
    toast.error('Escribe un asunto para el correo.')
    return
  }
  if (!campaignForm.html_content.trim()) {
    toast.error('Selecciona una plantilla o sube un archivo .html.')
    return
  }

  let scheduledIso = null
  const sendNow = campaignForm.delivery_mode === 'now'
  if (!sendNow) {
    if (!campaignForm.scheduled_date || !campaignForm.scheduled_time) {
      toast.error('Selecciona el día y la hora para programar el envío.')
      return
    }
    const localDt = new Date(
      `${campaignForm.scheduled_date}T${campaignForm.scheduled_time}:00`
    )
    if (isNaN(localDt.getTime())) {
      toast.error('La fecha u hora seleccionada no es válida.')
      return
    }
    scheduledIso = localDt.toISOString()
  }

  const customList = [...campaignForm.target_emails]
  if (campaignForm.manual_emails_text.trim()) {
    const extra = campaignForm.manual_emails_text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.includes('@'))
    customList.push(...extra)
  }

  creatingCampaign.value = true
  try {
    const { data } = await api.post('/admin/marketing/campaigns', {
      name: campaignForm.name.trim() || campaignForm.subject.trim(),
      subject: campaignForm.subject.trim(),
      preheader: campaignForm.preheader.trim(),
      template_id: campaignForm.template_id,
      html_content: campaignForm.html_content,
      target_type: campaignForm.target_type,
      target_group_ids: campaignForm.target_group_ids,
      target_emails: customList,
      send_now: sendNow,
      scheduled_at: scheduledIso,
    })
    toast.success(data.message || 'Campaña creada correctamente.')
    campaignForm.manual_emails_text = ''
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'No se pudo crear la campaña.')
  } finally {
    creatingCampaign.value = false
  }
}

// Modal de detalle de destinatarios y aperturas de una campaña
const campaignDetailModal = reactive({
  open: false,
  loading: false,
  campaign: null,
  filter: 'all', // 'all' | 'opened' | 'unopened' | 'failed'
  search: '',
})

async function openCampaignRecipientsModal(campId) {
  campaignDetailModal.open = true
  campaignDetailModal.loading = true
  campaignDetailModal.filter = 'all'
  campaignDetailModal.search = ''
  try {
    const { data } = await api.get(`/admin/marketing/campaigns/${campId}`)
    campaignDetailModal.campaign = data.campaign
  } catch {
    toast.error('No se pudo cargar el detalle de destinatarios.')
    campaignDetailModal.open = false
  } finally {
    campaignDetailModal.loading = false
  }
}

const filteredCampaignRecipients = computed(() => {
  const recs = campaignDetailModal.campaign?.recipients || []
  const q = campaignDetailModal.search.trim().toLowerCase()
  return recs.filter((r) => {
    if (campaignDetailModal.filter === 'opened' && !r.is_opened) return false
    if (
      campaignDetailModal.filter === 'unopened' &&
      (r.is_opened || r.status !== 'sent')
    )
      return false
    if (campaignDetailModal.filter === 'failed' && r.status !== 'failed')
      return false
    if (q) {
      const matchEmail = r.email.toLowerCase().includes(q)
      const matchName = (r.name || '').toLowerCase().includes(q)
      if (!matchEmail && !matchName) return false
    }
    return true
  })
})

async function handleSendCampaignNow(camp) {
  try {
    const { data } = await api.post(`/admin/marketing/campaigns/${camp.id}/send-now`)
    toast.success(data.message || 'Campaña enviada.')
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al iniciar envío.')
  }
}

async function handleCancelCampaign(camp) {
  try {
    const { data } = await api.post(`/admin/marketing/campaigns/${camp.id}/cancel`)
    toast.success(data.message || 'Campaña cancelada.')
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al cancelar campaña.')
  }
}

async function handleDeleteCampaign(camp) {
  if (!confirm(`¿Seguro que quieres eliminar la campaña "${camp.name}"?`)) return
  try {
    await api.delete(`/admin/marketing/campaigns/${camp.id}`)
    toast.success('Campaña eliminada.')
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'No se pudo eliminar.')
  }
}

// ============================================================================
// PESTAÑA 2: EMBUDO AUTOMÁTICO NUEVOS LEADS (24H / 48H / 72H)
// ============================================================================
const savingStepId = ref(null)
const automationFilterStep = ref('all')
const automationFilterStatus = ref('all')
const automationSearch = ref('')
const enqueuingAllLeads = ref(false)

function getStepTheme(index) {
  const themes = [
    {
      badgeBg: 'bg-[#4A6B5D]',
      headerGradient: 'from-[#4A6B5D] to-[#365246]',
      cardBg: 'bg-gradient-to-b from-[#F3F8F5] to-white',
      border: 'border-[#4A6B5D]/30',
      accentText: 'text-[#4A6B5D]',
      softBadge: 'bg-[#4A6B5D]/12 text-[#4A6B5D]',
      dayLabel: 'DÍA 1 · 24 HORAS DESPUÉS',
    },
    {
      badgeBg: 'bg-[#D9826C]',
      headerGradient: 'from-[#D9826C] to-[#bf6952]',
      cardBg: 'bg-gradient-to-b from-[#FDF5F2] to-white',
      border: 'border-[#D9826C]/35',
      accentText: 'text-[#D9826C]',
      softBadge: 'bg-[#D9826C]/15 text-[#b85d46]',
      dayLabel: 'DÍA 2 · 48 HORAS DESPUÉS',
    },
    {
      badgeBg: 'bg-[#2C3E35]',
      headerGradient: 'from-[#24332B] to-[#3B5246]',
      cardBg: 'bg-gradient-to-b from-[#F4F5F0] to-white',
      border: 'border-[#2C3E35]/30',
      accentText: 'text-[#2C3E35]',
      softBadge: 'bg-[#2C3E35]/12 text-[#2C3E35]',
      dayLabel: 'DÍA 3 · 72 HORAS DESPUÉS',
    },
  ]
  return themes[index % themes.length]
}

async function handleStepFileUpload(step, event) {
  const file = event.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', step.title)
  formData.append('delay_hours', String(step.delay_hours))
  formData.append('is_active', String(step.is_active))
  if (step.preheader) formData.append('preheader', step.preheader)

  savingStepId.value = step.id
  try {
    const { data } = await api.put(
      `/admin/marketing/automation/steps/${step.id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    toast.success(
      `Plantilla "${file.name}" asignada al correo de ${step.delay_hours}h.`
    )
    const idx = automationSteps.value.findIndex((s) => s.id === step.id)
    if (idx >= 0 && data.step) {
      automationSteps.value[idx] = data.step
    }
    await fetchOverview()
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'Error al subir la plantilla del paso.'
    )
  } finally {
    savingStepId.value = null
  }
}

async function handleSaveAutomationStep(step) {
  savingStepId.value = step.id
  try {
    const { data } = await api.put(
      `/admin/marketing/automation/steps/${step.id}`,
      {
        title: step.title,
        delay_hours: step.delay_hours,
        subject: step.subject,
        preheader: step.preheader,
        is_active: step.is_active,
        template_id: step.template_id,
        html_content: step.html_content,
      }
    )
    toast.success(data.message || 'Paso guardado correctamente.')
    const idx = automationSteps.value.findIndex((s) => s.id === step.id)
    if (idx >= 0 && data.step) {
      automationSteps.value[idx] = data.step
    }
  } catch (err) {
    toast.error(err.response?.data?.error || 'No se pudo guardar el paso.')
  } finally {
    savingStepId.value = null
  }
}

async function handleEnqueueAllExistingLeads() {
  enqueuingAllLeads.value = true
  try {
    const { data } = await api.post('/admin/marketing/automation/enqueue-lead', {
      enqueue_all: true,
    })
    toast.success(data.message || 'Leads encolados en la secuencia.')
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al encolar leads.')
  } finally {
    enqueuingAllLeads.value = false
  }
}

async function handleSendQueueItemNow(item) {
  try {
    const { data } = await api.post(
      `/admin/marketing/automation/queue/${item.id}/send-now`
    )
    toast.success(data.message || 'Correo enviado inmediatamente.')
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al enviar el correo.')
  }
}

async function handleCancelQueueItem(item) {
  try {
    const { data } = await api.post(
      `/admin/marketing/automation/queue/${item.id}/cancel`
    )
    toast.success(data.message || 'Envío cancelado.')
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al cancelar.')
  }
}

const filteredAutomationQueue = computed(() => {
  const qText = automationSearch.value.trim().toLowerCase()
  return automationQueue.value.filter((q) => {
    if (
      automationFilterStep.value !== 'all' &&
      String(q.delay_hours) !== String(automationFilterStep.value)
    ) {
      return false
    }
    if (automationFilterStatus.value === 'pending' && q.status !== 'pending')
      return false
    if (automationFilterStatus.value === 'sent' && q.status !== 'sent')
      return false
    if (automationFilterStatus.value === 'opened' && !q.is_opened) return false
    if (qText) {
      const mEmail = q.email.toLowerCase().includes(qText)
      const mName = (q.name || '').toLowerCase().includes(qText)
      if (!mEmail && !mName) return false
    }
    return true
  })
})

// ============================================================================
// PESTAÑA 3: GESTOR DE PLANTILLAS HTML
// ============================================================================
const uploadingTemplate = ref(false)
const editingTemplate = ref(null)
const newTemplateForm = reactive({
  name: '',
  subject: '',
  preheader: '',
  category: 'general',
  file: null,
  filename: '',
  html_content: '',
})

function handleNewTemplateFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  newTemplateForm.file = file
  newTemplateForm.filename = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = String(e.target?.result || '')
    newTemplateForm.html_content = content
    const m = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (m && m[1]) {
      const t = m[1].replace(/\s+/g, ' ').trim()
      if (!newTemplateForm.subject) newTemplateForm.subject = t
      if (!newTemplateForm.name) newTemplateForm.name = t
    }
  }
  reader.readAsText(file, 'UTF-8')
}

async function handleCreateTemplate() {
  if (!newTemplateForm.file && !newTemplateForm.html_content.trim()) {
    toast.error('Selecciona un archivo .html o pega el código HTML.')
    return
  }
  uploadingTemplate.value = true
  try {
    if (newTemplateForm.file) {
      const fd = new FormData()
      fd.append('file', newTemplateForm.file)
      fd.append('name', newTemplateForm.name)
      fd.append('subject', newTemplateForm.subject)
      fd.append('preheader', newTemplateForm.preheader)
      fd.append('category', newTemplateForm.category)
      await api.post('/admin/marketing/templates', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } else {
      await api.post('/admin/marketing/templates', {
        name: newTemplateForm.name,
        subject: newTemplateForm.subject,
        preheader: newTemplateForm.preheader,
        category: newTemplateForm.category,
        html_content: newTemplateForm.html_content,
      })
    }
    toast.success('Plantilla HTML añadida a tu biblioteca.')
    newTemplateForm.name = ''
    newTemplateForm.subject = ''
    newTemplateForm.preheader = ''
    newTemplateForm.file = null
    newTemplateForm.filename = ''
    newTemplateForm.html_content = ''
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al guardar la plantilla.')
  } finally {
    uploadingTemplate.value = false
  }
}

async function handleSaveEditedTemplate() {
  if (!editingTemplate.value) return
  try {
    const t = editingTemplate.value
    await api.put(`/admin/marketing/templates/${t.id}`, {
      name: t.name,
      subject: t.subject,
      preheader: t.preheader,
      html_content: t.html_content,
    })
    toast.success('Plantilla actualizada correctamente.')
    editingTemplate.value = null
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al actualizar plantilla.')
  }
}

async function handleDeleteTemplate(tpl) {
  if (!confirm(`¿Eliminar la plantilla "${tpl.name}"?`)) return
  try {
    await api.delete(`/admin/marketing/templates/${tpl.id}`)
    toast.success('Plantilla eliminada.')
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'No se pudo eliminar.')
  }
}

// ============================================================================
// PESTAÑA 4: GRUPOS DE CORREOS
// ============================================================================
const creatingGroup = ref(false)
const selectedGroupForEdit = ref(null)
const groupContactSearch = ref('')
const manualGroupEmails = ref('')
const groupColors = [
  { hex: '#4A6B5D', name: 'Salvia' },
  { hex: '#D9826C', name: 'Terracota' },
  { hex: '#3B6E8C', name: 'Océano' },
  { hex: '#7A5C8F', name: 'Lavanda' },
  { hex: '#C48B3F', name: 'Ámbar' },
  { hex: '#24332B', name: 'Bosque' },
]

const newGroupForm = reactive({
  name: '',
  description: '',
  color: '#4A6B5D',
  selectedEmails: [],
})

const filteredContactsForGroup = computed(() => {
  const q = groupContactSearch.value.trim().toLowerCase()
  if (!q) return allContacts.value
  return allContacts.value.filter(
    (c) =>
      c.email.toLowerCase().includes(q) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.source_label && c.source_label.toLowerCase().includes(q))
  )
})

function toggleNewGroupContact(emailStr) {
  const idx = newGroupForm.selectedEmails.indexOf(emailStr)
  if (idx >= 0) {
    newGroupForm.selectedEmails.splice(idx, 1)
  } else {
    newGroupForm.selectedEmails.push(emailStr)
  }
}

function selectAllFilteredForNewGroup() {
  const currentSet = new Set(newGroupForm.selectedEmails)
  for (const c of filteredContactsForGroup.value) {
    if (c.consent_marketing !== false) {
      currentSet.add(c.email)
    }
  }
  newGroupForm.selectedEmails = Array.from(currentSet)
}

async function handleCreateGroup() {
  if (!newGroupForm.name.trim()) {
    toast.error('Ponle un nombre al grupo de correos.')
    return
  }
  creatingGroup.value = true
  try {
    const membersPayload = newGroupForm.selectedEmails.map((em) => {
      const found = allContacts.value.find((c) => c.email === em)
      return {
        email: em,
        name: found?.name || '',
        source_type: found?.source_type || 'manual',
      }
    })
    const { data } = await api.post('/admin/marketing/groups', {
      name: newGroupForm.name.trim(),
      description: newGroupForm.description.trim(),
      color: newGroupForm.color,
      members: membersPayload,
    })
    toast.success(data.message || 'Grupo creado.')
    newGroupForm.name = ''
    newGroupForm.description = ''
    newGroupForm.selectedEmails = []
    await fetchOverview()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al crear el grupo.')
  } finally {
    creatingGroup.value = false
  }
}

async function handleAddManualEmailsToGroup(grp) {
  if (!manualGroupEmails.value.trim()) {
    toast.error('Escribe al menos un correo electrónico.')
    return
  }
  try {
    const { data } = await api.post(
      `/admin/marketing/groups/${grp.id}/members`,
      { raw_emails: manualGroupEmails.value }
    )
    toast.success(data.message || 'Contactos añadidos al grupo.')
    manualGroupEmails.value = ''
    await fetchOverview()
    if (selectedGroupForEdit.value?.id === grp.id) {
      selectedGroupForEdit.value = data.group
    }
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al añadir contactos.')
  }
}

async function handleRemoveMemberFromGroup(grp, memberId) {
  try {
    const { data } = await api.delete(
      `/admin/marketing/groups/${grp.id}/members/${memberId}`
    )
    toast.success('Contacto eliminado del grupo.')
    await fetchOverview()
    if (selectedGroupForEdit.value?.id === grp.id) {
      selectedGroupForEdit.value = data.group
    }
  } catch {
    toast.error('No se pudo eliminar el contacto.')
  }
}

async function handleDeleteGroup(grp) {
  if (!confirm(`¿Eliminar el grupo "${grp.name}"?`)) return
  try {
    await api.delete(`/admin/marketing/groups/${grp.id}`)
    toast.success('Grupo eliminado.')
    if (selectedGroupForEdit.value?.id === grp.id) {
      selectedGroupForEdit.value = null
    }
    await fetchOverview()
  } catch {
    toast.error('No se pudo eliminar el grupo.')
  }
}

// ============================================================================
// UTILIDADES DE FORMATO
// ============================================================================
function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoStr
  }
}

function targetTypeLabel(type) {
  const map = {
    leads: 'Leads de Recursos Gratuitos',
    all: 'Toda la Comunidad (Leads + Alumnos)',
    students: 'Alumnos del Programa',
    groups: 'Grupos seleccionados',
    custom: 'Correos seleccionados manualmente',
  }
  return map[type] || type
}

function getInitials(name, email) {
  const src = (name || email || 'U').trim()
  return src.slice(0, 2).toUpperCase()
}

onMounted(() => {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000)
  campaignForm.scheduled_date = tomorrow.toISOString().slice(0, 10)
  fetchOverview()
})
</script>

<template>
  <div class="w-full space-y-5">
    <!-- ====================================================================== -->
    <!-- CONTENEDOR GENERAL DE KPIs Y MÉTRICAS (NO CLICABLES) -->
    <!-- ====================================================================== -->
    <div
      class="bg-gradient-to-r from-[#24332B] via-[#2C3E35] to-[#364D41] rounded-3xl p-4 sm:p-5 border border-[#24332B] shadow-md space-y-3.5"
    >
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-lg bg-[#D9826C] text-white flex items-center justify-center shadow-2xs">
            <BarChart3 class="w-3.5 h-3.5" />
          </span>
          <span class="text-xs font-bold uppercase tracking-wider text-[#FAF8F5]">
            KPIs · Resumen General de Envíos y Aperturas
          </span>
        </div>
        <span class="text-[11px] text-[#FAF8F5]/70 hidden sm:inline">
          Métricas en tiempo real de campañas y embudo automático
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <!-- KPI 1: Correos Enviados (Verde Salvia) -->
        <div
          class="rounded-2xl px-4 py-3.5 bg-gradient-to-br from-[#EDF4F0] via-white to-white border border-[#4A6B5D]/25 flex items-center gap-3.5"
        >
          <div class="w-10 h-10 rounded-xl bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <MailCheck class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#4A6B5D] truncate">
                Correos Enviados
              </span>
              <span class="text-2xl font-bold text-[#2C3E35] leading-none">{{ stats.total_sent }}</span>
            </div>
            <p class="text-[11px] text-[#555852] truncate mt-1">
              <strong>{{ stats.campaigns_sent }}</strong> campañas · <strong>{{ stats.automation_sent }}</strong> embudo 24/48/72h
            </p>
          </div>
        </div>

        <!-- KPI 2: Tasa de Apertura / Open Rate (Terracota / Esmeralda) -->
        <div
          class="rounded-2xl px-4 py-3.5 bg-gradient-to-br from-[#FDF2EE] via-white to-white border border-[#D9826C]/35 flex items-center gap-3.5"
        >
          <div class="w-10 h-10 rounded-xl bg-[#D9826C] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <MailOpen class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#C86B53] truncate">
                Tasa de Apertura
              </span>
              <div class="flex items-center gap-1.5">
                <span class="text-2xl font-bold text-[#2C3E35] leading-none">{{ stats.global_open_rate }}%</span>
                <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {{ stats.total_opened }}
                </span>
              </div>
            </div>
            <div class="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden mt-2">
              <div
                class="h-full rounded-full bg-gradient-to-r from-[#D9826C] to-emerald-600 transition-all duration-500"
                :style="{ width: `${Math.min(100, stats.global_open_rate)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- KPI 3: En Cola y Programados (Ámbar Cálido) -->
        <div
          class="rounded-2xl px-4 py-3.5 bg-gradient-to-br from-[#FEF8EC] via-white to-white border border-amber-300/70 flex items-center gap-3.5"
        >
          <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Clock class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-800 truncate">
                Programados / Cola
              </span>
              <span class="text-2xl font-bold text-[#2C3E35] leading-none">
                {{ stats.pending_automation_queue + stats.scheduled_campaigns }}
              </span>
            </div>
            <p class="text-[11px] text-[#555852] truncate mt-1">
              <strong>{{ stats.scheduled_campaigns }}</strong> campañas · <strong>{{ stats.pending_automation_queue }}</strong> en 24/48/72h
            </p>
          </div>
        </div>

        <!-- KPI 4: Comunidad Disponible (Azul Océano) -->
        <div
          class="rounded-2xl px-4 py-3.5 bg-gradient-to-br from-[#EEF4F8] via-white to-white border border-[#3B6E8C]/30 flex items-center gap-3.5"
        >
          <div class="w-10 h-10 rounded-xl bg-[#3B6E8C] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Users class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#3B6E8C] truncate">
                Contactos Activos
              </span>
              <span class="text-2xl font-bold text-[#2C3E35] leading-none">
                {{ stats.active_leads_count + stats.active_students_count }}
              </span>
            </div>
            <p class="text-[11px] text-[#555852] truncate mt-1">
              <strong>{{ stats.active_leads_count }}</strong> leads recursos · <strong>{{ stats.active_students_count }}</strong> alumnos
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- NAVEGACIÓN PRINCIPAL EN 4 TARJETAS INTERACTIVAS (CLICABLES) -->
    <!-- ====================================================================== -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
      <button
        v-for="tab in navTabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="group relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3.5"
        :class="
          activeTab === tab.id
            ? 'bg-[#24332B] text-white border-[#24332B] shadow-md scale-[1.01]'
            : 'bg-white hover:bg-[#FAF8F5] text-[#2C3E35] border-[#E6E1DA]'
        "
      >
        <div
          class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br text-white shadow-xs"
          :class="tab.accent"
        >
          <component :is="tab.icon" class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-bold truncate">{{ tab.title }}</span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
              :class="
                activeTab === tab.id
                  ? 'bg-[#D9826C] text-white'
                  : 'bg-[#FAF8F5] text-[#4A6B5D] border border-[#E6E1DA]'
              "
            >
              {{ tab.badge }}
            </span>
          </div>
          <p
            class="text-xs truncate mt-0.5"
            :class="activeTab === tab.id ? 'text-white/75' : 'text-[#7C8B84]'"
          >
            {{ tab.subtitle }}
          </p>
        </div>
      </button>
    </div>

    <!-- ====================================================================== -->
    <!-- PESTAÑA 1: CAMPAÑAS Y PROGRAMACIÓN (PANTALLA COMPLETA 12 COLUMNAS) -->
    <!-- ====================================================================== -->
    <div v-if="activeTab === 'campaigns'" class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <!-- COLUMNA IZQUIERDA (5 cols): ASISTENTE PASO A PASO PARA CREAR CAMPAÑA -->
      <div
        class="xl:col-span-5 bg-white rounded-3xl border border-[#E6E1DA] shadow-sm overflow-hidden"
      >
        <div
          class="bg-gradient-to-r from-[#4A6B5D] to-[#2C3E35] p-6 text-white flex items-center justify-between"
        >
          <div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-[#D9826C] block">
              Creador de Envíos
            </span>
            <h2 class="font-editorial text-2xl font-semibold mt-0.5">
              Crear o Programar Campaña
            </h2>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
            <Send class="w-5 h-5 text-[#FAF8F5]" />
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- PASO 1: ELEGIR O SUBIR PLANTILLA HTML -->
          <div class="p-4 rounded-2xl bg-[#F4F8F6] border border-[#4A6B5D]/20 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-[#4A6B5D] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span class="text-xs font-bold uppercase tracking-wider text-[#2C3E35]">
                  Elige o sube la plantilla HTML
                </span>
              </div>
              <button
                v-if="campaignForm.html_content"
                type="button"
                @click="
                  openPreviewModal({
                    title: campaignForm.name || 'Preview de Campaña',
                    subject: campaignForm.subject,
                    preheader: campaignForm.preheader,
                    htmlContent: campaignForm.html_content,
                  })
                "
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <Eye class="w-3.5 h-3.5" />
                Preview & Test
              </button>
            </div>

            <select
              v-model="campaignForm.template_id"
              @change="selectTemplateForCampaign(campaignForm.template_id)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[#4A6B5D]/30 bg-white text-sm font-medium text-[#2C3E35] focus:outline-none focus:border-[#4A6B5D]"
            >
              <option :value="null">-- Seleccionar una plantilla de tu biblioteca --</option>
              <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
                {{ tpl.name }} ({{ tpl.original_filename || 'HTML' }})
              </option>
            </select>

            <label
              class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-[#4A6B5D]/50 bg-white hover:bg-[#4A6B5D]/5 text-xs font-bold text-[#4A6B5D] cursor-pointer transition"
            >
              <Upload class="w-4 h-4" />
              <span>
                {{
                  campaignForm.uploaded_filename
                    ? `Plantilla activa: ${campaignForm.uploaded_filename} (clic para cambiar)`
                    : 'O sube un archivo .html directamente desde tu ordenador'
                }}
              </span>
              <input
                type="file"
                accept=".html,.htm"
                class="hidden"
                @change="handleCampaignHtmlFileUpload"
              />
            </label>
          </div>

          <!-- PASO 2: ASUNTO DEL CORREO -->
          <div class="p-4 rounded-2xl bg-[#FDF6F3] border border-[#D9826C]/25 space-y-3">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-[#D9826C] text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span class="text-xs font-bold uppercase tracking-wider text-[#2C3E35]">
                Asunto que verán al recibir el correo
              </span>
            </div>

            <div>
              <input
                v-model="campaignForm.subject"
                type="text"
                placeholder="Ej: El truco para que la guía te funcione ❤️‍🩹"
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#D9826C]/30 bg-white text-sm font-semibold text-[#2C3E35] focus:outline-none focus:border-[#D9826C]"
              />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-[#7C8B84] mb-1">
                Subtítulo de vista previa en bandeja (Opcional):
              </label>
              <input
                v-model="campaignForm.preheader"
                type="text"
                placeholder="Frase breve que acompaña al asunto antes de abrir el correo..."
                class="w-full px-3 py-2 rounded-xl border border-[#E6E1DA] bg-white text-xs text-[#555852]"
              />
            </div>
          </div>

          <!-- PASO 3: DESTINATARIOS -->
          <div class="p-4 rounded-2xl bg-[#F3F6FA] border border-[#3B6E8C]/25 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-[#3B6E8C] text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span class="text-xs font-bold uppercase tracking-wider text-[#2C3E35]">
                  ¿A quién se enviará?
                </span>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-[#3B6E8C] text-white">
                {{ estimatedCampaignRecipientsCount }} destinatarios
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                @click="campaignForm.target_type = 'leads'"
                class="p-3 rounded-xl border text-left transition cursor-pointer"
                :class="
                  campaignForm.target_type === 'leads'
                    ? 'bg-[#3B6E8C] text-white border-[#3B6E8C] shadow-xs'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#2C3E35] border-[#E6E1DA]'
                "
              >
                <div class="text-xs font-bold">Solo Leads ({{ stats.active_leads_count }})</div>
                <div
                  class="text-[11px] mt-0.5"
                  :class="campaignForm.target_type === 'leads' ? 'text-white/80' : 'text-[#7C8B84]'"
                >
                  Recursos gratuitos
                </div>
              </button>

              <button
                type="button"
                @click="campaignForm.target_type = 'students'"
                class="p-3 rounded-xl border text-left transition cursor-pointer"
                :class="
                  campaignForm.target_type === 'students'
                    ? 'bg-[#3B6E8C] text-white border-[#3B6E8C] shadow-xs'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#2C3E35] border-[#E6E1DA]'
                "
              >
                <div class="text-xs font-bold">Solo Alumnos ({{ stats.active_students_count }})</div>
                <div
                  class="text-[11px] mt-0.5"
                  :class="campaignForm.target_type === 'students' ? 'text-white/80' : 'text-[#7C8B84]'"
                >
                  Alumnos de cursos
                </div>
              </button>

              <button
                type="button"
                @click="campaignForm.target_type = 'groups'"
                class="p-3 rounded-xl border text-left transition cursor-pointer"
                :class="
                  campaignForm.target_type === 'groups'
                    ? 'bg-[#3B6E8C] text-white border-[#3B6E8C] shadow-xs'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#2C3E35] border-[#E6E1DA]'
                "
              >
                <div class="text-xs font-bold">Por Grupos</div>
                <div
                  class="text-[11px] mt-0.5"
                  :class="campaignForm.target_type === 'groups' ? 'text-white/80' : 'text-[#7C8B84]'"
                >
                  {{ groups.length }} grupos disponibles
                </div>
              </button>

              <button
                type="button"
                @click="campaignForm.target_type = 'custom'"
                class="p-3 rounded-xl border text-left transition cursor-pointer"
                :class="
                  campaignForm.target_type === 'custom'
                    ? 'bg-[#3B6E8C] text-white border-[#3B6E8C] shadow-xs'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#2C3E35] border-[#E6E1DA]'
                "
              >
                <div class="text-xs font-bold">Correos Específicos</div>
                <div
                  class="text-[11px] mt-0.5"
                  :class="campaignForm.target_type === 'custom' ? 'text-white/80' : 'text-[#7C8B84]'"
                >
                  Elegir uno a uno
                </div>
              </button>

              <button
                type="button"
                @click="campaignForm.target_type = 'all'"
                class="col-span-2 p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between"
                :class="
                  campaignForm.target_type === 'all'
                    ? 'bg-[#3B6E8C] text-white border-[#3B6E8C] shadow-xs'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#2C3E35] border-[#E6E1DA]'
                "
              >
                <div>
                  <div class="text-xs font-bold">Enviar a Todos</div>
                  <div
                    class="text-[11px] mt-0.5"
                    :class="campaignForm.target_type === 'all' ? 'text-white/80' : 'text-[#7C8B84]'"
                  >
                    Leads de recursos gratuitos + Alumnos de cursos
                  </div>
                </div>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  :class="
                    campaignForm.target_type === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F3F6FA] text-[#3B6E8C]'
                  "
                >
                  Audiencia completa
                </span>
              </button>
            </div>

            <!-- Sub-selector de Grupos -->
            <div
              v-if="campaignForm.target_type === 'groups'"
              class="p-3 rounded-xl bg-white border border-[#E6E1DA] space-y-2"
            >
              <div v-if="groups.length === 0" class="text-xs text-[#7C8B84]">
                No tienes grupos creados aún. Ve a la pestaña "Grupos de Correos" para crear el primero.
              </div>
              <div v-else class="space-y-1.5 max-h-44 overflow-y-auto">
                <label
                  v-for="g in groups"
                  :key="g.id"
                  class="flex items-center justify-between p-2 rounded-lg hover:bg-[#FAF8F5] border border-[#EFECE6] cursor-pointer"
                >
                  <div class="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      :checked="campaignForm.target_group_ids.includes(g.id)"
                      @change="toggleCampaignGroupId(g.id)"
                    />
                    <span
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: g.color || '#4A6B5D' }"
                    ></span>
                    <span class="text-xs font-bold text-[#2C3E35]">{{ g.name }}</span>
                  </div>
                  <span class="text-[11px] font-semibold text-[#4A6B5D]">{{ g.members_count }} correos</span>
                </label>
              </div>
            </div>

            <!-- Sub-selector de Correos Específicos -->
            <div
              v-if="campaignForm.target_type === 'custom'"
              class="p-3 rounded-xl bg-white border border-[#E6E1DA] space-y-2.5"
            >
              <div class="relative">
                <Search class="w-3.5 h-3.5 text-[#7C8B84] absolute left-3 top-2.5" />
                <input
                  v-model="campaignSearchContact"
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1DA] text-xs"
                />
              </div>

              <div class="max-h-40 overflow-y-auto space-y-1 pr-1">
                <label
                  v-for="c in filteredCampaignContacts"
                  :key="c.email"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#FAF8F5] border border-[#EFECE6] cursor-pointer text-xs"
                >
                  <div class="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      :checked="campaignForm.target_emails.includes(c.email)"
                      @change="toggleCustomCampaignEmail(c.email)"
                    />
                    <span class="font-medium text-[#2C3E35] truncate">
                      {{ c.name ? `${c.name} · ${c.email}` : c.email }}
                    </span>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#4A6B5D] font-bold shrink-0">
                    {{ c.source_type === 'lead' ? 'Lead' : 'Alumno' }}
                  </span>
                </label>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-[#555852] mb-1">
                  O escribe otros correos manualmente (separados por coma):
                </label>
                <textarea
                  v-model="campaignForm.manual_emails_text"
                  rows="2"
                  placeholder="correo1@gmail.com, correo2@gmail.com"
                  class="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1DA] text-xs"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- PASO 4: CUÁNDO ENVIAR -->
          <div class="p-4 rounded-2xl bg-[#FEF9EE] border border-amber-300/60 space-y-3">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              <span class="text-xs font-bold uppercase tracking-wider text-[#2C3E35]">
                ¿Cuándo quieres que salga el envío?
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                @click="campaignForm.delivery_mode = 'now'"
                class="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                :class="
                  campaignForm.delivery_mode === 'now'
                    ? 'bg-[#24332B] text-white border-[#24332B] shadow-xs'
                    : 'bg-white text-[#555852] border-[#E6E1DA]'
                "
              >
                <Send class="w-3.5 h-3.5 text-[#D9826C]" />
                Enviar Ahora Mismo
              </button>

              <button
                type="button"
                @click="campaignForm.delivery_mode = 'scheduled'"
                class="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                :class="
                  campaignForm.delivery_mode === 'scheduled'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-[#555852] border-[#E6E1DA]'
                "
              >
                <Calendar class="w-3.5 h-3.5" />
                Programar Día y Hora
              </button>
            </div>

            <div
              v-if="campaignForm.delivery_mode === 'scheduled'"
              class="grid grid-cols-2 gap-3 pt-1"
            >
              <div>
                <label class="block text-[11px] font-bold text-amber-900 mb-1">Fecha de envío</label>
                <input
                  v-model="campaignForm.scheduled_date"
                  type="date"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-amber-900 mb-1">Hora exacta</label>
                <input
                  v-model="campaignForm.scheduled_time"
                  type="time"
                  class="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            @click="handleCreateCampaign"
            :disabled="creatingCampaign"
            class="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#24332B] to-[#3B5448] hover:from-[#1b2721] hover:to-[#2C3E35] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <Send v-if="campaignForm.delivery_mode === 'now'" class="w-4 h-4 text-[#D9826C]" />
            <Clock v-else class="w-4 h-4 text-amber-300" />
            <span>
              {{
                creatingCampaign
                  ? 'Procesando campaña...'
                  : campaignForm.delivery_mode === 'now'
                    ? `Lanzar Campaña Ahora (${estimatedCampaignRecipientsCount} destinatarios)`
                    : `Programar Campaña (${estimatedCampaignRecipientsCount} destinatarios)`
              }}
            </span>
          </button>
        </div>
      </div>

      <!-- COLUMNA DERECHA (7 cols): LISTADO VISUAL DE CAMPAÑAS Y APERTURAS -->
      <div class="xl:col-span-7 space-y-5">
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E1DA] shadow-sm space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFECE6] pb-4">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#4A6B5D]">
                Historial y Seguimiento en Vivo
              </span>
              <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
                Tus Campañas ({{ campaigns.length }})
              </h2>
            </div>
            <p class="text-xs text-[#7C8B84]">
              Pulsa en <strong>"Ver quién abrió"</strong> para ver el listado detallado de personas.
            </p>
          </div>

          <div
            v-if="campaigns.length === 0"
            class="text-center py-16 px-6 rounded-3xl bg-gradient-to-b from-[#FAF8F5] to-white border border-dashed border-[#E6E1DA]"
          >
            <div class="w-14 h-14 rounded-2xl bg-[#4A6B5D]/10 text-[#4A6B5D] flex items-center justify-center mx-auto mb-3">
              <Inbox class="w-7 h-7" />
            </div>
            <p class="text-base font-bold text-[#2C3E35]">
              Aún no has enviado ni programado ninguna campaña puntual
            </p>
            <p class="text-xs text-[#7C8B84] mt-1 max-w-md mx-auto">
              Completa los 4 pasos de la izquierda para enviar un correo a tus leads, a un grupo o a correos específicos.
            </p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="camp in campaigns"
              :key="camp.id"
              class="rounded-2xl border border-[#E6E1DA] bg-white hover:border-[#4A6B5D]/50 transition shadow-2xs overflow-hidden"
            >
              <!-- Franja superior de color según estado -->
              <div
                class="h-1.5 w-full"
                :class="{
                  'bg-gradient-to-r from-emerald-500 to-[#4A6B5D]': camp.status === 'sent',
                  'bg-gradient-to-r from-amber-400 to-amber-600': camp.status === 'scheduled',
                  'bg-gradient-to-r from-blue-500 to-indigo-500': camp.status === 'sending',
                  'bg-rose-500': camp.status === 'failed' || camp.status === 'cancelled',
                }"
              ></div>

              <div class="p-5 space-y-4">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="space-y-1.5">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                        :class="{
                          'bg-emerald-100 text-emerald-800': camp.status === 'sent',
                          'bg-amber-100 text-amber-800': camp.status === 'scheduled',
                          'bg-blue-100 text-blue-800': camp.status === 'sending',
                          'bg-rose-100 text-rose-800': camp.status === 'failed' || camp.status === 'cancelled',
                        }"
                      >
                        {{
                          camp.status === 'sent'
                            ? '✓ Enviada'
                            : camp.status === 'scheduled'
                              ? '⏰ Programada'
                              : camp.status === 'sending'
                                ? 'Enviando...'
                                : camp.status === 'cancelled'
                                  ? 'Cancelada'
                                  : 'Con Errores'
                        }}
                      </span>
                      <span class="text-xs font-semibold text-[#4A6B5D] bg-[#4A6B5D]/10 px-2.5 py-0.5 rounded-full">
                        {{ targetTypeLabel(camp.target_type) }}
                      </span>
                    </div>

                    <h3 class="text-lg font-bold text-[#2C3E35]">{{ camp.subject }}</h3>

                    <p class="text-xs text-[#7C8B84]">
                      <span v-if="camp.status === 'scheduled'">
                        Programada para salir el: <strong class="text-amber-800">{{ formatDateTime(camp.scheduled_at) }}</strong>
                      </span>
                      <span v-else-if="camp.completed_at">
                        Enviada el: <strong class="text-[#2C3E35]">{{ formatDateTime(camp.completed_at) }}</strong>
                      </span>
                      <span v-else>
                        Creada el: {{ formatDateTime(camp.created_at) }}
                      </span>
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      @click="openCampaignRecipientsModal(camp.id)"
                      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#24332B] hover:bg-[#364c40] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      <MailOpen class="w-4 h-4 text-[#D9826C]" />
                      <span>Ver quién abrió ({{ camp.opened_count }}/{{ camp.sent_count }})</span>
                    </button>

                    <button
                      v-if="camp.status === 'scheduled' || camp.status === 'draft'"
                      @click="handleSendCampaignNow(camp)"
                      title="Enviar ahora mismo"
                      class="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      <Play class="w-4 h-4" />
                    </button>

                    <button
                      v-if="camp.status === 'scheduled'"
                      @click="handleCancelCampaign(camp)"
                      title="Cancelar programación"
                      class="p-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                    >
                      <Ban class="w-4 h-4" />
                    </button>

                    <button
                      @click="handleDeleteCampaign(camp)"
                      title="Eliminar campaña"
                      class="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- 3 Cajas de color con métricas de la campaña -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="p-3 rounded-xl bg-[#F4F8F6] border border-[#4A6B5D]/15 flex items-center justify-between">
                    <span class="text-xs font-semibold text-[#4A6B5D]">Entregados</span>
                    <strong class="text-sm font-bold text-[#2C3E35]">
                      {{ camp.sent_count }} / {{ camp.total_recipients }}
                    </strong>
                  </div>

                  <div class="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                    <span class="text-xs font-semibold text-emerald-800">Abiertos</span>
                    <strong class="text-sm font-bold text-emerald-700">
                      {{ camp.opened_count }} ({{ camp.open_rate }}%)
                    </strong>
                  </div>

                  <div class="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] flex items-center justify-between">
                    <span class="text-xs font-semibold text-[#7C8B84]">Sin abrir aún</span>
                    <strong class="text-sm font-bold text-[#555852]">
                      {{ Math.max(0, camp.sent_count - camp.opened_count) }}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- PESTAÑA 2: EMBUDO AUTOMÁTICO 24H / 48H / 72H (DISEÑO VISUAL COLORIDO) -->
    <!-- ====================================================================== -->
    <div v-if="activeTab === 'automation'" class="space-y-6">
      <!-- Cabecera explicativa + Botón para encolar leads antiguos -->
      <div
        class="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E1DA] shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
      >
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D9826C]">
            <Zap class="w-4 h-4" />
            Secuencia Automática de Bienvenida (3 Correos)
          </div>
          <h2 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35]">
            Embudo para Nuevos Leads de Recursos Gratuitos (24h · 48h · 72h)
          </h2>
          <p class="text-xs sm:text-sm text-[#555852] max-w-3xl">
            Cada vez que una persona introduce su email por primera vez para desbloquear un recurso gratuito, el sistema agenda automáticamente estos 3 correos escalonados.
          </p>
        </div>

        <button
          @click="handleEnqueueAllExistingLeads"
          :disabled="enqueuingAllLeads"
          class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#24332B] hover:bg-[#354b3f] text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-sm"
        >
          <UserPlus class="w-4 h-4 text-[#D9826C]" />
          <span>
            {{
              enqueuingAllLeads
                ? 'Programando secuencia...'
                : 'Encolar también a leads anteriores'
            }}
          </span>
        </button>
      </div>

      <!-- LAS 3 TARJETAS DEL EMBUDO CON COLORES DIFERENCIADOS -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          v-for="(step, idx) in automationSteps"
          :key="step.id"
          class="rounded-3xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all"
          :class="[
            getStepTheme(idx).cardBg,
            getStepTheme(idx).border,
            !step.is_active ? 'opacity-65 grayscale-[30%]' : '',
          ]"
        >
          <!-- Header coloreado de la tarjeta del paso -->
          <div>
            <div
              class="p-5 bg-gradient-to-r text-white flex items-center justify-between"
              :class="getStepTheme(idx).headerGradient"
            >
              <div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-white/80 block">
                  {{ getStepTheme(idx).dayLabel }}
                </span>
                <h3 class="font-editorial text-xl font-semibold mt-0.5">
                  Correo #{{ idx + 1 }} (+{{ step.delay_hours }}h)
                </h3>
              </div>

              <!-- Switch Activo / Pausado -->
              <label
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-xs cursor-pointer text-xs font-bold"
              >
                <input
                  type="checkbox"
                  v-model="step.is_active"
                  @change="handleSaveAutomationStep(step)"
                  class="rounded accent-emerald-400"
                />
                <span>{{ step.is_active ? 'Activo' : 'Pausado' }}</span>
              </label>
            </div>

            <!-- Cuerpo del Paso -->
            <div class="p-6 space-y-4">
              <!-- Métricas del paso en 2 bloques -->
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-2xl bg-white border border-[#E6E1DA] shadow-2xs">
                  <span class="text-[10px] font-bold uppercase text-[#7C8B84] block">Enviados</span>
                  <strong class="text-xl font-bold text-[#2C3E35]">{{ step.total_sent }}</strong>
                </div>
                <div class="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 shadow-2xs">
                  <span class="text-[10px] font-bold uppercase text-emerald-800 block">Abiertos</span>
                  <strong class="text-xl font-bold text-emerald-700">
                    {{ step.total_opened }} ({{ step.open_rate }}%)
                  </strong>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="col-span-1">
                  <label class="block text-[11px] font-bold uppercase text-[#555852] mb-1">
                    Horas espera
                  </label>
                  <input
                    v-model.number="step.delay_hours"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 rounded-xl bg-white border border-[#E6E1DA] text-xs font-bold text-[#2C3E35]"
                  />
                </div>
                <div class="col-span-2">
                  <label class="block text-[11px] font-bold uppercase text-[#555852] mb-1">
                    Archivo HTML Activo
                  </label>
                  <div
                    class="px-3 py-2 rounded-xl bg-white border border-[#E6E1DA] text-xs font-bold truncate"
                    :class="getStepTheme(idx).accentText"
                  >
                    {{ step.original_filename || `${step.delay_hours}h.html` }}
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase text-[#555852] mb-1">
                  Asunto del Correo
                </label>
                <input
                  v-model="step.subject"
                  type="text"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E6E1DA] text-xs font-semibold text-[#2C3E35]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase text-[#7C8B84] mb-1">
                  Preheader (Vista previa en bandeja)
                </label>
                <input
                  v-model="step.preheader"
                  type="text"
                  class="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E6E1DA] text-xs text-[#555852]"
                />
              </div>

              <!-- Subir nuevo archivo HTML -->
              <label
                class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed bg-white hover:bg-[#FAF8F5] text-xs font-bold cursor-pointer transition"
                :class="[getStepTheme(idx).border, getStepTheme(idx).accentText]"
              >
                <Upload class="w-4 h-4" />
                <span>Subir / Cambiar plantilla .html ({{ step.delay_hours }}h)</span>
                <input
                  type="file"
                  accept=".html,.htm"
                  class="hidden"
                  @change="handleStepFileUpload(step, $event)"
                />
              </label>
            </div>
          </div>

          <!-- Botones de Acción del Paso -->
          <div class="px-6 pb-6 pt-2 flex items-center gap-2.5">
            <button
              type="button"
              @click="
                openPreviewModal({
                  title: step.title,
                  subject: step.subject,
                  preheader: step.preheader,
                  htmlContent: step.html_content,
                })
              "
              class="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-[#EFECE6] text-[#2C3E35] border border-[#E6E1DA] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Eye class="w-4 h-4 text-[#D9826C]" />
              Preview y Test
            </button>

            <button
              type="button"
              @click="handleSaveAutomationStep(step)"
              :disabled="savingStepId === step.id"
              class="flex-1 py-2.5 px-3 rounded-xl bg-[#24332B] hover:bg-[#1a2620] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Check class="w-4 h-4 text-emerald-400" />
              {{ savingStepId === step.id ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>

      <!-- TABLA A ANCHO COMPLETO DE LA COLA Y APERTURAS DEL EMBUDO -->
      <div class="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E1DA] shadow-sm space-y-5">
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-[#EFECE6] pb-4">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-[#4A6B5D]">
              Seguimiento Individual de Nuevos Usuarios
            </span>
            <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
              Cola de Envíos y Aperturas (24h / 48h / 72h)
            </h3>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <div class="relative">
              <Search class="w-3.5 h-3.5 text-[#7C8B84] absolute left-3 top-2.5" />
              <input
                v-model="automationSearch"
                type="text"
                placeholder="Buscar usuario o correo..."
                class="pl-8 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs w-52"
              />
            </div>

            <select
              v-model="automationFilterStep"
              class="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs font-bold text-[#2C3E35]"
            >
              <option value="all">Todos los pasos (24h, 48h, 72h)</option>
              <option value="24">Paso 1 (+24h)</option>
              <option value="48">Paso 2 (+48h)</option>
              <option value="72">Paso 3 (+72h)</option>
            </select>

            <select
              v-model="automationFilterStatus"
              class="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs font-bold text-[#2C3E35]"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">⏰ En cola (Pendientes)</option>
              <option value="sent">✓ Enviados</option>
              <option value="opened">👁️ Abiertos por el usuario</option>
            </select>
          </div>
        </div>

        <div
          v-if="filteredAutomationQueue.length === 0"
          class="text-center py-12 px-4 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#E6E1DA] text-xs text-[#7C8B84]"
        >
          No hay envíos en la cola con este filtro.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[#FAF8F5] border-y border-[#E6E1DA] text-[#555852] uppercase tracking-wider text-[11px]">
                <th class="py-3.5 px-4">Usuario / Lead</th>
                <th class="py-3.5 px-4">Correo del Embudo</th>
                <th class="py-3.5 px-4">Fecha Programada</th>
                <th class="py-3.5 px-4">Estado de Entrega</th>
                <th class="py-3.5 px-4">¿Abrió el Correo?</th>
                <th class="py-3.5 px-4 text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFECE6]">
              <tr
                v-for="item in filteredAutomationQueue"
                :key="item.id"
                class="hover:bg-[#FAF8F5]/80 transition"
              >
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-[#4A6B5D]/15 text-[#4A6B5D] font-bold text-xs flex items-center justify-center shrink-0"
                    >
                      {{ getInitials(item.name, item.email) }}
                    </div>
                    <div>
                      <div class="font-bold text-[#2C3E35]">{{ item.name || 'Sin nombre (Saludo ¡Hola!)' }}</div>
                      <div class="text-[#7C8B84]">{{ item.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                    :class="{
                      'bg-[#4A6B5D]/15 text-[#4A6B5D]': item.delay_hours === 24,
                      'bg-[#D9826C]/15 text-[#b85d46]': item.delay_hours === 48,
                      'bg-[#24332B]/15 text-[#24332B]': item.delay_hours === 72,
                    }"
                  >
                    Correo +{{ item.delay_hours }}h
                  </span>
                  <div class="text-[11px] font-medium text-[#555852] mt-1">
                    {{ item.step_subject }}
                  </div>
                </td>
                <td class="py-3.5 px-4 font-semibold text-[#2C3E35]">
                  {{ formatDateTime(item.scheduled_for) }}
                </td>
                <td class="py-3.5 px-4">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    :class="{
                      'bg-amber-100 text-amber-800': item.status === 'pending',
                      'bg-emerald-100 text-emerald-800': item.status === 'sent',
                      'bg-rose-100 text-rose-800': item.status === 'failed',
                      'bg-gray-100 text-gray-600': item.status === 'cancelled' || item.status === 'skipped_unsubscribed',
                    }"
                  >
                    {{
                      item.status === 'pending'
                        ? '⏰ En espera'
                        : item.status === 'sent'
                          ? `✓ Enviado (${formatDateTime(item.sent_at)})`
                          : item.status === 'failed'
                            ? '⚠️ Error envío'
                            : 'Cancelado / Baja'
                    }}
                  </span>
                </td>
                <td class="py-3.5 px-4">
                  <div
                    v-if="item.is_opened"
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800"
                  >
                    <MailOpen class="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span class="font-bold block">¡Abierto! ({{ item.open_count }}x)</span>
                      <span class="text-[10px] text-emerald-700">{{ formatDateTime(item.opened_at) }}</span>
                    </div>
                  </div>
                  <span
                    v-else-if="item.status === 'sent'"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 text-[#7C8B84] font-medium"
                  >
                    Sin abrir aún
                  </span>
                  <span v-else class="text-[#7C8B84]/50">—</span>
                </td>
                <td class="py-3.5 px-4 text-right space-x-2">
                  <button
                    v-if="item.status === 'pending' || item.status === 'failed'"
                    @click="handleSendQueueItemNow(item)"
                    class="px-3 py-1.5 rounded-xl bg-[#4A6B5D] hover:bg-[#3a554a] text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
                  >
                    Enviar Ahora
                  </button>
                  <button
                    v-if="item.status === 'pending'"
                    @click="handleCancelQueueItem(item)"
                    class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- PESTAÑA 3: BIBLIOTECA DE PLANTILLAS HTML, PREVIEW Y ENVÍO DE TEST -->
    <!-- ====================================================================== -->
    <div v-if="activeTab === 'templates'" class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <!-- Subir nueva plantilla (4 cols) -->
      <div
        class="xl:col-span-4 bg-white rounded-3xl border border-[#E6E1DA] shadow-sm overflow-hidden"
      >
        <div class="bg-gradient-to-r from-[#3B6E8C] to-[#274B60] p-6 text-white">
          <span class="text-[10px] font-bold uppercase tracking-widest text-sky-200 block">
            Formatos .HTML
          </span>
          <h2 class="font-editorial text-2xl font-semibold mt-0.5">
            Subir Nueva Plantilla
          </h2>
          <p class="text-xs text-white/80 mt-1">
            Usa <code>[Nombre]</code> donde quieras que aparezca el nombre del usuario.
          </p>
        </div>

        <div class="p-6 space-y-4">
          <label
            class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#3B6E8C]/40 bg-[#F3F7FA] hover:bg-[#E7F0F6] cursor-pointer transition text-center"
          >
            <div class="w-12 h-12 rounded-2xl bg-[#3B6E8C] text-white flex items-center justify-center mb-2.5 shadow-xs">
              <Upload class="w-6 h-6" />
            </div>
            <span class="text-sm font-bold text-[#2C3E35]">
              {{ newTemplateForm.filename || 'Seleccionar archivo .html de tu equipo' }}
            </span>
            <span class="text-xs text-[#7C8B84] mt-1">
              El asunto se rellena solo leyendo la etiqueta &lt;title&gt;
            </span>
            <input
              type="file"
              accept=".html,.htm"
              class="hidden"
              @change="handleNewTemplateFileChange"
            />
          </label>

          <div>
            <label class="block text-xs font-bold uppercase text-[#3B6E8C] mb-1">
              Nombre identificativo
            </label>
            <input
              v-model="newTemplateForm.name"
              type="text"
              placeholder="Ej: Correo Especial Domingo"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1DA] text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-[#3B6E8C] mb-1">
              Asunto del correo
            </label>
            <input
              v-model="newTemplateForm.subject"
              type="text"
              placeholder="Ej: El truco para que la guía te funcione ❤️‍🩹"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1DA] text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-[#7C8B84] mb-1">
              Preheader opcional
            </label>
            <input
              v-model="newTemplateForm.preheader"
              type="text"
              placeholder="Texto corto de vista previa..."
              class="w-full px-3.5 py-2 rounded-xl border border-[#E6E1DA] text-xs"
            />
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              v-if="newTemplateForm.html_content"
              type="button"
              @click="
                openPreviewModal({
                  title: newTemplateForm.name || 'Vista Previa',
                  subject: newTemplateForm.subject,
                  preheader: newTemplateForm.preheader,
                  htmlContent: newTemplateForm.html_content,
                })
              "
              class="flex-1 py-3 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#2C3E35] border border-[#E6E1DA] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye class="w-4 h-4 text-[#D9826C]" />
              Preview / Test
            </button>

            <button
              type="button"
              @click="handleCreateTemplate"
              :disabled="uploadingTemplate"
              class="flex-1 py-3 px-4 rounded-xl bg-[#3B6E8C] hover:bg-[#2f5972] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Plus class="w-4 h-4" />
              {{ uploadingTemplate ? 'Guardando...' : 'Guardar en Biblioteca' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Grid de Plantillas Guardadas (8 cols) -->
      <div class="xl:col-span-8 space-y-5">
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E1DA] shadow-sm space-y-5">
          <div class="flex items-center justify-between border-b border-[#EFECE6] pb-4">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#3B6E8C]">
                Plantillas Listas para Enviar
              </span>
              <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
                Tu Biblioteca de Plantillas HTML ({{ templates.length }})
              </h2>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(tpl, idx) in templates"
              :key="tpl.id"
              class="rounded-2xl border border-[#E6E1DA] bg-gradient-to-b from-[#FAF8F5] to-white p-5 flex flex-col justify-between space-y-4 hover:border-[#3B6E8C]/50 transition shadow-2xs"
            >
              <div class="space-y-2.5">
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#3B6E8C]/12 text-[#3B6E8C]"
                  >
                    {{ tpl.original_filename || `plantilla_${idx + 1}.html` }}
                  </span>
                  <button
                    @click="handleDeleteTemplate(tpl)"
                    class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                    title="Eliminar plantilla"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>

                <h3 class="text-base font-bold text-[#2C3E35]">{{ tpl.name }}</h3>
                <p class="text-xs text-[#555852] bg-white p-2.5 rounded-xl border border-[#EFECE6]">
                  <strong class="text-[#4A6B5D]">Asunto:</strong> {{ tpl.subject }}
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EFECE6]">
                <button
                  @click="
                    openPreviewModal({
                      title: tpl.name,
                      subject: tpl.subject,
                      preheader: tpl.preheader,
                      htmlContent: tpl.html_content,
                    })
                  "
                  class="flex-1 py-2 px-3 rounded-xl bg-[#24332B] hover:bg-[#354b3f] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye class="w-3.5 h-3.5 text-[#D9826C]" />
                  Preview / Test
                </button>

                <button
                  @click="useTemplateInNewCampaign(tpl)"
                  class="py-2 px-3 rounded-xl bg-[#D9826C]/15 hover:bg-[#D9826C]/25 text-[#b85d46] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Send class="w-3.5 h-3.5" />
                  Usar en Campaña
                </button>

                <button
                  @click="editingTemplate = { ...tpl }"
                  class="p-2 rounded-xl bg-white hover:bg-[#EFECE6] text-[#2C3E35] border border-[#E6E1DA] text-xs font-semibold cursor-pointer"
                  title="Editar código HTML"
                >
                  <Code2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Editor de código HTML si se selecciona "Editar" -->
        <div
          v-if="editingTemplate"
          class="bg-white rounded-3xl p-6 border-2 border-[#3B6E8C] shadow-lg space-y-4"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-editorial text-xl font-semibold text-[#2C3E35]">
              Editando código HTML: {{ editingTemplate.name }}
            </h3>
            <button @click="editingTemplate = null" class="text-xs font-bold text-[#7C8B84] hover:text-[#2C3E35]">
              Cerrar editor
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#3B6E8C] mb-1">Nombre</label>
              <input v-model="editingTemplate.name" class="w-full px-3 py-2 rounded-xl border border-[#E6E1DA] text-xs" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#3B6E8C] mb-1">Asunto</label>
              <input v-model="editingTemplate.subject" class="w-full px-3 py-2 rounded-xl border border-[#E6E1DA] text-xs" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-[#3B6E8C] mb-1">Código HTML</label>
            <textarea
              v-model="editingTemplate.html_content"
              rows="12"
              class="w-full p-3.5 rounded-2xl border border-[#E6E1DA] font-mono text-xs bg-[#1E242B] text-emerald-300"
            ></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="handleSaveEditedTemplate"
              class="px-5 py-2.5 rounded-xl bg-[#3B6E8C] text-white text-xs font-bold cursor-pointer"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- PESTAÑA 4: GRUPOS DE CORREOS Y SEGMENTACIÓN -->
    <!-- ====================================================================== -->
    <div v-if="activeTab === 'groups'" class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <!-- Crear grupo (5 cols) -->
      <div class="xl:col-span-5 bg-white rounded-3xl border border-[#E6E1DA] shadow-sm overflow-hidden">
        <div class="bg-gradient-to-r from-[#7A5C8F] to-[#523B63] p-6 text-white">
          <span class="text-[10px] font-bold uppercase tracking-widest text-purple-200 block">
            Segmentación de Audiencia
          </span>
          <h2 class="font-editorial text-2xl font-semibold mt-0.5">
            Crear Nuevo Grupo de Correos
          </h2>
          <p class="text-xs text-white/80 mt-1">
            Agrupa contactos para enviarles campañas específicas cuando quieras.
          </p>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase text-[#7A5C8F] mb-1">
              Nombre del Grupo
            </label>
            <input
              v-model="newGroupForm.name"
              type="text"
              placeholder="Ej: Interesados en Terapia 1:1"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1DA] text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-[#7C8B84] mb-1">
              Descripción breve
            </label>
            <input
              v-model="newGroupForm.description"
              type="text"
              placeholder="Ej: Leads que descargaron la guía de apego ansioso"
              class="w-full px-3.5 py-2 rounded-xl border border-[#E6E1DA] text-xs"
            />
          </div>

          <!-- Selector de color de la tarjeta del grupo -->
          <div>
            <label class="block text-xs font-bold uppercase text-[#7C8B84] mb-1.5">
              Color de etiqueta del grupo
            </label>
            <div class="flex items-center gap-2.5">
              <button
                v-for="c in groupColors"
                :key="c.hex"
                type="button"
                @click="newGroupForm.color = c.hex"
                class="w-7 h-7 rounded-full transition transform cursor-pointer flex items-center justify-center"
                :style="{ backgroundColor: c.hex }"
                :class="newGroupForm.color === c.hex ? 'ring-2 ring-offset-2 ring-[#2C3E35] scale-110' : 'opacity-70'"
              >
                <Check v-if="newGroupForm.color === c.hex" class="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          <!-- Seleccionar contactos existentes -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase text-[#7A5C8F]">
                Contactos seleccionados ({{ newGroupForm.selectedEmails.length }})
              </label>
              <button
                type="button"
                @click="selectAllFilteredForNewGroup"
                class="text-[11px] font-bold text-[#D9826C] hover:underline cursor-pointer"
              >
                Marcar todos los visibles
              </button>
            </div>

            <div class="relative">
              <Search class="w-3.5 h-3.5 text-[#7C8B84] absolute left-3 top-2.5" />
              <input
                v-model="groupContactSearch"
                type="text"
                placeholder="Filtrar por nombre, correo o recurso..."
                class="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs"
              />
            </div>

            <div class="max-h-56 overflow-y-auto space-y-1.5 p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA]">
              <label
                v-for="c in filteredContactsForGroup"
                :key="c.email"
                class="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-[#E6E1DA] cursor-pointer text-xs hover:border-[#7A5C8F]"
              >
                <div class="flex items-center gap-2.5 truncate">
                  <input
                    type="checkbox"
                    :checked="newGroupForm.selectedEmails.includes(c.email)"
                    @change="toggleNewGroupContact(c.email)"
                  />
                  <div class="truncate">
                    <span class="font-bold text-[#2C3E35]">{{ c.email }}</span>
                    <span v-if="c.name" class="text-[#7C8B84] ml-1">({{ c.name }})</span>
                  </div>
                </div>
                <span class="text-[10px] text-[#7C8B84] ml-2 shrink-0">{{ c.source_label }}</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            @click="handleCreateGroup"
            :disabled="creatingGroup"
            class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7A5C8F] to-[#523B63] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Plus class="w-4 h-4" />
            {{ creatingGroup ? 'Creando grupo...' : `Crear Grupo (${newGroupForm.selectedEmails.length} correos)` }}
          </button>
        </div>
      </div>

      <!-- Tarjetas de Grupos (7 cols) -->
      <div class="xl:col-span-7 space-y-4">
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E1DA] shadow-sm space-y-5">
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
            Tus Grupos de Correos ({{ groups.length }})
          </h2>

          <div
            v-if="groups.length === 0"
            class="text-center py-14 px-4 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#E6E1DA] text-xs text-[#7C8B84]"
          >
            Aún no has creado ningún grupo. Usa el panel izquierdo para crear tu primer segmento.
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
            <div
              v-for="grp in groups"
              :key="grp.id"
              class="rounded-2xl border border-[#E6E1DA] bg-white overflow-hidden shadow-2xs"
            >
              <div class="h-2 w-full" :style="{ backgroundColor: grp.color || '#4A6B5D' }"></div>
              <div class="p-5 space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-2xl text-white font-bold flex items-center justify-center"
                      :style="{ backgroundColor: grp.color || '#4A6B5D' }"
                    >
                      <Users class="w-5 h-5" />
                    </div>
                    <div>
                      <h3 class="text-base font-bold text-[#2C3E35]">{{ grp.name }}</h3>
                      <p class="text-xs text-[#7C8B84]">
                        {{ grp.description || 'Grupo personalizado' }} ·
                        <strong class="text-[#2C3E35]">{{ grp.members_count }} correos</strong>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      @click="
                        selectedGroupForEdit =
                          selectedGroupForEdit?.id === grp.id ? null : grp
                      "
                      class="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E6E1DA] text-xs font-bold text-[#2C3E35] cursor-pointer"
                    >
                      {{
                        selectedGroupForEdit?.id === grp.id
                          ? 'Ocultar lista de correos'
                          : 'Ver / Añadir correos'
                      }}
                    </button>
                    <button
                      @click="handleDeleteGroup(grp)"
                      class="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Lista desplegable de correos del grupo -->
                <div
                  v-if="selectedGroupForEdit?.id === grp.id"
                  class="pt-4 border-t border-[#EFECE6] space-y-3"
                >
                  <div class="flex gap-2">
                    <input
                      v-model="manualGroupEmails"
                      type="text"
                      placeholder="Pegar correos adicionales separados por coma..."
                      class="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs"
                    />
                    <button
                      @click="handleAddManualEmailsToGroup(grp)"
                      class="px-4 py-2 rounded-xl bg-[#24332B] text-white text-xs font-bold cursor-pointer"
                    >
                      Añadir al grupo
                    </button>
                  </div>

                  <div class="max-h-52 overflow-y-auto divide-y divide-[#EFECE6] bg-[#FAF8F5] rounded-xl border border-[#E6E1DA]">
                    <div
                      v-for="m in grp.members"
                      :key="m.id"
                      class="flex items-center justify-between px-3.5 py-2 text-xs"
                    >
                      <div>
                        <span class="font-bold text-[#2C3E35]">{{ m.email }}</span>
                        <span v-if="m.name" class="text-[#7C8B84] ml-1.5">({{ m.name }})</span>
                      </div>
                      <button
                        @click="handleRemoveMemberFromGroup(grp, m.id)"
                        class="text-rose-600 hover:underline text-[11px] font-bold cursor-pointer"
                      >
                        Quitar
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

    <!-- ====================================================================== -->
    <!-- MODAL DE VISTA PREVIA (ESCRITORIO / MÓVIL / TEXTO PLANO) + ENVIAR TEST -->
    <!-- ====================================================================== -->
    <div
      v-if="previewModal.open"
      class="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        class="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col border border-[#E6E1DA] shadow-2xl overflow-hidden"
      >
        <div class="p-5 bg-gradient-to-r from-[#24332B] to-[#364C40] text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <span class="text-[10px] uppercase tracking-widest text-[#D9826C] font-bold block">
              Simulador de Correo y Envío de Prueba
            </span>
            <h3 class="font-editorial text-xl font-semibold">
              {{ previewModal.subject || previewModal.title }}
            </h3>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="previewModal.device = 'desktop'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              :class="
                previewModal.device === 'desktop'
                  ? 'bg-[#D9826C] text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              "
            >
              <Monitor class="w-3.5 h-3.5" />
              Escritorio
            </button>
            <button
              @click="previewModal.device = 'mobile'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              :class="
                previewModal.device === 'mobile'
                  ? 'bg-[#D9826C] text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              "
            >
              <Smartphone class="w-3.5 h-3.5" />
              Móvil
            </button>
            <button
              @click="previewModal.device = 'plain'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              :class="
                previewModal.device === 'plain'
                  ? 'bg-[#D9826C] text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              "
            >
              <FileText class="w-3.5 h-3.5" />
              Respaldo Texto Plano
            </button>
            <button
              @click="previewModal.open = false"
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white ml-2 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="p-4 bg-[#FAF8F5] border-b border-[#E6E1DA] flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="font-bold text-[#2C3E35]">Probar reemplazo de [Nombre]:</span>
            <input
              v-model="previewModal.sampleName"
              @input="refreshPreviewRender"
              type="text"
              placeholder="Borra el nombre para ver saludo sin nombre"
              class="px-3 py-1.5 rounded-xl bg-white border border-[#E6E1DA] text-xs font-semibold w-44"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="previewModal.testRecipientEmail"
              type="email"
              placeholder="Escribe tu email para recibir un TEST..."
              class="px-3.5 py-2 rounded-xl bg-white border border-[#E6E1DA] text-xs w-64"
            />
            <button
              @click="handleSendTestEmail"
              :disabled="previewModal.sendingTest"
              class="px-4 py-2 rounded-xl bg-[#4A6B5D] hover:bg-[#3a554a] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send class="w-3.5 h-3.5" />
              {{ previewModal.sendingTest ? 'Enviando Test...' : 'Enviar Correo de Prueba' }}
            </button>
          </div>
        </div>

        <div class="flex-1 bg-[#E5E0D8] p-6 overflow-y-auto flex justify-center">
          <iframe
            v-if="previewModal.device !== 'plain'"
            :srcdoc="previewModal.renderedHtml"
            class="bg-white rounded-2xl shadow-xl border border-[#E6E1DA] transition-all duration-200"
            :style="{
              width: previewModal.device === 'mobile' ? '375px' : '100%',
              maxWidth: previewModal.device === 'mobile' ? '375px' : '720px',
              height: '560px',
            }"
          ></iframe>

          <pre
            v-else
            class="bg-white rounded-2xl p-6 shadow-xl border border-[#E6E1DA] w-full max-w-2xl text-xs font-mono whitespace-pre-wrap text-[#2C3E35] overflow-y-auto h-[560px]"
          >{{ previewModal.plainText }}</pre>
        </div>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- MODAL DE INSPECCIÓN DE APERTURAS POR DESTINATARIO -->
    <!-- ====================================================================== -->
    <div
      v-if="campaignDetailModal.open"
      class="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        class="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-[#E6E1DA] shadow-2xl overflow-hidden"
      >
        <div class="p-5 bg-gradient-to-r from-[#24332B] to-[#3B5448] text-white flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase tracking-widest text-[#D9826C] font-bold block">
              Detalle de Destinatarios y Aperturas
            </span>
            <h3 class="font-editorial text-xl font-semibold">
              {{ campaignDetailModal.campaign?.subject || 'Detalle de Campaña' }}
            </h3>
          </div>
          <button
            @click="campaignDetailModal.open = false"
            class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div v-if="campaignDetailModal.loading" class="p-12 text-center text-sm text-[#7C8B84]">
          Cargando destinatarios...
        </div>

        <template v-else-if="campaignDetailModal.campaign">
          <div class="p-4 bg-[#FAF8F5] border-b border-[#E6E1DA] flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <button
                @click="campaignDetailModal.filter = 'all'"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                :class="
                  campaignDetailModal.filter === 'all'
                    ? 'bg-[#24332B] text-white'
                    : 'bg-white text-[#555852] border border-[#E6E1DA]'
                "
              >
                Todos ({{ campaignDetailModal.campaign.recipients?.length || 0 }})
              </button>
              <button
                @click="campaignDetailModal.filter = 'opened'"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                :class="
                  campaignDetailModal.filter === 'opened'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-emerald-700 border border-[#E6E1DA]'
                "
              >
                👁️ Abrieron el correo ({{ campaignDetailModal.campaign.opened_count }})
              </button>
              <button
                @click="campaignDetailModal.filter = 'unopened'"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                :class="
                  campaignDetailModal.filter === 'unopened'
                    ? 'bg-[#4A6B5D] text-white'
                    : 'bg-white text-[#555852] border border-[#E6E1DA]'
                "
              >
                Sin abrir aún
              </button>
            </div>

            <input
              v-model="campaignDetailModal.search"
              type="text"
              placeholder="Buscar por nombre o email..."
              class="px-3.5 py-1.5 rounded-xl bg-white border border-[#E6E1DA] text-xs w-56"
            />
          </div>

          <div class="flex-1 overflow-y-auto p-5">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-[#E6E1DA] text-[#7C8B84] uppercase text-[11px]">
                  <th class="py-3 px-3">Destinatario</th>
                  <th class="py-3 px-3">Estado Envío</th>
                  <th class="py-3 px-3">¿Abrió el correo?</th>
                  <th class="py-3 px-3">Fecha Apertura</th>
                  <th class="py-3 px-3">Aperturas</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFECE6]">
                <tr
                  v-for="r in filteredCampaignRecipients"
                  :key="r.id"
                  class="hover:bg-[#FAF8F5]"
                >
                  <td class="py-3 px-3">
                    <div class="font-bold text-[#2C3E35]">{{ r.name || '—' }}</div>
                    <div class="text-[#7C8B84]">{{ r.email }}</div>
                  </td>
                  <td class="py-3 px-3">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      :class="{
                        'bg-emerald-100 text-emerald-800': r.status === 'sent',
                        'bg-amber-100 text-amber-800': r.status === 'pending',
                        'bg-rose-100 text-rose-800': r.status === 'failed',
                      }"
                    >
                      {{ r.status === 'sent' ? '✓ Enviado' : r.status }}
                    </span>
                  </td>
                  <td class="py-3 px-3">
                    <span
                      v-if="r.is_opened"
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5" />
                      Sí, abierto
                    </span>
                    <span v-else class="text-[#7C8B84]">No abierto</span>
                  </td>
                  <td class="py-3 px-3 font-medium text-[#2C3E35]">
                    {{ formatDateTime(r.opened_at) }}
                  </td>
                  <td class="py-3 px-3 font-bold text-[#2C3E35]">
                    {{ r.open_count > 0 ? `${r.open_count}x` : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
