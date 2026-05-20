import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, DollarSign, Calendar, AlertTriangle,
  CheckCircle2, Loader2, Search, RefreshCw,
  UserCheck, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PlatformStats {
  totalUsers: number
  totalProfessionals: number
  completedBookings: number
  platformRevenue: number
}

interface KycProfessional {
  id: string
  kycStatus: string
  createdAt: string
  user: { name: string; email: string }
}

interface RecentBooking {
  id: string
  status: string
  totalAmount: number
  date: string
  createdAt: string
  client: { user: { name: string } }
  professional: { user: { name: string } }
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  banned: boolean
  client: { id: string } | null
  professional: { id: string; verified: boolean; kycStatus: string } | null
}

const statusColors: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  CONFIRMED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  COMPLETED: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  CANCELLED: 'text-red-400 bg-red-500/10 border-red-500/20',
  DISPUTED: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
}

function AdminDashboard() {
  const { ready, user } = useRequireAuth('ADMIN')
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [kycPending, setKycPending] = useState<KycProfessional[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, kycRes, bookingsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/kyc/pending'),
        api.get('/admin/bookings/recent'),
        api.get('/admin/users'),
      ])
      setStats(statsRes.data)
      setKycPending(kycRes.data)
      setRecentBookings(bookingsRes.data)
      setUsers(usersRes.data.users ?? usersRes.data)
    } catch {
      toast.error('Erro ao carregar dados do admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (ready) loadData() }, [ready])

  const handleApproveKyc = async (professionalId: string) => {
    setApprovingId(professionalId)
    try {
      await api.patch(`/admin/kyc/${professionalId}/approve`, {})
      toast.success('KYC aprovado com sucesso!')
      setKycPending(prev => prev.filter(p => p.id !== professionalId))
    } catch {
      toast.error('Erro ao aprovar KYC')
    } finally {
      setApprovingId(null)
    }
  }

  if (!ready || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
    </div>
  )

  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const statCards = [
    { label: 'Usuários', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-brand-400' },
    { label: 'Profissionais', value: stats?.totalProfessionals ?? 0, icon: UserCheck, color: 'text-emerald-400' },
    { label: 'Agendamentos', value: stats?.completedBookings ?? 0, icon: Calendar, color: 'text-blue-400' },
    { label: 'Receita', value: `R$ ${((stats?.platformRevenue ?? 0) / 100).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-400' },
  ]

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Visão geral da plataforma BAAS</p>
          </div>
          <Button variant="outline" className="border-white/10 gap-2" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              {loading ? <div className="h-7 w-16 bg-white/10 rounded animate-pulse" /> :
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
            </motion.div>
          ))}
        </div>

        {/* KYC Alert */}
        {kycPending.length > 0 && (
          <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">
              <span className="font-bold">{kycPending.length} profissional(is)</span> aguardando verificação KYC
            </p>
          </div>
        )}

        <Tabs defaultValue="kyc">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="kyc" className="gap-1.5">
              KYC
              {kycPending.length > 0 && (
                <span className="w-4 h-4 rounded-full gradient-brand text-white text-[9px] flex items-center justify-center">
                  {kycPending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings">Agendamentos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            {kycPending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
                <h3 className="font-semibold mb-1">Tudo em dia!</h3>
                <p className="text-sm text-muted-foreground">Nenhuma verificação KYC pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {kycPending.map((pro) => (
                  <motion.div key={pro.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold flex-shrink-0">
                      {pro.user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{pro.user.name}</p>
                      <p className="text-xs text-muted-foreground">{pro.user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrou: {format(new Date(pro.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm"
                        className="gradient-brand text-white h-8 text-xs gap-1"
                        onClick={() => handleApproveKyc(pro.id)}
                        disabled={approvingId === pro.id}
                      >
                        {approvingId === pro.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <CheckCircle2 className="w-3 h-3" />}
                        Aprovar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="glass rounded-xl h-16 animate-pulse" />
                ))
              ) : recentBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhum agendamento ainda</p>
                </div>
              ) : (
                recentBookings.map((b) => (
                  <div key={b.id} className="glass rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">
                          {b.client?.user?.name} → {b.professional?.user?.name}
                        </p>
                        <Badge className={`text-xs border flex-shrink-0 ${statusColors[b.status] ?? ''}`}>
                          {b.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.date), "dd/MM/yyyy", { locale: ptBR })} ·
                        Criado {format(new Date(b.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <p className="font-bold text-brand-400 flex-shrink-0">R$ {b.totalAmount?.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="glass rounded-xl h-14 animate-pulse" />
                ))
              ) : filteredUsers.map((u) => (
                <div key={u.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                    {u.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{u.name}</p>
                      <Badge className={`text-[10px] border-0 px-1.5 ${
                        u.role === 'ADMIN' ? 'bg-yellow-500/20 text-yellow-400' :
                        u.role === 'PROFESSIONAL' ? 'bg-brand-500/20 text-brand-400' :
                        'bg-white/10 text-muted-foreground'
                      }`}>{u.role}</Badge>
                      {u.banned && <Badge className="text-[10px] bg-red-500/20 text-red-400 border-0">BANIDO</Badge>}
                      {u.professional?.verified && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0 gap-1"><Shield className="w-2.5 h-2.5" />KYC</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex-shrink-0">
                    {format(new Date(u.createdAt), "dd/MM/yy", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/dashboard/admin')({
  component: AdminDashboard,
})
