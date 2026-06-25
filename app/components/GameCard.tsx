'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, Share2, Lock, Pencil, Clock } from 'lucide-react'
import ScoreSelector from './ScoreSelector'
import { createClient } from '@/lib/supabase/client'
import FlagImg from './FlagImg'
import { compartilharCard } from '@/lib/shareCard'
import type { Jogo, Palpite } from '@/types'

type GameCardProps = {
  jogo: Jogo
  palpiteInicial: Palpite | null
  userId: string
  nomeUsuario?: string | null
  avatarUrl?: string | null
}


type SaveStatus = 'idle' | 'saving' | 'saved'

/** Retorna o deadline de edição: prazo_edicao se definido, senão 1h antes (mata-mata) ou 6h antes (grupos) */
function getDeadline(jogo: { data_hora: string; prazo_edicao: string | null; grupo: string | null }): Date {
  if (jogo.prazo_edicao) return new Date(jogo.prazo_edicao)
  const d = new Date(jogo.data_hora)
  d.setHours(d.getHours() - (jogo.grupo ? 6 : 1))
  return d
}

function isPrazoEncerrado(jogo: { data_hora: string; prazo_edicao: string | null; grupo: string | null }): boolean {
  return new Date() >= getDeadline(jogo)
}

function formatarPrazo(jogo: { data_hora: string; prazo_edicao: string | null; grupo: string | null }): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(getDeadline(jogo))
}

export default function GameCard({ jogo, palpiteInicial, userId, nomeUsuario, avatarUrl }: GameCardProps) {
  const [golsA, setGolsA] = useState(palpiteInicial?.gols_a ?? 0)
  const [golsB, setGolsB] = useState(palpiteInicial?.gols_b ?? 0)
  const [travado, setTravado] = useState(palpiteInicial?.travado ?? false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const isEncerrado = jogo.status === 'encerrado'
  const prazoEncerrado = isPrazoEncerrado(jogo)
  // O seletor fica bloqueado se: jogo encerrado, prazo esgotado, ou palpite travado
  const bloqueado = isEncerrado || prazoEncerrado || travado

  async function salvar(a: number, b: number, novoTravado: boolean) {
    setSaveStatus('saving')
    const supabase = createClient()
    const { error } = await supabase.from('palpites').upsert(
      { user_id: userId, jogo_id: jogo.id, gols_a: a, gols_b: b, travado: novoTravado },
      { onConflict: 'user_id,jogo_id' }
    )
    setSaveStatus(error ? 'idle' : 'saved')
    if (!error) setTimeout(() => setSaveStatus('idle'), 2000)
  }

  async function cravar() {
    setTravado(true)
    await salvar(golsA, golsB, true)
  }

  async function editar() {
    setTravado(false)
    await salvar(golsA, golsB, false)
  }

  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'downloaded'>('idle')

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
    <div className={`bg-white rounded-2xl shadow-md overflow-hidden border ${
      travado && !isEncerrado ? 'border-[#009C3B]' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className="bg-[#002776] px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          {dataFormatada}
        </span>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && <Loader2 className="w-4 h-4 text-[#FFDF00] animate-spin" />}
          {saveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-[#FFDF00]" />}
          {isEncerrado && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
              Encerrado
            </span>
          )}
          {!isEncerrado && prazoEncerrado && (
            <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Prazo encerrado
            </span>
          )}
          {!isEncerrado && !prazoEncerrado && travado && (
            <span className="text-xs bg-[#009C3B] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Cravado
            </span>
          )}
        </div>
      </div>

      {/* Seletor de placar */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#002776] font-bold text-lg flex-1 truncate pr-2 flex items-center gap-1.5"><FlagImg nome={jogo.time_a} size={20} />{jogo.time_a}</span>
          <ScoreSelector value={golsA} onChange={setGolsA} disabled={bloqueado} />
        </div>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-gray-400 text-sm font-semibold">VS</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-[#002776] font-bold text-lg flex-1 truncate pr-2 flex items-center gap-1.5"><FlagImg nome={jogo.time_b} size={20} />{jogo.time_b}</span>
          <ScoreSelector value={golsB} onChange={setGolsB} disabled={bloqueado} />
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-4 pb-4 flex flex-col gap-3">

        {/* Resultado oficial / prazo */}
        <div className="flex items-center justify-between text-sm">
          {isEncerrado && jogo.placar_a !== null ? (
            <span className="text-gray-500">
              Resultado: <strong className="text-[#009C3B]">{jogo.placar_a} x {jogo.placar_b}</strong>
            </span>
          ) : !isEncerrado && !prazoEncerrado && !travado ? (
            <span className="text-gray-400 flex items-center gap-1 text-xs">
              <Clock className="w-3.5 h-3.5" />
              Crave até {formatarPrazo(jogo)}
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={compartilhar}
            disabled={shareStatus === 'sharing'}
            className="flex items-center gap-1.5 bg-[#002776] text-white px-3 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform shadow disabled:opacity-60"
            aria-label="Compartilhar palpite"
          >
            {shareStatus === 'sharing'
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Share2 className="w-4 h-4" />
            }
            {shareStatus === 'downloaded' ? 'Baixado!' : 'Compartilhar'}
          </button>
        </div>

        {/* Botões de ação — só aparecem em jogos pendentes */}
        {!isEncerrado && (
          <div>
            {/* Cravar — visível quando não travado e prazo não encerrou */}
            {!travado && !prazoEncerrado && (
              <button
                onClick={cravar}
                disabled={saveStatus === 'saving'}
                className="w-full py-3.5 rounded-xl bg-[#009C3B] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              >
                <Lock className="w-4 h-4" />
                Cravar resultado
              </button>
            )}

            {/* Editar — visível quando travado mas prazo ainda não encerrou */}
            {travado && !prazoEncerrado && (
              <button
                onClick={editar}
                disabled={saveStatus === 'saving'}
                className="w-full py-3.5 rounded-xl border-2 border-[#002776] text-[#002776] font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              >
                <Pencil className="w-4 h-4" />
                Editar palpite
              </button>
            )}

            {/* Prazo encerrado — sem ação */}
            {prazoEncerrado && (
              <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Edição encerrada
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
