import { redirect } from 'next/navigation'
import { Lock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SELECOES } from '@/lib/selecoes'
import EditarNome from './EditarNome'
import FotoUpload from './FotoUpload'
import SairButton from './SairButton'
import PushButton from '@/app/components/PushButton'
import SelecionarSelecao from './SelecionarSelecao'
import type { Perfil, Jogo, Palpite } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────────────────
type PalpiteComJogo = Palpite & { jogo: Jogo | null }

// ─── Tag de pontos ────────────────────────────────────────────────────────
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

// ─── Card de palpite ──────────────────────────────────────────────────────
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
      {/* Cabeçalho */}
      <div className="bg-[#002776]/5 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[#002776] text-sm truncate">
            {jogo.time_a} × {jogo.time_b}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {dataFormatada} · <span className="font-semibold">{label}</span>
          </p>
        </div>
        <TagPontos pontos={palpite.pontos} status={jogo.status} />
      </div>

      {/* Corpo */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">Meu palpite</p>
          <div className="flex items-center gap-1.5">
            <p className="font-black text-[#002776] text-xl tabular-nums">
              {palpite.gols_a} × {palpite.gols_b}
            </p>
            {palpite.travado && <Lock className="w-3.5 h-3.5 text-[#009C3B]" />}
          </div>
        </div>

        {enc && jogo.placar_a !== null ? (
          <div className="text-right">
            <p className="text-[10px] text-gray-400 mb-0.5">Resultado oficial</p>
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

// ─── Página ───────────────────────────────────────────────────────────────
export default async function PerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: perfilData }, { data: palpitesData }] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', user.id).single(),
    supabase
      .from('palpites')
      .select('*, jogo:jogos(id, time_a, time_b, data_hora, placar_a, placar_b, status, grupo, fase)')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false }),
  ])

  const perfil   = perfilData as Perfil | null
  const palpites = (palpitesData ?? []) as PalpiteComJogo[]

  if (!perfil) redirect('/login')

  const encerrados = palpites.filter(p => p.jogo?.status === 'encerrado')
  const acertos    = encerrados.filter(p => p.pontos === 3).length
  const parciais   = encerrados.filter(p => p.pontos === 1).length

  // Tema da seleção favorita
  const tema      = perfil.selecao_favorita ? SELECOES[perfil.selecao_favorita] : null
  const corFundo  = tema?.cor1  ?? '#002776'
  const corAcento = tema?.cor2  ?? '#FFDF00'
  const textoAcento = tema?.texto ?? 'escuro'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header temático */}
      <header
        className="px-4 pt-10 pb-8 shadow-lg"
        style={{ background: `linear-gradient(160deg, ${corFundo} 0%, ${corFundo}cc 100%)` }}
      >
        <div className="max-w-md mx-auto flex flex-col items-center gap-3">
          <FotoUpload
            userId={user.id}
            fotoUrl={perfil.foto_url}
            nome={perfil.nome}
          />
          <EditarNome nomeInicial={perfil.nome} />

          {/* Badge de pontos temático */}
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

          {/* Picker de seleção favorita */}
          <SelecionarSelecao
            selecaoAtual={perfil.selecao_favorita}
            corAcento={corAcento}
            textoAcento={textoAcento}
          />

          {user.email && (
            <p className="text-white/40 text-xs">{user.email}</p>
          )}
          {perfil.is_admin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-white/50 text-xs font-semibold hover:text-white/80 transition-colors mt-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel Admin
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* Estatísticas rápidas */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Palpites',  valor: palpites.length, cor: 'text-[#002776]' },
            { label: 'Exatos',    valor: acertos,         cor: 'text-[#009C3B]' },
            { label: 'Parciais',  valor: parciais,        cor: 'text-yellow-600' },
          ].map(({ label, valor, cor }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <p className={`font-black text-2xl tabular-nums ${cor}`}>{valor}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </section>

        {/* Histórico */}
        <section>
          <h2 className="text-[#002776] font-black text-base mb-3">
            Histórico de Palpites
          </h2>
          {palpites.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">
              Você ainda não fez nenhum palpite.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {palpites.map(p => (
                <PalpiteCard key={p.id} palpite={p} />
              ))}
            </div>
          )}
        </section>

        {/* Notificações */}
        <section className="pb-2">
          <PushButton />
        </section>

        {/* Sair */}
        <section className="pb-4">
          <SairButton />
        </section>
      </main>
    </div>
  )
}
