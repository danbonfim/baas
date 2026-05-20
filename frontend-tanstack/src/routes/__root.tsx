import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'

function AuthRehydrator() {
  const { token, setUser, logout } = useAuthStore()

  useEffect(() => {
    if (!token) return
    api.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => logout())
  }, [token, setUser, logout])

  return null
}

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AuthRehydrator />
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  )
}
