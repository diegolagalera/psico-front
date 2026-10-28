<script setup>
import { toastState, toast } from '@/composables/useToast'
import ToastItem from './ToastItem.vue'
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed z-[100] pointer-events-none top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-[380px]"
    >
      <TransitionGroup
        tag="div"
        class="relative flex flex-col gap-3"
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-3 sm:translate-y-0 sm:translate-x-8 scale-95"
        enter-to-class="opacity-100 translate-x-0 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in absolute w-full"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95 sm:translate-x-8"
        move-class="transition-transform duration-300 ease-out"
      >
        <ToastItem
          v-for="t in toastState.toasts"
          :key="t.id"
          :toast="t"
          @dismiss="toast.dismiss(t.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>
