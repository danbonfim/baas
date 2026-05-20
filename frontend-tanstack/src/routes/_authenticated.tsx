import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const { isAuthenticated, _hasHydrated } = useAuthStore.getState()
    if (_hasHydrated && !isAuthenticated) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
