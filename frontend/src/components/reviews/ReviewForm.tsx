'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSubmitReview, ReviewableBooking } from '@/hooks/useReviews'
import { toast } from 'sonner'

interface ReviewFormProps {
  booking: ReviewableBooking
  onSuccess: () => void
  onCancel: () => void
}

export function ReviewForm({ booking, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const { loading, submitReview } = useSubmitReview()

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Selecione uma avaliação'); return }
    const result = await submitReview(booking.id, rating, comment || undefined)
    if (result) {
      toast.success('Avaliação enviada com sucesso!')
      onSuccess()
    } else {
      toast.error('Erro ao enviar avaliação')
    }
  }

  const proName = booking.professional?.user?.name ?? 'Profissional'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
      <h3 className="font-bold text-lg mb-1">Avaliar {proName}</h3>
      <p className="text-sm text-muted-foreground mb-4">Como foi sua experiência?</p>

      {/* Stars */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hovered || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            {['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Conte como foi sua experiência... (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="bg-white/5 border-white/10 min-h-[100px] mb-4"
      />

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 border-white/10" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          className="flex-1 gradient-brand text-white gap-2"
          onClick={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar avaliação
        </Button>
      </div>
    </motion.div>
  )
}
