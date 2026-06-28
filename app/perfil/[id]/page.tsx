import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, DollarSign, Crown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { SELECOES } from '@/lib/selecoes'
import FlagImg from '@/app/components/FlagImg'
import MoneyRain from '@/app/components/MoneyRain'
import EstatisticasPerfil from '@/app/components/EstatisticasPerfil'
import PalpitesAgrupados from '@/app/components/PalpitesAgrupados'
import type { Perfil, Jogo, Palpite } from '@/types'

type PalpiteComJogo = Palpite & { jogo: Jogo | null }

export default async function PerfilPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (id === user.id) redirect('/perfil')

  const [{ data: perfilData, error: perfilError }, { data: palpitesData, error: palpitesError }] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', id).single(),
    supabase
      .from('palpites')
      .select('id, jogo_id, gols_a, gols_b, pontos, travado, criado_em, jogo:jogos(id, time_a, time_b, data_hora, placar_a, placar_b, status, grupo, fase)')
      .eq('user_id', id)
      .order('criado_em', { ascending: false }),
  ])

  if (perfilError || !perfilData) notFound()
  if (palpitesError) throw new Error(palpitesError.message)

  const perfil   = perfilData as Perfil
  const palpites = (palpitesData ?? []) as unknown as PalpiteComJogo[]

  const encerrados = palpites.filter(p => p.jogo?.status === 'encerrado')
  const acertos    = encerrados.filter(p => p.pontos === 3).length
  const parciais   = encerrados.filter(p => p.pontos === 1).length
  const taxaAcerto = encerrados.length > 0 ? Math.round((acertos / encerrados.length) * 100) : null

  // Conta quantos usuários têm mais pontos → posição = count + 1
  const { count: acima, error: rankError } = await supabase
    .from('perfis')
    .select('*', { count: 'exact', head: true })
    .gt('pontos', perfil.pontos)

  if (rankError) throw new Error(rankError.message)
  const posicao = (acima ?? 0) + 1

  const tema        = perfil.selecao_favorita ? SELECOES[perfil.selecao_favorita] : null
  const corFundo    = tema?.cor1 ?? '#002776'
  const corAcento   = tema?.cor2 ?? '#FFDF00'
  const textoAcento = tema?.texto ?? 'escuro'

  const iniciais = perfil.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-[#013d16]">
      {/* Header temático */}
      <header
        className="px-4 pt-10 pb-8 shadow-lg relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${corFundo} 0%, ${corFundo}cc 100%)` }}
      >
        {perfil.pago && <MoneyRain />}

        {/* Botão voltar */}
        <Link
          href="/ranking"
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>

        <div className="max-w-md mx-auto flex flex-col items-center gap-3 relative">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-lg">
            {perfil.foto_url ? (
              <Image
                src={perfil.foto_url}
                alt={perfil.nome}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-black text-3xl">
                {iniciais}
              </div>
            )}
          </div>

          {/* Nome */}
          <p className="text-white font-black text-2xl text-center">{perfil.nome}</p>

          {/* Coroa do líder */}
          {posicao === 1 && (
            <span className="flex items-center gap-1 bg-[#FFDF00]/20 text-[#FFDF00] text-xs font-bold px-3 py-1 rounded-full">
              <Crown className="w-3 h-3" />
              Líder do ranking
            </span>
          )}

          {/* Badge apostador */}
          {perfil.pago && (
            <span className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              <DollarSign className="w-3 h-3" />
              Apostador
            </span>
          )}

          {/* Seleção favorita */}
          {perfil.selecao_favorita && (
            <span className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
              <FlagImg nome={perfil.selecao_favorita} size={16} />
              {perfil.selecao_favorita}
            </span>
          )}

          {/* Badge de pontos + posição */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-5 py-1.5 rounded-full shadow"
              style={{
                backgroundColor: corAcento,
                color: textoAcento === 'escuro' ? '#1a1a1a' : '#ffffff',
              }}
            >
              <span className="font-black text-xl tabular-nums">{perfil.pontos}</span>
              <span className="font-semibold text-sm">pontos</span>
            </div>
            {posicao > 0 && (
              <div className="flex items-center gap-1 bg-white/15 px-3 py-1.5 rounded-full">
                <span className="text-white font-black text-sm tabular-nums">{posicao}º</span>
                <span className="text-white/60 text-xs font-semibold">lugar</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Stats */}
        <section className="grid grid-cols-4 gap-2">
          {[
            { label: 'Palpites',  valor: String(palpites.length), cor: 'text-[#002776]' },
            { label: 'Exatos',    valor: String(acertos),         cor: 'text-[#009C3B]' },
            { label: 'Parciais',  valor: String(parciais),        cor: 'text-yellow-600' },
            { label: 'Acerto',    valor: taxaAcerto !== null ? `${taxaAcerto}%` : '—', cor: 'text-[#002776]' },
          ].map(({ label, valor, cor }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <p className={`font-black text-xl tabular-nums ${cor}`}>{valor}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </section>

        {/* Estatísticas */}
        <EstatisticasPerfil palpites={palpites} selecaoFavorita={perfil.selecao_favorita} />

        {/* Palpites */}
        <section>
          <h2 className="text-white font-black text-base mb-3">Palpites</h2>
          <PalpitesAgrupados palpites={palpites} />
        </section>
      </main>
    </div>
  )
}
