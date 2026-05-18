'use client'

import { motion } from 'framer-motion'
import {
  Users, DollarSign, TrendingUp, Shield, Eye, Calendar, AlertTriangle,
  ArrowUpRight, BarChart3, Activity, UserCheck, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const adminStats = [
  { label: 'Receita total', value: 'R$ 245.8k', change: '+18%', up: true, icon: DollarSign },
  { label: 'Usuários ativos', value: '12.4k', change: '+8%', up: true, icon: Users },
  { label: 'Profissionais', value: '1.2k', change: '+15%', up: true, icon: UserCheck },
  { label: 'Agendamentos/dia', value: '340', change: '+22%', up: true, icon: Calendar },
  { label: 'Visualizações', value: '89k', change: '+35%', up: true, icon: Eye },
  { label: 'Taxa conversão', value: '4.2%', change: '+0.3%', up: true, icon: TrendingUp },
]

const recentActivity = [
  { action: 'Nova profissional cadastrada', detail: 'Helena R. — São Paulo', time: '2min', type: 'new' },
  { action: 'KYC aprovado', detail: 'Manuela S. — Verificação facial', time: '5min', type: 'verified' },
  { action: 'Disputa aberta', detail: 'Booking #4521 — Chargeback', time: '15min', type: 'alert' },
  { action: 'Pagamento processado', detail: 'R$ 2.400 — Split automático', time: '20min', type: 'payment' },
  { action: 'Perfil reportado', detail: 'Moderação pendente — ID #892', time: '30min', type: 'alert' },
  { action: 'Nova assinatura VIP', detail: 'Cliente #3821 — R$ 199.90/mês', time: '45min', type: 'payment' },
]

const typeIcons: Record<string, { icon: typeof Users; color: string }> = {
  new: { icon: Users, color: 'text-brand-400' },
  verified: { icon: Shield, color: 'text-emerald-400' },
  alert: { icon: AlertTriangle, color: 'text-gold-400' },
  payment: { icon: DollarSign, color: 'text-brand-400' },
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Visão geral da plataforma</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/10 gap-2">
              <Activity className="w-4 h-4" /> Relatórios
            </Button>
            <Button variant="outline" className="border-gold-500/30 text-gold-400 gap-2">
              <AlertTriangle className="w-4 h-4" /> 3 pendências
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {adminStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-brand-400" />
                <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />{stat.change}
                </span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="finance">Financeiro</TabsTrigger>
            <TabsTrigger value="moderation">Moderação</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-[1fr_400px] gap-6">
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-bold flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-brand-400" /> Receita mensal
                  </h2>
                  <div className="h-48 flex items-end gap-2">
                    {[65, 45, 78, 52, 90, 73, 88, 95, 68, 82, 92, 100].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="flex-1 gradient-brand rounded-t-md opacity-80 hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-bold text-sm mb-4">Top cidades</h3>
                    <div className="space-y-3">
                      {[
                        { city: 'São Paulo', pct: 35 },
                        { city: 'Rio de Janeiro', pct: 25 },
                        { city: 'Belo Horizonte', pct: 15 },
                        { city: 'Curitiba', pct: 10 },
                        { city: 'Outros', pct: 15 },
                      ].map((item) => (
                        <div key={item.city}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{item.city}</span>
                            <span className="text-muted-foreground">{item.pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full gradient-brand rounded-full" style={{ width: `${item.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-bold text-sm mb-4">Assinaturas ativas</h3>
                    <div className="space-y-3">
                      {[
                        { plan: 'Basic', count: 3200, color: 'bg-muted-foreground' },
                        { plan: 'Premium', count: 1800, color: 'gradient-brand' },
                        { plan: 'VIP', count: 450, color: 'gradient-gold' },
                      ].map((item) => (
                        <div key={item.plan} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm">{item.plan}</span>
                          </div>
                          <span className="text-sm font-bold">{item.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-brand-500/10">
                      <p className="text-xs text-muted-foreground">MRR</p>
                      <p className="text-2xl font-bold text-brand-400">R$ 385.6k</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-bold flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-brand-400" /> Atividade recente
                  </h2>
                  <div className="space-y-3">
                    {recentActivity.map((activity, i) => {
                      const { icon: Icon, color } = typeIcons[activity.type]
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                          <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.detail}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {activity.time}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <h2 className="font-bold flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-brand-400" /> Segurança
                  </h2>
                  <div className="space-y-3">
                    {[
                      { label: 'KYC pendentes', value: '8', status: 'warning' },
                      { label: 'Perfis reportados', value: '3', status: 'alert' },
                      { label: 'Disputas abertas', value: '2', status: 'alert' },
                      { label: 'Tentativas de fraude', value: '0', status: 'ok' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <span className="text-sm">{item.label}</span>
                        <Badge className={
                          item.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.status === 'warning' ? 'bg-gold-500/10 text-gold-400' :
                          'bg-red-500/10 text-red-400'
                        }>
                          {item.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="glass rounded-2xl p-6 text-center py-20">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Gestão de Usuários</h3>
              <p className="text-muted-foreground">Listagem completa de usuários, profissionais e clientes</p>
            </div>
          </TabsContent>

          <TabsContent value="finance">
            <div className="glass rounded-2xl p-6 text-center py-20">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Gestão Financeira</h3>
              <p className="text-muted-foreground">Stripe Connect, splits, saques, disputas e relatórios</p>
            </div>
          </TabsContent>

          <TabsContent value="moderation">
            <div className="glass rounded-2xl p-6 text-center py-20">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Moderação</h3>
              <p className="text-muted-foreground">KYC, verificação facial, conteúdo reportado, antifraude</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
