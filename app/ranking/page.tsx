import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Perfil } from '@/types'

// ─── Types ─────────────────────────────────────────────────────────────────
type Resultado   = 'acerto' | 'parcial' | 'erro' | 'sem-palpite'
type BadgeKey    = 'imparavel' | 'precisao' | 'dormindo' | 'novato'

type JogadorRanking = {
  perfil:      Perfil
  posicao:     number
  ultimas5:    Resultado[]
  streak:      number
  taxaAcerto:  number
  tendencia:   'alta' | 'baixa' | 'estavel'
  deltaPontos: number
  badges:      BadgeKey[]
}

// ─── Badge metadata ─────────────────────────────────────────────────────────
const BADGE: Record<BadgeKey, { emoji: string; label: string }> = {
  imparavel: { emoji: '🔥', label: 'Imparável — 3+ acertos seguidos' },
  precisao:  { emoji: '🎯', label: 'Precisão — 80%+ de acerto' },
  dormindo:  { emoji: '💤', label: 'Dormindo — 3 erros seguidos' },
  novato:    { emoji: '🆕', label: 'Novato — menos de 3 palpites' },
}

// ─── Stats computation ──────────────────────────────────────────────────────
function computarStats(
  id: string,
  jogosOrdenados: { id: number }[],
  palpitesPorUser: Map<string, Map<number, number>>,
): Omit<JogadorRanking, 'perfil' | 'posicao'> {
  const mapa = palpitesPorUser.get(id) ?? new Map<number, number>()

  const toResultado = (j: { id: number }): Resultado => {
    const pts = mapa.get(j.id)
    if (pts === undefined) return 'sem-palpite'
    if (pts >= 3) return 'acerto'
    if (pts >= 1) return 'parcial'
    return 'erro'
  }

  const ultimas5     = jogosOrdenados.slice(0, 5).map(toResultado)
  const anteriores5  = jogosOrdenados.slice(5, 10)

  // Streak: acertos consecutivos do mais recente
  let streak = 0
  for (const r of ultimas5) {
    if (r === 'acerto') streak++
    else break
  }

  // Taxa de acerto geral
  let acertosTotal = 0
  let totalComPalpite = 0
  for (const pts of mapa.values()) {
    totalComPalpite++
    if (pts >= 3) acertosTotal++
  }
  const taxaAcerto = totalComPalpite > 0 ? Math.round((acertosTotal / totalComPalpite) * 100) : 0

  // Tendência: últimas 5 vs anteriores 5
  const pontosRecentes   = jogosOrdenados.slice(0, 5).reduce((s, j) => s + (mapa.get(j.id) ?? 0), 0)
  const pontosAnteriores = anteriores5.reduce((s, j) => s + (mapa.get(j.id) ?? 0), 0)
  const deltaPontos = pontosRecentes - pontosAnteriores
  const tendencia: JogadorRanking['tendencia'] =
    deltaPontos > 0 ? 'alta' : deltaPontos < 0 ? 'baixa' : 'estavel'

  // Badges
  const badges: BadgeKey[] = []
  if (streak >= 3) badges.push('imparavel')
  if (taxaAcerto >= 80 && totalComPalpite >= 4) badges.push('precisao')
  if (totalComPalpite < 3) badges.push('novato')
  const recentes3 = ultimas5.slice(0, 3).filter(r => r !== 'sem-palpite')
  if (recentes3.length >= 2 && recentes3.every(r => r === 'erro')) badges.push('dormindo')

  return { ultimas5, streak, taxaAcerto, tendencia, deltaPontos, badges }
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({
  perfil, size, ringCls = '',
}: {
  perfil: Perfil; size: number; ringCls?: string
}) {
  const iniciais = perfil.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-[#009C3B] ${ringCls ? `border-4 ${ringCls}` : ''}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {perfil.foto_url ? (
        <Image src={perfil.foto_url} alt={perfil.nome} width={size} height={size}
          className="object-cover w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white font-black"
          style={{ fontSize: Math.round(size * 0.35) }}>
          {iniciais}
        </div>
      )}
    </div>
  )
}

