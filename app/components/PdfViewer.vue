<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
import api from '@/services/api'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  ExternalLink,
  Download,
  AlertCircle,
  RotateCcw
} from 'lucide-vue-next'

// Configurar worker empaquetado localmente por Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

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

// Estado reactivo
const loading = ref(true)
const errorMessage = ref('')
const totalPages = ref(0)
const currentPage = ref(1)
const zoomLevel = ref(1.0)
const renderingPages = ref({})
const renderedPages = new Set()

// Referencias del DOM
const scrollContainer = ref(null)
const pageContainers = ref({})
const canvasRefs = ref({})

let pdfDoc = null
let renderTasks = {}
let visibilityObserver = null
let lazyObserver = null
let resizeObserver = null
const pageAspectRatios = ref({})
const pageLinks = ref({})

async function extractPageLinks(page, viewport) {
  const links = []
  try {
    const annotations = await page.getAnnotations({ intent: 'display' })
    for (const annot of annotations) {
      if (annot.subtype !== 'Link' || !Array.isArray(annot.rect) || annot.rect.length < 4) {
        continue
      }

      const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(annot.rect)
      const left = Math.min(x1, x2)
      const top = Math.min(y1, y2)
      const width = Math.abs(x2 - x1)
      const height = Math.abs(y2 - y1)

      if (width < 2 || height < 2 || !viewport.width || !viewport.height) {
        continue
      }

      let href = (annot.url || annot.unsafeUrl || '').trim()
      if (href && /^www\./i.test(href)) {
        href = `https://${href}`
      }

      let targetPage = null
      if (!href && annot.dest && pdfDoc) {
        try {
          let destArray = annot.dest
          if (typeof destArray === 'string') {
            destArray = await pdfDoc.getDestination(destArray)
          }
          if (Array.isArray(destArray) && destArray[0]) {
            const idx = await pdfDoc.getPageIndex(destArray[0])
            if (typeof idx === 'number' && idx >= 0) {
              targetPage = idx + 1
            }
          }
        } catch {
          // Ignorar destinos internos no resolubles
        }
      }

      if (!href && !targetPage) continue

      links.push({
        id: annot.id || `${left}-${top}-${width}-${height}`,
        href,
        targetPage,
        title: annot.title || href || (targetPage ? `Ir a página ${targetPage}` : ''),
        style: {
          left: `${(left / viewport.width) * 100}%`,
          top: `${(top / viewport.height) * 100}%`,
          width: `${(width / viewport.width) * 100}%`,
          height: `${(height / viewport.height) * 100}%`,
        }
      })
    }
  } catch (err) {
    console.warn('[PdfViewer] No se pudieron extraer enlaces de la página:', err)
  }
  return links
}

// Cargar el documento PDF a través del proxy del backend (0 problemas de CORS)
async function loadDocument() {
  if (!props.src) return

  loading.value = true
  errorMessage.value = ''
  totalPages.value = 0
  currentPage.value = 1
  renderedPages.clear()
  renderingPages.value = {}
  pageLinks.value = {}
  cancelPendingRenders()

  try {
    let arrayBuffer = null

    // 1. Intentar descargar a través del proxy seguro del backend
    try {
      const response = await api.get('/media/pdf-proxy', {
        params: { src: props.src },
        responseType: 'arraybuffer',
        timeout: 35000
      })
      arrayBuffer = response.data
    } catch (proxyErr) {
      console.warn('[PdfViewer] Proxy del backend falló, probando descarga directa:', proxyErr)
      // 2. Si falla el proxy, intentar fetch directo
      const directResp = await fetch(props.src, { mode: 'cors' })
      if (!directResp.ok) throw new Error(`HTTP ${directResp.status}`)
      arrayBuffer = await directResp.arrayBuffer()
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('El archivo PDF está vacío o no se pudo descargar.')
    }

    // 3. Inicializar PDF.js con los bytes en memoria (sin Range requests externos)
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapPacked: true
    })

    pdfDoc = await loadingTask.promise
    totalPages.value = pdfDoc.numPages
    emit('loaded', { totalPages: totalPages.value })

    // Obtener proporción de la primera página para calcular placeholders
    try {
      const firstPage = await pdfDoc.getPage(1)
      const vp = firstPage.getViewport({ scale: 1.0 })
      pageAspectRatios.value[1] = vp.height / vp.width
    } catch {
      pageAspectRatios.value[1] = 1.414 // A4 estándar
    }

    loading.value = false
    await nextTick()

    // Configurar observadores de visibilidad e intersección
    setupObservers()

    // Renderizar página 1 de inmediato
    renderPage(1)
  } catch (err) {
    console.error('[PdfViewer] Error cargando PDF:', err)
    loading.value = false
    errorMessage.value = err?.response?.data?.error || err?.message || 'No se pudo cargar el documento PDF.'
    emit('error', err)
  }
}

