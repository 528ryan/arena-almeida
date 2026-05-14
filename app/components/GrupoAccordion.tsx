'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import GameCard from './GameCard'
import TabelaGrupo from './TabelaGrupo'
import type { Jogo, Palpite } from '@/types'

type Props = {
  grupo: string
  jogos: Jogo[]
  palpitesPorJogo: Record<number, Palpite>
  userId: string
  defaultOpen?: boolean
}

export default function GrupoAccordion({
  grupo,
  jogos,
  palpitesPorJogo,
  userId,
  defaultOpen = false,
}: Props) {
  const [aberto, setAberto] = useState(defaultOpen)

  const encerrados = jogos.filter(j => j.status === 'encerrado').length

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
      {/* Header do grupo */}
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between px-4 py-4 bg-white active:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-[#002776] text-white font-black text-base flex items-center justify-center">
            {grupo}
          </span>
          <div className="text-left">
            <p className="font-black text-[#002776] text-base leading-none">Grupo {grupo}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {jogos.length} jogo{jogos.length !== 1 ? 's' : ''} · {encerrados} encerrado{encerrados !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Conteúdo */}
      {aberto && (
        <div className="border-t border-gray-100 px-4 py-4 flex flex-col gap-4 bg-[#f8fdf9]">
          <TabelaGrupo jogos={jogos} />

          <div className="flex flex-col gap-4">
            {jogos.map(jogo => (
              <GameCard
                key={jogo.id}
                jogo={jogo}
                palpiteInicial={palpitesPorJogo[jogo.id] ?? null}
                userId={userId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
