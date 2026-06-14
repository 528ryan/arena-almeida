'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
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

function CardJogo({ jogo, status }: { jogo: JogoHoje; status: StatusJogo }) {
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  const borderCls =
    status === 'ao_vivo'  ? 'border-red-200'         :
    status === 'em_breve' ? 'border-[#009C3B]/30'    :
    status === 'encerrado'? 'border-gray-100'         :
                            'border-gray-100'

  const bgCls =
    status === 'ao_vivo'  ? 'bg-red-50'              :
    status === 'em_breve' ? 'bg-[#009C3B]/5'         :
                            'bg-white'

  const headerCls =
    status === 'ao_vivo'  ? 'bg-red-500'             :
    status === 'em_breve' ? 'bg-[#009C3B]'           :
                            'bg-[#002776]/5'

  return (
    <div className={`flex-shrink-0 w-[138px] rounded-2xl border shadow-sm overflow-hidden ${borderCls} ${bgCls}`}>
      {/* Status / hora */}
      <div className={`px-2 py-1.5 flex items-center justify-center ${headerCls}`}>
        {status === 'ao_vivo' && (
          <span className="flex items-center gap-1 text-white text-[10px] font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            AO VIVO
          </span>
        )}
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

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[#002776] font-black text-sm">Jogos de Hoje</h2>
      <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {comStatus.map(({ jogo, status }) => (
          <CardJogo key={jogo.id} jogo={jogo} status={status} />
        ))}
      </div>
    </section>
  )
}
