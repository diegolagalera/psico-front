<script setup>
import { ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Check,
  X,
  Loader2,
  Plus,
  ArrowRight,
  RefreshCw,
  Bed,
  Repeat,
  ShieldHalf,
  CircleCheck,
  CircleX,
  CalendarDays,
  Brain,
} from 'lucide-vue-next'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import MotionWave from '@/components/motion/MotionWave.vue'
import MotionCircles from '@/components/motion/MotionCircles.vue'
import MotionLayers from '@/components/motion/MotionLayers.vue'
import api from '@/services/api'
import { toast } from '@/composables/useToast'

const painPoints = [
  {
    badge: 'Bucle mental',
    icon: RefreshCw,
    title: 'Le das vueltas una y otra vez buscando explicaciones',
    text: 'Tu cabeza siempre vuelve a tu ex, buscando explicaciones y preguntándote qué podrías haber hecho diferente en la relación.',
    reliefTitle: 'Claridad mental',
    relief:
      'Trabajamos para bajar el volumen del bucle y que dejes de actuar desde la ansiedad y los «¿y si?». Poco a poco, puedes empezar a ver la relación desde la realidad y no desde la herida.',
  },
  {
    badge: 'Ansiedad y alerta',
    icon: Bed,
    title: 'Te despiertas a las 3 de la mañana con el pecho apretado',
    text: 'Te cuesta dormir, te despiertas a las 3 de la mañana con un nudo en el pecho. Intentas centrarte en el trabajo, en el gimnasio, pero tu cabeza está en tu ex.',
    reliefTitle: 'Volver a descansar',
    relief:
      'Trabajamos la regulación de tu sistema nervioso para ayudarte a salir del estado de alerta, descansar mejor y volver a conectar con tu día a día.',
  },
  {
    badge: 'Culpa y repetición',
    icon: Repeat,
    title: 'Te preguntas qué hay de malo en ti y por qué siempre acabas igual',
    text: 'Sientes frustración por chocar contra los mismos patrones una y otra vez, y la culpa te hace creer que el problema eres tú o tu forma de relacionarte.',
    reliefTitle: 'Entender tus patrones',
    relief:
      'Pasamos de la culpa a la comprensión: por qué repites ciertas dinámicas y qué tipo de vínculos buscas. Entender tus patrones es el primer paso para cambiarlos.',
  },
  {
    badge: 'Identidad y seguridad',
    icon: ShieldHalf,
    title: 'Sientes que te has perdido por el camino y dudas de cada decisión',
    text: 'Has cedido tantos espacios por sostener la relación que hoy te cuesta poner límites. Sientes que has perdido tu centro y tu seguridad.',
    reliefTitle: 'Reconstruir tu seguridad',
    relief:
      'Trabajamos para que puedas ser tu propio refugio: poner límites con menos culpa y relacionarte desde un lugar más tranquilo y seguro.',
  },
]

// [frase en negrita, resto]
const includes = [
  ['10 semanas estructuradas', 'guiadas y creadas por una psicóloga sanitaria.'],
  ['Contenido 24/7 en vídeo', 'para sostenerte en los momentos difíciles.'],
  ['Vídeos y ejercicios guiados', 'para entender tu forma de vincularte y calmar tu sistema nervioso.'],
  ['Ejercicios de regulación con el cuerpo', 'para bajar la ansiedad, frenar la rumiación y descansar.'],
  ['Cuadernos de trabajo', 'para identificar tus patrones y entender a tus partes.'],
  ['Acompañamiento individual', 'para que no atravieses en soledad los mayores bloqueos.'],
]
const notIncludes = [
  ['Sesiones sin estructura', 'donde solo vienes a desahogarte sin llevarte herramientas reales.'],
  ['Coaching superficial', 'con frases vacías como «tienes que quererte más» o «el tiempo lo cura».'],
  ['Un curso automatizado', 'donde te sueltan la teoría y te dejan sin ningún acompañamiento.'],
  ['Una promesa mágica', 'para «recuperar a tu ex» o dejar de sentir dolor en dos días.'],
]

