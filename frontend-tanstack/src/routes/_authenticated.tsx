import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth.store'
import { PanicButton } from '@/components/PanicButton'

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
  const { user } = useAuthStore()
  return (
    <>
      <Outlet />
      {user?.role === 'PROFESSIONAL' && <PanicButton />}
    </>
  )
}
