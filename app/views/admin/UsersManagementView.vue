<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import api from '@/services/api'
import {
  UserPlus,
  Search,
  Filter,
  Mail,
  KeyRound,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Power,
  Sparkles,
} from 'lucide-vue-next'
import { toast } from '@/composables/useToast'

const users = ref([])
const loading = ref(false)
const creating = ref(false)

// Filtros reactivos
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')

// Formulario de alta manual de alumno
const newUserForm = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user',
  send_welcome_email: true,
})

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
  let pass = 'Vuelve'
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  newUserForm.password = pass
}

async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/users', {
      params: {
        search: searchQuery.value,
        role: roleFilter.value,
        status: statusFilter.value,
      },
    })
    users.value = data.users || []
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'Error al cargar la lista de usuarios.'
    )
  } finally {
    loading.value = false
  }
}

async function handleCreateUser() {
  creating.value = true

  try {
    const { data } = await api.post('/admin/users', newUserForm)
    toast.success(data.message || 'Usuario dado de alta correctamente.', {
      title: 'Usuario creado',
      detail: data.email_log || '',
      duration: data.email_log ? 8000 : undefined,
    })

    // Limpiar formulario
    newUserForm.name = ''
    newUserForm.email = ''
    generateRandomPassword()
    newUserForm.role = 'user'

    await fetchUsers()
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'No se pudo dar de alta al usuario.'
    )
  } finally {
    creating.value = false
  }
}

async function handleToggleStatus(user) {
  try {
    const { data } = await api.patch(`/admin/users/${user.id}/toggle-status`)
    toast.success(
      data?.message || `Estado de ${user.email} actualizado.`,
      { title: 'Estado actualizado' }
    )
    await fetchUsers()
  } catch (err) {
    toast.error(
      err.response?.data?.error || 'No se pudo cambiar el estado del usuario.'
    )
  }
}

async function handleDeleteUser(user) {
  if (!window.confirm(`¿Seguro que deseas eliminar a ${user.email}?`)) return
  try {
    await api.delete(`/admin/users/${user.id}`)
    toast.success(`${user.email} ha sido eliminado.`, {
      title: 'Usuario eliminado',
    })
    await fetchUsers()
  } catch (err) {
    toast.error(err.response?.data?.error || 'No se pudo eliminar el usuario.')
  }
}

watch([searchQuery, roleFilter, statusFilter], () => {
  fetchUsers()
})

