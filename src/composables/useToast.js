import { reactive } from 'vue'

// Estado global compartido por toda la app (singleton de módulo)
const state = reactive({
  toasts: [],
})

let nextId = 1
const MAX_VISIBLE = 5

const DEFAULT_TITLES = {
  success: '¡Guardado correctamente!',
  error: 'Algo no ha ido bien',
  warning: 'Atención',
  info: 'Información',
}

const DEFAULT_DURATIONS = {
  success: 4000,
  info: 4500,
  warning: 6000,
  error: 7000,
}

/**
 * Crea un toast.
 * @param {Object} opts
 * @param {'success'|'error'|'warning'|'info'} [opts.type]
 * @param {string} [opts.title]
 * @param {string} [opts.message]
 * @param {string} [opts.detail]   Texto técnico opcional (monoespaciado)
 * @param {number} [opts.duration] ms. 0 = no se cierra solo
 */
function show(opts = {}) {
  const type = opts.type || 'info'
  const toast = {
    id: nextId++,
    type,
    title: opts.title || DEFAULT_TITLES[type],
    message: opts.message || '',
    detail: opts.detail || '',
    duration: opts.duration ?? DEFAULT_DURATIONS[type],
  }
  state.toasts.push(toast)
  if (state.toasts.length > MAX_VISIBLE) {
    state.toasts.splice(0, state.toasts.length - MAX_VISIBLE)
  }
  return toast.id
}

function dismiss(id) {
  const idx = state.toasts.findIndex((t) => t.id === id)
  if (idx !== -1) state.toasts.splice(idx, 1)
}

function clear() {
  state.toasts.splice(0, state.toasts.length)
}

// Atajos: toast.success('mensaje') o toast.success('mensaje', { title, detail })
function make(type) {
  return (message, extra = {}) => show({ ...extra, type, message })
}

export const toast = {
  show,
  dismiss,
  clear,
  success: make('success'),
  error: make('error'),
  warning: make('warning'),
  info: make('info'),
}

export function useToast() {
  return toast
}

export const toastState = state
