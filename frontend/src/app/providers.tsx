'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'

// Rehydrate user data on mount (validate token is still valid)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, setUser, logout } = useAuthStore()

  useEffect(() => {
    if (!token) return
    api.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => logout())
  }, [token, setUser, logout])

  return <>{children}</>
}
