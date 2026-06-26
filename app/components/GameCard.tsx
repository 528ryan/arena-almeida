'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, Share2, Lock, Pencil, Clock, ChevronDown, Users } from 'lucide-react'
import ScoreSelector from './ScoreSelector'
import { createClient } from '@/lib/supabase/client'
import FlagImg from './FlagImg'
import { compartilharCard } from '@/lib/shareCard'
import type { Jogo, Palpite, PalpiteParticipante } from '@/types'

type GameCardProps = {
  jogo: Jogo
  palpiteInicial: Palpite | null
  userId: string
  nomeUsuario?: string | null
  avatarUrl?: string | null
  todosPalpites?: PalpiteParticipante[]
}


type SaveStatus = 'idle' | 'saving' | 'saved'

/** Times que são slots (confronto ainda não definido) */
function isSlot(nome: string): boolean {
  return /^(V\.|P\.|[12][A-L]$|3[oº°])/.test(nome)
}

/** Retorna o deadline de edição: grupos usam prazo_edicao (ou 6h antes), mata-mata sempre 1h antes */
function getDeadline(jogo: { data_hora: string; prazo_edicao: string | null; grupo: string | null }): Date {
  const d = new Date(jogo.data_hora)
  if (jogo.grupo) {
    if (jogo.prazo_edicao) return new Date(jogo.prazo_edicao)
    d.setHours(d.getHours() - 6)
  } else {
    d.setHours(d.getHours() - 1)
  }
  return d
}

function isPrazoEncerrado(jogo: { data_hora: string; prazo_edicao: string | null; grupo: string | null }): boolean {
  return new Date() >= getDeadline(jogo)
}

function formatarPrazo(jogo: { data_hora: string; prazo_edicao: string | null; grupo: string | null }): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(getDeadline(jogo))
}

