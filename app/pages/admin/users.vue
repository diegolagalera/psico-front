<script setup>
import View from '@/views/admin/UsersManagementView.vue'
definePageMeta({ requiresAuth: true, requiresAdmin: true })
usePageSeo(privatePageSeo('Gestión de Alumnos · Admin Vuelve a Ti'))
</script>

<template>
  <View />
</template>
