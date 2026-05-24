import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Shield, Phone, Mail, Lock, Loader2, Save, Trash2,
  Plus, QrCode, Key, AlertTriangle, Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CloudinaryUploader } from '@/components/CloudinaryUploader'
import { useAuthStore } from '@/store/auth.store'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { api, extractError } from '@/lib/api'
import { toast } from 'sonner'

interface EmergencyContact {
  id: string; name: string; phone: string; email?: string; relationship?: string; isPrimary: boolean
}

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { ready, user } = useRequireAuth()
  const { setUser } = useAuthStore()

  // Profile
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // MFA
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaSetup, setMfaSetup] = useState<{ qrCode: string; secret: string } | null>(null)
  const [mfaToken, setMfaToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [mfaLoading, setMfaLoading] = useState(false)

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Emergency contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', relationship: '' })
  const [addingContact, setAddingContact] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setPhone('')
    setAvatar(user.avatar || '')
    setMfaEnabled(false)
    // Load current profile
    api.get('/auth/me').then(({ data }) => {
      setPhone(data.phone || '')
      setMfaEnabled(data.mfaEnabled || false)
    }).catch(() => {})
    // Load emergency contacts
    api.get('/safety/emergency-contacts').then(({ data }) => setContacts(data)).catch(() => {})
  }, [user])

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const { data } = await api.patch('/users/profile', {
        name: name || undefined,
        phone: phone || undefined,
        avatar: avatar || undefined,
      })
      if (user) setUser({ ...user, name: data.name || user.name, avatar: data.avatar })
      toast.success('Perfil atualizado!')
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setSavingProfile(false)
    }
  }

  const startMfaSetup = async () => {
    setMfaLoading(true)
    try {
      const { data } = await api.post('/auth/mfa/setup')
      setMfaSetup({ qrCode: data.qrCode, secret: data.secret })
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setMfaLoading(false)
    }
  }

  const enableMfa = async () => {
    if (mfaToken.length !== 6) { toast.error('Digite o código de 6 dígitos'); return }
    setMfaLoading(true)
    try {
      const { data } = await api.post('/auth/mfa/enable', { token: mfaToken })
      setBackupCodes(data.backupCodes || data)
      setMfaEnabled(true)
      setMfaSetup(null)
      setMfaToken('')
      toast.success('MFA ativado!')
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setMfaLoading(false)
    }
  }

  const disableMfa = async () => {
    const pw = prompt('Digite sua senha para desativar MFA:')
    if (!pw) return
    setMfaLoading(true)
    try {
      await api.post('/auth/mfa/disable', { password: pw })
      setMfaEnabled(false)
      toast.success('MFA desativado')
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setMfaLoading(false)
    }
  }

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) { toast.error('Nome e telefone obrigatórios'); return }
    setAddingContact(true)
    try {
      const { data } = await api.post('/safety/emergency-contacts', newContact)
      setContacts(prev => [...prev, data])
      setNewContact({ name: '', phone: '', email: '', relationship: '' })
      setShowAddContact(false)
      toast.success('Contato adicionado!')
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setAddingContact(false)
    }
  }

  const removeContact = async (id: string) => {
    try {
      await api.delete(`/safety/emergency-contacts/${id}`)
      setContacts(prev => prev.filter(c => c.id !== id))
      toast.success('Contato removido')
    } catch (e) {
      toast.error(extractError(e))
    }
  }

  if (!ready || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold mb-6">Configurações</h1>

        <Tabs defaultValue="profile">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="profile" className="gap-1.5"><User className="w-3.5 h-3.5" /> Perfil</TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5"><Shield className="w-3.5 h-3.5" /> Segurança</TabsTrigger>
            <TabsTrigger value="emergency" className="gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Emergência</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="glass rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-2xl font-bold">
                      {name[0]}
                    </div>
                  )}
                  <CloudinaryUploader kind="avatar" onUpload={(url) => setAvatar(url)} className="absolute -bottom-1 -right-1">
                    <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center cursor-pointer shadow-lg">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </div>
                  </CloudinaryUploader>
                </div>
                <div>
                  <p className="font-bold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="grid gap-4">
                <div>
                  <Label className="text-sm mb-1.5 block">Nome</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10" />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Telefone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+5511999999999" className="bg-white/5 border-white/10" />
                </div>
              </div>
              <Button className="gradient-brand text-white gap-2" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-4">
              {/* MFA */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-brand-400" /> Autenticação em dois fatores (MFA)</h3>
                {mfaEnabled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <p className="text-sm text-emerald-300">MFA está ativo. Sua conta está protegida.</p>
                    </div>
                    <Button variant="outline" className="border-red-500/20 text-red-400" onClick={disableMfa} disabled={mfaLoading}>
                      Desativar MFA
                    </Button>
                  </div>
                ) : mfaSetup ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Escaneie o QR code no Google Authenticator:</p>
                    <div className="flex justify-center">
                      <img src={mfaSetup.qrCode} alt="QR Code" className="w-48 h-48 rounded-lg bg-white p-2" />
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1">Chave manual:</p>
                      <p className="text-sm font-mono select-all">{mfaSetup.secret}</p>
                    </div>
                    <div>
                      <Label className="text-sm mb-1.5 block">Código de 6 dígitos</Label>
                      <Input value={mfaToken} onChange={e => setMfaToken(e.target.value)} maxLength={6} placeholder="000000" className="bg-white/5 border-white/10 text-center text-lg tracking-widest" />
                    </div>
                    <Button className="w-full gradient-brand text-white" onClick={enableMfa} disabled={mfaLoading}>
                      {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Ativar MFA
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Adicione uma camada extra de segurança com autenticação por app (TOTP).</p>
                    <Button className="gradient-brand text-white gap-2" onClick={startMfaSetup} disabled={mfaLoading}>
                      {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                      Configurar MFA
                    </Button>
                  </div>
                )}
                {backupCodes && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-bold text-amber-300 mb-2">Códigos de backup — salve em local seguro!</p>
                    <div className="grid grid-cols-2 gap-1">
                      {backupCodes.map((code, i) => (
                        <p key={i} className="text-sm font-mono text-amber-200">{code}</p>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="mt-3 border-amber-500/20 text-amber-300" onClick={() => setBackupCodes(null)}>
                      Entendi, já salvei
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> Contatos de emergência</h3>
                {contacts.length < 3 && (
                  <Button size="sm" variant="outline" className="border-white/10 gap-1.5" onClick={() => setShowAddContact(true)}>
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">Esses contatos serão notificados se você acionar o botão de pânico. Máximo 3.</p>

              <div className="space-y-3">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-bold">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{c.name} {c.isPrimary && <span className="text-xs text-brand-400">(Principal)</span>}</p>
                      <p className="text-xs text-muted-foreground">{c.phone} {c.email && `· ${c.email}`}</p>
                      {c.relationship && <p className="text-xs text-muted-foreground">{c.relationship}</p>}
                    </div>
                    <button onClick={() => removeContact(c.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {contacts.length === 0 && !showAddContact && (
                  <p className="text-center text-sm text-muted-foreground py-6">Nenhum contato cadastrado</p>
                )}
              </div>

              {showAddContact && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-white/5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs mb-1 block">Nome *</Label><Input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/10 h-9 text-sm" /></div>
                    <div><Label className="text-xs mb-1 block">Telefone *</Label><Input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="+5511999999999" className="bg-white/5 border-white/10 h-9 text-sm" /></div>
                    <div><Label className="text-xs mb-1 block">Email</Label><Input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} className="bg-white/5 border-white/10 h-9 text-sm" /></div>
                    <div><Label className="text-xs mb-1 block">Relação</Label><Input value={newContact.relationship} onChange={e => setNewContact(p => ({ ...p, relationship: e.target.value }))} placeholder="mãe, amiga..." className="bg-white/5 border-white/10 h-9 text-sm" /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-white/10" onClick={() => setShowAddContact(false)}>Cancelar</Button>
                    <Button size="sm" className="gradient-brand text-white gap-1" onClick={addContact} disabled={addingContact}>
                      {addingContact ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Salvar
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
