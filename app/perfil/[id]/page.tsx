import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Lock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { SELECOES } from '@/lib/selecoes'
import FlagImg from '@/app/components/FlagImg'
import MoneyRain from '@/app/components/MoneyRain'
import type { Perfil, Jogo, Palpite } from '@/types'

type PalpiteComJogo = Palpite & { jogo: Jogo | null }

function TagPontos({ pontos, status }: { pontos: number; status: string }) {
  if (status !== 'encerrado') {
    return <span className="text-[10px] text-gray-400 font-semibold">Pendente</span>
  }
  const cls =
    pontos === 3 ? 'bg-green-100 text-green-700' :
    pontos === 1 ? 'bg-yellow-100 text-yellow-700' :
                   'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${cls}`}>
      {pontos} pts
    </span>
  )
}

function PalpiteCard({ palpite }: { palpite: PalpiteComJogo }) {
  const jogo = palpite.jogo
  if (!jogo) return null
  const enc   = jogo.status === 'encerrado'
  const label = jogo.grupo ? `Grupo ${jogo.grupo}` : (jogo.fase ?? 'Eliminatória')
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#002776]/5 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[#002776] text-sm truncate">{jogo.time_a} × {jogo.time_b}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {dataFormatada} · <span className="font-semibold">{label}</span>
          </p>
        </div>
        <TagPontos pontos={palpite.pontos} status={jogo.status} />
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">Palpite</p>
          <div className="flex items-center gap-1.5">
            <p className="font-black text-[#002776] text-xl tabular-nums">
              {palpite.gols_a} × {palpite.gols_b}
            </p>
            {palpite.travado && <Lock className="w-3.5 h-3.5 text-[#009C3B]" />}
          </div>
        </div>
        {enc && jogo.placar_a !== null ? (
          <div className="text-right">
            <p className="text-[10px] text-gray-400 mb-0.5">Resultado</p>
            <p className="font-black text-gray-700 text-xl tabular-nums">
              {jogo.placar_a} × {jogo.placar_b}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-300 font-semibold">Aguardando resultado</p>
        )}
      </div>
    </div>
  )
}

export default async function PerfilPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (id === user.id) redirect('/perfil')

  const [{ data: perfilData }, { data: palpitesData }, { data: rankingData }] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', id).single(),
    supabase
      .from('palpites')
      .select('*, jogo:jogos(id, time_a, time_b, data_hora, placar_a, placar_b, status, grupo, fase)')
      .eq('user_id', id)
      .order('criado_em', { ascending: false }),
    supabase.from('perfis').select('id, pontos').order('pontos', { ascending: false }),
  ])

  if (!perfilData) notFound()

  const perfil   = perfilData as Perfil
  const palpites = (palpitesData ?? []) as PalpiteComJogo[]

  const encerrados = palpites.filter(p => p.jogo?.status === 'encerrado')
  const acertos    = encerrados.filter(p => p.pontos === 3).length
  const parciais   = encerrados.filter(p => p.pontos === 1).length
  const taxaAcerto = encerrados.length > 0 ? Math.round((acertos / encerrados.length) * 100) : null

  const posicao = (rankingData ?? []).findIndex(p => p.id === id) + 1

  const tema        = perfil.selecao_favorita ? SELECOES[perfil.selecao_favorita] : null
  const corFundo    = tema?.cor1 ?? '#002776'
  const corAcento   = tema?.cor2 ?? '#FFDF00'
  const textoAcento = tema?.texto ?? 'escuro'

  const iniciais = perfil.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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

        {/* Palpites */}
        <section>
          <h2 className="text-[#002776] font-black text-base mb-3">Palpites</h2>
          {palpites.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">
              Nenhum palpite ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {palpites.map(p => <PalpiteCard key={p.id} palpite={p} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
