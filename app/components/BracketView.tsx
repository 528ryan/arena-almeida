'use client'

import { useState } from 'react'
import { Lock, Check } from 'lucide-react'
import PalpiteSheet from './PalpiteSheet'
import FlagImg from './FlagImg'
import type { Jogo, Palpite } from '@/types'

// ─── Layout ────────────────────────────────────────────────────────────────
const NODE_H  = 56
const NODE_W  = 120
const GAP     = 8
const CONN_W  = 20
const U       = NODE_H + GAP // 64

function buildPositions(): number[][] {
  const rounds: number[][] = [Array.from({ length: 16 }, (_, i) => i * U)]
  for (let r = 1; r < 5; r++) {
    const prev = rounds[r - 1]
    rounds.push(
      Array.from({ length: prev.length / 2 }, (_, j) =>
        (prev[2 * j] + prev[2 * j + 1] + NODE_H) / 2 - NODE_H / 2
      )
    )
  }
  return rounds
}

const POSITIONS = buildPositions()
const TOTAL_H   = 15 * U + NODE_H

const ROUNDS = [
  { fase: '16 avos de Final', label: '16 avos' },
  { fase: 'Oitavas de Final', label: 'Oitavas' },
  { fase: 'Quartas de Final', label: 'Quartas' },
  { fase: 'Semifinal',        label: 'Semis'   },
  { fase: 'Final',            label: 'Final'   },
]

// ─── Nó ────────────────────────────────────────────────────────────────────
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
        className="rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center"
      >
        <span className="text-[10px] text-gray-300 font-semibold">A definir</span>
      </div>
    )
  }

  const enc      = jogo.status === 'encerrado'
  const winnerA  = enc && jogo.placar_a !== null && jogo.placar_b !== null && jogo.placar_a > jogo.placar_b
  const winnerB  = enc && jogo.placar_a !== null && jogo.placar_b !== null && jogo.placar_b > jogo.placar_a
  const isSlot   = (name: string) => /^(V\.|P\.|[12][A-L]$|3º)/.test(name)

  const borderCls = enc
    ? 'border-[#009C3B]'
    : hasPalpite
    ? 'border-[#002776]/40'
    : 'border-gray-200'

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: NODE_W, height: NODE_H, position: 'relative' }}
      className={`rounded-xl border overflow-hidden text-[11px] shadow-sm text-left
        active:scale-95 transition-transform cursor-pointer bg-white ${borderCls}`}
    >
      {/* Indicador de palpite */}
      {hasPalpite && (
        <span className="absolute top-1 right-1 z-10" style={{ pointerEvents: 'none' }}>
          {travado
            ? <Lock className="w-2.5 h-2.5 text-[#009C3B]" />
            : <span className="w-2 h-2 rounded-full bg-[#009C3B] block" />
          }
        </span>
      )}

      {/* Time A */}
      <div
        className={`flex items-center gap-1 px-2 border-b border-gray-100 ${
          winnerA ? 'bg-[#FFDF00]/20' : ''
        }`}
        style={{ height: NODE_H / 2 }}
      >
        <FlagImg nome={jogo.time_a} size={13} className="shrink-0" />
        <span className={`truncate flex-1 ${
          isSlot(jogo.time_a) && !enc ? 'text-gray-400 font-normal' : 'font-semibold text-[#002776]'
        } ${winnerA ? 'font-black' : ''}`}>
          {jogo.time_a}
        </span>
        {enc && (
          <span className={`font-black shrink-0 ${winnerA ? 'text-[#002776]' : 'text-gray-400'}`}>
            {jogo.placar_a}
          </span>
        )}
        {winnerA && <Check className="w-3 h-3 text-[#009C3B] shrink-0" />}
      </div>

      {/* Time B */}
      <div
        className={`flex items-center gap-1 px-2 ${
          winnerB ? 'bg-[#FFDF00]/20' : ''
        }`}
        style={{ height: NODE_H / 2 }}
      >
        <FlagImg nome={jogo.time_b} size={13} className="shrink-0" />
        <span className={`truncate flex-1 ${
          isSlot(jogo.time_b) && !enc ? 'text-gray-400 font-normal' : 'font-semibold text-gray-600'
        } ${winnerB ? 'font-black text-[#002776]' : ''}`}>
          {jogo.time_b}
        </span>
        {enc && (
          <span className={`font-black shrink-0 ${winnerB ? 'text-[#002776]' : 'text-gray-300'}`}>
            {jogo.placar_b}
          </span>
        )}
        {winnerB && <Check className="w-3 h-3 text-[#009C3B] shrink-0" />}
      </div>
    </button>
  )
}

