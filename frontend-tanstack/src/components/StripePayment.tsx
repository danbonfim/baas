import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, CreditCard } from 'lucide-react'

interface StripePaymentProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError?: (msg: string) => void
  buttonLabel?: string
}

function CheckoutForm({ amount, onSuccess, onError, buttonLabel }: Omit<StripePaymentProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/dashboard/client' },
      redirect: 'if_required',
    })
    if (error) {
      onError?.(error.message ?? 'Erro no pagamento')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-4 h-4 shrink-0" /> Dados criptografados e protegidos pela LGPD.
      </div>
      <Button type="submit" disabled={!stripe || loading} className="w-full gradient-brand text-white h-12 gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
        {buttonLabel ?? `Pagar R$ ${amount.toFixed(2)}`}
      </Button>
    </form>
  )
}

export function StripePayment({ clientSecret, amount, onSuccess, onError, buttonLabel }: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
        <p className="text-sm text-amber-300">Stripe não configurado. Defina VITE_STRIPE_PUBLISHABLE_KEY no .env</p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: {
      theme: 'night',
      variables: { colorPrimary: '#ec4899', colorBackground: '#0f172a', colorText: '#f8fafc', borderRadius: '10px' },
    }}}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} buttonLabel={buttonLabel} />
    </Elements>
  )
}
