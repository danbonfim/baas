import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, DollarSign, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 gradient-brand opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />

          <div className="relative grid md:grid-cols-2 gap-8 p-8 sm:p-12 lg:p-16">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                É profissional? Monetize seu perfil.
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Cadastre-se gratuitamente, receba pagamentos direto na sua conta via Stripe,
                gerencie sua agenda e aumente sua visibilidade com boost.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: DollarSign, value: 'R$ 0', label: 'Taxa de cadastro' },
                  { icon: TrendingUp, value: '85%', label: 'Você recebe' },
                  { icon: Users, value: '50k+', label: 'Clientes ativos' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon className="w-6 h-6 text-white/80 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/60">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Link to="/auth/register">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90 gap-2">
                  <Sparkles className="w-5 h-5" />
                  Cadastrar como profissional
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="hidden md:flex items-center justify-center">
              <div className="glass-strong rounded-2xl p-6 max-w-sm w-full">
                <div className="text-white/90 text-sm font-medium mb-4">Seus ganhos estimados</div>
                <div className="space-y-3">
                  {[
                    { label: 'Atendimentos', value: '20/mês' },
                    { label: 'Ticket médio', value: 'R$ 500' },
                    { label: 'Receita bruta', value: 'R$ 10.000' },
                    { label: 'Taxa plataforma (15%)', value: '- R$ 1.500' },
                    { label: 'Você recebe', value: 'R$ 8.500', bold: true },
                  ].map((row) => (
                    <div key={row.label} className={`flex justify-between ${row.bold ? 'pt-3 border-t border-white/20' : ''}`}>
                      <span className={`text-sm ${row.bold ? 'text-white font-bold' : 'text-white/70'}`}>{row.label}</span>
                      <span className={`text-sm ${row.bold ? 'text-white font-bold text-lg' : 'text-white/90'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
