import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Shield, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/lgpd')({
  component: LgpdPage,
})

const rights = [
  { title: 'Confirmação e acesso', desc: 'Você pode solicitar a confirmação da existência de tratamento e o acesso aos seus dados pessoais.' },
  { title: 'Correção', desc: 'Solicite a correção de dados incompletos, inexatos ou desatualizados.' },
  { title: 'Anonimização ou eliminação', desc: 'Peça a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.' },
  { title: 'Portabilidade', desc: 'Solicite a portabilidade dos seus dados a outro fornecedor de serviço, em formato estruturado.' },
  { title: 'Eliminação de dados', desc: 'Solicite a eliminação dos dados pessoais tratados com base no seu consentimento.' },
  { title: 'Revogação do consentimento', desc: 'Revogue o consentimento a qualquer momento, sem afetar a licitude do tratamento anterior.' },
  { title: 'Oposição', desc: 'Oponha-se ao tratamento realizado com base em hipóteses de dispensa de consentimento, se irregular.' },
  { title: 'Revisão de decisões automatizadas', desc: 'Solicite a revisão de decisões tomadas unicamente com base em tratamento automatizado de dados.' },
]

function LgpdPage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">LGPD</h1>
        </div>
        <p className="text-muted-foreground mb-8">Seus direitos conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>

        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold mb-4">Seus direitos como titular de dados</h2>
          <div className="space-y-4">
            {rights.map((r, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-medium text-sm">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-4">Como exercer seus direitos</h2>
          <p className="text-sm text-muted-foreground mb-4">Para exercer qualquer um dos direitos acima, entre em contato com nosso Encarregado de Proteção de Dados (DPO):</p>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Mail className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium">dpo@baas.app</p>
              <p className="text-xs text-muted-foreground">Resposta em até 15 dias úteis conforme Art. 18 da LGPD</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 mt-6">
          <h2 className="text-lg font-bold mb-3">Base legal para tratamento</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Execução contratual:</strong> dados necessários para prestar o serviço (perfil, pagamentos, agendamentos)</li>
            <li>• <strong className="text-foreground">Consentimento:</strong> coleta de localização, envio de notificações marketing</li>
            <li>• <strong className="text-foreground">Legítimo interesse:</strong> segurança da plataforma, prevenção a fraudes</li>
            <li>• <strong className="text-foreground">Obrigação legal:</strong> registros fiscais, resposta a ordens judiciais</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
