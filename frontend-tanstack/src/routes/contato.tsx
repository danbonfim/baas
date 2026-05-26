import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, Mail, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export const Route = createFileRoute('/contato')({
  component: ContatoPage,
})

function ContatoPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) { toast.error('Preencha todos os campos obrigatórios'); return }
    setSending(true)
    // Simula envio — substituir por endpoint real quando disponível
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Mensagem enviada! Responderemos em até 24h.')
    setName(''); setEmail(''); setSubject(''); setMessage('')
    setSending(false)
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground gap-2">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-8 h-8 text-brand-400" />
          <h1 className="text-3xl font-bold">Contato</h1>
        </div>
        <p className="text-muted-foreground mb-8">Fale conosco. Respondemos em até 24 horas úteis.</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <Mail className="w-5 h-5 text-brand-400" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">suporte@baas.app</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-brand-400" />
            <div>
              <p className="text-sm font-medium">Chat</p>
              <p className="text-xs text-muted-foreground">Disponível no app para usuários logados</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-1.5 block">Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Assunto</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Opcional" className="bg-white/5 border-white/10" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Mensagem *</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="bg-white/5 border-white/10" />
          </div>
          <Button type="submit" className="gradient-brand text-white gap-2" disabled={sending}>
            <Send className="w-4 h-4" /> {sending ? 'Enviando...' : 'Enviar mensagem'}
          </Button>
        </form>
      </div>
    </div>
  )
}
