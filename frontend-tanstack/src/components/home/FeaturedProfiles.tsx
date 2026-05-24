import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, MapPin, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { api } from '@/lib/api'
import type { Professional } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any): Professional {
  return {
    ...raw,
    name: raw.user?.name ?? raw.name ?? '',
    categories: Array.isArray(raw.categories) ? raw.categories.map((c: any) => typeof c === 'string' ? c : c.name) : [],
    languages: Array.isArray(raw.languages) ? raw.languages.map((l: any) => typeof l === 'string' ? l : l.language) : [],
    services: Array.isArray(raw.services) ? raw.services.map((s: any) => typeof s === 'string' ? s : s.name) : [],
    photos: Array.isArray(raw.photos) ? raw.photos.map((p: any) => typeof p === 'string' ? p : p.url) : [],
    availability: Array.isArray(raw.availability) ? raw.availability : [],
  }
}

function ProfileCard({ professional, index }: { professional: Professional; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to="/profile/$slug" params={{ slug: professional.slug }}>
        <div className="group relative rounded-2xl overflow-hidden glass hover:border-brand-500/30 transition-all duration-300 cursor-pointer">
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={professional.photos[0] || `https://i.pravatar.cc/600?u=${professional.slug}`}
              alt={professional.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <div className="absolute top-3 left-3 flex gap-2">
              {professional.verified && (
                <Badge className="bg-brand-500/90 text-white border-0 gap-1">
                  <Shield className="w-3 h-3" /> Verificada
                </Badge>
              )}
              {professional.premium && (
                <Badge className="gradient-gold text-black border-0 gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </Badge>
              )}
            </div>

            {professional.online && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-sm px-2 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300">Online</span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-lg font-bold text-white mb-1">{professional.name}, {professional.age}</h3>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {professional.city}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" /> {professional.rating}
                  <span className="text-white/50">({professional.reviewCount})</span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">A partir de</p>
              <p className="text-lg font-bold text-brand-400">
                R$ {professional.pricePerHour}<span className="text-sm font-normal text-muted-foreground">/h</span>
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {professional.categories.slice(0, 2).map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs bg-white/5">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function FeaturedProfiles() {
  const [featured, setFeatured] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/discovery/search', { params: { verified: true, online: true, limit: 8, sortBy: 'rating' } })
      .then(({ data }) => {
        const items = data.items ?? data
        setFeatured(Array.isArray(items) ? items.map(normalize) : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
              Perfis em <span className="text-gradient">destaque</span>
            </h2>
            <p className="text-muted-foreground">Profissionais verificadas e mais bem avaliadas</p>
          </div>
          <Link to="/search">
            <Button variant="ghost" className="text-brand-400 hover:text-brand-300 gap-2">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : featured.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Nenhuma profissional online no momento</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((professional, i) => (
              <ProfileCard key={professional.id} professional={professional} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
