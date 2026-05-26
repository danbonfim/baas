import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/cookies')({
  component: CookiesPage,
})

const cookieTypes = [
  {
    name: 'Essenciais',
    required: true,
    desc: 'Necessários para o funcionamento da plataforma. Incluem token de autenticação (JWT) e preferências de sessão.',
    examples: ['auth_token — Autenticação do usuário', 'session_id — Identificação da sessão'],
  },
  {
    name: 'Funcionais',
    required: false,
    desc: 'Melhoram a experiência do usuário, como preferências de idioma, tema e última cidade pesquisada.',
    examples: ['user_prefs — Preferências salvas', 'last_search — Última busca realizada'],
  },
  {
    name: 'Analíticos',
    required: false,
    desc: 'Nos ajudam a entender como a plataforma é utilizada para melhorar o serviço. Dados anonimizados.',
    examples: ['Nenhum cookie analítico de terceiros no momento'],
  },
  {
    name: 'Marketing',
    required: false,
    desc: 'Usados para publicidade personalizada.',
    examples: ['Não utilizamos cookies de marketing ou rastreamento'],
  },
]

function CookiesPage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Cookie className="w-8 h-8 text-brand-400" />
          <h1 className="text-3xl font-bold">Política de Cookies</h1>
        </div>
        <p className="text-muted-foreground mb-8">Última atualização: maio de 2026</p>

        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold mb-3">O que são cookies?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Cookies são pequenos arquivos de texto armazenados no seu navegador. Eles permitem que a plataforma funcione corretamente, lembre suas preferências e melhore sua experiência.</p>
        </div>

        <div className="space-y-4">
          {cookieTypes.map((type) => (
            <div key={type.name} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{type.name}</h3>
                {type.required ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400">Obrigatório</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">Opcional</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{type.desc}</p>
              <ul className="space-y-1">
                {type.examples.map((ex, i) => (
                  <li key={i} className="text-xs text-muted-foreground/70 font-mono">• {ex}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 mt-6">
          <h2 className="text-lg font-bold mb-3">Como gerenciar cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Você pode gerenciar cookies nas configurações do seu navegador. Note que desabilitar cookies essenciais impedirá o funcionamento da plataforma. Para mais informações sobre seus direitos, consulte nossa <Link to="/lgpd" className="text-brand-400 hover:underline">página sobre LGPD</Link>.</p>
        </div>
      </div>
    </div>
  )
}