function cancelPendingRenders() {
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

// Renderizado individual de página en Canvas de alta resolución
async function renderPage(pageNum) {
  if (!pdfDoc || pageNum < 1 || pageNum > totalPages.value) return
  if (renderingPages.value[pageNum]) return

  const canvas = canvasRefs.value[pageNum]
  const container = pageContainers.value[pageNum]
  if (!canvas || !container) return

  renderingPages.value = { ...renderingPages.value, [pageNum]: true }

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
    const baseVp = page.getViewport({ scale: 1.0 })
    pageAspectRatios.value[pageNum] = baseVp.height / baseVp.width

    // Calcular escala óptima: ancho del visor menos márgenes (móvil: 16px, desktop: 40px)
    const viewerWidth = scrollContainer.value?.clientWidth || window.innerWidth
    const horizontalPadding = window.innerWidth < 640 ? 16 : 40
    const maxAvailableWidth = Math.max(260, viewerWidth - horizontalPadding)

    // Escala base ajustada al 100% del ancho multiplicado por zoomLevel
    const fitScale = (maxAvailableWidth / baseVp.width) * zoomLevel.value
    const viewport = page.getViewport({ scale: fitScale })

    // Soporte para pantallas Retina (iPhone / Android HiDPI)
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5)
    canvas.width = Math.floor(viewport.width * pixelRatio)
    canvas.height = Math.floor(viewport.height * pixelRatio)
    canvas.style.width = `${Math.floor(viewport.width)}px`
    canvas.style.height = `${Math.floor(viewport.height)}px`

    const ctx = canvas.getContext('2d', { alpha: false })
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

    // Extraer enlaces interactivos (anotaciones Link del PDF) para esta página
    const links = await extractPageLinks(page, viewport)
    pageLinks.value = { ...pageLinks.value, [pageNum]: links }

    renderedPages.add(pageNum)
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.warn(`[PdfViewer] Error renderizando página ${pageNum}:`, err)
    }
  } finally {
    delete renderTasks[pageNum]
    renderingPages.value = { ...renderingPages.value, [pageNum]: false }
  }
}

function rerenderRenderedPages() {
  if (!pdfDoc) return
  renderedPages.forEach((pageNum) => {
    renderPage(pageNum)
  })
}

function setupObservers() {
  cleanupObservers()

  if (!scrollContainer.value || typeof IntersectionObserver === 'undefined') {
    // Si no hay soporte para IntersectionObserver, renderizar las 3 primeras
    for (let i = 1; i <= Math.min(3, totalPages.value); i++) {
      renderPage(i)
    }
    return
  }

  // 1. Detección de página visible actualmente (para el contador flotante)
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const num = Number(entry.target.getAttribute('data-page-num'))
          if (num && num !== currentPage.value) {
            currentPage.value = num
          }
        }
      })
    },
    {
      root: scrollContainer.value,
      threshold: 0.4
    }
  )

  // 2. Renderizado bajo demanda al aproximarse al scroll (lazy loading)
  lazyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const num = Number(entry.target.getAttribute('data-page-num'))
          if (num && !renderedPages.has(num)) {
            renderPage(num)
          }
        }
      })
    },
    {
      root: scrollContainer.value,
      rootMargin: '600px 0px' // Precarga con 600px de margen
    }
  )

  for (let i = 1; i <= totalPages.value; i++) {
    const el = pageContainers.value[i]
    if (el) {
      visibilityObserver.observe(el)
      lazyObserver.observe(el)
    }
  }

  // Observar cambios de tamaño (orientación móvil horizontal/vertical)
  let resizeTimer = null
  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      rerenderRenderedPages()
    }, 150)
  })
  resizeObserver.observe(scrollContainer.value)
}

