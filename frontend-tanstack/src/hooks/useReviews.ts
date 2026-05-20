import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  client: {
    user: { name: string; avatar?: string | null }
  }
}

export interface ReviewableBooking {
  id: string
  date: string
  durationHours: number
  totalAmount: number
  professional: {
    user: { name: string; avatar?: string | null }
  }
}

export function useReviews(professionalId?: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)

  const fetchReviews = useCallback(async () => {
    if (!professionalId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/reviews/professional/${professionalId}`)
      setReviews(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [professionalId])

  useEffect(() => { fetchReviews() }, [fetchReviews])
  return { reviews, loading, refetch: fetchReviews }
}

export function useReviewableBookings() {
  const { isAuthenticated } = useAuthStore()
  const [bookings, setBookings] = useState<ReviewableBooking[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    setLoading(true)
    api.get('/reviews/reviewable')
      .then(({ data }) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  return { bookings, loading }
}

export function useSubmitReview() {
  const [loading, setLoading] = useState(false)

  const submitReview = useCallback(async (bookingId: string, rating: number, comment?: string) => {
    setLoading(true)
    try {
      const { data } = await api.post('/reviews', { bookingId, rating, comment })
      return data
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, submitReview }
}
