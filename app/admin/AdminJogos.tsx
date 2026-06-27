'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Pencil, Lock, Unlock } from 'lucide-react'
import { fecharJogo, reabrirJogo, atualizarTimes } from '@/app/actions/admin'
import { calcularClassificacao } from '@/lib/classificacao'
import type { Jogo, ClassificacaoTime } from '@/types'

// ─── Helpers de slot ───────────────────────────────────────────────────────
function isGroupSlot(nome: string) {
  return /^[12]\s*[º°o]?\s*(Grupo\s*)?[A-L]$/i.test(nome.trim()) || /^3[º°]/.test(nome)
}
function isKnockoutSlot(nome: string) {
  return /^(V\.|P\.)/.test(nome)
}
function isSlot(nome: string) {
  return isGroupSlot(nome) || isKnockoutSlot(nome)
}

// ─── Tipos ─────────────────────────────────────────────────────────────────
type TimeDisponivel = {
  nome: string
  info: string // e.g. "1º Grupo A", "3º Melhor #1"
}

// ─── Seletor unificado de times ─────────────────────────────────────────────
function TimeSelector({
  value,
  times,
  onChange,
}: {
  value: string
  times: TimeDisponivel[]
  onChange: (nome: string) => void
}) {
  if (times.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic text-center py-2">
        Nenhum grupo encerrado ainda
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
      {times.map(t => (
        <button
          key={t.nome}
          type="button"
          onClick={() => onChange(t.nome)}
          className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between gap-2 ${
            value === t.nome
              ? 'bg-[#002776] text-white'
              : 'bg-gray-100 text-[#002776] active:bg-gray-200'
          }`}
        >
          <span>{t.nome}</span>
          <span className={`text-xs shrink-0 ${value === t.nome ? 'text-white/70' : 'text-gray-400'}`}>
            {t.info}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Card de jogo ─────────────────────────────────────────────────────────
function JogoCard({ jogo, timesDisponiveis }: { jogo: Jogo; timesDisponiveis: TimeDisponivel[] }) {
  const [placarA, setPlacarA] = useState(jogo.placar_a ?? 0)
  const [placarB, setPlacarB] = useState(jogo.placar_b ?? 0)
  const [timeA, setTimeA]     = useState(jogo.time_a)
  const [timeB, setTimeB]     = useState(jogo.time_b)
  const [editTimes, setEditTimes] = useState(false)
  const [isPending, start]    = useTransition()

  const enc = jogo.status === 'encerrado'
  const slotA = isSlot(jogo.time_a)
  const slotB = isSlot(jogo.time_b)
  const timesResolvidos = !slotA && !slotB
  const mostrarLapis = !enc

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  function step(setter: (v: number) => void, val: number, delta: number) {
    setter(Math.max(0, val + delta))
  }

  function renderLadoEdit(
    nomeOriginal: string,
    value: string,
    label: string,
    onChange: (v: string) => void,
  ) {
    if (isSlot(nomeOriginal)) {
      return (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-wide">{label}</p>
          <TimeSelector value={value} times={timesDisponiveis} onChange={onChange} />
        </div>
      )
    }
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#002776] font-semibold focus:outline-none focus:border-[#002776]"
        placeholder={label}
      />
    )
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
        {/* Modo edição de times */}
        {editTimes ? (
          <div className="flex flex-col gap-3">
            {renderLadoEdit(jogo.time_a, timeA, 'Time A', setTimeA)}
            {renderLadoEdit(jogo.time_b, timeB, 'Time B', setTimeB)}
            <div className="flex gap-2">
              <button
                disabled={isPending}
                onClick={() => start(async () => { await atualizarTimes(jogo.id, timeA, timeB); setEditTimes(false) })}
                className="flex-1 py-2 rounded-xl bg-[#002776] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                {isPending ? 'Salvando…' : 'Salvar times'}
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
          /* Modo visualização */
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`font-black text-base leading-tight ${slotA ? 'text-gray-400 italic text-sm' : 'text-[#002776]'}`}>
                {jogo.time_a}
              </p>
              <p className="text-gray-400 text-xs my-0.5">vs</p>
              <p className={`font-black text-base leading-tight ${slotB ? 'text-gray-400 italic text-sm' : 'text-[#002776]'}`}>
                {jogo.time_b}
              </p>
            </div>
            {mostrarLapis && (
              <button
                onClick={() => setEditTimes(true)}
                className="p-2 rounded-xl bg-gray-100 text-gray-400 active:bg-gray-200 transition-colors"
                title={slotA || slotB ? 'Selecionar times' : 'Editar times'}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Placar — só quando os dois times estão resolvidos */}
        {!editTimes && timesResolvidos && (
          <div className="flex items-center gap-3">
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
        {!editTimes && timesResolvidos && (
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

        {enc && !timesResolvidos && (
          <button
            disabled={isPending}
            onClick={() => start(() => reabrirJogo(jogo.id))}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Unlock className="w-4 h-4" />
            {isPending ? 'Reabrindo…' : 'Reabrir jogo'}
          </button>
        )}

        {!editTimes && !enc && !timesResolvidos && (
          <p className="text-[11px] text-gray-400 italic text-center">
            Toque no lápis para definir os times
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Seção colapsável ──────────────────────────────────────────────────────
function Secao({
  titulo,
  jogos,
  timesDisponiveis = [],
  defaultOpen = false,
}: {
  titulo: string
  jogos: Jogo[]
  timesDisponiveis?: TimeDisponivel[]
  defaultOpen?: boolean
}) {
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
          {jogos.map(j => <JogoCard key={j.id} jogo={j} timesDisponiveis={timesDisponiveis} />)}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────
const FASES_ORDEM = [
  '16 avos de Final',
  'Oitavas de Final',
  'Quartas de Final',
  'Semifinal',
  'Disputa de 3º Lugar',
  'Final',
]

export default function AdminJogos({ jogos }: { jogos: Jogo[] }) {
  const grupos   = jogos.filter(j => j.grupo)
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

  // Todos os times classificados dos grupos encerrados (1º, 2º e 3º)
  // ordenados por: posição (1º→2º→3º) e grupo (A→L)
  const timesDisponiveis: TimeDisponivel[] = Object.entries(jogosPorGrupo)
    .filter(([, jogosG]) => jogosG.every(j => j.status === 'encerrado'))
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([grupo, jogosG]) => {
      const cls = calcularClassificacao(jogosG)
      const result: TimeDisponivel[] = []
      if (cls[0]) result.push({ nome: cls[0].nome, info: `1º Grupo ${grupo}` })
      if (cls[1]) result.push({ nome: cls[1].nome, info: `2º Grupo ${grupo}` })
      if (cls[2]) result.push({ nome: cls[2].nome, info: `3º Grupo ${grupo}` })
      return result
    })

  // Adiciona vencedores de jogos mata-mata já encerrados (para fases avançadas)
  const knockoutWinners: TimeDisponivel[] = knockout
    .filter(j => j.status === 'encerrado' && !isSlot(j.time_a) && !isSlot(j.time_b) && j.placar_a !== null && j.placar_b !== null)
    .map(j => {
      const vencedor = j.placar_a! >= j.placar_b! ? j.time_a : j.time_b
      return { nome: vencedor, info: `V. Jogo ${j.id} · ${j.fase ?? ''}` }
    })
    .filter(t => !timesDisponiveis.some(d => d.nome === t.nome))

  const todosTimesDisponiveis = [...timesDisponiveis, ...knockoutWinners]

  const fasesKnockout = FASES_ORDEM.filter(f => jogosPorFase[f])

  return (
    <div className="flex flex-col gap-1">
      {/* Grupos */}
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-1 pt-2 pb-1">Fase de Grupos</p>
      {Object.keys(jogosPorGrupo).sort().map(g => (
        <Secao key={g} titulo={`Grupo ${g}`} jogos={jogosPorGrupo[g]} />
      ))}

      {/* Mata-mata */}
      {fasesKnockout.length > 0 && (
        <>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-1 pt-4 pb-1">Mata-Mata</p>
          {fasesKnockout.map(f => (
            <Secao
              key={f}
              titulo={f}
              jogos={jogosPorFase[f]}
              timesDisponiveis={todosTimesDisponiveis}
              defaultOpen={f === '16 avos de Final'}
            />
          ))}
        </>
      )}
    </div>
  )
}
