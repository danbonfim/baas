import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Loader2, Rocket, Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StripePayment } from '@/components/StripePayment'
import { api, extractError } from '@/lib/api'
import { toast } from 'sonner'

interface BoostPlan { type: string; durationDays: number; price: number; multiplier: number; label: string }

const icons = [Zap, Rocket, Crown]

interface BoostSelectorProps {
  open: boolean
  onClose: () => void
}

export function BoostSelector({ open, onClose }: BoostSelectorProps) {
  const [plans, setPlans] = useState<BoostPlan[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      api.get('/boost/plans').then(({ data }) => setPlans(data)).catch(() => {})
    }
  }, [open])

  const handleBuy = async (type: string) => {
    setLoading(true)
    setSelected(type)
    try {
      const { data } = await api.post('/boost/intent', { type })
      setClientSecret(data.clientSecret)
    } catch (e) {
      toast.error(extractError(e))
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    toast.success('Boost ativado! Seu perfil está em destaque.')
    onClose()
    setClientSecret(null)
    setSelected(null)
  }

  if (!open) return null

  const selectedPlan = plans.find(p => p.type === selected)

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold-400" /> Boost de perfil</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
          </div>

          {!clientSecret ? (
            <div className="grid gap-3">
              {plans.map((plan, i) => {
                const Icon = icons[i] ?? Zap
                return (
                  <button key={plan.type} onClick={() => handleBuy(plan.type)} disabled={loading && selected === plan.type}
                    className={`p-4 rounded-xl border transition-all text-left flex items-center gap-4 ${
                      i === 2 ? 'border-gold-500/30 bg-gold-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      i === 2 ? 'gradient-gold' : i === 1 ? 'gradient-brand' : 'bg-white/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${i === 2 ? 'text-black' : 'text-white'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{plan.label}</p>
                      <p className="text-xs text-muted-foreground">{plan.durationDays} dias · {plan.multiplier}x mais visibilidade</p>
                    </div>
                    <div className="text-right">
                      {loading && selected === plan.type ? <Loader2 className="w-5 h-5 animate-spin text-brand-400" /> :
                        <p className="font-bold text-brand-400">R$ {plan.price}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : selectedPlan && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">Pagamento para: <span className="text-foreground font-medium">{selectedPlan.label}</span></p>
              <StripePayment clientSecret={clientSecret} amount={selectedPlan.price} onSuccess={handleSuccess}
                onError={msg => toast.error(msg)} />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
