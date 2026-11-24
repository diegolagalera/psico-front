<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Feather,
  MessageCircle,
  Sprout,
  Heart,
  Footprints,
  User,
  Check,
  Star,
  Plus,
  Loader2,
} from 'lucide-vue-next'
import api from '@/services/api'
import { toast } from '@/composables/useToast'

const pillars = [
  { icon: MessageCircle, title: 'Escucha activa', text: 'Te escucho sin juicio, con calma y una atención real.' },
  { icon: Sprout, title: 'Terapia a tu medida', text: 'Pensada para ti, para tu ritmo y para lo que necesitas ahora.' },
  { icon: Heart, title: 'Trauma y apego', text: 'Vamos a la raíz: tu historia y tu forma de vincularte.' },
  { icon: Footprints, title: 'Cambio real', text: 'Paso a paso, hacia cambios que se mantienen en el tiempo.' },
]

const phrases = [
  ['«Mi cabeza ', 'no para', ', ni siquiera cuando todo está en calma.»'],
  ['«Siempre acabo en ', 'el mismo tipo de relación', '.»'],
  ['«Me cuesta ', 'poner límites', ' sin sentirme culpable.»'],
  ['«Hay cosas de ', 'mi pasado', ' que todavía me pesan.»'],
  ['«Nos queremos, pero sentimos que ', 'nos estamos alejando', '.»'],
]

const topics = [
  'Ansiedad',
  'Autoestima',
  'Apego',
  'Dependencia emocional',
  'Rupturas',
  'Celos e inseguridad',
  'Trauma',
  'Relaciones de pareja',
]

const steps = [
  { n: '01', title: 'Rellena el formulario', text: 'Cuéntame brevemente qué te trae y te escribo por WhatsApp en menos de 24 horas.' },
  { n: '02', title: 'Primera sesión', text: 'Exploramos qué te trae, tu historia y qué te gustaría que cambiara.' },
  { n: '03', title: 'Tu proceso', text: 'Sesiones por videollamada de 50–55 minutos, con la frecuencia que acordemos.' },
]

// Cada reseña: tramos de texto; los pares (índice impar) van resaltados
const reviews = [
  {
    parts: ['«Una profesional excepcional, tanto por su preparación como por su ', 'calidad humana', '. Destaca por su empatía, sensibilidad y capacidad para ', 'escuchar sin juzgar', ', creando un espacio de ', 'confianza, respeto y seguridad', '. (…) Totalmente recomendable.»'],
    author: 'M.',
  },
  {
    parts: ['«Nos la recomendó mi psicóloga y estamos muy contentos. Estamos haciendo ', 'terapia de pareja', ' y hemos notado que ', 'nos ayuda mucho', '. Muy amable y empática. ¡La recomendamos 100!»'],
    author: 'Pareja en terapia',
  },
  {
    parts: ['«Carla ', 'me ha ayudado mucho en momentos difíciles', ' para mí. Muy buena profesional, siempre amable, empática y dispuesta a ayudar, ', 'una gran terapeuta', '.»'],
    author: 'J.',
  },
  {
    parts: ['«Valoro mucho la ', 'cercanía', ' con la que te trata en consulta y su ', 'profesionalidad', '. ¡No me puedo sentir en ', 'mejores manos', '!»'],
    author: 'J.',
  },
  {
    parts: ['«Me está ayudando mucho. ', 'Trato profesional y cercano', ', en un espacio donde es ', 'fácil sentirse cómoda', '. Muy recomendable.»'],
    author: 'S.',
  },
]

