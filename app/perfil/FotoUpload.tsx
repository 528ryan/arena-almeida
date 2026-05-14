'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  fotoUrl: string | null
  nome: string
}

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function FotoUpload({ userId, fotoUrl, nome }: Props) {
  const [preview, setPreview]   = useState<string | null>(fotoUrl)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro]           = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setErro(null)

    if (file.size > 5 * 1024 * 1024) {
      setErro('Arquivo muito grande (máx. 5 MB)')
      return
    }

    // Mostra preview local imediatamente
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    const supabase = createClient()
    const ext      = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${userId}/avatar.${ext}`

    const { error: upErr } = await supabase.storage
      .from('avatares')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (upErr) {
      setPreview(fotoUrl)
      setErro('Falha no upload. Tente novamente.')
      setUploading(false)
      return
    }

    // Gera URL pública com cache-buster para forçar re-fetch
    const { data: { publicUrl } } = supabase.storage
      .from('avatares')
      .getPublicUrl(filePath)

    const fotoComTs = `${publicUrl}?t=${Date.now()}`

    await supabase
      .from('perfis')
      .update({ foto_url: fotoComTs })
      .eq('id', userId)

    setPreview(fotoComTs)
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="relative w-24 h-24">
      {/* Avatar clicável */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full h-full rounded-full overflow-hidden border-4 border-[#FFDF00] shadow-lg active:scale-95 transition-transform disabled:opacity-80"
        aria-label="Alterar foto de perfil"
      >
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview}
            alt={nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full bg-[#009C3B] flex items-center justify-center text-white font-black text-3xl"
          >
            {iniciais(nome)}
          </div>
        )}
      </button>

      {/* Badge câmera */}
      <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#002776] border-2 border-white flex items-center justify-center pointer-events-none shadow">
        {uploading
          ? <Loader2 className="w-4 h-4 text-white animate-spin" />
          : <Camera className="w-4 h-4 text-white" />
        }
      </div>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {/* Erro */}
      {erro && (
        <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-red-300 font-semibold">
          {erro}
        </p>
      )}
    </div>
  )
}
