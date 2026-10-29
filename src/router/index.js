import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LandingView from '@/views/LandingView.vue'
import LoginView from '@/views/LoginView.vue'
import UserDashboardView from '@/views/UserDashboardView.vue'
import ResourcesHubView from '@/views/ResourcesHubView.vue'
import AdminLayout from '@/views/admin/AdminLayout.vue'
import CoursesManagementView from '@/views/admin/CoursesManagementView.vue'
import ResourcesManagementView from '@/views/admin/ResourcesManagementView.vue'
import StorageSettingsView from '@/views/admin/StorageSettingsView.vue'
import CalendarSettingsView from '@/views/admin/CalendarSettingsView.vue'
import EmailSettingsView from '@/views/admin/EmailSettingsView.vue'
import UsersManagementView from '@/views/admin/UsersManagementView.vue'
import SettingsView from '@/views/admin/SettingsView.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingView,
    meta: { title: 'Vuelve a Ti · Psicología y Reconstrucción Personal' },
  },
  {
    path: '/recursos',
    name: 'resources-hub',
    component: ResourcesHubView,
    meta: { title: 'Foro de Recursos Gratuitos · Vuelve a Ti' },
  },
  {
    path: '/recursos/:slug',
    name: 'resource-detail',
    component: ResourcesHubView,
    meta: { title: 'Recurso Terapéutico · Vuelve a Ti' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true, title: 'Acceso Alumnos · Vuelve a Ti' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: UserDashboardView,
    meta: {
      requiresAuth: true,
      title: 'Mi Espacio · Programa Vuelve a Ti',
    },
  },
  {
    path: '/admin',
    component: AdminLayout,
    redirect: '/admin/courses',
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: 'courses',
        name: 'admin-courses',
        component: CoursesManagementView,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: 'Cursos, Cronogramas y Progreso · Admin Vuelve a Ti',
        },
      },
      {
        path: 'resources',
        name: 'admin-resources',
        component: ResourcesManagementView,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: 'Foro de Recursos & Captación de Emails · Admin Vuelve a Ti',
        },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: SettingsView,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: 'Configuración del Sistema · Admin Vuelve a Ti',
        },
      },
      {
        path: 'calendar-settings',
        redirect: (to) => ({
          path: '/admin/settings',
          query: { tab: 'calendar', ...to.query },
        }),
      },
      {
        path: 'storage-settings',
        redirect: (to) => ({
          path: '/admin/settings',
          query: { tab: 'storage', ...to.query },
        }),
      },
      {
        path: 'email-settings',
        redirect: (to) => ({
          path: '/admin/settings',
          query: { tab: 'email', ...to.query },
        }),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: UsersManagementView,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: 'Gestión de Alumnos · Admin Vuelve a Ti',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

/**
 * Guardia de navegación global:
 * Verifica los metadatos `requiresAuth` y `requiresAdmin` inspeccionando el JWT activo.
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta?.title) {
    document.title = to.meta.title
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  // 1. Si requiere autenticación y el JWT no existe o ha expirado -> redirigir a /login
  if (requiresAuth && !authStore.isAuthenticated) {
    authStore.logout()
    return next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
  }

  // 2. Si requiere rol admin y el claim `role` del JWT no es 'admin' -> redirigir a /dashboard
  if (requiresAdmin && !authStore.isAdmin) {
    return next({ name: 'dashboard' })
  }

  // 3. Si es página solo para invitados (/login) y ya tiene sesión activa -> redirigir según su rol
  if (guestOnly && authStore.isAuthenticated) {
    return next(
      authStore.isAdmin ? { path: '/admin/email-settings' } : { name: 'dashboard' }
    )
  }

  next()
})

export default router
