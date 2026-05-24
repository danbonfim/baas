import { useState, useRef } from 'react'
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, extractError } from '@/lib/api'
import { toast } from 'sonner'

type UploadKind = 'avatar' | 'photo' | 'kyc_selfie' | 'kyc_document' | 'content' | 'story' | 'message_attachment'

interface CloudinaryUploaderProps {
  kind: UploadKind
  onUpload: (url: string, publicId: string) => void
  accept?: string
  maxSizeMB?: number
  className?: string
  children?: React.ReactNode
  preview?: boolean
}

export function CloudinaryUploader({ kind, onUpload, accept = 'image/*', maxSizeMB = 5, className = '', children, preview = true }: CloudinaryUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${maxSizeMB}MB`)
      return
    }
    setUploading(true)
    try {
      // 1. Get signed upload params
      const { data: sig } = await api.post('/uploads/signature', { kind })

      // 2. Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sig.apiKey)
      formData.append('timestamp', String(sig.timestamp))
      formData.append('signature', sig.signature)
      formData.append('public_id', sig.publicId)
      formData.append('folder', sig.folder)
      if (sig.tags) formData.append('tags', sig.tags)
      if (sig.transformation) formData.append('transformation', sig.transformation)

      const res = await fetch(sig.uploadUrl, { method: 'POST', body: formData })
      const result = await res.json()

      if (result.secure_url) {
        setPreviewUrl(result.secure_url)
        onUpload(result.secure_url, result.public_id)
        toast.success('Upload concluído!')
      } else {
        throw new Error(result.error?.message || 'Erro no upload')
      }
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const clear = () => {
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />

      {children ? (
        <div onClick={() => inputRef.current?.click()} className="cursor-pointer">
          {children}
        </div>
      ) : preview && previewUrl ? (
        <div className="relative inline-block">
          <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
          <button onClick={clear} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="border-white/10 gap-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Enviando...' : 'Escolher arquivo'}
        </Button>
      )}

      {uploading && !children && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Fazendo upload...
        </p>
      )}
    </div>
  )
}
