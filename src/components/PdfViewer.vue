<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  ExternalLink,
  Download,
  BookOpen,
  Monitor,
  Smartphone,
  RefreshCw
} from 'lucide-vue-next'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Documento PDF'
  },
  downloadUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['loaded', 'error'])

// Detección de dispositivo móvil (iOS / Android)
const isMobileDevice = ref(false)

// Modos del visor:
// 'native'      -> Usa el motor nativo del navegador (iframe). Rápido, perfecto en desktop, sin dependencias.
// 'interactive' -> Usa PDF.js para renderizado multipágina continuo en canvas (solución para iOS).
const viewerMode = ref('native')

// Estado para modo interactivo (PDF.js)
const interactiveLoading = ref(false)
const interactiveError = ref('')
const totalPages = ref(0)
const currentPage = ref(1)
const zoomLevel = ref(1.0)

// Referencias del DOM para modo interactivo
const viewerContainer = ref(null)
const pageRefs = ref({})
const canvasRefs = ref({})

let pdfDoc = null
let renderTasks = {}
let pageVisibilityObserver = null
let lazyRenderObserver = null
let resizeObserver = null
const renderedPages = new Set()
const renderingPages = new Set()
const pageAspectRatios = ref({})

// CDN URLs para PDF.js v3
const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
const PDFJS_FALLBACK_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
const PDFJS_FALLBACK_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