const faqs = [
  {
    q: '¿Cómo funciona el programa?',
    a: 'Son 10 semanas en 3 fases (regulación, comprensión e integración) que combinan sesiones individuales conmigo, contenido en vídeo disponible 24/7 y cuadernos de trabajo prácticos.',
  },
  {
    q: '¿Por qué no consigo mantener el contacto cero ni dejar de pensar en mi ex?',
    a: 'Tras una ruptura, el cerebro vive algo parecido a una abstinencia que activa la alerta y la rumiación. Por eso trabajamos la regulación del sistema nervioso y las heridas de apego, sin depender solo de la fuerza de voluntad.',
  },
  {
    q: '¿Cómo puedo acceder al programa?',
    a: 'Rellenas el cuestionario previo y tenemos una valoración gratuita de 30 minutos por videollamada para ver si el programa encaja con tu caso y tu momento.',
  },
  {
    q: '¿Cuánto cuesta el programa?',
    a: 'El precio se concreta en la valoración gratuita, una vez que hemos visto tu caso y qué acompañamiento necesitas. Esa primera llamada no tiene ningún compromiso.',
  },
]

// ---------------- Formulario de valoración (2 pasos) ----------------
const struggleOptions = [
  'Rumiación constante (pensamientos en bucle sobre la relación o sobre qué hiciste mal).',
  'Estado de alerta constante, ansiedad o problemas de insomnio.',
  'Incapacidad para mantener el "contacto cero" o soltar el vínculo.',
  'Sentimiento de culpa, vergüenza o sensación de no estar avanzando.',
]

const emptyQuestionnaire = () => ({
  q1_situation: '',
  q2_routine: '',
  q3_selected: [],
  q3_other_checked: false,
  q3_other_text: '',
  q4_expectations: '',
})
const emptyContact = () => ({
  name: '',
  email: '',
  phone: '',
  message: '',
  confirm_session: false,
  confirm_why_now: '',
  privacy_accepted: false,
})

const questionnaire = reactive(emptyQuestionnaire())
const contact = reactive(emptyContact())
const step = ref(1)
const submitting = ref(false)
const submitted = ref(false)
const formError = ref('')

