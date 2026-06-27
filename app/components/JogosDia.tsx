'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import FlagImg from './FlagImg'
import type { Jogo } from '@/types'

export type TopScorer = { nome: string; foto_url: string | null; pontos: number }
export type JogoHoje = Jogo & { topScorers: TopScorer[] }

const LIVE_WINDOW_MIN = 110

type StatusJogo = 'ao_vivo' | 'em_breve' | 'futuro' | 'encerrado'

function calcStatus(jogo: JogoHoje, now: Date, proximaDataHora: string | null): StatusJogo {
  if (jogo.status === 'encerrado') return 'encerrado'
  const start = new Date(jogo.data_hora)
  if (start > now) {
    return proximaDataHora && jogo.data_hora === proximaDataHora ? 'em_breve' : 'futuro'
  }
  const diffMin = (now.getTime() - start.getTime()) / 60_000
  return diffMin <= LIVE_WINDOW_MIN ? 'ao_vivo' : 'futuro'
}

function AvatarScorer({ nome, foto_url }: { nome: string; foto_url: string | null }) {
  return (
    <div className="flex items-center gap-1">
      {foto_url ? (
        <Image src={foto_url} alt={nome} width={16} height={16} className="rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-black text-white">{nome[0]}</span>
        </div>
      )}
      <span className="text-[10px] font-semibold text-white/80 max-w-[48px] truncate leading-none">
        {nome.split(' ')[0]}
      </span>
    </div>
  )
}

function FaseLabel({ jogo }: { jogo: JogoHoje }) {
  const label = jogo.grupo ? `Grupo ${jogo.grupo}` : (jogo.fase ?? 'Eliminatória')
  return <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
}

/** Card AO VIVO — destaque full width */
function CardAoVivo({ jogo }: { jogo: JogoHoje }) {
  const vencedorA = jogo.placar_a !== null && jogo.placar_b !== null && jogo.placar_a > jogo.placar_b
  const vencedorB = jogo.placar_a !== null && jogo.placar_b !== null && jogo.placar_b > jogo.placar_a

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-red-600 px-4 py-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-white text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
          AO VIVO
        </span>
        <FaseLabel jogo={jogo} />
      </div>

      {/* Corpo */}
      <div className="bg-gradient-to-b from-red-700 to-[#002776] px-5 py-5 flex items-center gap-3">
        {/* Time A */}
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <FlagImg nome={jogo.time_a} size={44} />
          <span className={`font-black text-sm text-center leading-tight truncate w-full ${vencedorA ? 'text-[#FFDF00]' : 'text-white'}`}>
            {jogo.time_a}
          </span>
        </div>

        {/* Placar */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className={`font-black text-5xl tabular-nums leading-none ${vencedorA ? 'text-[#FFDF00]' : 'text-white'}`}>
              {jogo.placar_a ?? '–'}
            </span>
            <span className="text-white/30 font-black text-3xl">:</span>
            <span className={`font-black text-5xl tabular-nums leading-none ${vencedorB ? 'text-[#FFDF00]' : 'text-white'}`}>
              {jogo.placar_b ?? '–'}
            </span>
          </div>
          <span className="text-[10px] text-red-300 font-bold animate-pulse">EM ANDAMENTO</span>
        </div>

        {/* Time B */}
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <FlagImg nome={jogo.time_b} size={44} />
          <span className={`font-black text-sm text-center leading-tight truncate w-full ${vencedorB ? 'text-[#FFDF00]' : 'text-white'}`}>
            {jogo.time_b}
          </span>
        </div>
      </div>

      {/* Top scorers */}
      {jogo.topScorers.length > 0 && (
        <div className="bg-[#002776] px-4 py-2 flex items-center gap-2 border-t border-white/10">
          <span className="text-[10px] text-[#FFDF00] font-bold shrink-0">🎯 Pontuou:</span>
          <div className="flex gap-2.5 flex-wrap">
            {jogo.topScorers.map(s => <AvatarScorer key={s.nome} nome={s.nome} foto_url={s.foto_url} />)}
          </div>
        </div>
      )}
    </div>
  )
}