export default function GameCard({ jogo, palpiteInicial, userId, nomeUsuario, avatarUrl, todosPalpites = [] }: GameCardProps) {
  const [golsA, setGolsA] = useState(palpiteInicial?.gols_a ?? 0)
  const [golsB, setGolsB] = useState(palpiteInicial?.gols_b ?? 0)
  const [travado, setTravado] = useState(palpiteInicial?.travado ?? false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [mostrarPalpites, setMostrarPalpites] = useState(false)

  const isEncerrado    = jogo.status === 'encerrado'
  const prazoEncerrado = isPrazoEncerrado(jogo)
  const teamsUndefined = isSlot(jogo.time_a) || isSlot(jogo.time_b)
  // O seletor fica bloqueado se: jogo encerrado, prazo esgotado, palpite travado, ou times indefinidos
  const bloqueado = isEncerrado || prazoEncerrado || travado || teamsUndefined

  async function salvar(a: number, b: number, novoTravado: boolean) {
    setSaveStatus('saving')
    const supabase = createClient()
    const { error } = await supabase.from('palpites').upsert(
      { user_id: userId, jogo_id: jogo.id, gols_a: a, gols_b: b, travado: novoTravado },
      { onConflict: 'user_id,jogo_id' }
    )
    setSaveStatus(error ? 'idle' : 'saved')
    if (!error) setTimeout(() => setSaveStatus('idle'), 2000)
  }

  async function cravar() {
    setTravado(true)
    await salvar(golsA, golsB, true)
  }

  async function editar() {
    setTravado(false)
    await salvar(golsA, golsB, false)
  }

  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'downloaded'>('idle')

  async function compartilhar() {
    setShareStatus('sharing')
    try {
      const result = await compartilharCard({
        time_a: jogo.time_a,
        time_b: jogo.time_b,
        gols_a: golsA,
        gols_b: golsB,
        grupo: jogo.grupo,
        fase: jogo.fase ?? null,
        data_hora: jogo.data_hora,
        nomeUsuario,
        avatarUrl,
      })
      if (result === 'downloaded') {
        setShareStatus('downloaded')
        setTimeout(() => setShareStatus('idle'), 3000)
      } else {
        setShareStatus('idle')
      }
    } catch {
      setShareStatus('idle')
    }
  }

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(jogo.data_hora))

  // Palpites de outros ordenados: usuário atual primeiro, depois restantes
  const palpitesOrdenados = [
    ...todosPalpites.filter(p => p.user_id === userId),
    ...todosPalpites.filter(p => p.user_id !== userId),
  ]

  // Scores visíveis após prazo encerrado ou jogo encerrado
  const scoresVisiveis = prazoEncerrado || isEncerrado

  return (
    <div className={`bg-white rounded-2xl shadow-md overflow-hidden border ${
      travado && !isEncerrado ? 'border-[#009C3B]' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className="bg-[#002776] px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          {dataFormatada}
        </span>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && <Loader2 className="w-4 h-4 text-[#FFDF00] animate-spin" />}
          {saveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-[#FFDF00]" />}
          {isEncerrado && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
              Encerrado
            </span>
          )}
          {!isEncerrado && prazoEncerrado && (
            <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Prazo encerrado
            </span>
          )}
          {!isEncerrado && !prazoEncerrado && travado && (
            <span className="text-xs bg-[#009C3B] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Cravado
            </span>
          )}
        </div>
      </div>

      {teamsUndefined ? (
        /* Times ainda não definidos — sem formulário de palpite */
        <div className="px-4 py-5 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-semibold text-base">{jogo.time_a}</span>
            <span className="text-gray-300 font-black">×</span>
            <span className="text-gray-400 font-semibold text-base">{jogo.time_b}</span>
          </div>
          <p className="text-gray-300 text-xs font-semibold mt-1">Confronto ainda não definido</p>
        </div>
      ) : (
        <>
          {/* Seletor de placar */}
          <div className="px-4 py-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#002776] font-bold text-lg flex-1 truncate pr-2 flex items-center gap-1.5"><FlagImg nome={jogo.time_a} size={20} />{jogo.time_a}</span>
              <ScoreSelector value={golsA} onChange={setGolsA} disabled={bloqueado} />
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-gray-400 text-sm font-semibold">VS</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[#002776] font-bold text-lg flex-1 truncate pr-2 flex items-center gap-1.5"><FlagImg nome={jogo.time_b} size={20} />{jogo.time_b}</span>
              <ScoreSelector value={golsB} onChange={setGolsB} disabled={bloqueado} />
            </div>
          </div>

          {/* Rodapé */}
          <div className="px-4 pb-4 flex flex-col gap-3">

            {/* Resultado oficial / prazo */}
            <div className="flex items-center justify-between text-sm">
              {isEncerrado && jogo.placar_a !== null ? (
                <span className="text-gray-500">
                  Resultado: <strong className="text-[#009C3B]">{jogo.placar_a} x {jogo.placar_b}</strong>
                </span>
              ) : !isEncerrado && !prazoEncerrado && !travado ? (
                <span className="text-gray-400 flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Crave até {formatarPrazo(jogo)}
                </span>
              ) : (
                <span />
              )}

              <button
                onClick={compartilhar}
                disabled={shareStatus === 'sharing'}
                className="flex items-center gap-1.5 bg-[#002776] text-white px-3 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform shadow disabled:opacity-60"
                aria-label="Compartilhar palpite"
              >
                {shareStatus === 'sharing'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Share2 className="w-4 h-4" />
                }
                {shareStatus === 'downloaded' ? 'Baixado!' : 'Compartilhar'}
              </button>
            </div>

            {/* Botões de ação — só aparecem em jogos pendentes */}
            {!isEncerrado && (
              <div>
                {/* Cravar — visível quando não travado e prazo não encerrou */}
                {!travado && !prazoEncerrado && (
                  <button
                    onClick={cravar}
                    disabled={saveStatus === 'saving'}
                    className="w-full py-3.5 rounded-xl bg-[#009C3B] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4" />
                    Cravar resultado
                  </button>
                )}

                {/* Editar — visível quando travado mas prazo ainda não encerrou */}
                {travado && !prazoEncerrado && (
                  <button
                    onClick={editar}
                    disabled={saveStatus === 'saving'}
                    className="w-full py-3.5 rounded-xl border-2 border-[#002776] text-[#002776] font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar palpite
                  </button>
                )}

                {/* Prazo encerrado — sem ação */}
                {prazoEncerrado && (
                  <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Edição encerrada
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Palpites dos participantes */}
      {palpitesOrdenados.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            type="button"
            onClick={() => setMostrarPalpites(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm text-gray-500 active:bg-gray-50 transition-colors"
          >
            <span className="font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Palpites ({palpitesOrdenados.length})
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mostrarPalpites ? 'rotate-180' : ''}`} />
          </button>

          {mostrarPalpites && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              {!scoresVisiveis && (
                <p className="text-[10px] text-gray-400 font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Placar revelado após encerrar palpites
                </p>
              )}
              {palpitesOrdenados.map((p) => {
                const isMe = p.user_id === userId
                return (
                  <div key={p.user_id} className={`flex items-center gap-2.5 py-1 ${isMe ? 'opacity-100' : ''}`}>
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full bg-[#002776]/10 overflow-hidden flex items-center justify-center shrink-0">
                      {p.foto_url
                        ? <img src={p.foto_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[10px] font-black text-[#002776]">
                            {p.nome?.charAt(0).toUpperCase() ?? '?'}
                          </span>
                      }
                    </div>
                    {/* Nome */}
                    <span className={`flex-1 text-sm truncate ${isMe ? 'font-black text-[#002776]' : 'font-semibold text-gray-600'}`}>
                      {isMe ? 'Você' : (p.nome ?? 'Anônimo')}
                    </span>
                    {/* Placar */}
                    <span className={`text-sm font-black tabular-nums ${
                      scoresVisiveis || isMe
                        ? 'text-[#002776]'
                        : 'text-gray-300'
                    }`}>
                      {scoresVisiveis || isMe
                        ? `${p.gols_a} × ${p.gols_b}`
                        : '? × ?'
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
