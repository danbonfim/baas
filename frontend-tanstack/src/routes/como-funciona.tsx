import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Search, MessageCircle, Calendar, CreditCard, Shield, Star, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/como-funciona')({
  component: ComoFuncionaPage,
})

const steps = [
  {
    icon: Search,
    title: 'Explore perfis verificados',
    description: 'Navegue por profissionais verificadas com fotos reais, avaliações de clientes e informações detalhadas. Use filtros por cidade, categoria, preço e disponibilidade.',
  },
  {
    icon: UserCheck,
    title: 'Verificação de identidade',
    description: 'Todas as profissionais passam por verificação KYC com selfie e documento. Você sabe que está falando com quem realmente aparece nas fotos.',
  },
  {
    icon: MessageCircle,
    title: 'Converse com segurança',
    description: 'Use nosso chat criptografado para combinar detalhes. Suas conversas são privadas e protegidas.',
  },
  {
    icon: Calendar,
    title: 'Agende seu encontro',
    description: 'Escolha data, horário e duração diretamente pela plataforma. A profissional confirma em minutos.',
  },
  {
    icon: CreditCard,
    title: 'Pagamento seguro via Stripe',
    description: 'Pague com cartão de crédito de forma segura. O valor só é processado após confirmação. Sem surpresas.',
  },
  {
    icon: Shield,
    title: 'Botão de pânico e check-in',
    description: 'Profissionais contam com botão de emergência, check-ins automáticos e contatos de emergência para máxima segurança.',
  },
  {
    icon: Star,
    title: 'Avalie a experiência',
    description: 'Após o encontro, deixe uma avaliação. Isso ajuda a comunidade e premia as melhores profissionais.',
  },
]

function ComoFuncionaPage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Como funciona</h1>
        <p className="text-muted-foreground mb-10">Entenda o passo a passo para usar a plataforma com segurança e praticidade.</p>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="glass rounded-2xl p-6 flex gap-5 items-start">
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-brand-400">Passo {i + 1}</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/search">
            <Button size="lg" className="gradient-brand text-white h-12 px-8">
              <Search className="w-5 h-5 mr-2" /> Começar a explorar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
