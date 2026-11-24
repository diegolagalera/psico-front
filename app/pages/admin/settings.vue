<script setup>
import View from '@/views/admin/SettingsView.vue'
definePageMeta({ requiresAuth: true, requiresAdmin: true })
usePageSeo(privatePageSeo('Configuración del Sistema · Admin Vuelve a Ti'))
</script>

<template>
  <View />
</template>
