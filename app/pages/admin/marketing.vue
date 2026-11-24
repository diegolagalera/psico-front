<script setup>
import View from '@/views/admin/EmailMarketingView.vue'
definePageMeta({ requiresAuth: true, requiresAdmin: true })
usePageSeo(privatePageSeo('Email Marketing & Secuencias · Admin Vuelve a Ti'))
</script>

<template>
  <View />
</template>
