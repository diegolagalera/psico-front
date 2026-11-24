<script setup>
import View from '@/views/admin/AdminLayout.vue'
definePageMeta({ requiresAuth: true, requiresAdmin: true })
usePageSeo(privatePageSeo('Panel · Admin Vuelve a Ti'))
</script>

<template>
  <View />
</template>
