<script setup>
import { RouterLink } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'

const steps = [
  { n: '01', title: 'Calmar el cuerpo', text: 'Primero ayudamos a tu sistema nervioso a salir del estado de alerta, para que la ansiedad baje y puedas pensar con más claridad.' },
  { n: '02', title: 'Ir a la raíz', text: 'Exploramos tu historia, tu forma de vincularte (apego) y las partes de ti que intentan protegerte (IFS). Cuando hace falta, uso EMDR.' },
  { n: '03', title: 'Construir algo nuevo', text: 'Llevamos lo trabajado a tu día a día: límites, autoestima y nuevas formas de relacionarte que se mantengan en el tiempo.' },
]

const training = [
  'Máster en Psicología General Sanitaria',
  'Trauma y apego: EMDR Nivel II',
  'IFS (Sistemas de Familia Interna)',
  'Terapia sistémica y de pareja',
  'Autoestima y dependencia emocional',
]
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35]">
    <SiteHeader />

    <main>
      <!-- PRESENTACIÓN -->
      <section class="bg-[#F3EFEA]">
        <div class="max-w-[1160px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-wrap gap-14 items-center">
          <div class="cv-hero flex-[1_1_480px] min-w-0 flex flex-col gap-[22px]">
            <h1 class="m-0 self-start !font-sans text-xs tracking-[0.12em] uppercase font-semibold text-[#4A6B5D] border border-[#4A6B5D]/35 px-3.5 py-2 rounded-full">
              Sobre mí · Carla Viladot, psicóloga sanitaria
            </h1>
            <p class="m-0 font-editorial font-semibold text-[44px] sm:text-[60px] leading-[1.05] tracking-tight">
              Hola, soy Carla. <em class="text-[#A9553F]">Encantada de conocerte.</em>
            </p>
            <p class="m-0 text-lg leading-[1.7] text-[#2C3E35]/85">
              Soy psicóloga general sanitaria y acompaño a personas y parejas en terapia online desde cualquier lugar de
              España, en castellano o en catalán.
            </p>
            <p class="m-0 text-lg leading-[1.7] text-[#2C3E35]/85">
              Trabajo sobre todo con rupturas de pareja, ansiedad, autoestima, dependencia emocional y terapia de pareja. Con personas que
              sienten que algo se repite en su forma de querer: que acaban siempre en el mismo tipo de relación, que se
              pierden en el otro o que no saben poner límites sin sentirse culpables.
            </p>
            <p class="m-0 text-lg leading-[1.7] text-[#2C3E35]/85">
              Mi forma de trabajar es integradora y está basada en el apego y el trauma. No nos quedamos solo en lo que
              piensas: miramos también lo que siente tu cuerpo, de dónde viene lo que te pasa y cómo sanarlo desde la raíz.
              Para eso uso herramientas como IFS y EMDR, siempre adaptadas a ti y a tu ritmo.
            </p>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in ['Colegiada COPC 29332', 'Castellano y catalán', '100% online']" :key="tag" class="text-[13px] font-semibold px-3.5 py-2 rounded-full bg-white">{{ tag }}</span>
            </div>
          </div>
          <div class="flex-[0_1_380px] min-w-0 mx-auto">
            <img
              src="/images/terapia/carla-viladot-psicologa-terapia-online.webp"
              alt="Carla Viladot, psicóloga general sanitaria"
              width="746"
              height="1024"
              class="w-full aspect-[4/5] object-cover object-[center_25%] rounded-[28px]"
              fetchpriority="high"
            />
          </div>
        </div>
      </section>

      <!-- POR QUÉ HAGO LO QUE HAGO -->
      <section>
        <div v-reveal class="max-w-[820px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-[22px]">
          <span class="text-xs tracking-[0.14em] uppercase font-semibold text-[#A9553F]">Por qué hago lo que hago</span>
          <h2 class="m-0 font-semibold text-4xl sm:text-[46px] leading-[1.1]">Lo que nos duele hoy casi siempre tiene una historia detrás</h2>
          <p class="m-0 text-lg leading-[1.75] text-[#2C3E35]/85">
            Yo también he estado al otro lado. Sé lo que es llegar a una primera sesión sin saber muy bien por dónde
            empezar, y sé también lo mucho que puede cambiar tu vida cuando alguien te acompaña de verdad.
          </p>
          <p class="m-0 text-lg leading-[1.75] text-[#2C3E35]/85">
            Muchas de las personas que llegan a consulta sienten que algo se repite: el miedo a que les dejen, la necesidad de
            cuidar o agradar, la ansiedad que no para o las relaciones que siempre acaban igual. Y casi siempre se culpan por
            ello.
          </p>
          <p class="m-0 text-lg leading-[1.75] text-[#2C3E35]/85">
            Yo no creo que haya nada malo en ti. Creo que aprendiste a protegerte como pudiste, con los recursos que tenías en
            aquel momento, y que esas formas de protegerte hoy ya no te protegen: te hacen daño. Mi trabajo es ayudarte a
            entenderlas y a construir otras más sanas, para que puedas relacionarte desde la calma y la seguridad.
          </p>
          <p class="mt-2 mb-0 font-editorial italic font-semibold text-[32px] leading-[1.25]">
            Mereces relaciones <span class="text-[#A9553F]">que no duelan así.</span>
          </p>
        </div>
      </section>

      <!-- CÓMO TRABAJO -->
      <section class="bg-white border-y border-[#EAE4DC]">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-col gap-14">
          <div class="flex flex-col items-center gap-4 text-center">
            <h2 class="m-0 font-semibold text-4xl sm:text-5xl leading-[1.1]">Cómo trabajo</h2>
            <p class="m-0 text-[17px] leading-relaxed text-[#2C3E35]/80 max-w-[620px]">
              Un enfoque integrador e informado en trauma: no solo hablamos de lo que te pasa, también lo trabajamos desde el cuerpo y desde la raíz.
            </p>
            <span aria-hidden="true" class="w-12 h-0.5 bg-[#C0674F]"></span>
          </div>
          <ol class="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-3 gap-10">
            <li v-for="s in steps" :key="s.n" v-reveal class="flex flex-col gap-3">
              <span class="font-editorial text-[56px] font-semibold text-[#C0674F] leading-none" aria-hidden="true">{{ s.n }}</span>
              <h3 class="m-0 text-[28px] font-semibold">{{ s.title }}</h3>
              <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/80">{{ s.text }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- FORMACIÓN Y EXPERIENCIA -->
      <section>
        <div class="max-w-[1100px] mx-auto px-5 sm:px-6 py-20 sm:py-26 flex flex-wrap gap-12 lg:gap-16 items-center">
          <div class="flex-[1_1_380px] min-w-0 flex flex-col gap-5">
            <h2 class="m-0 font-semibold text-4xl sm:text-[44px] leading-[1.1]">Formación y experiencia</h2>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Me he formado específicamente en los enfoques con los que trabajo, y sigo formándome y supervisando mis
              casos de forma continuada.
            </p>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">
              Hace años que acompaño a personas a construir relaciones más sanas consigo mismas y con los demás.
            </p>
            <span class="self-start text-[13px] font-semibold px-3.5 py-2 rounded-full bg-[#E6EFE9] text-[#2C3E35]">
              Psicóloga General Sanitaria · Colegiada COPC 29332
            </span>
          </div>
          <div v-reveal class="flex-[1_1_440px] min-w-0 bg-white border border-[#EAE4DC] rounded-3xl p-8 flex flex-col gap-6">
            <ul class="m-0 p-0 list-none flex flex-col gap-4">
              <li v-for="t in training" :key="t" class="flex items-start gap-3 text-base leading-snug font-medium">
                <span aria-hidden="true" class="w-2.5 h-2.5 rounded-full bg-[#D9826C] shrink-0 mt-[7px]"></span>{{ t }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- EMPEZAR -->
      <section class="px-5 sm:px-6 pb-20 sm:pb-26">
        <div class="max-w-[1200px] mx-auto bg-[#F3EFEA] rounded-[28px] px-8 sm:px-12 py-16 flex flex-col items-center text-center gap-[18px]">
          <h2 class="m-0 font-semibold text-4xl sm:text-[44px] leading-[1.1]">¿Empezamos?</h2>
          <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85 max-w-[560px]">
            Si estás atravesando una ruptura, el programa Vuelve a Ti te acompaña paso a paso. Si lo que
            buscas es trabajar la ansiedad, la autoestima o tu relación de pareja, la terapia online es tu sitio.
          </p>
          <div class="flex flex-wrap justify-center gap-3 pt-2">
            <RouterLink to="/programa-vuelve-a-ti" class="bg-[#2C3E35] hover:bg-[#1f2c25] text-white font-semibold text-[15px] px-6 py-3.5 rounded-2xl transition-colors">Programa Vuelve a Ti</RouterLink>
            <RouterLink to="/terapia-online" class="bg-[#A9553F] hover:bg-[#8f4533] text-white font-semibold text-[15px] px-6 py-3.5 rounded-2xl transition-colors">Terapia individual y de pareja</RouterLink>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
