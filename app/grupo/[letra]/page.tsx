import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import TabelaGrupo from '@/app/components/TabelaGrupo'
import GameCard from '@/app/components/GameCard'
import type { Jogo, Palpite } from '@/types'

interface Props {
  params: Promise<{ letra: string }>
}

export default async function GrupoPage({ params }: Props) {
  const { letra } = await params
  const grupo = letra.toUpperCase()

  const supabase = await createClient()

  const [{ data: { user } }, { data: jogosData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('jogos')
      .select('*')
      .eq('grupo', grupo)
      .order('data_hora', { ascending: true }),
  ])

  const jogos = (jogosData ?? []) as Jogo[]
  if (jogos.length === 0) notFound()

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-[#002776] px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-[#FFDF00] text-[#002776] font-black text-xl flex items-center justify-center">
              {grupo}
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none">Grupo {grupo}</h1>
              <p className="text-[#FFDF00] text-xs font-semibold">
                {jogos.length} jogos · {jogos.filter(j => j.status === 'encerrado').length} encerrados
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Tabela de classificação */}
        <TabelaGrupo jogos={jogos} />

        {/* Cards dos jogos */}
        {jogos.map(jogo => (
          <GameCard
            key={jogo.id}
            jogo={jogo}
            palpiteInicial={palpitesPorJogo[jogo.id] ?? null}
            userId={userId}
            nomeUsuario={nomeUsuario}
            avatarUrl={avatarUrl}
          />
        ))}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 pb-20">
        Arena Almeida · Bolão da Família
      </footer>
    </div>
  )
}
