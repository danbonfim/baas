import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, ChevronDown, Search, HelpCircle, MessageCircle, CreditCard, Shield, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/ajuda')({
  component: AjudaPage,
})

const categories = [
  {
    icon: Search,
    title: 'Busca e perfis',
    items: [
      { q: 'Como encontrar profissionais perto de mim?', a: 'Na página de busca, ative a geolocalização ou selecione sua cidade no filtro. Profissionais próximas aparecerão primeiro.' },
      { q: 'O que significa o selo "Verificada"?', a: 'Significa que a profissional passou por verificação KYC com selfie e documento. A identidade foi confirmada pela nossa equipe.' },
      { q: 'Posso favoritar perfis?', a: 'Sim! Clique no coração no perfil da profissional. Acesse suas favoritas no dashboard.' },
    ],
  },
  {
    icon: Calendar,
    title: 'Agendamentos',
    items: [
      { q: 'Como agendar um encontro?', a: 'Acesse o perfil da profissional, clique em "Agendar encontro", escolha data, horário e duração, e confirme o pagamento.' },
      { q: 'Posso cancelar um agendamento?', a: 'Sim, no seu dashboard. Cancelamentos com mais de 24h de antecedência têm reembolso total.' },
      { q: 'Como funciona o reagendamento?', a: 'Acesse o booking no dashboard e clique em reagendar. A profissional precisa confirmar o novo horário.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Pagamentos',
    items: [
      { q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos todos os cartões de crédito e débito via Stripe. PIX em breve.' },
      { q: 'Meus dados do cartão ficam salvos?', a: 'Não. Os dados do cartão são processados diretamente pelo Stripe e nunca tocam nossos servidores.' },
      { q: 'Como funciona a gorjeta?', a: 'No perfil da profissional, clique em "Enviar gorjeta". Escolha o valor e adicione uma mensagem opcional.' },
    ],
  },
  {
    icon: Shield,
    title: 'Segurança',
    items: [
      { q: 'O que é o botão de pânico?', a: 'É um recurso exclusivo para profissionais. Ao segurar por 2 segundos, envia alerta com localização para contatos de emergência.' },
      { q: 'Como ativar a autenticação em dois fatores?', a: 'Vá em Configurações > Segurança > Configurar MFA. Escaneie o QR code com Google Authenticator.' },
      { q: 'Como denunciar um perfil?', a: 'Use a página de denúncia ou entre em contato conosco. Todas as denúncias são analisadas em até 24h.' },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Chat e mensagens',
    items: [
      { q: 'O chat é privado?', a: 'Sim. Apenas você e a profissional veem as mensagens. Não compartilhamos conteúdo de conversas.' },
      { q: 'Posso enviar fotos no chat?', a: 'Sim, use o botão de anexo para enviar imagens pelo chat.' },
      { q: 'Posso apagar mensagens?', a: 'Sim, clique na mensagem e selecione "Apagar". A mensagem será removida para ambos.' },
    ],
  },
]

function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filtered = searchTerm
    ? categories.map(c => ({ ...c, items: c.items.filter(i => i.q.toLowerCase().includes(searchTerm.toLowerCase()) || i.a.toLowerCase().includes(searchTerm.toLowerCase())) })).filter(c => c.items.length > 0)
    : categories

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-8 h-8 text-brand-400" />
          <h1 className="text-3xl font-bold">Central de ajuda</h1>
        </div>
        <p className="text-muted-foreground mb-6">Encontre respostas para as dúvidas mais frequentes.</p>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar pergunta..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        <div className="space-y-6">
          {filtered.map((cat) => (
            <div key={cat.title}>
              <div className="flex items-center gap-2 mb-3">
                <cat.icon className="w-5 h-5 text-brand-400" />
                <h2 className="font-bold">{cat.title}</h2>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => {
                  const key = `${cat.title}-${item.q}`
                  const isOpen = openItems.has(key)
                  return (
                    <div key={key} className="glass rounded-xl overflow-hidden">
                      <button onClick={() => toggle(key)} className="w-full flex items-center justify-between p-4 text-left text-sm font-medium hover:bg-white/5">
                        {item.q}
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
