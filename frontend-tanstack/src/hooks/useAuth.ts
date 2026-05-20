import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { api, extractError } from '@/lib/api'
import { useAuthStore, AuthUser } from '@/store/auth.store'

interface LoginPayload { email: string; password: string }
interface RegisterPayload {
  email: string
  password: string
  name: string
  phone?: string
  role: 'client' | 'professional'
  city?: string
  state?: string
}

export function useAuth() {
  const navigate = useNavigate()
  const { token, user, isAuthenticated, setAuth, setUser, logout: storeLogout } = useAuthStore()

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await api.post<{ accessToken: string }>('/auth/login', payload)
    const meRes = await api.get<AuthUser>('/auth/me', {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    })
    setAuth(data.accessToken, meRes.data)
    toast.success(`Bem-vindo de volta, ${meRes.data.name.split(' ')[0]}!`)

    const role = meRes.data.role
    if (role === 'ADMIN') navigate({ to: '/dashboard/admin' })
    else if (role === 'PROFESSIONAL') navigate({ to: '/dashboard/professional' })
    else navigate({ to: '/dashboard/client' })
  }, [navigate, setAuth])

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await api.post<{ accessToken: string }>('/auth/register', payload)
    const meRes = await api.get<AuthUser>('/auth/me', {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    })
    setAuth(data.accessToken, meRes.data)
    toast.success('Conta criada com sucesso!')

    if (payload.role === 'professional') navigate({ to: '/dashboard/professional' })
    else navigate({ to: '/dashboard/client' })
  }, [navigate, setAuth])

  const logout = useCallback(() => {
    storeLogout()
    toast.info('Sessão encerrada')
    navigate({ to: '/' })
  }, [navigate, storeLogout])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<AuthUser>('/auth/me')
      setUser(data)
    } catch {
      // silently fail
    }
  }, [setUser])

  return { token, user, isAuthenticated, login, register, logout, refreshUser }
}
