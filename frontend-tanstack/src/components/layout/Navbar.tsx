import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Search, Heart, MessageCircle, User, Crown, Sparkles, LogOut, ChevronDown, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@/components/layout/NotificationBell'

const navLinks = [
  { href: '/search', label: 'Explorar', icon: Search },
  { href: '/chat', label: 'Mensagens', icon: MessageCircle },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()

  const dashboardHref =
    user?.role === 'ADMIN' ? '/dashboard/admin'
    : user?.role === 'PROFESSIONAL' ? '/dashboard/professional'
    : '/dashboard/client'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">BAAS</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/search">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-brand-400">
                <Heart className="w-5 h-5" />
              </Button>
            </Link>

            {isAuthenticated && user && <NotificationBell />}

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm"
                >
                  <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-24 truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 glass rounded-xl border border-white/10 p-1 shadow-xl"
                    >
                      <Link to={dashboardHref} onClick={() => setUserMenuOpen(false)}>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm cursor-pointer">
                          <User className="w-4 h-4 text-brand-400" /> Meu painel
                        </div>
                      </Link>
                      <Link to="/chat" onClick={() => setUserMenuOpen(false)}>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm cursor-pointer">
                          <MessageCircle className="w-4 h-4 text-brand-400" /> Mensagens
                        </div>
                      </Link>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)}>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm cursor-pointer">
                          <Settings className="w-4 h-4 text-brand-400" /> Configurações
                        </div>
                      </Link>
                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); logout() }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm w-full text-left text-red-400"
                        >
                          <LogOut className="w-4 h-4" /> Sair
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="outline" size="sm" className="border-brand-500/30 text-brand-400 hover:bg-brand-500/10">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button size="sm" className="gradient-brand text-white hover:opacity-90">
                    <Crown className="w-4 h-4 mr-1" />
                    Cadastre-se
                  </Button>
                </Link>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </div>
                </Link>
              ))}
              {isAuthenticated && user ? (
                <>
                  <Link to={dashboardHref} onClick={() => setMobileOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                      <User className="w-5 h-5" /> Meu painel
                    </div>
                  </Link>
                  <div className="pt-2 border-t border-white/10">
                    <button
                      onClick={() => { setMobileOpen(false); logout() }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 w-full"
                    >
                      <LogOut className="w-5 h-5" /> Sair
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-2 border-t border-white/10 flex gap-2">
                  <Link to="/auth/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-brand-500/30 text-brand-400">Entrar</Button>
                  </Link>
                  <Link to="/auth/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full gradient-brand text-white">Cadastre-se</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
