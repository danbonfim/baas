'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Calendar, Wallet, Crown, Star, Clock,
  Gift, Loader2, TrendingUp, AlertCircle, CheckCircle2,
  XCircle, Coins
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyBookings, useCreateBooking, BookingData } from '@/hooks/useBookings'
import { useRequireAuth } from '@/hooks/useRequireAuth'
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
  try { return format(new Date(d), "dd 'de' MMM, HH:mm", { locale: ptBR }) } catch { return d }
}

function BookingCard({ booking, onCancel }: { booking: BookingData; onCancel: (id: string) => void }) {
  const st = statusConfig[booking.status] ?? statusConfig.PENDING
  const Icon = st.icon
  const proName = booking.professional?.user?.name ?? 'Profissional'
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status)

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-4">
      <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0 text-lg font-bold text-brand-400">
        {proName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <p className="font-semibold truncate">{proName}</p>
          <Badge className={`text-xs border ${st.color} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />{st.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {fmtDate(booking.date)} — {booking.durationHours}h
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">📍 {booking.location || 'Local a confirmar'}</p>
      </div>
      <div className="flex sm:flex-col items-end justify-between gap-2 flex-shrink-0">
        <p className="font-bold text-brand-400">R$ {booking.totalAmount.toFixed(2)}</p>
        {canCancel && (
          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs"
            onClick={() => onCancel(booking.id)}>
            Cancelar
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default function ClientDashboard() {
  const { ready, user } = useRequireAuth()
  const { bookings, loading: bookingsLoading, refetch } = useMyBookings()
  const { cancelBooking } = useCreateBooking()
  const [activeTab, setActiveTab] = useState('bookings')

  if (!ready || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
    </div>
  )

  const client = user.client
  const subscription = client?.subscription
  const credits = client?.credits ?? 0
  const balance = client?.balance ?? 0
  const cashback = client?.cashback ?? 0
  const pending = bookings.filter((b) => b.status === 'PENDING')
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED')
  const planLabel: Record<string, string> = { BASIC: 'Basic', PREMIUM: 'Premium', VIP: 'VIP' }

  const handleCancel = async (id: string) => {
    const result = await cancelBooking(id)
    if (result) refetch()
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Meu Painel</h1>
            <p className="text-muted-foreground text-sm">Olá, {user.name.split(' ')[0]}! Bem-vindo de volta.</p>
          </div>
          <Link href="/search">
            <Button className="gradient-brand text-white gap-2">
              <Heart className="w-4 h-4" /> Explorar perfis
            </Button>
          </Link>
        </div>

        {/* Subscription Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl gradient-gold flex items-center justify-center flex-shrink-0">
                <Crown className="w-7 h-7 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold">
                    {subscription ? `Plano ${planLabel[subscription.plan] ?? subscription.plan}` : 'Sem assinatura'}
                  </h2>
                  <Badge className={`border-0 text-xs ${subscription?.status === 'ACTIVE' ? 'gradient-gold text-black' : 'bg-white/10 text-muted-foreground'}`}>
                    {subscription?.status === 'ACTIVE' ? 'Ativo' : 'Gratuito'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription
                    ? `Renova em ${format(new Date(subscription.currentPeriodEnd), 'dd/MM/yyyy', { locale: ptBR })}`
                    : 'Assine um plano e ganhe créditos mensais'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {subscription?.status === 'ACTIVE' ? (
                <>
                  <Button variant="outline" className="border-white/10 text-sm">Gerenciar</Button>
                  {subscription.plan !== 'VIP' && (
                    <Button variant="outline" className="border-amber-500/30 text-amber-400 text-sm">Upgrade VIP</Button>
                  )}
                </>
              ) : (
                <Link href="/#plans">
                  <Button className="gradient-brand text-white text-sm">Assinar agora</Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Gift,        label: 'Créditos',      value: credits,                    color: 'text-brand-400' },
            { icon: Wallet,      label: 'Saldo',         value: `R$ ${balance.toFixed(2)}`, color: 'text-emerald-400' },
            { icon: TrendingUp,  label: 'Cashback',      value: `R$ ${cashback.toFixed(2)}`,color: 'text-amber-400' },
            { icon: Calendar,    label: 'Agendamentos',  value: bookings.length,            color: 'text-blue-400' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="bookings" className="relative gap-1.5">
              Agendamentos
              {pending.length > 0 && (
                <span className="w-4 h-4 rounded-full gradient-brand text-white text-[10px] flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="wallet">Carteira</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          </TabsList>

          {/* Agendamentos */}
          <TabsContent value="bookings">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Meus agendamentos</h2>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-emerald-400">{confirmed.length} confirmados</span>
                <span>·</span>
                <span className="text-amber-400">{pending.length} pendentes</span>
              </div>
            </div>
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Nenhum agendamento ainda</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">Explore perfis e agende um momento especial</p>
                <Link href="/search">
                  <Button className="gradient-brand text-white gap-2">
                    <Heart className="w-4 h-4" /> Explorar profissionais
                  </Button>
                </Link>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {bookings.map((b) => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Carteira */}
          <TabsContent value="wallet">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-emerald-400" /><h3 className="font-semibold">Saldo disponível</h3></div>
                <p className="text-4xl font-bold text-emerald-400 mb-6">R$ {balance.toFixed(2)}</p>
                <Button variant="outline" className="border-white/10 w-full">Adicionar créditos</Button>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4"><Coins className="w-5 h-5 text-brand-400" /><h3 className="font-semibold">Créditos</h3></div>
                <p className="text-4xl font-bold text-brand-400 mb-2">{credits}</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {subscription ? `+${subscription.creditsPerCycle ?? 0} créditos todo mês` : 'Assine para créditos mensais'}
                </p>
                {!subscription && (
                  <Link href="/#plans">
                    <Button className="gradient-brand text-white w-full gap-2">
                      <Crown className="w-4 h-4" /> Ver planos
                    </Button>
                  </Link>
                )}
              </div>
              <div className="glass rounded-2xl p-6 md:col-span-2">
                <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-amber-400" /><h3 className="font-semibold">Cashback acumulado</h3></div>
                <p className="text-3xl font-bold text-amber-400 mb-2">R$ {cashback.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription
                    ? `Você recebe cashback em todos os agendamentos com o plano ${planLabel[subscription.plan]}`
                    : 'Planos Premium e VIP incluem cashback em todos os agendamentos'}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Favoritos */}
          <TabsContent value="favorites">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Nenhum favorito ainda</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">Salve perfis para acessar rapidamente depois</p>
              <Link href="/search">
                <Button className="gradient-brand text-white gap-2"><Heart className="w-4 h-4" /> Explorar perfis</Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
