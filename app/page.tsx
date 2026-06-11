import Link from 'next/link'
import { Trophy, GitMerge, LayoutGrid } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/app/components/LogoutButton'
import ContadorRegressivo from '@/app/components/ContadorRegressivo'
import GruposFiltro from '@/app/components/GruposFiltro'

export default async function Home() {
  const supabase = await createClient()

  const [{ data: jogosData }, { data: { user } }] = await Promise.all([
    supabase.from('jogos').select('id, grupo, status').not('grupo', 'is', null),
    supabase.auth.getUser(),
  ])

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

  // Resumo por grupo
  const grupos = new Map<string, { total: number; cravados: number; semPalpite: number }>()
  ;(jogosData ?? []).forEach(j => {
    const g = j.grupo as string
    if (!grupos.has(g)) grupos.set(g, { total: 0, cravados: 0, semPalpite: 0 })
    const s = grupos.get(g)!
    s.total++
    if (cravadosSet.has(j.id as string)) s.cravados++
    if (!palpitesSet.has(j.id as string) && j.status !== 'encerrado') s.semPalpite++
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
