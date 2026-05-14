import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AdminJogos from './AdminJogos'
import AdminParticipantes from './AdminParticipantes'
import type { Jogo, Perfil } from '@/types'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const { aba } = await searchParams
  const abaAtiva = aba === 'participantes' ? 'participantes' : 'jogos'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfilAdmin } = await supabase
    .from('perfis').select('is_admin').eq('id', user.id).single()
  if (!perfilAdmin?.is_admin) redirect('/')

  const [{ data: jogosData }, { data: perfisData }] = await Promise.all([
    supabase.from('jogos').select('*').order('data_hora', { ascending: true }),
    supabase.from('perfis').select('*').order('pontos', { ascending: false }),
  ])

  const jogos  = (jogosData  ?? []) as Jogo[]
  const perfis = (perfisData ?? []) as Perfil[]

  const enc      = jogos.filter(j => j.status === 'encerrado').length
  const pagantes = perfis.filter(p => p.pago).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#002776] px-4 pt-10 pb-0 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#FFDF00]" />
            <span className="text-[#FFDF00] text-xs font-black uppercase tracking-widest">Painel Admin</span>
          </div>
          <h1 className="text-white font-black text-2xl mb-4">Arena Almeida</h1>

          {/* Abas */}
          <div className="flex">
            <Link
              href="/admin?aba=jogos"
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
                abaAtiva === 'jogos'
                  ? 'border-[#FFDF00] text-[#FFDF00]'
                  : 'border-transparent text-white/50'
              }`}
            >
              Jogos
              <span className="ml-1.5 text-xs opacity-70">{enc}/{jogos.length}</span>
            </Link>
            <Link
              href="/admin?aba=participantes"
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
                abaAtiva === 'participantes'
                  ? 'border-[#FFDF00] text-[#FFDF00]'
                  : 'border-transparent text-white/50'
              }`}
            >
              Participantes
              <span className="ml-1.5 text-xs opacity-70">{pagantes}/{perfis.length}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 pb-28">
        {abaAtiva === 'jogos'
          ? <AdminJogos jogos={jogos} />
          : <AdminParticipantes perfis={perfis} />
        }
      </main>
    </div>
  )
}
