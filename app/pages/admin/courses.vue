<script setup>
import View from '@/views/admin/CoursesManagementView.vue'
definePageMeta({ requiresAuth: true, requiresAdmin: true })
usePageSeo(privatePageSeo('Cursos, Cronogramas y Progreso · Admin Vuelve a Ti'))
</script>

<template>
  <View />
</template>
