'use client'

import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/config/plans'
import Link from 'next/link'

const planIcons = [Zap, Sparkles, Crown]

export function PlansSection() {
  return (
    <section className="py-20 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-950/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Planos de <span className="text-gradient-gold">assinatura</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Assine e receba créditos mensais, cashback, acesso VIP e benefícios exclusivos.
            Modelo Netflix — cancele quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => {
            const Icon = planIcons[i]
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative rounded-2xl p-6 ${
                  plan.popular
                    ? 'glass-strong border-brand-500/30 ring-1 ring-brand-500/20'
                    : 'glass'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-brand text-white border-0 px-4">
                    Mais popular
                  </Badge>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.popular ? 'gradient-brand' : 'bg-white/5'
                  }`}>
                    <Icon className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-brand-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.credits} créditos/mês</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-bold">{plan.price.toFixed(2).split('.')[0]}</span>
                    <span className="text-lg text-muted-foreground">,{plan.price.toFixed(2).split('.')[1]}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-brand-400 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/register">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'gradient-brand text-white hover:opacity-90'
                        : 'bg-white/5 hover:bg-white/10 text-foreground'
                    }`}
                  >
                    Começar agora
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