function cleanupObservers() {
  if (visibilityObserver) {
    visibilityObserver.disconnect()
    visibilityObserver = null
  }
  if (lazyObserver) {
    lazyObserver.disconnect()
    lazyObserver = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

// Navegación
function scrollToPage(pageNum) {
  if (pageNum < 1 || pageNum > totalPages.value) return
  const target = pageContainers.value[pageNum]
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    currentPage.value = pageNum
  }
}

function changeZoom(delta) {
  const newZoom = +(zoomLevel.value + delta).toFixed(1)
  if (newZoom >= 0.6 && newZoom <= 2.5) {
    zoomLevel.value = newZoom
    rerenderRenderedPages()
  }
}

function resetZoom() {
  zoomLevel.value = 1.0
  rerenderRenderedPages()
}

onMounted(() => {
  loadDocument()
})

watch(
  () => props.src,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      loadDocument()
    }
  }
)

onBeforeUnmount(() => {
  cleanupObservers()
  cancelPendingRenders()
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
    <!-- 1. ESTADO DE CARGA ELEGANTE -->
    <div
      v-if="loading"
      class="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4"
    >
      <div class="w-12 h-12 rounded-full border-3 border-[#4A6B5D]/20 border-t-[#D9826C] animate-spin"></div>
      <div class="space-y-1">
        <p class="font-editorial text-lg font-semibold text-[#2C3E35]">
          Abriendo cuaderno de ejercicios...
        </p>
        <p class="text-xs text-[#2C3E35]/65 max-w-xs">
          Cargando todas las páginas para lectura continua en tu dispositivo.
        </p>
      </div>
    </div>

    <!-- 2. ESTADO DE ERROR CON BOTONES DIRECTOS (NUNCA DEJA BLOQUEADO) -->
    <div
      v-else-if="errorMessage"
      class="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center max-w-md mx-auto space-y-5"
    >
      <div class="w-14 h-14 rounded-2xl bg-[#D9826C]/15 text-[#D9826C] flex items-center justify-center">
        <AlertCircle class="w-7 h-7" />
      </div>
      <div class="space-y-2">
        <h4 class="font-editorial text-xl font-bold text-[#2C3E35]">
          No se pudo procesar la vista interactiva
        </h4>
        <p class="text-xs text-[#2C3E35]/70 leading-relaxed">
          {{ errorMessage }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-2.5 w-full">
        <a
          v-if="downloadUrl || src"
          :href="downloadUrl || src"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#2C3E35] hover:bg-[#4A6B5D] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <ExternalLink class="w-4 h-4 text-[#D9826C]" />
          <span>Abrir visor completo</span>
        </a>

        <a
          v-if="downloadUrl || src"
          :href="downloadUrl || src"
          download
          class="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#D9826C] hover:bg-[#c56e58] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <Download class="w-4 h-4" />
          <span>Descargar PDF</span>
        </a>
      </div>

      <button
        type="button"
        @click="loadDocument"
        class="text-xs text-[#4A6B5D] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer pt-2"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Reintentar carga</span>
      </button>
    </div>

    <!-- 3. VISOR MULTIPÁGINA CONTINUO (CANVAS EN CASCADA) -->
    <div
      v-else
      ref="scrollContainer"
      class="flex-1 w-full overflow-y-auto overflow-x-auto p-2 sm:p-6 space-y-4 sm:space-y-6 scroll-smooth overscroll-contain"
      style="-webkit-overflow-scrolling: touch;"
    >
      <div
        v-for="pageNum in totalPages"
        :key="pageNum"
        :ref="(el) => { if (el) pageContainers[pageNum] = el }"
        :data-page-num="pageNum"
        class="pdf-page-card relative mx-auto bg-white rounded-lg sm:rounded-xl shadow-md border border-black/5 overflow-hidden flex items-center justify-center transition-all"
        :style="{
          minHeight: `${Math.round((pageAspectRatios[pageNum] || 1.414) * 280)}px`,
          maxWidth: '100%'
        }"
      >
        <!-- Contenedor relativo ajustado exactamente al tamaño del canvas para alinear enlaces interactivos -->
        <div class="relative inline-block mx-auto max-w-full">
          <canvas
            :ref="(el) => { if (el) canvasRefs[pageNum] = el }"
            class="block max-w-full h-auto mx-auto"
          ></canvas>

          <!-- Capa de enlaces interactivos del PDF -->
          <div
            v-if="pageLinks[pageNum] && pageLinks[pageNum].length"
            class="absolute inset-0 pointer-events-none z-10"
          >
            <template v-for="link in pageLinks[pageNum]" :key="link.id">
              <a
                v-if="link.href"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                :title="link.title"
                :style="link.style"
                class="absolute pointer-events-auto cursor-pointer rounded-xs hover:bg-[#D9826C]/15 active:bg-[#D9826C]/25 transition-colors"
              ></a>
              <button
                v-else-if="link.targetPage"
                type="button"
                :title="link.title"
                :style="link.style"
                @click="scrollToPage(link.targetPage)"
                class="absolute pointer-events-auto cursor-pointer rounded-xs hover:bg-[#D9826C]/15 active:bg-[#D9826C]/25 transition-colors"
              ></button>
            </template>
          </div>
        </div>

        <!-- Spinner suave mientras se renderiza esta página específica -->
        <div
          v-if="renderingPages[pageNum]"
          class="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs transition-opacity"
        >
          <div class="w-7 h-7 rounded-full border-2 border-[#4A6B5D]/20 border-t-[#D9826C] animate-spin"></div>
        </div>

        <!-- Indicador flotante en la esquina inferior de cada página -->
        <div
          class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#2C3E35]/75 text-white text-[10px] font-semibold tracking-wider backdrop-blur-xs shadow-xs pointer-events-none"
        >
          {{ pageNum }} / {{ totalPages }}
        </div>
      </div>

      <!-- Espacio final para que la barra flotante no tape texto -->
      <div class="h-20 w-full"></div>
    </div>

    <!-- 4. BARRA FLOTANTE INFERIOR: NAVEGACIÓN Y ZOOM (CÓMODA PARA EL PULGAR EN MÓVIL) -->
    <div
      v-if="!loading && !errorMessage && totalPages > 0"
      class="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#24332B]/95 backdrop-blur-md text-white rounded-full shadow-2xl border border-white/15 select-none transition-all max-w-[95%]"
    >
      <!-- Página Anterior -->
      <button
        type="button"
        @click="scrollToPage(currentPage - 1)"
        :disabled="currentPage <= 1"
        class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-25 transition-all cursor-pointer"
        aria-label="Página anterior"
        title="Página anterior"
      >
        <ChevronLeft class="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <!-- Contador de página actual interactivo -->
      <span class="text-[11px] sm:text-xs font-semibold px-1 min-w-[65px] text-center tracking-tight">
        {{ currentPage }} <span class="text-white/40">/</span> {{ totalPages }}
      </span>

      <!-- Página Siguiente -->
      <button
        type="button"
        @click="scrollToPage(currentPage + 1)"
        :disabled="currentPage >= totalPages"
        class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-25 transition-all cursor-pointer"
        aria-label="Página siguiente"
        title="Página siguiente"
      >
        <ChevronRight class="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <!-- Divisor -->
      <span class="w-px h-3.5 bg-white/20 mx-0.5"></span>

      <!-- Alejar Zoom (-) -->
      <button
        type="button"
        @click="changeZoom(-0.2)"
        :disabled="zoomLevel <= 0.6"
        class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-25 transition-all cursor-pointer"
        aria-label="Alejar"
        title="Alejar (-)"
      >
        <ZoomOut class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>

      <!-- Indicador Porcentaje (oculto en móviles muy estrechos) -->
      <span class="text-[10px] sm:text-xs font-mono text-white/70 w-8 text-center hidden xs:inline">
        {{ Math.round(zoomLevel * 100) }}%
      </span>

      <!-- Acercar Zoom (+) -->
      <button
        type="button"
        @click="changeZoom(0.2)"
        :disabled="zoomLevel >= 2.5"
        class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-25 transition-all cursor-pointer"
        aria-label="Acercar"
        title="Acercar (+)"
      >
        <ZoomIn class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>

      <!-- Ajustar al 100% de Ancho -->
      <button
        type="button"
        @click="resetZoom"
        class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
        :class="zoomLevel === 1.0 ? 'text-[#D9826C]' : 'text-white/80'"
        aria-label="Ajustar al ancho de pantalla"
        title="Ajustar al ancho"
      >
        <Maximize class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pdf-page-card {
  box-shadow: 0 4px 20px -2px rgba(44, 62, 53, 0.12);
}
</style>
