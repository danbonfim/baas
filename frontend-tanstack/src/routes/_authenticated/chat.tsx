import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Send, ArrowLeft, Loader2, Wifi, WifiOff, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChat, type Conversation, type ChatMessage } from '@/hooks/useChat'
import { useAuthStore } from '@/store/auth.store'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const Route = createFileRoute('/_authenticated/chat')({
  component: ChatPage,
})

function formatTime(iso: string) {
  try { return format(new Date(iso), 'HH:mm') } catch { return '' }
}

function formatConvTime(iso?: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isToday(d)) return format(d, 'HH:mm')
    if (isYesterday(d)) return 'Ontem'
    return format(d, 'dd/MM')
  } catch { return '' }
}

function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { label: string; messages: ChatMessage[] }[] = []
  let lastLabel = ''
  messages.forEach((msg) => {
    try {
      const d = new Date(msg.createdAt)
      let label = format(d, 'dd/MM/yyyy')
      if (isToday(d)) label = 'Hoje'
      else if (isYesterday(d)) label = 'Ontem'
      if (label !== lastLabel) { groups.push({ label, messages: [] }); lastLabel = label }
      groups[groups.length - 1].messages.push(msg)
    } catch {
      if (groups.length === 0) groups.push({ label: 'Hoje', messages: [] })
      groups[groups.length - 1].messages.push(msg)
    }
  })
  return groups
}

function ConversationItem({ conv, isActive, myId, onClick }: { conv: Conversation; isActive: boolean; myId: string; onClick: () => void }) {
  const partnerName = conv.partner?.name ?? (conv.clientId === myId ? 'Profissional' : 'Cliente')
  const lastMsg = conv.messages[conv.messages.length - 1]
  const initials = partnerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const unread = conv.unreadCount ?? 0
  return (
    <button onClick={onClick} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${isActive ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : ''}`}>
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-400">{initials}</div>
        {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-brand text-white text-[10px] flex items-center justify-center">{unread}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate">{partnerName}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatConvTime(conv.lastMessageAt)}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {lastMsg ? (lastMsg.senderId === myId ? `Você: ${lastMsg.content}` : lastMsg.content) : 'Nenhuma mensagem ainda'}
        </p>
      </div>
    </button>
  )
}

function MessageBubble({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'gradient-brand text-white rounded-br-sm' : 'glass text-foreground rounded-bl-sm'}`}>
        <p className="leading-relaxed break-words">{msg.content}</p>
        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
          {formatTime(msg.createdAt)}{isMine && msg.read && ' ✓✓'}
        </p>
      </div>
    </motion.div>
  )
}

function ChatPage() {
  const { ready, user } = useRequireAuth()
  const { token } = useAuthStore()
  const { conversations, activeConversation, messages, connected, loading, selectConversation, sendMessage, setActiveConversation } = useChat()

  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true
    return (c.partner?.name ?? '').toLowerCase().includes(search.toLowerCase())
  })

  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setShowSidebar(false)
    await selectConversation(conv)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [selectConversation])

  const handleSend = async () => {
    const text = newMessage.trim()
    if (!text || !activeConversation) return
    setNewMessage('')
    setSending(true)
    await sendMessage(text)
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!ready || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>

  const messageGroups = groupMessagesByDate(messages)
  const partnerName = activeConversation
    ? (activeConversation.partner?.name ?? (activeConversation.clientId === user.id ? 'Profissional' : 'Cliente'))
    : 'Conversa'

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-white/10 bg-background/50 flex-shrink-0`}>
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold mb-3">Mensagens</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar conversa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/5 border-white/10 h-9 text-sm" />
          </div>
        </div>
        <div className={`px-4 py-2 flex items-center gap-1.5 text-xs border-b border-white/5 ${connected ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? 'Online' : 'Reconectando...'}
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-brand-400" /></div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">{search ? 'Nenhuma conversa encontrada' : 'Sem mensagens ainda'}</p>
              <p className="text-xs text-muted-foreground">{search ? 'Tente outro nome' : 'Explore perfis e inicie uma conversa'}</p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conv) => (
                <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} myId={user.id} onClick={() => handleSelectConversation(conv)} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}>
        {activeConversation ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 glass">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted-foreground" onClick={() => { setShowSidebar(true); setActiveConversation(null) }}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-400 flex-shrink-0">
                {partnerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{partnerName}</p>
                <p className={`text-xs flex items-center gap-1 ${connected ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                  {connected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                  <p className="text-xs text-muted-foreground">Seja o primeiro a dizer olá 👋</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messageGroups.map((group) => (
                    <div key={group.label}>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] text-muted-foreground px-2">{group.label}</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                      <div className="space-y-2">
                        {group.messages.map((msg) => <MessageBubble key={msg.id} msg={msg} isMine={msg.senderId === user.id} />)}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-white/10 glass">
              <div className="flex items-center gap-3">
                <Input ref={inputRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Digite uma mensagem..." className="flex-1 bg-white/5 border-white/10 h-10" disabled={sending} />
                <Button onClick={handleSend} disabled={!newMessage.trim() || sending} className="gradient-brand text-white h-10 w-10 p-0 flex-shrink-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-brand-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Suas mensagens</h2>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">Selecione uma conversa ao lado ou explore perfis para iniciar uma nova</p>
            <Button className="md:hidden gradient-brand text-white gap-2" onClick={() => setShowSidebar(true)}>Ver conversas</Button>
          </div>
        )}
      </div>
    </div>
  )
}
