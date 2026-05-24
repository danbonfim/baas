import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StripePayment } from '@/components/StripePayment'
import { api, extractError } from '@/lib/api'
import { toast } from 'sonner'

interface ContentPaywallProps {
  contentId: string
  thumbnailUrl?: string | null
  blurUrl?: string | null
  price: number
  title?: string
  type: 'PHOTO' | 'VIDEO' | 'AUDIO'
  onUnlocked: (url: string) => void
}

export function ContentPaywall({ contentId, thumbnailUrl, blurUrl, price, title, type, onUnlocked }: ContentPaywallProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUnlock = async () => {
    setLoading(true)
    try {
      const { data } = await api.post(`/content/${contentId}/unlock-intent`)
      setClientSecret(data.clientSecret)
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    toast.success('Conteúdo desbloqueado!')
    // Refetch content to get real URL
    api.get(`/content/professional/${contentId}`).then(({ data }) => {
      if (data.url) onUnlocked(data.url)
    }).catch(() => {})
  }

  const bgImage = blurUrl || thumbnailUrl

  return (
    <div className="relative rounded-xl overflow-hidden group">
      {bgImage ? (
        <img src={bgImage} alt={title || 'Premium'} className="w-full aspect-square object-cover filter blur-lg scale-110" />
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-brand-500/20 to-brand-900/20" />
      )}
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center">
        <Lock className="w-8 h-8 text-brand-400 mb-3" />
        {title && <p className="text-sm font-medium mb-1">{title}</p>}
        <p className="text-xs text-muted-foreground mb-3">
          {type === 'PHOTO' ? 'Foto' : type === 'VIDEO' ? 'Vídeo' : 'Áudio'} exclusivo
        </p>

        {!clientSecret ? (
          <Button size="sm" className="gradient-brand text-white gap-1.5" onClick={handleUnlock} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
            Desbloquear R$ {price.toFixed(2)}
          </Button>
        ) : (
          <div className="w-full max-w-xs">
            <StripePayment clientSecret={clientSecret} amount={price} onSuccess={handleSuccess}
              onError={msg => toast.error(msg)} buttonLabel={`Pagar R$ ${price.toFixed(2)}`} />
          </div>
        )}
      </div>
    </div>
  )
}
