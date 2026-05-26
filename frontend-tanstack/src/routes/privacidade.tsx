import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/privacidade')({
  component: PrivacidadePage,
})

function PrivacidadePage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Eye className="w-8 h-8 text-brand-400" />
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        </div>
        <p className="text-muted-foreground mb-8">Última atualização: maio de 2026</p>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="text-lg font-bold mb-2">1. Dados coletados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Coletamos: nome, email, telefone, fotos de perfil, dados de verificação (selfie e documento para KYC), localização (quando autorizada), dados de pagamento (processados pelo Stripe, não armazenados por nós), mensagens de chat e histórico de agendamentos.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">2. Uso dos dados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Utilizamos seus dados para: operar a plataforma, verificar identidades, processar pagamentos, enviar notificações, melhorar a experiência, garantir segurança (alertas de pânico, check-ins), e cumprir obrigações legais.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">3. Compartilhamento</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Compartilhamos dados apenas com: Stripe (pagamentos), Cloudinary (armazenamento de mídia), e autoridades quando requisitado judicialmente. Nunca vendemos dados pessoais a terceiros.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">4. Armazenamento e segurança</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. Senhas são hasheadas com bcrypt. Tokens JWT expiram periodicamente. Autenticação MFA disponível.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">5. Seus direitos</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Conforme a LGPD, você tem direito a: acessar seus dados, corrigir informações, solicitar exclusão, portar dados, revogar consentimento e solicitar informações sobre tratamento. Entre em contato via suporte@baas.app.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">6. Cookies</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Utilizamos cookies essenciais para autenticação (JWT armazenado em localStorage). Não utilizamos cookies de rastreamento ou publicidade de terceiros.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">7. Retenção</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão, dados são removidos em até 30 dias, exceto quando exigido por lei (registros fiscais: 5 anos).</p>
          </section>
        </div>
      </div>
    </div>
  )
}
