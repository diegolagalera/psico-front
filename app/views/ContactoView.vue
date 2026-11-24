<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Mail, MessageCircle, Monitor, Check, Loader2, ArrowRight } from 'lucide-vue-next'
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from '@/constants/contact'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import MotionCircles from '@/components/motion/MotionCircles.vue'
import api from '@/services/api'
import { toast } from '@/composables/useToast'

const emptyForm = () => ({ name: '', email: '', phone: '', message: '', privacy_accepted: false })
const form = reactive(emptyForm())
const submitting = ref(false)
const submitted = ref(false)
const formError = ref('')

async function submitForm() {
  formError.value = ''
  if (!form.privacy_accepted) {
    formError.value = 'Necesito tu consentimiento para poder responder a tu consulta.'
    return
  }
  submitting.value = true
  try {
    await api.post('/contact', {
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: `[Consulta desde /contacto]\n\n${form.message.trim()}`,
    })
    submitted.value = true
    Object.assign(form, emptyForm())
    toast.success('He recibido tu mensaje. Te respondo en menos de 24 horas.', { title: 'Mensaje enviado' })
  } catch (err) {
    formError.value =
      err.response?.data?.error ||
      'No se ha podido enviar el mensaje. Inténtalo de nuevo o escríbeme a cviladotpsicologa@gmail.com.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35]">
    <SiteHeader cta-to="#formulario" />

    <main>
      <!-- PRESENTACIÓN -->
      <section class="bg-[#F3EFEA]">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-24 flex flex-wrap items-center gap-14">
          <div class="cv-hero flex-[1_1_520px] min-w-0 flex flex-col gap-[22px]">
            <h1 class="m-0 self-start !font-sans text-xs tracking-[0.12em] uppercase font-semibold text-[#4A6B5D] border border-[#4A6B5D]/35 px-3.5 py-2 rounded-full">
              Contacto · Pide tu primera sesión con una psicóloga online
            </h1>
            <p class="m-0 font-editorial font-semibold text-[42px] sm:text-[58px] leading-[1.05] tracking-tight">
              Escríbeme, <em class="text-[#A9553F]">aunque no sepas por dónde empezar.</em>
            </p>
            <p class="m-0 text-lg leading-[1.7] text-[#2C3E35]/85 max-w-[560px]">
              Leo personalmente cada mensaje y te respondo en menos de 24 horas. No necesitas tenerlo todo claro: cuéntame un
              poco qué estás viviendo y lo vemos con calma.
            </p>
          </div>
          <div class="flex-[0_1_380px] min-w-0 mx-auto w-full max-w-[380px]">
            <div class="aspect-square rounded-[36px] bg-[#FAF8F5] flex items-center justify-center p-6">
              <MotionCircles halo="#E6EFE9" label="Dos círculos que se acercan: el primer contacto" />
            </div>
          </div>
        </div>
      </section>

      <!-- ¿QUÉ NECESITAS AHORA? -->
      <section>
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 pt-20 sm:pt-24 pb-10 flex flex-col gap-10">
          <div class="flex flex-col items-center gap-3.5 text-center">
            <h2 class="m-0 font-semibold text-4xl sm:text-[46px] leading-[1.1]">¿Qué necesitas ahora?</h2>
            <p class="m-0 text-[17px] text-[#2C3E35]/80">Elige el camino que mejor encaja contigo. Si dudas, escríbeme abajo y te oriento.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RouterLink v-reveal to="/programa-vuelve-a-ti#valoracion" class="cv-card text-[#FAF8F5] bg-[#2C3E35] rounded-[28px] p-9 flex flex-col gap-3.5">
              <span class="text-xs tracking-[0.12em] uppercase font-bold text-[#F2B8A6]">Estoy en plena ruptura</span>
              <span class="font-editorial text-[32px] font-semibold leading-[1.15]">Valoración gratuita del programa Vuelve a Ti</span>
              <span class="text-[15px] leading-relaxed text-[#FAF8F5]/85">Cuestionario de 5 minutos y una llamada de 30 minutos para ver si el programa es para ti.</span>
              <span class="mt-auto pt-2 text-[15px] font-semibold text-[#F2B8A6] flex items-center gap-2">Reservar valoración <ArrowRight class="w-4 h-4" aria-hidden="true" /></span>
            </RouterLink>
            <RouterLink v-reveal to="/terapia-online#reservar" class="cv-card text-[#2C3E35] bg-white border border-[#EAE4DC] rounded-[28px] p-9 flex flex-col gap-3.5">
              <span class="text-xs tracking-[0.12em] uppercase font-bold text-[#4A6B5D]">Quiero empezar terapia</span>
              <span class="font-editorial text-[32px] font-semibold leading-[1.15]">Terapia individual o de pareja</span>
              <span class="text-[15px] leading-relaxed text-[#2C3E35]/80">Individual 60 € · Pareja 70 € · Sesiones de 50–55 minutos por Google Meet.</span>
              <span class="mt-auto pt-2 text-[15px] font-semibold text-[#A9553F] flex items-center gap-2">Pedir primera sesión <ArrowRight class="w-4 h-4" aria-hidden="true" /></span>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- DUDAS: DATOS + FORMULARIO -->
      <section id="formulario">
        <div class="max-w-[1200px] mx-auto px-5 sm:px-6 pt-14 pb-20 sm:pb-26 flex flex-wrap gap-12 items-start">
          <div class="flex-[1_1_320px] min-w-0 flex flex-col gap-[22px]">
            <h2 class="m-0 font-semibold text-4xl sm:text-[40px] leading-[1.1]">¿Tienes dudas? Escríbeme</h2>
            <p class="m-0 text-[15px] leading-relaxed text-[#2C3E35]/80">
              La forma más rápida es por WhatsApp. Si lo prefieres, también puedes usar el formulario o escribirme un email.
            </p>
            <a
              :href="WHATSAPP_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="self-start inline-flex items-center gap-2.5 font-semibold text-base bg-[#4A6B5D] hover:bg-[#3d594d] text-white px-6 py-3.5 rounded-2xl transition-colors"
            >
              <MessageCircle class="w-5 h-5" :stroke-width="1.8" aria-hidden="true" />
              Escríbeme por WhatsApp
            </a>
            <div class="flex flex-col gap-4 text-[15px]">
              <a :href="WHATSAPP_URL" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 hover:text-[#4A6B5D]">
                <span class="w-11 h-11 rounded-[14px] bg-[#E6EFE9] flex items-center justify-center"><MessageCircle class="w-5 h-5 text-[#4A6B5D]" :stroke-width="1.7" aria-hidden="true" /></span>
                {{ WHATSAPP_DISPLAY }}
              </a>
              <a href="mailto:cviladotpsicologa@gmail.com" class="flex items-center gap-3 hover:text-[#4A6B5D]">
                <span class="w-11 h-11 rounded-[14px] bg-[#FBE4DF] flex items-center justify-center"><Mail class="w-5 h-5 text-[#A9553F]" :stroke-width="1.7" aria-hidden="true" /></span>
                cviladotpsicologa@gmail.com
              </a>
              <span class="flex items-center gap-3 text-[#2C3E35]/85">
                <span class="w-11 h-11 rounded-[14px] bg-[#F3EFEA] flex items-center justify-center"><Monitor class="w-5 h-5" :stroke-width="1.7" aria-hidden="true" /></span>
                100% online por Google Meet · Castellano y catalán
              </span>
            </div>
          </div>

          <div v-if="submitted" role="status" class="flex-[999_1_520px] min-w-0 bg-white border border-[#EAE4DC] rounded-[28px] p-8 sm:p-10 flex flex-col gap-4">
            <span class="w-14 h-14 rounded-full bg-[#E6EFE9] flex items-center justify-center"><Check class="w-7 h-7 text-[#4A6B5D]" aria-hidden="true" /></span>
            <h3 class="m-0 font-semibold text-3xl">Gracias, he recibido tu mensaje</h3>
            <p class="m-0 text-[17px] leading-[1.7] text-[#2C3E35]/85">Te responderé por email en menos de 24 horas. Revisa también la carpeta de spam por si acaso.</p>
            <button type="button" class="self-start text-sm font-semibold text-[#4A6B5D] underline underline-offset-4 cursor-pointer" @click="submitted = false">Enviar otro mensaje</button>
          </div>

          <form v-else class="flex-[999_1_520px] min-w-0 bg-white border border-[#EAE4DC] rounded-[28px] p-6 sm:p-10 flex flex-col gap-5" @submit.prevent="submitForm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label class="flex flex-col gap-1.5 text-sm font-semibold">Nombre *
                <input v-model="form.name" type="text" required autocomplete="name" maxlength="120" class="cv-input" />
              </label>
              <label class="flex flex-col gap-1.5 text-sm font-semibold">Email *
                <input v-model="form.email" type="email" required autocomplete="email" maxlength="150" class="cv-input" />
              </label>
            </div>
            <label class="flex flex-col gap-1.5 text-sm font-semibold">Teléfono (opcional)
              <input v-model="form.phone" type="tel" autocomplete="tel" placeholder="+34" maxlength="50" class="cv-input" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-semibold">¿En qué puedo ayudarte? *
              <textarea v-model="form.message" rows="5" required maxlength="800" class="cv-input resize-y"></textarea>
            </label>
            <label class="flex items-start gap-2.5 text-[13px] leading-normal text-[#2C3E35]/85">
              <input v-model="form.privacy_accepted" type="checkbox" required class="accent-[#A9553F] mt-1" />
              <span>He leído la <RouterLink to="/privacidad" class="text-[#4A6B5D] underline">política de privacidad</RouterLink> y acepto que Carla Viladot trate mis datos para responder a mi consulta. *</span>
            </label>
            <p v-if="formError" role="alert" class="m-0 text-sm font-medium text-[#9A3B28] bg-[#FBE4DF] rounded-xl px-4 py-3">{{ formError }}</p>
            <button
              type="submit"
              :disabled="submitting"
              class="self-start inline-flex items-center gap-2 font-semibold text-base bg-[#A9553F] hover:bg-[#8f4533] disabled:opacity-60 text-white px-7 py-4 rounded-2xl cursor-pointer transition-colors"
            >
              <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" aria-hidden="true" />
              {{ submitting ? 'Enviando…' : 'Enviar mensaje' }}
            </button>
          </form>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
@reference "../assets/css/main.css";

.cv-input {
  @apply font-sans font-normal text-base px-4 py-3.5 border border-[#2C3E35]/20 rounded-xl bg-[#FAF8F5] text-[#2C3E35] focus:outline-none focus:border-[#4A6B5D] focus:ring-2 focus:ring-[#4A6B5D]/15;
}
</style>
