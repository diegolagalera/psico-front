<script setup>
import { computed } from 'vue'

const props = defineProps({
  error: { type: Object, required: true },
})

const is404 = computed(() => Number(props.error?.statusCode) === 404)

useHead({
  title: is404.value ? 'Página no encontrada · Carla Viladot' : 'Algo ha fallado · Carla Viladot',
  meta: [{ name: 'robots', content: 'noindex, follow' }],
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="min-h-screen bg-[#FAF8F5] text-[#2C3E35] flex items-center justify-center px-6">
    <div class="max-w-lg text-center flex flex-col items-center gap-5">
      <p class="font-editorial text-7xl font-semibold text-[#C0674F] m-0">{{ is404 ? '404' : 'Ups' }}</p>
      <h1 class="font-editorial text-4xl font-semibold m-0">
        {{ is404 ? 'Esta página no existe' : 'Algo no ha ido bien' }}
      </h1>
      <p class="text-[#2C3E35]/75 leading-relaxed m-0">
        {{
          is404
            ? 'Puede que el enlace esté mal escrito o que la página ya no esté disponible.'
            : 'Inténtalo de nuevo en unos minutos.'
        }}
      </p>
      <div class="flex flex-wrap justify-center gap-3 pt-2">
        <button
          type="button"
          class="bg-[#4A6B5D] hover:bg-[#3d594d] text-white font-semibold px-6 py-3.5 rounded-2xl cursor-pointer"
          @click="goHome"
        >
          Ir al inicio
        </button>
        <NuxtLink
          to="/terapia-online"
          class="border border-[#2C3E35]/20 font-semibold px-6 py-3.5 rounded-2xl hover:bg-[#2C3E35]/5"
        >
          Terapia online
        </NuxtLink>
        <NuxtLink
          to="/recursos"
          class="border border-[#2C3E35]/20 font-semibold px-6 py-3.5 rounded-2xl hover:bg-[#2C3E35]/5"
        >
          Recursos gratuitos
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