function goToStep2() {
  formError.value = ''
  if (!questionnaire.q1_situation.trim() || !questionnaire.q2_routine.trim() || !questionnaire.q4_expectations.trim()) {
    formError.value = 'Por favor, responde todas las preguntas antes de continuar.'
    return
  }
  const hasStruggle =
    questionnaire.q3_selected.length > 0 ||
    (questionnaire.q3_other_checked && questionnaire.q3_other_text.trim().length > 0)
  if (!hasStruggle) {
    formError.value = 'Marca al menos una opción en la pregunta 3.'
    return
  }
  step.value = 2
  document.getElementById('valoracion')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function submitValuation() {
  formError.value = ''
  if (!contact.confirm_session) {
    formError.value = 'Confirma que entiendes para qué es la sesión de valoración.'
    return
  }
  if (!contact.privacy_accepted) {
    formError.value = 'Necesito tu consentimiento de protección de datos para poder atender tu solicitud.'
    return
  }
  const q3List = [...questionnaire.q3_selected]
  if (questionnaire.q3_other_checked && questionnaire.q3_other_text.trim()) {
    q3List.push(`Otra: ${questionnaire.q3_other_text.trim()}`)
  }
  const message = [
    '=== CUESTIONARIO PREVIO DE VALORACIÓN (Programa Vuelve a Ti) ===',
    `1. Tiempo desde la ruptura y qué ha intentado:\n${questionnaire.q1_situation.trim()}`,
    `2. Rutina diaria y momentos más difíciles:\n${questionnaire.q2_routine.trim()}`,
    `3. Qué le cuesta más gestionar:\n- ${q3List.join('\n- ')}`,
    `4. Qué espera conseguir en las 10 semanas:\n${questionnaire.q4_expectations.trim()}`,
    `5. Por qué siente que necesita dar este paso ahora:\n${contact.confirm_why_now.trim() || 'Confirmado con la casilla obligatoria'}`,
    contact.message.trim() ? `Mensaje adicional:\n${contact.message.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  submitting.value = true
  try {
    await api.post('/contact', {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      message,
    })
    submitted.value = true
    Object.assign(questionnaire, emptyQuestionnaire())
    Object.assign(contact, emptyContact())
    step.value = 1
    toast.success('He recibido tu cuestionario. Te escribiré muy pronto para agendar la llamada.', {
      title: 'Solicitud enviada',
    })
  } catch (err) {
    formError.value =
      err.response?.data?.error ||
      'No se ha podido enviar la solicitud. Inténtalo de nuevo o escríbeme a cviladotpsicologa@gmail.com.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35]">
    <SiteHeader cta-to="/terapia-online#reservar" />

    <main>
      <!-- PORTADA -->
      <section class="relative overflow-hidden bg-[#2C3E35]">
        <img
          src="/images/terapia/terapia-online-ansiedad-relaciones.webp"
          alt=""
          aria-hidden="true"
          class="cv-zoom absolute inset-0 w-full h-full object-cover"
          fetchpriority="high"
        />
        <div aria-hidden="true" class="absolute inset-0 bg-[linear-gradient(90deg,rgba(44,62,53,0.95)_0%,rgba(44,62,53,0.82)_52%,rgba(44,62,53,0.45)_100%)]"></div>
        <div class="cv-hero relative max-w-[1200px] mx-auto px-5 sm:px-6 pt-28 pb-32 sm:pt-[140px] sm:pb-[150px] flex flex-col gap-6">
          <h1 class="m-0 self-start !font-sans font-semibold text-xs tracking-[0.12em] uppercase text-[#E6EFE9] border border-[#E6EFE9]/35 px-3.5 py-2 rounded-full">
            Programa para superar una ruptura de pareja · Vuelve a Ti
          </h1>
          <p class="m-0 max-w-[760px] font-editorial font-semibold text-[42px] sm:text-[62px] leading-[1.05] tracking-tight text-[#FAF8F5]">
            Pocas cosas descolocan tanto la vida <em class="text-[#F2B8A6] font-semibold">como una ruptura.</em>
          </p>
          <p class="m-0 text-lg leading-relaxed text-[#FAF8F5]/90 max-w-[600px]">
            Duele perder a tu pareja, pero duele todavía más perder el futuro que teníais imaginado. En 10 semanas te
            acompaño a dejar de darle vueltas a la relación, calmar la ansiedad, soltar la culpa y reconstruir tu identidad.
          </p>
          <div class="flex flex-wrap gap-3 pt-2">
            <a href="#valoracion" class="bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold px-7 py-4 rounded-2xl transition-colors">Reservar valoración gratuita</a>
            <a href="#fases" class="text-[#FAF8F5] font-semibold px-6 py-4 rounded-2xl border border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/10 transition-colors">Ver cómo funciona</a>
          </div>
          <p class="mt-2 mb-0 text-[13px] text-[#FAF8F5]/75">10 semanas · Acceso al contenido durante 6 meses · Valoración previa gratuita de 30 min</p>
        </div>
      </section>

      <!-- ¿TE RECONOCES? -->
      <section class="bg-[#F3EFEA]">
        <div class="max-w-[1240px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-14">
          <div class="flex flex-col items-center gap-4 text-center max-w-[860px] mx-auto">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1] text-balance">
              Por qué sientes que no avanzas <span class="text-[#D9826C]">(y qué podemos trabajar)</span>
            </h2>
            <p class="m-0 text-lg leading-relaxed text-[#2C3E35]/80">
              Todo ese caos mental, la ansiedad y la culpa tienen una explicación: es la forma en que tu mente y tu cuerpo reaccionan a la pérdida. Y lo más importante: se pueden trabajar.
            </p>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <article
              v-for="p in painPoints"
              :key="p.badge"
              v-reveal
              class="bg-white border border-[#EAE4DC] rounded-[20px] p-7 flex flex-col gap-3.5 shadow-[0_1px_2px_rgba(44,62,53,0.04)]"
            >
              <div class="flex justify-between items-center">
                <span class="text-xs font-medium bg-[#F3EFEA] px-3 py-1.5 rounded-full">{{ p.badge }}</span>
                <span aria-hidden="true" class="w-9 h-9 rounded-full grid place-items-center bg-[#F3EFEA] text-[#4A6B5D]">
                  <component :is="p.icon" class="w-[17px] h-[17px]" :stroke-width="1.7" />
                </span>
              </div>
              <h3 class="mt-1 mb-0 font-semibold text-[26px] leading-[1.3]">{{ p.title }}</h3>
              <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/80">{{ p.text }}</p>
              <div class="mt-auto bg-[#FAF8F5] border border-[#EAE4DC] rounded-[14px] px-[18px] py-4 flex gap-3">
                <CircleCheck class="w-[18px] h-[18px] shrink-0 mt-px text-[#4A6B5D]" :stroke-width="1.6" aria-hidden="true" />
                <div class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold tracking-[0.06em] uppercase text-[#4A6B5D]">Qué trabajamos en el programa: {{ p.reliefTitle }}</span>
                  <p class="m-0 text-[15px] leading-normal">{{ p.relief }}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- LAS 3 FASES -->
      <section id="fases" class="bg-white border-y border-[#EAE4DC]">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-12">
          <div class="flex flex-col items-center gap-3.5 text-center">
            <span class="text-xs tracking-[0.14em] uppercase font-bold text-[#A9553F]">El programa Vuelve a Ti</span>
            <h2 class="m-0 font-semibold text-4xl sm:text-[50px] leading-[1.08]">10 semanas para recuperar tu calma y reconstruirte</h2>
            <p class="m-0 text-[17px] text-[#2C3E35]/80">Tres fases, con acompañamiento psicológico individual en todo el proceso.</p>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <article v-reveal class="rounded-[28px] overflow-hidden border border-[#EAE4DC] flex flex-col">
              <div class="bg-[#FBE4DF] p-7 flex flex-col gap-1.5">
                <div class="h-[90px]"><MotionWave color="#D9826C" label="Una onda agitada que se calma: regular el sistema nervioso" /></div>
                <span class="font-editorial text-[44px] font-bold text-[#C0674F] leading-none">01</span>
                <h3 class="m-0 text-[32px] font-semibold">Regulación</h3>
                <span class="text-xs font-bold tracking-[0.1em] uppercase text-[#A9553F]">Salir del modo supervivencia</span>
              </div>
              <div class="p-7 flex flex-col gap-3 grow bg-white">
                <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/85">Trabajamos con herramientas para calmar tu sistema nervioso y salir de la alerta constante, para que tu cuerpo deje de vivir la ruptura como una amenaza.</p>
                <p class="mt-auto mb-0 text-sm leading-relaxed bg-[#FAF8F5] rounded-2xl px-4 py-3.5"><strong>El objetivo:</strong> que vuelvas a descansar y la rumiación pierda fuerza.</p>
              </div>
            </article>
            <article v-reveal class="rounded-[28px] overflow-hidden border border-[#EAE4DC] flex flex-col">
              <div class="bg-[#F9EBDD] p-7 flex flex-col gap-1.5">
                <div class="h-[90px]"><MotionCircles left="#4A6B5D" right="#D99B52" label="Dos círculos que se acercan: entender tu forma de vincularte" /></div>
                <span class="font-editorial text-[44px] font-bold text-[#B9803A] leading-none">02</span>
                <h3 class="m-0 text-[32px] font-semibold">Comprensión</h3>
                <span class="text-xs font-bold tracking-[0.1em] uppercase text-[#8A5A22]">Ir a la raíz del dolor</span>
              </div>
              <div class="p-7 flex flex-col gap-3 grow bg-white">
                <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/85">Exploramos tus relaciones pasadas para encontrar el hilo conductor: qué se repite y desde dónde te vinculas. Trabajamos con el apego y con IFS (un enfoque que te ayuda a entender las distintas partes de ti), sin buscar culpables.</p>
                <p class="mt-auto mb-0 text-sm leading-relaxed bg-[#FAF8F5] rounded-2xl px-4 py-3.5"><strong>El objetivo:</strong> que entiendas por qué repites ciertos patrones y puedas poner límites con menos culpa.</p>
              </div>
            </article>
            <article v-reveal class="rounded-[28px] overflow-hidden border border-[#EAE4DC] flex flex-col">
              <div class="bg-[#E6EFE9] p-7 flex flex-col gap-1.5">
                <div class="h-[90px]"><MotionLayers label="Capas que se ordenan: integrar el cambio" /></div>
                <span class="font-editorial text-[44px] font-bold text-[#4A6B5D] leading-none">03</span>
                <h3 class="m-0 text-[32px] font-semibold">Integración</h3>
                <span class="text-xs font-bold tracking-[0.1em] uppercase text-[#4A6B5D]">Consolidar el cambio</span>
              </div>
              <div class="p-7 flex flex-col gap-3 grow bg-white">
                <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/85">Consolidamos tu autoestima, tus límites y tus valores en tu vida real, para que te cueste menos perderte en los demás.</p>
                <p class="mt-auto mb-0 text-sm leading-relaxed bg-[#FAF8F5] rounded-2xl px-4 py-3.5"><strong>El objetivo:</strong> que te relaciones desde más seguridad y elijas lo que te hace bien.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- QUÉ INCLUYE / QUÉ NO ES -->
      <section>
        <div class="max-w-[1136px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-14">
          <h2 class="mx-auto my-0 max-w-[820px] text-center font-semibold text-4xl sm:text-[46px] leading-[1.15] text-balance">
            El objetivo no es que «pases página».<br />Es que <span class="text-[#D9826C]">regules tu sistema nervioso</span> y cambies tus patrones.
          </h2>
          <div class="flex flex-col gap-7">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-7">
              <div v-reveal class="bg-white border border-[#EAE4DC] border-t-4 border-t-[#4A6B5D] rounded-3xl p-9 flex flex-col gap-[22px] shadow-[0_1px_2px_rgba(44,62,53,0.04)]">
                <div class="flex items-center gap-3.5 pb-5 border-b border-[#EAE4DC]">
                  <span aria-hidden="true" class="w-10 h-10 rounded-[10px] bg-[#E6EFE9] grid place-items-center"><Check class="w-[18px] h-[18px] text-[#4A6B5D]" :stroke-width="2" /></span>
                  <h3 class="m-0 text-[28px] font-medium">Qué SÍ incluye el programa</h3>
                </div>
                <ul class="m-0 p-0 list-none flex flex-col gap-4 text-[15px] leading-normal text-[#2C3E35]/85">
                  <li v-for="item in includes" :key="item[0]" class="flex gap-3">
                    <CircleCheck class="w-5 h-5 shrink-0 mt-px text-white fill-[#4A6B5D]" :stroke-width="2.2" aria-hidden="true" />
                    <span><strong class="font-bold text-[#2C3E35]">{{ item[0] }}</strong> {{ item[1] }}</span>
                  </li>
                </ul>
              </div>
              <div v-reveal class="bg-white border border-[#EAE4DC] border-t-4 border-t-[#D9826C] rounded-3xl p-9 flex flex-col gap-[22px] shadow-[0_1px_2px_rgba(44,62,53,0.04)]">
                <div class="flex items-center gap-3.5 pb-5 border-b border-[#EAE4DC]">
                  <span aria-hidden="true" class="w-10 h-10 rounded-[10px] bg-[#FBE4DF] grid place-items-center"><X class="w-[18px] h-[18px] text-[#A9553F]" :stroke-width="2" /></span>
                  <h3 class="m-0 text-[28px] font-medium">Qué NO es esto</h3>
                </div>
                <ul class="m-0 p-0 list-none flex flex-col gap-4 text-[15px] leading-normal text-[#2C3E35]/85">
                  <li v-for="item in notIncludes" :key="item[0]" class="flex gap-3">
                    <CircleX class="w-5 h-5 shrink-0 mt-px text-white fill-[#D9826C]" :stroke-width="2.2" aria-hidden="true" />
                    <span><strong class="font-bold text-[#2C3E35]">{{ item[0] }}</strong> {{ item[1] }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="bg-[#F3EFEA] rounded-2xl px-6 py-4 flex flex-wrap justify-between gap-x-8 gap-y-3 text-[15px] text-[#2C3E35]/85">
              <span class="flex items-center gap-2.5"><CalendarDays class="w-[17px] h-[17px] text-[#4A6B5D]" :stroke-width="1.7" aria-hidden="true" />10 semanas de acompañamiento, con acceso al contenido durante 6 meses.</span>
              <span class="flex items-center gap-2.5"><Brain class="w-[17px] h-[17px] text-[#4A6B5D]" :stroke-width="1.7" aria-hidden="true" />Un enfoque integrador: cuerpo, apego e historia personal.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ¿ES PARA TI? -->
      <section class="bg-[#F3EFEA]">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-11">
          <div class="text-center flex flex-col gap-3 items-center">
            <span class="text-xs tracking-[0.14em] uppercase font-bold text-[#A9553F]">Antes de dar el paso</span>
            <h2 class="m-0 font-semibold text-4xl sm:text-[46px] leading-[1.1]">¿Es «Vuelve a Ti» lo que necesitas?</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-reveal class="bg-white rounded-[28px] p-9 flex flex-col gap-[18px]">
              <h3 class="m-0 text-3xl font-semibold text-[#4A6B5D]">Sí es para ti si…</h3>
              <p class="m-0 text-[15px] leading-relaxed"><strong>Vives en modo supervivencia.</strong> Por fuera sigues funcionando, pero por dentro vives en alerta, en bucle y sin descansar.</p>
              <p class="m-0 text-[15px] leading-relaxed"><strong>Sientes que ya lo has intentado todo.</strong> Te distraes o dejas pasar el tiempo, pero el nudo en el pecho sigue ahí.</p>
              <p class="m-0 text-[15px] leading-relaxed"><strong>Quieres ir a la raíz</strong> y comprometerte con un proceso clínico.</p>
            </div>
            <div v-reveal class="bg-white rounded-[28px] p-9 flex flex-col gap-[18px]">
              <h3 class="m-0 text-3xl font-semibold text-[#A9553F]">No es para ti si…</h3>
              <p class="m-0 text-[15px] leading-relaxed"><strong>Buscas un parche rápido.</strong> El programa requiere compromiso y trabajo interno.</p>
              <p class="m-0 text-[15px] leading-relaxed"><strong>Solo quieres desahogarte.</strong> Vamos a analizar con honestidad los patrones que repites.</p>
              <p class="m-0 text-[15px] leading-relaxed"><strong>Quieres un truco para «recuperar a tu ex».</strong> Nadie puede garantizarte que vuelva, y sería poco ético prometerlo.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- QUIÉN TE ACOMPAÑA -->
      <section>
        <div class="max-w-[1100px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-wrap gap-14 items-center">
          <div class="flex-[0_1_320px] min-w-0 mx-auto">
            <img
              src="/images/terapia/carla-viladot-psicologa-terapia-online.webp"
              alt="Carla Viladot, psicóloga general sanitaria"
              width="746"
              height="1024"
              loading="lazy"
              class="w-full aspect-[4/5] object-cover object-[center_25%] rounded-[28px]"
            />
          </div>
          <div v-reveal class="flex-[1_1_460px] min-w-0 flex flex-col gap-[18px]">
            <span class="text-xs tracking-[0.14em] uppercase font-bold text-[#A9553F]">Quién te acompaña</span>
            <h2 class="m-0 font-semibold text-4xl sm:text-[42px] leading-[1.12]">
              Sé lo difícil que es escuchar «tienes que pasar página» cuando nadie te enseña cómo hacerlo.
            </h2>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Soy Carla Viladot, psicóloga sanitaria (Col. 29332). He convertido mis años de práctica clínica en una hoja de
              ruta clara: trabajamos desde el cuerpo, el apego y las partes de ti que intentan protegerte, para que puedas soltar con
              herramientas reales.
            </p>
            <RouterLink to="/sobre-mi" class="self-start text-[15px] font-semibold text-[#4A6B5D] flex items-center gap-2 hover:text-[#2C3E35]">
              Conocer más sobre mí <ArrowRight class="w-4 h-4" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- VALORACIÓN -->
      <section id="valoracion" class="bg-[#2C3E35] text-[#FAF8F5]">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-wrap gap-14 items-start">
          <div class="flex-[1_1_380px] min-w-0 flex flex-col gap-6">
            <span class="text-xs tracking-[0.14em] uppercase font-bold text-[#F2B8A6]">El siguiente paso</span>
            <h2 class="m-0 font-semibold text-4xl sm:text-[46px] leading-[1.08] text-[#FAF8F5]">Reserva tu valoración gratuita</h2>
            <p class="m-0 text-base leading-[1.7] text-[#FAF8F5]/80">
              El tiempo por sí solo no resuelve esto. Para asegurarme de que el programa es lo que necesitas, el acceso empieza con una llamada de valoración.
            </p>
            <ol class="m-0 p-0 list-none flex flex-col gap-[18px]">
              <li class="flex gap-4"><span class="font-editorial text-[34px] font-bold text-[#F2B8A6] leading-none" aria-hidden="true">1</span><span class="text-[15px] leading-relaxed text-[#FAF8F5]/85"><strong class="text-[#FAF8F5]">Cuestionario previo.</strong> Unas preguntas breves (5 minutos) para entender tu situación.</span></li>
              <li class="flex gap-4"><span class="font-editorial text-[34px] font-bold text-[#F2B8A6] leading-none" aria-hidden="true">2</span><span class="text-[15px] leading-relaxed text-[#FAF8F5]/85"><strong class="text-[#FAF8F5]">Agendamos la cita.</strong> Te escribo para acordar el día y la hora.</span></li>
              <li class="flex gap-4"><span class="font-editorial text-[34px] font-bold text-[#F2B8A6] leading-none" aria-hidden="true">3</span><span class="text-[15px] leading-relaxed text-[#FAF8F5]/85"><strong class="text-[#FAF8F5]">Nuestra llamada.</strong> 30 minutos gratuitos por Google Meet para valorar tu caso.</span></li>
            </ol>
            <p class="m-0 text-[13px] leading-relaxed text-[#FAF8F5]/65">Esta llamada es para valorar si el programa es adecuado para ti; no es una sesión de terapia gratuita.</p>
          </div>

          <div v-if="submitted" role="status" class="flex-[999_1_520px] min-w-0 bg-white text-[#2C3E35] rounded-[28px] p-8 sm:p-10 flex flex-col gap-4">
            <span class="w-14 h-14 rounded-full bg-[#E6EFE9] flex items-center justify-center"><Check class="w-7 h-7 text-[#4A6B5D]" aria-hidden="true" /></span>
            <h3 class="m-0 font-semibold text-3xl">Gracias, he recibido tu cuestionario</h3>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">Te escribiré muy pronto para acordar el día y la hora de nuestra llamada. Revisa también la carpeta de spam por si acaso.</p>
            <button type="button" class="self-start text-sm font-semibold text-[#4A6B5D] underline underline-offset-4 cursor-pointer" @click="submitted = false">Enviar otra solicitud</button>
          </div>

          <form v-else class="flex-[999_1_520px] min-w-0 bg-white text-[#2C3E35] rounded-[28px] p-6 sm:p-10 flex flex-col gap-[22px]" @submit.prevent="step === 1 ? goToStep2() : submitValuation()">
            <div class="flex items-center justify-between gap-3">
              <span class="font-editorial text-[26px] font-semibold">{{ step === 1 ? 'Cuestionario previo' : 'Tus datos' }}</span>
              <span class="text-xs font-bold text-[#A9553F] bg-[#FBE4DF] px-3 py-1.5 rounded-full">Paso {{ step }} de 2</span>
            </div>

            <template v-if="step === 1">
              <label class="flex flex-col gap-1.5 text-sm font-semibold">¿Cuánto tiempo ha pasado desde la ruptura y qué has intentado hasta ahora? *
                <textarea v-model="questionnaire.q1_situation" rows="3" required maxlength="1500" class="cv-input resize-y"></textarea>
              </label>
              <label class="flex flex-col gap-1.5 text-sm font-semibold">¿Cómo es tu rutina y en qué momentos te cuesta más la ansiedad, la rumiación o el bajón? *
                <textarea v-model="questionnaire.q2_routine" rows="3" required maxlength="1500" class="cv-input resize-y"></textarea>
              </label>
              <fieldset class="border-0 m-0 p-0 flex flex-col gap-2.5">
                <legend class="text-sm font-semibold mb-2">¿Qué es lo que más te está costando? (puedes marcar varias) *</legend>
                <label v-for="opt in struggleOptions" :key="opt" class="cv-chip">
                  <input v-model="questionnaire.q3_selected" type="checkbox" :value="opt" class="accent-[#A9553F] mt-0.5" />{{ opt }}
                </label>
                <label class="cv-chip">
                  <input v-model="questionnaire.q3_other_checked" type="checkbox" class="accent-[#A9553F] mt-0.5" />Otra
                </label>
                <input v-if="questionnaire.q3_other_checked" v-model="questionnaire.q3_other_text" type="text" aria-label="Otra dificultad" placeholder="Cuéntame cuál" maxlength="300" class="cv-input" />
              </fieldset>
              <label class="flex flex-col gap-1.5 text-sm font-semibold">Si empezamos este proceso, ¿cómo te gustaría sentirte al terminar las 10 semanas? *
                <textarea v-model="questionnaire.q4_expectations" rows="3" required maxlength="1500" class="cv-input resize-y"></textarea>
              </label>
            </template>

            <template v-else>
              <label class="flex flex-col gap-1.5 text-sm font-semibold">Nombre completo *
                <input v-model="contact.name" type="text" required autocomplete="name" maxlength="120" class="cv-input" />
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label class="flex flex-col gap-1.5 text-sm font-semibold">Email *
                  <input v-model="contact.email" type="email" required autocomplete="email" maxlength="150" class="cv-input" />
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-semibold">Teléfono / WhatsApp *
                  <input v-model="contact.phone" type="tel" required autocomplete="tel" placeholder="+34" maxlength="50" class="cv-input" />
                </label>
              </div>
              <label class="flex flex-col gap-1.5 text-sm font-semibold">Mensaje (opcional)
                <textarea v-model="contact.message" rows="2" maxlength="800" class="cv-input resize-y"></textarea>
              </label>
              <div class="flex flex-col gap-3 pt-2 border-t border-[#2C3E35]/10">
                <label class="flex items-start gap-2.5 text-sm leading-normal mt-3">
                  <input v-model="contact.confirm_session" type="checkbox" required class="accent-[#A9553F] mt-1" />
                  <span>Entiendo que esta llamada de 30 minutos sirve para valorar mi entrada al programa de 10 semanas (de pago) y que no es una sesión de terapia gratuita. *</span>
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-semibold">¿Por qué sientes que dar este paso es lo que necesitas ahora? (opcional)
                  <textarea v-model="contact.confirm_why_now" rows="2" maxlength="800" class="cv-input resize-y"></textarea>
                </label>
                <p class="m-0 text-xs leading-relaxed text-[#2C3E35]/75">
                  <strong>Protección de datos.</strong> Responsable: Carla Viladot (NIF 49255948E). Finalidad: valorar tu solicitud y contactar contigo.
                  Tus datos no se cederán a terceros salvo obligación legal. Puedes ejercer tus derechos escribiendo a
                  <a href="mailto:cviladotpsicologa@gmail.com" class="text-[#4A6B5D] underline">cviladotpsicologa@gmail.com</a>. Más información en la
                  <RouterLink to="/privacidad" class="text-[#4A6B5D] underline">política de privacidad</RouterLink>.
                </p>
                <label class="flex items-start gap-2.5 text-sm leading-normal">
                  <input v-model="contact.privacy_accepted" type="checkbox" required class="accent-[#A9553F] mt-1" />
                  <span>He leído la información sobre protección de datos y consiento el tratamiento de mis datos, incluidos los de salud, para gestionar mi solicitud. *</span>
                </label>
              </div>
            </template>

            <p v-if="formError" role="alert" class="m-0 text-sm font-medium text-[#9A3B28] bg-[#FBE4DF] rounded-xl px-4 py-3">{{ formError }}</p>

            <div class="flex flex-wrap items-center gap-3">
              <button
                v-if="step === 2"
                type="button"
                class="font-semibold text-sm text-[#4A6B5D] px-4 py-3 rounded-2xl hover:bg-[#4A6B5D]/10 cursor-pointer"
                @click="step = 1"
              >Volver a las preguntas</button>
              <button
                type="submit"
                :disabled="submitting"
                class="inline-flex items-center gap-2 font-semibold text-base bg-[#A9553F] hover:bg-[#8f4533] disabled:opacity-60 text-white px-7 py-4 rounded-2xl cursor-pointer transition-colors"
              >
                <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" aria-hidden="true" />
                {{ step === 1 ? 'Continuar con mis datos' : submitting ? 'Enviando…' : 'Enviar solicitud' }}
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- PREGUNTAS FRECUENTES -->
      <section>
        <div class="max-w-[860px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-8">
          <h2 class="m-0 font-semibold text-4xl sm:text-[46px] text-center">Preguntas frecuentes</h2>
          <div class="flex flex-col border-t border-[#E0D8CE]">
            <details v-for="(f, i) in faqs" :key="f.q" :open="i === 0" class="group border-b border-[#E0D8CE] py-5 px-1">
              <summary class="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-lg font-semibold flex justify-between gap-4">
                {{ f.q }}
                <Plus class="w-5 h-5 shrink-0 text-[#A9553F] transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p class="mt-3 mb-0 text-base leading-[1.7] text-[#2C3E35]/85">{{ f.a }}</p>
            </details>
          </div>
        </div>
      </section>

      <!-- ¿NO ESTÁS EN PLENA RUPTURA? -->
      <section class="px-5 sm:px-6 pb-20 sm:pb-26">
        <div class="max-w-[1200px] mx-auto bg-[#F3EFEA] rounded-[28px] p-8 sm:p-12 flex flex-wrap items-center justify-between gap-6">
          <div class="flex flex-col gap-2 max-w-[640px]">
            <h2 class="m-0 font-semibold text-4xl">¿No estás en plena ruptura?</h2>
            <p class="m-0 text-base leading-relaxed text-[#2C3E35]/80">También acompaño en terapia individual y de pareja: ansiedad, autoestima, apego y dependencia emocional.</p>
          </div>
          <RouterLink to="/terapia-online" class="bg-[#4A6B5D] hover:bg-[#3d594d] text-white font-semibold text-[15px] px-6 py-3.5 rounded-2xl transition-colors">Ver terapia online</RouterLink>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
@reference "../assets/css/main.css";

.cv-input {
  @apply font-sans font-normal text-[15px] px-3.5 py-3 border border-[#2C3E35]/20 rounded-xl bg-[#FAF8F5] text-[#2C3E35] focus:outline-none focus:border-[#4A6B5D] focus:ring-2 focus:ring-[#4A6B5D]/15;
}
.cv-chip {
  @apply flex items-start gap-2.5 px-4 py-3 border border-[#2C3E35]/20 rounded-2xl text-sm font-normal leading-snug cursor-pointer has-[:checked]:border-[#A9553F] has-[:checked]:bg-[#FBE4DF]/50;
}
</style>