function checkMobile() {
  if (typeof window === 'undefined') return false
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && 'ontouchstart' in window)
  )
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-pdfjs="${src}"]`)
    if (existing) {
      if (window.pdfjsLib) return resolve(window.pdfjsLib)
      existing.addEventListener('load', () => resolve(window.pdfjsLib))
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.setAttribute('data-pdfjs', src)
    script.onload = () => resolve(window.pdfjsLib)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function ensurePdfJsLoaded() {
  if (window.pdfjsLib) return window.pdfjsLib

  try {
    await loadScript(PDFJS_CDN_URL)
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL
      return window.pdfjsLib
    }
  } catch (err) {
    console.warn('[PdfViewer] cdnjs falló, usando jsDelivr...', err)
  }

  await loadScript(PDFJS_FALLBACK_CDN)
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_FALLBACK_WORKER
    return window.pdfjsLib
  }

  throw new Error('No se pudo inicializar la librería multipágina.')
}

async function startInteractiveMode() {
  viewerMode.value = 'interactive'
  interactiveLoading.value = true
  interactiveError.value = ''
  totalPages.value = 0
  currentPage.value = 1
  renderedPages.clear()
  renderingPages.clear()
  cancelAllRenders()

  try {
    const pdfjs = await ensurePdfJsLoaded()

    // Intentar primero obtener el buffer de memoria para evitar problemas de CORS y Range
    let loadingTask
    try {
      const response = await fetch(props.src, { mode: 'cors' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      })
    } catch {
      // Fallback a URL directa si fetch falló
      loadingTask = pdfjs.getDocument({
        url: props.src,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      })
    }

    pdfDoc = await loadingTask.promise
    totalPages.value = pdfDoc.numPages
    emit('loaded', { totalPages: totalPages.value })

    try {
      const firstPage = await pdfDoc.getPage(1)
      const viewport = firstPage.getViewport({ scale: 1.0 })
      pageAspectRatios.value[1] = viewport.height / viewport.width
    } catch {
      pageAspectRatios.value[1] = 1.414
    }

    interactiveLoading.value = false
    await nextTick()
    setupObservers()
    renderPage(1)
  } catch (err) {
    console.warn('[PdfViewer] Error activando modo interactivo, volviendo al visor nativo:', err)
    interactiveLoading.value = false
    interactiveError.value = 'El servidor no permite la lectura en lienzo de este archivo.'
    // Si falla, volver de inmediato al visor nativo para que el usuario nunca se quede bloqueado
    viewerMode.value = 'native'
    emit('error', err)
  }
}

function cancelAllRenders() {
  Object.keys(renderTasks).forEach((pageNum) => {
    if (renderTasks[pageNum]) {
      try {
        renderTasks[pageNum].cancel()
      } catch {
        // Ignorar
      }
      delete renderTasks[pageNum]
    }
  })
}

async function renderPage(pageNum) {
  if (!pdfDoc || pageNum < 1 || pageNum > totalPages.value) return
  if (renderingPages.has(pageNum)) return

  const canvas = canvasRefs.value[pageNum]
  const container = pageRefs.value[pageNum]
  if (!canvas || !container) return

  renderingPages.add(pageNum)

  if (renderTasks[pageNum]) {
    try {
      renderTasks[pageNum].cancel()
    } catch {
      // Ignorar
    }
    delete renderTasks[pageNum]
  }

  try {
    const page = await pdfDoc.getPage(pageNum)
    const baseViewport = page.getViewport({ scale: 1.0 })
    pageAspectRatios.value[pageNum] = baseViewport.height / baseViewport.width

    const viewerWidth = viewerContainer.value?.clientWidth || window.innerWidth
    const horizontalPadding = window.innerWidth < 640 ? 16 : 48
    const maxAvailableWidth = Math.max(260, viewerWidth - horizontalPadding)

    const fitScale = (maxAvailableWidth / baseViewport.width) * zoomLevel.value
    const viewport = page.getViewport({ scale: fitScale })

    const pixelRatio = window.devicePixelRatio || 1
    canvas.width = Math.floor(viewport.width * pixelRatio)
    canvas.height = Math.floor(viewport.height * pixelRatio)
    canvas.style.width = `${Math.floor(viewport.width)}px`
    canvas.style.height = `${Math.floor(viewport.height)}px`

    const ctx = canvas.getContext('2d')
    ctx.save()
    if (pixelRatio !== 1) {
      ctx.scale(pixelRatio, pixelRatio)
    }

    const renderTask = page.render({
      canvasContext: ctx,
      viewport: viewport
    })
    renderTasks[pageNum] = renderTask

    await renderTask.promise
    ctx.restore()

    renderedPages.add(pageNum)
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.warn(`[PdfViewer] Error en pág ${pageNum}:`, err)
    }
  } finally {
    renderingPages.delete(pageNum)
    delete renderTasks[pageNum]
  }
}

function rerenderVisiblePages() {
  if (!pdfDoc) return
  renderedPages.forEach((pageNum) => {
    renderPage(pageNum)
  })
}

function setupObservers() {
  cleanupObservers()

  if (!viewerContainer.value || typeof IntersectionObserver === 'undefined') {
    for (let i = 1; i <= Math.min(3, totalPages.value); i++) {
      renderPage(i)
    }
    return
  }

  pageVisibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = Number(entry.target.getAttribute('data-page-num'))
          if (pageNum && pageNum !== currentPage.value) {
            currentPage.value = pageNum
          }
        }
      })
    },
    {
      root: viewerContainer.value,
      threshold: 0.5
    }
  )

  lazyRenderObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = Number(entry.target.getAttribute('data-page-num'))
          if (pageNum && !renderedPages.has(pageNum)) {
            renderPage(pageNum)
          }
        }
      })
    },
    {
      root: viewerContainer.value,
      rootMargin: '600px 0px'
    }
  )

  for (let i = 1; i <= totalPages.value; i++) {
    const el = pageRefs.value[i]
    if (el) {
      pageVisibilityObserver.observe(el)
      lazyRenderObserver.observe(el)
    }
  }

  let resizeTimeout = null
  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      rerenderVisiblePages()
    }, 150)
  })
  resizeObserver.observe(viewerContainer.value)
}

function cleanupObservers() {
  if (pageVisibilityObserver) {
    pageVisibilityObserver.disconnect()
    pageVisibilityObserver = null
  }
  if (lazyRenderObserver) {
    lazyRenderObserver.disconnect()
    lazyRenderObserver = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

function scrollToPage(pageNum) {
  if (pageNum < 1 || pageNum > totalPages.value) return
  const target = pageRefs.value[pageNum]
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    currentPage.value = pageNum
  }
}

function changeZoom(delta) {
  const newZoom = +(zoomLevel.value + delta).toFixed(1)
  if (newZoom >= 0.6 && newZoom <= 2.5) {
    zoomLevel.value = newZoom
    rerenderVisiblePages()
  }
}

function resetZoom() {
  zoomLevel.value = 1.0
  rerenderVisiblePages()
}

onMounted(() => {
  isMobileDevice.value = checkMobile()
  // Por defecto usamos el visor nativo del navegador (iframe), que es el más rápido,
  // confiable y funciona 100% sin dependencias en ordenadores y tabletas.
  viewerMode.value = 'native'
})

onBeforeUnmount(() => {
  cleanupObservers()
  cancelAllRenders()
  if (pdfDoc) {
    try {
      pdfDoc.destroy()
    } catch {
      // Ignorar
    }
    pdfDoc = null
  }
})
</script>

<template>
  <div class="relative w-full h-full flex flex-col bg-[#FAF8F5] overflow-hidden select-none">
    <!-- SUB-BARRA DE AYUDA Y MODOS (ESPECIALMENTE ÚTIL EN MÓVIL) -->
    <div
      class="px-3 sm:px-4 py-2 bg-[#F2EDE4] border-b border-[#2C3E35]/10 flex items-center justify-between text-xs text-[#2C3E35]/80 shrink-0 gap-2"
    >
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="inline-block w-2 h-2 rounded-full bg-[#4A6B5D] shrink-0"></span>
        <span class="text-[11px] sm:text-xs truncate font-medium">
          {{ viewerMode === 'native' ? 'Visor estándar del navegador' : 'Lector continuo multipágina' }}
        </span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <!-- En móviles iOS, si el iframe sólo muestra la página 1, este botón abre el lector completo nativo -->
        <a
          v-if="isMobileDevice && (downloadUrl || src)"
          :href="downloadUrl || src"
          target="_blank"
          rel="noopener noreferrer"
          class="px-2.5 py-1 rounded-lg bg-[#D9826C] text-white text-[11px] font-bold inline-flex items-center gap-1 hover:bg-[#c56e58] transition-colors cursor-pointer shadow-2xs"
          title="Abrir en pantalla completa con todas las páginas"
        >
          <ExternalLink class="w-3 h-3" />
          <span>Lector completo</span>
        </a>

        <!-- Botón para alternar a lector continuo multipágina si el usuario lo prefiere -->
        <button
          v-if="viewerMode === 'native'"
          type="button"
          @click="startInteractiveMode"
          class="px-2.5 py-1 rounded-lg bg-white border border-[#2C3E35]/15 text-[#2C3E35] text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-[#2C3E35]/5 transition-colors cursor-pointer"
          title="Activar vista continua con selector de páginas y zoom"
        >
          <BookOpen class="w-3 h-3 text-[#4A6B5D]" />
          <span class="hidden xs:inline">Vista continua</span>
        </button>

        <button
          v-else
          type="button"
          @click="viewerMode = 'native'"
          class="px-2.5 py-1 rounded-lg bg-white border border-[#2C3E35]/15 text-[#2C3E35] text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-[#2C3E35]/5 transition-colors cursor-pointer"
          title="Volver al visor estándar del navegador"
        >
          <Monitor class="w-3 h-3 text-[#4A6B5D]" />
          <span>Visor estándar</span>
        </button>
      </div>
    </div>

    <!-- 1. MODO NATIVO (IFRAME) - PREDETERMINADO: Rápido, nativo, cero errores -->
    <div v-if="viewerMode === 'native'" class="relative flex-1 w-full h-full flex flex-col">
      <iframe
        :src="src"
        class="w-full flex-1 border-0 bg-white"
        :title="title"
      ></iframe>

      <!-- Pequeño aviso flotante informativo en móviles para que sepan cómo leer todas las páginas -->
      <div
        v-if="isMobileDevice"
        class="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[92%] bg-[#24332B]/90 backdrop-blur-md text-white rounded-2xl px-3.5 py-2.5 shadow-xl border border-white/10 flex items-center justify-between gap-2"
      >
        <span class="text-[11px] leading-tight text-white/90">
          ¿Tu móvil solo muestra la pág. 1?
        </span>
        <a
          :href="downloadUrl || src"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-1 rounded-xl bg-[#D9826C] text-white text-[11px] font-bold shrink-0 inline-flex items-center gap-1 shadow-2xs"
        >
          <ExternalLink class="w-3 h-3" />
          <span>Ver todas las páginas</span>
        </a>
      </div>
    </div>

    <!-- 2. MODO INTERACTIVO (PDF.JS) - MULTIPÁGINA CONTINUO -->
    <div v-else class="relative flex-1 w-full h-full flex flex-col overflow-hidden">
      <!-- Cargando modo interactivo -->
      <div
        v-if="interactiveLoading"
        class="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3"
      >
        <div class="w-9 h-9 rounded-full border-3 border-[#4A6B5D]/20 border-t-[#D9826C] animate-spin"></div>
        <p class="text-xs font-semibold text-[#2C3E35]">Preparando páginas continuas...</p>
      </div>

      <!-- Contenedor con todas las páginas renderizadas en canvas -->
      <div
        v-else
        ref="viewerContainer"
        class="flex-1 w-full overflow-y-auto overflow-x-auto p-2 sm:p-6 space-y-4 sm:space-y-6 scroll-smooth overscroll-contain"
        style="-webkit-overflow-scrolling: touch;"
      >
        <div
          v-for="pageNum in totalPages"
          :key="pageNum"
          :ref="(el) => { if (el) pageRefs[pageNum] = el }"
          :data-page-num="pageNum"
          class="pdf-page-card relative mx-auto bg-white rounded-lg sm:rounded-xl shadow-md border border-black/5 overflow-hidden flex items-center justify-center transition-all"
          :style="{
            minHeight: `${Math.round((pageAspectRatios[pageNum] || 1.414) * 260)}px`,
            maxWidth: '100%'
          }"
        >
          <canvas
            :ref="(el) => { if (el) canvasRefs[pageNum] = el }"
            class="block max-w-full h-auto mx-auto"
          ></canvas>

          <div
            class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#2C3E35]/75 text-white text-[10px] font-semibold tracking-wider backdrop-blur-xs shadow-xs pointer-events-none"
          >
            {{ pageNum }} / {{ totalPages }}
          </div>
        </div>

        <div class="h-16 w-full"></div>
      </div>

      <!-- Barra flotante de navegación y zoom para modo interactivo -->
      <div
        v-if="!interactiveLoading && totalPages > 0"
        class="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-[#24332B]/90 backdrop-blur-md text-white rounded-full shadow-2xl border border-white/15 select-none transition-all max-w-[95%]"
      >
        <button
          type="button"
          @click="scrollToPage(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-25 transition-all cursor-pointer"
          title="Página anterior"
        >
          <ChevronLeft class="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <span class="text-[11px] sm:text-xs font-semibold px-1 min-w-[65px] text-center tracking-tight">
          {{ currentPage }} <span class="text-white/40">/</span> {{ totalPages }}
        </span>

        <button
          type="button"
          @click="scrollToPage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-25 transition-all cursor-pointer"
          title="Página siguiente"
        >
          <ChevronRight class="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <span class="w-px h-3.5 bg-white/20 mx-0.5"></span>

        <button
          type="button"
          @click="changeZoom(-0.2)"
          :disabled="zoomLevel <= 0.6"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-25 transition-all cursor-pointer"
          title="Alejar (-)"
        >
          <ZoomOut class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <span class="text-[10px] sm:text-xs font-mono text-white/70 w-8 text-center hidden xs:inline">
          {{ Math.round(zoomLevel * 100) }}%
        </span>

        <button
          type="button"
          @click="changeZoom(0.2)"
          :disabled="zoomLevel >= 2.5"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-25 transition-all cursor-pointer"
          title="Acercar (+)"
        >
          <ZoomIn class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          type="button"
          @click="resetZoom"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
          :class="zoomLevel === 1.0 ? 'text-[#D9826C]' : 'text-white/80'"
          title="Ajustar al ancho"
        >
          <Maximize class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-page-card {
  box-shadow: 0 4px 20px -2px rgba(44, 62, 53, 0.12);
}
</style>
