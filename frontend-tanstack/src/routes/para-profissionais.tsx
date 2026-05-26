import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Shield, DollarSign, Calendar, BarChart3, Zap, Users, Camera, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/para-profissionais')({
  component: ParaProfissionaisPage,
})

const benefits = [
  { icon: Shield, title: 'Segurança em primeiro lugar', desc: 'Botão de pânico, check-ins automáticos, contatos de emergência e verificação de clientes.' },
  { icon: DollarSign, title: 'Pagamentos garantidos', desc: 'Receba via Stripe Connect direto na sua conta. Sem calote, sem intermediários suspeitos.' },
  { icon: Calendar, title: 'Agenda inteligente', desc: 'Gerencie sua disponibilidade, receba bookings confirmados e organize sua rotina.' },
  { icon: BarChart3, title: 'Dashboard completo', desc: 'Acompanhe faturamento, avaliações, clientes recorrentes e relatório fiscal anual.' },
  { icon: Zap, title: 'Boost de perfil', desc: 'Destaque seu perfil nas buscas e atraia mais clientes com planos de visibilidade.' },
  { icon: Users, title: 'Assinaturas de fãs', desc: 'Ative assinaturas mensais e crie uma renda recorrente com seus clientes fiéis.' },
  { icon: Camera, title: 'Conteúdo exclusivo (PPV)', desc: 'Venda fotos e vídeos exclusivos diretamente pelo seu perfil.' },
  { icon: Bell, title: 'Notificações em tempo real', desc: 'Receba alertas de novos bookings, mensagens e gorjetas instantaneamente.' },
]

function ParaProfissionaisPage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Para profissionais</h1>
        <p className="text-muted-foreground mb-10">Por que trabalhar com a BAAS? Conheça os benefícios de se cadastrar na plataforma.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <div key={i} className="glass rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <b.icon className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 glass rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Pronta para começar?</h2>
          <p className="text-muted-foreground text-sm mb-6">Cadastre-se gratuitamente e comece a receber clientes verificados hoje.</p>
          <Link to="/auth/register">
            <Button size="lg" className="gradient-brand text-white h-12 px-8">
              Criar minha conta profissional
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
