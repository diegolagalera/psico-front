<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Star, ArrowRight } from 'lucide-vue-next'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import api from '@/services/api'

const router = useRouter()
const config = useRuntimeConfig()

// Tramos de cada reseña: los impares van resaltados
const reviews = [
  {
    parts: ['«Una profesional excepcional, tanto por su preparación como por su ', 'calidad humana', '. Destaca por su capacidad para ', 'escuchar sin juzgar', '.»'],
    author: 'M.',
  },
  {
    parts: ['«Carla ', 'me ha ayudado mucho en momentos difíciles', ' para mí. Muy buena profesional, siempre amable y empática, ', 'una gran terapeuta', '.»'],
    author: 'J.',
  },
  {
    parts: ['«Valoro mucho la ', 'cercanía', ' con la que te trata en consulta y su ', 'profesionalidad', '. ¡No me puedo sentir en ', 'mejores manos', '!»'],
    author: 'J.',
  },
]

// ---- Adelanto de recursos (se pinta en el servidor: Google ve los enlaces) ----
const fallbackCovers = ['/images/web/ruptura-de-pareja-autoestima.webp', '/images/web/ansiedad-ganas-de-escribirle.webp']

const { data: resourcesData } = await useAsyncData('home-resources', async () => {
  try {
    const { data } = await api.get('/resources')
    return (data.resources || []).slice(0, 3)
  } catch {
    return []
  }
})

// URL pública y estable de la portada de cada recurso (no caduca, a diferencia
// de los enlaces firmados de R2)
const publicApiBase = computed(() => {
  const configured = (config.public.apiBase || '').replace(/\/+$/, '')
  if (configured) return configured
  return import.meta.dev ? 'http://localhost:5001/api' : 'https://api.carlaviladotpsicologia.com/api'
})

const featuredResources = computed(() =>
  (resourcesData.value || []).map((r, i) => ({
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle || r.teaser_text || '',
    badge: [r.category, r.read_time_minutes ? `${r.read_time_minutes} min` : ''].filter(Boolean).join(' · '),
    cover: r.cover_image_url || r.cover_object_key
      ? `${publicApiBase.value}/og/resources/${encodeURIComponent(r.slug)}/cover.jpg`
      : fallbackCovers[i % fallbackCovers.length],
  }))
)

