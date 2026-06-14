'use client'

import { useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import type { Palpite, Jogo } from '@/types'

type PalpiteComJogo = Palpite & { jogo: Jogo | null }

function TagPontos({ pontos, status }: { pontos: number; status: string }) {
  if (status !== 'encerrado') {
    return <span className="text-[10px] text-gray-400 font-semibold">Pendente</span>
  }
  const cls =
    pontos === 3 ? 'bg-green-100 text-green-700' :
    pontos === 1 ? 'bg-yellow-100 text-yellow-700' :
                   'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${cls}`}>
      {pontos} pts
    </span>
  )
}

function PalpiteCard({ palpite }: { palpite: PalpiteComJogo }) {
  const jogo = palpite.jogo
  if (!jogo) return null
  const enc = jogo.status === 'encerrado'
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#002776]/5 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[#002776] text-sm truncate">{jogo.time_a} × {jogo.time_b}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{dataFormatada}</p>
        </div>
        <TagPontos pontos={palpite.pontos} status={jogo.status} />
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">Palpite</p>
          <div className="flex items-center gap-1.5">
            <p className="font-black text-[#002776] text-xl tabular-nums">
              {palpite.gols_a} × {palpite.gols_b}
            </p>
            {palpite.travado && <Lock className="w-3.5 h-3.5 text-[#009C3B]" />}
          </div>
        </div>
        {enc && jogo.placar_a !== null ? (
          <div className="text-right">
            <p className="text-[10px] text-gray-400 mb-0.5">Resultado</p>
            <p className="font-black text-gray-700 text-xl tabular-nums">
              {jogo.placar_a} × {jogo.placar_b}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-300 font-semibold">Aguardando resultado</p>
        )}
      </div>
    </div>
  )
}

function MiniStats({ palpites }: { palpites: PalpiteComJogo[] }) {
  const enc = palpites.filter(p => p.jogo?.status === 'encerrado')
  const exatos = enc.filter(p => p.pontos === 3).length
  const parciais = enc.filter(p => p.pontos === 1).length
  const pendentes = palpites.length - enc.length

  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold">
      {exatos > 0 && (
        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          {exatos} {exatos === 1 ? 'exato' : 'exatos'}
        </span>
      )}
      {parciais > 0 && (
        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
          {parciais} {parciais === 1 ? 'parcial' : 'parciais'}
        </span>
      )}
      {pendentes > 0 && (
        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {pendentes} {pendentes === 1 ? 'pendente' : 'pendentes'}
        </span>
      )}
    </div>
  )
}

function Secao({ titulo, palpites }: { titulo: string; palpites: PalpiteComJogo[] }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setAberto(v => !v)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex flex-col items-start gap-1">
          <span className="text-[#002776] font-black text-sm">{titulo}</span>
          <MiniStats palpites={palpites} />
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
          <span>{palpites.length} {palpites.length === 1 ? 'jogo' : 'jogos'}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {aberto && (
        <div className="flex flex-col gap-2.5">
          {palpites.map(p => <PalpiteCard key={p.id} palpite={p} />)}
        </div>
      )}
    </div>
  )
}

const FASE_ORDER = ['16 avos', 'Oitavas', 'Quartas', 'Semifinal', 'Final', 'Eliminatória']

function agrupar(palpites: PalpiteComJogo[]) {
  const sorted = [...palpites].sort((a, b) => {
    if (!a.jogo || !b.jogo) return 0
    return new Date(a.jogo.data_hora).getTime() - new Date(b.jogo.data_hora).getTime()
  })

  const mapa: Record<string, PalpiteComJogo[]> = {}
  for (const p of sorted) {
    if (!p.jogo) continue
    const chave = p.jogo.grupo ? `Grupo ${p.jogo.grupo}` : (p.jogo.fase ?? 'Eliminatória')
    if (!mapa[chave]) mapa[chave] = []
    mapa[chave].push(p)
  }

  const grupoKeys = Object.keys(mapa).filter(k => k.startsWith('Grupo ')).sort()
  const faseKeys = Object.keys(mapa)
    .filter(k => !k.startsWith('Grupo '))
    .sort((a, b) => {
      const ia = FASE_ORDER.indexOf(a)
      const ib = FASE_ORDER.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })

  return [...grupoKeys, ...faseKeys].map(chave => ({ chave, palpites: mapa[chave] }))
}

export default function PalpitesAgrupados({ palpites }: { palpites: PalpiteComJogo[] }) {
  if (palpites.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10 text-sm">Nenhum palpite ainda.</p>
    )
  }

  const secoes = agrupar(palpites)

  return (
    <div className="flex flex-col gap-5">
      {secoes.map(({ chave, palpites: ps }) => (
        <Secao key={chave} titulo={chave} palpites={ps} />
      ))}
    </div>
  )
}
