<script setup>
import { ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import {
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  Compass,
  Clock,
  CheckCircle2,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  User,
  MessageSquareHeart,
  Send,
  Menu,
  X,
  AlertCircle,
  BookOpen,
  Award,
  Flame,
  Feather,
  Sun,
  Calendar,
  RefreshCw,
  Bed,
  Repeat,
  ShieldHalf,
  Brain,
  Link2,
  UserCheck,
  Check,
  ClipboardList,
  Video,
  ChevronLeft,
  ChevronRight,
  Instagram,
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const authStore = useAuthStore()
const mobileMenuOpen = ref(false)
const selectedPainCard = ref(0)
const showValuationModal = ref(false)
const valuationStep = ref(1)

const struggleOptions = [
  'Rumiación constante (pensamientos en bucle sobre la relación o sobre qué hiciste mal).',
  'Estado de alerta constante, ansiedad o problemas de insomnio.',
  'Incapacidad para mantener el "contacto cero" o soltar el vínculo.',
  'Sentimiento de culpa, vergüenza o sensación de no estar avanzando.',
]

const questionnaire = reactive({
  q1_situation: '',
  q2_routine: '',
  q3_selected: [],
  q3_other_checked: false,
  q3_other_text: '',
  q4_expectations: '',
  confirm_session_checkbox: false,
  confirm_why_now: '',
})

// 4 Puntos de Dolor requeridos
const painPoints = [
  {
    id: 1,
    badge: 'Bucle mental',
    quote: 'Le das vueltas una y otra vez buscando explicaciones',
    description:
      'Tu cabeza siempre vuelve a tu ex, buscando explicaciones y preguntándote qué podrías haber hecho diferente en la relación.',
    reliefTitle: 'QUÉ VAS A NOTAR CON EL PROGRAMA: CLARIDAD MENTAL',
    relief:
      'Bajamos el volumen del bucle para que dejes de actuar desde la ansiedad y los "¿y si?". Empiezas a ver la relación desde la realidad y no desde la herida entendiendo qué te conviene de verdad.',
    icon: RefreshCw,
  },
  {
    id: 2,
    badge: 'Ansiedad y alerta',
    quote: 'Te despiertas a las 3 de la mañana con el pecho apretado',
    description:
      'Te cuesta dormir, te despiertas a las 3 de la mañana con un nudo en el pecho. Intentas centrarte en el trabajo, en el gimnasio, pero tu cabeza está en tu ex.',
    reliefTitle: 'QUÉ VAS A NOTAR CON EL PROGRAMA: VOLVER A DESCANSAR',
    relief:
      'Regulamos tu sistema nervioso para salir del estado de alerta, que puedas volver a disfrutar del día a día y conectar con el presente. Recuperas el descanso reparador.',
    icon: Bed,
  },
  {
    id: 3,
    badge: 'Culpa y repetición',
    quote: 'Te preguntas qué hay de malo en ti y por qué siempre acabas igual',
    description:
      'Sientes frustración por chocar contra los mismos patrones una y otra vez, y la culpa te hace creer que el problema eres tú o tu forma de relacionarte.',
    reliefTitle: 'QUÉ VAS A NOTAR CON EL PROGRAMA: ENTIENDES TUS PATRONES',
    relief:
      'Dejas de culparte para empezar a entenderte: por qué repites ciertas dinámicas, qué tipo de vínculos buscas. Solo entendiendo tus patrones, puedes cambiarlos.',
    icon: Repeat,
  },
  {
    id: 4,
    badge: 'Identidad y seguridad',
    quote: 'Sientes que te has perdido a ti misma y dudas de cada decisión',
    description:
      'Has cedido tantos espacios por sostener la relación que hoy te cuesta poner límites. Sientes que has perdido tu centro y tu seguridad.',
    reliefTitle: 'QUÉ VAS A NOTAR CON EL PROGRAMA: RECUPERAS TU SEGURIDAD',
    relief:
      'Vuelves a ser tu propio refugio. Aprendes a poner límites sin que te invada la culpa y recuperas esa confianza profunda para relacionarte desde la tranquilidad.',
    icon: ShieldHalf,
  },
]

// Programa "Vuelve a Ti" (3 Fases / 10 Semanas)
const programWeeks = [
  {
    week: 1,
    title: 'Regulación',
    subtitle: 'SALIR DEL MODO SUPERVIVENCIA',
    intro:
      'Apagamos la alarma de tu cerebro para frenar el exceso de cortisol y la alerta constante.',
    methodBold: 'Metodología clínica:',
    methodText:
      'herramientas con base científica diseñadas específicamente para regular tu sistema nervioso.',
    outcome:
      'Vuelves a dormir y la rumiación disminuye drásticamente. Recuperas la claridad mental y dejas de sentir que te falta el aire.',
    icon: Brain,
    headerBg: 'bg-[#FBE4DF]',
    numberColor: 'text-[#D9826C]',
    iconColor: 'text-[#D9826C]',
    footerBg: 'bg-[#D9826C]',
  },
  {
    week: 2,
    title: 'Comprensión',
    subtitle: 'IR A LA RAÍZ DEL DOLOR',
    intro:
      'Exploramos tus relaciones pasadas para encontrar ese hilo conductor: qué dinámicas se repiten y desde dónde te vinculas (sin buscar culpables).',
    methodBold: 'Apego e IFS:',
    methodText:
      'vamos a la raíz de tus bloqueos emocionales para entender y calmar lo que dispara tu ansiedad y tus patrones.',
    outcome:
      'Vas a entender de verdad por qué repites ciertos patrones. Baja tu reactividad y empezarás a poner límites sin esa culpa.',
    icon: Link2,
    headerBg: 'bg-[#F9EBDD]',
    numberColor: 'text-[#D99B52]',
    iconColor: 'text-[#D99B52]',
    footerBg: 'bg-[#D99B52]',
  },
  {
    week: 3,
    title: 'Integración',
    subtitle: 'CONSOLIDAR EL CAMBIO',
    intro:
      'Consolidamos tu autoestima para que no te vuelvas a perder en los demás.',
    methodBold: 'Brújula y Seguridad:',
    methodText:
      'trasladamos el trabajo a tu vida real, consolidando tus límites, valores y una base de seguridad interna que perdure.',
    outcome:
      'Te relacionas desde la seguridad y sabes elegir lo que te hace bien sin conformarte con menos y consolidas tus cambios a largo plazo.',
    icon: Compass,
    headerBg: 'bg-[#E6EFE9]',
    numberColor: 'text-[#4A6B5D]',
    iconColor: 'text-[#4A6B5D]',
    footerBg: 'bg-[#4A6B5D]',
  },
]

// Estado del Formulario de Contacto (/api/contact)
const contactForm = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
})
const submittingContact = ref(false)

