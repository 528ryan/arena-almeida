'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { atualizarNome } from '@/app/actions/perfil'

interface Props {
  nomeInicial: string
}

export default function EditarNome({ nomeInicial }: Props) {
  const [editando, setEditando]      = useState(false)
  const [nome, setNome]              = useState(nomeInicial)
  const [erro, setErro]              = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function cancelar() {
    setNome(nomeInicial)
    setErro(null)
    setEditando(false)
  }

  function salvar() {
    setErro(null)
    startTransition(async () => {
      const result = await atualizarNome(nome)
      if (result.error) {
        setErro(result.error)
      } else {
        setEditando(false)
        router.refresh()
      }
    })
  }

  if (!editando) {
    return (
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-black text-white">{nome}</h2>
        <button
          onClick={() => setEditando(true)}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors"
          aria-label="Editar nome"
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs px-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter')  salvar()
            if (e.key === 'Escape') cancelar()
          }}
          autoFocus
          maxLength={50}
          className="flex-1 border-2 border-white/40 rounded-xl px-3 py-2 bg-white/10 text-white font-bold text-base outline-none focus:border-[#FFDF00] placeholder-white/40"
          placeholder="Seu nome"
        />
        <button
          onClick={salvar}
          disabled={isPending}
          className="w-9 h-9 rounded-full bg-[#009C3B] text-white flex items-center justify-center disabled:opacity-60 active:scale-95 transition-transform"
        >
          {isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Check className="w-4 h-4" />
          }
        </button>
        <button
          onClick={cancelar}
          disabled={isPending}
          className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-60 active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {erro && <p className="text-xs text-red-300 px-1">{erro}</p>}
    </div>
  )
}
