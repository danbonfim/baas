'use client'

import { useState, useEffect, useCallback } from 'react'
import { api, extractError } from '@/lib/api'
import { toast } from 'sonner'

export interface BookingData {
  id: string
  professionalId: string
  clientId: string
  date: string
  startTime: string
  endTime: string
  durationHours: number
  totalAmount: number
  platformFeeAmount: number
  professionalAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'
  location?: string
  notes?: string
  createdAt: string
  professional?: {
    user: { name: string; avatar?: string }
    city: string
    pricePerHour: number
  }
  client?: {
    user: { name: string; avatar?: string }
  }
}

interface CreateBookingPayload {
  professionalId: string
  date: string
  startTime: string
  endTime: string
  durationHours: number
  location?: string
  notes?: string
}

export function useMyBookings(status?: string) {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = status ? { status } : {}
      const { data } = await api.get<BookingData[]>('/bookings/my', { params })
      setBookings(data)
    } catch (e) {
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetch() }, [fetch])

  return { bookings, loading, error, refetch: fetch }
}

export function useProfessionalBookings(status?: string) {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = status ? { status } : {}
    api.get<BookingData[]>('/bookings/professional', { params })
      .then(({ data }) => setBookings(data))
      .finally(() => setLoading(false))
  }, [status])

  return { bookings, loading }
}

export function useCreateBooking() {
  const [loading, setLoading] = useState(false)

  const createBooking = useCallback(async (payload: CreateBookingPayload) => {
    setLoading(true)
    try {
      const { data } = await api.post<BookingData>('/bookings', payload)
      toast.success('Agendamento criado! Aguardando confirmação.')
      return data
    } catch (e) {
      toast.error(extractError(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmBooking = useCallback(async (id: string) => {
    try {
      const { data } = await api.patch<BookingData>(`/bookings/${id}/confirm`)
      toast.success('Agendamento confirmado!')
      return data
    } catch (e) {
      toast.error(extractError(e))
      return null
    }
  }, [])

  const cancelBooking = useCallback(async (id: string, reason?: string) => {
    try {
      const { data } = await api.patch<BookingData>(`/bookings/${id}/cancel`, { reason })
      toast.success('Agendamento cancelado.')
      return data
    } catch (e) {
      toast.error(extractError(e))
      return null
    }
  }, [])

  return { loading, createBooking, confirmBooking, cancelBooking }
}

export function usePaymentIntent(bookingId: string | null) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const createIntent = useCallback(async (bId: string) => {
    setLoading(true)
    try {
      const { data } = await api.post<{ clientSecret: string }>(`/payments/bookings/${bId}/intent`)
      setClientSecret(data.clientSecret)
      return data.clientSecret
    } catch (e) {
      toast.error(extractError(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (bookingId) createIntent(bookingId)
  }, [bookingId, createIntent])

  return { clientSecret, loading, createIntent }
}