const faqs = [
  {
    q: '¿Es efectiva la terapia online?',
    a: 'Sí. La terapia online es tan eficaz como la presencial: lo único que cambia es el canal. Además, te da más flexibilidad y comodidad, algo que facilita implicarte en el proceso y mantener la constancia.',
  },
  {
    q: '¿Cuánto duran las sesiones? ¿Puedo cambiar o cancelar mi cita?',
    a: 'Las sesiones duran entre 50 y 55 minutos. Puedes cambiar tu cita de día u hora siempre que me avises con al menos 24 horas de antelación.',
  },
  {
    q: '¿Dónde se hacen las sesiones?',
    a: 'Las sesiones son 100% online: no hago terapia presencial. Nos vemos por Google Meet, sin necesidad de descargar nada, y 24 horas antes de la sesión te envío por WhatsApp el enlace para entrar. Así puedes hacer terapia desde donde estés.',
  },
  {
    q: '¿Cómo se pagan las sesiones?',
    a: 'Por Bizum o transferencia bancaria, como mínimo 24 horas antes de la sesión.',
  },
]

const scheduleOptions = [
  { value: '9-13', label: '9 a 13 h' },
  { value: '13-15', label: '13 a 15 h' },
  { value: '15-20', label: '15 a 20 h' },
]

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  online_confirmed: false,
  therapy_type: '',
  reason: '',
  schedules: [],
  schedule_other: '',
  language: 'Castellano',
  source: '',
  questions: '',
  privacy_accepted: false,
  wants_news: false,
})

const form = reactive(emptyForm())
const submitting = ref(false)
const submitted = ref(false)
const formError = ref('')

