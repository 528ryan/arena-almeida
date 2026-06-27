'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { verificarENotificarRanking } from '@/lib/notifications'
import { calcularClassificacao } from '@/lib/classificacao'
import type { Jogo } from '@/types'

// ─── Auto-resolução de slots ────────────────────────────────────────────────
// Reconhece qualquer variante razoável de slot de classificado:
//   "1A"  "1 A"  "1ºA"  "1º A"  "1°A"  "1° A"
//   "1º Grupo A"  "1° Grupo A"  "1o Grupo A"
function matchSlot(nome: string, posicao: 1 | 2, grupo: string): boolean {
  const re = new RegExp(
    `^${posicao}\\s*[º°o]?\\s*(Grupo\\s*)?${grupo}$`,
    'i'
  )
  return re.test(nome.trim())
}

async function _resolverSlots(adminClient: ReturnType<typeof createAdminClient>) {
  const { data } = await adminClient.from('jogos').select('*')
  if (!data) return

  const jogos = data as Jogo[]
  const grupoJogos    = jogos.filter(j => j.grupo)
  const knockoutJogos = jogos.filter(j => !j.grupo)

  const grupos = [...new Set(grupoJogos.map(j => j.grupo!))]

  for (const grupo of grupos) {
    const jogosGrupo = grupoJogos.filter(j => j.grupo === grupo)
    if (!jogosGrupo.every(j => j.status === 'encerrado')) continue

    const classificacao = calcularClassificacao(jogosGrupo)
    const primeiro = classificacao[0]?.nome
    const segundo  = classificacao[1]?.nome

    const atualizacoes = knockoutJogos.flatMap(jogo => {
      const updates: Record<string, string> = {}
      if (matchSlot(jogo.time_a, 1, grupo) && primeiro) updates.time_a = primeiro
      if (matchSlot(jogo.time_a, 2, grupo) && segundo)  updates.time_a = segundo
      if (matchSlot(jogo.time_b, 1, grupo) && primeiro) updates.time_b = primeiro
      if (matchSlot(jogo.time_b, 2, grupo) && segundo)  updates.time_b = segundo
      return Object.keys(updates).length > 0 ? [{ id: jogo.id, updates }] : []
    })

    await Promise.all(
      atualizacoes.map(({ id, updates }) =>
        adminClient.from('jogos').update(updates).eq('id', id)
      )
    )
  }
}

export async function resolverSlots() {
  await assertAdmin()
  const adminClient = createAdminClient()
  await _resolverSlots(adminClient)
  revalidateAll()
}

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data } = await supabase
    .from('perfis').select('is_admin').eq('id', user.id).single()
  if (!data?.is_admin) throw new Error('Acesso negado')
  return supabase
}

function revalidateAll() {
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/mata-mata')
  revalidatePath('/ranking')
}

export async function fecharJogo(jogoId: number, placar_a: number, placar_b: number) {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ placar_a, placar_b, status: 'encerrado' })
    .eq('id', jogoId)
  if (error) throw error
  // Tenta auto-resolver slots do mata-mata baseado em grupos completos
  await _resolverSlots(adminClient)
  revalidateAll()
  verificarENotificarRanking().catch(() => {})
}

export async function reabrirJogo(jogoId: number) {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ placar_a: null, placar_b: null, status: 'pendente' })
    .eq('id', jogoId)
  if (error) throw error
  revalidateAll()
}

export async function atualizarTimes(jogoId: number, time_a: string, time_b: string) {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ time_a, time_b })
    .eq('id', jogoId)
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/mata-mata')
}

export async function destravartodosPalpites() {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ prazo_edicao: null })
    .neq('status', 'encerrado')
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function travarTodosPalpites() {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('jogos')
    .update({ prazo_edicao: new Date().toISOString() })
    .neq('status', 'encerrado')
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/')
}

// ─── Recalcular pontos dos palpites ────────────────────────────────────────
function calcPontos(
  gols_a: number, gols_b: number,
  placar_a: number, placar_b: number,
): number {
  if (gols_a === placar_a && gols_b === placar_b) return 3
  const resP = gols_a > gols_b ? 1 : gols_a < gols_b ? -1 : 0
  const resJ = placar_a > placar_b ? 1 : placar_a < placar_b ? -1 : 0
  return resP === resJ ? 1 : 0
}

export async function recalcularPontosMataMatata() {
  await assertAdmin()
  const adminClient = createAdminClient()

  // 1. Busca todos os jogos de mata-mata encerrados com placar definido
  const { data: jogosData } = await adminClient
    .from('jogos')
    .select('id, placar_a, placar_b')
    .is('grupo', null)
    .eq('status', 'encerrado')
    .not('placar_a', 'is', null)

  if (!jogosData || jogosData.length === 0) return { atualizados: 0 }

  const jogoIds = jogosData.map(j => j.id)
  const placarPorJogo = Object.fromEntries(
    jogosData.map(j => [j.id, { placar_a: j.placar_a as number, placar_b: j.placar_b as number }])
  )

  // 2. Busca todos os palpites desses jogos
  const { data: palpitesData } = await adminClient
    .from('palpites')
    .select('id, user_id, jogo_id, gols_a, gols_b')
    .in('jogo_id', jogoIds)

  if (!palpitesData || palpitesData.length === 0) return { atualizados: 0 }

  // 3. Atualiza pontos de cada palpite
  const updates = palpitesData.map(p => {
    const jogo = placarPorJogo[p.jogo_id]
    const pontos = calcPontos(p.gols_a, p.gols_b, jogo.placar_a, jogo.placar_b)
    return { id: p.id, pontos }
  })

  await Promise.all(
    updates.map(u =>
      adminClient.from('palpites').update({ pontos: u.pontos }).eq('id', u.id)
    )
  )

  // 4. Recalcula pontos totais de cada usuário a partir de TODOS os palpites
  const { data: todosPalpites } = await adminClient
    .from('palpites')
    .select('user_id, pontos')

  const totalPorUser: Record<string, number> = {}
  for (const p of todosPalpites ?? []) {
    totalPorUser[p.user_id] = (totalPorUser[p.user_id] ?? 0) + (p.pontos ?? 0)
  }

  await Promise.all(
    Object.entries(totalPorUser).map(([userId, total]) =>
      adminClient.from('perfis').update({ pontos: total }).eq('id', userId)
    )
  )

  revalidateAll()
  return { atualizados: updates.length }
}

export async function atualizarPago(userId: string, pago: boolean) {
  await assertAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('perfis')
    .update({ pago })
    .eq('id', userId)
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/ranking')
}
