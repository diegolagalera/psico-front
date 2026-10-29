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
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const authStore = useAuthStore()
const mobileMenuOpen = ref(false)
const activeWeek = ref(1)
const selectedPainCard = ref(0)

// 4 Puntos de Dolor requeridos
const painPoints = [
  {
    id: 1,
    badge: 'Vacío Emocional',
    quote:
      '“Sientes un vacío en el pecho y no sabes por dónde empezar a reconstruirte.”',
    description:
      'Te despiertas con una presión constante en el estómago. Los planes que antes te ilusionaban hoy parecen grises y sientes que tu energía vital se ha quedado congelada en el pasado.',
    relief:
      'En la Semana 1 aprenderás técnicas de regulación fisiológica y contención emocional para recuperar la calma en tu cuerpo.',
    icon: Feather,
  },
  {
    id: 2,
    badge: 'Bucle Obsesivo & Redes',
    quote:
      '“Caes continuamente en el impulso de revisar sus redes o escribirle.”',
    description:
      'Mirar su última conexión, analizar cada historia o releer conversaciones antiguas te da un alivio de segundos seguido de horas de angustia y síndrome de abstinencia emocional.',
    relief:
      'Implementaremos un protocolo de Contacto Cero con dignidad y herramientas prácticas para cortar los picos de impulso.',
    icon: Flame,
  },
  {
    id: 3,
    badge: 'Pérdida de Identidad',
    quote:
      '“Has perdido tu identidad fuera de lo que eras en pareja.”',
    description:
      'Cediste tantos espacios, rutinas y decisiones por sostener la relación que hoy te miras al espejo y no reconoces quién eres cuando estás a solas contigo.',
    relief:
      'Desmontaremos la idealización del vínculo para que recuperes tu voz propia, tus deseos y tu centro personal.',
    icon: Compass,
  },
  {
    id: 4,
    badge: 'Culpa y Miedo a la Soledad',
    quote:
      '“Sientes culpa, miedo a la soledad y la sensación de que jamás volverás a conectar con nadie.”',
    description:
      'Tu mente repite el “¿y si hubiera hecho esto distinto?” mientras temes que el dolor dure para siempre o que tu capacidad de amar haya quedado rota.',
    relief:
      'Transformaremos la culpa en aprendizaje consciente y construiremos tu nuevo proyecto de vida autónomo y seguro.',
    icon: HeartHandshake,
  },
]

