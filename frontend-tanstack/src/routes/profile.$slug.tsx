import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, MapPin, Shield, Crown, MessageCircle, Calendar,
  Clock, Globe, ChevronLeft, ChevronRight, X, Check, Sparkles, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProfessional } from '@/hooks/useProfessionals'
import { useAuthStore } from '@/store/auth.store'
import { api, extractError } from '@/lib/api'
import { useReviews } from '@/hooks/useReviews'
import { toast } from 'sonner'

export const Route = createFileRoute('/profile/$slug')({
  component: ProfilePage,
})

function ProfilePage() {
  const params = Route.useParams() as { slug: string }
  const slug = params.slug
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { professional, loading } = useProfessional(slug)
  const { reviews } = useReviews(professional?.id ?? '')

  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [startingChat, setStartingChat] = useState(false)

  const photos: string[] = professional && Array.isArray(professional.photos) && professional.photos.length > 0
    ? professional.photos
    : [`https://picsum.photos/seed/${slug}/600/800`]

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const handleBooking = () => {
    if (!user) { navigate({ to: '/auth/login' }); return }
    if (!professional) return
    navigate({ to: '/booking', search: { slug, professionalId: professional.id } })
  }

  const handleChat = async () => {
    if (!user) { navigate({ to: '/auth/login' }); return }
    if (!professional) return
    if (user.role !== 'CLIENT') { toast.error('Apenas clientes podem iniciar conversas'); return }
    setStartingChat(true)
    try {
      await api.post('/chat/conversations', { professionalId: professional.id })
      navigate({ to: '/chat' })
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setStartingChat(false)
    }
  }

  if (loading || !professional) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/search">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Photo Gallery */}
          <div>
            <div className="relative rounded-2xl overflow-hidden mb-4">
              <motion.img key={selectedPhoto} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                src={photos[selectedPhoto]} alt={professional.name}
                className="w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] object-cover cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              {photos.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full"
                    onClick={() => setSelectedPhoto((i) => (i - 1 + photos.length) % photos.length)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full"
                    onClick={() => setSelectedPhoto((i) => (i + 1) % photos.length)}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                {professional.verified && <Badge className="bg-brand-500/90 text-white border-0 gap-1"><Shield className="w-3 h-3" />Verificada</Badge>}
                {professional.premium && <Badge className="gradient-gold text-black border-0 gap-1"><Crown className="w-3 h-3" />Premium</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {photos.map((photo, i) => (
                <button key={i} onClick={() => setSelectedPhoto(i)} className={`rounded-lg overflow-hidden aspect-square transition-all ${i === selectedPhoto ? 'ring-2 ring-brand-500' : 'opacity-60 hover:opacity-100'}`}>
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{professional.name}, {professional.age}</h1>
                  <p className="text-muted-foreground text-sm">{professional.tagline}</p>
                </div>
                {professional.online && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400">Online</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-4 h-4" /> {professional.city}, {professional.state}</span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                  <span className="font-medium">{professional.rating}</span>
                  <span className="text-muted-foreground">({professional.reviewCount})</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {professional.categories.map((c) => <Badge key={c} variant="secondary" className="bg-white/5">{c}</Badge>)}
                {professional.languages.map((l) => <Badge key={l} variant="outline" className="border-white/10 text-muted-foreground gap-1"><Globe className="w-3 h-3" />{l}</Badge>)}
              </div>
              <Separator className="bg-white/10 mb-6" />
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-brand-400">R$ {professional.pricePerHour}</span>
                  <span className="text-muted-foreground">/hora</span>
                </div>
                <p className="text-xs text-muted-foreground">Pagamento seguro via Stripe</p>
              </div>
              <div className="space-y-3">
                <Button className="w-full gradient-brand text-white hover:opacity-90 h-12 gap-2" onClick={handleBooking}>
                  <Calendar className="w-5 h-5" /> Agendar encontro
                </Button>
                <Button variant="outline" className="w-full border-brand-500/30 text-brand-400 hover:bg-brand-500/10 h-12 gap-2" onClick={handleChat} disabled={startingChat}>
                  {startingChat ? <><Loader2 className="w-5 h-5 animate-spin" /> Abrindo chat...</> : <><MessageCircle className="w-5 h-5" /> Enviar mensagem</>}
                </Button>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-brand-400" /> Disponibilidade</h3>
              <div className="grid grid-cols-7 gap-1">
                {daysOfWeek.map((day, i) => {
                  const avail = professional.availability?.find((a) => a.dayOfWeek === i)
                  return (
                    <div key={day} className={`text-center p-2 rounded-lg ${avail ? 'bg-brand-500/10' : 'bg-white/5 opacity-50'}`}>
                      <p className="text-xs font-medium mb-1">{day}</p>
                      {avail ? <p className="text-[10px] text-brand-400">{avail.startTime}<br />{avail.endTime}</p>
                        : <p className="text-[10px] text-muted-foreground">-</p>}
                    </div>
                  )
                })}
              </div>
            </div>

            {professional.services?.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-400" /> Serviços</h3>
                <div className="flex flex-wrap gap-2">
                  {professional.services.map((s) => <Badge key={s} className="bg-brand-500/10 text-brand-400 border-brand-500/20 gap-1"><Check className="w-3 h-3" /> {s}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="about">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="about">Sobre</TabsTrigger>
              <TabsTrigger value="reviews">Avaliações ({reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-4">Sobre mim</h3>
                <p className="text-muted-foreground leading-relaxed">{professional.description}</p>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-4">
                {reviews.length > 0 ? reviews.map((review) => (
                  <div key={review.id} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
                          {review.client?.user?.name?.[0] ?? 'C'}
                        </div>
                        <span className="font-medium text-sm">{review.client?.user?.name ?? 'Cliente'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                )) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Ainda sem avaliações</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/10" onClick={() => setLightboxOpen(false)}>
              <X className="w-6 h-6" />
            </Button>
            <img src={photos[selectedPhoto]} alt="" className="max-w-full max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
