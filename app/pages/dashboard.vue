<script setup>
import View from '@/views/UserDashboardView.vue'
definePageMeta({ requiresAuth: true })
usePageSeo(privatePageSeo('Mi Espacio · Programa Vuelve a Ti'))
</script>

<template>
  <View />
</template>
