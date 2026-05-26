import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/termos')({
  component: TermosPage,
})

function TermosPage() {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-brand-400" />
          <h1 className="text-3xl font-bold">Termos de Uso</h1>
        </div>
        <p className="text-muted-foreground mb-8">Última atualização: maio de 2026</p>

        <div className="glass rounded-2xl p-6 sm:p-8 prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-bold text-foreground">1. Aceitação dos termos</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Ao acessar e utilizar a plataforma BAAS ("Plataforma"), você declara ter pelo menos 18 (dezoito) anos de idade e concorda integralmente com estes Termos de Uso. Se não concordar, não utilize a Plataforma.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">2. Descrição do serviço</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">A BAAS é uma plataforma de intermediação que conecta profissionais de acompanhamento a clientes adultos. A BAAS não presta serviços de acompanhamento, atuando exclusivamente como marketplace tecnológico.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">3. Cadastro e conta</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Para utilizar a Plataforma, é necessário criar uma conta com informações verdadeiras. Você é responsável pela segurança de suas credenciais. Contas com informações falsas serão suspensas. Profissionais devem passar por verificação de identidade (KYC).</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">4. Pagamentos e taxas</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Pagamentos são processados via Stripe. A BAAS cobra uma taxa de intermediação de 15% sobre o valor de cada agendamento. Gorjetas e conteúdos PPV possuem taxas próprias. Reembolsos seguem a política de cancelamento.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">5. Conduta dos usuários</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">É proibido: assédio, ameaças, discriminação, publicação de conteúdo ilegal, tentativa de fraude, criação de perfis falsos, e qualquer atividade que viole a legislação brasileira. Violações resultam em banimento permanente.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">6. Propriedade intelectual</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Todo o conteúdo da Plataforma (marca, design, código) pertence à BAAS. Profissionais retêm os direitos sobre seu conteúdo publicado, concedendo licença de uso à Plataforma para exibição.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">7. Limitação de responsabilidade</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">A BAAS não se responsabiliza por interações entre usuários fora da Plataforma. Fornecemos ferramentas de segurança (botão de pânico, verificação), mas não garantimos a segurança de encontros presenciais.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">8. Cancelamento e encerramento</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Você pode encerrar sua conta a qualquer momento nas configurações. A BAAS pode suspender ou encerrar contas que violem estes termos. Dados serão tratados conforme a Política de Privacidade e LGPD.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">9. Foro</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Este contrato é regido pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
