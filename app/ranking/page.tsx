import Image from 'next/image'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Perfil } from '@/types'

const MEDALHAS    = ['🥇', '🥈', '🥉']
const COR_POSICAO = [
  'bg-[#FFDF00] text-[#002776]',
  'bg-gray-200 text-gray-700',
  'bg-amber-600 text-white',
]

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const { aba } = await searchParams
  const abaAtiva = aba === 'apostadores' ? 'apostadores' : 'geral'

  const supabase = await createClient()
  const [{ data: { user } }, { data: perfisData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('perfis').select('*').order('pontos', { ascending: false }),
  ])

  const todos         = (perfisData ?? []) as Perfil[]
  const numApostadores = todos.filter(p => p.pago).length
  const abaEfetiva    = abaAtiva === 'apostadores' && numApostadores === 0 ? 'geral' : abaAtiva
  const lista   = abaEfetiva === 'apostadores' ? todos.filter(p => p.pago) : todos
  const top3    = lista.slice(0, 3)
  const resto   = lista.slice(3)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#002776] px-4 pt-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 pb-3">
            <div className="w-10 h-10 rounded-full bg-[#FFDF00] flex items-center justify-center">
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

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        {lista.length === 0 && (
          <p className="text-center text-gray-400 mt-20 text-sm">
            {abaAtiva === 'apostadores'
              ? 'Nenhum apostador cadastrado ainda.'
              : 'Nenhum participante ainda.'}
          </p>
        )}

        {/* Pódio top 3 */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-3 mb-8 px-2">
            {top3[1] && (
              <Link href={top3[1].id === user?.id ? '/perfil' : `/perfil/${top3[1].id}`}>
                <PodiumCard perfil={top3[1]} posicao={1} isMe={top3[1].id === user?.id} />
              </Link>
            )}
            <Link href={top3[0].id === user?.id ? '/perfil' : `/perfil/${top3[0].id}`}>
              <PodiumCard perfil={top3[0]} posicao={0} isMe={top3[0].id === user?.id} grande />
            </Link>
            {top3[2] && (
              <Link href={top3[2].id === user?.id ? '/perfil' : `/perfil/${top3[2].id}`}>
                <PodiumCard perfil={top3[2]} posicao={2} isMe={top3[2].id === user?.id} />
              </Link>
            )}
          </div>
        )}

        {/* 4º em diante */}
        {resto.length > 0 && (
          <div className="flex flex-col gap-2">
            {resto.map((perfil, i) => {
              const pos  = i + 4
              const isMe = perfil.id === user?.id
              return (
                <Link
                  key={perfil.id}
                  href={isMe ? '/perfil' : `/perfil/${perfil.id}`}
                  className={`flex items-center gap-4 bg-white rounded-2xl px-4 py-3 shadow-sm active:scale-[0.98] transition-transform ${
                    isMe ? 'ring-2 ring-[#009C3B]' : ''
                  }`}
                >
                  <span className="w-7 text-center font-black text-gray-400 text-sm">{pos}º</span>
                  <Avatar perfil={perfil} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isMe ? 'text-[#009C3B]' : 'text-[#002776]'}`}>
                      {perfil.nome}{isMe && ' (você)'}
                    </p>
                  </div>
                  <Pts pontos={perfil.pontos} />
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function PodiumCard({ perfil, posicao, isMe, grande = false }: {
  perfil: Perfil; posicao: number; isMe: boolean; grande?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-2xl">{MEDALHAS[posicao]}</span>
      <div className={`rounded-full border-4 ${
        isMe ? 'border-[#009C3B]' : posicao === 0 ? 'border-[#FFDF00]' : 'border-gray-300'
      }`}>
        <Avatar perfil={perfil} size={grande ? 80 : 56} />
      </div>
      <p className={`font-bold text-center leading-tight ${grande ? 'text-sm' : 'text-xs'} text-[#002776] max-w-[80px] truncate`}>
        {isMe ? 'Você' : perfil.nome.split(' ')[0]}
      </p>
      <div className={`rounded-xl px-3 py-1 font-black text-sm ${COR_POSICAO[posicao]}`}>
        <Pts pontos={perfil.pontos} />
      </div>
    </div>
  )
}

function Avatar({ perfil, size }: { perfil: Perfil; size: number }) {
  const iniciais = perfil.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div className="rounded-full overflow-hidden shrink-0 bg-[#009C3B]"
      style={{ width: size, height: size, minWidth: size }}>
      {perfil.foto_url ? (
        <Image src={perfil.foto_url} alt={perfil.nome} width={size} height={size}
          className="object-cover w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white font-black"
          style={{ fontSize: size * 0.35 }}>
          {iniciais}
        </div>
      )}
    </div>
  )
}

function Pts({ pontos }: { pontos: number }) {
  return (
    <span className="tabular-nums">
      {pontos} <span className="font-normal opacity-70 text-xs">pts</span>
    </span>
  )
}
