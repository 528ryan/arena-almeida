import Link from 'next/link'
import { ChevronLeft, Trophy } from 'lucide-react'
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

const FASE_ICONE: Record<string, string> = {
  '16 avos de Final':    '⚔️',
  'Oitavas de Final':    '🥊',
  'Quartas de Final':    '🏅',
  'Semifinal':           '🌟',
  'Disputa de 3º Lugar': '🥉',
  'Final':               '🏆',
}

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

  const jogos = (jogosData ?? []) as Jogo[]
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

  // Ordem correta do bracket FIFA (top → bottom)
  // 16 avos: M74,M77,M73,M75 | M76,M78,M79,M80 | M83,M84,M81,M82 | M86,M88,M85,M87
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
    // Oitavas de Final (posições 0–7)
    96, 95, 97, 98, 99, 100, 101, 102,
    // Quartas de Final
    103, 104, 105, 106,
    // Semifinal
    107, 108,
    // Final
    110,
  ]

  // Jogos para o bracket visual (16 avos → Final)
  const jogosParaBracket = jogos
    .filter(j => ['16 avos de Final', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'].includes(j.fase ?? ''))
    .sort((a, b) => {
      const pa = BRACKET_ORDER.indexOf(a.id)
      const pb = BRACKET_ORDER.indexOf(b.id)
      return (pa === -1 ? 9999 : pa) - (pb === -1 ? 9999 : pb)
    })

  // Fases com jogos (excluindo as do bracket visual, exibidas separadamente abaixo)
  const fasesAbaixo = FASE_ORDEM.filter(fase =>
    jogos.some(j => j.fase === fase)
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-[#002776] px-4 py-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-[#FFDF00] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#002776]" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none">Mata-Mata</h1>
              <p className="text-[#FFDF00] text-xs font-semibold">Fase Eliminatória</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full py-6 flex flex-col gap-6">

        {/* Bracket visual: Oitavas → Final */}
        {jogosParaBracket.length > 0 && (
          <section className="px-4">
            <h2 className="text-[#002776] font-black text-base mb-1">Chaveamento</h2>
            <p className="text-xs text-gray-400 mb-3">Toque em um jogo para fazer seu palpite</p>
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

        {/* Jogos por fase */}
        {fasesAbaixo.map(fase => {
          const jogosFase = jogos.filter(j => j.fase === fase)
          if (jogosFase.length === 0) return null
          return (
            <section key={fase} className="px-4">
              <h2 className="text-[#002776] font-black text-base mb-3 flex items-center gap-2">
                <span>{FASE_ICONE[fase]}</span>
                {fase}
              </h2>
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

      <footer className="text-center py-4 text-xs text-gray-400 pb-20">
        Arena Almeida · Bolão da Família
      </footer>
    </div>
  )
}
