<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Feather,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  try {
    const user = await authStore.login(email.value, password.value)
    toast.success(`Hola${user?.name ? `, ${user.name}` : ''}. Sesión iniciada.`, {
      title: 'Bienvenida/o de nuevo',
      duration: 3000,
    })
    const redirectPath = route.query.redirect
    if (redirectPath) {
      router.push(String(redirectPath))
    } else if (user.role === 'admin') {
      router.push('/admin/email-settings')
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    toast.error(
      authStore.error || 'No fue posible iniciar sesión. Verifica tus datos.',
      { title: 'No se pudo iniciar sesión' }
    )
  }
}

function fillDemoCredentials(role) {
  if (role === 'admin') {
    email.value = 'admin@vuelveati.com'
    password.value = 'Admin1234!'
  } else {
    email.value = 'alumno@vuelveati.com'
    password.value = 'Alumno1234!'
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-[#FAF8F5] text-[#2C3E35] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
  >
    <div
      class="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#4A6B5D]/10 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D9826C]/10 blur-3xl"
    ></div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md relative">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A6B5D] hover:text-[#2C3E35] mb-6"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Volver a la página principal</span>
      </RouterLink>

      <div
        class="bg-white rounded-2xl border border-[#2C3E35]/10 shadow-sm p-8 sm:p-10"
      >
        <!-- Encabezado -->
        <div class="flex items-center gap-3 mb-6">
          <div
            class="w-11 h-11 rounded-2xl bg-[#4A6B5D] text-white flex items-center justify-center"
          >
            <Feather class="w-5 h-5" />
          </div>
          <div>
            <h1 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
              Portal Privado · Vuelve a Ti
            </h1>
            <p class="text-xs text-[#2C3E35]/65">
              Acceso exclusivo para alumnos en proceso y administración
            </p>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label
              class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-2"
            >
              Correo electrónico
            </label>
            <div class="relative">
              <Mail class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5" />
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="tu@email.com"
                class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
              />
            </div>
          </div>

          <div>
            <label
              class="block text-xs font-semibold uppercase tracking-wider text-[#2C3E35]/80 mb-2"
            >
              Contraseña
            </label>
            <div class="relative">
              <KeyRound
                class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3.5"
              />
              <input
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full py-3.5 px-5 rounded-2xl bg-[#4A6B5D] hover:bg-[#2C3E35] disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Lock class="w-4 h-4" />
            <span>
              {{ authStore.loading ? 'Verificando acceso...' : 'Entrar a mi Espacio' }}
            </span>
          </button>
        </form>

        <!-- Nota de alta manual -->
        <div
          class="mt-6 p-4 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 text-xs text-[#2C3E35]/75 space-y-2"
        >
          <div class="flex items-center gap-2 font-semibold text-[#2C3E35]">
            <ShieldCheck class="w-4 h-4 text-[#6B8E23]" />
            <span>¿Aún no tienes credenciales de alumno?</span>
          </div>
          <p class="leading-relaxed">
            El registro público está desactivado para preservar la privacidad del
            grupo. La Carla Viladot te dará de alta tras vuestra sesión inicial y
            recibirás tus claves por correo.
          </p>
        </div>

        <!-- Accesos rápidos de demostración -->
        <div class="mt-5 pt-5 border-t border-[#2C3E35]/10">
          <p
            class="text-[11px] uppercase tracking-wider text-[#4A6B5D] font-bold mb-2.5 flex items-center gap-1.5"
          >
            <Sparkles class="w-3.5 h-3.5 text-[#D9826C]" />
            <span>Credenciales de prueba preconfiguradas:</span>
          </p>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              @click="fillDemoCredentials('admin')"
              class="py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#4A6B5D]/10 border border-[#2C3E35]/15 text-xs font-medium text-left transition-colors cursor-pointer"
            >
              <span class="block font-bold text-[#2C3E35]">Rol Admin</span>
              <span class="text-[11px] text-[#2C3E35]/65">admin@vuelveati.com</span>
            </button>
            <button
              type="button"
              @click="fillDemoCredentials('user')"
              class="py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#D9826C]/15 border border-[#2C3E35]/15 text-xs font-medium text-left transition-colors cursor-pointer"
            >
              <span class="block font-bold text-[#2C3E35]">Rol Alumno</span>
              <span class="text-[11px] text-[#2C3E35]/65">alumno@vuelveati.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