async function submitForm() {
  formError.value = ''
  if (!form.schedules.length && !form.schedule_other.trim()) {
    formError.value = 'Marca al menos un horario o escribe otro que te venga bien.'
    return
  }
  submitting.value = true
  try {
    await api.post('/therapy-request', { ...form })
    submitted.value = true
    Object.assign(form, emptyForm())
    toast.success('He recibido tu solicitud. Te escribo por WhatsApp en menos de 24 horas.', {
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
    <!-- CABECERA -->
    <SiteHeader cta-to="#reservar" cta-label="Reservar sesión" />

    <main>
      <!-- HERO -->
      <section class="relative overflow-hidden bg-[#2C3E35]">
        <img
          src="/images/terapia/terapia-online-psicologa-hero.webp"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover object-[75%_center]"
          fetchpriority="high"
        />
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-[linear-gradient(90deg,rgba(44,62,53,0.94)_0%,rgba(44,62,53,0.82)_45%,rgba(44,62,53,0.45)_100%)]"
        ></div>
        <div class="relative max-w-[1200px] mx-auto px-5 sm:px-6 py-24 sm:py-36">
          <div class="max-w-[640px] flex flex-col gap-6">
            <h1
              class="self-start m-0 !font-sans font-semibold text-xs tracking-[0.12em] uppercase text-[#E6EFE9] border border-[#E6EFE9]/35 px-3.5 py-2 rounded-full"
            >
              Psicóloga online · Terapia individual y de pareja
            </h1>
            <p class="m-0 font-editorial font-semibold text-4xl sm:text-6xl leading-[1.05] tracking-tight text-[#FAF8F5]">
              Lo que duele en tus relaciones
              <em class="text-[#F2B8A6] font-semibold">tiene un porqué.</em><br />Y se puede trabajar.
            </p>
            <p class="m-0 text-lg leading-relaxed text-[#FAF8F5]/85 max-w-[560px]">
              Terapia online para la ansiedad, la autoestima y las relaciones que duelen. A tu ritmo y
              desde cualquier lugar de España.
            </p>
            <div class="flex flex-wrap gap-3 pt-2">
              <a
                href="#reservar"
                class="bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold px-7 py-4 rounded-2xl transition-colors"
              >
                Reservar sesión
              </a>
              <a
                href="#servicios"
                class="text-[#FAF8F5] font-semibold px-6 py-4 rounded-2xl border border-[#FAF8F5]/40 hover:bg-[#FAF8F5]/10 transition-colors"
              >
                Ver servicios y tarifas
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- SOY CARLA -->
      <section>
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 pt-20 sm:pt-26 pb-16 sm:pb-18 flex flex-wrap gap-12 lg:gap-16 items-center">
          <div class="flex-[1_1_480px] min-w-0 flex flex-col gap-5">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1] tracking-tight">Soy Carla Viladot,</h2>
            <p class="m-0 text-[13px] tracking-[0.1em] uppercase text-[#4A6B5D] font-semibold">
              Psicóloga General Sanitaria · Col. 29332
            </p>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Si vives con la cabeza a mil, te cuesta poner límites o sientes que tus relaciones siempre acaban
              igual, no es que te pase algo malo. Hay un porqué, y se puede entender y sanar.
            </p>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Mi trabajo es acompañarte a descubrir de dónde viene lo que sientes: tu historia, tu forma de
              vincularte y esas partes de ti que intentan protegerte. Vamos a la raíz, para que dejes de repetir lo
              que te hace daño. Con calma, a tu ritmo y en un espacio donde puedas ser tú.
            </p>
            <div class="flex flex-col gap-3.5 pt-3 pb-2">
              <span aria-hidden="true" class="w-14 h-0.5 bg-[#C0674F]"></span>
              <p class="m-0 font-editorial italic font-semibold text-3xl sm:text-4xl leading-[1.2] tracking-tight">
                Querer <span class="text-[#A9553F]">no debería doler así.</span>
              </p>
            </div>
          </div>
          <div class="flex-[0_1_340px] min-w-0 mx-auto">
            <img
              src="/images/terapia/carla-viladot-psicologa-terapia-online.webp"
              alt="Carla Viladot, psicóloga general sanitaria, en sesión de terapia online"
              width="746"
              height="1024"
              loading="lazy"
              class="w-full aspect-[4/5] object-cover object-[center_25%] rounded-[28px]"
            />
          </div>
        </div>
      </section>

      <!-- 4 PILARES -->
      <section class="bg-[#F3EFEA] border-t border-[#2C3E35]/10">
        <div class="max-w-[1280px] mx-auto px-5 sm:px-6 py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12">
          <div
            v-for="(p, i) in pillars"
            :key="p.title"
            class="px-8 flex flex-col items-center text-center gap-3.5"
            :class="i < pillars.length - 1 ? 'lg:border-r lg:border-[#2C3E35]/10' : ''"
          >
            <component :is="p.icon" class="w-10 h-10 text-[#D9826C]" :stroke-width="1.4" aria-hidden="true" />
            <h3 class="mt-1.5 mb-0 text-[26px] leading-tight font-semibold">{{ p.title }}</h3>
            <p class="m-0 text-base leading-relaxed text-[#2C3E35]/80">{{ p.text }}</p>
          </div>
        </div>
      </section>

      <!-- ¿TE SUENA? -->
      <section>
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-wrap gap-12 lg:gap-16 items-center">
          <div class="flex-[1_1_500px] min-w-0 flex flex-col gap-6">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1] tracking-tight">
              ¿Te suena alguna de estas frases?
            </h2>
            <ul class="m-0 p-0 list-none flex flex-col gap-3">
              <li
                v-for="(ph, i) in phrases"
                :key="i"
                class="bg-white border border-[#EAE4DC] rounded-2xl px-5 py-4 font-editorial italic text-[22px]"
              >
                {{ ph[0] }}<span class="text-[#A9553F] font-semibold">{{ ph[1] }}</span>{{ ph[2] }}
              </li>
            </ul>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Si te has reconocido, no es que te pase algo malo. Es que hay una forma de vincularte, de protegerte o
              de sentir que necesita ser entendida.
            </p>
            <a
              href="#reservar"
              class="self-start bg-[#4A6B5D] hover:bg-[#3d594d] text-white font-semibold text-[15px] px-6 py-3.5 rounded-2xl transition-colors"
            >
              Reservar una sesión
            </a>
          </div>
          <div class="flex-[1_1_400px] min-w-0">
            <img
              src="/images/terapia/terapia-online-ansiedad-relaciones.webp"
              alt="Manos sosteniendo una taza caliente junto a una ventana con lluvia"
              loading="lazy"
              class="w-full aspect-[4/5] object-cover object-[40%_center] rounded-[28px]"
            />
          </div>
        </div>
      </section>

      <!-- PUEDO ACOMPAÑARTE EN -->
      <section class="bg-[#F3EFEA]">
        <div class="max-w-[960px] mx-auto px-5 sm:px-6 py-20 flex flex-col items-center gap-6 text-center">
          <h2 class="m-0 font-semibold text-4xl">Puedo acompañarte en</h2>
          <span aria-hidden="true" class="w-12 h-0.5 bg-[#C0674F]"></span>
          <p class="m-0 font-editorial text-[22px] leading-loose text-balance">
            <template v-for="(t, i) in topics" :key="t">
              <span class="whitespace-nowrap">{{ t }}</span>
              <span v-if="i < topics.length - 1" class="text-[#C0674F]" aria-hidden="true"> | </span>
            </template>
          </p>
        </div>
      </section>

      <!-- SERVICIOS -->
      <section id="servicios" class="scroll-mt-20">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-12">
          <div class="flex flex-col items-center gap-4 text-center">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl">Cómo te acompaño</h2>
            <span aria-hidden="true" class="w-12 h-0.5 bg-[#C0674F]"></span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article class="bg-white border border-[#EAE4DC] rounded-3xl px-8 py-10 flex flex-col items-center text-center gap-4">
              <span class="w-14 h-14 rounded-full bg-[#E6EFE9] flex items-center justify-center">
                <User class="w-6 h-6 text-[#4A6B5D]" :stroke-width="1.6" aria-hidden="true" />
              </span>
              <h3 class="m-0 font-semibold text-[28px]">Terapia individual</h3>
              <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/80">
                Para entender lo que se repite en tus relaciones, recuperar tu autoestima y aprender a calmarte desde
                dentro.
              </p>
              <p class="m-0 text-sm text-[#4A6B5D] font-semibold">60 € · 50–55 min</p>
              <a href="#reservar" class="mt-auto bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold text-sm px-5 py-3 rounded-2xl transition-colors">
                Reservar sesión
              </a>
            </article>

            <article class="bg-white border border-[#EAE4DC] rounded-3xl px-8 py-10 flex flex-col items-center text-center gap-4">
              <span class="w-14 h-14 rounded-full bg-[#FBE4DF] flex items-center justify-center">
                <Heart class="w-6 h-6 text-[#A9553F]" :stroke-width="1.6" aria-hidden="true" />
              </span>
              <h3 class="m-0 font-semibold text-[28px]">Terapia de pareja</h3>
              <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/80">
                Para parejas que se quieren pero se están alejando, discuten siempre por lo mismo o sienten que ya no
                se entienden.
              </p>
              <p class="m-0 text-sm leading-relaxed text-[#2C3E35]/75">
                Trabajamos la comunicación y los conflictos que se repiten, la infidelidad y la pérdida de confianza, la
                reconexión del vínculo y el bajo deseo sexual.
              </p>
              <p class="m-0 text-sm text-[#4A6B5D] font-semibold">70 € · 50–55 min</p>
              <a href="#reservar" class="mt-auto bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold text-sm px-5 py-3 rounded-2xl transition-colors">
                Reservar sesión
              </a>
            </article>

            <article class="bg-[#2C3E35] text-[#FAF8F5] rounded-3xl px-8 py-10 flex flex-col items-center text-center gap-4">
              <span class="w-14 h-14 rounded-full bg-[#FAF8F5]/12 flex items-center justify-center">
                <Feather class="w-6 h-6 text-[#FAF8F5]" :stroke-width="1.6" aria-hidden="true" />
              </span>
              <h3 class="m-0 font-semibold text-[28px]">Programa Vuelve a Ti</h3>
              <p class="m-0 text-[15px] leading-relaxed text-[#FAF8F5]/85">
                Si estás en plena ruptura: 10 semanas de acompañamiento estructurado para salir del bucle y
                reconstruirte.
              </p>
              <p class="m-0 text-sm text-[#F2B8A6] font-semibold">10 semanas · con valoración gratuita previa</p>
              <RouterLink
                to="/programa-vuelve-a-ti"
                class="mt-auto text-sm font-semibold text-[#FAF8F5] underline underline-offset-4 hover:text-white"
              >
                Conocer el programa
              </RouterLink>
            </article>
          </div>
        </div>
      </section>

      <!-- PROCESO -->
      <section class="bg-white border-y border-[#EAE4DC]">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-14">
          <div class="flex flex-col items-center gap-4 text-center">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1]">Un proceso online, cercano y a tu ritmo</h2>
            <span aria-hidden="true" class="w-12 h-0.5 bg-[#C0674F]"></span>
          </div>
          <ol class="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-3 gap-10">
            <li v-for="s in steps" :key="s.n" class="flex flex-col gap-3">
              <span class="font-editorial text-[56px] font-semibold text-[#C0674F] leading-none" aria-hidden="true">{{ s.n }}</span>
              <h3 class="m-0 !font-sans text-lg font-bold">{{ s.title }}</h3>
              <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/80">{{ s.text }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- OPINIONES DE GOOGLE -->
      <section class="bg-[#F3EFEA]">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-12">
          <div class="flex flex-col items-center gap-3.5 text-center">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1]">Opiniones en Google</h2>
            <div class="flex items-center gap-2.5 flex-wrap justify-center">
              <span class="font-editorial text-[34px] font-bold">5,0</span>
              <span role="img" aria-label="5 de 5 estrellas" class="flex gap-0.5">
                <Star v-for="n in 5" :key="n" class="w-5 h-5 text-[#C0674F] fill-[#C0674F]" aria-hidden="true" />
              </span>
              <span class="text-[15px] text-[#2C3E35]/80">· 7 opiniones</span>
            </div>
            <span aria-hidden="true" class="w-12 h-0.5 bg-[#C0674F]"></span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <figure v-for="(r, i) in reviews" :key="i" class="m-0 bg-white rounded-3xl p-8 flex flex-col gap-4">
              <blockquote class="m-0 font-editorial italic text-[23px] leading-[1.35]">
                <template v-for="(part, j) in r.parts" :key="j">
                  <span v-if="j % 2 === 1" class="text-[#A9553F] font-semibold">{{ part }}</span>
                  <template v-else>{{ part }}</template>
                </template>
              </blockquote>
              <figcaption class="mt-auto text-sm font-semibold">
                {{ r.author }} <span class="font-normal text-[#2C3E35]/70">· Google</span>
              </figcaption>
            </figure>
            <div class="border border-dashed border-[#C9BFB2] rounded-3xl p-8 flex flex-col justify-center items-start gap-4">
              <p class="m-0 font-editorial text-[26px] font-semibold leading-tight">Opiniones reales, de personas reales</p>
              <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/80">
                Todas están publicadas en mi perfil de Google, donde puedes leerlas completas.
              </p>
              <a
                href="https://share.google/TKMJ2Y12QY0ITKcHM"
                target="_blank"
                rel="noopener"
                class="bg-[#4A6B5D] hover:bg-[#3d594d] text-white font-semibold text-[15px] px-5 py-3.5 rounded-2xl transition-colors"
              >
                Ver opiniones en Google
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- PREGUNTAS FRECUENTES -->
      <section>
        <div class="max-w-[860px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-8">
          <h2 class="m-0 font-semibold text-4xl sm:text-5xl text-center">Preguntas frecuentes</h2>
          <div class="flex flex-col border-t border-[#E0D8CE]">
            <details
              v-for="(f, i) in faqs"
              :key="f.q"
              :open="i === 0"
              class="group border-b border-[#E0D8CE] py-5 px-1"
            >
              <summary class="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-lg font-semibold flex justify-between gap-4">
                {{ f.q }}
                <Plus class="w-5 h-5 shrink-0 text-[#A9553F] transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p class="mt-3 mb-0 text-base leading-[1.7] text-[#2C3E35]/85">{{ f.a }}</p>
            </details>
          </div>
        </div>
      </section>

      <!-- CTA FINAL -->
      <section class="px-5 sm:px-6 pb-20 sm:pb-26">
        <div class="max-w-[1200px] mx-auto bg-[#F3EFEA] rounded-[28px] overflow-hidden flex flex-wrap items-stretch">
          <div class="flex-[1_1_460px] min-w-0 px-8 sm:px-14 py-14 sm:py-16 flex flex-col justify-center gap-5">
            <h2 class="m-0 font-semibold text-4xl sm:text-[44px] leading-[1.1]">
              No hace falta que lo tengas todo claro para empezar.
            </h2>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Basta con que quieras entender lo que te pasa. Rellena el formulario y te escribo por WhatsApp en menos de 24 horas.
            </p>
            <a
              href="#reservar"
              class="self-start bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold px-7 py-4 rounded-2xl transition-colors"
            >
              Reservar sesión
            </a>
          </div>
          <div class="flex-[1_1_380px] min-w-0 min-h-[300px] sm:min-h-[360px]">
            <img
              src="/images/terapia/terapia-online-primer-paso.webp"
              alt="Camino entre olivos hacia el mar al atardecer"
              loading="lazy"
              class="w-full h-full min-h-[300px] sm:min-h-[360px] object-cover"
            />
          </div>
        </div>
      </section>

      <!-- FORMULARIO -->
      <section id="reservar" class="bg-[#F3EFEA] px-5 sm:px-6 py-20 sm:py-26 scroll-mt-20">
        <div class="max-w-[1200px] mx-auto flex flex-wrap gap-12 lg:gap-14 items-start">
          <div class="flex-[1_1_340px] min-w-0 flex flex-col gap-5">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1]">Reserva tu sesión</h2>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Cuéntame un poco sobre ti y lo que te trae. Leo cada mensaje personalmente y te escribo por WhatsApp
              <strong class="text-[#2C3E35]">en menos de 24 horas</strong>.
            </p>
            <ul class="m-0 p-0 list-none flex flex-col gap-3 text-[15px] text-[#2C3E35]/85">
              <li class="flex gap-2.5 items-center"><Check class="w-[18px] h-[18px] text-[#D9826C] shrink-0" aria-hidden="true" />Sesiones 100% online por Google Meet</li>
              <li class="flex gap-2.5 items-center"><Check class="w-[18px] h-[18px] text-[#D9826C] shrink-0" aria-hidden="true" />Individual 60 € · Pareja 70 € · 50–55 min</li>
              <li class="flex gap-2.5 items-center"><Check class="w-[18px] h-[18px] text-[#D9826C] shrink-0" aria-hidden="true" />En castellano o en catalán</li>
              <li class="flex gap-2.5 items-center"><Check class="w-[18px] h-[18px] text-[#D9826C] shrink-0" aria-hidden="true" />Todo lo que escribas es confidencial</li>
            </ul>
          </div>

          <div
            v-if="submitted"
            class="flex-[999_1_560px] min-w-0 bg-white rounded-[28px] p-8 sm:p-12 flex flex-col gap-4"
            role="status"
          >
            <span class="w-14 h-14 rounded-full bg-[#E6EFE9] flex items-center justify-center">
              <Check class="w-7 h-7 text-[#4A6B5D]" aria-hidden="true" />
            </span>
            <h3 class="m-0 font-semibold text-3xl">Gracias, he recibido tu solicitud</h3>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Te escribiré por WhatsApp en menos de 24 horas para concretar tu primera sesión.
            </p>
            <button
              type="button"
              class="self-start text-sm font-semibold text-[#4A6B5D] underline underline-offset-4 cursor-pointer"
              @click="submitted = false"
            >
              Enviar otra solicitud
            </button>
          </div>

          <form
            v-else
            class="flex-[999_1_560px] min-w-0 bg-white rounded-[28px] p-6 sm:p-12 flex flex-col gap-7"
            @submit.prevent="submitForm"
          >
            <fieldset class="border-0 m-0 p-0 flex flex-col gap-4">
              <legend class="font-editorial text-[26px] font-semibold mb-2">Tus datos</legend>
              <label class="flex flex-col gap-1.5 text-sm font-semibold">
                Nombre y apellidos *
                <input v-model="form.name" type="text" name="nombre" required autocomplete="name" maxlength="120" class="therapy-input" />
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label class="flex flex-col gap-1.5 text-sm font-semibold">
                  Email *
                  <input v-model="form.email" type="email" name="email" required autocomplete="email" maxlength="150" class="therapy-input" />
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-semibold">
                  Teléfono *
                  <input v-model="form.phone" type="tel" name="telefono" required autocomplete="tel" placeholder="+34" maxlength="50" class="therapy-input" />
                </label>
              </div>
            </fieldset>

            <label class="flex items-start gap-2.5 text-sm leading-normal text-[#2C3E35]/85">
              <input v-model="form.online_confirmed" type="checkbox" name="modalidad" required class="accent-[#A9553F] mt-0.5" />
              <span>Entiendo que las sesiones son <strong class="text-[#A9553F]">100% online</strong> por Google Meet (no hay terapia presencial). *</span>
            </label>

            <fieldset class="border-0 m-0 p-0 flex flex-col gap-3">
              <legend class="text-sm font-semibold mb-2.5">Tipo de terapia *</legend>
              <div class="flex flex-wrap gap-2.5">
                <label class="therapy-chip">
                  <input v-model="form.therapy_type" type="radio" name="servicio" value="individual" required class="accent-[#A9553F]" />
                  Individual (60 €)
                </label>
                <label class="therapy-chip">
                  <input v-model="form.therapy_type" type="radio" name="servicio" value="pareja" class="accent-[#A9553F]" />
                  De pareja (70 €)
                </label>
              </div>
            </fieldset>

            <label class="flex flex-col gap-1.5 text-sm font-semibold">
              ¿Qué te trae a terapia? *
              <span class="font-normal text-[13px] text-[#2C3E35]/75">
                Unas líneas son suficientes. Lo hablaremos con calma en la primera sesión.
              </span>
              <textarea v-model="form.reason" name="motivo" rows="4" maxlength="500" required class="therapy-input resize-y"></textarea>
              <span class="self-end font-normal text-xs text-[#2C3E35]/60">{{ form.reason.length }}/500</span>
            </label>

            <fieldset class="border-0 m-0 p-0 flex flex-col gap-3">
              <legend class="text-sm font-semibold mb-1">¿Qué horario te va mejor? *</legend>
              <p class="m-0 text-[13px] text-[#2C3E35]/75">Puedes marcar varios. Hora peninsular española.</p>
              <div class="flex flex-wrap gap-2.5">
                <label v-for="opt in scheduleOptions" :key="opt.value" class="therapy-chip">
                  <input v-model="form.schedules" type="checkbox" name="horario" :value="opt.value" class="accent-[#A9553F]" />
                  {{ opt.label }}
                </label>
              </div>
              <input
                v-model="form.schedule_other"
                type="text"
                name="horario_otro"
                aria-label="Otro horario"
                placeholder="¿Otro horario? Escríbelo aquí"
                maxlength="120"
                class="therapy-input text-[15px]"
              />
            </fieldset>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label class="flex flex-col gap-1.5 text-sm font-semibold">
                Idioma de las sesiones
                <select v-model="form.language" name="idioma" class="therapy-input">
                  <option>Castellano</option>
                  <option>Catalán</option>
                </select>
              </label>
              <label class="flex flex-col gap-1.5 text-sm font-semibold">
                ¿Cómo me has conocido?
                <select v-model="form.source" name="origen" class="therapy-input">
                  <option value="">Elige una opción</option>
                  <option>Instagram</option>
                  <option>Google</option>
                  <option>Me lo recomendó alguien</option>
                  <option>Me derivó otra profesional</option>
                  <option>Otro</option>
                </select>
              </label>
            </div>

            <label class="flex flex-col gap-1.5 text-sm font-semibold">
              ¿Quieres preguntarme algo?
              <textarea v-model="form.questions" name="preguntas" rows="3" maxlength="500" class="therapy-input resize-y"></textarea>
            </label>

            <div class="flex flex-col gap-3 pt-2 border-t border-[#2C3E35]/10">
              <p class="mt-3 mb-0 text-xs leading-relaxed text-[#2C3E35]/75">
                <strong>Protección de datos.</strong> Responsable: Carla Viladot (NIF 49255948E). Finalidad: contactar
                contigo y gestionar la atención psicológica que solicitas. Tus datos no se cederán a terceros salvo
                obligación legal. Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición,
                limitación y portabilidad escribiendo a
                <a href="mailto:cviladotpsicologa@gmail.com" class="text-[#4A6B5D] underline">cviladotpsicologa@gmail.com</a>.
                Más información en la
                <RouterLink to="/privacidad" class="text-[#4A6B5D] underline">política de privacidad</RouterLink>.
              </p>
              <label class="flex items-start gap-2.5 text-sm leading-normal">
                <input v-model="form.privacy_accepted" type="checkbox" name="privacidad" required class="accent-[#A9553F] mt-1" />
                He leído la información sobre protección de datos y consiento el tratamiento de mis datos, incluidos los
                de salud, para gestionar mi solicitud. *
              </label>
              <label class="flex items-start gap-2.5 text-sm leading-normal">
                <input v-model="form.wants_news" type="checkbox" name="novedades" class="accent-[#A9553F] mt-1" />
                Quiero recibir de vez en cuando novedades y recursos gratuitos. Me puedo dar de baja cuando quiera.
              </label>
            </div>

            <p v-if="formError" role="alert" class="m-0 text-sm font-medium text-[#9A3B28] bg-[#FBE4DF] rounded-xl px-4 py-3">
              {{ formError }}
            </p>

            <button
              type="submit"
              :disabled="submitting"
              class="self-start inline-flex items-center gap-2 font-semibold text-base bg-[#A9553F] hover:bg-[#8f4533] disabled:opacity-60 text-white px-8 py-4 rounded-2xl cursor-pointer transition-colors"
            >
              <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" aria-hidden="true" />
              {{ submitting ? 'Enviando…' : 'Enviar solicitud' }}
            </button>
          </form>
        </div>
      </section>
    </main>

    <!-- PIE -->
    <SiteFooter />
  </div>
</template>

<style scoped>
@reference "../assets/css/main.css";

.therapy-input {
  @apply font-sans font-normal text-base px-4 py-3.5 border border-[#2C3E35]/20 rounded-xl bg-[#FAF8F5] text-[#2C3E35] focus:outline-none focus:border-[#4A6B5D] focus:ring-2 focus:ring-[#4A6B5D]/15;
}

.therapy-chip {
  @apply flex items-center gap-2.5 px-4.5 py-3 border border-[#2C3E35]/20 rounded-full text-[15px] font-normal cursor-pointer has-[:checked]:border-[#A9553F] has-[:checked]:bg-[#FBE4DF]/50;
}
</style>
