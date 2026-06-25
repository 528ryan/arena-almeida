'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Pencil, Lock, Unlock, RefreshCw } from 'lucide-react'
import { fecharJogo, reabrirJogo, atualizarTimes, resolverSlots } from '@/app/actions/admin'
import { calcularClassificacao } from '@/lib/classificacao'
import type { Jogo, ClassificacaoTime } from '@/types'

// ─── Helpers de slot ───────────────────────────────────────────────────────
// "1A", "2B", "1º Grupo A", "2º Grupo L" → auto-resolvidos quando o grupo encerra
function isSlotAuto(nome: string) {
  return /^[12][A-L]$/.test(nome) || /^[12][º°] Grupo [A-L]$/i.test(nome)
}

// "3º Melhor", "3º (A/B/C)", "3º TBD" → seleção manual pelo admin
function isSlotTerceiro(nome: string) {
  return /^3[º°]/.test(nome)
}

function isSlot(nome: string) {
  return isSlotAuto(nome) || isSlotTerceiro(nome)
}

// ─── Seletor de terceiros colocados ──────────────────────────────────────
function TerceiroSelector({
  value,
  terceiros,
  onChange,
}: {
  value: string
  terceiros: ClassificacaoTime[]
  onChange: (nome: string) => void
}) {
  if (terceiros.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic text-center py-2">
        Nenhum grupo encerrado ainda
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
      {terceiros.map((t, i) => (
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
          <span>{i + 1}. {t.nome}</span>
          <span className={`text-xs shrink-0 ${value === t.nome ? 'text-white/70' : 'text-gray-400'}`}>
            {t.pts}pts · SG{t.sg >= 0 ? '+' : ''}{t.sg}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Card de jogo ─────────────────────────────────────────────────────────
function JogoCard({ jogo, terceiros }: { jogo: Jogo; terceiros: ClassificacaoTime[] }) {
  const [placarA, setPlacarA] = useState(jogo.placar_a ?? 0)
  const [placarB, setPlacarB] = useState(jogo.placar_b ?? 0)
  const [timeA, setTimeA]     = useState(jogo.time_a)
  const [timeB, setTimeB]     = useState(jogo.time_b)
  const [editTimes, setEditTimes] = useState(false)
  const [isPending, start]    = useTransition()

  const enc = jogo.status === 'encerrado'

  const slotAutoA     = isSlotAuto(jogo.time_a)
  const slotAutoB     = isSlotAuto(jogo.time_b)
  const slotTerceiroA = isSlotTerceiro(jogo.time_a)
  const slotTerceiroB = isSlotTerceiro(jogo.time_b)
  // Qualquer lado que não seja um slot auto → permite lápis
  const mostrarLapis  = !enc && !(slotAutoA && slotAutoB)
  // Só mostra placar e botão fechar quando ambos os times estão resolvidos
  const timesResolvidos = !isSlot(jogo.time_a) && !isSlot(jogo.time_b)

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  function step(setter: (v: number) => void, val: number, delta: number) {
    setter(Math.max(0, val + delta))
  }

  function renderLadoEdit(
    nome: string,
    value: string,
    label: string,
    onChange: (v: string) => void,
  ) {
    if (isSlotAuto(nome)) {
      return (
        <div className="px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-500 font-semibold">
          {nome} · Auto (aguardando grupo)
        </div>
      )
    }
    if (isSlotTerceiro(nome)) {
      return (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-wide">{label}</p>
          <TerceiroSelector value={value} terceiros={terceiros} onChange={onChange} />
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
              <p className={`font-black text-base leading-tight ${slotAutoA || slotTerceiroA ? 'text-gray-400 italic text-sm' : 'text-[#002776]'}`}>
                {jogo.time_a}
              </p>
              <p className="text-gray-400 text-xs my-0.5">vs</p>
              <p className={`font-black text-base leading-tight ${slotAutoB || slotTerceiroB ? 'text-gray-400 italic text-sm' : 'text-[#002776]'}`}>
                {jogo.time_b}
              </p>
            </div>
            {mostrarLapis && (
              <button
                onClick={() => setEditTimes(true)}
                className="p-2 rounded-xl bg-gray-100 text-gray-400 active:bg-gray-200 transition-colors"
                title={slotTerceiroA || slotTerceiroB ? 'Selecionar 3º colocado' : 'Editar times'}
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

        {/* Reabrir even when times were slots at close time */}
        {!editTimes && enc && !timesResolvidos && (
          <button
            disabled={isPending}
            onClick={() => start(() => reabrirJogo(jogo.id))}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Unlock className="w-4 h-4" />
            {isPending ? 'Reabrindo…' : 'Reabrir jogo'}
          </button>
        )}

        {/* Aviso quando times ainda não definidos */}
        {!editTimes && !enc && !timesResolvidos && (
          <p className="text-[11px] text-gray-400 italic text-center">
            {slotTerceiroA || slotTerceiroB
              ? 'Toque no lápis para selecionar o 3º colocado'
              : 'Aguardando encerramento do(s) grupo(s)'}
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
  terceiros = [],
  defaultOpen = false,
}: {
  titulo: string
  jogos: Jogo[]
  terceiros?: ClassificacaoTime[]
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
          {jogos.map(j => <JogoCard key={j.id} jogo={j} terceiros={terceiros} />)}
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
  const [isPending, start] = useTransition()

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

  // Calcula os 3ºs colocados de grupos já encerrados, rankeados (melhor primeiro)
  const terceirosDisponiveis: ClassificacaoTime[] = Object.entries(jogosPorGrupo)
    .filter(([, jogosG]) => jogosG.every(j => j.status === 'encerrado'))
    .flatMap(([, jogosG]) => {
      const cls = calcularClassificacao(jogosG)
      return cls[2] ? [cls[2]] : []
    })
    .sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || a.nome.localeCompare(b.nome))
    .slice(0, 8) // máximo 8 melhores terceiros

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
          <div className="flex items-center justify-between px-1 pt-4 pb-1">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Mata-Mata</p>
            <button
              disabled={isPending}
              onClick={() => start(() => resolverSlots())}
              className="flex items-center gap-1 text-[11px] text-[#002776] font-bold disabled:opacity-40 active:opacity-60"
              title="Resolver confrontos automaticamente a partir dos grupos encerrados"
            >
              <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
              Resolver confrontos
            </button>
          </div>
          {fasesKnockout.map(f => (
            <Secao
              key={f}
              titulo={f}
              jogos={jogosPorFase[f]}
              terceiros={terceirosDisponiveis}
              defaultOpen={f === '16 avos de Final'}
            />
          ))}
        </>
      )}
    </div>
  )
}
