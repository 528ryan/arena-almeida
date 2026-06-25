import Link from 'next/link'
import { ChevronLeft, Trophy, Swords } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BracketView from '@/app/components/BracketView'
import GameCard from '@/app/components/GameCard'
import type { Jogo, Palpite } from '@/types'

const FASE_ORDEM = [
  '16 avos de Final',
  'Oitavas de Final',
  'Quartas de Final',
  'Semifinal',
  'Disputa de 3º Lugar',
  'Final',
]

const FASE_META: Record<string, { emoji: string; cor: string; desc: string }> = {
  '16 avos de Final':    { emoji: '⚔️',  cor: 'bg-blue-50 border-blue-200 text-blue-700',    desc: '32 equipes, 16 jogos' },
  'Oitavas de Final':    { emoji: '🥊',  cor: 'bg-purple-50 border-purple-200 text-purple-700', desc: '16 equipes, 8 jogos' },
  'Quartas de Final':    { emoji: '🏅',  cor: 'bg-amber-50 border-amber-200 text-amber-700',  desc: '8 equipes, 4 jogos' },
  'Semifinal':           { emoji: '🌟',  cor: 'bg-orange-50 border-orange-200 text-orange-700', desc: '4 equipes, 2 jogos' },
  'Disputa de 3º Lugar': { emoji: '🥉',  cor: 'bg-stone-50 border-stone-200 text-stone-700',  desc: 'Disputa pelo bronze' },
  'Final':               { emoji: '🏆',  cor: 'bg-yellow-50 border-yellow-300 text-yellow-800', desc: 'A grande decisão' },
}

// Ordem correta do bracket FIFA (top → bottom)
const BRACKET_ORDER = [
  // 16 avos de Final (posições 0–15 no bracket)
  81, 84,  // M74, M77 → oitavas Filadélfia
  79, 82,  // M73, M75 → oitavas Houston
  80, 83,  // M76, M78 → oitavas East Rutherford
  85, 86,  // M79, M80 → oitavas Cidade do México
  90, 89,  // M83, M84 → oitavas Arlington
  88, 87,  // M81, M82 → oitavas Seattle
  93, 92,  // M86, M88 → oitavas Atlanta
  91, 94,  // M85, M87 → oitavas Vancouver
  // Oitavas de Final
  96, 95, 97, 98, 99, 100, 101, 102,
  // Quartas de Final
  103, 104, 105, 106,
  // Semifinal
  107, 108,
  // Final
  110,
]

