import axios from 'axios'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location
    // En desarrollo local o red LAN (puerto 5173), contacta directamente con Flask (puerto 5001)
    if (port === '5173') {
      return `${protocol}//${hostname}:5001/api`
    }
    if (hostname.includes('carlaviladotpsicologia.com')) {
      return 'https://api.carlaviladotpsicologia.com/api'
    }
    // En producción con proxy inverso local
    return '/api'
  }
  return 'http://localhost:5001/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Interceptor de petición: adjunta el token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vuelveati_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de respuesta: gestiona expiración de sesión (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Evita redirigir en bucle si ya estamos en /login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('vuelveati_token')
        localStorage.removeItem('vuelveati_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
