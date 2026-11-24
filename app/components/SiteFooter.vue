<script setup>
import { RouterLink } from 'vue-router'
import WhatsAppButton from '@/components/WhatsAppButton.vue'
import { WHATSAPP_URL } from '@/constants/contact'

// Pie común de la web pública
function openCookieSettings() {
  window.dispatchEvent(new CustomEvent('open-cookie-settings'))
}
</script>

<template>
  <footer class="bg-[#2C3E35] text-[#FAF8F5]/80">
    <div class="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 flex flex-wrap justify-between gap-8 text-sm">
      <div class="flex flex-col gap-1.5 max-w-[360px]">
        <span class="font-editorial text-2xl font-semibold text-[#FAF8F5]">Carla Viladot</span>
        <span>Psicóloga General Sanitaria · Col. 29332</span>
        <span>Terapia online para toda España · Castellano y catalán</span>
        <span class="mt-4 text-xs text-[#FAF8F5]/55">© {{ new Date().getFullYear() }} Carla Viladot Fonseca · NIF 49255948E</span>
      </div>
      <nav aria-label="Pie" class="flex flex-wrap gap-12">
        <div class="flex flex-col gap-2">
          <span class="text-xs font-bold tracking-[0.1em] uppercase text-[#F2B8A6]">Servicios</span>
          <RouterLink to="/programa-vuelve-a-ti" class="text-[#FAF8F5] hover:underline">Programa Vuelve a Ti</RouterLink>
          <RouterLink to="/terapia-online" class="text-[#FAF8F5] hover:underline">Terapia online</RouterLink>
          <RouterLink to="/recursos" class="text-[#FAF8F5] hover:underline">Recursos gratuitos</RouterLink>
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-xs font-bold tracking-[0.1em] uppercase text-[#F2B8A6]">Carla</span>
          <RouterLink to="/sobre-mi" class="text-[#FAF8F5] hover:underline">Sobre mí</RouterLink>
          <RouterLink to="/contacto" class="text-[#FAF8F5] hover:underline">Contacto</RouterLink>
          <a :href="WHATSAPP_URL" target="_blank" rel="noopener noreferrer" class="text-[#FAF8F5] hover:underline">WhatsApp</a>
          <a href="https://www.instagram.com/carlaviladot.psicologa/" target="_blank" rel="noopener noreferrer" class="text-[#FAF8F5] hover:underline">Instagram</a>
          <RouterLink to="/login" class="text-[#FAF8F5] hover:underline">Acceso alumnos</RouterLink>
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-xs font-bold tracking-[0.1em] uppercase text-[#F2B8A6]">Legal</span>
          <RouterLink to="/aviso-legal" class="text-[#FAF8F5] hover:underline">Aviso legal</RouterLink>
          <RouterLink to="/privacidad" class="text-[#FAF8F5] hover:underline">Privacidad</RouterLink>
          <RouterLink to="/cookies" class="text-[#FAF8F5] hover:underline">Cookies</RouterLink>
          <button type="button" class="text-left text-[#FAF8F5]/70 hover:text-[#FAF8F5] underline cursor-pointer" @click="openCookieSettings">
            Configurar cookies
          </button>
        </div>
      </nav>
    </div>
  </footer>
  <WhatsAppButton />
</template>
