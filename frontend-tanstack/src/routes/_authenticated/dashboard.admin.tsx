import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, DollarSign, Calendar, AlertTriangle,
  CheckCircle2, Loader2, Search, RefreshCw,
  UserCheck, Shield, X, Eye, XCircle, Ban
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
  kycLevel: string
  kycSelfieUrl: string | null
  kycDocumentUrl: string | null
  kycSubmittedAt: string | null
  kycRejectionReason: string | null
  slug: string
  city: string
  state: string
  age: number
  verified: boolean
  createdAt: string
  user: { name: string; email: string; avatar: string | null }
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

const kycLevels = [
  { value: 'DOCUMENT', label: 'Documento' },
  { value: 'BIOMETRIC', label: 'Biometria' },
  { value: 'FULL', label: 'Completo' },
]

function AdminDashboard() {
  const { ready, user } = useRequireAuth('ADMIN')
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [kycPending, setKycPending] = useState<KycProfessional[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  // KYC Review modal state
  const [reviewPro, setReviewPro] = useState<KycProfessional | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approveLevel, setApproveLevel] = useState('DOCUMENT')

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

  const openReview = async (proId: string) => {
    setReviewLoading(true)
    setRejectMode(false)
    setRejectReason('')
    setApproveLevel('DOCUMENT')
    try {
      const { data } = await api.get(`/admin/kyc/${proId}`)
      setReviewPro(data)
    } catch {
      toast.error('Erro ao carregar detalhes do KYC')
    } finally {
      setReviewLoading(false)
    }
  }

  const handleApproveKyc = async (professionalId: string) => {
    setActionId(professionalId)
    try {
      await api.patch(`/admin/kyc/${professionalId}/approve`, { level: approveLevel })
      toast.success('KYC aprovado!')
      setKycPending(prev => prev.filter(p => p.id !== professionalId))
      setReviewPro(null)
    } catch {
      toast.error('Erro ao aprovar KYC')
    } finally {
      setActionId(null)
    }
  }

  const handleRejectKyc = async (professionalId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição')
      return
    }
    setActionId(professionalId)
    try {
      await api.patch(`/admin/kyc/${professionalId}/reject`, { reason: rejectReason })
      toast.success('KYC rejeitado')
      setKycPending(prev => prev.filter(p => p.id !== professionalId))
      setReviewPro(null)
    } catch {
      toast.error('Erro ao rejeitar KYC')
    } finally {
      setActionId(null)
    }
  }

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Motivo do banimento:')
    if (!reason) return
    setActionId(userId)
    try {
      await api.patch(`/admin/users/${userId}/ban`, { reason })
      toast.success('Usuário banido')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true } : u))
    } catch {
      toast.error('Erro ao banir usuário')
    } finally {
      setActionId(null)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    setActionId(userId)
    try {
      await api.patch(`/admin/users/${userId}/unban`)
      toast.success('Usuário desbanido')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false } : u))
    } catch {
      toast.error('Erro ao desbanir usuário')
    } finally {
      setActionId(null)
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
    { label: 'Receita', value: `R$ ${((stats?.platformRevenue ?? 0)).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-400' },
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
                        {pro.city}, {pro.state} · {pro.age} anos ·
                        Cadastrou: {format(new Date(pro.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline"
                        className="border-white/10 h-8 text-xs gap-1"
                        onClick={() => openReview(pro.id)}
                      >
                        <Eye className="w-3 h-3" />
                        Revisar
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(u.createdAt), "dd/MM/yy", { locale: ptBR })}
                    </p>
                    {u.role !== 'ADMIN' && (
                      u.banned ? (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10 gap-1"
                          onClick={() => handleUnbanUser(u.id)} disabled={actionId === u.id}>
                          {actionId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          Desbanir
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-red-500/20 text-red-400 gap-1"
                          onClick={() => handleBanUser(u.id)} disabled={actionId === u.id}>
                          <Ban className="w-3 h-3" />
                          Banir
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* KYC Review Modal */}
      <AnimatePresence>
        {(reviewPro || reviewLoading) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => { if (!actionId) { setReviewPro(null); setReviewLoading(false) } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {reviewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
                </div>
              ) : reviewPro && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Revisão KYC</h2>
                    <button onClick={() => setReviewPro(null)} className="text-muted-foreground hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Profile info */}
                  <div className="flex items-center gap-3 mb-6">
                    {reviewPro.user.avatar ? (
                      <img src={reviewPro.user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-lg">
                        {reviewPro.user.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{reviewPro.user.name}</p>
                      <p className="text-xs text-muted-foreground">{reviewPro.user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {reviewPro.city}, {reviewPro.state} · {reviewPro.age} anos · /{reviewPro.slug}
                      </p>
                    </div>
                  </div>

                  {/* KYC Documents */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Status atual</p>
                      <div className="flex gap-2">
                        <Badge className={statusColors[reviewPro.kycStatus] || 'bg-white/10'}>
                          {reviewPro.kycStatus}
                        </Badge>
                        <Badge className="bg-white/10 text-muted-foreground">{reviewPro.kycLevel}</Badge>
                      </div>
                    </div>

                    {reviewPro.kycSelfieUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Selfie</p>
                        <img src={reviewPro.kycSelfieUrl} alt="Selfie" className="rounded-lg max-h-48 object-cover border border-white/10" />
                      </div>
                    )}

                    {reviewPro.kycDocumentUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Documento</p>
                        <img src={reviewPro.kycDocumentUrl} alt="Documento" className="rounded-lg max-h-48 object-cover border border-white/10" />
                      </div>
                    )}

                    {!reviewPro.kycSelfieUrl && !reviewPro.kycDocumentUrl && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-xs text-amber-300">Nenhum documento enviado ainda. Profissional está com KYC pendente sem submissão.</p>
                      </div>
                    )}

                    {reviewPro.kycSubmittedAt && (
                      <p className="text-xs text-muted-foreground">
                        Enviado em: {format(new Date(reviewPro.kycSubmittedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {!rejectMode ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Nível de aprovação</p>
                        <div className="flex gap-2">
                          {kycLevels.map(l => (
                            <button key={l.value}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                approveLevel === l.value
                                  ? 'gradient-brand text-white'
                                  : 'bg-white/5 text-muted-foreground hover:text-white border border-white/10'
                              }`}
                              onClick={() => setApproveLevel(l.value)}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 gradient-brand text-white gap-1.5"
                          onClick={() => handleApproveKyc(reviewPro.id)}
                          disabled={actionId === reviewPro.id}
                        >
                          {actionId === reviewPro.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Aprovar
                        </Button>
                        <Button variant="outline" className="flex-1 border-red-500/20 text-red-400 gap-1.5"
                          onClick={() => setRejectMode(true)}
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Motivo da rejeição</p>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Ex: Documento ilegível, selfie não corresponde ao documento..."
                          className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 border-white/10"
                          onClick={() => setRejectMode(false)}
                        >
                          Voltar
                        </Button>
                        <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5"
                          onClick={() => handleRejectKyc(reviewPro.id)}
                          disabled={actionId === reviewPro.id || !rejectReason.trim()}
                        >
                          {actionId === reviewPro.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Confirmar Rejeição
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/dashboard/admin')({
  component: AdminDashboard,
})
