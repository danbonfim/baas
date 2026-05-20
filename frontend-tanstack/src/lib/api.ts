import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ─────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('baas_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// ── Response interceptor: 401 → logout ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('baas_token')
      localStorage.removeItem('baas_user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  },
)

// ── Helpers ─────────────────────────────────────────────────────
export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string })?.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (typeof msg === 'string') return msg
    return error.message
  }
  return 'Erro inesperado. Tente novamente.'
}
