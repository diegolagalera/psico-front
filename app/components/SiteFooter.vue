<script setup>
import { RouterLink } from 'vue-router'
import { Feather, Lock, Instagram } from 'lucide-vue-next'

// Pie común de la web pública
function openCookieSettings() {
  window.dispatchEvent(new CustomEvent('open-cookie-settings'))
}
</script>

<template>
  <footer class="bg-[#2C3E35] text-[#FAF8F5] py-14 border-t border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
        <div class="md:col-span-2 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#4A6B5D] text-white flex items-center justify-center">
              <Feather class="w-4 h-4" />
            </div>
            <span class="font-editorial text-2xl font-semibold">Vuelve a Ti</span>
          </div>
          <p class="text-sm text-[#FAF8F5]/70 max-w-sm leading-relaxed">
            Programa de 10 semanas para superar la ruptura y reencontrarte, y terapia online individual y de pareja.
            Carla Viladot · Psicóloga General Sanitaria (Col. 29332).
          </p>
          <p class="text-sm text-[#FAF8F5]/70">Terapia online para toda España · Castellano y catalán</p>
        </div>

        <div class="space-y-2 text-sm">
          <p class="font-semibold text-[#D9826C] uppercase tracking-wider text-xs">Navegación</p>
          <ul class="space-y-2 text-[#FAF8F5]/75">
            <li><RouterLink to="/" class="hover:text-white">Inicio</RouterLink></li>
            <li><RouterLink to="/#el-programa" class="hover:text-white">Programa</RouterLink></li>
            <li><RouterLink to="/terapia-online" class="hover:text-white">Terapia</RouterLink></li>
            <li><RouterLink to="/#sobre-mi" class="hover:text-white">Sobre mí</RouterLink></li>
            <li><RouterLink to="/#contacto" class="hover:text-white">Contacto</RouterLink></li>
            <li><RouterLink to="/recursos" class="hover:text-white">Recursos Gratuitos</RouterLink></li>
          </ul>
        </div>

        <div class="space-y-2 text-sm">
          <p class="font-semibold text-[#D9826C] uppercase tracking-wider text-xs">Área Privada & Legal</p>
          <ul class="space-y-2 text-[#FAF8F5]/75">
            <li>
              <RouterLink to="/login" class="hover:text-white inline-flex items-center gap-1.5">
                <Lock class="w-3.5 h-3.5 text-[#D9826C]" />
                <span>Acceso Alumnos / Admin</span>
              </RouterLink>
            </li>
            <li><RouterLink to="/aviso-legal" class="hover:text-white">Aviso Legal</RouterLink></li>
            <li><RouterLink to="/privacidad" class="hover:text-white">Política de Privacidad</RouterLink></li>
            <li><RouterLink to="/cookies" class="hover:text-white">Política de Cookies</RouterLink></li>
            <li>
              <button
                type="button"
                class="text-xs text-[#FAF8F5]/60 hover:text-white underline cursor-pointer text-left"
                @click="openCookieSettings"
              >
                Configuración de Cookies
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#FAF8F5]/60 gap-4">
        <p>
          © {{ new Date().getFullYear() }} Vuelve a Ti · Carla Viladot Fonseca (NIF 49255948E · Col. 29332). Todos los
          derechos reservados.
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
</template>