// ─── Connectors ─────────────────────────────────────────────────────────────
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
            <line x1={0} y1={y1} x2={0} y2={y2} stroke="#002776" strokeWidth={1.5} strokeOpacity={0.15} />
            <line x1={0} y1={ym} x2={CONN_W} y2={ym} stroke="#002776" strokeWidth={1.5} strokeOpacity={0.25} />
          </g>
        )
      })}
    </svg>
  )
}

// Posição Y do jogo de 3º lugar (abaixo da semi inferior)
// POSITIONS[3][1] = y da semi de baixo = 736, + NODE_H + gap
const POS_TERCEIRO = POSITIONS[3][1] + NODE_H + 24

// ─── Componente principal ───────────────────────────────────────────────────
interface Props {
  jogos: Jogo[]
  jogoTerceiro?: Jogo
  palpitesPorJogo: Record<number, Palpite>
  userId: string
  nomeUsuario?: string | null
  avatarUrl?: string | null
}

export default function BracketView({ jogos, jogoTerceiro, palpitesPorJogo, userId, nomeUsuario, avatarUrl }: Props) {
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null)

  const rounds = ROUNDS.map(({ fase }) => jogos.filter(j => j.fase === fase))
  const totalW = ROUNDS.length * NODE_W + (ROUNDS.length - 1) * CONN_W
  const totalH = jogoTerceiro ? Math.max(TOTAL_H, POS_TERCEIRO + NODE_H + 4) : TOTAL_H

  return (
    <>
      <div className="overflow-x-auto -mx-3 px-3 pb-2">
        {/* Cabeçalho */}
        <div className="flex mb-3" style={{ minWidth: totalW }}>
          {ROUNDS.map(({ label }, ri) => (
            <div key={label} className="flex items-center" style={{ flexShrink: 0 }}>
              <div style={{ width: NODE_W }} className="text-center">
                <span className="text-[9px] font-black text-[#002776]/60 uppercase tracking-widest">
                  {label}
                </span>
              </div>
              {ri < ROUNDS.length - 1 && <div style={{ width: CONN_W }} />}
            </div>
          ))}
        </div>

        {/* Bracket */}
        <div className="relative" style={{ height: totalH, minWidth: totalW }}>
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
                        onClick={() => {
                          if (!jogo) return
                          const slot = /^(V\.|P\.|[12][A-L]$|3[oº°])/.test(jogo.time_a) || /^(V\.|P\.|[12][A-L]$|3[oº°])/.test(jogo.time_b)
                          if (!slot) setJogoSelecionado(jogo)
                        }}
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

          {/* 3º Lugar — coluna da Final, abaixo da semi inferior */}
          {jogoTerceiro && (() => {
            const finalCol = (ROUNDS.length - 1) * (NODE_W + CONN_W)
            const palpite  = palpitesPorJogo[jogoTerceiro.id]
            return (
              <div style={{ position: 'absolute', top: POS_TERCEIRO, left: finalCol }}>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-center mb-1">
                  🥉 3º Lugar
                </p>
                <GameNode
                  jogo={jogoTerceiro}
                  hasPalpite={!!palpite}
                  travado={palpite?.travado ?? false}
                  onClick={() => setJogoSelecionado(jogoTerceiro)}
                />
              </div>
            )
          })()}
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
