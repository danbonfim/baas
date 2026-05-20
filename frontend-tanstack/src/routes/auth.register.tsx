import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Sparkles, User, Phone, Crown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { extractError } from '@/lib/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'client' | 'professional'>('client')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (form.password.length < 8) {
      toast.error('Senha deve ter ao menos 8 caracteres')
      return
    }
    setLoading(true)
    try {
      await register({ ...form, role })
      navigate({ to: role === 'professional' ? '/dashboard/professional' : '/dashboard/client' })
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Criar conta</h1>
            <p className="text-muted-foreground text-sm">Comece sua experiência premium</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['client', 'professional'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  role === r ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {r === 'client'
                  ? <User className={`w-6 h-6 mx-auto mb-2 ${role === r ? 'text-brand-400' : 'text-muted-foreground'}`} />
                  : <Crown className={`w-6 h-6 mx-auto mb-2 ${role === r ? 'text-brand-400' : 'text-muted-foreground'}`} />
                }
                <p className="text-sm font-medium">{r === 'client' ? 'Cliente' : 'Profissional'}</p>
                <p className="text-xs text-muted-foreground">{r === 'client' ? 'Buscar perfis' : 'Anunciar perfil'}</p>
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label className="text-sm mb-2 block">Nome completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Seu nome" className="pl-10 bg-white/5 border-white/10" value={form.name} onChange={set('name')} disabled={loading} />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="email" placeholder="seu@email.com" className="pl-10 bg-white/5 border-white/10" value={form.email} onChange={set('email')} disabled={loading} />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="tel" placeholder="(11) 99999-9999" className="pl-10 bg-white/5 border-white/10" value={form.phone} onChange={set('phone')} disabled={loading} />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Senha * (mín. 8 caracteres)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10 pr-10 bg-white/5 border-white/10"
                  value={form.password}
                  onChange={set('password')}
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Ao criar conta, você concorda com os{' '}
              <Link to="/" className="text-brand-400 hover:underline">Termos de Uso</Link> e{' '}
              <Link to="/" className="text-brand-400 hover:underline">Política de Privacidade</Link>.
              Você deve ter 18 anos ou mais.
            </p>

            <Button type="submit" className="w-full gradient-brand text-white hover:opacity-90 h-11" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</>
                : role === 'professional' ? 'Cadastrar como profissional' : 'Criar conta'
              }
            </Button>
          </form>

          <div className="relative my-6">
            <Separator className="bg-white/10" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">ou continue com</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2" disabled>
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </Button>
            <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2" disabled>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{' '}
            <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Entrar</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