function openValuationModal() {
  valuationStep.value = 1
  showValuationModal.value = true
}

function proceedToContactStep() {
  if (
    !questionnaire.q1_situation.trim() ||
    !questionnaire.q2_routine.trim() ||
    !questionnaire.q4_expectations.trim()
  ) {
    toast.error('Por favor responde todas las preguntas antes de continuar.')
    return
  }
  const hasStruggle =
    questionnaire.q3_selected.length > 0 ||
    (questionnaire.q3_other_checked && questionnaire.q3_other_text.trim().length > 0)
  if (!hasStruggle) {
    toast.error('Selecciona al menos una opción en la pregunta 3.')
    return
  }
  valuationStep.value = 2
}

async function handleContactSubmit() {
  if (!questionnaire.confirm_session_checkbox) {
    toast.error('Debes confirmar las condiciones de la sesión de valoración.')
    return
  }

  submittingContact.value = true

  const q3List = [...questionnaire.q3_selected]
  if (questionnaire.q3_other_checked && questionnaire.q3_other_text.trim()) {
    q3List.push(`Otra: ${questionnaire.q3_other_text.trim()}`)
  }

  const compiledMessage = [
    '=== CUESTIONARIO PREVIO DE VALORACIÓN ===',
    `1. Tiempo desde la ruptura y qué ha intentado:\n${questionnaire.q1_situation.trim()}`,
    `2. Rutina diaria y momentos más difíciles:\n${questionnaire.q2_routine.trim()}`,
    `3. Qué le cuesta más gestionar:\n- ${q3List.join('\n- ')}`,
    `4. Qué espera conseguir en las 10 semanas:\n${questionnaire.q4_expectations.trim()}`,
    `5. Confirmación (Por qué siente que necesita dar este paso ahora):\n${questionnaire.confirm_why_now.trim() || 'Confirmado con casilla obligatoria'}`,
    contactForm.message.trim()
      ? `\nMensaje adicional:\n${contactForm.message.trim()}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const { data } = await api.post('/contact', {
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      message: compiledMessage,
    })
    toast.success(
      data.message ||
        'Hemos recibido tu cuestionario y solicitud. Carla Viladot te responderá personalmente muy pronto.',
      { title: 'Solicitud enviada correctamente', duration: 6000 }
    )
    contactForm.name = ''
    contactForm.email = ''
    contactForm.phone = ''
    contactForm.message = ''
    questionnaire.q1_situation = ''
    questionnaire.q2_routine = ''
    questionnaire.q3_selected = []
    questionnaire.q3_other_checked = false
    questionnaire.q3_other_text = ''
    questionnaire.q4_expectations = ''
    questionnaire.confirm_session_checkbox = false
    questionnaire.confirm_why_now = ''
    showValuationModal.value = false
    valuationStep.value = 1
  } catch (err) {
    toast.error(
      err.response?.data?.error ||
        'Ocurrió un inconveniente al enviar tu solicitud. Por favor, inténtalo de nuevo.',
      { title: 'No se pudo enviar la solicitud' }
    )
  } finally {
    submittingContact.value = false
  }
}

const feelingsOptions = [
  { id: 'vueltas', emoji: '🧠', text: 'Le doy mil vueltas a la relación' },
  { id: 'verguenza', emoji: '😶‍🌫️', text: 'Siento vergüenza por no avanzar' },
  { id: 'incertidumbre', emoji: '🌫️', text: 'Veo mi futuro con incertidumbre' },
  { id: 'identidad', emoji: '📉', text: 'Siento que he perdido mi identidad' },
]

const selectedFeelings = ref([])

function toggleFeeling(id) {
  const index = selectedFeelings.value.indexOf(id)
  if (index > -1) {
    selectedFeelings.value.splice(index, 1)
  } else {
    selectedFeelings.value.push(id)
  }
}

function openCookieSettingsModal() {
  window.dispatchEvent(new CustomEvent('open-cookie-settings'))
}
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35]">
    <!-- =====================================================
         1. HEADER / NAVBAR
         ===================================================== -->
    <header
      class="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#2C3E35]/10"
    >
      <div
        class="w-full px-5 sm:px-8 lg:px-12 xl:px-16 h-20 flex items-center justify-between gap-4 xl:gap-8"
      >
        <!-- Logo Elegante -->
        <a href="#" class="flex items-center gap-3 group shrink-0 whitespace-nowrap">
          <div
            class="w-11 h-11 rounded-2xl bg-[#4A6B5D] text-[#FAF8F5] flex items-center justify-center shadow-sm group-hover:bg-[#2C3E35] transition-colors shrink-0"
          >
            <Feather class="w-5 h-5" />
          </div>
          <span
            class="font-editorial text-2xl font-semibold tracking-tight text-[#2C3E35] block leading-none"
          >
            Vuelve a Ti
          </span>
        </a>

        <!-- Navegación Desktop -->
        <nav class="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium">
          <a
            href="#"
            class="whitespace-nowrap text-[#2C3E35]/80 hover:text-[#4A6B5D] transition-colors"
          >
            Inicio
          </a>
          <a
            href="#el-programa"
            class="whitespace-nowrap text-[#2C3E35]/80 hover:text-[#4A6B5D] transition-colors"
          >
            Programa
          </a>
          <a
            href="#sobre-mi"
            class="whitespace-nowrap text-[#2C3E35]/80 hover:text-[#4A6B5D] transition-colors"
          >
            Sobre mí
          </a>
          <a
            href="#contacto"
            class="whitespace-nowrap text-[#2C3E35]/80 hover:text-[#4A6B5D] transition-colors"
          >
            Contacto
          </a>
          <RouterLink
            to="/recursos"
            class="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#D9826C]/12 text-[#D9826C] font-semibold hover:bg-[#D9826C]/20 transition-colors"
          >
            <Sparkles class="w-3.5 h-3.5 shrink-0" />
            <span>Recursos Gratuitos</span>
          </RouterLink>
        </nav>

        <!-- Acciones Derecha -->
        <div class="hidden lg:flex items-center gap-3 shrink-0">
          <RouterLink
            :to="
              authStore.isAuthenticated
                ? authStore.isAdmin
                  ? '/admin/courses'
                  : '/dashboard'
                : '/login'
            "
            class="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-[#4A6B5D] hover:bg-[#4A6B5D]/10 transition-colors"
          >
            <Lock class="w-4 h-4 shrink-0" />
            <span>{{
              authStore.isAuthenticated ? 'Mi Portal' : 'Acceso Alumnos'
            }}</span>
          </RouterLink>

          <a
            href="#contacto"
            class="whitespace-nowrap inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-[#D9826C] text-white shadow-sm hover:bg-[#c56e58] transition-all hover:shadow"
          >
            <Calendar class="w-4 h-4 shrink-0" />
            <span>Reservar Sesión</span>
          </a>
        </div>

        <!-- Botón Menú Móvil -->
        <button
          type="button"
          class="lg:hidden p-2.5 rounded-xl text-[#2C3E35] hover:bg-[#4A6B5D]/10"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Abrir menú"
        >
          <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </div>

      <!-- Menú Desplegable Móvil -->
      <div
        v-if="mobileMenuOpen"
        class="lg:hidden bg-[#FAF8F5] border-b border-[#2C3E35]/10 px-6 py-5 space-y-3"
      >
        <a
          href="#"
          @click="mobileMenuOpen = false"
          class="block py-2 text-base font-medium text-[#2C3E35]"
        >
          Inicio
        </a>
        <a
          href="#el-programa"
          @click="mobileMenuOpen = false"
          class="block py-2 text-base font-medium text-[#2C3E35]"
        >
          Programa
        </a>
        <a
          href="#sobre-mi"
          @click="mobileMenuOpen = false"
          class="block py-2 text-base font-medium text-[#2C3E35]"
        >
          Sobre mí
        </a>
        <a
          href="#contacto"
          @click="mobileMenuOpen = false"
          class="block py-2 text-base font-medium text-[#2C3E35]"
        >
          Contacto
        </a>
        <RouterLink
          to="/recursos"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-2 py-2 text-base font-semibold text-[#D9826C]"
        >
          <Sparkles class="w-4 h-4" />
          <span>Recursos Gratuitos</span>
        </RouterLink>
        <div class="pt-3 border-t border-[#2C3E35]/10 flex flex-col gap-2.5">
          <RouterLink
            to="/login"
            @click="mobileMenuOpen = false"
            class="w-full py-2.5 px-4 rounded-2xl border border-[#4A6B5D]/30 text-center text-sm font-semibold text-[#4A6B5D]"
          >
            Acceso Alumnos
          </RouterLink>
          <a
            href="#contacto"
            @click="mobileMenuOpen = false"
            class="w-full py-3 px-4 rounded-2xl bg-[#D9826C] text-white text-center text-sm font-semibold"
          >
            Reservar Sesión
          </a>
        </div>
      </div>
    </header>

    <!-- =====================================================
         2. HERO SECTION
         ===================================================== -->
    <section class="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28">
      <!-- Decoración suave de fondo -->
      <div
        class="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-[#D9826C]/10 blur-3xl"
      ></div>
      <div
        class="pointer-events-none absolute bottom-0 left-10 w-80 h-80 rounded-full bg-[#4A6B5D]/10 blur-3xl"
      ></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          <!-- Columna Izquierda: Copy Emocional + CTA Rápido -->
          <div class="lg:col-span-7 space-y-6">
            <div
              class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4A6B5D]/10 border border-[#4A6B5D]/20 text-[#4A6B5D] text-xs font-semibold tracking-wide uppercase"
            >
              <Sparkles class="w-3.5 h-3.5 text-[#6B8E23]" />
              <span>Acompañamiento en rupturas</span>
            </div>

            <h1
              class="font-editorial text-4xl sm:text-5xl lg:text-[56px] font-semibold text-[#2C3E35] leading-[1.12] tracking-tight"
            >
              Pocos golpes
              <span class="text-[#D9826C]">descolocan tanto la vida</span>
              como una ruptura. Casi ninguno.
            </h1>

            <p
              class="text-base sm:text-lg text-[#2C3E35]/80 leading-relaxed max-w-2xl"
            >
              Duele perder a tu pareja, pero duele todavía más perder el futuro que teníais
              imaginado, vuestro proyecto, vuestros sueños... A través del programa
              "Vuelve a Ti", te acompaño paso a paso a dejar de darle vueltas a la relación,
              calmar esa ansiedad constante, soltar la culpa y reconstruir tu identidad a lo
              largo de 10 semanas de trabajo estructurado.
            </p>

            <!-- Botones CTA principales -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href="#contacto"
                class="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-[#D9826C] text-white font-semibold text-base shadow-sm hover:bg-[#c56e58] transition-all"
              >
                <span>Reservar valoración gratuita</span>
                <ArrowRight class="w-4 h-4" />
              </a>
              <a
                href="#el-programa"
                class="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-[#2C3E35]/15 text-[#2C3E35] font-medium text-base hover:border-[#4A6B5D] transition-all"
              >
                <BookOpen class="w-4 h-4 text-[#2C3E35]" />
                <span>Conocer el programa de 10 semanas</span>
              </a>
            </div>

            <!-- Tarjeta de Autoevaluación Rápida -->
            <div
              class="mt-6 p-6 rounded-2xl bg-white/90 border border-[#2C3E35]/10 shadow-sm max-w-xl"
            >
              <p class="text-xs font-semibold uppercase tracking-wider text-[#4A6B5D] mb-3.5">
                ¿CÓMO TE SIENTES HOY?
              </p>
              <div class="flex flex-wrap gap-2.5">
                <button
                  v-for="item in feelingsOptions"
                  :key="item.id"
                  type="button"
                  @click="toggleFeeling(item.id)"
                  class="text-xs px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95"
                  :class="
                    selectedFeelings.includes(item.id)
                      ? 'bg-[#D9826C] text-white border-[#D9826C] shadow-sm font-medium'
                      : 'bg-[#FAF8F5] text-[#2C3E35] border-[#2C3E35]/10 hover:bg-[#D9826C]/10 hover:border-[#D9826C]/30'
                  "
                >
                  {{ item.emoji }} {{ item.text }}
                </button>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Retrato Profesional de la Psicóloga -->
          <div class="lg:col-span-5">
            <div class="relative mx-auto max-w-md lg:max-w-none pb-6 sm:pb-0">
              <div
                class="rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-[#E8E2D9] aspect-[4/5] relative"
              >
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=85"
                  alt="Carla Viladot - Psicóloga Especialista en Rupturas Amorosas"
                  class="w-full h-full object-cover object-top"
                />
                <div
                  class="absolute inset-0 bg-gradient-to-t from-[#2C3E35]/70 via-transparent to-transparent"
                ></div>
                <div class="hidden sm:block absolute bottom-6 right-6 text-right text-white">
                  <p class="font-editorial text-2xl font-semibold">
                    Carla Viladot
                  </p>
                  <p class="text-xs text-white/90 tracking-wide">
                    Psicóloga General Sanitaria · Col. 29332
                  </p>
                </div>
              </div>

              <!-- Tarjeta flotante de confianza -->
              <div
                class="absolute -bottom-5 left-3 right-3 sm:left-auto sm:right-auto sm:-left-6 sm:-bottom-6 bg-white/95 backdrop-blur-xs sm:bg-white rounded-2xl p-3.5 sm:p-4 shadow-xl sm:shadow-md border border-[#2C3E35]/10 sm:max-w-xs z-10"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 rounded-xl bg-[#6B8E23]/15 text-[#4A6B5D] flex items-center justify-center shrink-0 mt-0.5"
                  >
                    <ShieldCheck class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="text-xs font-bold text-[#2C3E35]">
                      Carla Viladot Psicóloga
                    </p>
                    <p class="text-xs text-[#2C3E35]/70 mt-0.5 leading-snug">
                      Espacio 100% confidencial, cálido y respaldado por evidencia clínica.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         3. SECCIÓN PUNTOS DE DOLOR ("¿Te identificas con esto?")
         ===================================================== -->
    <section
      id="puntos-dolor"
      class="py-20 bg-[#F3EFEA] border-y border-[#2C3E35]/8"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto text-center space-y-3 mb-14">
          <h2
            class="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#2C3E35] leading-[1.15] tracking-tight"
          >
            Por qué sientes que no avanzas
            <span class="text-[#D9826C]">(y cómo lo vamos a solucionar)</span>
          </h2>
          <p class="text-[#2C3E35]/75 text-base sm:text-lg">
            Todo ese caos mental, la ansiedad y la culpa tienen una base psicológica y neuroquímica. Y lo más importante: tienen una salida.
          </p>
        </div>

        <!-- 4 Tarjetas Interactivas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="(item, index) in painPoints"
            :key="item.id"
            @click="selectedPainCard = index"
            class="group cursor-pointer rounded-2xl p-7 transition-all duration-200 border bg-white"
            :class="
              selectedPainCard === index
                ? 'border-[#D9826C] shadow-md ring-1 ring-[#D9826C]/40'
                : 'border-[#2C3E35]/10 hover:border-[#4A6B5D]/40 shadow-xs'
            "
          >
            <div class="flex items-start justify-between gap-4 mb-4">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                :class="
                  selectedPainCard === index
                    ? 'bg-[#D9826C] text-white'
                    : 'bg-[#F3EFEA] text-[#2C3E35]/80'
                "
              >
                {{ item.badge }}
              </span>
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                :class="
                  selectedPainCard === index
                    ? 'bg-[#D9826C]/15 text-[#D9826C]'
                    : 'bg-[#F3EFEA] text-[#2C3E35]/70'
                "
              >
                <component :is="item.icon" class="w-4 h-4" />
              </div>
            </div>

            <h3
              class="font-editorial text-xl sm:text-2xl font-semibold text-[#2C3E35] leading-snug mb-2.5"
            >
              {{ item.quote }}
            </h3>

            <p class="text-sm text-[#2C3E35]/75 leading-relaxed mb-5">
              {{ item.description }}
            </p>

            <div
              class="p-4 rounded-xl bg-[#FAF8F5] border border-[#4A6B5D]/15 flex items-start gap-3"
            >
              <CheckCircle2 class="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5" />
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#4A6B5D] block">
                  {{ item.reliefTitle }}
                </span>
                <p class="text-xs sm:text-sm text-[#2C3E35]/85 mt-1 leading-relaxed">
                  {{ item.relief }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         4. SECCIÓN PROPUESTA DE VALOR / PROGRAMA "VUELVE A TI"
         ===================================================== -->
    <section id="el-programa" class="py-20 lg:py-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto text-center space-y-4 mb-14">
          <span
            class="block text-xs font-bold uppercase tracking-[0.2em] text-[#D9826C]"
          >
            EL PROGRAMA VUELVE A TI
          </span>
          <h2
            class="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#2C3E35] leading-[1.15] tracking-tight"
          >
            10 semanas para
            <span class="text-[#D9826C]">recuperar tu calma</span>
            y reconstruirte
          </h2>
          <div class="pt-1">
            <span
              class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#F3EFEA] text-[#2C3E35]/85 text-xs sm:text-sm font-medium"
            >
              <UserCheck class="w-4 h-4 text-[#D9826C]" />
              <span>Acompañamiento psicológico individualizado en todo el proceso</span>
            </span>
          </div>
        </div>

        <!-- 3 Tarjetas de Fases (Regulación, Comprensión, Integración) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
          <div
            v-for="item in programWeeks"
            :key="item.week"
            class="flex flex-col rounded-3xl overflow-hidden border border-[#2C3E35]/10 bg-white shadow-xs"
          >
            <!-- Cabecera pastel de la fase -->
            <div :class="[item.headerBg, 'px-7 py-8 text-center']">
              <div
                class="w-11 h-11 rounded-full bg-white shadow-xs mx-auto flex items-center justify-center font-editorial text-lg font-bold mb-4"
                :class="item.numberColor"
              >
                {{ item.week }}
              </div>
              <h3
                class="font-editorial text-2xl sm:text-[28px] font-semibold text-[#2C3E35]"
              >
                {{ item.title }}
              </h3>
              <p
                class="text-[11px] font-bold uppercase tracking-widest text-[#2C3E35]/75 mt-1.5"
              >
                {{ item.subtitle }}
              </p>
            </div>

            <!-- Cuerpo blanco -->
            <div class="p-7 flex-1 flex flex-col bg-white">
              <div class="min-h-[72px] sm:min-h-[80px] lg:min-h-[88px] flex items-center justify-center mb-6">
                <p
                  class="text-sm italic text-[#2C3E35]/75 text-center leading-relaxed"
                >
                  {{ item.intro }}
                </p>
              </div>

              <div class="flex-1 flex flex-col">
                <p
                  class="text-[11px] font-bold uppercase tracking-wider text-[#2C3E35]/45 pb-2.5 mb-4 border-b border-[#2C3E35]/10"
                >
                  CÓMO LO HACEMOS
                </p>

                <div class="flex items-start gap-3 pb-4 flex-1">
                  <component
                    :is="item.icon"
                    class="w-4 h-4 shrink-0 mt-1"
                    :class="item.iconColor"
                  />
                  <p class="text-xs sm:text-sm text-[#2C3E35]/85 leading-relaxed">
                    <strong class="font-semibold text-[#2C3E35]">{{ item.methodBold }}</strong>
                    {{ ' ' + item.methodText }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Pie sólido de color -->
            <div :class="[item.footerBg, 'p-7 text-white mt-auto']">
              <p
                class="text-[11px] font-bold uppercase tracking-wider text-white/90 mb-2"
              >
                QUÉ VAS A NOTAR
              </p>
              <p class="text-xs sm:text-sm font-medium text-white leading-relaxed">
                {{ item.outcome }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         5. SECCIÓN SOBRE MÍ (PSICÓLOGA) & GARANTÍA/ENFOQUE
         ===================================================== -->
    <section
      id="sobre-mi"
      class="py-20 bg-white border-y border-[#2C3E35]/10"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Foto y Credenciales -->
          <div class="lg:col-span-5">
            <div class="relative rounded-2xl overflow-hidden shadow-md border border-[#2C3E35]/10">
              <img
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80"
                alt="Consulta de la Carla Viladot"
                class="w-full h-[420px] object-cover"
              />
            </div>
            <div class="grid grid-cols-2 gap-4 mt-4">
              <div class="p-5 rounded-2xl bg-white border border-[#2C3E35]/10 shadow-xs">
                <Award class="w-5 h-5 text-[#D9826C] mb-2" />
                <p class="text-[11px] font-bold uppercase tracking-wider text-[#2C3E35]/50">
                  COLEGIADA OFICIAL
                </p>
                <p class="text-sm font-bold text-[#2C3E35] mt-0.5 leading-snug">
                  COP Cataluña<br />29332
                </p>
              </div>
              <div class="p-5 rounded-2xl bg-white border border-[#2C3E35]/10 shadow-xs">
                <Brain class="w-5 h-5 text-[#D9826C] mb-2" />
                <p class="text-[11px] font-bold uppercase tracking-wider text-[#2C3E35]/50">
                  ESPECIALIDAD CLÍNICA
                </p>
                <p class="text-sm font-bold text-[#2C3E35] mt-0.5 leading-snug">
                  Rupturas, apego, ansiedad y trauma (EMDR e IFS)
                </p>
              </div>
            </div>
          </div>

          <!-- Historia y Enfoque -->
          <div class="lg:col-span-7 space-y-6">
            <span
              class="block text-xs font-bold uppercase tracking-[0.2em] text-[#4A6B5D]"
            >
              SOBRE MÍ · ENFOQUE HUMANO Y CLÍNICO
            </span>
            <h2
              class="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#2C3E35] leading-[1.15] tracking-tight"
            >
              Sé lo difícil que es escuchar un "tienes que pasar página" cuando
              <span class="text-[#D9826C]">nadie te enseña cómo hacerlo</span>.
            </h2>
            <p class="text-[#2C3E35]/80 leading-relaxed text-base">
              Yo también he estado ahí y entiendo la angustia de sentir que no avanzas. Pero
              también sé, desde la experiencia clínica, que de este dolor no se sale solo con fuerza
              de voluntad. Que te digan qué hacer no basta,
              <strong class="text-[#2C3E35] font-semibold">necesitas saber cómo hacerlo</strong>.
            </p>
            <p class="text-[#2C3E35]/80 leading-relaxed text-base">
              Soy <strong class="text-[#2C3E35] font-semibold">Carla Viladot</strong>, psicóloga sanitaria, y por eso en mi programa no nos quedamos en
              la superficie: trabajamos desde el sistema nervioso, el apego y el sistema de partes,
              para entender desde dónde te vinculas y
              <strong class="text-[#2C3E35] font-semibold">poder soltar con herramientas reales</strong>.
            </p>

            <!-- Bloque Proceso Clínico -->
            <div
              id="garantia"
              class="p-6 rounded-2xl bg-[#EEF2EF] border-l-4 border-[#4A6B5D] space-y-2"
            >
              <div class="flex items-center gap-2 text-[#2C3E35] font-bold text-sm">
                <CheckCircle2 class="w-4 h-4 text-[#4A6B5D] shrink-0" />
                <span>Un proceso clínico, seguro y estructurado</span>
              </div>
              <p class="text-sm text-[#2C3E35]/80 leading-relaxed">
                He transformado mis años de práctica clínica en una hoja de ruta clara para ti. Un espacio
                seguro y guiado para que el "cómo pasar página" deje de ser una frase hecha que te
                genera culpa, y se convierta en tu realidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         5B. SECCIÓN QUÉ SÍ INCLUYE EL PROGRAMA VS QUÉ NO ES ESTO
         ===================================================== -->
    <section class="py-20 lg:py-24 bg-[#FAF8F5] border-b border-[#2C3E35]/10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto text-center mb-14">
          <h2
            class="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#2C3E35] leading-[1.15] tracking-tight"
          >
            El objetivo no es que "pases página".<br />
            Es que <span class="text-[#D9826C]">regules tu sistema nervioso</span> y cambies tus patrones.
          </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
          <!-- Card Izquierda: Qué SÍ incluye el programa -->
          <div
            class="rounded-3xl bg-white border border-[#2C3E35]/10 border-t-4 border-t-[#4A6B5D] shadow-xs p-7 sm:p-9"
          >
            <div
              class="flex items-center gap-3.5 pb-5 mb-6 border-b border-[#2C3E35]/10"
            >
              <div
                class="w-10 h-10 rounded-xl bg-[#E6EFE9] text-[#4A6B5D] flex items-center justify-center shrink-0"
              >
                <Check class="w-5 h-5" />
              </div>
              <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
                Qué SÍ incluye el programa
              </h3>
            </div>

            <ul class="space-y-4">
              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">10 semanas estructuradas</strong> guiadas y creadas por una psicóloga sanitaria.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Contenido 24/7 en vídeo</strong> para sostenerte en los momentos difíciles.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Módulos clínicos y herramientas</strong> basadas en apego, sistema nervioso e IFS.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Regulación somática</strong> para bajar la ansiedad, frenar la rumiación y descansar.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Workbooks de trabajo</strong> para identificar tus patrones y entender a tus partes.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Acompañamiento individual</strong> para no sentirte sola en los mayores bloqueos.
                </p>
              </li>
            </ul>
          </div>

          <!-- Card Derecha: Qué NO es esto -->
          <div
            class="rounded-3xl bg-white border border-[#2C3E35]/10 border-t-4 border-t-[#D9826C] shadow-xs p-7 sm:p-9"
          >
            <div
              class="flex items-center gap-3.5 pb-5 mb-6 border-b border-[#2C3E35]/10"
            >
              <div
                class="w-10 h-10 rounded-xl bg-[#FBE4DF] text-[#D9826C] flex items-center justify-center shrink-0"
              >
                <X class="w-5 h-5" />
              </div>
              <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
                Qué NO es esto
              </h3>
            </div>

            <ul class="space-y-4">
              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#D9826C] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <X class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Sesiones sin estructura</strong> donde solo vienes a desahogarte sin llevarte herramientas reales.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#D9826C] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <X class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Coaching superficial</strong> con frases vacías de "tienes que quererte más" o "el tiempo cura".
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#D9826C] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <X class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Un curso automatizado</strong> donde te sueltan la teoría y te dejan completamente sola.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#D9826C] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <X class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Una promesa mágica</strong> para "recuperar a tu ex" o dejar de sentir dolor en dos días.
                </p>
              </li>
            </ul>
          </div>
        </div>

        <!-- Barra inferior informativa -->
        <div
          class="mt-7 px-6 py-4 rounded-2xl bg-[#F3EFEA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#2C3E35]/80 font-medium"
        >
          <div class="flex items-center gap-2.5">
            <Calendar class="w-4 h-4 text-[#2C3E35]/60 shrink-0" />
            <span>Acompañamiento intensivo de 10 semanas (Acceso 6 meses).</span>
          </div>
          <div class="flex items-center gap-2.5">
            <Brain class="w-4 h-4 text-[#2C3E35]/60 shrink-0" />
            <span>Sistema de intervención integradora (neurobiología y apego).</span>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         6. SECCIÓN ¿ES "VUELVE A TI" EL PROGRAMA QUE NECESITAS?
         ===================================================== -->
    <section class="py-20 lg:py-24 bg-[#FAF8F5] border-b border-[#2C3E35]/10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto text-center mb-14">
          <span
            class="block text-xs font-bold uppercase tracking-[0.2em] text-[#D9826C] mb-3"
          >
            ANTES DE DAR EL PASO
          </span>
          <h2
            class="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#2C3E35] leading-[1.15] tracking-tight"
          >
            ¿Es "Vuelve a Ti"
            <span class="text-[#D9826C]">el programa que necesitas?</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
          <!-- Card Izquierda: SÍ es para ti si... -->
          <div
            class="rounded-3xl bg-white border border-[#2C3E35]/10 border-t-4 border-t-[#4A6B5D] shadow-xs p-7 sm:p-9"
          >
            <div class="flex items-center gap-3.5 mb-7">
              <div
                class="w-11 h-11 rounded-xl bg-[#E6EFE9] text-[#4A6B5D] flex items-center justify-center shrink-0"
              >
                <Check class="w-5 h-5" />
              </div>
              <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
                SÍ es para ti si...
              </h3>
            </div>

            <ul class="space-y-5">
              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Vives en modo supervivencia.</strong> Por fuera sigues funcionando (trabajo, rutinas...), pero por dentro vives en alerta constante, en bucle y sin descansar.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Sientes que ya lo has intentado todo.</strong> Te distraes o dejas pasar el tiempo, pero la ansiedad y el nudo en el pecho siguen ahí.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#4A6B5D] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Estás dispuesta a ir a la raíz.</strong> Quieres entender cómo te vinculas, trabajar tus partes protectoras y comprometerte con el proceso clínico.
                </p>
              </li>
            </ul>
          </div>

          <!-- Card Derecha: NO es para ti si... -->
          <div
            class="rounded-3xl bg-white border border-[#2C3E35]/10 border-t-4 border-t-[#D9826C] shadow-xs p-7 sm:p-9"
          >
            <div class="flex items-center gap-3.5 mb-7">
              <div
                class="w-11 h-11 rounded-xl bg-[#FBE4DF] text-[#D9826C] flex items-center justify-center shrink-0"
              >
                <X class="w-5 h-5" />
              </div>
              <h3 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
                NO es para ti si...
              </h3>
            </div>

            <ul class="space-y-5">
              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#D9826C] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <X class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Buscas un parche rápido.</strong> Este programa requiere compromiso real y trabajo interno (afrontar sesiones y tareas incómodas).
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#D9826C] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <X class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Solo quieres desahogarte.</strong> No te daré la razón para complacerte; vamos a analizar los patrones que repites con total honestidad.
                </p>
              </li>

              <li class="flex items-start gap-3.5">
                <div
                  class="w-5 h-5 rounded-full bg-[#D9826C] text-white flex items-center justify-center shrink-0 mt-0.5"
                >
                  <X class="w-3 h-3 stroke-[3]" />
                </div>
                <p class="text-sm text-[#2C3E35]/85 leading-relaxed">
                  <strong class="font-semibold text-[#2C3E35]">Quieres un truco para "recuperar a tu ex".</strong> Sería poco ético prometer algo así, nadie puede garantizarte que vuelva.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         7. SECCIÓN EL SIGUIENTE PASO ("Recuperar tu estabilidad")
         ===================================================== -->
    <section id="contacto" class="py-20 lg:py-28 bg-[#FAF8F5]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Cabecera centrada -->
        <div class="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span
            class="block text-xs font-bold uppercase tracking-[0.2em] text-[#4A6B5D]"
          >
            EL SIGUIENTE PASO
          </span>
          <h2
            class="font-editorial text-3xl sm:text-4xl lg:text-[44px] font-semibold text-[#2C3E35] leading-[1.15] tracking-tight"
          >
            Recuperar <span class="text-[#D9826C]">tu estabilidad</span>
          </h2>
          <p class="text-[#2C3E35]/80 text-sm sm:text-base leading-relaxed">
            El tiempo por sí solo no resuelve esto. Lo que ayuda es entender cómo funciona tu sistema nervioso y trabajarlo con una hoja de ruta clínica. Para asegurarme de que "Vuelve a Ti" es lo que necesitas,
            <strong class="font-semibold text-[#2C3E35]">el acceso requiere una sesión de valoración previa.</strong>
          </p>
        </div>

        <!-- 3 Pasos en Tarjetas -->
        <div class="relative grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 mb-12">
          <!-- Línea conectora que pasa detrás de las esferas numeradas -->
          <div
            class="hidden md:block absolute top-6 left-24 right-24 h-px bg-[#D9826C]/25 pointer-events-none z-0"
          ></div>

          <!-- Paso 1: Cuestionario previo -->
          <div
            class="relative rounded-3xl bg-white border border-[#2C3E35]/10 shadow-xs px-7 pt-10 pb-8 text-center flex flex-col items-center z-10"
          >
            <div
              class="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#FBE4DF] text-[#D9826C] font-editorial font-bold text-lg flex items-center justify-center shadow-xs border-2 border-white"
            >
              1
            </div>
            <ClipboardList class="w-6 h-6 text-[#2C3E35]/55 mb-3.5" />
            <h3 class="font-editorial text-xl sm:text-2xl font-semibold text-[#2C3E35] mb-2.5">
              Cuestionario previo
            </h3>
            <p class="text-xs sm:text-sm text-[#2C3E35]/75 leading-relaxed">
              Haz clic en el botón y responde unas breves preguntas (te llevará 2 minutos) para que pueda entender tu situación y tu momento vital.
            </p>
          </div>

          <!-- Paso 2: Agendamos la cita -->
          <div
            class="relative rounded-3xl bg-white border border-[#2C3E35]/10 shadow-xs px-7 pt-10 pb-8 text-center flex flex-col items-center z-10"
          >
            <div
              class="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#FBE4DF] text-[#D9826C] font-editorial font-bold text-lg flex items-center justify-center shadow-xs border-2 border-white"
            >
              2
            </div>
            <UserCheck class="w-6 h-6 text-[#2C3E35]/55 mb-3.5" />
            <h3 class="font-editorial text-xl sm:text-2xl font-semibold text-[#2C3E35] mb-2.5">
              Agendamos la cita
            </h3>
            <p class="text-xs sm:text-sm text-[#2C3E35]/75 leading-relaxed">
              Una vez reciba tus respuestas, me pondré en contacto contigo para acordar el día y la hora que mejor te vengan.
            </p>
          </div>

          <!-- Paso 3: Nuestra llamada -->
          <div
            class="relative rounded-3xl bg-white border border-[#2C3E35]/10 shadow-xs px-7 pt-10 pb-8 text-center flex flex-col items-center z-10"
          >
            <div
              class="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#FBE4DF] text-[#D9826C] font-editorial font-bold text-lg flex items-center justify-center shadow-xs border-2 border-white"
            >
              3
            </div>
            <Video class="w-6 h-6 text-[#2C3E35]/55 mb-3.5" />
            <h3 class="font-editorial text-xl sm:text-2xl font-semibold text-[#2C3E35] mb-2.5">
              Nuestra llamada
            </h3>
            <p class="text-xs sm:text-sm text-[#2C3E35]/75 leading-relaxed">
              Tendremos una videollamada gratuita de 30 min. por Google Meet para valorar tu caso y ver si este acompañamiento es para ti.
            </p>
          </div>
        </div>

        <!-- Botón CTA y Nota Inferior -->
        <div class="text-center space-y-4">
          <button
            type="button"
            @click="openValuationModal"
            class="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white font-semibold text-base shadow-sm transition-all cursor-pointer"
          >
            <span>Reservar Sesión de Valoración</span>
            <ArrowRight class="w-4 h-4" />
          </button>

          <p class="text-xs text-[#2C3E35]/65 max-w-xl mx-auto leading-relaxed">
            *Nota: esta llamada de 30 minutos es un espacio para evaluar tu caso y confirmar si el programa es el adecuado para ti. No es una sesión de terapia gratuita.
          </p>
        </div>
      </div>
    </section>

    <!-- =====================================================
         MODAL DE CUESTIONARIO PREVIO Y RESERVA DE VALORACIÓN
         ===================================================== -->
    <div
      v-if="showValuationModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#2C3E35]/60 backdrop-blur-xs overflow-y-auto"
      @click.self="showValuationModal = false"
    >
      <div
        class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#2C3E35]/10 shadow-2xl p-6 sm:p-9 my-8"
      >
        <!-- Botón Cerrar -->
        <button
          type="button"
          @click="showValuationModal = false"
          class="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-[#2C3E35]/10 text-[#2C3E35] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Indicador de Paso -->
        <div class="mb-6">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D9826C] mb-1.5">
            <span>Paso {{ valuationStep }} de 2</span>
            <span>·</span>
            <span>{{
              valuationStep === 1
                ? 'Preguntas antes de agendar'
                : 'Tus datos y confirmación'
            }}</span>
          </div>
          <h3 class="font-editorial text-2xl sm:text-3xl font-semibold text-[#2C3E35]">
            {{
              valuationStep === 1
                ? 'Preguntas antes de agendar'
                : 'Completa tus datos para reservar'
            }}
          </h3>
        </div>

        <!-- PASO 1: LAS 4 PREGUNTAS PREVIAS -->
        <div v-if="valuationStep === 1" class="space-y-6">
          <!-- Pregunta 1 -->
          <div>
            <label class="block text-sm font-semibold text-[#2C3E35] mb-2 leading-snug">
              1. Para entender mejor tu situación: ¿Cuánto tiempo ha pasado desde la ruptura? ¿Qué has intentado hasta ahora para gestionar mejor tu situación? *
            </label>
            <textarea
              v-model="questionnaire.q1_situation"
              rows="3"
              required
              placeholder="Escribe tu respuesta aquí..."
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            ></textarea>
          </div>

          <!-- Pregunta 2 -->
          <div>
            <label class="block text-sm font-semibold text-[#2C3E35] mb-2 leading-snug">
              2. Para conocer un poco tu día a día: ¿Cómo está estructurada tu rutina habitual (jornada laboral, rutinas...) y en qué momentos concretos sientes que te cuesta más lidiar con la ansiedad, la rumiación o el bajón? *
            </label>
            <textarea
              v-model="questionnaire.q2_routine"
              rows="3"
              required
              placeholder="Escribe tu respuesta aquí..."
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            ></textarea>
          </div>

          <!-- Pregunta 3 -->
          <div>
            <label class="block text-sm font-semibold text-[#2C3E35] mb-2.5 leading-snug">
              3. ¿Qué es lo que más te está costando gestionar en tu día a día y te hace sentir que necesitas ayuda profesional? (Puedes marcar varias) *
            </label>
            <div class="space-y-2.5">
              <label
                v-for="(option, idx) in struggleOptions"
                :key="idx"
                class="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 cursor-pointer hover:border-[#4A6B5D]/40 transition-colors"
              >
                <input
                  type="checkbox"
                  :value="option"
                  v-model="questionnaire.q3_selected"
                  class="mt-1 accent-[#D9826C] w-4 h-4 rounded shrink-0"
                />
                <span class="text-xs sm:text-sm text-[#2C3E35]/90 leading-relaxed">
                  {{ option }}
                </span>
              </label>

              <!-- Opción Otra -->
              <div
                class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2"
              >
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="questionnaire.q3_other_checked"
                    class="accent-[#D9826C] w-4 h-4 rounded shrink-0"
                  />
                  <span class="text-xs sm:text-sm text-[#2C3E35]/90 font-medium">
                    Otra:
                  </span>
                </label>
                <input
                  v-if="questionnaire.q3_other_checked"
                  v-model="questionnaire.q3_other_text"
                  type="text"
                  placeholder="Especifica qué otra cosa te está costando gestionar..."
                  class="w-full px-3.5 py-2 rounded-xl bg-white border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
                />
              </div>
            </div>
          </div>

          <!-- Pregunta 4 -->
          <div>
            <label class="block text-sm font-semibold text-[#2C3E35] mb-2 leading-snug">
              4. Si empezamos a trabajar juntas, ¿qué esperas haber conseguido o cómo te gustaría sentirte al terminar las 10 semanas del programa? *
            </label>
            <textarea
              v-model="questionnaire.q4_expectations"
              rows="3"
              required
              placeholder="Escribe tu respuesta aquí..."
              class="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            ></textarea>
          </div>

          <div class="pt-2 flex justify-end">
            <button
              type="button"
              @click="proceedToContactStep"
              class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            >
              <span>Continuar con mis datos</span>
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- PASO 2: FORMULARIO DE DATOS Y CONFIRMACIÓN OBLIGATORIA -->
        <form
          v-else
          @submit.prevent="handleContactSubmit"
          class="space-y-5"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-1.5">
                Nombre completo *
              </label>
              <div class="relative">
                <User class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5" />
                <input
                  v-model="contactForm.name"
                  type="text"
                  required
                  placeholder="Tu nombre y apellidos"
                  class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-1.5">
                Correo electrónico *
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5" />
                <input
                  v-model="contactForm.email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-1.5">
              Teléfono / WhatsApp *
            </label>
            <div class="relative">
              <Phone class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5" />
              <input
                v-model="contactForm.phone"
                type="tel"
                required
                placeholder="+34 600 000 000"
                class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-1.5">
              Mensaje (opcional)
            </label>
            <div class="relative">
              <MessageSquareHeart
                class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5"
              />
              <textarea
                v-model="contactForm.message"
                rows="2"
                placeholder="Si quieres añadir algún detalle más..."
                class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
              ></textarea>
            </div>
          </div>

          <!-- Confirmación de la sesión (Casilla obligatoria) -->
          <div class="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#D9826C]/35 space-y-3">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                v-model="questionnaire.confirm_session_checkbox"
                required
                class="mt-1 accent-[#D9826C] w-4 h-4 rounded shrink-0"
              />
              <span class="text-xs sm:text-sm text-[#2C3E35] leading-relaxed">
                <strong class="font-semibold">Confirmación de la sesión (Casilla obligatoria):</strong>
                Para cuidar tu tiempo y el mío: esta llamada de 30 minutos está reservada para valorar tu entrada al programa de 10 semanas de pago Vuelve a ti. No es una sesión suelta de terapia gratuita. Sabiendo esto y la implicación que requiere, ¿por qué sientes que dar este paso es lo que necesitas ahora mismo? *
              </span>
            </label>
            <textarea
              v-model="questionnaire.confirm_why_now"
              rows="2"
              required
              placeholder="Escribe por qué sientes que dar este paso es lo que necesitas ahora mismo..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            ></textarea>
          </div>

          <!-- Firma de Carla Viladot -->
          <div class="pt-1 text-center sm:text-left">
            <p class="text-xs sm:text-sm italic text-[#2C3E35]/80">
              Estoy aquí para acompañarte cuando estés listo/a.
            </p>
            <p class="text-xs sm:text-sm font-semibold text-[#2C3E35]">
              Carla Viladot. Psicóloga Sanitaria (Col. 29332)
            </p>
          </div>

          <!-- Botones Atrás / Enviar -->
          <div class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              @click="valuationStep = 1"
              class="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#2C3E35]/10 text-[#2C3E35] text-sm font-medium transition-colors cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" />
              <span>Volver a las preguntas</span>
            </button>

            <button
              type="submit"
              :disabled="submittingContact"
              class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Send class="w-4 h-4" />
              <span>
                {{
                  submittingContact
                    ? 'Enviando solicitud...'
                    : 'Enviar Solicitud y Reservar Sesión'
                }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- =====================================================
         7. FOOTER
         ===================================================== -->
    <footer class="bg-[#2C3E35] text-[#FAF8F5] py-14 border-t border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          <div class="md:col-span-2 space-y-3">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl bg-[#4A6B5D] text-white flex items-center justify-center"
              >
                <Feather class="w-4 h-4" />
              </div>
              <span class="font-editorial text-2xl font-semibold">Vuelve a Ti</span>
            </div>
            <p class="text-sm text-[#FAF8F5]/70 max-w-sm leading-relaxed">
              Consulta de Psicología Sanitaria especializada en reconstrucción
              personal tras rupturas amorosas, dependencia emocional y apego.
            </p>
          </div>

          <div class="space-y-2 text-sm">
            <p class="font-semibold text-[#D9826C] uppercase tracking-wider text-xs">
              Navegación
            </p>
            <ul class="space-y-2 text-[#FAF8F5]/75">
              <li><a href="#" class="hover:text-white">Inicio</a></li>
              <li><a href="#el-programa" class="hover:text-white">Programa</a></li>
              <li><a href="#sobre-mi" class="hover:text-white">Sobre mí</a></li>
              <li><a href="#contacto" class="hover:text-white">Contacto</a></li>
              <li><RouterLink to="/recursos" class="hover:text-white">Recursos Gratuitos</RouterLink></li>
            </ul>
          </div>

          <div class="space-y-2 text-sm">
            <p class="font-semibold text-[#D9826C] uppercase tracking-wider text-xs">
              Área Privada & Legal
            </p>
            <ul class="space-y-2 text-[#FAF8F5]/75">
              <li>
                <RouterLink to="/login" class="hover:text-white inline-flex items-center gap-1.5">
                  <Lock class="w-3.5 h-3.5 text-[#D9826C]" />
                  <span>Acceso Alumnos / Admin</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/aviso-legal" class="hover:text-white">Aviso Legal</RouterLink>
              </li>
              <li>
                <RouterLink to="/privacidad" class="hover:text-white">Política de Privacidad</RouterLink>
              </li>
              <li>
                <RouterLink to="/cookies" class="hover:text-white">Política de Cookies</RouterLink>
              </li>
              <li>
                <button
                  type="button"
                  @click="openCookieSettingsModal"
                  class="text-xs text-[#FAF8F5]/60 hover:text-white underline cursor-pointer text-left"
                >
                  Configuración de Cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div
          class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#FAF8F5]/60 gap-4"
        >
          <p>
            © {{ new Date().getFullYear() }} Vuelve a Ti · Carla Viladot Fonseca (NIF 49255948E · Col. 29332). Todos los derechos reservados.
          </p>
          <div class="flex items-center gap-5">
            <a
              href="https://www.instagram.com/carlaviladot.psicologa/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Instagram class="w-4 h-4 text-[#D9826C]" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
