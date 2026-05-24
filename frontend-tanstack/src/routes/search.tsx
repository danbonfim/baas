import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, SlidersHorizontal, Star, Shield, Crown, Grid3X3, LayoutList, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useProfessionals } from '@/hooks/useProfessionals'
import type { Professional } from '@/types'

export const Route = createFileRoute('/search')({
  component: SearchPage,
})

const cities = ['Todas', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Florianópolis', 'Brasília', 'Salvador', 'Recife']
const categories = ['Todas', 'Acompanhante', 'Massagista', 'Modelo', 'Dançarina']

function SearchPage() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Todas')
  const [category, setCategory] = useState('Todas')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: apiData, loading } = useProfessionals({
    city, category, minPrice: priceRange[0], maxPrice: priceRange[1],
    verified: verifiedOnly || undefined, online: onlineOnly || undefined, sortBy,
  })

  const filtered = useMemo<Professional[]>(() => {
    if (!query) return apiData
    const q = query.toLowerCase()
    return apiData.filter((p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q))
  }, [apiData, query])

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-40 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Buscar por nome, cidade..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
            </div>
            <Select value={city} onValueChange={(v) => v && setCity(v)}>
              <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
              <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevância</SelectItem>
                <SelectItem value="rating">Melhor avaliação</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
                <SelectItem value="newest">Mais recentes</SelectItem>
              </SelectContent>
            </Select>
            <Sheet>
              <SheetTrigger className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 border border-white/10 bg-background hover:bg-white/5 cursor-pointer">
                <SlidersHorizontal className="w-4 h-4" /> Filtros
              </SheetTrigger>
              <SheetContent className="bg-card border-white/10">
                <SheetHeader><SheetTitle>Filtros avançados</SheetTitle></SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <Label className="text-sm mb-3 block">Faixa de preço (R$/h)</Label>
                    <Slider min={0} max={1000} step={50} value={priceRange} onValueChange={(v) => setPriceRange(Array.isArray(v) ? [...v] as number[] : [v as number])} className="mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>R$ {priceRange[0]}</span><span>R$ {priceRange[1]}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Apenas verificadas</Label>
                    <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Apenas online agora</Label>
                    <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span className="text-foreground font-medium">{filtered.length}</span> profissionais encontradas
          </p>
          <div className="flex gap-1">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><Grid3X3 className="w-4 h-4" /></Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><LayoutList className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6' : 'space-y-4'}>
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <Link to="/profile/$slug" params={{ slug: p.slug }}>
                  {viewMode === 'grid' ? (
                    <div className="group relative rounded-2xl overflow-hidden glass hover:border-brand-500/30 transition-all cursor-pointer">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          {p.verified && <Badge className="bg-brand-500/90 text-white border-0 text-[10px] gap-1"><Shield className="w-3 h-3" />Verificada</Badge>}
                          {p.premium && <Badge className="gradient-gold text-black border-0 text-[10px] gap-1"><Crown className="w-3 h-3" /></Badge>}
                        </div>
                        {p.online && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-emerald-300">Online</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-base font-bold text-white">{p.name}, {p.age}</h3>
                          <div className="flex items-center gap-2 text-xs text-white/80">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</span>
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold-400 fill-gold-400" />{p.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <p className="text-sm font-bold text-brand-400">R$ {p.pricePerHour}<span className="text-xs font-normal text-muted-foreground">/h</span></p>
                        <div className="flex gap-1">{p.categories.slice(0, 1).map((c) => <Badge key={c} variant="secondary" className="text-[10px] bg-white/5">{c}</Badge>)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="glass rounded-xl p-4 hover:border-brand-500/30 transition-all cursor-pointer flex gap-4">
                      <img src={p.photos[0]} alt={p.name} className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold truncate">{p.name}, {p.age}</h3>
                          {p.verified && <Shield className="w-4 h-4 text-brand-400 shrink-0" />}
                          {p.online && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{p.tagline}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{p.city}</span>
                          <span className="flex items-center gap-1 text-muted-foreground"><Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />{p.rating}</span>
                          <span className="font-bold text-brand-400">R$ {p.pricePerHour}/h</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar seus filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  )
}
