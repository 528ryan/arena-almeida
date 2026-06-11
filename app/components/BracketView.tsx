'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import PalpiteSheet from './PalpiteSheet'
import FlagImg from './FlagImg'
import type { Jogo, Palpite } from '@/types'

// ─── Constantes de layout ─────────────────────────────────────────────────
const NODE_H = 48
const NODE_W = 108
const GAP    = 6
const CONN_W = 18
const U      = NODE_H + GAP // 54

// ─── Posições verticais pré-calculadas (5 rounds, começa com 16) ──────────
function buildPositions(): number[][] {
  const rounds: number[][] = [
    Array.from({ length: 16 }, (_, i) => i * U),
  ]
  for (let r = 1; r < 5; r++) {
    const prev  = rounds[r - 1]
    const count = prev.length / 2
    rounds.push(
      Array.from({ length: count }, (_, j) =>
        (prev[2 * j] + prev[2 * j + 1] + NODE_H) / 2 - NODE_H / 2
      )
    )
  }
  return rounds
}

const POSITIONS = buildPositions()
const TOTAL_H   = 15 * U + NODE_H // 858px

const ROUNDS = [
  { fase: '16 avos de Final', label: '16 avos' },
  { fase: 'Oitavas de Final', label: 'Oitavas' },
  { fase: 'Quartas de Final', label: 'Quartas' },
  { fase: 'Semifinal',        label: 'Semis'   },
  { fase: 'Final',            label: 'Final'   },
]

// ─── Nó individual do bracket ─────────────────────────────────────────────
interface GameNodeProps {
  jogo: Jogo | undefined
  hasPalpite: boolean
  travado: boolean
  onClick: () => void
}

