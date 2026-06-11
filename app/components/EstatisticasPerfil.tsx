import type { Jogo, Palpite } from '@/types'

type PalpiteComJogo = Palpite & { jogo: Jogo | null }

const GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function corGrupo(pct: number | null): string {
  if (pct === null) return 'bg-gray-100 text-gray-400'
  if (pct === 0)    return 'bg-red-100 text-red-500'
  if (pct < 50)     return 'bg-yellow-100 text-yellow-700'
  if (pct < 80)     return 'bg-green-100 text-green-700'
  return 'bg-green-300 text-green-900'
}

interface Props {
  palpites: PalpiteComJogo[]
  selecaoFavorita: string | null
}

export default function EstatisticasPerfil({ palpites, selecaoFavorita }: Props) {
  const encerrados = palpites
    .filter(p => p.jogo?.status === 'encerrado')
    .sort((a, b) => new Date(a.jogo!.data_hora).getTime() - new Date(b.jogo!.data_hora).getTime())

  // ── Streak ────────────────────────────────────────────────────────────
  let streakAtual = 0
  let melhorStreak = 0
  let temp = 0
  for (const p of encerrados) {
    if (p.pontos > 0) {
      temp++
      if (temp > melhorStreak) melhorStreak = temp
    } else {
      temp = 0
    }
  }
  streakAtual = temp

  // ── Média de gols apostados ───────────────────────────────────────────
  const mediaGols = palpites.length > 0
    ? ((palpites.reduce((s, p) => s + p.gols_a + p.gols_b, 0) / palpites.length)).toFixed(1)
    : null

  // ── % apostou na vitória do favorito ─────────────────────────────────
  let pctFavorito: number | null = null
  if (selecaoFavorita) {
    const comFavorito = palpites.filter(
      p => p.jogo && (p.jogo.time_a === selecaoFavorita || p.jogo.time_b === selecaoFavorita)
    )
    if (comFavorito.length > 0) {
      const apostouVitoria = comFavorito.filter(p => {
        if (!p.jogo) return false
        return p.jogo.time_a === selecaoFavorita
          ? p.gols_a > p.gols_b
          : p.gols_b > p.gols_a
      }).length
      pctFavorito = Math.round((apostouVitoria / comFavorito.length) * 100)
    }
  }

  // ── Mapa de calor por grupo ───────────────────────────────────────────
  const heatmap = GRUPOS.map(grupo => {
    const jogosGrupo = encerrados.filter(p => p.jogo?.grupo === grupo)
    if (jogosGrupo.length === 0) return { grupo, pct: null }
    const acertos = jogosGrupo.filter(p => p.pontos > 0).length
    return { grupo, pct: Math.round((acertos / jogosGrupo.length) * 100) }
  })

  const temDados = encerrados.length > 0 || palpites.length > 0

  if (!temDados) return null

  return (
    <section>
      <h2 className="text-[#002776] font-black text-base mb-3">Estatísticas</h2>

      {/* Linha 1: streak + média de gols */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="font-black text-2xl tabular-nums text-[#009C3B]">{streakAtual}</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Sequência atual</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="font-black text-2xl tabular-nums text-[#002776]">{melhorStreak}</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Melhor sequência</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="font-black text-2xl tabular-nums text-[#002776]">
            {mediaGols ?? '—'}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Gols/jogo</p>
        </div>
      </div>

      {/* Linha 2: % torce pelo favorito */}
      {selecaoFavorita && pctFavorito !== null && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-500 font-semibold">
            Apostou na vitória de{' '}
            <span className="text-[#002776] font-black">{selecaoFavorita}</span>
          </p>
          <span className="font-black text-[#009C3B] text-lg tabular-nums">{pctFavorito}%</span>
        </div>
      )}

      {/* Mapa de calor por grupo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs text-gray-400 font-semibold mb-3">Acerto por grupo</p>
        <div className="grid grid-cols-6 gap-1.5">
          {heatmap.map(({ grupo, pct }) => (
            <div
              key={grupo}
              className={`rounded-xl py-2 flex flex-col items-center gap-0.5 ${corGrupo(pct)}`}
            >
              <span className="font-black text-xs">{grupo}</span>
              <span className="font-bold text-[10px]">{pct !== null ? `${pct}%` : '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
