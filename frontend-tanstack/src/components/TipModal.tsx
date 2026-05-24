import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { StripePayment } from '@/components/StripePayment'
import { api, extractError } from '@/lib/api'
import { toast } from 'sonner'

interface TipModalProps {
  open: boolean
  onClose: () => void
  professionalId: string
  professionalName: string
}

const quickAmounts = [10, 25, 50, 100, 250]

export function TipModal({ open, onClose, professionalId, professionalName }: TipModalProps) {
  const [amount, setAmount] = useState(25)
  const [message, setMessage] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCreateIntent = async () => {
    if (amount < 5 || amount > 5000) { toast.error('Valor entre R$5 e R$5.000'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/tips/intent', { professionalId, amount, message: message || undefined, isPublic })
      setClientSecret(data.clientSecret)
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    toast.success(`Gorjeta de R$${amount} enviada para ${professionalName}!`)
    onClose()
    setClientSecret(null)
    setAmount(25)
    setMessage('')
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
          className="glass rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-brand-400" /> Enviar gorjeta
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">Para <span className="text-foreground font-medium">{professionalName}</span></p>

          {!clientSecret ? (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${amount === v ? 'gradient-brand text-white' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}>
                    R$ {v}
                  </button>
                ))}
              </div>
              <div>
                <Label className="text-xs mb-1 block">Valor personalizado</Label>
                <Input type="number" min={5} max={5000} value={amount} onChange={e => setAmount(Number(e.target.value))}
                  className="bg-white/5 border-white/10" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Mensagem (opcional)</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Obrigado pelo encontro incrível..." className="bg-white/5 border-white/10 h-20" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Gorjeta pública</Label>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
              <Button className="w-full gradient-brand text-white h-11 gap-2" onClick={handleCreateIntent} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                Enviar R$ {amount.toFixed(2)}
              </Button>
            </div>
          ) : (
            <StripePayment clientSecret={clientSecret} amount={amount} onSuccess={handleSuccess}
              onError={msg => toast.error(msg)} buttonLabel={`Confirmar R$ ${amount.toFixed(2)}`} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
