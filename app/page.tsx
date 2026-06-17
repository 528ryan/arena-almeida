import Link from 'next/link'
import { Trophy, GitMerge, LayoutGrid } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/components/LogoutButton'
import ContadorRegressivo from '@/app/components/ContadorRegressivo'
import GruposFiltro from '@/app/components/GruposFiltro'
import JogosDia from '@/app/components/JogosDia'
import type { TopScorer, JogoHoje } from '@/app/components/JogosDia'

export default async function Home() {
  const supabase = await createClient()

  // Range for today in Brasília using proper IANA timezone
  const nowUTC = new Date()
  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(nowUTC)
  const todayStartUTC = new Date(`${todayStr}T00:00:00-03:00`)
  const tomorrowStartUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000)

  const [{ data: jogosData }, { data: { user } }, { data: jogosDiaData }] = await Promise.all([
    supabase.from('jogos').select('id, grupo, status, data_hora').not('grupo', 'is', null),
    supabase.auth.getUser(),
    supabase
      .from('jogos')
      .select('*')
      .gte('data_hora', todayStartUTC.toISOString())
      .lt('data_hora', tomorrowStartUTC.toISOString())
      .order('data_hora', { ascending: true }),
  ])

  // Top scorers for finished games today
  const finishedIds = (jogosDiaData ?? [])
    .filter(j => j.status === 'encerrado')
    .map(j => j.id)

  const topScorersMap = new Map<number, TopScorer[]>()

  if (finishedIds.length > 0) {
    const { data: palpitesHoje } = await supabase
      .from('palpites')
      .select('jogo_id, pontos, perfil:perfis(nome, foto_url)')
      .in('jogo_id', finishedIds)
      .gt('pontos', 0)

    const byJogo = new Map<number, { jogo_id: number; pontos: number; perfil: unknown }[]>()
    for (const p of palpitesHoje ?? []) {
      const arr = byJogo.get(p.jogo_id) ?? []
      arr.push(p)
      byJogo.set(p.jogo_id, arr)
    }
    for (const [jogoId, ps] of byJogo) {
      const maxPts = Math.max(...ps.map(p => p.pontos))
      topScorersMap.set(
        jogoId,
        ps
          .filter(p => p.pontos === maxPts)
          .map(p => ({
            nome: (p.perfil as { nome: string; foto_url: string | null }).nome,
            foto_url: (p.perfil as { nome: string; foto_url: string | null }).foto_url,
            pontos: p.pontos,
          }))
      )
    }
  }

  const jogosDia: JogoHoje[] = (jogosDiaData ?? []).map(j => ({
    ...j,
    topScorers: topScorersMap.get(j.id) ?? [],
  }))

  const jogoIds = (jogosData ?? []).map(j => j.id as string)

  let cravadosSet  = new Set<string>()
  let palpitesSet  = new Set<string>()

  if (user && jogoIds.length > 0) {
    const [{ data: cravadosData }, { data: todosPalpitesData }] = await Promise.all([
      supabase
        .from('palpites')
        .select('jogo_id')
        .eq('user_id', user.id)
        .eq('travado', true)
        .in('jogo_id', jogoIds),
      supabase
        .from('palpites')
        .select('jogo_id')
        .eq('user_id', user.id)
        .in('jogo_id', jogoIds),
    ])
    cravadosSet = new Set((cravadosData ?? []).map(p => p.jogo_id as string))
    palpitesSet = new Set((todosPalpitesData ?? []).map(p => p.jogo_id as string))
  }

  // Resumo por grupo + detectar ao vivo (started ≤ 110 min ago, not encerrado)
  const LIVE_MIN = 110
  const grupos = new Map<string, { total: number; cravados: number; semPalpite: number; aoVivo: boolean }>()
  ;(jogosData ?? []).forEach(j => {
    const g = j.grupo as string
    if (!grupos.has(g)) grupos.set(g, { total: 0, cravados: 0, semPalpite: 0, aoVivo: false })
    const s = grupos.get(g)!
    s.total++
    if (cravadosSet.has(j.id as string)) s.cravados++
    if (!palpitesSet.has(j.id as string) && j.status !== 'encerrado') s.semPalpite++
    if (j.status !== 'encerrado' && j.data_hora) {
      const diff = (nowUTC.getTime() - new Date(j.data_hora as string).getTime()) / 60_000
      if (diff >= 0 && diff <= LIVE_MIN) s.aoVivo = true
    }
  })

  const gruposOrdenados = Array.from(grupos.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letra, dados]) => ({ letra, ...dados }))

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-[#002776] px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#009C3B] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#FFDF00]" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none">Arena Almeida</h1>
              <p className="text-[#FFDF00] text-xs font-semibold">Bolão da Copa</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col gap-5">

        <JogosDia jogos={jogosDia} />

        <ContadorRegressivo />

        {/* Seção: Fase de Grupos */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="w-5 h-5 text-[#002776]" strokeWidth={2.5} />
            <h2 className="text-[#002776] font-black text-lg">Fase de Grupos</h2>
          </div>

          {gruposOrdenados.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Nenhum grupo cadastrado ainda.</p>
          ) : (
            <GruposFiltro grupos={gruposOrdenados} />
          )}
        </section>

        {/* Seção: Mata-Mata */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <GitMerge className="w-5 h-5 text-[#002776]" strokeWidth={2.5} />
            <h2 className="text-[#002776] font-black text-lg">Mata-Mata</h2>
          </div>

          <Link href="/mata-mata">
            <div className="rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform">
              <div className="bg-gradient-to-r from-[#002776] to-[#009C3B] px-5 py-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-black text-lg leading-none mb-1">Fase Eliminatória</p>
                  <p className="text-[#FFDF00] text-xs font-semibold">
                    Fase 32 · Oitavas · Quartas · Semis · Final
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FFDF00] flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-[#002776]" />
                </div>
              </div>
            </div>
          </Link>
        </section>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 pb-20">
        Arena Almeida · Bolão da Família
      </footer>
    </div>
  )
}
