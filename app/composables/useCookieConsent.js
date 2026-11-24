import { ref, computed } from 'vue'

const STORAGE_KEY = 'vuelveati_cookie_consent'

// Estado del consentimiento: null (sin decidir), o { necessary: true, analytics: bool, marketing: bool, timestamp: string }
const consent = ref(loadConsent())
const isSettingsOpen = ref(false)

function loadConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveConsent(payload) {
  const data = {
    necessary: true,
    analytics: Boolean(payload.analytics),
    marketing: Boolean(payload.marketing),
    timestamp: new Date().toISOString(),
    version: '1.0',
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('No se pudo guardar el consentimiento:', err)
  }
  consent.value = data
  isSettingsOpen.value = false
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: data }))
}

export function useCookieConsent() {
  const hasDecided = computed(() => consent.value !== null)
  const isAllowed = (category) => {
    if (category === 'necessary') return true
    if (!consent.value) return false
    return Boolean(consent.value[category])
  }

  const acceptAll = () => {
    saveConsent({ analytics: true, marketing: true })
  }

  const rejectAll = () => {
    saveConsent({ analytics: false, marketing: false })
  }

  const saveCustom = (custom) => {
    saveConsent(custom)
  }

  const openSettings = () => {
    isSettingsOpen.value = true
  }

  const closeSettings = () => {
    isSettingsOpen.value = false
  }

  return {
    consent,
    hasDecided,
    isSettingsOpen,
    isAllowed,
    acceptAll,
    rejectAll,
    saveCustom,
    openSettings,
    closeSettings,
  }
}
