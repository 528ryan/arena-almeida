import Link from 'next/link'
import Image from 'next/image'
import { Trophy, GitMerge, LayoutGrid, Star, Medal } from 'lucide-react'
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

  const [
    { data: jogosData },
    { data: { user } },
    { data: jogosDiaData },
    { data: jogoAnteriorData },
    { data: jogoPosteriorData },
    { data: todosPerfilData },
  ] = await Promise.all([
    supabase.from('jogos').select('id, grupo, status, data_hora').not('grupo', 'is', null),
    supabase.auth.getUser(),
    supabase
      .from('jogos')
      .select('*')
      .gte('data_hora', todayStartUTC.toISOString())
      .lt('data_hora', tomorrowStartUTC.toISOString())
      .order('data_hora', { ascending: true }),
    supabase
      .from('jogos')
      .select('*')
      .lt('data_hora', todayStartUTC.toISOString())
      .order('data_hora', { ascending: false })
      .limit(1),
    supabase
      .from('jogos')
      .select('*')
      .gte('data_hora', tomorrowStartUTC.toISOString())
      .order('data_hora', { ascending: true })
      .limit(1),
    supabase.from('perfis').select('id, nome, foto_url, pontos').order('pontos', { ascending: false }),
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

  // Hero: user's perfil + ranking position with tie-awareness
  const perfilUsuario = user ? (todosPerfilData ?? []).find(p => p.id === user.id) : null
  let posicaoUsuario: number | null = null
  if (perfilUsuario && todosPerfilData) {
    const sorted = [...todosPerfilData].sort((a, b) => (b.pontos ?? 0) - (a.pontos ?? 0))
    let pos = 1
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].pontos !== sorted[i - 1].pontos) pos = i + 1
      if (sorted[i].id === user!.id) { posicaoUsuario = pos; break }
    }
  }
  const totalParticipantes = (todosPerfilData ?? []).length

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1f3d]">
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

        {/* Hero: boas-vindas do usuário */}
        {perfilUsuario && (
          <div className="relative overflow-hidden rounded-2xl shadow-lg bg-[#002776]">
            {/* decorative circles */}
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />

            <div className="relative px-5 py-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="shrink-0">
                {perfilUsuario.foto_url ? (
                  <Image
                    src={perfilUsuario.foto_url}
                    alt={perfilUsuario.nome ?? ''}
                    width={52}
                    height={52}
                    className="w-[52px] h-[52px] rounded-full object-cover border-2 border-[#FFDF00]"
                  />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-full bg-[#FFDF00] flex items-center justify-center border-2 border-[#FFDF00]">
                    <span className="text-[#002776] font-black text-xl">
                      {(perfilUsuario.nome ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name + points */}
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-xs font-semibold leading-none mb-0.5">Bem-vindo de volta</p>
                <p className="text-white font-black text-lg leading-tight truncate">
                  {perfilUsuario.nome ?? 'Participante'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-3.5 h-3.5 text-[#FFDF00] fill-[#FFDF00]" />
                  <span className="text-[#FFDF00] font-bold text-sm">
                    {perfilUsuario.pontos ?? 0} pts
                  </span>
                </div>
              </div>

              {/* Rank badge */}
              {posicaoUsuario !== null && (
                <Link href="/ranking" className="shrink-0 flex flex-col items-center gap-0.5 active:opacity-70">
                  <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 gap-0.5 ${
                    posicaoUsuario === 1 ? 'bg-[#FFDF00] border-[#FFDF00]' :
                    posicaoUsuario === 2 ? 'bg-gray-300 border-gray-400' :
                    posicaoUsuario === 3 ? 'bg-amber-600 border-amber-700' :
                    'bg-white/10 border-white/20'
                  }`}>
                    {posicaoUsuario <= 3 && (
                      <Medal className={`w-4 h-4 ${
                        posicaoUsuario === 1 ? 'text-[#002776]' :
                        posicaoUsuario === 2 ? 'text-gray-700' :
                        'text-white'
                      }`} />
                    )}
                    <span className={`font-black text-xs leading-none ${
                      posicaoUsuario === 1 ? 'text-[#002776]' :
                      posicaoUsuario === 2 ? 'text-gray-700' :
                      'text-white'
                    }`}>
                      {posicaoUsuario}º
                    </span>
                  </div>
                  <span className="text-white/50 text-[9px] font-semibold">de {totalParticipantes}</span>
                </Link>
              )}
            </div>
          </div>
        )}

        <JogosDia
          jogos={jogosDia}
          jogoAnterior={(jogoAnteriorData?.[0] ?? null) as import('@/types').Jogo | null}
          jogoPosterior={(jogoPosteriorData?.[0] ?? null) as import('@/types').Jogo | null}
        />

        {/* Seção: Mata-Mata */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <GitMerge className="w-5 h-5 text-white/70" strokeWidth={2.5} />
            <h2 className="text-white font-black text-lg">Mata-Mata</h2>
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

        <ContadorRegressivo />

        {/* Seção: Fase de Grupos */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="w-5 h-5 text-white/70" strokeWidth={2.5} />
            <h2 className="text-white font-black text-lg">Fase de Grupos</h2>
          </div>

          {gruposOrdenados.length === 0 ? (
            <p className="text-center text-white/40 py-8">Nenhum grupo cadastrado ainda.</p>
          ) : (
            <GruposFiltro
            grupos={gruposOrdenados}
            jogosGrupo={(jogosData ?? []).map(j => ({
              id: j.id as number,
              grupo: j.grupo as string,
              status: j.status as string,
              data_hora: j.data_hora as string,
            }))}
          />
          )}
        </section>
      </main>

      <footer className="text-center py-4 text-xs text-white/30 pb-20">
        Arena Almeida · Bolão da Família
      </footer>
    </div>
  )
}
