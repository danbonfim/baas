import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN'
  avatar?: string | null
  client?: {
    id: string
    credits: number
    balance: number
    cashback: number
    subscription?: {
      plan: string
      status: string
      currentPeriodEnd: string
      creditsPerCycle: number
    } | null
  } | null
  professional?: {
    id: string
    slug: string
    verified: boolean
    kycStatus: string
  } | null
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setAuth: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  logout: () => void
  setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('baas_token', token)
        }
        set({ token, user, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('baas_token')
        }
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'baas_auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