export default async function MataMataPage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: jogosData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('jogos')
      .select('*')
      .is('grupo', null)
      .order('data_hora', { ascending: true }),
  ])

  const jogos  = (jogosData ?? []) as Jogo[]
  const userId = user?.id ?? ''

  const { data: perfilData } = await supabase
    .from('perfis').select('nome, foto_url').eq('id', userId).single()
  const nomeUsuario = perfilData?.nome    ?? null
  const avatarUrl   = perfilData?.foto_url ?? null

  const { data: palpitesData } = await supabase
    .from('palpites')
    .select('*')
    .eq('user_id', userId)
    .in('jogo_id', jogos.map(j => j.id))

  const palpitesPorJogo = Object.fromEntries(
    (palpitesData ?? []).map((p: Palpite) => [p.jogo_id, p])
  )

  // Jogos do bracket (ordenados por posição correta da FIFA)
  const jogosParaBracket = jogos
    .filter(j => ['16 avos de Final', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'].includes(j.fase ?? ''))
    .sort((a, b) => {
      const pa = BRACKET_ORDER.indexOf(a.id)
      const pb = BRACKET_ORDER.indexOf(b.id)
      return (pa === -1 ? 9999 : pa) - (pb === -1 ? 9999 : pb)
    })

  // Stats do usuário
  const jogosComPlacar = jogos.filter(j => j.status === 'encerrado')
  const totalMataJogos = jogos.filter(j => j.fase && j.fase !== 'Disputa de 3º Lugar').length
  const totalPalpites  = Object.keys(palpitesPorJogo).length
  const totalEncerrados = jogosComPlacar.length

  // Fases visíveis na lista
  const fasesAbaixo = FASE_ORDEM.filter(fase => jogos.some(j => j.fase === fase))

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-[#002776] px-4 pt-4 pb-0 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 pb-4">
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-[#FFDF00] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-[#002776]" />
              </div>
              <div>
                <h1 className="text-white font-black text-xl leading-none">Mata-Mata</h1>
                <p className="text-[#FFDF00] text-xs font-semibold">Fase Eliminatória · Copa 2026</p>
              </div>
            </div>
            {/* Progresso compacto no header */}
            <div className="text-right shrink-0">
              <p className="text-[#FFDF00] font-black text-lg leading-none">{totalPalpites}</p>
              <p className="text-white/50 text-[10px] font-semibold">/{totalMataJogos} palp.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full py-5 flex flex-col gap-6 pb-24">

        {/* Banner de progresso */}
        <section className="px-4">
          <div className="bg-[#002776] rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-[#FFDF00]/20 flex items-center justify-center shrink-0">
              <Swords className="w-6 h-6 text-[#FFDF00]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm">Seus palpites</p>
              <p className="text-white/50 text-xs font-semibold mt-0.5">fase eliminatória</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white font-black text-2xl leading-none">{totalPalpites}<span className="text-white/40 text-sm font-semibold">/{totalMataJogos}</span></p>
              {totalEncerrados > 0 && (
                <p className="text-[#009C3B] text-[10px] font-semibold mt-0.5">{totalEncerrados} encerrado{totalEncerrados > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </section>

        {/* Bracket visual */}
        {jogosParaBracket.length > 0 && (
          <section className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#002776] font-black text-base">Chaveamento</h2>
              <span className="text-[10px] text-gray-400 font-semibold">← deslize para ver →</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
              <BracketView
                jogos={jogosParaBracket}
                palpitesPorJogo={palpitesPorJogo}
                userId={userId}
                nomeUsuario={nomeUsuario}
                avatarUrl={avatarUrl}
              />
            </div>
          </section>
        )}

        {/* Disputa de 3º Lugar — fora da árvore do bracket */}
        {(() => {
          const jogo3 = jogos.find(j => j.fase === 'Disputa de 3º Lugar')
          if (!jogo3) return null
          return (
            <section className="px-4">
              <div className="flex items-center justify-between rounded-xl border px-3 py-2.5 mb-3 bg-stone-50 border-stone-200 text-stone-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥉</span>
                  <div>
                    <p className="font-black text-sm leading-none">Disputa de 3º Lugar</p>
                    <p className="text-[10px] opacity-70 font-semibold mt-0.5">Disputa pelo bronze</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm">{palpitesPorJogo[jogo3.id] ? 1 : 0}</span>
                  <span className="opacity-60 text-sm">/1</span>
                  <p className="text-[10px] opacity-60 font-semibold">palpites</p>
                </div>
              </div>
              <GameCard
                jogo={jogo3}
                palpiteInicial={palpitesPorJogo[jogo3.id] ?? null}
                userId={userId}
                nomeUsuario={nomeUsuario}
                avatarUrl={avatarUrl}
              />
            </section>
          )
        })()}

        {/* Jogos por fase */}
        {fasesAbaixo.map(fase => {
          if (fase === 'Disputa de 3º Lugar') return null
          const jogosFase = jogos.filter(j => j.fase === fase)
          if (jogosFase.length === 0) return null
          const meta = FASE_META[fase]
          const palpitesFase = jogosFase.filter(j => palpitesPorJogo[j.id]).length

          return (
            <section key={fase} className="px-4">
              {/* Header da fase */}
              <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 mb-3 ${meta.cor}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <div>
                    <p className="font-black text-sm leading-none">{fase}</p>
                    <p className="text-[10px] opacity-70 font-semibold mt-0.5">{meta.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm">{palpitesFase}</span>
                  <span className="opacity-60 text-sm">/{jogosFase.length}</span>
                  <p className="text-[10px] opacity-60 font-semibold">palpites</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {jogosFase.map(jogo => (
                  <GameCard
                    key={jogo.id}
                    jogo={jogo}
                    palpiteInicial={palpitesPorJogo[jogo.id] ?? null}
                    userId={userId}
                    nomeUsuario={nomeUsuario}
                    avatarUrl={avatarUrl}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
