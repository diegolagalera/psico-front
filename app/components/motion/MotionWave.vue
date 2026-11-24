<script setup>
import { ref, onMounted } from 'vue'

// Onda agitada que se calma: sistema nervioso y ansiedad.
// Usa <animate> de SVG para que funcione también en Safari.
defineProps({
  color: { type: String, default: '#4A6B5D' },
  strokeWidth: { type: Number, default: 4 },
  label: { type: String, default: 'Una onda agitada que poco a poco se calma' },
})

const agitated =
  'M0 60 C 20 10, 40 110, 60 60 S 100 10, 120 60 S 160 110, 180 60 S 220 10, 240 60'
const calm = 'M0 60 C 20 50, 40 70, 60 60 S 100 50, 120 60 S 160 70, 180 60 S 220 50, 240 60'

// Las animaciones SVG (<animate>) no se paran con CSS: se quitan si el sistema
// pide «reducir movimiento», y la onda queda en calma.
const reduceMotion = ref(false)
onMounted(() => {
  reduceMotion.value = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
})
</script>

<template>
  <svg viewBox="0 0 240 120" role="img" :aria-label="label" class="block w-full h-full">
    <path
      :d="reduceMotion ? calm : agitated"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
    >
      <animate
        v-if="!reduceMotion"
        attributeName="d"
        :values="`${agitated};${calm};${agitated}`"
        dur="6s"
        repeatCount="indefinite"
        calcMode="spline"
        keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
      />
    </path>
  </svg>
</template>
