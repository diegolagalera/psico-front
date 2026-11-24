<script setup>
import View from '@/views/admin/ResourcesManagementView.vue'
definePageMeta({ requiresAuth: true, requiresAdmin: true })
usePageSeo(privatePageSeo('Foro de Recursos & Captación de Emails · Admin Vuelve a Ti'))
</script>

<template>
  <View />
</template>
