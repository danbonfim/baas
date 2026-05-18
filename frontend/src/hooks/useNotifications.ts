'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export interface Notification {
  id: string
  title: string
  body: string
  type: string
  read: boolean
  data?: any
  createdAt: string
}

export function useNotifications() {
  const { isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.read).length)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/read-all', {})
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const markRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  return { notifications, unreadCount, loading, fetchNotifications, markAllRead, markRead }
}
