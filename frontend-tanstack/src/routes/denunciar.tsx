import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, Flag, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export const Route = createFileRoute('/denunciar')({
  component: DenunciarPage,
})

const reasons = [
  'Perfil falso ou não verificado',
  'Comportamento abusivo ou ameaça',
  'Fotos falsas ou enganosas',
  'Tentativa de golpe ou fraude',
  'Menor de idade',
  'Conteúdo ilegal',
  'Spam ou publicidade',
  'Outro',
]

function DenunciarPage() {
  const [reason, setReason] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason || !details) { toast.error('Selecione o motivo e descreva a situação'); return }
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Denúncia recebida. Nossa equipe analisará em até 24h.')
    setReason(''); setProfileUrl(''); setDetails(''); setEmail('')
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
          <Flag className="w-8 h-8 text-red-400" />
          <h1 className="text-3xl font-bold">Denunciar</h1>
        </div>
        <p className="text-muted-foreground mb-8">Ajude a manter a plataforma segura. Todas as denúncias são analisadas pela equipe.</p>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Motivo da denúncia *</Label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map(r => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`text-left text-sm p-3 rounded-xl border transition-colors ${reason === r ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Link do perfil (opcional)</Label>
            <Input value={profileUrl} onChange={e => setProfileUrl(e.target.value)} placeholder="https://baas.app/profile/..." className="bg-white/5 border-white/10" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Seu email (para acompanhamento)</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white/5 border-white/10" />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Descreva a situação *</Label>
            <Textarea value={details} onChange={e => setDetails(e.target.value)} rows={5} placeholder="Conte com detalhes o que aconteceu..." className="bg-white/5 border-white/10" />
          </div>
          <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white gap-2" disabled={sending}>
            <Send className="w-4 h-4" /> {sending ? 'Enviando...' : 'Enviar denúncia'}
          </Button>
        </form>
      </div>
    </div>
  )
}
