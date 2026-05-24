import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Clock, CreditCard, Shield, Check, ChevronLeft,
  ChevronRight, MapPin, Star, Sparkles, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfessional } from '@/hooks/useProfessionals'
import { useCreateBooking, usePaymentIntent } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/booking')({
  validateSearch: (search: Record<string, unknown>): { slug: string; professionalId: string } => ({
    slug: String(search.slug ?? ''),
    professionalId: String(search.professionalId ?? ''),
  }),
  component: BookingPage,
})

const timeSlots = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '18:00', '19:00', '20:00', '21:00', '22:00']
const durations = [
  { label: '1 hora', value: 1 },
  { label: '2 horas', value: 2 },
  { label: '3 horas', value: 3 },
  { label: 'Pernoite', value: 8 },
]

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h + hours
  return `${String(total % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function BookingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const search = Route.useSearch() as { slug: string; professionalId: string }
  const slugParam = search.slug
  const profIdParam = search.professionalId

  const { professional: apiPro, loading: proLoading } = useProfessional(slugParam)
  const professional = apiPro

  const { loading: createLoading, createBooking } = useCreateBooking()
  const [bookingId, setBookingId] = useState<string | null>(null)
  const { clientSecret, loading: paymentLoading } = usePaymentIntent(bookingId)

  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(1)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const today = new Date()
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i + 1)
    return d
  })

  const totalAmount = (professional?.pricePerHour ?? 0) * selectedDuration
  const platformFee = totalAmount * 0.15
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  useEffect(() => {
    if (!user) navigate({ to: '/auth/login' })
  }, [user, navigate])

  const handleCreateBooking = useCallback(async () => {
    if (selectedDate === null || !selectedTime || !professional) return
    const date = dates[selectedDate]
    const dateStr = date.toISOString().split('T')[0]
    const endTime = addHours(selectedTime, selectedDuration)
    const professionalId = profIdParam || professional.id
    const booking = await createBooking({
      professionalId, date: dateStr, startTime: selectedTime,
      endTime, durationHours: selectedDuration,
      location: location || undefined, notes: notes || undefined,
    })
    if (booking) { setBookingId(booking.id); setStep(3) }
  }, [selectedDate, selectedTime, selectedDuration, profIdParam, professional, location, notes, dates, createBooking])

  const handleConfirmPayment = useCallback(async () => {
    if (!bookingId) return
    setConfirmed(true)
    toast.success('Agendamento confirmado! A profissional foi notificada.')
    setTimeout(() => navigate({ to: '/dashboard/client' }), 2000)
  }, [bookingId, navigate])

  if (!user || proLoading || !professional) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link to={slugParam ? '/profile/$slug' : '/search'} params={slugParam ? { slug: slugParam } : undefined}>
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        {/* Steps indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'gradient-brand text-white' : 'bg-white/5 text-muted-foreground'}`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Data & horário' : s === 2 ? 'Detalhes' : 'Pagamento'}
              </span>
              {s < 3 && <div className={`w-8 sm:w-16 h-0.5 ${step > s ? 'bg-brand-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          <div>
            {/* Step 1 */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-brand-400" /> Selecione a data</h2>
                  <div className="grid grid-cols-7 gap-2">
                    {dates.map((date, i) => (
                      <button key={i} onClick={() => setSelectedDate(i)} className={`p-3 rounded-xl text-center transition-all ${selectedDate === i ? 'gradient-brand text-white' : 'bg-white/5 hover:bg-white/10'}`}>
                        <p className="text-[10px] opacity-70">{daysOfWeek[date.getDay()]}</p>
                        <p className="text-lg font-bold">{date.getDate()}</p>
                        <p className="text-[10px] opacity-70">{date.toLocaleDateString('pt-BR', { month: 'short' })}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-brand-400" /> Selecione o horário</h2>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {timeSlots.map((time) => (
                      <button key={time} onClick={() => setSelectedTime(time)} className={`p-3 rounded-xl text-center text-sm transition-all ${selectedTime === time ? 'gradient-brand text-white' : 'bg-white/5 hover:bg-white/10'}`}>
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-4">Duração</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {durations.map((d) => (
                      <button key={d.value} onClick={() => setSelectedDuration(d.value)} className={`p-4 rounded-xl text-center transition-all ${selectedDuration === d.value ? 'gradient-brand text-white' : 'bg-white/5 hover:bg-white/10'}`}>
                        <p className="font-bold">{d.label}</p>
                        <p className="text-sm opacity-80">R$ {professional.pricePerHour * d.value}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full gradient-brand text-white h-12" disabled={selectedDate === null || !selectedTime} onClick={() => setStep(2)}>
                  Continuar <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-4">Detalhes do encontro</h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm mb-2 block">Local (opcional)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input placeholder="Restaurante, hotel, endereço..." className="pl-10 bg-white/5 border-white/10" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Observações (opcional)</Label>
                      <Textarea placeholder="Alguma preferência ou informação adicional..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-white/5 border-white/10 min-h-[100px]" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-white/10" onClick={() => setStep(1)}><ChevronLeft className="w-5 h-5 mr-2" /> Voltar</Button>
                  <Button className="flex-1 gradient-brand text-white" onClick={handleCreateBooking} disabled={createLoading}>
                    {createLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : <>Ir para pagamento <ChevronRight className="w-5 h-5 ml-2" /></>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {confirmed ? (
                  <div className="glass rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Agendamento confirmado!</h2>
                    <p className="text-muted-foreground text-sm">A profissional foi notificada e confirmará em breve.</p>
                    <p className="text-xs text-muted-foreground mt-2">Redirecionando...</p>
                  </div>
                ) : (
                  <div className="glass rounded-2xl p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-400" /> Pagamento</h2>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-brand-500/10 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-brand-400 shrink-0" />
                        <p className="text-sm text-brand-300">Pagamento seguro processado via Stripe. O valor só é debitado após confirmação.</p>
                      </div>
                      {paymentLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                          <span className="ml-2 text-sm text-muted-foreground">Preparando pagamento...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-white/5 text-center">
                            <p className="text-xs text-muted-foreground mb-2">Stripe Elements serão carregados aqui</p>
                            <p className="text-sm text-brand-400">{clientSecret ? '✓ Payment Intent criado com sucesso' : 'Configure VITE_STRIPE_KEY para ativar'}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Shield className="w-4 h-4 shrink-0" /> Seus dados são criptografados e protegidos pela LGPD.
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 border-white/10" onClick={() => setStep(2)}><ChevronLeft className="w-5 h-5 mr-2" /> Voltar</Button>
                            <Button className="flex-1 gradient-brand text-white h-12" onClick={handleConfirmPayment}>
                              <Sparkles className="w-5 h-5 mr-2" /> Confirmar R$ {totalAmount.toFixed(2)}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar summary */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5 sticky top-24">
              <div className="flex items-center gap-4 mb-4">
                <img src={Array.isArray(professional.photos) && professional.photos[0] ? professional.photos[0] : `https://picsum.photos/seed/${professional.id}/200/200`} alt={professional.name} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <h3 className="font-bold">{professional.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                    {professional.rating} ({professional.reviewCount})
                  </div>
                  {professional.verified && (
                    <Badge className="bg-brand-500/10 text-brand-400 border-0 text-[10px] mt-1 gap-1">
                      <Shield className="w-3 h-3" /> Verificada
                    </Badge>
                  )}
                </div>
              </div>
              <Separator className="bg-white/10 mb-4" />
              <div className="space-y-3 text-sm">
                {selectedDate !== null && <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span>{dates[selectedDate].toLocaleDateString('pt-BR')}</span></div>}
                {selectedTime && <div className="flex justify-between"><span className="text-muted-foreground">Horário</span><span>{selectedTime} – {addHours(selectedTime, selectedDuration)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Duração</span><span>{durations.find((d) => d.value === selectedDuration)?.label}</span></div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Taxa de serviço (15%)</span><span>R$ {platformFee.toFixed(2)}</span></div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-brand-400">R$ {(totalAmount + platformFee).toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
