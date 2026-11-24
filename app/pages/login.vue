<script setup>
import View from '@/views/LoginView.vue'
definePageMeta({ guestOnly: true })
usePageSeo(privatePageSeo('Acceso Alumnos · Vuelve a Ti'))
</script>

<template>
  <View />
</template>
