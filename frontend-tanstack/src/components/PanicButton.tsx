import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2, Check } from 'lucide-react'
import { api, extractError } from '@/lib/api'
import { toast } from 'sonner'

interface PanicButtonProps {
  bookingId?: string
}

export function PanicButton({ bookingId }: PanicButtonProps) {
  const [holding, setHolding] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [progress, setProgress] = useState(0)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const triggerPanic = useCallback(async () => {
    setSending(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true })
      }).catch(() => null)

      await api.post('/safety/panic', {
        lat: position?.coords.latitude,
        lng: position?.coords.longitude,
        accuracy: position?.coords.accuracy,
        bookingId: bookingId || undefined,
        message: 'Alerta de pânico acionado pelo app',
      })
      setSent(true)
      toast.success('Alerta enviado! Seus contatos de emergência foram notificados.')
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setSending(false)
    }
  }, [bookingId])

  const startHold = () => {
    setHolding(true)
    setProgress(0)
    progressInterval.current = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 100))
    }, 100)
    holdTimer.current = setTimeout(() => {
      setHolding(false)
      setProgress(0)
      if (progressInterval.current) clearInterval(progressInterval.current)
      triggerPanic()
    }, 2000)
  }

  const cancelHold = () => {
    setHolding(false)
    setProgress(0)
    if (holdTimer.current) clearTimeout(holdTimer.current)
    if (progressInterval.current) clearInterval(progressInterval.current)
  }

  if (sent) {
    return (
      <div className="fixed bottom-24 right-4 z-50">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-lg">
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <AnimatePresence>
        {holding && (
          <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute -top-8 right-0 text-xs text-red-400 whitespace-nowrap font-medium">
            Segure 2s para enviar alerta
          </motion.p>
        )}
      </AnimatePresence>
      <button
        onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
        onTouchStart={startHold} onTouchEnd={cancelHold}
        disabled={sending}
        className="relative w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 flex items-center justify-center transition-transform active:scale-95"
      >
        {sending ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <AlertTriangle className="w-6 h-6 text-white" />}
        {holding && (
          <svg className="absolute inset-0 w-14 h-14 -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="white" strokeWidth="3"
              strokeDasharray={`${progress * 1.508} 999`} strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
