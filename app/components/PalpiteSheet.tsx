'use client'

import { useState, useEffect } from 'react'
import { X, Lock, Pencil, CheckCircle, Loader2, Clock, Share2 } from 'lucide-react'
import ScoreSelector from './ScoreSelector'
import { createClient } from '@/lib/supabase/client'
import FlagImg from './FlagImg'
import { compartilharCard } from '@/lib/shareCard'
import type { Jogo, Palpite } from '@/types'

function isPrazoEncerrado(dataHora: string): boolean {
  const deadline = new Date(dataHora)
  deadline.setHours(deadline.getHours() - 6)
  return new Date() >= deadline
}

function formatarPrazo(dataHora: string): string {
  const deadline = new Date(dataHora)
  deadline.setHours(deadline.getHours() - 6)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(deadline)
}

type SaveStatus = 'idle' | 'saving' | 'saved'

interface Props {
  jogo: Jogo
  palpiteInicial: Palpite | null
  userId: string
  onClose: () => void
  nomeUsuario?: string | null
  avatarUrl?: string | null
}

export default function PalpiteSheet({ jogo, palpiteInicial, userId, onClose, nomeUsuario, avatarUrl }: Props) {
  const [golsA, setGolsA]       = useState(palpiteInicial?.gols_a ?? 0)
  const [golsB, setGolsB]       = useState(palpiteInicial?.gols_b ?? 0)
  const [travado, setTravado]   = useState(palpiteInicial?.travado ?? false)
  const [saveStatus, setSave]   = useState<SaveStatus>('idle')
  const [visible, setVisible]   = useState(false)
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'downloaded'>('idle')

  const isEncerrado   = jogo.status === 'encerrado'
  const prazoEncerrado = isPrazoEncerrado(jogo.data_hora)
  const bloqueado      = isEncerrado || prazoEncerrado || travado

  // Slide-in ao montar
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function fechar() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  async function salvar(a: number, b: number, novoTravado: boolean) {
    setSave('saving')
    const supabase = createClient()
    const { error } = await supabase.from('palpites').upsert(
      { user_id: userId, jogo_id: jogo.id, gols_a: a, gols_b: b, travado: novoTravado },
      { onConflict: 'user_id,jogo_id' }
    )
    setSave(error ? 'idle' : 'saved')
    if (!error) setTimeout(() => setSave('idle'), 2000)
  }

  async function cravar() {
    setTravado(true)
    await salvar(golsA, golsB, true)
  }

  async function editar() {
    setTravado(false)
    await salvar(golsA, golsB, false)
  }

  async function compartilhar() {
    setShareStatus('sharing')
    try {
      const result = await compartilharCard({
        time_a: jogo.time_a,
        time_b: jogo.time_b,
        gols_a: golsA,
        gols_b: golsB,
        grupo: jogo.grupo,
        fase: jogo.fase ?? null,
        data_hora: jogo.data_hora,
        nomeUsuario,
        avatarUrl,
      })
      if (result === 'downloaded') {
        setShareStatus('downloaded')
        setTimeout(() => setShareStatus('idle'), 3000)
      } else {
        setShareStatus('idle')
      }
    } catch {
      setShareStatus('idle')
    }
  }

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={fechar}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
          transition-transform duration-300 ease-out max-w-md mx-auto ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <p className="font-black text-[#002776] text-base leading-tight truncate">
              <FlagImg nome={jogo.time_a} size={16} className="mr-1" />{jogo.time_a} × <FlagImg nome={jogo.time_b} size={16} className="mr-1" />{jogo.time_b}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{dataFormatada}</p>
            {jogo.fase && (
              <span className="inline-block mt-1 text-[10px] font-semibold bg-[#002776]/10 text-[#002776] px-2 py-0.5 rounded-full">
                {jogo.fase}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saveStatus === 'saving' && <Loader2 className="w-4 h-4 text-[#009C3B] animate-spin" />}
            {saveStatus === 'saved'   && <CheckCircle className="w-4 h-4 text-[#009C3B]" />}
            <button
              onClick={fechar}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Seletores de placar */}
        <div className="px-5 py-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-[#002776] font-bold text-base w-28 truncate flex items-center gap-1.5">
              <FlagImg nome={jogo.time_a} size={18} />{jogo.time_a}
            </span>
            <ScoreSelector value={golsA} onChange={setGolsA} disabled={bloqueado} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-300 text-xs font-semibold">VS</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#002776] font-bold text-base w-28 truncate flex items-center gap-1.5">
              <FlagImg nome={jogo.time_b} size={18} />{jogo.time_b}
            </span>
            <ScoreSelector value={golsB} onChange={setGolsB} disabled={bloqueado} />
          </div>
        </div>

        {/* Informação de prazo / resultado */}
        <div className="px-5 pb-2">
          {isEncerrado && jogo.placar_a !== null ? (
            <p className="text-sm text-gray-500">
              Resultado oficial:{' '}
              <strong className="text-[#009C3B]">{jogo.placar_a} × {jogo.placar_b}</strong>
            </p>
          ) : !isEncerrado && !prazoEncerrado && !travado ? (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Crave até {formatarPrazo(jogo.data_hora)}
            </p>
          ) : null}
        </div>

        {/* Botões de ação */}
        <div className="px-5 pb-10 pt-3 flex flex-col gap-3">
          {!isEncerrado && !travado && !prazoEncerrado && (
            <button
              onClick={cravar}
              disabled={saveStatus === 'saving'}
              className="w-full py-4 rounded-2xl bg-[#009C3B] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-md"
            >
              <Lock className="w-5 h-5" />
              Cravar resultado
            </button>
          )}
          {!isEncerrado && travado && !prazoEncerrado && (
            <button
              onClick={editar}
              disabled={saveStatus === 'saving'}
              className="w-full py-4 rounded-2xl border-2 border-[#002776] text-[#002776] font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
            >
              <Pencil className="w-4 h-4" />
              Editar palpite
            </button>
          )}
          {(isEncerrado || prazoEncerrado) && !travado && (
            <div className="w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              {isEncerrado ? 'Jogo encerrado' : 'Prazo de edição encerrado'}
            </div>
          )}
          <button
            onClick={compartilhar}
            disabled={shareStatus === 'sharing'}
            className="w-full py-3 rounded-2xl bg-[#002776] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            {shareStatus === 'sharing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            {shareStatus === 'downloaded' ? 'Imagem baixada!' : 'Compartilhar palpite'}
          </button>
          <button
            onClick={fechar}
            className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 font-semibold text-sm active:scale-95 transition-transform"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  )
}