// ─── Dots últimas 5 ─────────────────────────────────────────────────────────
const DOT_COLOR: Record<Resultado, string> = {
  acerto:        'bg-green-500',
  parcial:       'bg-yellow-400',
  erro:          'bg-red-400',
  'sem-palpite': 'bg-gray-200',
}

function Dots({ ultimas5 }: { ultimas5: Resultado[] }) {
  return (
    <div className="flex gap-[3px]">
      {ultimas5.map((r, i) => (
        <div key={i} className={`w-3 h-3 rounded-[3px] ${DOT_COLOR[r]}`} />
      ))}
    </div>
  )
}

// ─── Trending ────────────────────────────────────────────────────────────────
function Trending({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-[10px] text-gray-400 font-semibold">→ 0</span>
  const up = delta > 0
  return (
    <span className={`text-[10px] font-bold ${up ? 'text-green-500' : 'text-red-400'}`}>
      {up ? '↗' : '↘'} {up ? '+' : ''}{delta}
    </span>
  )
}

// ─── Legenda ─────────────────────────────────────────────────────────────────
function Legenda() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {([
        ['bg-green-500',  'Acerto'],
        ['bg-yellow-400', 'Parcial'],
        ['bg-red-400',    'Erro'],
        ['bg-gray-200',   'Sem palpite'],
      ] as const).map(([cls, label]) => (
        <div key={label} className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded-[3px] ${cls}`} />
          <span className="text-[10px] text-gray-400">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Pódio ────────────────────────────────────────────────────────────────
const PODIUM_RING    = ['border-yellow-400', 'border-gray-300',  'border-amber-600']
const PODIUM_PTS     = ['bg-yellow-400 text-[#002776]', 'bg-gray-200 text-gray-700', 'bg-amber-600 text-white']
const PODIUM_BASE_H  = ['h-20', 'h-12', 'h-8']
const PODIUM_BASE_BG = ['bg-yellow-400/20', 'bg-gray-300/30', 'bg-amber-600/15']

function PodiumCard({
  jogador, posicao, isMe,
}: {
  jogador: JogadorRanking; posicao: number; isMe: boolean
}) {
  const grande = posicao === 0
  const size   = grande ? 80 : 60
  const href   = isMe ? '/perfil' : `/perfil/${jogador.perfil.id}`

  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform min-w-0">
      {/* Coroa / medalha */}
      {posicao === 0
        ? <Crown className="w-7 h-7 text-yellow-400 drop-shadow" />
        : <span className="text-2xl">{posicao === 1 ? '🥈' : '🥉'}</span>
      }

      {/* Avatar */}
      <Avatar perfil={jogador.perfil} size={size} ringCls={PODIUM_RING[posicao]} />

      {/* Nome */}
      <p className={`font-black text-center text-[#002776] truncate leading-tight ${
        grande ? 'text-sm max-w-[90px]' : 'text-xs max-w-[68px]'
      }`}>
        {isMe ? 'Você' : jogador.perfil.nome.split(' ')[0]}
      </p>

      {/* Badges */}
      {jogador.badges.length > 0 && (
        <div className="flex gap-0.5">
          {jogador.badges.slice(0, 2).map(b => (
            <span key={b} className="text-sm" title={BADGE[b].label}>{BADGE[b].emoji}</span>
          ))}
        </div>
      )}

      {/* Dots */}
      <Dots ultimas5={jogador.ultimas5} />

      {/* Pontos */}
      <div className={`rounded-xl px-3 py-1 font-black text-sm ${PODIUM_PTS[posicao]}`}>
        {jogador.perfil.pontos} <span className="font-normal opacity-70 text-xs">pts</span>
      </div>

      {/* Plataforma */}
      <div className={`w-full rounded-t-lg ${PODIUM_BASE_H[posicao]} ${PODIUM_BASE_BG[posicao]}`} />
    </Link>
  )
}

// ─── Linha ranking (posição 4+) ──────────────────────────────────────────────
function LinhaRanking({ jogador, isMe }: { jogador: JogadorRanking; isMe: boolean }) {
  const href = isMe ? '/perfil' : `/perfil/${jogador.perfil.id}`
  return (
    <Link href={href} className="block active:scale-[0.98] transition-transform">
      <div className={`bg-white rounded-2xl px-4 py-3.5 shadow-sm border ${
        isMe ? 'border-[#009C3B] ring-1 ring-[#009C3B]/20' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          {/* Posição */}
          <span className="w-6 text-center font-black text-sm text-gray-300 shrink-0 tabular-nums">
            {jogador.posicao}°
          </span>

          {/* Avatar */}
          <Avatar perfil={jogador.perfil} size={44} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Nome + badges */}
            <div className="flex items-center gap-1 mb-1.5 min-w-0">
              <p className={`font-bold text-sm truncate ${isMe ? 'text-[#009C3B]' : 'text-[#002776]'}`}>
                {isMe ? 'Você' : jogador.perfil.nome.split(' ')[0]}
              </p>
              {jogador.badges.map(b => (
                <span key={b} className="text-sm shrink-0" title={BADGE[b].label}>
                  {BADGE[b].emoji}
                </span>
              ))}
            </div>
            {/* Dots + trending */}
            <div className="flex items-center gap-2.5">
              <Dots ultimas5={jogador.ultimas5} />
              <Trending delta={jogador.deltaPontos} />
            </div>
          </div>

          {/* Pontos */}
          <div className="text-right shrink-0">
            <p className="font-black text-[#002776] text-xl tabular-nums leading-none">
              {jogador.perfil.pontos}
            </p>
            <p className="text-[10px] text-gray-400 font-semibold">pts</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Card "minha posição" (para quem está fora do pódio) ─────────────────────
function MinhaPosicao({ jogador }: { jogador: JogadorRanking }) {
  return (
    <div className="bg-[#002776] rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-md">
      <div className="text-center shrink-0">
        <p className="text-[#FFDF00] font-black text-2xl tabular-nums leading-none">{jogador.posicao}°</p>
        <p className="text-white/50 text-[10px] font-semibold">lugar</p>
      </div>
      <Avatar perfil={jogador.perfil} size={44} ringCls="border-[#FFDF00]/50" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1.5">
          <p className="text-white font-bold text-sm truncate">Você</p>
          {jogador.badges.map(b => (
            <span key={b} className="text-sm shrink-0" title={BADGE[b].label}>{BADGE[b].emoji}</span>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Dots ultimas5={jogador.ultimas5} />
          <Trending delta={jogador.deltaPontos} />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[#FFDF00] font-black text-xl tabular-nums leading-none">{jogador.perfil.pontos}</p>
        <p className="text-white/50 text-[10px] font-semibold">pts</p>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const { aba } = await searchParams
  const abaAtiva = aba === 'apostadores' ? 'apostadores' : 'geral'

  const supabase = await createClient()

  const [
    { data: { user } },
    { data: perfisData },
    { data: jogosEncData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('perfis').select('*').order('pontos', { ascending: false }),
    supabase
      .from('jogos')
      .select('id, data_hora')
      .eq('status', 'encerrado')
      .order('data_hora', { ascending: false })
      .limit(20),
  ])

  const todos          = (perfisData ?? []) as Perfil[]
  const jogosOrdenados = jogosEncData ?? []

  // Palpites dos últimos 20 jogos encerrados
  const palpitesPorUser = new Map<string, Map<number, number>>()
  if (jogosOrdenados.length > 0) {
    const { data: palpitesData } = await supabase
      .from('palpites')
      .select('user_id, jogo_id, pontos')
      .in('jogo_id', jogosOrdenados.map(j => j.id))

    for (const p of palpitesData ?? []) {
      if (!palpitesPorUser.has(p.user_id)) palpitesPorUser.set(p.user_id, new Map())
      palpitesPorUser.get(p.user_id)!.set(p.jogo_id, p.pontos)
    }
  }

  // Stats por jogador
  const todosComStats: JogadorRanking[] = todos.map((perfil, i) => ({
    perfil,
    posicao: i + 1,
    ...computarStats(perfil.id, jogosOrdenados, palpitesPorUser),
  }))

  const numApostadores = todos.filter(p => p.pago).length
  const abaEfetiva     = abaAtiva === 'apostadores' && numApostadores === 0 ? 'geral' : abaAtiva
  const lista = abaEfetiva === 'apostadores'
    ? todosComStats.filter(j => j.perfil.pago).map((j, i) => ({ ...j, posicao: i + 1 }))
    : todosComStats

  const top3  = lista.slice(0, 3)
  const resto = lista.slice(3)
  const eu    = user ? lista.find(j => j.perfil.id === user.id) : undefined

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header sticky */}
      <header className="bg-[#002776] px-4 pt-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 pb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFDF00] flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-[#002776]" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none">Ranking</h1>
              <p className="text-[#FFDF00] text-xs font-semibold">Arena Almeida</p>
            </div>
          </div>

          {/* Abas */}
          <div className="flex">
            <Link
              href="/ranking?aba=geral"
              className={`flex-1 py-2.5 text-center text-sm font-bold border-b-2 transition-colors ${
                abaEfetiva === 'geral'
                  ? 'border-[#FFDF00] text-[#FFDF00]'
                  : 'border-transparent text-white/50'
              }`}
            >
              Geral
              <span className="ml-1.5 text-xs opacity-70">{todos.length}</span>
            </Link>
            {numApostadores > 0 && (
              <Link
                href="/ranking?aba=apostadores"
                className={`flex-1 py-2.5 text-center text-sm font-bold border-b-2 transition-colors ${
                  abaEfetiva === 'apostadores'
                    ? 'border-[#FFDF00] text-[#FFDF00]'
                    : 'border-transparent text-white/50'
                }`}
              >
                Apostadores
                <span className="ml-1.5 text-xs opacity-70">{numApostadores}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5 flex flex-col gap-5 pb-24">
        {lista.length === 0 ? (
          <p className="text-center text-gray-400 mt-20 text-sm">
            {abaAtiva === 'apostadores' ? 'Nenhum apostador ainda.' : 'Nenhum participante ainda.'}
          </p>
        ) : (
          <>
            {/* Minha posição (fora do pódio) */}
            {eu && eu.posicao > 3 && <MinhaPosicao jogador={eu} />}

            {/* Pódio */}
            {top3.length > 0 && (
              <section className="bg-white rounded-3xl shadow-sm border border-gray-100 pt-5 pb-0 overflow-hidden">
                <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Pódio
                </p>
                <div className="flex items-end justify-center gap-4 px-4">
                  {top3[1] && (
                    <PodiumCard jogador={top3[1]} posicao={1} isMe={top3[1].perfil.id === user?.id} />
                  )}
                  <PodiumCard jogador={top3[0]} posicao={0} isMe={top3[0].perfil.id === user?.id} />
                  {top3[2] && (
                    <PodiumCard jogador={top3[2]} posicao={2} isMe={top3[2].perfil.id === user?.id} />
                  )}
                </div>
              </section>
            )}

            {/* Lista 4+ */}
            {resto.length > 0 && (
              <section className="flex flex-col gap-2">
                {/* Cabeçalho com legenda */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                    Últimos 5 jogos
                  </span>
                  <Legenda />
                </div>

                {resto.map(jogador => (
                  <LinhaRanking
                    key={jogador.perfil.id}
                    jogador={jogador}
                    isMe={jogador.perfil.id === user?.id}
                  />
                ))}
              </section>
            )}

            {/* Rodapé com legenda de badges */}
            {Object.entries(BADGE).length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Badges</p>
                <div className="flex flex-col gap-1.5">
                  {(Object.entries(BADGE) as [BadgeKey, { emoji: string; label: string }][]).map(([, { emoji, label }]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-base">{emoji}</span>
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