onMounted(() => {
  generateRandomPassword()
  fetchUsers()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Cabecera -->
    <div>
      <span
        class="text-xs font-bold uppercase tracking-widest text-[#4A6B5D] block"
      >
        Comunidad & Expedientes · Acceso Privado
      </span>
      <h1 class="font-editorial text-3xl sm:text-4xl font-semibold text-[#2C3E35] mt-1">
        Gestión de Alumnos y Accesos
      </h1>
      <p class="text-sm text-[#2C3E35]/70 mt-1">
        El registro público está cerrado para garantizar la privacidad y exclusividad del método terapéutico. Desde aquí puedes dar de alta nuevos alumnos manualmente y remitirles sus credenciales automáticas.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Columna Izquierda: Formulario de Alta Manual -->
      <form
        @submit.prevent="handleCreateUser"
        class="lg:col-span-5 bg-white rounded-2xl border border-[#2C3E35]/10 shadow-xs p-6 sm:p-7 space-y-5"
      >
        <div class="flex items-center gap-2.5 pb-3 border-b border-[#2C3E35]/10">
          <div
            class="w-9 h-9 rounded-xl bg-[#D9826C]/15 text-[#D9826C] flex items-center justify-center"
          >
            <UserPlus class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-editorial text-2xl font-semibold text-[#2C3E35]">
              Dar de Alta Nuevo Alumno
            </h2>
            <p class="text-xs text-[#2C3E35]/65">
              Creación manual de credenciales de acceso
            </p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
            Nombre del Alumno/a
          </label>
          <div class="relative">
            <User class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3" />
            <input
              v-model="newUserForm.name"
              type="text"
              placeholder="Ej. Marta Gómez"
              class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
            Correo Electrónico *
          </label>
          <div class="relative">
            <Mail class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3" />
            <input
              v-model="newUserForm.email"
              type="email"
              required
              placeholder="alumno@correo.com"
              class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-semibold text-[#2C3E35]/80">
              Contraseña Temporal *
            </label>
            <button
              type="button"
              @click="generateRandomPassword"
              class="inline-flex items-center gap-1 text-xs font-semibold text-[#4A6B5D] hover:underline cursor-pointer"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>Autogenerar</span>
            </button>
          </div>
          <div class="relative">
            <KeyRound
              class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3"
            />
            <input
              v-model="newUserForm.password"
              type="text"
              required
              class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm font-mono focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#2C3E35]/80 mb-1.5">
            Asignación de Rol
          </label>
          <div class="relative">
            <Shield class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3" />
            <select
              v-model="newUserForm.role"
              class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-sm focus:outline-none focus:border-[#4A6B5D]"
            >
              <option value="user">Alumno/a del Programa (user)</option>
              <option value="admin">Administrador/a (admin)</option>
            </select>
          </div>
        </div>

        <label
          class="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#2C3E35]/10 cursor-pointer"
        >
          <input
            v-model="newUserForm.send_welcome_email"
            type="checkbox"
            class="mt-1 rounded text-[#4A6B5D]"
          />
          <span class="text-xs text-[#2C3E35]/85 leading-relaxed">
            <strong>Enviar email de bienvenida automáticamente</strong> con sus
            credenciales de acceso al Programa “Vuelve a Ti”.
          </span>
        </label>

        <button
          type="submit"
          :disabled="creating"
          class="w-full py-3.5 px-5 rounded-2xl bg-[#D9826C] hover:bg-[#c56e58] disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <UserPlus class="w-4 h-4" />
          <span>
            {{
              creating
                ? 'Creando cuenta y enviando correo...'
                : 'Crear Usuario y Enviar Credenciales'
            }}
          </span>
        </button>
      </form>

      <!-- Columna Derecha: Lista de Usuarios con Buscador y Filtros -->
      <div
        class="lg:col-span-7 bg-white rounded-2xl border border-[#2C3E35]/10 shadow-xs p-6 sm:p-7 space-y-5"
      >
        <!-- Barra de Búsqueda y Filtros -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div class="sm:col-span-6 relative">
            <Search class="w-4 h-4 text-[#4A6B5D] absolute left-3.5 top-3" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por email o nombre..."
              class="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs sm:text-sm focus:outline-none focus:border-[#4A6B5D]"
            />
          </div>

          <div class="sm:col-span-3">
            <select
              v-model="roleFilter"
              class="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs sm:text-sm focus:outline-none focus:border-[#4A6B5D]"
            >
              <option value="">Todos los roles</option>
              <option value="user">Rol: Alumno</option>
              <option value="admin">Rol: Admin</option>
            </select>
          </div>

          <div class="sm:col-span-3">
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#2C3E35]/15 text-xs sm:text-sm focus:outline-none focus:border-[#4A6B5D]"
            >
              <option value="">Cualquier estado</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        <!-- Tabla de Usuarios -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="border-b border-[#2C3E35]/10 text-[11px] font-bold uppercase tracking-wider text-[#2C3E35]/60"
              >
                <th class="py-3 px-3">Usuario / Email</th>
                <th class="py-3 px-3">Rol</th>
                <th class="py-3 px-3">Estado</th>
                <th class="py-3 px-3">Alta</th>
                <th class="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#2C3E35]/8 text-sm">
              <tr
                v-for="u in users"
                :key="u.id"
                class="hover:bg-[#FAF8F5]/70 transition-colors"
              >
                <td class="py-3.5 px-3">
                  <p class="font-semibold text-[#2C3E35]">{{ u.name }}</p>
                  <p class="text-xs text-[#2C3E35]/65">{{ u.email }}</p>
                </td>
                <td class="py-3.5 px-3">
                  <span
                    class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    :class="
                      u.role === 'admin'
                        ? 'bg-[#2C3E35] text-white'
                        : 'bg-[#4A6B5D]/15 text-[#4A6B5D]'
                    "
                  >
                    {{ u.role === 'admin' ? 'Admin' : 'Alumno' }}
                  </span>
                </td>
                <td class="py-3.5 px-3">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    :class="
                      u.is_active
                        ? 'bg-[#6B8E23]/15 text-[#4A6B5D]'
                        : 'bg-[#D9826C]/20 text-[#D9826C]'
                    "
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="u.is_active ? 'bg-[#6B8E23]' : 'bg-[#D9826C]'"
                    ></span>
                    {{ u.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="py-3.5 px-3 text-xs text-[#2C3E35]/65">
                  {{
                    u.created_at
                      ? new Date(u.created_at).toLocaleDateString('es-ES')
                      : '—'
                  }}
                </td>
                <td class="py-3.5 px-3 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      @click="handleToggleStatus(u)"
                      :title="
                        u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'
                      "
                      class="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#4A6B5D]/15 text-[#2C3E35] transition-colors cursor-pointer"
                    >
                      <Power class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      @click="handleDeleteUser(u)"
                      title="Eliminar usuario"
                      class="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#D9826C]/20 text-[#D9826C] transition-colors cursor-pointer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="!loading && users.length === 0">
                <td
                  colspan="5"
                  class="py-8 text-center text-xs text-[#2C3E35]/60"
                >
                  No se encontraron usuarios con los filtros seleccionados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