// Enlaces antiguos de la portada de una sola página (/#el-programa…) → páginas nuevas
const LEGACY_ANCHORS = {
  '#el-programa': '/programa-vuelve-a-ti',
  '#sobre-mi': '/sobre-mi',
  '#contacto': '/contacto',
}
onMounted(() => {
  const target = LEGACY_ANCHORS[window.location.hash]
  if (target) router.replace(target)
})
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35]">
    <SiteHeader />

    <main>
      <!-- PORTADA -->
      <section class="relative overflow-hidden bg-[#2C3E35]">
        <img
          src="/images/terapia/terapia-online-primer-paso.webp"
          alt=""
          aria-hidden="true"
          class="cv-zoom absolute inset-0 w-full h-full object-cover"
          fetchpriority="high"
        />
        <div aria-hidden="true" class="absolute inset-0 bg-[linear-gradient(90deg,rgba(44,62,53,0.94)_0%,rgba(44,62,53,0.8)_50%,rgba(44,62,53,0.4)_100%)]"></div>
        <div class="cv-hero relative max-w-[1200px] mx-auto px-5 sm:px-6 pt-28 pb-32 sm:pt-[150px] sm:pb-40 flex flex-col gap-6">
          <h1 class="m-0 self-start !font-sans font-semibold text-xs tracking-[0.12em] uppercase text-[#E6EFE9] border border-[#E6EFE9]/35 px-3.5 py-2 rounded-full">
            Psicóloga online · Rupturas, ansiedad y relaciones
          </h1>
          <p class="m-0 max-w-[760px] font-editorial font-semibold text-[38px] sm:text-[56px] leading-[1.08] tracking-tight text-[#FAF8F5]">
            Tus relaciones también pueden ser un lugar seguro.
            <em class="block mt-2 text-[#F2B8A6] font-semibold">Empezando por la que tienes contigo.</em>
          </p>
          <p class="m-0 text-lg leading-relaxed text-[#FAF8F5]/90 max-w-[580px]">
            Soy Carla Viladot, psicóloga sanitaria. Te acompaño online si estás atravesando una ruptura, vives con
            ansiedad o sientes que tus relaciones siempre acaban igual.
          </p>
          <div class="flex flex-wrap gap-3 pt-2">
            <RouterLink
              to="/programa-vuelve-a-ti"
              class="bg-[#FAF8F5] hover:bg-white text-[#2C3E35] font-semibold px-7 py-4 rounded-2xl transition-colors"
            >Estoy pasando una ruptura</RouterLink>
            <RouterLink
              to="/terapia-online"
              class="bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold px-7 py-4 rounded-2xl transition-colors"
            >Quiero empezar terapia</RouterLink>
          </div>
          <p class="mt-2 mb-0 text-[13px] text-[#FAF8F5]/75">Col. 29332 · 100% online para toda España · Castellano y catalán</p>
        </div>
      </section>

      <!-- DOS CAMINOS -->
      <section>
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-12">
          <div class="flex flex-col items-center gap-4 text-center">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1]">¿Cómo puedo acompañarte?</h2>
            <span aria-hidden="true" class="w-12 h-0.5 bg-[#C0674F]"></span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-7">
            <article v-reveal class="cv-card bg-white border border-[#EAE4DC] rounded-[28px] overflow-hidden flex flex-col">
              <img
                src="/images/terapia/terapia-online-ansiedad-relaciones.webp"
                alt="Manos sosteniendo una taza junto a una ventana con lluvia"
                loading="lazy"
                class="w-full aspect-video object-cover"
              />
              <div class="p-8 sm:p-9 flex flex-col gap-3.5 grow">
                <span class="text-xs tracking-[0.1em] uppercase font-bold text-[#4A6B5D]">Si estás pasando una ruptura</span>
                <h3 class="m-0 font-semibold text-[34px] leading-[1.15]">Programa Vuelve a Ti</h3>
                <p class="m-0 text-base leading-relaxed text-[#2C3E35]/80">
                  10 semanas de acompañamiento para salir del bucle, calmar la ansiedad y reconstruirte después de una ruptura.
                </p>
                <p class="m-0 text-sm font-semibold text-[#4A6B5D]">Con valoración gratuita previa</p>
                <RouterLink
                  to="/programa-vuelve-a-ti"
                  class="mt-auto self-start bg-[#2C3E35] hover:bg-[#1f2c25] text-white font-semibold text-[15px] px-6 py-3.5 rounded-2xl transition-colors"
                >Conocer el programa</RouterLink>
              </div>
            </article>

            <article v-reveal class="cv-card bg-white border border-[#EAE4DC] rounded-[28px] overflow-hidden flex flex-col">
              <img
                src="/images/terapia/terapia-online-psicologa-hero.webp"
                alt="Sillón con manta verde junto a una ventana con luz de tarde"
                loading="lazy"
                class="w-full aspect-video object-cover"
              />
              <div class="p-8 sm:p-9 flex flex-col gap-3.5 grow">
                <span class="text-xs tracking-[0.1em] uppercase font-bold text-[#4A6B5D]">Si quieres empezar terapia</span>
                <h3 class="m-0 font-semibold text-[34px] leading-[1.15]">Terapia individual y de pareja</h3>
                <p class="m-0 text-base leading-relaxed text-[#2C3E35]/80">
                  Para la ansiedad, la autoestima, el apego, la dependencia emocional y las relaciones que duelen.
                </p>
                <p class="m-0 text-sm font-semibold text-[#4A6B5D]">Individual 60 € · Pareja 70 € · 50–55 min</p>
                <RouterLink
                  to="/terapia-online"
                  class="mt-auto self-start bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold text-[15px] px-6 py-3.5 rounded-2xl transition-colors"
                >Ver terapia online</RouterLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- SOBRE MÍ (RESUMEN) -->
      <section class="border-t border-[#EAE4DC]">
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
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1]">Soy Carla Viladot,</h2>
            <p class="m-0 text-[13px] tracking-[0.1em] uppercase text-[#4A6B5D] font-semibold">Psicóloga General Sanitaria · Col. 29332</p>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Acompaño a personas que sienten que algo se repite en su forma de querer y de quererse. Trabajo desde el
              cuerpo, el apego y las partes de ti que intentan protegerte, para ir a la raíz de lo que duele.
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in ['Enfoque integrador', 'Informada en trauma', 'EMDR', 'IFS']" :key="tag" class="text-[13px] font-semibold px-3.5 py-2 rounded-full bg-[#E6EFE9]">{{ tag }}</span>
            </div>
            <RouterLink to="/sobre-mi" class="self-start text-[15px] font-semibold text-[#4A6B5D] flex items-center gap-2 hover:text-[#2C3E35]">
              Conocer más sobre mí <ArrowRight class="w-4 h-4" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- OPINIONES -->
      <section class="bg-[#F3EFEA]">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-11">
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
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <figure v-for="(r, i) in reviews" :key="i" v-reveal class="m-0 bg-white rounded-3xl p-8 flex flex-col gap-4">
              <blockquote class="m-0 font-editorial italic text-[23px] leading-[1.35]">
                <template v-for="(part, j) in r.parts" :key="j">
                  <span v-if="j % 2 === 1" class="text-[#A9553F] font-semibold">{{ part }}</span>
                  <template v-else>{{ part }}</template>
                </template>
              </blockquote>
              <figcaption class="mt-auto text-sm font-semibold">{{ r.author }} <span class="font-normal text-[#2C3E35]/70">· Google</span></figcaption>
            </figure>
          </div>
          <a
            href="https://share.google/TKMJ2Y12QY0ITKcHM"
            target="_blank"
            rel="noopener"
            class="self-center bg-[#4A6B5D] hover:bg-[#3d594d] text-white font-semibold text-[15px] px-6 py-3.5 rounded-2xl transition-colors"
          >Ver todas las opiniones en Google</a>
        </div>
      </section>

      <!-- RECURSOS GRATUITOS -->
      <section v-if="featuredResources.length">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-28 flex flex-col gap-12">
          <div class="flex flex-wrap justify-between items-end gap-6">
            <div class="flex flex-col gap-3 max-w-[640px]">
              <span class="text-xs tracking-[0.14em] uppercase font-semibold text-[#4A6B5D]">Recursos gratuitos</span>
              <h2 class="m-0 font-semibold text-4xl sm:text-[52px] leading-[1.05]">Empieza a cuidarte <em class="text-[#A9553F]">hoy mismo</em></h2>
              <p class="m-0 text-[17px] leading-relaxed text-[#2C3E35]/80">Herramientas para entender lo que te pasa y darte un respiro, estés donde estés.</p>
            </div>
            <RouterLink to="/recursos" class="font-semibold text-[15px] px-6 py-3.5 rounded-2xl border border-[#2C3E35]/30 hover:bg-[#2C3E35]/5 transition-colors">
              Ver todos los recursos
            </RouterLink>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-7" :class="featuredResources.length > 2 ? 'lg:grid-cols-3' : ''">
            <RouterLink
              v-for="res in featuredResources"
              :key="res.slug"
              v-reveal
              :to="`/recursos/${res.slug}`"
              class="cv-card bg-white rounded-[28px] overflow-hidden flex flex-col shadow-[0_10px_30px_rgba(44,62,53,0.08)]"
            >
              <span class="relative block">
                <img :src="res.cover" :alt="res.title" loading="lazy" class="w-full aspect-[16/10] object-cover" />
                <span v-if="res.badge" class="absolute top-[18px] left-[18px] bg-[#FAF8F5] text-[#A9553F] text-xs font-bold tracking-[0.08em] uppercase px-3 py-2 rounded-full">{{ res.badge }}</span>
              </span>
              <span class="p-8 flex flex-col gap-3 grow">
                <span class="font-editorial text-[30px] font-semibold leading-[1.15]">{{ res.title }}</span>
                <span v-if="res.subtitle" class="text-[15px] leading-relaxed text-[#2C3E35]/80">{{ res.subtitle }}</span>
                <span class="mt-auto pt-2 flex items-center gap-2 text-[15px] font-semibold text-[#A9553F]">
                  Ver el recurso gratis <ArrowRight class="w-4 h-4" aria-hidden="true" />
                </span>
              </span>
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
