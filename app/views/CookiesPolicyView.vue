<script setup>
import { RouterLink } from 'vue-router'
import { ArrowLeft, Cookie, ShieldCheck, Settings, CheckCircle2 } from 'lucide-vue-next'

function reopenCookieBanner() {
  window.dispatchEvent(new CustomEvent('open-cookie-settings'))
}
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35]">
    <!-- Cabecera simple -->
    <header class="border-b border-[#2C3E35]/10 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-xs font-semibold text-[#4A6B5D] hover:text-[#2C3E35] transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Volver al inicio</span>
        </RouterLink>
        <span class="font-editorial text-lg font-semibold text-[#2C3E35]">Vuelve a Ti</span>
      </div>
    </header>

    <!-- Contenido Legal -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <article class="bg-white rounded-3xl border border-[#2C3E35]/10 p-6 sm:p-12 shadow-xs space-y-8">
        <header class="space-y-3 border-b border-[#2C3E35]/10 pb-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A6B5D]/10 text-[#4A6B5D] text-xs font-semibold uppercase tracking-wider">
            <Cookie class="w-3.5 h-3.5" />
            <span>Transparencia y Privacidad</span>
          </div>
          <h1 class="font-editorial text-3xl sm:text-4xl font-semibold text-[#2C3E35]">
            Política de Cookies
          </h1>
          <p class="text-xs text-[#2C3E35]/60">
            Última actualización: 31 de octubre de 2026 · Conforme al RGPD y Guía de Cookies de la AEPD
          </p>
        </header>

        <!-- Botón de reconfiguración directa -->
        <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-0.5">
            <p class="font-semibold text-sm text-[#2C3E35]">Tus preferencias de cookies</p>
            <p class="text-xs text-[#2C3E35]/70">Puedes modificar o revocar tu consentimiento en cualquier momento.</p>
          </div>
          <button
            type="button"
            @click="reopenCookieBanner"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A6B5D] hover:bg-[#3d594d] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Settings class="w-3.5 h-3.5" />
            <span>Configurar Cookies</span>
          </button>
        </div>

        <div class="prose prose-stone max-w-none text-sm sm:text-base text-[#2C3E35]/85 leading-relaxed space-y-6">
          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
            1. ¿Qué es una cookie?
          </h2>
          <p>
            Una cookie es un pequeño archivo de texto que un sitio web almacena en su navegador o dispositivo al visitarlo. Las cookies permiten a la página web recordar información sobre su visita (como su sesión iniciada, preferencias de visualización o estadísticas agregadas), facilitando su próxima visita y haciendo que el sitio le resulte más útil y personalizado.
          </p>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            2. ¿Qué tipos de cookies utiliza este sitio web?
          </h2>
          <p>
            En cumplimiento del artículo 22.2 de la Ley 34/2002 (LSSI-CE) y siguiendo las directrices de la Agencia Española de Protección de Datos (AEPD), este sitio web clasifica las cookies y tecnologías de almacenamiento local en las siguientes categorías:
          </p>

          <div class="space-y-4 pt-2">
            <!-- Técnicas -->
            <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2">
              <div class="flex items-center gap-2 text-[#4A6B5D] font-bold text-sm">
                <CheckCircle2 class="w-4 h-4 shrink-0" />
                <span>Cookies Técnicas y Estrictamente Necesarias (Exentas de consentimiento)</span>
              </div>
              <p class="text-xs sm:text-sm text-[#2C3E35]/80">
                Son aquellas imprescindibles para permitir al usuario la navegación a través del sitio web y la utilización de las diferentes opciones o servicios que en él existen (por ejemplo, controlar el tráfico, identificar la sesión de alumnos autenticados, acceder al campus privado o guardar sus preferencias de consentimiento de cookies). No pueden desactivarse.
              </p>
            </div>

            <!-- Analíticas -->
            <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2">
              <div class="flex items-center gap-2 text-[#2C3E35] font-bold text-sm">
                <CheckCircle2 class="w-4 h-4 text-[#D9826C] shrink-0" />
                <span>Cookies Analíticas y de Rendimiento (Requieren consentimiento)</span>
              </div>
              <p class="text-xs sm:text-sm text-[#2C3E35]/80">
                Permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico de la utilización que hacen del servicio ofertado. Para ello se analiza su navegación en nuestra página web con el fin de mejorar la oferta de contenidos y servicios.
              </p>
            </div>

            <!-- Publicitarias / Marketing -->
            <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 space-y-2">
              <div class="flex items-center gap-2 text-[#2C3E35] font-bold text-sm">
                <CheckCircle2 class="w-4 h-4 text-[#D9826C] shrink-0" />
                <span>Cookies Publicitarias y de Terceros (Requieren consentimiento)</span>
              </div>
              <p class="text-xs sm:text-sm text-[#2C3E35]/80">
                Permiten la gestión de contenidos publicitarios o reproductores de terceros (como vídeos de YouTube o píxeles de campañas publicitarias en Meta/Google) en función de perfiles de navegación y hábitos del usuario. Solo se activan si el usuario lo consiente expresamente.
              </p>
            </div>
          </div>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            3. Tabla detallada de cookies utilizadas
          </h2>
          <div class="overflow-x-auto rounded-2xl border border-[#2C3E35]/10">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#FAF8F5] text-[#2C3E35] font-semibold border-b border-[#2C3E35]/10">
                <tr>
                  <th class="p-3">Nombre</th>
                  <th class="p-3">Proveedor</th>
                  <th class="p-3">Finalidad</th>
                  <th class="p-3">Duración</th>
                  <th class="p-3">Tipo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#2C3E35]/10 text-[#2C3E35]/80">
                <tr>
                  <td class="p-3 font-mono text-xs">vuelveati_consent</td>
                  <td class="p-3">Propia</td>
                  <td class="p-3">Guarda la preferencia del usuario sobre el consentimiento de cookies.</td>
                  <td class="p-3">1 año</td>
                  <td class="p-3 font-semibold text-[#4A6B5D]">Necesaria</td>
                </tr>
                <tr>
                  <td class="p-3 font-mono text-xs">vuelveati_token</td>
                  <td class="p-3">Propia</td>
                  <td class="p-3">Mantiene la sesión de usuario/alumno en el campus de forma segura.</td>
                  <td class="p-3">Sesión</td>
                  <td class="p-3 font-semibold text-[#4A6B5D]">Necesaria</td>
                </tr>
                <tr>
                  <td class="p-3 font-mono text-xs">vuelve_a_ti_lead</td>
                  <td class="p-3">Propia</td>
                  <td class="p-3">Recuerda el desbloqueo del recurso gratuito solicitado por el usuario.</td>
                  <td class="p-3">Persistente</td>
                  <td class="p-3 font-semibold text-[#4A6B5D]">Necesaria</td>
                </tr>
                <tr>
                  <td class="p-3 font-mono text-xs">VISITOR_INFO1_LIVE, YSC</td>
                  <td class="p-3">YouTube (Google)</td>
                  <td class="p-3">Permite visualizar vídeos explicativos incrustados en la biblioteca.</td>
                  <td class="p-3">6 meses / Sesión</td>
                  <td class="p-3 font-semibold text-[#D9826C]">Marketing / Terceros</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            4. ¿Cómo desactivar o eliminar cookies en su navegador?
          </h2>
          <p>
            Además del panel de configuración interactivo de este sitio web, usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador o dispositivo móvil:
          </p>
          <ul class="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
            <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad y Seguridad &gt; Cookies y datos del sitio.</li>
            <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
            <li><strong>Microsoft Edge:</strong> Configuración &gt; Privacidad, búsqueda y servicios &gt; Cookies.</li>
          </ul>
          <p class="text-xs text-[#2C3E35]/65">
            Tenga en cuenta que si revoca las cookies técnicas necesarias, es posible que algunas funciones básicas del campus o de la web no funcionen con total normalidad.
          </p>

          <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35] pt-4">
            5. Actualizaciones de la Política de Cookies
          </h2>
          <p>
            Carla Viladot Fonseca puede modificar esta Política de Cookies en función de exigencias legislativas, reglamentarias, o con la finalidad de adaptar dicha política a las instrucciones dictadas por la Agencia Española de Protección de Datos (AEPD). Por ello, se aconseja a los usuarios que la visiten periódicamente.
          </p>
          <p class="text-xs text-[#2C3E35]/65 pt-4 border-t border-[#2C3E35]/10">
            Para cualquier consulta sobre el tratamiento de cookies, puede contactar a través de <a href="mailto:cviladotpsicologa@gmail.com" class="text-[#D9826C] hover:underline font-semibold">cviladotpsicologa@gmail.com</a> o consultar nuestra <RouterLink to="/privacidad" class="text-[#D9826C] hover:underline font-semibold">Política de Privacidad</RouterLink>.
          </p>
        </div>
      </article>
    </main>
  </div>
</template>
