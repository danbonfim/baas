import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Shield, AlertTriangle, MapPin, UserCheck, Lock, Eye, Phone, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/seguranca')({
  component: SegurancaPage,
})

const features = [
  { icon: UserCheck, title: 'Verificação KYC', desc: 'Todas as profissionais enviam selfie + documento para verificação. Perfis verificados exibem selo de autenticidade.' },
  { icon: AlertTriangle, title: 'Botão de pânico', desc: 'Em qualquer momento, a profissional pode acionar o alerta de emergência. A localização é enviada automaticamente para contatos de confiança.' },
  { icon: MapPin, title: 'Check-in com localização', desc: 'Check-ins periódicos durante encontros com compartilhamento de localização em tempo real.' },
  { icon: Phone, title: 'Contatos de emergência', desc: 'Cadastre até 3 contatos que serão notificados automaticamente em caso de emergência.' },
  { icon: Lock, title: 'Chat criptografado', desc: 'Todas as mensagens são privadas. Nenhum dado de conversa é compartilhado com terceiros.' },
  { icon: Eye, title: 'Perfil de clientes', desc: 'Profissionais podem ver o histórico de avaliações de clientes, bloquear e reportar comportamentos inadequados.' },
  { icon: Shield, title: 'Pagamento seguro', desc: 'Pagamentos processados via Stripe com proteção contra fraude. Nenhum dado de cartão é armazenado no nosso servidor.' },
  { icon: FileCheck, title: 'Conformidade LGPD', desc: 'Todos os dados são tratados conforme a Lei Geral de Proteção de Dados. Você pode solicitar exclusão a qualquer momento.' },
]

function SegurancaPage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-brand-400" />
          <h1 className="text-3xl font-bold">Segurança</h1>
        </div>
        <p className="text-muted-foreground mb-10">Sua segurança é nossa prioridade. Conheça tudo que fazemos para proteger você.</p>

        <div className="space-y-4">
          {features.map((f, i) => (
            <div key={i} className="glass rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