function GameNode({ jogo, hasPalpite, travado, onClick }: GameNodeProps) {
  if (!jogo) {
    return (
      <div
        style={{ width: NODE_W, height: NODE_H }}
        className="rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center"
      >
        <span className="text-[10px] text-gray-300">A definir</span>
      </div>
    )
  }

  const enc     = jogo.status === 'encerrado'
  const winnerA = enc && jogo.placar_a !== null && jogo.placar_b !== null && jogo.placar_a > jogo.placar_b
  const winnerB = enc && jogo.placar_a !== null && jogo.placar_b !== null && jogo.placar_b > jogo.placar_a
  const isPlaceholder = (name: string) => /^(V\.|P\.|[12][A-L]$|3º)/.test(name)

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: NODE_W, height: NODE_H, position: 'relative' }}
      className={`rounded-lg border overflow-hidden text-[11px] shadow-sm text-left
        active:scale-95 transition-transform cursor-pointer
        ${enc ? 'border-[#009C3B]' : travado ? 'border-[#009C3B]/60' : 'border-gray-200 bg-white'}`}
    >
      {hasPalpite && (
        <span className="absolute top-1 right-1 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
          {travado
            ? <Lock className="w-2.5 h-2.5 text-[#009C3B]" />
            : <span className="w-2 h-2 rounded-full bg-[#009C3B] block" />
          }
        </span>
      )}

      {/* Time A */}
      <div
        className={`flex items-center justify-between px-2 border-b border-gray-100
          ${winnerA ? 'bg-green-50 font-black text-[#002776]' : 'bg-white'}`}
        style={{ height: NODE_H / 2 }}
      >
        <span className={`truncate max-w-[68px] ${isPlaceholder(jogo.time_a) && !enc ? 'text-gray-400' : ''}`}>
          <FlagImg nome={jogo.time_a} size={12} className="mr-0.5" />{jogo.time_a}
        </span>
        {enc && <span className="font-black text-[#002776] ml-1 shrink-0">{jogo.placar_a}</span>}
      </div>

      {/* Time B */}
      <div
        className={`flex items-center justify-between px-2
          ${winnerB ? 'bg-green-50 font-black text-[#002776]' : 'bg-white text-gray-500'}`}
        style={{ height: NODE_H / 2 }}
      >
        <span className={`truncate max-w-[68px] ${isPlaceholder(jogo.time_b) && !enc ? 'text-gray-400' : ''}`}>
          <FlagImg nome={jogo.time_b} size={12} className="mr-0.5" />{jogo.time_b}
        </span>
        {enc && (
          <span className={`font-black ml-1 shrink-0 ${winnerB ? 'text-[#002776]' : 'text-gray-400'}`}>
            {jogo.placar_b}
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Linhas de conexão (SVG) ──────────────────────────────────────────────
function Connectors({ fromRound }: { fromRound: number }) {
  const fromPos = POSITIONS[fromRound]
  const count   = fromPos.length / 2

  return (
    <svg width={CONN_W} height={TOTAL_H} style={{ display: 'block', flexShrink: 0 }}>
      {Array.from({ length: count }, (_, j) => {
        const y1 = fromPos[2 * j]     + NODE_H / 2
        const y2 = fromPos[2 * j + 1] + NODE_H / 2
        const ym = (y1 + y2) / 2
        return (
          <g key={j}>
            <line x1={0} y1={y1} x2={0} y2={y2} stroke="#d1d5db" strokeWidth={1.5} />
            <line x1={0} y1={ym} x2={CONN_W} y2={ym} stroke="#d1d5db" strokeWidth={1.5} />
          </g>
        )
      })}
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────
interface Props {
  jogos: Jogo[]
  palpitesPorJogo: Record<number, Palpite>
  userId: string
  nomeUsuario?: string | null
  avatarUrl?: string | null
}

export default function BracketView({ jogos, palpitesPorJogo, userId, nomeUsuario, avatarUrl }: Props) {
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null)

  const rounds = ROUNDS.map(({ fase }) => jogos.filter(j => j.fase === fase))

  const totalW = ROUNDS.length * NODE_W + (ROUNDS.length - 1) * CONN_W

  return (
    <>
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        {/* Cabeçalho das colunas */}
        <div className="flex mb-2" style={{ minWidth: totalW }}>
          {ROUNDS.map(({ label }, ri) => (
            <div key={label} className="flex items-center" style={{ flexShrink: 0 }}>
              <div
                style={{ width: NODE_W }}
                className="text-center text-[9px] font-black text-[#002776] uppercase tracking-widest"
              >
                {label}
              </div>
              {ri < ROUNDS.length - 1 && <div style={{ width: CONN_W }} />}
            </div>
          ))}
        </div>

        {/* Bracket */}
        <div className="relative" style={{ height: TOTAL_H, minWidth: totalW }}>
          {ROUNDS.map(({ fase }, ri) => {
            const round    = rounds[ri]
            const count    = POSITIONS[ri].length
            const leftBase = ri * (NODE_W + CONN_W)

            return (
              <div key={fase}>
                {Array.from({ length: count }, (_, j) => {
                  const jogo    = round[j]
                  const palpite = jogo ? palpitesPorJogo[jogo.id] : undefined
                  return (
                    <div key={j} style={{ position: 'absolute', top: POSITIONS[ri][j], left: leftBase }}>
                      <GameNode
                        jogo={jogo}
                        hasPalpite={!!palpite}
                        travado={palpite?.travado ?? false}
                        onClick={() => jogo && setJogoSelecionado(jogo)}
                      />
                    </div>
                  )
                })}

                {ri < ROUNDS.length - 1 && (
                  <div style={{ position: 'absolute', top: 0, left: leftBase + NODE_W }}>
                    <Connectors fromRound={ri} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {jogoSelecionado && (
        <PalpiteSheet
          jogo={jogoSelecionado}
          palpiteInicial={palpitesPorJogo[jogoSelecionado.id] ?? null}
          userId={userId}
          onClose={() => setJogoSelecionado(null)}
          nomeUsuario={nomeUsuario}
          avatarUrl={avatarUrl}
        />
      )}
    </>
  )
}
