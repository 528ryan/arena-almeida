'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, RefreshCw, ChevronDown, ChevronUp, Pencil, Lock, Unlock } from 'lucide-react'
import { fecharJogo, reabrirJogo, atualizarTimes } from '@/app/actions/admin'
import type { Jogo } from '@/types'

// ─── Card de jogo ─────────────────────────────────────────────────────────
function JogoCard({ jogo }: { jogo: Jogo }) {
  const [placarA, setPlacarA] = useState(jogo.placar_a ?? 0)
  const [placarB, setPlacarB] = useState(jogo.placar_b ?? 0)
  const [timeA, setTimeA]     = useState(jogo.time_a)
  const [timeB, setTimeB]     = useState(jogo.time_b)
  const [editTimes, setEditTimes] = useState(false)
  const [isPending, start]    = useTransition()

  const enc = jogo.status === 'encerrado'

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  function step(setter: (v: number) => void, val: number, delta: number) {
    setter(Math.max(0, val + delta))
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      enc ? 'border-[#009C3B]' : 'border-gray-100'
    }`}>
      {/* Cabeçalho */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        enc ? 'bg-[#009C3B]' : 'bg-[#002776]'
      }`}>
        <span className="text-white text-xs font-semibold">{dataFormatada}</span>
        {enc
          ? <span className="flex items-center gap-1 text-white text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Encerrado</span>
          : <span className="text-white/60 text-xs">Pendente</span>
        }
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Nomes dos times (editável em knockout) */}
        {editTimes ? (
          <div className="flex flex-col gap-2">
            <input
              value={timeA}
              onChange={e => setTimeA(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#002776] font-semibold focus:outline-none focus:border-[#002776]"
              placeholder="Time A"
            />
            <input
              value={timeB}
              onChange={e => setTimeB(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#002776] font-semibold focus:outline-none focus:border-[#002776]"
              placeholder="Time B"
            />
            <div className="flex gap-2">
              <button
                disabled={isPending}
                onClick={() => start(async () => { await atualizarTimes(jogo.id, timeA, timeB); setEditTimes(false) })}
                className="flex-1 py-2 rounded-xl bg-[#002776] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                Salvar times
              </button>
              <button
                onClick={() => { setTimeA(jogo.time_a); setTimeB(jogo.time_b); setEditTimes(false) }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold active:scale-95 transition-transform"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-black text-[#002776] text-base leading-tight">{jogo.time_a}</p>
              <p className="text-gray-400 text-xs my-0.5">vs</p>
              <p className="font-black text-[#002776] text-base leading-tight">{jogo.time_b}</p>
            </div>
            {!enc && (
              <button
                onClick={() => setEditTimes(true)}
                className="p-2 rounded-xl bg-gray-100 text-gray-400 active:bg-gray-200 transition-colors"
                title="Editar nomes dos times"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Seletor de placar */}
        {!editTimes && (
          <div className="flex items-center gap-3">
            {/* Time A */}
            <div className="flex items-center gap-2 flex-1 justify-center">
              <button
                onClick={() => step(setPlacarA, placarA, -1)}
                disabled={enc}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
              >−</button>
              <span className="w-10 text-center font-black text-2xl text-[#002776] tabular-nums">{placarA}</span>
              <button
                onClick={() => step(setPlacarA, placarA, 1)}
                disabled={enc}
                className="w-9 h-9 rounded-full bg-[#002776] text-white font-bold text-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
              >+</button>
            </div>

            <span className="text-gray-300 font-bold text-xl">×</span>

            {/* Time B */}
            <div className="flex items-center gap-2 flex-1 justify-center">
              <button
                onClick={() => step(setPlacarB, placarB, -1)}
                disabled={enc}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
              >−</button>
              <span className="w-10 text-center font-black text-2xl text-[#002776] tabular-nums">{placarB}</span>
              <button
                onClick={() => step(setPlacarB, placarB, 1)}
                disabled={enc}
                className="w-9 h-9 rounded-full bg-[#002776] text-white font-bold text-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
              >+</button>
            </div>
          </div>
        )}

        {/* Ações */}
        {!editTimes && (
          <div className="flex gap-2">
            {!enc ? (
              <button
                disabled={isPending}
                onClick={() => start(() => fecharJogo(jogo.id, placarA, placarB))}
                className="flex-1 py-3 rounded-xl bg-[#009C3B] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {isPending ? 'Salvando…' : 'Fechar jogo'}
              </button>
            ) : (
              <button
                disabled={isPending}
                onClick={() => start(() => reabrirJogo(jogo.id))}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                {isPending ? 'Reabrindo…' : 'Reabrir jogo'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Seção colapsável ──────────────────────────────────────────────────────
function Secao({ titulo, jogos, defaultOpen = false }: { titulo: string; jogos: Jogo[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const enc = jogos.filter(j => j.status === 'encerrado').length

  return (
    <div className="flex flex-col gap-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between px-1 py-2"
      >
        <div className="flex items-center gap-2">
          <span className="font-black text-[#002776] text-sm uppercase tracking-wider">{titulo}</span>
          <span className="text-xs text-gray-400 font-semibold">{enc}/{jogos.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="flex flex-col gap-3 pb-2">
          {jogos.map(j => <JogoCard key={j.id} jogo={j} />)}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────
const FASES_ORDEM = ['Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final']

export default function AdminJogos({ jogos }: { jogos: Jogo[] }) {
  const grupos = jogos.filter(j => j.grupo)
  const knockout = jogos.filter(j => !j.grupo)

  const jogosPorGrupo = grupos.reduce<Record<string, Jogo[]>>((acc, j) => {
    const g = j.grupo!
    acc[g] = acc[g] ?? []
    acc[g].push(j)
    return acc
  }, {})

  const jogosPorFase = knockout.reduce<Record<string, Jogo[]>>((acc, j) => {
    const f = j.fase ?? 'Outro'
    acc[f] = acc[f] ?? []
    acc[f].push(j)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-1">
      {/* Grupos */}
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-1 pt-2 pb-1">Fase de Grupos</p>
      {Object.keys(jogosPorGrupo).sort().map(g => (
        <Secao key={g} titulo={`Grupo ${g}`} jogos={jogosPorGrupo[g]} />
      ))}

      {/* Mata-mata */}
      {FASES_ORDEM.filter(f => jogosPorFase[f]).length > 0 && (
        <>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-1 pt-4 pb-1">Mata-Mata</p>
          {FASES_ORDEM.filter(f => jogosPorFase[f]).map(f => (
            <Secao key={f} titulo={f} jogos={jogosPorFase[f]} defaultOpen={f === 'Oitavas de Final'} />
          ))}
        </>
      )}
    </div>
  )
}
