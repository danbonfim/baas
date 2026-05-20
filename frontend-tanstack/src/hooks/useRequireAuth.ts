import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth.store'

/**
 * Waits for Zustand persist hydration before checking auth.
 * Returns { ready: boolean } — render nothing until ready is true.
 */
export function useRequireAuth(role?: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN') {
  const navigate = useNavigate()
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated) {
      navigate({ to: '/auth/login' })
      return
    }
    if (role && user?.role !== role) {
      if (user?.role === 'ADMIN') navigate({ to: '/dashboard/admin' })
      else if (user?.role === 'PROFESSIONAL') navigate({ to: '/dashboard/professional' })
      else navigate({ to: '/dashboard/client' })
    }
  }, [_hasHydrated, isAuthenticated, user?.role, role, navigate])

  const ready = _hasHydrated && isAuthenticated
  return { ready, user }
}
