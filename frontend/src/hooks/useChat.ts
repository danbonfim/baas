'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { api, extractError } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  contentType: string
  read: boolean
  readAt?: string
  createdAt: string
}

export interface ConversationPartner {
  id: string
  name: string
  avatar: string | null
}

export interface Conversation {
  id: string
  clientId: string
  professionalId: string
  lastMessageAt?: string
  messages: ChatMessage[]
  partner?: ConversationPartner
  unreadCount?: number
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

export function useChat() {
  const { token, user } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Connect socket ───────────────────────────────────────────
  useEffect(() => {
    if (!token) return

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        // Avoid duplicate if already optimistically added
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessageAt: msg.createdAt,
                messages: [...c.messages, msg],
                unreadCount: msg.senderId !== user?.id ? (c.unreadCount ?? 0) + 1 : c.unreadCount,
              }
            : c,
        ),
      )
    })

    return () => { socket.disconnect() }
  }, [token, user?.id])

  // ── Load conversations ───────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<Conversation[]>('/chat/conversations')
      setConversations(data)
    } catch {
      // silently fail — user might not be authenticated yet
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) loadConversations()
  }, [token, loadConversations])

  // ── Open a conversation (by professionalId = Professional.id) ──
  const openConversation = useCallback(async (professionalId: string) => {
    try {
      const { data } = await api.post<Conversation>('/chat/conversations', { professionalId })
      setActiveConversation(data)
      const msgs = data.messages ?? []
      setMessages(msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
      socketRef.current?.emit('join_conversation', data.id)
      socketRef.current?.emit('mark_read', data.id)
      // Clear unread in local state
      setConversations((prev) =>
        prev.map((c) => (c.id === data.id ? { ...c, unreadCount: 0 } : c)),
      )
      return data
    } catch (e) {
      toast.error(extractError(e))
      return null
    }
  }, [])

  // ── Select existing conversation and load its messages ──────
  const selectConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv)
    try {
      const { data } = await api.get<ChatMessage[]>(`/chat/conversations/${conv.id}/messages`)
      setMessages(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
      socketRef.current?.emit('join_conversation', conv.id)
      socketRef.current?.emit('mark_read', conv.id)
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      )
    } catch (e) {
      toast.error(extractError(e))
    }
  }, [])

  // ── Send a message ───────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversation || !socketRef.current) return
    socketRef.current.emit('send_message', {
      conversationId: activeConversation.id,
      content,
      contentType: 'text',
    })
  }, [activeConversation])

  return {
    conversations, activeConversation, messages,
    connected, loading,
    openConversation, selectConversation, sendMessage,
    setActiveConversation, refetchConversations: loadConversations,
  }
}
