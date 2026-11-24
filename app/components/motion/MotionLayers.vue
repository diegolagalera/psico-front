<script setup>
// Capas que se ordenan: las partes internas (IFS) que encuentran su lugar.
defineProps({
  back: { type: String, default: '#FFFFFF' },
  middle: { type: String, default: '#F2B8A6' },
  front: { type: String, default: '#4A6B5D' },
  label: { type: String, default: 'Capas que se van ordenando, como las partes de uno mismo' },
})
</script>

<template>
  <svg viewBox="0 0 240 120" role="img" :aria-label="label" class="block w-full h-full overflow-visible">
    <rect class="cv-ly1" x="70" y="22" width="100" height="70" rx="14" :fill="back" />
    <rect class="cv-ly2" x="80" y="30" width="100" height="70" rx="14" :fill="middle" opacity="0.85" />
    <rect class="cv-ly3" x="60" y="38" width="100" height="70" rx="14" :fill="front" opacity="0.9" />
  </svg>
</template>

<style scoped>
@keyframes l1 { 0%, 100% { transform: translate(-10px, 8px) rotate(-6deg); } 50% { transform: none; } }
@keyframes l2 { 0%, 100% { transform: translate(12px, -6px) rotate(5deg); } 50% { transform: none; } }
@keyframes l3 { 0%, 100% { transform: translate(-6px, -10px) rotate(-3deg); } 50% { transform: none; } }
.cv-ly1 { animation: l1 8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.cv-ly2 { animation: l2 8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.cv-ly3 { animation: l3 8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@media (prefers-reduced-motion: reduce) {
  .cv-ly1, .cv-ly2, .cv-ly3 { animation: none; }
}
</style>