// Programa "Vuelve a Ti" (3 Semanas)
const programWeeks = [
  {
    week: 1,
    tag: 'Semana 1',
    title: 'Contención & Calma',
    subtitle:
      'Cortar el bucle obsesivo, gestionar los picos de ansiedad y establecer el contacto cero con dignidad.',
    duration: '7 días de estabilización emocional y neurobiológica',
    highlights: [
      'Botiquín de emergencia para los picos de abstinencia nocturna y matutina.',
      'Cómo establecer y sostener el Contacto Cero (o contacto mínimo si hay hijos/vínculos) desde el respeto propio, no desde el castigo.',
      'Desactivación del impulso de revisar redes sociales y rumiación mental.',
      'Audio-guías de regulación somática para calmar la opresión en el pecho.',
    ],
    deliverable: 'Cuaderno clínico de Contención + Protocolo Contacto Cero Digno',
  },
  {
    week: 2,
    tag: 'Semana 2',
    title: 'Procesamiento & Cierre',
    subtitle:
      'Desmontar la idealización de la relación, soltar la culpa y entender los patrones emocionales.',
    duration: '7 días de comprensión profunda y liberación cognitiva',
    highlights: [
      'Ejercicio clínico del “Inventario Realista”: bajar a tu ex pareja del pedestal sin caer en el rencor.',
      'Trabajo terapéutico con la culpa, el perdón personal y las conversaciones pendientes.',
      'Identificación de tu estilo de apego y por qué repetías dinámicas de desgaste.',
      'Ritual psicológico de cierre interno (sin depender de que la otra persona pida perdón o dé explicaciones).',
    ],
    deliverable: 'Mapa de Patrones de Apego + Guía de Cierre Emocional',
  },
  {
    week: 3,
    tag: 'Semana 3',
    title: 'Reconstrucción & Autonomía',
    subtitle:
      'Recuperar tus límites, reconstruir tu autoestima y diseñar tu nuevo proyecto de vida personal.',
    duration: '7 días de rediseño identitario y proyección vital',
    highlights: [
      'Arquitectura de límites sanos: tus nuevos no-negociables afectivos.',
      'Reconexión con tu identidad individual, pasiones postergadas y red de apoyo.',
      'Transformar el miedo a la soledad en disfrute de tu propia compañía.',
      'Diseño de tu Hoja de Ruta a 90 días: hábitos, bienestar y apertura sana al futuro.',
    ],
    deliverable: 'Plan Personalizado de Reconstrucción y Autonomía Vital',
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

async function handleContactSubmit() {
  submittingContact.value = true

  try {
    const { data } = await api.post('/contact', {
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      message: contactForm.message,
    })
    toast.success(
      data.message ||
        'Hemos recibido tu mensaje. La Carla Viladot te responderá personalmente muy pronto.',
      { title: 'Mensaje enviado correctamente', duration: 6000 }
    )
    contactForm.name = ''
    contactForm.email = ''
    contactForm.phone = ''
    contactForm.message = ''
  } catch (err) {
    toast.error(
      err.response?.data?.error ||
        'Ocurrió un inconveniente al enviar tu mensaje. Por favor, inténtalo de nuevo.',
      { title: 'No se pudo enviar el mensaje' }
    )
  } finally {
    submittingContact.value = false
  }
}

function prefillSituation(text) {
  contactForm.message = `Hola Carla, me identifico mucho con: "${text}". Me gustaría recibir información para reservar sesión.`
  const el = document.getElementById('contacto')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
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
          <div class="whitespace-nowrap">
            <span
              class="font-editorial text-2xl font-semibold tracking-tight text-[#2C3E35] block leading-none"
            >
              Vuelve a Ti
            </span>
            <span
              class="text-[10px] uppercase tracking-[0.18em] text-[#4A6B5D] font-semibold block mt-1 whitespace-nowrap"
            >
              Psicología & Duelo Afectivo
            </span>
          </div>
        </a>

        <!-- Navegación Desktop -->
        <nav class="hidden lg:flex items-center gap-5 xl:gap-8 text-sm font-medium">
          <a
            href="#puntos-dolor"
            class="whitespace-nowrap text-[#2C3E35]/80 hover:text-[#4A6B5D] transition-colors"
          >
            ¿Te identificas?
          </a>
          <a
            href="#el-programa"
            class="whitespace-nowrap text-[#2C3E35]/80 hover:text-[#4A6B5D] transition-colors"
          >
            El Programa
          </a>
          <a
            href="#sobre-mi"
            class="whitespace-nowrap text-[#2C3E35]/80 hover:text-[#4A6B5D] transition-colors"
          >
            Sobre Mí
          </a>
          <a
            href="#garantia"
            class="whitespace-nowrap text-[#2C3E35]/80 hover:text-[#4A6B5D] transition-colors"
          >
            Garantía / Enfoque
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
          href="#puntos-dolor"
          @click="mobileMenuOpen = false"
          class="block py-2 text-base font-medium text-[#2C3E35]"
        >
          ¿Te identificas?
        </a>
        <a
          href="#el-programa"
          @click="mobileMenuOpen = false"
          class="block py-2 text-base font-medium text-[#2C3E35]"
        >
          El Programa
        </a>
        <a
          href="#sobre-mi"
          @click="mobileMenuOpen = false"
          class="block py-2 text-base font-medium text-[#2C3E35]"
        >
          Sobre Mí
        </a>
        <a
          href="#garantia"
          @click="mobileMenuOpen = false"
          class="block py-2 text-base font-medium text-[#2C3E35]"
        >
          Garantía / Enfoque
        </a>
        <RouterLink
          to="/recursos"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-2 py-2 text-base font-semibold text-[#D9826C]"
        >
          <Sparkles class="w-4 h-4" />
          <span>Foro de Recursos Gratuitos</span>
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
              <span>Terapia Especializada en Rupturas y Dependencia Afectiva</span>
            </div>

            <h1
              class="font-editorial text-4xl sm:text-5xl lg:text-[56px] font-semibold text-[#2C3E35] leading-[1.12] tracking-tight"
            >
              No tienes que olvidar de golpe a quien amaste para
              <span class="italic text-[#D9826C] font-normal">volver a sentir paz</span>
              en tu propia piel.
            </h1>

            <p
              class="text-base sm:text-lg text-[#2C3E35]/80 leading-relaxed max-w-2xl"
            >
              Una ruptura amorosa no es solo el final de una pareja: es el derrumbe
              del futuro que habías imaginado. A través del programa clínico
              <strong class="text-[#2C3E35] font-semibold">“Vuelve a Ti”</strong>
              te acompaño paso a paso a apagar la ansiedad, sostener el contacto cero
              con dignidad y reconstruir tu identidad en 3 semanas.
            </p>

            <!-- Botones CTA principales -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href="#contacto"
                class="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-[#D9826C] text-white font-semibold text-base shadow-sm hover:bg-[#c56e58] transition-all"
              >
                <span>Reservar Sesión de Valoración</span>
                <ArrowRight class="w-4 h-4" />
              </a>
              <a
                href="#el-programa"
                class="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-[#2C3E35]/15 text-[#2C3E35] font-medium text-base hover:border-[#4A6B5D] transition-all"
              >
                <BookOpen class="w-4 h-4 text-[#4A6B5D]" />
                <span>Conocer el Programa de 3 Semanas</span>
              </a>
            </div>

            <!-- Tarjeta de Autoevaluación Rápida -->
            <div
              class="mt-6 p-5 rounded-2xl bg-white/90 border border-[#2C3E35]/10 shadow-sm max-w-xl"
            >
              <p class="text-xs font-semibold uppercase tracking-wider text-[#4A6B5D] mb-2">
                ¿En qué momento del duelo te encuentras hoy?
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="prefillSituation('Acabo de terminar la relación y siento mucha ansiedad')"
                  class="text-xs px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#D9826C]/15 hover:text-[#2C3E35] border border-[#2C3E35]/10 transition-colors cursor-pointer"
                >
                  💔 Ruptura reciente y shock
                </button>
                <button
                  type="button"
                  @click="prefillSituation('Me cuesta mantener el Contacto Cero y reviso sus redes')"
                  class="text-xs px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#D9826C]/15 hover:text-[#2C3E35] border border-[#2C3E35]/10 transition-colors cursor-pointer"
                >
                  📱 No logro sostener el Contacto Cero
                </button>
                <button
                  type="button"
                  @click="prefillSituation('Han pasado meses pero sigo estancada/o en la culpa y la nostalgia')"
                  class="text-xs px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#D9826C]/15 hover:text-[#2C3E35] border border-[#2C3E35]/10 transition-colors cursor-pointer"
                >
                  🕰️ Duelo estancado tras meses
                </button>
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Retrato Profesional de la Psicóloga -->
          <div class="lg:col-span-5">
            <div class="relative mx-auto max-w-md lg:max-w-none">
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
                <div class="absolute bottom-5 left-5 right-5 text-white">
                  <p class="font-editorial text-2xl font-semibold">
                    Carla Viladot
                  </p>
                  <p class="text-xs text-white/90 tracking-wide">
                    Psicóloga General Sanitaria · Col. M-34892
                  </p>
                </div>
              </div>

              <!-- Tarjeta flotante de confianza -->
              <div
                class="mt-4 sm:mt-0 sm:absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-md border border-[#2C3E35]/10 max-w-xs"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 rounded-xl bg-[#6B8E23]/15 text-[#4A6B5D] flex items-center justify-center shrink-0"
                  >
                    <ShieldCheck class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="text-xs font-bold text-[#2C3E35]">
                      +480 procesos acompañados
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
        <div class="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <span
            class="text-xs font-semibold uppercase tracking-[0.2em] text-[#4A6B5D]"
          >
            Síntomas del Duelo Amoroso
          </span>
          <h2
            class="font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#2C3E35]"
          >
            ¿Te identificas con alguno de estos momentos?
          </h2>
          <p class="text-[#2C3E35]/75 text-base sm:text-lg">
            No estás exagerando ni estás perdiendo la cabeza. Lo que sientes tiene una
            explicación psicológica y neuroquímica, y también tiene una salida clara.
          </p>
        </div>

        <!-- 4 Tarjetas Interactivas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="(item, index) in painPoints"
            :key="item.id"
            @click="selectedPainCard = index"
            class="group cursor-pointer rounded-2xl p-7 transition-all duration-200 border bg-[#FAF8F5]"
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
                    : 'bg-[#4A6B5D]/10 text-[#4A6B5D]'
                "
              >
                {{ item.badge }}
              </span>
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                :class="
                  selectedPainCard === index
                    ? 'bg-[#D9826C]/15 text-[#D9826C]'
                    : 'bg-[#4A6B5D]/10 text-[#4A6B5D]'
                "
              >
                <component :is="item.icon" class="w-5 h-5" />
              </div>
            </div>

            <h3
              class="font-editorial text-2xl sm:text-[26px] font-semibold text-[#2C3E35] leading-snug mb-3"
            >
              {{ item.quote }}
            </h3>

            <p class="text-sm text-[#2C3E35]/75 leading-relaxed mb-5">
              {{ item.description }}
            </p>

            <div
              class="p-4 rounded-xl bg-white border border-[#4A6B5D]/15 flex items-start gap-3"
            >
              <CheckCircle2 class="w-5 h-5 text-[#6B8E23] shrink-0 mt-0.5" />
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D] block">
                  Cómo lo abordamos en consulta:
                </span>
                <p class="text-xs sm:text-sm text-[#2C3E35]/85 mt-0.5">
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
        <div class="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <span
            class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#6B8E23]/15 text-[#4A6B5D] text-xs font-semibold uppercase tracking-widest"
          >
            Metodología Clínica Estructurada
          </span>
          <h2
            class="font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#2C3E35]"
          >
            Programa “Vuelve a Ti” · 3 Semanas
          </h2>
          <p class="text-[#2C3E35]/75 text-base sm:text-lg">
            Un mapa terapéutico concreto para que no te quedes atrapada/o dando vueltas
            sobre el mismo dolor sin herramientas prácticas.
          </p>
        </div>

        <!-- Selector de Semanas (Tabs Interactivos) -->
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto mb-10"
        >
          <button
            v-for="item in programWeeks"
            :key="item.week"
            type="button"
            @click="activeWeek = item.week"
            class="p-5 rounded-2xl text-left transition-all border cursor-pointer"
            :class="
              activeWeek === item.week
                ? 'bg-[#2C3E35] text-[#FAF8F5] border-[#2C3E35] shadow-md'
                : 'bg-white text-[#2C3E35] border-[#2C3E35]/10 hover:border-[#4A6B5D]'
            "
          >
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-xs font-bold uppercase tracking-widest"
                :class="
                  activeWeek === item.week ? 'text-[#D9826C]' : 'text-[#4A6B5D]'
                "
              >
                {{ item.tag }}
              </span>
              <span
                class="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
                :class="
                  activeWeek === item.week
                    ? 'bg-[#D9826C] text-white'
                    : 'bg-[#FAF8F5] text-[#2C3E35]'
                "
              >
                {{ item.week }}
              </span>
            </div>
            <p class="font-editorial text-2xl font-semibold">
              {{ item.title }}
            </p>
          </button>
        </div>

        <!-- Detalle de la Semana Activa -->
        <div
          v-for="item in programWeeks"
          :key="item.week"
          v-show="activeWeek === item.week"
          class="max-w-5xl mx-auto rounded-2xl bg-white border border-[#2C3E35]/10 shadow-sm p-8 sm:p-10 lg:p-12"
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-5 space-y-4">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9826C]/15 text-[#D9826C] text-xs font-bold uppercase tracking-wider"
              >
                {{ item.tag }} · {{ item.title }}
              </span>
              <h3
                class="font-editorial text-3xl sm:text-4xl font-semibold text-[#2C3E35] leading-tight"
              >
                {{ item.subtitle }}
              </h3>
              <div class="flex items-center gap-2 text-xs text-[#4A6B5D] font-medium pt-1">
                <Clock class="w-4 h-4" />
                <span>{{ item.duration }}</span>
              </div>

              <div
                class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 mt-4"
              >
                <p class="text-xs uppercase tracking-wider text-[#4A6B5D] font-bold">
                  Material entregable incluido:
                </p>
                <p class="text-sm font-semibold text-[#2C3E35] mt-1">
                  {{ item.deliverable }}
                </p>
              </div>
            </div>

            <div class="lg:col-span-7 space-y-4">
              <p class="text-xs font-bold uppercase tracking-wider text-[#4A6B5D]">
                Objetivos terapéuticos de esta fase:
              </p>
              <ul class="space-y-3.5">
                <li
                  v-for="(point, idx) in item.highlights"
                  :key="idx"
                  class="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/6"
                >
                  <div
                    class="w-6 h-6 rounded-full bg-[#4A6B5D] text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold"
                  >
                    {{ idx + 1 }}
                  </div>
                  <span class="text-sm sm:text-base text-[#2C3E35]/90 leading-relaxed">
                    {{ point }}
                  </span>
                </li>
              </ul>
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
              <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10">
                <Award class="w-5 h-5 text-[#D9826C] mb-1.5" />
                <p class="text-xs text-[#2C3E35]/70">Colegiada Oficial</p>
                <p class="text-sm font-bold text-[#2C3E35]">COP Madrid M-34892</p>
              </div>
              <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10">
                <Sun class="w-5 h-5 text-[#6B8E23] mb-1.5" />
                <p class="text-xs text-[#2C3E35]/70">Especialidad Clínica</p>
                <p class="text-sm font-bold text-[#2C3E35]">Apego y Duelo Afectivo</p>
              </div>
            </div>
          </div>

          <!-- Historia y Enfoque sin juicios -->
          <div class="lg:col-span-7 space-y-6">
            <span
              class="text-xs font-bold uppercase tracking-[0.2em] text-[#4A6B5D]"
            >
              Sobre Mí · Enfoque Humano y Sin Juicios
            </span>
            <h2
              class="font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#2C3E35] leading-tight"
            >
              “Sé lo difícil que es escuchar un ‘tienes que pasar página’ cuando nadie te enseña cómo hacerlo.”
            </h2>
            <p class="text-[#2C3E35]/80 leading-relaxed text-base">
              Soy <strong>Carla Viladot</strong>, Psicóloga General Sanitaria (Colegiada
              M-34892) con más de 11 años acompañando procesos de ruptura, divorcio y
              dependencia emocional.
            </p>
            <p class="text-[#2C3E35]/80 leading-relaxed text-base">
              En mi consulta jamás te juzgaré por haber recaído en escribirle ni te
              daré frases vacías de positivismo tóxico. Trabajamos desde la
              <strong>Terapia Cognitivo-Conductual integrativa y la Teoría del Apego</strong>,
              combinando calidez humana con ejercicios semanales estructurados para
              que sientas avances reales desde la primera semana.
            </p>

            <!-- Bloque Garantía / Compromiso Ético -->
            <div
              id="garantia"
              class="p-6 rounded-2xl bg-[#FAF8F5] border-l-4 border-[#4A6B5D] space-y-2"
            >
              <div class="flex items-center gap-2 text-[#4A6B5D] font-bold text-sm">
                <ShieldCheck class="w-5 h-5 text-[#6B8E23]" />
                <span>Garantía de Acompañamiento y Confidencialidad</span>
              </div>
              <p class="text-sm text-[#2C3E35]/80 leading-relaxed">
                Si tras nuestra primera sesión sientes que mi enfoque no encaja con lo
                que necesitas en este momento, te orientaré sin compromiso hacia el
                recurso terapéutico más adecuado para ti. Tu bienestar emocional está
                siempre por encima de todo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         6. FORMULARIO DE CONTACTO (/api/contact)
         ===================================================== -->
    <section id="contacto" class="py-20 lg:py-28 bg-[#FAF8F5]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          class="rounded-2xl bg-white border border-[#2C3E35]/10 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          <!-- Columna Informativa -->
          <div
            class="lg:col-span-5 bg-[#2C3E35] text-[#FAF8F5] p-8 sm:p-10 flex flex-col justify-between"
          >
            <div class="space-y-6">
              <span
                class="inline-block px-3 py-1 rounded-full bg-[#D9826C]/20 text-[#D9826C] text-xs font-semibold uppercase tracking-wider"
              >
                Primer Paso Hacia Tu Calma
              </span>
              <h2 class="font-editorial text-3xl sm:text-4xl font-semibold leading-tight">
                Cuéntame qué estás viviendo hoy
              </h2>
              <p class="text-sm text-[#FAF8F5]/80 leading-relaxed">
                Completa este formulario confidencial para reservar tu primera sesión
                o consultar disponibilidad en el programa
                <strong>“Vuelve a Ti”</strong>. Leo y respondo personalmente cada
                mensaje en menos de 24 horas laborables.
              </p>

              <div class="space-y-4 pt-4 border-t border-white/10 text-sm">
                <div class="flex items-center gap-3">
                  <Mail class="w-4 h-4 text-[#D9826C]" />
                  <span>consulta@vuelveati.com</span>
                </div>
                <div class="flex items-center gap-3">
                  <Phone class="w-4 h-4 text-[#D9826C]" />
                  <span>+34 612 48 90 15 (Sesiones Online & Madrid)</span>
                </div>
                <div class="flex items-center gap-3">
                  <ShieldCheck class="w-4 h-4 text-[#6B8E23]" />
                  <span>Datos protegidos bajo secreto profesional sanitario</span>
                </div>
              </div>
            </div>

            <div class="mt-8 pt-6 border-t border-white/10">
              <p class="text-xs text-[#FAF8F5]/70 italic">
                “El dolor de una ruptura es inevitable, pero quedarte a vivir en el
                sufrimiento es algo que podemos transformar juntos.”
              </p>
            </div>
          </div>

          <!-- Columna Formulario -->
          <div class="lg:col-span-7 p-8 sm:p-10">
            <form @submit.prevent="handleContactSubmit" class="space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-2">
                    Nombre completo *
                  </label>
                  <div class="relative">
                    <User class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5" />
                    <input
                      v-model="contactForm.name"
                      type="text"
                      required
                      placeholder="Ej. Clara Morales"
                      class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-2">
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
                <label class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-2">
                  Teléfono / WhatsApp (opcional)
                </label>
                <div class="relative">
                  <Phone class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5" />
                  <input
                    v-model="contactForm.phone"
                    type="tel"
                    placeholder="+34 600 000 000"
                    class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-2">
                  Tu situación actual / Mensaje *
                </label>
                <div class="relative">
                  <MessageSquareHeart
                    class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5"
                  />
                  <textarea
                    v-model="contactForm.message"
                    rows="4"
                    required
                    placeholder="Cuéntame brevemente cuánto tiempo llevas de ruptura y qué es lo que más te cuesta gestionar hoy..."
                    class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                :disabled="submittingContact"
                class="w-full py-4 px-6 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Send class="w-4 h-4" />
                <span>
                  {{
                    submittingContact
                      ? 'Enviando mensaje de forma segura...'
                      : 'Enviar Solicitud y Reservar Sesión'
                  }}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

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
              <li><a href="#puntos-dolor" class="hover:text-white">Puntos de Dolor</a></li>
              <li><a href="#el-programa" class="hover:text-white">Programa 3 Semanas</a></li>
              <li><a href="#sobre-mi" class="hover:text-white">Carla Viladot</a></li>
              <li><a href="#contacto" class="hover:text-white">Reservar Sesión</a></li>
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
              <li><a href="#garantia" class="hover:text-white">Aviso Legal y RGPD</a></li>
              <li><a href="#garantia" class="hover:text-white">Política de Privacidad Sanitaria</a></li>
              <li><a href="#garantia" class="hover:text-white">Política de Cookies</a></li>
            </ul>
          </div>
        </div>

        <div
          class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#FAF8F5]/60 gap-4"
        >
          <p>
            © {{ new Date().getFullYear() }} Vuelve a Ti · Carla Viladot (Col. M-34892). Todos los derechos reservados.
          </p>
          <div class="flex items-center gap-5">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" class="hover:text-white">
              Instagram
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" class="hover:text-white">
              LinkedIn
            </a>
            <a href="https://spotify.com" target="_blank" rel="noreferrer" class="hover:text-white">
              Podcast “Volver a Mí”
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
