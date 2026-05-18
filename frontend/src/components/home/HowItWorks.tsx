'use client'

import { motion } from 'framer-motion'
import { UserPlus, Search, Calendar, Shield } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Crie sua conta',
    description: 'Cadastro rápido e seguro. Suas informações são protegidas pela LGPD.',
  },
  {
    icon: Search,
    title: 'Encontre perfis',
    description: 'Busca inteligente com filtros avançados, geolocalização e recomendações por IA.',
  },
  {
    icon: Calendar,
    title: 'Agende & pague',
    description: 'Agende diretamente pelo app e pague com segurança via Stripe.',
  },
  {
    icon: Shield,
    title: 'Experiência segura',
    description: 'Perfis verificados, avaliações reais e suporte 24/7 para sua tranquilidade.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Como <span className="text-gradient">funciona</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Simples, seguro e direto ao ponto. Em 4 passos você tem a experiência premium.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative glass rounded-2xl p-6 text-center hover:border-brand-500/30 transition-colors"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-7 h-7 text-brand-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
