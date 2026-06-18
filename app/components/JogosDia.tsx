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
    <div className="flex items-center gap-0.5">
      {foto_url ? (
        <Image
          src={foto_url}
          alt={nome}
          width={14}
          height={14}
          className="rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full bg-[#002776]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[7px] font-black text-[#002776]">{nome[0]}</span>
        </div>
      )}
      <span className="text-[9px] font-semibold text-gray-600 max-w-[44px] truncate leading-none">
        {nome.split(' ')[0]}
      </span>
    </div>
  )
}

/** Card em destaque para próximo jogo — full width, tema verde */
function CardEmBreve({ jogo, minutosRestantes }: { jogo: JogoHoje; minutosRestantes: number }) {
  const label = jogo.grupo ? `Grupo ${jogo.grupo}` : (jogo.fase ?? 'Eliminatória')
  const hora  = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(jogo.data_hora))

  return (
    <div className="rounded-2xl border-2 border-[#009C3B]/30 bg-[#009C3B]/5 overflow-hidden shadow-sm">
      <div className="bg-[#009C3B] px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-black">EM BREVE · {hora}</span>
        <span className="text-green-200 text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>

      <div className="px-4 py-4 flex items-center gap-3">
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <FlagImg nome={jogo.time_a} size={28} />
          <span className="font-black text-gray-800 text-sm text-center leading-tight">{jogo.time_a}</span>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1">
          <span className="font-black text-2xl text-[#009C3B]">VS</span>
          {minutosRestantes <= 90 && (
            <span className="text-[10px] text-[#009C3B] font-bold bg-[#009C3B]/10 px-2 py-0.5 rounded-full">
              em {minutosRestantes} min
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <FlagImg nome={jogo.time_b} size={28} />
          <span className="font-black text-gray-800 text-sm text-center leading-tight">{jogo.time_b}</span>
        </div>
      </div>
    </div>
  )
}

/** Card em destaque para jogo ao vivo — full width */
function CardAoVivo({ jogo }: { jogo: JogoHoje }) {
  const label = jogo.grupo ? `Grupo ${jogo.grupo}` : (jogo.fase ?? 'Eliminatória')

  return (
    <div className="rounded-2xl border-2 border-red-300 bg-red-50 overflow-hidden shadow-md">
      {/* Header */}
      <div className="bg-red-500 px-4 py-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-white text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          AO VIVO
        </span>
        <span className="text-red-200 text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>

      {/* Times + placar */}
      <div className="px-4 py-4 flex items-center gap-3">
        {/* Time A */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <FlagImg nome={jogo.time_a} size={28} />
          <span className="font-black text-gray-800 text-sm text-center leading-tight">{jogo.time_a}</span>
        </div>

        {/* Placar */}
        <div className="shrink-0 flex flex-col items-center">
          <span className="font-black text-4xl text-[#002776] tabular-nums leading-none">
            {jogo.placar_a ?? '–'}&thinsp;{jogo.placar_b ?? '–'}
          </span>
          <span className="text-[10px] text-red-400 font-bold mt-1 animate-pulse">EM ANDAMENTO</span>
        </div>

        {/* Time B */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <FlagImg nome={jogo.time_b} size={28} />
          <span className="font-black text-gray-800 text-sm text-center leading-tight">{jogo.time_b}</span>
        </div>
      </div>

      {/* Top scorers se houver */}
      {jogo.topScorers.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-2 border-t border-red-200 pt-2">
          <span className="text-[10px] text-red-400 font-bold">🎯 Pontuou:</span>
          <div className="flex gap-2 flex-wrap">
            {jogo.topScorers.map(s => (
              <AvatarScorer key={s.nome} nome={s.nome} foto_url={s.foto_url} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Card compacto no scroll horizontal */
function CardJogo({ jogo, status }: { jogo: JogoHoje; status: StatusJogo }) {
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  const borderCls =
    status === 'em_breve' ? 'border-[#009C3B]/30' : 'border-gray-100'

  const bgCls =
    status === 'em_breve' ? 'bg-[#009C3B]/5' : 'bg-white'

  const headerCls =
    status === 'em_breve' ? 'bg-[#009C3B]' : 'bg-[#002776]/5'

  return (
    <div className={`flex-shrink-0 w-[138px] rounded-2xl border shadow-sm overflow-hidden ${borderCls} ${bgCls}`}>
      {/* Status / hora */}
      <div className={`px-2 py-1.5 flex items-center justify-center ${headerCls}`}>
        {status === 'em_breve' && (
          <span className="text-white text-[10px] font-black">EM BREVE · {hora}</span>
        )}
        {(status === 'futuro' || status === 'encerrado') && (
          <span className={`text-[10px] font-bold ${status === 'encerrado' ? 'text-gray-500' : 'text-[#002776]/60'}`}>
            {hora}
          </span>
        )}
      </div>

      {/* Times + placar */}
      <div className="px-2.5 py-2 flex flex-col gap-1">
        {[
          { nome: jogo.time_a, placar: jogo.placar_a },
          { nome: jogo.time_b, placar: jogo.placar_b },
        ].map(({ nome, placar }) => (
          <div key={nome} className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-gray-800 truncate flex-1 leading-none">{nome}</span>
            {status === 'encerrado' && placar !== null ? (
              <span className="font-black text-sm tabular-nums text-[#002776] leading-none">{placar}</span>
            ) : (
              <span className="text-gray-300 text-sm font-bold leading-none">-</span>
            )}
          </div>
        ))}

        {/* Top scorers */}
        {status === 'encerrado' && (
          <div className="border-t border-gray-100 pt-1.5 mt-0.5">
            {jogo.topScorers.length > 0 ? (
              <>
                <p className="text-[9px] text-gray-400 font-semibold mb-1 leading-none">
                  {jogo.topScorers[0].pontos === 3 ? '🎯' : '⚡'} Pontuou
                </p>
                <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                  {jogo.topScorers.map((s) => (
                    <AvatarScorer key={`${jogo.id}-${s.nome}`} nome={s.nome} foto_url={s.foto_url} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[9px] text-gray-400 font-semibold leading-none">Sem pontuadores</p>
            )}
          </div>
        )}
      </div>
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

  // Earliest pending game = EM BREVE
  const pendentes = jogos.filter(j => j.status === 'pendente' && new Date(j.data_hora) > now)
  const proximaDataHora = pendentes.length > 0
    ? pendentes.reduce((min, j) => j.data_hora < min ? j.data_hora : min, pendentes[0].data_hora)
    : null

  const comStatus = jogos.map(j => ({ jogo: j, status: calcStatus(j, now, proximaDataHora) }))

  const aoVivos  = comStatus.filter(({ status }) => status === 'ao_vivo')
  const emBreves = comStatus.filter(({ status }) => status === 'em_breve')

  // ao_vivo tem prioridade; sem ao_vivo → promove o em_breve para destaque
  const temAoVivo       = aoVivos.length > 0
  const emBreveDestaque = !temAoVivo && emBreves.length > 0 ? emBreves[0] : null
  const minutosRestantes = emBreveDestaque
    ? Math.max(0, Math.round((new Date(emBreveDestaque.jogo.data_hora).getTime() - now.getTime()) / 60_000))
    : 0

  // Remove os jogos em destaque do scroll
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

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[#002776] font-black text-sm">Jogos de Hoje</h2>

      {/* Ao vivo em destaque */}
      {aoVivos.map(({ jogo }) => (
        <CardAoVivo key={jogo.id} jogo={jogo} />
      ))}

      {/* Em breve em destaque (só quando não há ao vivo) */}
      {emBreveDestaque && (
        <CardEmBreve jogo={emBreveDestaque.jogo} minutosRestantes={minutosRestantes} />
      )}

      {/* Demais jogos no scroll */}
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
