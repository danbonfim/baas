'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, Calendar, Eye, Star, Loader2, Wallet, BarChart3,
  CheckCircle2, XCircle, Clock, AlertCircle, Shield, ArrowUpRight,
  User, MessageCircle, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useProfessionalBookings, useCreateBooking, BookingData } from '@/hooks/useBookings'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  CONFIRMED: { label: 'Confirmado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  PENDING:   { label: 'Pendente',   color: 'text-amber-400  bg-amber-500/10  border-amber-500/20',  icon: Clock },
  COMPLETED: { label: 'Concluído',  color: 'text-brand-400  bg-brand-500/10  border-brand-500/20',  icon: Star },
  CANCELLED: { label: 'Cancelado',  color: 'text-red-400    bg-red-500/10    border-red-500/20',    icon: XCircle },
  DISPUTED:  { label: 'Em disputa', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: AlertCircle },
}

function fmtDate(d: string) {
  try { return format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) } catch { return d }
}

function ProfessionalBookingCard({
  booking, onConfirm, onCancel, loading,
}: {
  booking: BookingData
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  loading: boolean
}) {
  const st = statusConfig[booking.status] ?? statusConfig.PENDING
  const Icon = st.icon
  const clientName = booking.client?.user?.name ?? 'Cliente'

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-4">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-lg font-bold text-muted-foreground">
        <User className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <p className="font-semibold truncate">{clientName}</p>
          <Badge className={`text-xs border ${st.color} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />{st.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />{fmtDate(booking.date)} — {booking.durationHours}h
        </p>
        {booking.location && (
          <p className="text-sm text-muted-foreground mt-0.5">📍 {booking.location}</p>
        )}
        {booking.notes && (
          <p className="text-xs text-muted-foreground mt-1 italic">"{booking.notes}"</p>
        )}
      </div>
      <div className="flex sm:flex-col items-end justify-between gap-2 flex-shrink-0">
        <div className="text-right">
          <p className="font-bold text-brand-400">R$ {booking.professionalAmount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">líquido</p>
        </div>
        {booking.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs"
              onClick={() => onCancel(booking.id)} disabled={loading}>
              Recusar
            </Button>
            <Button size="sm" className="gradient-brand text-white h-7 text-xs"
              onClick={() => onConfirm(booking.id)} disabled={loading}>
              Confirmar
            </Button>
          </div>
        )}
        {booking.status === 'CONFIRMED' && (
          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs"
            onClick={() => onCancel(booking.id)} disabled={loading}>
            Cancelar
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default function ProfessionalDashboard() {
  const { ready, user } = useRequireAuth()
  const { bookings, loading: bookingsLoading } = useProfessionalBookings()
  const { confirmBooking, cancelBooking } = useCreateBooking()
  const [activeTab, setActiveTab] = useState('bookings')
  const [actionLoading, setActionLoading] = useState(false)
  const [localBookings, setLocalBookings] = useState<BookingData[]>([])

  useEffect(() => { setLocalBookings(bookings) }, [bookings])

  if (!ready || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
    </div>
  )

  const pro = user.professional

  const totalRevenue = localBookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.professionalAmount, 0)

  const pendingCount = localBookings.filter((b) => b.status === 'PENDING').length
  const confirmedCount = localBookings.filter((b) => b.status === 'CONFIRMED').length
  const completedCount = localBookings.filter((b) => b.status === 'COMPLETED').length

  const handleConfirm = async (id: string) => {
    setActionLoading(true)
    const updated = await confirmBooking(id)
    if (updated) {
      setLocalBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CONFIRMED' as const } : b))
    }
    setActionLoading(false)
  }

  const handleCancel = async (id: string) => {
    setActionLoading(true)
    const updated = await cancelBooking(id)
    if (updated) {
      setLocalBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' as const } : b))
    }
    setActionLoading(false)
  }

  const kycColor: Record<string, string> = {
    APPROVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    PENDING:  'text-amber-400  bg-amber-500/10  border-amber-500/20',
    REJECTED: 'text-red-400    bg-red-500/10    border-red-500/20',
  }
  const kycLabel: Record<string, string> = {
    APPROVED: 'Aprovado', PENDING: 'Em análise', REJECTED: 'Rejeitado',
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Painel Profissional</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              Bem-vinda, {user.name.split(' ')[0]}!
              {pro && !pro.verified && (
                <span className="text-amber-400 text-xs">⚠ Verificação pendente</span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            {pro?.slug && (
              <Link href={`/profile/${pro.slug}`}>
                <Button variant="outline" className="border-white/10 gap-2">
                  <Eye className="w-4 h-4" /> Ver perfil
                </Button>
              </Link>
            )}
            <Link href="/chat">
              <Button className="gradient-brand text-white gap-2">
                <MessageCircle className="w-4 h-4" /> Mensagens
              </Button>
            </Link>
          </div>
        </div>

        {/* KYC Alert */}
        {pro?.kycStatus === 'PENDING' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 mb-6 border border-amber-500/20 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">Verificação KYC em análise</p>
              <p className="text-xs text-muted-foreground">Seu perfil está sob análise. Você aparecerá nas buscas após aprovação.</p>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: DollarSign, label: 'Receita líquida',  value: `R$ ${totalRevenue.toFixed(2)}`, color: 'text-brand-400' },
            { icon: Calendar,   label: 'Agendamentos',     value: localBookings.length,             color: 'text-blue-400' },
            { icon: Clock,      label: 'Confirmados',      value: confirmedCount,                   color: 'text-emerald-400' },
            { icon: Star,       label: 'Concluídos',       value: completedCount,                   color: 'text-amber-400' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                {i === 0 && totalRevenue > 0 && (
                  <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />Ativo
                  </span>
                )}
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="bookings" className="relative gap-1.5">
              Agendamentos
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full gradient-brand text-white text-[10px] flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="earnings">Financeiro</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          {/* Agendamentos */}
          <TabsContent value="bookings">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Solicitações e agendamentos</h2>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-amber-400">{pendingCount} pendentes</span>
                <span>·</span>
                <span className="text-emerald-400">{confirmedCount} confirmados</span>
              </div>
            </div>

            {bookingsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
              </div>
            ) : localBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Nenhum agendamento ainda</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Complete seu perfil para aparecer nas buscas e receber solicitações
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {localBookings.map((b) => (
                    <ProfessionalBookingCard
                      key={b.id} booking={b}
                      onConfirm={handleConfirm} onCancel={handleCancel}
                      loading={actionLoading}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="earnings">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-brand-400" /><h3 className="font-semibold">Receita total</h3></div>
                <p className="text-3xl font-bold text-brand-400">R$ {totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">de {completedCount} agendamentos concluídos</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5 text-emerald-400" /><h3 className="font-semibold">Confirmados</h3></div>
                <p className="text-3xl font-bold text-emerald-400">
                  R$ {localBookings.filter(b => b.status === 'CONFIRMED').reduce((s, b) => s + b.professionalAmount, 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{confirmedCount} agendamentos a receber</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-5 h-5 text-amber-400" /><h3 className="font-semibold">Taxa plataforma</h3></div>
                <p className="text-3xl font-bold text-amber-400">15%</p>
                <p className="text-xs text-muted-foreground mt-1">sobre cada agendamento</p>
              </div>
            </div>

            {localBookings.filter(b => b.status === 'COMPLETED').length > 0 ? (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-semibold">Histórico de ganhos</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {localBookings
                    .filter(b => ['COMPLETED', 'CONFIRMED'].includes(b.status))
                    .map((b) => (
                      <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">{b.client?.user?.name ?? 'Cliente'}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(b.date)} — {b.durationHours}h</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-400">+R$ {b.professionalAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">R$ {b.totalAmount.toFixed(2)} bruto</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center glass rounded-2xl">
                <BarChart3 className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum ganho registrado ainda</p>
              </div>
            )}
          </TabsContent>

          {/* Perfil */}
          <TabsContent value="profile">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Status do perfil</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Verificação</span>
                    <Badge className={`text-xs border ${pro?.verified ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                      {pro?.verified ? '✓ Verificada' : '⚠ Pendente'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">KYC</span>
                    <Badge className={`text-xs border ${kycColor[pro?.kycStatus ?? 'PENDING']}`}>
                      {kycLabel[pro?.kycStatus ?? 'PENDING']}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Ações</h3>
                <div className="space-y-3">
                  {pro?.slug && (
                    <Link href={`/profile/${pro.slug}`} className="block">
                      <Button variant="outline" className="border-white/10 w-full gap-2">
                        <Eye className="w-4 h-4" /> Ver perfil público
                      </Button>
                    </Link>
                  )}
                  <Link href="/chat" className="block">
                    <Button variant="outline" className="border-white/10 w-full gap-2">
                      <MessageCircle className="w-4 h-4" /> Ver mensagens
                    </Button>
                  </Link>
                  {pro?.kycStatus === 'PENDING' && (
                    <div className="glass rounded-xl p-4 border border-amber-500/20">
                      <p className="text-sm text-amber-400 font-medium mb-1">Verificação KYC pendente</p>
                      <p className="text-xs text-muted-foreground">
                        Envie seus documentos para verificação. Após aprovação seu perfil ficará visível na plataforma.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
