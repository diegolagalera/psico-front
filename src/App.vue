<script setup>
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-[#2C3E35] flex flex-col">
    <RouterView />
    <ToastContainer />
  </div>
</template>
