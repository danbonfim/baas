'use client'

import { motion } from 'framer-motion'
import { Search, Shield, CreditCard, Star, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useState } from 'react'

export function HeroSection() {
  const [searchCity, setSearchCity] = useState('')

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/80 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Shield className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-brand-300">Plataforma 100% verificada e segura</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6"
          >
            Encontre{' '}
            <span className="text-gradient">companhia</span>
            <br />
            premium com{' '}
            <span className="text-gradient-gold">segurança</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl"
          >
            Acompanhantes verificadas, pagamentos seguros via Stripe,
            assinaturas com benefícios exclusivos. A experiência que você merece.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mb-12"
          >
            <div className="relative flex-1 max-w-md">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Digite sua cidade..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Link href={`/search${searchCity ? `?city=${searchCity}` : ''}`}>
              <Button size="lg" className="gradient-brand text-white h-12 px-8 hover:opacity-90 w-full sm:w-auto">
                <Search className="w-5 h-5 mr-2" />
                Explorar
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { icon: Shield, label: 'Verificação facial', sublabel: 'Perfis autenticados' },
              { icon: CreditCard, label: 'Pagamento seguro', sublabel: 'Via Stripe' },
              { icon: Star, label: 'Avaliações reais', sublabel: 'Comunidade confiável' },
              { icon: MapPin, label: 'Geolocalização', sublabel: 'Perto de você' },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-4 hover:bg-white/10 transition-colors">
                <item.icon className="w-6 h-6 text-brand-400 mb-2" />
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sublabel}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
