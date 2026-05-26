import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ChevronLeft, Check, Loader2, Crown, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  features: string[]
}

export const Route = createFileRoute('/planos')({
  component: PlanosPage,
})

const fallbackPlans: Plan[] = [
  {
    id: 'free',
    name: 'Grátis',
    price: 0,
    interval: 'mês',
    features: ['Busca de profissionais', 'Visualizar perfis', 'Chat básico', 'Avaliações'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49.9,
    interval: 'mês',
    features: ['Tudo do Grátis', 'Perfis em destaque primeiro', 'Chat ilimitado', 'Sem anúncios', 'Histórico completo', 'Suporte prioritário'],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 99.9,
    interval: 'mês',
    features: ['Tudo do Premium', 'Acesso antecipado a novos perfis', 'Badge VIP no chat', 'Descontos exclusivos', 'Conteúdo PPV com desconto', 'Concierge pessoal'],
  },
]

const icons = [Zap, Sparkles, Crown]

function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/subscriptions/plans')
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) setPlans(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Planos e preços</h1>
          <p className="text-muted-foreground">Escolha o plano ideal para sua experiência na plataforma.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const Icon = icons[i] ?? Zap
              const isPopular = i === 1
              return (
                <div key={plan.id} className={`glass rounded-2xl p-6 flex flex-col ${isPopular ? 'border-brand-500/30 ring-1 ring-brand-500/20' : ''}`}>
                  {isPopular && (
                    <div className="gradient-brand text-white text-xs font-bold text-center py-1 rounded-lg mb-4 -mt-1">
                      Mais popular
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 2 ? 'gradient-gold' : i === 1 ? 'gradient-brand' : 'bg-white/10'}`}>
                      <Icon className={`w-5 h-5 ${i === 2 ? 'text-black' : 'text-white'}`} />
                    </div>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm">/{plan.interval || 'mês'}</span>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {(plan.features || []).map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth/register">
                    <Button className={`w-full ${isPopular ? 'gradient-brand text-white' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}>
                      {plan.price === 0 ? 'Começar grátis' : 'Assinar agora'}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
