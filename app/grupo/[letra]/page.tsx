import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Lock, Clock, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import TabelaGrupo from '@/app/components/TabelaGrupo'
import FlagImg from '@/app/components/FlagImg'
import type { Jogo } from '@/types'

interface Props {
  params: Promise<{ letra: string }>
}

type PalpitePublico = {
  user_id: string
  jogo_id: number
  gols_a: number
  gols_b: number
  pontos: number
  travado: boolean
  perfil: { nome: string; foto_url: string | null }
}

function getDeadline(jogo: Pick<Jogo, 'data_hora' | 'prazo_edicao'>): Date {
  if (jogo.prazo_edicao) return new Date(jogo.prazo_edicao)
  const d = new Date(jogo.data_hora)
  d.setHours(d.getHours() - 6)
  return d
}

function Initials({ nome, size = 32 }: { nome: string; size?: number }) {
  const initials = nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      className="rounded-full bg-[#002776] text-white font-black flex items-center justify-center text-[11px] shrink-0"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}

function PontosBadge({ pontos }: { pontos: number }) {
  const cls =
    pontos === 3 ? 'bg-green-100 text-green-700' :
    pontos === 1 ? 'bg-yellow-100 text-yellow-700' :
                   'bg-gray-100 text-gray-400'
  return (
    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${cls}`}>
      {pontos > 0 ? `+${pontos}` : '0'}
    </span>
  )
}

function JogoScoreCard({
  jogo,
  palpites,
  currentUserId,
}: {
  jogo: Jogo
  palpites: PalpitePublico[]
  currentUserId: string
}) {
  const isEncerrado = jogo.status === 'encerrado'
  const prazoPassou = new Date() >= getDeadline(jogo)

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  // For finished: sort by pontos desc, then name. Otherwise: current user first, then alphabetical.
  const sorted = [...palpites].sort((a, b) => {
    if (isEncerrado) {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos
      return a.perfil.nome.localeCompare(b.perfil.nome)
    }
    if (a.user_id === currentUserId) return -1
    if (b.user_id === currentUserId) return 1
    return a.perfil.nome.localeCompare(b.perfil.nome)
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      {/* Cabeçalho do jogo */}
      <div className="bg-[#002776] px-4 py-3">
        {/* Times + placar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <FlagImg nome={jogo.time_a} size={18} />
            <span className="text-white font-bold text-sm truncate">{jogo.time_a}</span>
          </div>

          <div className="shrink-0 px-2 text-center">
            {isEncerrado && jogo.placar_a !== null ? (
              <span className="text-[#FFDF00] font-black text-2xl tabular-nums leading-none">
                {jogo.placar_a}&thinsp;–&thinsp;{jogo.placar_b}
              </span>
            ) : (
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">vs</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className="text-white font-bold text-sm truncate text-right">{jogo.time_b}</span>
            <FlagImg nome={jogo.time_b} size={18} />
          </div>
        </div>

        {/* Data + status */}
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-[11px]">{dataFormatada}</span>
          {isEncerrado ? (
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
              Encerrado
            </span>
          ) : prazoPassou ? (
            <span className="text-[10px] bg-orange-400 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Aguardando
            </span>
          ) : (
            <span className="text-[10px] bg-[#009C3B] text-white px-2 py-0.5 rounded-full font-bold">
              Aberto
            </span>
          )}
        </div>
      </div>

      {/* Lista de participantes */}
      {sorted.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-5 text-gray-400">
          <Users className="w-4 h-4" />
          <span className="text-sm">Nenhum palpite ainda</span>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {sorted.map((p) => {
            const isMe = p.user_id === currentUserId
            // Show actual palpite only if: game ended, prazo passed, or user locked it
            const revelarPlacar = isEncerrado || prazoPassou || p.travado

            return (
              <div
                key={p.user_id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isMe ? 'bg-[#009C3B]/5' : ''
                }`}
              >
                {/* Avatar */}
                {p.perfil.foto_url ? (
                  <img
                    src={p.perfil.foto_url}
                    alt={p.perfil.nome}
                    width={32}
                    height={32}
                    className="rounded-full object-cover shrink-0 w-8 h-8"
                  />
                ) : (
                  <Initials nome={p.perfil.nome} size={32} />
                )}

                {/* Nome */}
                <span className={`flex-1 text-sm font-semibold truncate ${
                  isMe ? 'text-[#009C3B]' : 'text-gray-700'
                }`}>
                  {p.perfil.nome}
                  {isMe && (
                    <span className="ml-1.5 text-[10px] text-[#009C3B]/70 font-normal">você</span>
                  )}
                </span>

                {/* Palpite */}
                {revelarPlacar ? (
                  <span className={`font-black tabular-nums text-sm shrink-0 ${
                    isMe ? 'text-[#009C3B]' : 'text-gray-600'
                  }`}>
                    {p.gols_a}&thinsp;×&thinsp;{p.gols_b}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-[#009C3B] font-bold shrink-0">
                    <Lock className="w-3 h-3" />
                    Palpitou
                  </span>
                )}

                {/* Pontos (só encerrado) */}
                {isEncerrado && <PontosBadge pontos={p.pontos} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
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

  const { data: todosPalpitesData } = await supabase
    .from('palpites')
    .select('user_id, jogo_id, gols_a, gols_b, pontos, travado, perfil:perfis(nome, foto_url)')
    .in('jogo_id', jogos.map(j => j.id))

  const palpitesPorJogo = new Map<number, PalpitePublico[]>()
  for (const p of (todosPalpitesData ?? []) as unknown as PalpitePublico[]) {
    const arr = palpitesPorJogo.get(p.jogo_id) ?? []
    arr.push(p)
    palpitesPorJogo.set(p.jogo_id, arr)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-[#009C3B] px-4 py-4 sticky top-0 z-10 shadow-lg">
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
        <TabelaGrupo jogos={jogos} />

        {jogos.map(jogo => (
          <JogoScoreCard
            key={jogo.id}
            jogo={jogo}
            palpites={palpitesPorJogo.get(jogo.id) ?? []}
            currentUserId={userId}
          />
        ))}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 pb-20">
        Arena Almeida · Bolão da Família
      </footer>
    </div>
  )
}
