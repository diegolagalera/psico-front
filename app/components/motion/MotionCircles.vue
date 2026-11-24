<script setup>
// Dos círculos que se acercan sin fundirse: vínculo y apego seguro.
defineProps({
  left: { type: String, default: '#4A6B5D' },
  right: { type: String, default: '#D9826C' },
  halo: { type: String, default: '' },
  label: { type: String, default: 'Dos círculos que se acercan sin fundirse, como un vínculo seguro' },
})
</script>

<template>
  <svg viewBox="0 0 240 120" role="img" :aria-label="label" class="block w-full h-full overflow-visible">
    <circle v-if="halo" class="cv-m-halo" cx="120" cy="60" r="58" :fill="halo" />
    <g class="cv-m-left"><circle cx="95" cy="60" r="34" :fill="left" opacity="0.9" /></g>
    <g class="cv-m-right"><circle cx="145" cy="60" r="34" :fill="right" opacity="0.85" /></g>
  </svg>
</template>

<style scoped>
@keyframes approach-l { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(16px); } }
@keyframes approach-r { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-16px); } }
@keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 1; } }
.cv-m-left { animation: approach-l 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.cv-m-right { animation: approach-r 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.cv-m-halo { animation: breathe 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@media (prefers-reduced-motion: reduce) {
  .cv-m-left, .cv-m-right, .cv-m-halo { animation: none; }
}
</style>