/** Card EM BREVE — destaque full width */
function CardEmBreve({ jogo, minutosRestantes }: { jogo: JogoHoje; minutosRestantes: number }) {
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(jogo.data_hora))

  return (
    <div className="rounded-2xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="bg-[#009C3B] px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-black">EM BREVE · {hora}</span>
        <FaseLabel jogo={jogo} />
      </div>

      {/* Corpo */}
      <div className="bg-gradient-to-b from-[#009C3B]/90 to-[#002776] px-5 py-5 flex items-center gap-3">
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <FlagImg nome={jogo.time_a} size={40} />
          <span className="font-black text-white text-sm text-center leading-tight truncate w-full">{jogo.time_a}</span>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <span className="font-black text-white/50 text-2xl">VS</span>
          {minutosRestantes <= 90 && (
            <span className="text-[11px] text-[#FFDF00] font-bold bg-[#FFDF00]/15 px-2.5 py-0.5 rounded-full">
              em {minutosRestantes} min
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <FlagImg nome={jogo.time_b} size={40} />
          <span className="font-black text-white text-sm text-center leading-tight truncate w-full">{jogo.time_b}</span>
        </div>
      </div>
    </div>
  )
}

/** Card compacto no scroll horizontal */
function CardJogo({ jogo, status }: { jogo: JogoHoje; status: StatusJogo }) {
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(jogo.data_hora))
  const enc  = status === 'encerrado'
  const vencedorA = enc && jogo.placar_a !== null && jogo.placar_b !== null && jogo.placar_a > jogo.placar_b
  const vencedorB = enc && jogo.placar_a !== null && jogo.placar_b !== null && jogo.placar_b > jogo.placar_a

  return (
    <div className={`flex-shrink-0 w-[152px] rounded-2xl border overflow-hidden shadow-sm ${
      enc ? 'border-gray-100 bg-white' : 'border-[#002776]/10 bg-white'
    }`}>
      {/* Header */}
      <div className={`px-3 py-1.5 flex items-center justify-between ${
        enc ? 'bg-gray-50' : 'bg-[#002776]/5'
      }`}>
        <span className={`text-[10px] font-black ${enc ? 'text-gray-400' : 'text-[#002776]/50'}`}>
          {hora}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-wide ${enc ? 'text-gray-300' : 'text-[#002776]/30'}`}>
          {jogo.grupo ? `Gr. ${jogo.grupo}` : 'MM'}
        </span>
      </div>

      {/* Times */}
      <div className="px-3 py-2.5 flex flex-col gap-2">
        {/* Time A */}
        <div className="flex items-center gap-2">
          <FlagImg nome={jogo.time_a} size={20} />
          <span className={`text-[11px] font-bold flex-1 truncate leading-none ${vencedorA ? 'text-[#009C3B] font-black' : 'text-gray-700'}`}>
            {jogo.time_a}
          </span>
          {enc && jogo.placar_a !== null ? (
            <span className={`font-black text-sm tabular-nums leading-none ${vencedorA ? 'text-[#009C3B]' : 'text-gray-500'}`}>
              {jogo.placar_a}
            </span>
          ) : (
            <span className="text-gray-200 text-sm font-bold leading-none">-</span>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        {/* Time B */}
        <div className="flex items-center gap-2">
          <FlagImg nome={jogo.time_b} size={20} />
          <span className={`text-[11px] font-bold flex-1 truncate leading-none ${vencedorB ? 'text-[#009C3B] font-black' : 'text-gray-700'}`}>
            {jogo.time_b}
          </span>
          {enc && jogo.placar_b !== null ? (
            <span className={`font-black text-sm tabular-nums leading-none ${vencedorB ? 'text-[#009C3B]' : 'text-gray-500'}`}>
              {jogo.placar_b}
            </span>
          ) : (
            <span className="text-gray-200 text-sm font-bold leading-none">-</span>
          )}
        </div>
      </div>

      {/* Footer scorers */}
      {enc && (
        <div className="px-3 pb-2.5 border-t border-gray-50 pt-2">
          {jogo.topScorers.length > 0 ? (
            <div className="flex flex-wrap gap-x-1.5 gap-y-1">
              <span className="text-[9px] text-[#009C3B] font-bold w-full leading-none mb-0.5">
                {jogo.topScorers[0].pontos === 3 ? '🎯' : '⚡'} Pontuou
              </span>
              {jogo.topScorers.slice(0, 3).map(s => (
                <div key={`${jogo.id}-${s.nome}`} className="flex items-center gap-0.5">
                  {s.foto_url ? (
                    <Image src={s.foto_url} alt={s.nome} width={12} height={12} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-[#002776]/15 flex items-center justify-center">
                      <span className="text-[7px] font-black text-[#002776]">{s.nome[0]}</span>
                    </div>
                  )}
                  <span className="text-[9px] text-gray-500 font-semibold max-w-[38px] truncate">
                    {s.nome.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[9px] text-gray-300 font-semibold">Sem pontuadores</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function JogosDia({ jogos }: { jogos: JogoHoje[] }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (jogos.length === 0) return null

  const pendentes = jogos.filter(j => j.status === 'pendente' && new Date(j.data_hora) > now)
  const proximaDataHora = pendentes.length > 0
    ? pendentes.reduce((min, j) => j.data_hora < min ? j.data_hora : min, pendentes[0].data_hora)
    : null

  const comStatus = jogos.map(j => ({ jogo: j, status: calcStatus(j, now, proximaDataHora) }))

  const aoVivos  = comStatus.filter(({ status }) => status === 'ao_vivo')
  const emBreves = comStatus.filter(({ status }) => status === 'em_breve')

  const temAoVivo       = aoVivos.length > 0
  const emBreveDestaque = !temAoVivo && emBreves.length > 0 ? emBreves[0] : null
  const minutosRestantes = emBreveDestaque
    ? Math.max(0, Math.round((new Date(emBreveDestaque.jogo.data_hora).getTime() - now.getTime()) / 60_000))
    : 0

  const idsDestaque = new Set([
    ...aoVivos.map(({ jogo }) => jogo.id),
    ...(emBreveDestaque ? [emBreveDestaque.jogo.id] : []),
  ])
  const restantes = comStatus
    .filter(({ jogo }) => !idsDestaque.has(jogo.id))
    .sort((a, b) => {
      const order: Record<StatusJogo, number> = { em_breve: 0, futuro: 1, encerrado: 2, ao_vivo: 3 }
      return order[a.status] - order[b.status]
    })

  const dataHoje = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit',
  }).format(now)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[#002776] font-black text-base">Jogos de Hoje</h2>
        <span className="text-[11px] text-gray-400 font-semibold capitalize">{dataHoje}</span>
      </div>

      {aoVivos.map(({ jogo }) => (
        <CardAoVivo key={jogo.id} jogo={jogo} />
      ))}

      {emBreveDestaque && (
        <CardEmBreve jogo={emBreveDestaque.jogo} minutosRestantes={minutosRestantes} />
      )}

      {restantes.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
          {restantes.map(({ jogo, status }) => (
            <CardJogo key={jogo.id} jogo={jogo} status={status} />
          ))}
        </div>
      )}
    </section>
  )
}
