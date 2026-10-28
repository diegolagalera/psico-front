<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-vue-next'

const props = defineProps({
  toast: { type: Object, required: true },
})
const emit = defineEmits(['dismiss'])

const STYLES = {
  success: {
    icon: CheckCircle2,
    iconWrap: 'bg-[#6B8E23]/15 text-[#4A6B5D]',
    bar: 'bg-[#4A6B5D]',
    accent: 'before:bg-[#4A6B5D]',
  },
  error: {
    icon: AlertCircle,
    iconWrap: 'bg-[#D9826C]/15 text-[#C46D57]',
    bar: 'bg-[#D9826C]',
    accent: 'before:bg-[#D9826C]',
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: 'bg-amber-500/15 text-amber-600',
    bar: 'bg-amber-500',
    accent: 'before:bg-amber-500',
  },
  info: {
    icon: Info,
    iconWrap: 'bg-[#2C3E35]/10 text-[#2C3E35]',
    bar: 'bg-[#2C3E35]',
    accent: 'before:bg-[#2C3E35]',
  },
}

const style = computed(() => STYLES[props.toast.type] || STYLES.info)

// Temporizador con pausa al pasar el ratón
const remaining = ref(props.toast.duration)
const progress = ref(100)
const paused = ref(false)
let startedAt = 0
let timeoutId = null
let rafId = null

function tick() {
  if (paused.value || !props.toast.duration) return
  const elapsed = Date.now() - startedAt
  const left = Math.max(remaining.value - elapsed, 0)
  progress.value = (left / props.toast.duration) * 100
  rafId = requestAnimationFrame(tick)
}

function start() {
  if (!props.toast.duration) return
  startedAt = Date.now()
  timeoutId = setTimeout(() => emit('dismiss'), remaining.value)
  rafId = requestAnimationFrame(tick)
}

function pause() {
  if (!props.toast.duration) return
  paused.value = true
  clearTimeout(timeoutId)
  cancelAnimationFrame(rafId)
  remaining.value -= Date.now() - startedAt
}

function resume() {
  if (!props.toast.duration) return
  paused.value = false
  start()
}

onMounted(start)
onBeforeUnmount(() => {
  clearTimeout(timeoutId)
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <div
    :role="toast.type === 'error' ? 'alert' : 'status'"
    :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
    class="pointer-events-auto relative w-full overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-[#2C3E35]/10 shadow-[0_12px_40px_-12px_rgba(44,62,53,0.35)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1"
    :class="style.accent"
    @mouseenter="pause"
    @mouseleave="resume"
  >
    <div class="flex items-start gap-3 p-4 pl-5">
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        :class="style.iconWrap"
      >
        <component :is="style.icon" class="w-5 h-5" />
      </div>

      <div class="flex-1 min-w-0 pt-0.5">
        <p class="text-sm font-bold text-[#2C3E35] leading-snug">
          {{ toast.title }}
        </p>
        <p
          v-if="toast.message"
          class="text-xs text-[#2C3E35]/75 mt-0.5 leading-relaxed break-words"
        >
          {{ toast.message }}
        </p>
        <p
          v-if="toast.detail"
          class="mt-2 text-[11px] font-mono text-[#2C3E35]/70 bg-[#FAF8F5] border border-[#2C3E35]/10 rounded-lg px-2.5 py-1.5 max-h-24 overflow-y-auto whitespace-pre-wrap break-words"
        >
          {{ toast.detail }}
        </p>
      </div>

      <button
        type="button"
        aria-label="Cerrar notificación"
        class="p-1 -m-1 rounded-lg text-[#2C3E35]/40 hover:text-[#2C3E35] hover:bg-[#2C3E35]/5 transition-colors cursor-pointer shrink-0"
        @click="emit('dismiss')"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Barra de progreso del autocierre -->
    <div v-if="toast.duration" class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C3E35]/5">
      <div
        class="h-full"
        :class="style.bar"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </div>
</template>
