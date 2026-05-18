'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

/**
 * Waits for Zustand persist hydration before checking auth.
 * Returns { ready: boolean } — render nothing until ready is true.
 */
export function useRequireAuth(role?: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN') {
  const router = useRouter()
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!_hasHydrated) return   // Wait for persist to load from localStorage
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    if (role && user?.role !== role) {
      // Role mismatch — redirect to their correct dashboard
      if (user?.role === 'ADMIN') router.push('/dashboard/admin')
      else if (user?.role === 'PROFESSIONAL') router.push('/dashboard/professional')
      else router.push('/dashboard/client')
    }
  }, [_hasHydrated, isAuthenticated, user?.role, role, router])

  const ready = _hasHydrated && isAuthenticated
  return { ready, user }
}
